#!/usr/bin/env python3
"""One cloud refresh/build. No scheduler, Git push, or Pages configuration changes."""
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sys
import time
import uuid

REPO = Path(__file__).resolve().parent.parent
ROOT = Path(os.environ.get("BNUZ_FEED_RUNTIME_DIR", str(REPO.parent / "bnuz-runtime"))).resolve()
DATA = ["apps/web/public/data/feed-snapshot.json", "apps/web/public/data/source-health.json"]
spec = importlib.util.spec_from_file_location("cloud_helpers", REPO / "scripts/cloud-feed-scheduler.py")
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=int, default=840)
    parser.add_argument("--build-only", action="store_true", help="Validate/build existing data; do not label it refreshed")
    args = parser.parse_args()
    if not 1 <= args.timeout <= 840:
        parser.error("--timeout must be 1..840")
    os.umask(0o077)
    if ROOT.is_relative_to(REPO) or REPO.is_relative_to(ROOT):
        parser.error("Runtime directory must be outside the source checkout")
    ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    if ROOT.stat().st_uid != os.getuid():
        parser.error("Runtime directory is owned by another user")
    if (ROOT / "HALTED.json").exists():
        raise SystemExit("Prior explicit refusal requires manual review: " + str(ROOT / "HALTED.json"))
    try:
        with helpers.lock(ROOT / "refresh.lock"):
            return run(args)
    except helpers.Busy:
        print(json.dumps({"result": "skipped_busy"}))
        return 0


def run(args):
    run_id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8]
    out = ROOT / "runs" / run_id
    out.mkdir(parents=True)
    result = {"runId": run_id, "startedAt": helpers.stamp(), "result": "running", "published": False,
              "repo": str(REPO), "runDir": str(out), "refreshRequested": not args.build_only}
    helpers.write_json(ROOT / "status.json", result)
    try:
        env = helpers.refresh_environment("/usr/bin/chromium")
        env["npm_config_cache"] = str(ROOT / "npm-cache")
        env["VITE_BASE_PATH"] = "/BNUZ-Feed-V2/"
        # Explicit source-scoped blocks are not global HALTED states. Never derive
        # these IDs from a generic timeout, HTTP error, or untrusted source content.
        blocked = helpers.read_json(ROOT / "source-authorization-blocks.json", [])
        if not isinstance(blocked, list) or any(not isinstance(value, str) for value in blocked):
            raise helpers.Failed("Source authorization blocks must be a JSON array of source IDs")
        env["BNUZ_FEED_AUTHORIZATION_SKIP_IDS"] = json.dumps(blocked)
        result["authorizationSkippedSourceIds"] = blocked
        with open(out / "refresh.log", "w", encoding="utf8") as log:
            command = helpers.Commands(env, log, time.monotonic() + args.timeout)
            changed = command.run(["git", "diff", "HEAD", "--name-only"], REPO).splitlines()
            untracked = command.run(["git", "ls-files", "--others", "--exclude-standard"], REPO).splitlines()
            if set(changed) - set(DATA) or untracked:
                raise helpers.Failed("Unexpected checkout edits; no files restored", fatal=True)
            # This checkout is task-owned. Prior output remains in its immutable run directory.
            if changed:
                command.run(["git", "restore", "--source=HEAD", "--staged", "--worktree", "--", *DATA], REPO)
            command.run(["git", "fetch", "origin", "main"], REPO)
            command.run(["git", "merge", "--ff-only", "origin/main"], REPO)
            result["sourceCommit"] = command.run(["git", "rev-parse", "HEAD"], REPO).strip()
            version = command.run(["node", "--version"], REPO).strip()
            key = hashlib.sha256((REPO / "package-lock.json").read_bytes()).hexdigest() + ":" + version
            marker = helpers.read_json(ROOT / "dependencies.json", {})
            if marker.get("key") != key or not (REPO / "node_modules/.bin/tsx").exists():
                command.run(["npm", "ci", "--no-audit", "--no-fund", "--fetch-retries=0"], REPO)
                command.run(["git", "diff", "--exit-code", "--", "package-lock.json"], REPO)
                helpers.write_json(ROOT / "dependencies.json", {"key": key})
            checked = helpers.read_json(ROOT / "validation.json", {})
            if checked.get("sourceCommit") != result["sourceCommit"] or checked.get("dependencyKey") != key:
                for argv in [["npm", "run", "licenses:check"], ["npm", "run", "check"], ["npm", "test", "--", "--maxWorkers=2"], [sys.executable, "-m", "unittest", "discover", "-s", "scripts", "-p", "test_cloud_feed*.py"]]:
                    command.run(argv, REPO)
                helpers.write_json(ROOT / "validation.json", {"sourceCommit": result["sourceCommit"], "dependencyKey": key})
            command.run(["node", "--import", "tsx", "scripts/prepare-publish-snapshot.ts"], REPO)
            shutil.copyfile(REPO / DATA[0], out / "baseline.json")
            if not args.build_only:
                command.run(["node", "--import", "tsx", "scripts/generate-snapshot.ts"], REPO)
            command.run(["node", "scripts/check-snapshot-health.cjs"], REPO)
            proof = command.run(["node", "--import", "tsx", "scripts/check-cloud-snapshot.ts", out / "baseline.json"], REPO)
            result["snapshot"] = json.loads(proof.splitlines()[-1])
            command.run(["npm", "run", "build"], REPO)
            remote = command.run(["git", "ls-remote", "origin", "refs/heads/main"], REPO).split()[0]
            if remote != result["sourceCommit"]:
                raise helpers.Failed("Source changed during refresh; candidate not ready for publication")
            shutil.copytree(REPO / "apps/web/dist", out / "dist")
            (out / "dist/.nojekyll").touch()
            for path in DATA:
                shutil.copyfile(REPO / path, out / Path(path).name)
            result["files"] = [{"path": str(p.relative_to(out / "dist")), "bytes": p.stat().st_size,
                                "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
                               for p in sorted((out / "dist").rglob("*")) if p.is_file()]
            result["artifactBytes"] = sum(f["bytes"] for f in result["files"])
            result["result"] = "ready_refreshed" if not args.build_only else "ready_existing_snapshot"
    except Exception as error:
        result["result"] = "halted" if isinstance(error, helpers.Failed) and error.fatal else "failed"
        result["error"] = helpers.Redactor(os.environ).clean(str(error))
        if result["result"] == "halted":
            helpers.write_json(ROOT / "HALTED.json", result)
    result["endedAt"] = helpers.stamp()
    if result["result"].startswith("ready_"):
        helpers.write_json(ROOT / "latest-ready.json", result)
    helpers.write_json(out / "result.json", result)
    helpers.write_json(ROOT / "status.json", result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["result"].startswith("ready_") else 1


if __name__ == "__main__":
    sys.exit(main())

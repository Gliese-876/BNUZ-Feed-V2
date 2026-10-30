"""Isolated one-shot runner checks; no network, Git mutation, or actual build."""
import argparse
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "cloud_feed_refresh_once", Path(__file__).with_name("cloud-feed-refresh-once.py"))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class RefreshOnceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "runtime"
        self.repo = Path(self.temp.name) / "repo"
        self.root.mkdir()
        self.repo.mkdir()
        for relative in runner.DATA:
            path = self.repo / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("{}\n")
        (self.repo / "package-lock.json").write_text("{}\n")
        dist = self.repo / "apps/web/dist"
        dist.mkdir()
        (dist / "index.html").write_text("<h1>Feed</h1>\n")
        self.calls = []
        self.changed = ""
        self.untracked = ""
        self.remote = "abc123"
        self.failure = None
        self.proof = {"updatedAt": "2026-10-29T03:00:00Z", "live": 45, "retained": [], "items": 123}
        case = self

        class FakeCommands:
            def __init__(self, env, log, deadline):
                case.env = env

            def run(self, argv, cwd):
                args = [str(arg) for arg in argv]
                case.calls.append(args)
                if case.failure and case.failure[0] in args:
                    raise case.failure[1]
                if args == ["git", "diff", "HEAD", "--name-only"]:
                    return case.changed
                if args == ["git", "ls-files", "--others", "--exclude-standard"]:
                    return case.untracked
                if args == ["git", "rev-parse", "HEAD"]:
                    return "abc123\n"
                if args == ["node", "--version"]:
                    return "v24.22.1\n"
                if "scripts/check-cloud-snapshot.ts" in args:
                    return json.dumps(case.proof)
                if args == ["git", "ls-remote", "origin", "refs/heads/main"]:
                    return case.remote + "\trefs/heads/main\n"
                return ""

        for target, value in [("ROOT", self.root), ("REPO", self.repo)]:
            patcher = patch.object(runner, target, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        commands = patch.object(runner.helpers, "Commands", FakeCommands)
        commands.start()
        self.addCleanup(commands.stop)
        stdout = patch("sys.stdout", new_callable=io.StringIO)
        stdout.start()
        self.addCleanup(stdout.stop)

    def run_once(self, build_only=False):
        code = runner.run(argparse.Namespace(timeout=30, build_only=build_only))
        return code, json.loads((self.root / "status.json").read_text())

    def assert_no_publication(self):
        self.assertFalse(any("push" in args or "commit" in args for args in self.calls))

    def test_success_builds_manifest_without_publishing(self):
        code, result = self.run_once()
        self.assertEqual(code, 0)
        self.assertEqual(result["result"], "ready_refreshed")
        self.assertFalse(result["published"])
        self.assertTrue(result["refreshRequested"])
        self.assertIsNotNone(result["endedAt"])
        self.assertEqual(result, json.loads((self.root / "latest-ready.json").read_text()))
        paths = {item["path"]: item for item in result["files"]}
        self.assertEqual(set(paths), {".nojekyll", "index.html"})
        raw = (self.repo / "apps/web/dist/index.html").read_bytes()
        self.assertEqual(paths["index.html"]["sha256"], hashlib.sha256(raw).hexdigest())
        self.assertEqual(result["artifactBytes"], len(raw))
        self.assertEqual(self.env["BNUZ_FEED_SNAPSHOT_PUBLIC_ONLY"], "true")
        self.assertEqual(self.env["VITE_BASE_PATH"], "/BNUZ-Feed-V2/")
        self.assert_no_publication()

    def test_authorization_blocks_are_explicit_and_propagated(self):
        blocked = ["70981c669ee748c4ba5dcd4022a42f58"]
        (self.root / "source-authorization-blocks.json").write_text(json.dumps(blocked))
        code, result = self.run_once()
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(self.env["BNUZ_FEED_AUTHORIZATION_SKIP_IDS"]), blocked)
        self.assertEqual(result["authorizationSkippedSourceIds"], blocked)
        self.assertFalse((self.root / "HALTED.json").exists())

    def test_malformed_authorization_policy_fails_before_commands(self):
        for raw in ["{", "{}", "[123]"]:
            (self.root / "source-authorization-blocks.json").write_text(raw)
            self.calls.clear()
            code, result = self.run_once()
            self.assertEqual(code, 1)
            self.assertEqual(result["result"], "failed")
            self.assertEqual(self.calls, [])

    def test_build_only_is_not_a_refreshed_candidate(self):
        code, result = self.run_once(build_only=True)
        self.assertEqual(code, 0)
        self.assertEqual(result["result"], "ready_existing_snapshot")
        self.assertFalse(result["refreshRequested"])
        self.assertFalse(any("scripts/generate-snapshot.ts" in args for args in self.calls))
        self.assert_no_publication()

    def test_failed_refresh_does_not_replace_last_ready(self):
        old = {"result": "ready_refreshed", "runId": "previous"}
        (self.root / "latest-ready.json").write_text(json.dumps(old))
        self.failure = ("scripts/generate-snapshot.ts", runner.helpers.Failed("source timeout"))
        code, result = self.run_once()
        self.assertEqual(code, 1)
        self.assertEqual(result["result"], "failed")
        self.assertFalse((self.root / "HALTED.json").exists())
        self.assertEqual(old, json.loads((self.root / "latest-ready.json").read_text()))
        self.assertNotIn(["npm", "run", "build"], self.calls)
        self.assert_no_publication()

    def test_unexpected_edits_halt_without_restore_or_fetch(self):
        for kind in ("changed", "untracked"):
            with self.subTest(kind=kind):
                self.changed = self.untracked = ""
                setattr(self, kind, "user-notes.txt\n")
                self.calls.clear()
                code, result = self.run_once()
                self.assertEqual(code, 1)
                self.assertEqual(result["result"], "halted")
                self.assertTrue((self.root / "HALTED.json").exists())
                self.assertFalse(any("restore" in args or "fetch" in args for args in self.calls))
                self.assertFalse((self.root / "latest-ready.json").exists())
        self.assert_no_publication()

    def test_only_known_generated_files_can_be_restored(self):
        self.changed = runner.DATA[0] + "\n"
        code, _ = self.run_once()
        self.assertEqual(code, 0)
        self.assertIn(["git", "restore", "--source=HEAD", "--staged", "--worktree", "--", *runner.DATA], self.calls)
        self.assert_no_publication()

    def test_remote_race_never_creates_ready_manifest(self):
        self.remote = "newer456"
        code, result = self.run_once()
        self.assertEqual(code, 1)
        self.assertEqual(result["result"], "failed")
        self.assertIn("Source changed", result["error"])
        self.assertFalse((self.root / "latest-ready.json").exists())
        self.assertFalse((Path(result["runDir"]) / "dist").exists())
        self.assert_no_publication()

    def test_explicit_refusal_halts_and_prevents_later_execution(self):
        self.failure = ("fetch", runner.helpers.Failed("Explicit access refusal", fatal=True))
        code, result = self.run_once()
        self.assertEqual(code, 1)
        self.assertEqual(result["result"], "halted")
        before = len(self.calls)
        with patch("sys.argv", ["refresh-once"]), patch.object(runner.os, "umask"), self.assertRaises(SystemExit):
            runner.main()
        self.assertEqual(len(self.calls), before)
        self.assert_no_publication()

    def test_busy_lock_skips_without_running_commands(self):
        with runner.helpers.lock(self.root / "refresh.lock"):
            with patch("sys.argv", ["refresh-once"]), patch.object(runner.os, "umask"):
                self.assertEqual(runner.main(), 0)
        self.assertEqual(self.calls, [])
        self.assertFalse((self.root / "status.json").exists())


if __name__ == "__main__":
    unittest.main()

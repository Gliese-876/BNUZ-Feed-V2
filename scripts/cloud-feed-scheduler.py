#!/usr/bin/env python3
"""Experimental in-VM command scheduler. No model calls or VM lifecycle control."""

import argparse
import codecs
import contextlib
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import selectors
import shutil
import signal
import subprocess
import sys
import threading
import time
import urllib.request
import uuid
from zoneinfo import ZoneInfo

BEIJING = ZoneInfo("Asia/Shanghai")
UTC = dt.timezone.utc
REMOTE = "https://github.com/Gliese-876/BNUZ-Feed-V2.git"
PUBLISHED = "https://gliese-876.github.io/BNUZ-Feed-V2/"
DATA = ["apps/web/public/data/feed-snapshot.json", "apps/web/public/data/source-health.json"]
SCRIPT = Path(__file__).resolve()
DEFAULT_RUNTIME = Path("/workspace/work/bnuz-feed-scheduler")
STOP = threading.Event()


def utc_now():
    return dt.datetime.now(UTC)


def stamp():
    return utc_now().isoformat()


def next_slot(now):
    """Strictly future 06:00..22:00 quarter-hour slot; never return backlog."""
    local = now.astimezone(BEIJING)
    for days in range(2):
        day = local.date() + dt.timedelta(days=days)
        for minute in range(6 * 60, 22 * 60 + 1, 15):
            candidate = dt.datetime.combine(day, dt.time(minute // 60, minute % 60), BEIJING)
            if candidate > local:
                return candidate
    raise AssertionError("No next slot")


def slot_is_due(target, now):
    # Resuming a suspended machine must not replay missed slots.
    return 0 <= (now - target).total_seconds() <= 60


class Busy(Exception):
    pass


class Stopped(Exception):
    pass


class Failed(Exception):
    def __init__(self, message, fatal=False):
        super().__init__(message)
        self.fatal = fatal


@contextlib.contextmanager
def lock(path):
    with open(path, "a", encoding="utf8") as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise Busy(str(path)) from error
        try:
            yield
        finally:
            fcntl.flock(handle, fcntl.LOCK_UN)


def write_json(path, value):
    temporary = path.with_name(path.name + ".tmp-" + str(os.getpid()))
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def read_json(path, default=None):
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        return default


class Redactor:
    def __init__(self, env):
        # Only used in memory to remove inherited credentials from command output.
        self.secrets = [value for name, value in env.items() if len(value) >= 4 and
                        re.search(r"TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|API_KEY", name, re.I)]

    def clean(self, text):
        for value in self.secrets:
            text = text.replace(value, "[REDACTED]")
        text = re.sub(r"(?im)\b((?:proxy-)?authorization)\s*[:=].*$", r"\1: [REDACTED]", text)
        text = re.sub(r"(https?://)[^\s/@]+(?::[^\s/@]*)?@", r"\1[REDACTED]@", text)
        text = re.sub(r"\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b", "[REDACTED]", text)
        return text


def access_denied(text):
    return bool(re.search(
        r"authentication failed|could not read (?:username|password)|permission.{0,100}denied|"
        r"\bGH00[136]\b|\bGH013\b|protected branch|policy[_ -]denied|"
        r"blocked by (?:the |a )?(?:administrator|network|policy)|"
        r"(?:quota|rate limit|usage limit|billing limit).{0,50}(?:exceeded|reached|exhausted)|"
        r"HTTP(?:[ /_-]+(?:error[ :_-]*)?)?(?:401|402|403|429)\b|"
        r"(?:401 unauthorized|403 forbidden|429 too many requests)|"
        r"returned error: (?:401|402|403|429)\b|\bE(?:401|402|403|429)\b|"
        r"(?:credential|token).{0,40}(?:expired|revoked|invalid)|"
        r"(?:proxy|network policy).{0,60}(?:denied|forbidden|blocked)", text, re.I))


def process_identity(pid):
    try:
        proc = Path("/proc") / str(pid)
        stat = (proc / "stat").read_text().rsplit(")", 1)[1].split()
        if stat[0] == "Z":
            return None
        return {"startTicks": stat[19], "uid": proc.stat().st_uid,
                "argv": (proc / "cmdline").read_bytes().decode().split("\0")[:-1]}
    except (OSError, ValueError, IndexError):
        return None


def owned_process(state, root):
    identity = process_identity(state.get("pid", 0)) if state else None
    if not identity:
        return False
    argv = identity["argv"]
    pairs = dict(zip(argv, argv[1:]))
    return (identity["uid"] == os.getuid() and identity["startTicks"] == state.get("startTicks") and
            len(argv) >= 2 and argv[1] == state.get("script") and
            "serve" in argv and pairs.get("--runtime-dir") == str(root) and
            pairs.get("--instance-id") == state.get("instanceId"))


class Commands:
    def __init__(self, env, log, deadline, stop=STOP):
        self.env, self.log, self.deadline, self.stop = env, log, deadline, stop
        self.redactor = Redactor(env)

    def emit(self, text):
        self.log.write(self.redactor.clean(text) + "\n")
        self.log.flush()

    @staticmethod
    def terminate(process):
        # Every command starts in its own session; only its owned children are signalled.
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()

    def run(self, argv, cwd):
        if self.stop.is_set():
            raise Stopped()
        if time.monotonic() >= self.deadline:
            raise Failed("Round timeout")
        self.emit(f"[{stamp()}] $ " + " ".join(map(str, argv)))
        process = subprocess.Popen(list(map(str, argv)), cwd=cwd, env=self.env,
                                   stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT, start_new_session=True)
        selector = selectors.DefaultSelector()
        selector.register(process.stdout, selectors.EVENT_READ)
        decoder = codecs.getincrementaldecoder("utf8")("replace")
        pending, output = "", []

        def line(text):
            safe = self.redactor.clean(text)
            output.append(safe)
            self.emit(safe)
            if access_denied(safe):
                raise Failed("Explicit access/policy/quota refusal; scheduler halted", fatal=True)

        try:
            while selector.get_map():
                if self.stop.is_set():
                    raise Stopped()
                if time.monotonic() >= self.deadline:
                    raise Failed("Round timeout")
                for key, _ in selector.select(timeout=0.5):
                    chunk = os.read(key.fd, 65536)
                    if chunk:
                        pending += decoder.decode(chunk)
                        while "\n" in pending:
                            complete, pending = pending.split("\n", 1)
                            line(complete)
                    else:
                        pending += decoder.decode(b"", final=True)
                        if pending:
                            line(pending)
                        selector.unregister(key.fileobj)
            while process.poll() is None:
                if self.stop.is_set():
                    raise Stopped()
                if time.monotonic() >= self.deadline:
                    raise Failed("Round timeout")
                self.stop.wait(0.1)
            code = process.returncode
            self.emit(f"[{stamp()}] exit={code}")
            if code:
                raise Failed(f"Command failed (exit {code}): {argv[0]}")
            return "\n".join(output)
        except BaseException:
            self.terminate(process)
            raise
        finally:
            selector.close()
            process.stdout.close()


def published_metadata(deadline):
    url = PUBLISHED + "data/feed-snapshot.json?cloud-script-check=" + str(time.time_ns())
    timeout = min(15, deadline - time.monotonic())
    if timeout <= 0:
        raise Failed("Round timeout")
    try:
        # urllib uses the inherited HTTPS proxy and CA trust; never disable verification.
        with urllib.request.urlopen(url, timeout=timeout) as response:
            raw = response.read()
    except Exception as error:
        message = Redactor(os.environ).clean(str(error))
        raise Failed("Published snapshot check failed: " + message, fatal=access_denied(message)) from error
    snapshot = json.loads(raw)
    return {"updatedAt": snapshot["updatedAt"], "sha256": hashlib.sha256(raw).hexdigest()}


def refresh_environment(browser):
    env = os.environ.copy()
    env.update({"NODE_USE_ENV_PROXY": "1", "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "1",
                "BNUZ_FEED_PUBLISHED_BASE_URL": PUBLISHED,
                "BNUZ_FEED_SNAPSHOT_PUBLIC_ONLY": "true",
                "BNUZ_FEED_SNAPSHOT_NODE_MAX_ATTEMPTS": "3",
                "BNUZ_FEED_SNAPSHOT_BROWSER_MAX_ATTEMPTS": "2",
                "BNUZ_FEED_SNAPSHOT_ROUND_LIMIT": "2",
                "BNUZ_FEED_SNAPSHOT_RETRY_DELAY_MS": "2000",
                "BNUZ_FEED_SNAPSHOT_TIMEOUT_MS": "10000",
                "BNUZ_FEED_SNAPSHOT_BROWSER_TIMEOUT_MS": "15000",
                "BNUZ_FEED_SNAPSHOT_BROWSER_HOSTS": "www.bnuzh.edu.cn,zhb.bnu.edu.cn",
                "BNUZ_FEED_SNAPSHOT_CONCURRENCY": "3",
                "BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY": "2",
                "BNUZ_FEED_SNAPSHOT_BROWSER_EXECUTABLE_PATH": browser})
    env.pop("BNUZ_FEED_SNAPSHOT_BROWSER_CHANNEL", None)
    return env


def prepare_checkout(root, config, commands):
    checkout = root / "checkout"
    marker = root / "checkout-owner.json"
    if not checkout.exists():
        commands.run(["git", "clone", "--no-hardlinks", config["source"], checkout], root)
        commands.run(["git", "remote", "set-url", "origin", REMOTE], checkout)
        write_json(marker, {"checkout": str(checkout), "runtimeId": config["runtimeId"]})
    if read_json(marker) != {"checkout": str(checkout), "runtimeId": config["runtimeId"]}:
        raise Failed("Checkout ownership marker mismatch; no cleanup attempted", fatal=True)
    changed = commands.run(["git", "diff", "HEAD", "--name-only"], checkout).splitlines()
    untracked = commands.run(["git", "ls-files", "--others", "--exclude-standard"], checkout).splitlines()
    if set(changed) - set(DATA) or untracked:
        raise Failed("Unexpected edits in dedicated checkout; manual review required", fatal=True)
    if changed:
        # Only discard generated data in our dedicated checkout, never user workspace edits.
        commands.run(["git", "restore", "--source=HEAD", "--staged", "--worktree", "--", *DATA], checkout)
    commands.run(["git", "fetch", "origin", "main"], checkout)
    commands.run(["git", "switch", "--detach", "origin/main"], checkout)
    base = commands.run(["git", "rev-parse", "HEAD"], checkout).strip()
    version = commands.run(["node", "--version"], checkout).strip()
    if not version.startswith("v24."):
        raise Failed("Node 24 is required", fatal=True)
    dependency_key = hashlib.sha256((checkout / "package-lock.json").read_bytes()).hexdigest() + ":" + version
    if (read_json(root / "dependencies.json", {}).get("key") != dependency_key or
            not (checkout / "node_modules/.bin/tsx").exists()):
        commands.run(["npm", "ci", "--registry=https://registry.npmjs.org", "--replace-registry-host=always",
                      "--fetch-retries=0", "--no-audit", "--no-fund", "--cache=" + str(root / "npm-cache")], checkout)
        commands.run(["git", "diff", "--exit-code", "--", "package-lock.json"], checkout)
        write_json(root / "dependencies.json", {"key": dependency_key, "installedAt": stamp()})
    return checkout, base


def publish_candidate(checkout, base, run_dir, commands, result):
    commands.run(["npm", "run", "snapshot:publish"], checkout)
    baseline = run_dir / "baseline.json"
    shutil.copyfile(checkout / DATA[0], baseline)
    commands.run(["npm", "run", "snapshot"], checkout)
    commands.run(["node", "scripts/check-snapshot-health.cjs"], checkout)
    verification = commands.run(["node", "--import", "tsx", "scripts/check-cloud-snapshot.ts", baseline], checkout)
    summary = json.loads(verification.splitlines()[-1])
    result.update(summary)
    for path in DATA:
        shutil.copyfile(checkout / path, run_dir / Path(path).name)
    changed = commands.run(["git", "diff", "--name-only", "HEAD"], checkout).splitlines()
    if set(changed) - set(DATA):
        raise Failed("Refusing to commit changes outside generated data", fatal=True)
    if not changed:
        return "unchanged"
    remote = commands.run(["git", "ls-remote", "origin", "refs/heads/main"], checkout).split()[0]
    if remote != base:
        return "superseded_remote"
    published = published_metadata(commands.deadline)
    write_json(run_dir / "published-before-push.json", published)
    parse = lambda value: dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parse(summary["updatedAt"]) <= parse(published["updatedAt"]):
        return "superseded_published"
    commands.run(["git", "add", "--", *DATA], checkout)
    staged = commands.run(["git", "diff", "--cached", "--name-only"], checkout).splitlines()
    if set(staged) - set(DATA) or not staged:
        raise Failed("Unexpected staged file set", fatal=True)
    commands.run(["git", "commit", "-m", "chore: refresh feed snapshot from cloud script"], checkout)
    result["commitSha"] = commands.run(["git", "rev-parse", "HEAD"], checkout).strip()
    # A concurrent main update causes a normal non-fast-forward rejection, never a force push.
    commands.run(["git", "push", "origin", "HEAD:refs/heads/main"], checkout)
    result["pushed"] = True
    return "success"


def run_round(root, config, state, save):
    result = {"startedAt": stamp(), "endedAt": None, "result": "running", "commitSha": None, "pushed": False}
    run_dir = root / "runs" / (utc_now().strftime("%Y%m%dT%H%M%S") + "-" + uuid.uuid4().hex[:8])
    run_dir.mkdir(parents=True)
    result["log"] = str(run_dir / "refresh.log")
    state["lastRound"] = result
    state["status"] = "running_round"
    state["nextBeijing"] = next_slot(utc_now()).isoformat()
    save()
    fatal = False
    try:
        with lock(root / "round.lock"), open(run_dir / "refresh.log", "a", encoding="utf8") as log:
            commands = Commands(refresh_environment(config["browserExecutable"]), log,
                                time.monotonic() + config["roundTimeoutSeconds"])
            if not Path(config["browserExecutable"]).is_file():
                raise Failed("Configured Chromium executable is unavailable", fatal=True)
            checkout, base = prepare_checkout(root, config, commands)
            result["baseSha"] = base
            result["result"] = publish_candidate(checkout, base, run_dir, commands, result)
    except Busy:
        result["result"] = "skipped_busy"
    except Stopped:
        result["result"] = "stopped"
    except Exception as error:
        fatal = isinstance(error, Failed) and error.fatal
        result["result"] = "halted" if fatal else "failed"
        result["error"] = Redactor(os.environ).clean(str(error))
        with open(run_dir / "refresh.log", "a", encoding="utf8") as log:
            log.write(f"[{stamp()}] {result['result']}: {result['error']}\n")
    result["endedAt"] = stamp()
    write_json(run_dir / "result.json", result)
    state["lastRound"] = result
    save()
    return fatal


def configure(root, source, browser, round_timeout):
    if round_timeout < 1 or round_timeout > 840:
        raise Failed("Round timeout must be 1..840 seconds", fatal=True)
    if not source.is_dir() or root.is_relative_to(source) or source.is_relative_to(root):
        raise Failed("Runtime directory must be outside the source checkout", fatal=True)
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    if root.stat().st_uid != os.getuid():
        raise Failed("Runtime directory belongs to another user", fatal=True)
    os.chmod(root, 0o700)
    desired = {"source": str(source), "browserExecutable": str(Path(browser).resolve()),
               "roundTimeoutSeconds": round_timeout, "remote": REMOTE}
    existing = read_json(root / "config.json")
    if existing:
        if any(existing.get(key) != value for key, value in desired.items()):
            raise Failed("Existing runtime config differs; stop and review before changing it", fatal=True)
        return existing
    if any(root.iterdir()):
        raise Failed("New runtime directory must be empty", fatal=True)
    desired["runtimeId"] = uuid.uuid4().hex
    write_json(root / "config.json", desired)
    return desired


def status(root):
    state = read_json(root / "status.json", {})
    state["processVerifiedAlive"] = owned_process(state, root)
    if not state["processVerifiedAlive"] and state.get("status") not in {None, "halted", "stopped"}:
        state["observedStatus"] = "not_running_or_replaced"
    return state


def start(root, config, immediate):
    with lock(root / "control.lock"):
        state = status(root)
        if state["processVerifiedAlive"]:
            return state
        if state.get("status") == "halted":
            raise Failed("Runtime halted after a refusal; review it before starting a new runtime", fatal=True)
        instance_id = uuid.uuid4().hex
        with open(root / "scheduler.log", "a", encoding="utf8") as log:
            child = subprocess.Popen([sys.executable, str(SCRIPT), "serve", "--runtime-dir", str(root),
                                      "--instance-id", instance_id, *(["--immediate"] if immediate else [])],
                                     stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT,
                                     start_new_session=True, close_fds=True)
        # Startup handshake only; no supervisor or restart loop.
        for _ in range(50):
            state = status(root)
            if state.get("instanceId") == instance_id and state["processVerifiedAlive"]:
                return state
            if child.poll() is not None:
                raise Failed("Scheduler exited during startup; inspect scheduler.log")
            time.sleep(0.1)
        raise Failed("Scheduler did not confirm startup; inspect status before retrying")


def serve(root, config, instance_id, immediate):
    signal.signal(signal.SIGTERM, lambda _number, _frame: STOP.set())
    signal.signal(signal.SIGINT, lambda _number, _frame: STOP.set())
    with lock(root / "scheduler.lock"):
        identity = process_identity(os.getpid())
        state = {"pid": os.getpid(), "startTicks": identity["startTicks"], "script": str(SCRIPT),
                 "instanceId": instance_id, "startedAt": stamp(), "status": "starting",
                 "nextBeijing": None, "lastRound": None, "runtimeDir": str(root),
                 "schedulerLog": str(root / "scheduler.log"), "roundTimeoutSeconds": config["roundTimeoutSeconds"]}
        def save():
            state["updatedAt"] = stamp()
            write_json(root / "status.json", state)
        save()
        halted = False
        try:
            if immediate:
                halted = run_round(root, config, state, save)
            while not STOP.is_set() and not halted:
                target = next_slot(utc_now())
                state.update(status="waiting", nextBeijing=target.isoformat())
                save()
                STOP.wait(max(0, (target - utc_now()).total_seconds()))
                if STOP.is_set():
                    break
                if not slot_is_due(target, utc_now()):
                    print(f"[{stamp()}] Missed slot skipped: {target.isoformat()}", flush=True)
                    continue
                halted = run_round(root, config, state, save)
        finally:
            state.update(status="halted" if halted else "stopped", nextBeijing=None, stoppedAt=stamp())
            save()


def stop(root):
    if not root.exists():
        return {"status": "not_running", "runtimeDir": str(root)}
    with lock(root / "control.lock"):
        state = status(root)
        if not state["processVerifiedAlive"]:
            return state
        if not hasattr(os, "pidfd_open") or not hasattr(signal, "pidfd_send_signal"):
            raise Failed("Safe pidfd stop is unavailable; no process was signalled", fatal=True)
        try:
            descriptor = os.pidfd_open(state["pid"])
        except ProcessLookupError:
            return status(root)
        try:
            if not owned_process(state, root):
                raise Failed("Process identity changed; no signal sent", fatal=True)
            signal.pidfd_send_signal(descriptor, signal.SIGTERM)
        finally:
            os.close(descriptor)
        for _ in range(100):
            if not owned_process(state, root):
                return status(root)
            time.sleep(0.1)
        return {**status(root), "stopRequested": True}


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["start", "serve", "status", "stop"])
    parser.add_argument("--runtime-dir", type=Path, default=DEFAULT_RUNTIME)
    parser.add_argument("--repo", type=Path, default=SCRIPT.parent.parent)
    parser.add_argument("--browser-executable", default="/usr/bin/chromium")
    parser.add_argument("--round-timeout", type=int, default=840)
    parser.add_argument("--immediate", action="store_true")
    parser.add_argument("--instance-id", help=argparse.SUPPRESS)
    args = parser.parse_args()
    root = args.runtime_dir.resolve()
    try:
        if args.command == "status":
            result = status(root)
        elif args.command == "stop":
            result = stop(root)
        elif args.command == "start":
            config = configure(root, args.repo.resolve(), args.browser_executable, args.round_timeout)
            result = start(root, config, args.immediate)
        else:
            config = read_json(root / "config.json")
            if not config or not args.instance_id:
                raise Failed("serve requires an existing configuration and instance ID", fatal=True)
            serve(root, config, args.instance_id, args.immediate)
            return
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (Failed, Busy) as error:
        print(Redactor(os.environ).clean(str(error)), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

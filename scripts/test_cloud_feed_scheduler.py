"""Run with: python3 -m unittest discover -s scripts -p 'test_cloud_feed_scheduler.py'."""

import datetime as dt
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("cloud_feed_scheduler", Path(__file__).with_name("cloud-feed-scheduler.py"))
scheduler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scheduler)


class ScheduleTests(unittest.TestCase):
    def test_boundaries_and_timezone(self):
        for instant, expected in [
            ("2026-10-19T05:59:59+08:00", "2026-10-19T06:00:00+08:00"),
            ("2026-10-19T06:00:00+08:00", "2026-10-19T06:15:00+08:00"),
            ("2026-10-19T21:59:59+08:00", "2026-10-19T22:00:00+08:00"),
            ("2026-10-19T22:00:00+08:00", "2026-10-20T06:00:00+08:00"),
            ("2026-12-31T23:59:00+08:00", "2027-01-01T06:00:00+08:00"),
            ("2026-10-18T22:00:00+00:00", "2026-10-19T06:15:00+08:00"),
        ]:
            with self.subTest(instant=instant):
                self.assertEqual(scheduler.next_slot(dt.datetime.fromisoformat(instant)).isoformat(), expected)

    def test_exactly_65_daily_slots_and_no_backlog(self):
        now = dt.datetime.fromisoformat("2026-10-19T05:59:59+08:00")
        slots = [scheduler.next_slot(now)]
        for _ in range(64):
            slots.append(scheduler.next_slot(slots[-1]))
        self.assertEqual(slots[-1].hour, 22)
        self.assertEqual(len(set(slots)), 65)
        target = slots[0]
        self.assertTrue(scheduler.slot_is_due(target, target + dt.timedelta(seconds=20)))
        self.assertFalse(scheduler.slot_is_due(target, target + dt.timedelta(minutes=90)))
        resumed = target + dt.timedelta(minutes=90, seconds=1)
        self.assertGreater(scheduler.next_slot(resumed), resumed)
        self.assertFalse(scheduler.slot_is_due(target, target - dt.timedelta(seconds=1)))

    def test_round_lock_rejects_competing_process(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "round.lock"
            with scheduler.lock(path):
                code = "import fcntl,sys; f=open(sys.argv[1],'a'); fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)"
                result = subprocess.run([sys.executable, "-c", code, str(path)], capture_output=True)
                self.assertNotEqual(result.returncode, 0)
            with scheduler.lock(path):
                pass

    def test_stale_or_unrelated_pid_is_never_owned(self):
        state = {"pid": os.getpid(), "startTicks": "wrong", "script": str(scheduler.SCRIPT), "instanceId": "test"}
        self.assertFalse(scheduler.owned_process(state, Path("/tmp/test-scheduler")))
        self.assertFalse(scheduler.owned_process({}, Path("/tmp/test-scheduler")))


class FailureTests(unittest.TestCase):
    def test_redaction_and_policy_refusals(self):
        redactor = scheduler.Redactor({"GH_TOKEN": "sensitive-test-token"})
        text = redactor.clean("sensitive-test-token\nProxy-Authorization: Basic secret\nhttps://user:password@host/path")
        for forbidden in ["sensitive-test-token", "Basic secret", "user:password"]:
            self.assertNotIn(forbidden, text)
        for refusal in ["HTTP Error 403: Forbidden", "npm ERR! E429", "quota exceeded",
                        "Authentication failed", "The requested URL returned error: 401", "policy_denied"]:
            self.assertTrue(scheduler.access_denied(refusal), refusal)
        self.assertFalse(scheduler.access_denied("fetch timeout; HTTP 502"))

    def test_public_source_policy_proof_survives_existing_redactor(self):
        ids = ["70981c669ee748c4ba5dcd4022a42f58"]
        env = os.environ.copy()
        env.update(BNUZ_FEED_SOURCE_SKIP_IDS=json.dumps(ids),
                   GH_TOKEN="sensitive-test-token", OTHER_AUTH="other-sensitive-value")
        log = io.StringIO()
        runner = scheduler.Commands(env, log, time.monotonic() + 5, threading.Event())
        code = ("import os,json; print(os.environ['GH_TOKEN']); "
                "print(os.environ['OTHER_AUTH']); "
                "print(json.dumps({'authorizationSkippedSourceIds': "
                "json.loads(os.environ['BNUZ_FEED_SOURCE_SKIP_IDS'])}))")
        output = runner.run([sys.executable, "-c", code], Path.cwd())
        self.assertEqual(json.loads(output.splitlines()[-1])["authorizationSkippedSourceIds"], ids)
        self.assertIn(json.dumps(ids), log.getvalue())
        for value in ["sensitive-test-token", "other-sensitive-value"]:
            self.assertNotIn(value, output)
            self.assertNotIn(value, log.getvalue())
        # Existing AUTH-name heuristics remain unchanged, even for ID arrays.
        policy = json.dumps(ids)
        self.assertEqual(scheduler.Redactor({"BNUZ_FEED_AUTHORIZATION_SKIP_IDS": policy}).clean(policy),
                         "[REDACTED]")

    def test_command_timeout_terminates_its_process(self):
        output = io.StringIO()
        runner = scheduler.Commands(os.environ.copy(), output, time.monotonic() + 0.15, threading.Event())
        before = time.monotonic()
        with self.assertRaisesRegex(scheduler.Failed, "timeout"):
            runner.run([sys.executable, "-c", "import time; time.sleep(20)"], Path.cwd())
        self.assertLess(time.monotonic() - before, 5)

    def test_explicit_refusal_stops_command_immediately(self):
        runner = scheduler.Commands(os.environ.copy(), io.StringIO(), time.monotonic() + 5, threading.Event())
        with self.assertRaises(scheduler.Failed) as caught:
            runner.run([sys.executable, "-u", "-c", "import time; print('HTTP 403'); time.sleep(20)"], Path.cwd())
        self.assertTrue(caught.exception.fatal)

    def test_failed_health_never_stages_or_pushes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for path in scheduler.DATA:
                (root / path).parent.mkdir(parents=True, exist_ok=True)
                (root / path).write_text("{}")
            calls = []
            class FakeCommands:
                def run(self, args, cwd):
                    calls.append(args)
                    if args == ["node", "scripts/check-snapshot-health.cjs"]:
                        raise scheduler.Failed("health failed")
                    return ""
            with self.assertRaises(scheduler.Failed):
                scheduler.publish_candidate(root, "old", root, FakeCommands(), {})
            self.assertFalse(any(call[:2] in [["git", "add"], ["git", "commit"], ["git", "push"]] for call in calls))

    def test_remote_race_preserves_candidate_without_push(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            checkout, run = root / "checkout", root / "round"
            run.mkdir()
            for path in scheduler.DATA:
                (checkout / path).parent.mkdir(parents=True, exist_ok=True)
                (checkout / path).write_text("{}")
            calls = []
            class FakeCommands:
                def run(self, args, cwd):
                    calls.append(args)
                    if args[:3] == ["node", "--import", "tsx"]:
                        return json.dumps({"updatedAt": "2026-10-19T00:00:00Z"})
                    if args[:2] == ["git", "diff"]:
                        return scheduler.DATA[0]
                    if args[:2] == ["git", "ls-remote"]:
                        return "new-sha\trefs/heads/main"
                    return ""
            result = scheduler.publish_candidate(checkout, "old-sha", run, FakeCommands(), {})
            self.assertEqual(result, "superseded_remote")
            self.assertFalse(any(call[:2] == ["git", "push"] for call in calls))
            self.assertTrue((run / "feed-snapshot.json").is_file())

    def test_first_checkout_is_isolated_and_reuses_only_own_install_marker(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = {"source": str(root / "source"), "runtimeId": "owned"}
            calls = []
            class FakeCommands:
                def run(self, args, cwd):
                    calls.append(args)
                    if args[:2] == ["git", "clone"]:
                        checkout = Path(args[-1])
                        checkout.mkdir()
                        (checkout / "package-lock.json").write_text("{\"lockfileVersion\":3}")
                    if args == ["node", "--version"]:
                        return "v24.19.0"
                    if args[:2] == ["git", "rev-parse"]:
                        return "base-sha"
                    if args[:2] == ["npm", "ci"]:
                        (root / "checkout/node_modules/.bin").mkdir(parents=True, exist_ok=True)
                        (root / "checkout/node_modules/.bin/tsx").touch()
                    return ""
            commands = FakeCommands()
            scheduler.prepare_checkout(root, config, commands)
            self.assertEqual(sum(call[:2] == ["npm", "ci"] for call in calls), 1)
            scheduler.prepare_checkout(root, config, commands)
            self.assertEqual(sum(call[:2] == ["npm", "ci"] for call in calls), 1)
            (root / "checkout/package-lock.json").write_text("changed lock")
            scheduler.prepare_checkout(root, config, commands)
            self.assertEqual(sum(call[:2] == ["npm", "ci"] for call in calls), 2)

    def test_stopping_an_unrelated_pid_is_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scheduler.write_json(root / "status.json", {"pid": os.getpid(), "startTicks": "stale", "status": "waiting"})
            with patch.object(scheduler.signal, "pidfd_send_signal") as send:
                scheduler.stop(root)
                scheduler.stop(root)
                send.assert_not_called()

    def test_start_and_stop_are_idempotent_with_real_background_process(self):
        # Do not let this lifecycle test reach a real scheduled refresh.
        if (scheduler.next_slot(scheduler.utc_now()) - scheduler.utc_now()).total_seconds() < 10:
            self.skipTest("Too close to an actual schedule boundary")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "runtime"
            source = Path(__file__).resolve().parent.parent
            args = [sys.executable, str(scheduler.SCRIPT)]
            base = ["--runtime-dir", str(root), "--repo", str(source)]
            def command(name):
                result = subprocess.run(args + [name] + base, capture_output=True, text=True, timeout=15)
                self.assertEqual(result.returncode, 0, result.stderr)
                return json.loads(result.stdout)
            try:
                first = command("start")
                second = command("start")
                self.assertTrue(first["processVerifiedAlive"])
                self.assertEqual(first["pid"], second["pid"])
                self.assertTrue(command("status")["processVerifiedAlive"])
                self.assertFalse(command("stop")["processVerifiedAlive"])
                self.assertFalse(command("stop")["processVerifiedAlive"])
            finally:
                command("stop")


if __name__ == "__main__":
    unittest.main()

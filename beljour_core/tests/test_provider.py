import asyncio
import tempfile
import unittest
from pathlib import Path

import httpx

from plumb_api.demo.synthetic import SyntheticYouCam
from plumb_api.errors import PlumbError
from plumb_api.ledger import AMBIGUOUS, CREATED, FAILED, SUCCEEDED, TaskLedger
from plumb_api.providers.replay import Interaction, task_interactions
from plumb_api.providers.youcam import (
    LEGACY,
    STYLING,
    CheckCreditHistory,
    OutOfScope,
    TaskError,
    TaskPending,
    YouCamProvider,
    scope_of,
)
from tests.replay_helpers import RESULT, cassette, job, makeup_task, provider_for, settings


class ScopeTest(unittest.TestCase):
    def test_scope_follows_decisions(self):
        self.assertEqual(scope_of("makeup-vto"), "styling")
        self.assertEqual(scope_of("hair-color"), "styling")
        # decisions.md 2026-10-23 10:21 AM ET: Skin AI moved out of legacy into its own scope,
        # live only on the skin-match channel (test_skin_match.py covers the channel).
        self.assertEqual(scope_of("skin-analysis"), "skin")
        self.assertEqual(scope_of("skin-tone-analysis"), "legacy")
        self.assertEqual(scope_of("hair-density"), "undecided")
        self.assertEqual(scope_of("body-reshape"), "none")
        self.assertFalse(STYLING.keys() & LEGACY)

    def test_legacy_needs_its_flag(self):
        with tempfile.TemporaryDirectory() as tmp:
            off = YouCamProvider(settings(Path(tmp)), None, TaskLedger(Path(tmp) / "l.sqlite3"))
            self.assertTrue(off.allowed("makeup-vto"))
            self.assertFalse(off.allowed("skin-analysis"))
            self.assertTrue(off.allowed("beard-style"))
            with self.assertRaises(OutOfScope) as ctx:
                off.check("face-reshape")
            self.assertEqual((ctx.exception.status, ctx.exception.code), (409, "youcam_scope"))
            on = YouCamProvider(settings(Path(tmp), youcam_legacy=True), None, TaskLedger(Path(tmp) / "m.sqlite3"))
            self.assertFalse(on.allowed("skin-analysis"))
            self.assertTrue(on.allowed("beard-style"))   # approved styling

    def test_enabled_needs_key_flag_and_client(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = TaskLedger(Path(tmp) / "l.sqlite3")
            self.assertFalse(YouCamProvider(settings(Path(tmp)), None, ledger).enabled)
            self.assertTrue(YouCamProvider(settings(Path(tmp)), object(), ledger).enabled)
            self.assertFalse(YouCamProvider(settings(Path(tmp), youcam_styling=False), object(), ledger).enabled)


class FlowTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_full_flow_is_written_to_the_ledger(self):
        provider, replay = provider_for(self.dir, cassette(makeup_task(polls=2)))
        j = job()
        outcome = asyncio.run(provider.run(j))
        self.assertEqual(outcome.image, RESULT)
        self.assertEqual(provider.ledger.get(j.request_key).status, SUCCEEDED)
        self.assertEqual(provider.ledger.get(j.request_key).task_id, "task-1")
        self.assertEqual(replay.unused(), [])
        self.assertIn("api POST /s2s/v2.0/task/delete", replay.log)
        sent_create = [b for m, p, b in replay.sent if p == "/s2s/v2.0/task/makeup-vto"][0]
        self.assertEqual(sent_create["src_file_id"], "file-1-0")

    def test_refused_create_is_refunded(self):
        refuse = makeup_task()
        refuse[2] = Interaction("POST", "/s2s/v2.0/task/makeup-vto", "api", 400,
                                json={"status": 400, "error": "bad", "error_code": "InvalidParameters"})
        provider, _ = provider_for(self.dir, cassette(refuse[:3]))
        j = job()
        with self.assertRaises(TaskError) as ctx:
            asyncio.run(provider.run(j))
        self.assertTrue(ctx.exception.refund)
        self.assertFalse(ctx.exception.ambiguous)
        self.assertEqual(provider.ledger.get(j.request_key).status, FAILED)

    def test_server_error_on_create_is_ambiguous_and_never_retried(self):
        steps = makeup_task()
        steps[2] = Interaction("POST", "/s2s/v2.0/task/makeup-vto", "api", 503, json={"status": 503, "error": "busy"})
        provider, replay = provider_for(self.dir, cassette(steps[:3], makeup_task()))
        j = job()
        with self.assertRaises(TaskError) as ctx:
            asyncio.run(provider.run(j))
        self.assertTrue(ctx.exception.ambiguous)
        self.assertFalse(ctx.exception.refund)
        self.assertEqual(provider.ledger.get(j.request_key).status, AMBIGUOUS)
        creates = sum(1 for line in replay.log if line == "api POST /s2s/v2.0/task/makeup-vto")
        self.assertEqual(creates, 1)
        with self.assertRaises(CheckCreditHistory):
            asyncio.run(provider.run(j))
        self.assertEqual(sum(1 for line in replay.log if line == "api POST /s2s/v2.0/task/makeup-vto"), creates)

    def test_lost_reply_is_ambiguous(self):
        def hook(request: httpx.Request):
            if request.method == "POST" and request.url.path.endswith("/task/makeup-vto"):
                raise httpx.ReadTimeout("reply lost", request=request)
            return None

        provider, _ = provider_for(self.dir, cassette(makeup_task()), hook=hook)
        j = job()
        with self.assertRaises(TaskError) as ctx:
            asyncio.run(provider.run(j))
        self.assertTrue(ctx.exception.ambiguous)
        self.assertEqual(provider.ledger.get(j.request_key).status, AMBIGUOUS)

    def test_connection_refused_on_create_is_safe_to_retry(self):
        def hook(request: httpx.Request):
            if request.method == "POST" and request.url.path.endswith("/task/makeup-vto"):
                raise httpx.ConnectError("refused", request=request)
            return None

        provider, _ = provider_for(self.dir, cassette(makeup_task()), hook=hook)
        j = job()
        with self.assertRaises(TaskError) as ctx:
            asyncio.run(provider.run(j))
        self.assertTrue(ctx.exception.refund)
        self.assertEqual(provider.ledger.get(j.request_key).status, FAILED)

    def test_failed_upload_creates_nothing(self):
        def hook(request: httpx.Request):
            if request.url.host == "storage.replay":
                return httpx.Response(500)
            return None

        provider, replay = provider_for(self.dir, cassette(makeup_task()), hook=hook)
        with self.assertRaises(TaskError) as ctx:
            asyncio.run(provider.run(job()))
        self.assertTrue(ctx.exception.refund)
        self.assertNotIn("api POST /s2s/v2.0/task/makeup-vto", replay.log)

    def test_task_error_keeps_the_units_and_deletes_the_task(self):
        error = task_interactions("makeup-vto", error="error_src_face_too_small")
        provider, replay = provider_for(self.dir, cassette(error))
        j = job()
        with self.assertRaises(TaskError) as ctx:
            asyncio.run(provider.run(j))
        self.assertEqual(ctx.exception.code, "error_src_face_too_small")
        self.assertFalse(ctx.exception.refund)
        self.assertEqual(provider.ledger.get(j.request_key).status, FAILED)
        self.assertIn("api POST /s2s/v2.0/task/delete", replay.log)

    def test_slow_task_finishes_in_the_background(self):
        provider, replay = provider_for(self.dir, cassette(makeup_task(polls=6)), poll_timeout_s=2.0)
        late = []
        j = job()

        async def go():
            with self.assertRaises(TaskError) as ctx:
                await provider.run(j, on_late_result=lambda jb, out: late.append(out.image))
            self.assertEqual(ctx.exception.code, "timeout")
            self.assertEqual(provider.ledger.get(j.request_key).status, CREATED)
            self.assertTrue(provider.polling("task-1"))
            await asyncio.gather(*provider.background)

        asyncio.run(go())
        self.assertEqual(late, [RESULT])
        self.assertEqual(provider.ledger.get(j.request_key).status, SUCCEEDED)
        self.assertFalse(provider.polling("task-1"))

    def test_second_identical_request_while_running_is_refused(self):
        provider, _ = provider_for(self.dir, cassette(makeup_task(polls=6)), poll_timeout_s=2.0)
        j = job()

        async def go():
            with self.assertRaises(TaskError):
                await provider.run(j)
            with self.assertRaises(TaskPending) as ctx:
                await provider.run(j)
            self.assertEqual(ctx.exception.detail["status"], CREATED)
            await asyncio.gather(*provider.background)

        asyncio.run(go())

    def test_start_returns_the_task_id_at_once(self):
        provider, _ = provider_for(self.dir, cassette(makeup_task(polls=2)))
        done = []
        j = job()

        async def go():
            task_id = await provider.start(j, lambda jb, out: done.append(out.image))
            self.assertEqual(task_id, "task-1")
            await asyncio.gather(*provider.background)

        asyncio.run(go())
        self.assertEqual(done, [RESULT])

    def test_resume_polls_without_creating(self):
        steps = [i for i in makeup_task() if i.method != "POST" or "delete" in i.path]
        steps = [i for i in steps if i.host != "storage"]
        provider, replay = provider_for(self.dir, cassette(steps))
        done = []
        j = job()

        async def go():
            provider.ledger.adopt(j.request_key, j.feature, j.version, "task-1")
            await provider.resume(j, "task-1", lambda jb, out: done.append(out.image))

        asyncio.run(go())
        self.assertEqual(done, [RESULT])
        self.assertNotIn("api POST /s2s/v2.0/task/makeup-vto", replay.log)
        self.assertNotIn("api POST /s2s/v2.0/file", replay.log)
        self.assertIn("api GET /s2s/v2.0/task/makeup-vto/task-1", replay.log)

    def test_out_of_scope_feature_never_reaches_youcam(self):
        provider, replay = provider_for(self.dir, cassette(makeup_task()))
        with self.assertRaises(PlumbError):
            asyncio.run(provider.run(job("skin-analysis")))
        self.assertEqual(replay.log, [])

    def test_templates(self):
        listing = Interaction("GET", "/s2s/v2.0/task/template/hair-style?page_size=100", "api", 200,
                              json={"status": 200, "data": {"templates": [{"id": "a"}, {"id": "b"}], "next_token": "n2"}})
        page2 = Interaction("GET", "/s2s/v2.0/task/template/hair-style?page_size=100&starting_token=n2", "api", 200,
                            json={"status": 200, "data": {"templates": [{"id": "c"}]}})
        provider, _ = provider_for(self.dir, cassette([listing, page2]))
        self.assertEqual([t["id"] for t in asyncio.run(provider.templates("hair-style"))], ["a", "b", "c"])
        with self.assertRaises(OutOfScope):
            asyncio.run(provider.templates("hair-color"))

    def test_one_shot_client_still_writes_the_ledger(self):
        fake = SyntheticYouCam()
        provider = YouCamProvider(settings(self.dir, youcam_legacy=True), fake, TaskLedger(self.dir / "l.sqlite3"))
        j = job("makeup-vto")
        outcome = asyncio.run(provider.run(j))
        self.assertIsNotNone(outcome.image)
        entry = provider.ledger.get(j.request_key)
        self.assertEqual(entry.status, SUCCEEDED)
        self.assertTrue(entry.task_id.startswith("synthetic:"))
        self.assertEqual(fake.calls[0][0], "makeup-vto")


if __name__ == "__main__":
    unittest.main()

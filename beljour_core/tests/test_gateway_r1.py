"""Gateway, round 1: cache key v2, scope, unit policy per session, background tasks, tickets
and resuming after a restart. Everything replays recorded replies; no network."""
import asyncio
import tempfile
import unittest
from pathlib import Path

from plumb_api.demo.synthetic import SyntheticYouCam
from plumb_api.errors import BudgetExceeded, NotInDemo, PlumbError
from plumb_api.ledger import AMBIGUOUS, CREATED, SUCCEEDED
from plumb_api.providers.replay import Interaction
from plumb_api.providers.youcam import CheckCreditHistory, OutOfScope
from plumb_api.session_ctx import reset_session, set_session
from tests.replay_helpers import MAKEUP_PAYLOAD, RESULT, cassette, credit, gateway_for, makeup_task, photo

SESSION = "sessionAAAAAAAAAAAAA"


class GatewayTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.token = set_session(SESSION)

    def tearDown(self):
        reset_session(self.token)
        self.tmp.cleanup()

    def test_live_result_is_stored_under_v2_and_repeats_are_free(self):
        gw, replay = gateway_for(self.dir, cassette(credit(), makeup_task()))
        p = photo()
        first = asyncio.run(gw.run(p, "makeup-vto", MAKEUP_PAYLOAD))
        self.assertEqual((first.source, first.units, first.image), ("live", 1, RESULT))
        k2, k1 = gw.keys(p.sha, "makeup-vto", MAKEUP_PAYLOAD)
        self.assertIsNotNone(gw.cache.get(k2))
        self.assertIsNone(gw.cache.get(k1))
        calls = len(replay.log)
        second = asyncio.run(gw.run(p, "makeup-vto", MAKEUP_PAYLOAD))
        self.assertEqual(second.source, "cache")
        self.assertEqual(len(replay.log), calls)
        self.assertEqual(gw.sessions.spent(SESSION), 1)
        self.assertEqual(gw.cache.spent_on(), 1)
        self.assertEqual(gw.quote(p.sha, "makeup-vto", MAKEUP_PAYLOAD)["cached"], True)

    def test_demo_mode_never_calls(self):
        gw, _ = gateway_for(self.dir, None, youcam_api_key="")
        with self.assertRaises(NotInDemo):
            asyncio.run(gw.run(photo(), "makeup-vto", MAKEUP_PAYLOAD))

    def test_styling_flag_off_means_demo_mode(self):
        gw, replay = gateway_for(self.dir, cassette(credit(), makeup_task()), youcam_styling=False)
        with self.assertRaises(NotInDemo):
            asyncio.run(gw.run(photo(), "makeup-vto", MAKEUP_PAYLOAD))
        self.assertEqual(replay.log, [])

    def test_legacy_feature_refused_live_without_its_flag(self):
        gw, _ = gateway_for(self.dir, None, client=SyntheticYouCam(), session_cap_public=0)
        with self.assertRaises(OutOfScope):
            asyncio.run(gw.run(photo(), "skin-analysis", {"dst_actions": ["acne"]}, want_image=False))
        self.assertEqual(gw.sessions.spent(SESSION), 0)

    def test_legacy_flag_cannot_reenable_disallowed_endpoints(self):
        fake = SyntheticYouCam()
        gw, _ = gateway_for(self.dir, None, client=fake, youcam_legacy=True, session_cap_public=0)
        with self.assertRaises(OutOfScope):
            asyncio.run(gw.run(photo(), "skin-analysis", {"dst_actions": ["acne"]}, want_image=False))
        self.assertEqual(fake.calls, [])
        self.assertEqual(gw.sessions.spent(SESSION), 0)

    def test_session_cap_stops_before_any_call(self):
        gw, replay = gateway_for(self.dir, cassette(credit(), makeup_task()), session_cap_public=1)
        asyncio.run(gw.run(photo(1), "makeup-vto", MAKEUP_PAYLOAD))
        calls = len(replay.log)
        with self.assertRaises(BudgetExceeded) as ctx:
            asyncio.run(gw.run(photo(2), "makeup-vto", MAKEUP_PAYLOAD))
        self.assertEqual(ctx.exception.detail["reason"], "session_cap")
        self.assertEqual(len(replay.log), calls)

    def test_refused_task_gives_the_units_back(self):
        steps = makeup_task()
        steps[2] = Interaction("POST", "/s2s/v2.0/task/makeup-vto", "api", 400,
                               json={"status": 400, "error": "bad", "error_code": "InvalidParameters"})
        gw, _ = gateway_for(self.dir, cassette(credit(), steps[:3]))
        with self.assertRaises(PlumbError) as ctx:
            asyncio.run(gw.run(photo(), "makeup-vto", MAKEUP_PAYLOAD))
        self.assertEqual(ctx.exception.status, 502)
        self.assertEqual((gw.sessions.spent(SESSION), gw.cache.spent_on()), (0, 0))

    def test_ambiguous_task_keeps_the_units_and_blocks_a_retry(self):
        steps = makeup_task()
        steps[2] = Interaction("POST", "/s2s/v2.0/task/makeup-vto", "api", 502, json={"status": 502, "error": "gateway"})
        gw, _ = gateway_for(self.dir, cassette(credit(), steps[:3]))
        p = photo()
        with self.assertRaises(PlumbError) as ctx:
            asyncio.run(gw.run(p, "makeup-vto", MAKEUP_PAYLOAD))
        self.assertEqual(ctx.exception.code, "youcam_ambiguous")
        self.assertEqual(gw.sessions.spent(SESSION), 1)
        with self.assertRaises(CheckCreditHistory):
            asyncio.run(gw.run(p, "makeup-vto", MAKEUP_PAYLOAD))
        k2, _ = gw.keys(p.sha, "makeup-vto", MAKEUP_PAYLOAD)
        self.assertEqual(gw.ledger.get(k2).status, AMBIGUOUS)
        self.assertEqual(gw.task_status(k2)["status"], AMBIGUOUS)

    def test_background_start_and_status(self):
        gw, _ = gateway_for(self.dir, cassette(credit(), makeup_task(polls=2)))
        p = photo()

        async def go():
            out = await gw.start(p, "makeup-vto", MAKEUP_PAYLOAD)
            self.assertEqual(out["status"], "running")
            self.assertEqual(gw.task_status(out["request_key"])["status"], "running")
            await asyncio.gather(*gw.provider.background)
            return out

        out = asyncio.run(go())
        self.assertEqual(gw.task_status(out["request_key"])["status"], "done")
        self.assertEqual(gw.result(out["request_key"]).image, RESULT)
        ticket = out["ticket"]
        self.assertEqual((ticket["task_id"], ticket["feature"], ticket["units"]), ("task-1", "makeup-vto", 1))
        again = asyncio.run(gw.start(p, "makeup-vto", MAKEUP_PAYLOAD))
        self.assertEqual((again["status"], again["ticket"]), ("done", None))
        self.assertEqual(gw.task_status("k2" + "0" * 46)["status"], "unknown")

    def test_ticket_resumes_after_a_restart_that_wiped_the_disk(self):
        """R1 done criterion: the ledger survives a simulated restart."""
        first_dir, second_dir = self.dir / "before", self.dir / "after"
        gw, replay_a = gateway_for(first_dir, cassette(credit(), makeup_task(polls=50)), resume_secret="shared-secret")
        p = photo()

        async def start_then_crash():
            out = await gw.start(p, "makeup-vto", MAKEUP_PAYLOAD)
            for task in list(gw.provider.background):
                task.cancel()          # the process dies before polling finishes
            await asyncio.sleep(0)
            return out

        out = asyncio.run(start_then_crash())
        self.assertEqual(gw.ledger.get(out["request_key"]).status, CREATED)
        creates_before = replay_a.log.count("api POST /s2s/v2.0/task/makeup-vto")

        # new process, empty disk, same secret; YouCam still has task-1
        after = [i for i in makeup_task(polls=1) if i.path.startswith("/s2s/v2.0/task/makeup-vto/")
                 or i.host == "results" or i.path.endswith("/delete")]
        gw2, replay_b = gateway_for(second_dir, cassette(credit(), after), resume_secret="shared-secret")
        self.assertIsNone(gw2.ledger.get(out["request_key"]))

        async def resume():
            statuses = await gw2.resume([out["ticket"]])
            await asyncio.gather(*gw2.provider.background)
            return statuses

        statuses = asyncio.run(resume())
        self.assertEqual(statuses, [{"request_key": out["request_key"], "status": "running"}])
        self.assertEqual(gw2.task_status(out["request_key"])["status"], "done")
        self.assertEqual(gw2.result(out["request_key"]).image, RESULT)
        self.assertEqual(gw2.ledger.get(out["request_key"]).status, SUCCEEDED)
        self.assertNotIn("api POST /s2s/v2.0/task/makeup-vto", replay_b.log)   # nothing created again
        self.assertEqual(creates_before, 1)
        self.assertEqual(gw2.cache.spent_on(), 1)      # the forgotten spend is counted again
        done = asyncio.run(gw2.resume([out["ticket"]]))
        self.assertEqual(done[0]["status"], "done")

    def test_resume_with_the_ledger_intact(self):
        gw, _ = gateway_for(self.dir, cassette(credit(), makeup_task(polls=50)), resume_secret="s")
        p = photo()

        async def go():
            out = await gw.start(p, "makeup-vto", MAKEUP_PAYLOAD)
            statuses = await gw.resume([out["ticket"]])     # still polling: no second poller
            for task in list(gw.provider.background):
                task.cancel()
            return out, statuses

        out, statuses = asyncio.run(go())
        self.assertEqual(statuses[0]["status"], "running")
        self.assertEqual(len(gw.ledger.entries()), 1)

    def test_forged_and_stale_tickets_are_rejected(self):
        gw, replay = gateway_for(self.dir, cassette(credit(), makeup_task()), resume_secret="right")
        forged = {"request_key": "k2" + "1" * 46, "task_id": "task-9", "feature": "makeup-vto", "version": "v2.0",
                  "owner": "x", "units": 1, "sig": "0" * 32, "v": 1}
        self.assertEqual(asyncio.run(gw.resume([forged]))[0], {"request_key": forged["request_key"],
                                                               "status": "rejected", "reason": "signature"})
        ephemeral, _ = gateway_for(self.dir / "e", cassette(credit(), makeup_task()))
        self.assertEqual(asyncio.run(ephemeral.resume([forged]))[0]["reason"], "server_restarted_without_secret")
        self.assertEqual(replay.log, [])

    def test_resume_in_demo_mode_reports_offline(self):
        live, _ = gateway_for(self.dir / "a", cassette(credit(), makeup_task()), resume_secret="s")
        ticket = live.signer.issue("k2" + "2" * 46, "task-1", "makeup-vto", "v2.0", "o", 1).to_json()
        demo, _ = gateway_for(self.dir / "b", None, youcam_api_key="", resume_secret="s")
        self.assertEqual(asyncio.run(demo.resume([ticket]))[0]["status"], "offline")

    def test_resume_of_out_of_scope_feature_is_rejected(self):
        gw, replay = gateway_for(self.dir, cassette(credit(), makeup_task()), resume_secret="s")
        ticket = gw.signer.issue("k2" + "3" * 46, "task-7", "face-reshape", "v2.0", "o", 1).to_json()
        out = asyncio.run(gw.resume([ticket]))[0]
        self.assertEqual((out["status"], out["reason"]), ("rejected", "youcam_scope"))
        self.assertEqual(replay.log, [])


if __name__ == "__main__":
    unittest.main()

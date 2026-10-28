"""HTTP tests for the round 1 routes: session, judge code, styling scope, background tasks,
resume, provenance on existing routes, and the CORS header for the session id."""
import os
import tempfile
import time
import unittest
from pathlib import Path

os.environ["PLUMB_NO_AUTOCREATE"] = "1"

import numpy as np  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from plumb_api.consent import attestation  # noqa: E402
from plumb_api.config import Settings  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from plumb_api.sessions import hash_code  # noqa: E402
from tests.replay_helpers import cassette, client_for, credit, jpeg, makeup_task  # noqa: E402

FIXTURES = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"
SESSION = {"X-Beljour-Session": "routeSessionAAAAAAAAA"}
CODE = "TEST-JUDG-CODE"


class DemoRoutesTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.app = create_app(Settings(data_dir=Path(self.tmp.name), fixtures_dir=FIXTURES,
                                       judge_code_hashes=(hash_code(CODE),), judge_attempts=2))
        self.c = TestClient(self.app)
        self.sample = self.c.get("/api/photos/sample").json()["photo_id"]

    def tearDown(self):
        self.tmp.cleanup()

    def test_session_status(self):
        anon = self.c.get("/api/session").json()
        self.assertEqual((anon["session"], anon["anonymous"], anon["cap"]), ("anonymous", True, 6))
        mine = self.c.get("/api/session", headers=SESSION).json()
        self.assertEqual((mine["session"], mine["anonymous"], mine["judge"], mine["remaining"]),
                         (SESSION["X-Beljour-Session"], False, False, 6))

    def test_judge_code(self):
        self.assertEqual(self.c.post("/api/session/judge", json={"code": CODE}).status_code, 400)
        wrong = self.c.post("/api/session/judge", json={"code": "NOPE"}, headers=SESSION)
        self.assertEqual(wrong.status_code, 403)
        self.assertEqual(wrong.json()["error"]["attempts_left"], 1)
        right = self.c.post("/api/session/judge", json={"code": CODE.lower()}, headers=SESSION).json()
        self.assertEqual((right["judge"], right["cap"]), (True, 40))

    def test_judge_lockout(self):
        other = {"X-Beljour-Session": "lockedSessionAAAAAAAA"}
        for _ in range(2):
            self.c.post("/api/session/judge", json={"code": "NOPE"}, headers=other)
        locked = self.c.post("/api/session/judge", json={"code": CODE}, headers=other)
        self.assertEqual(locked.status_code, 429)

    def test_styling_scope(self):
        scope = self.c.get("/api/styling/scope").json()
        self.assertFalse(scope["live"])
        self.assertTrue(scope["styling"]["makeup-vto"])
        self.assertFalse(scope["skin"]["skin-analysis"])  # R13: Skin AI only via /api/skin/match
        self.assertNotIn("skin-analysis", scope["legacy"])
        self.assertIn("hair-density", scope["undecided"])
        self.assertIn("hair-color", scope["actions"])

    def test_recorded_result_carries_provenance(self):
        top = "F08N"  # An explicitly selected approved synthetic makeup fixture.
        mk = self.c.post("/api/makeup/try", json={"photo_id": self.sample, "foundation_id": top,
                                                  "consent": attestation(self.sample, "makeup")}).json()
        prov = mk["provenance"]
        self.assertEqual((prov["source"], prov["provider"], prov["units"], prov["synthetic"]),
                         ("recorded", "youcam", 0, True))
        self.assertEqual(prov["badge"], "Sample, not a real result")
        self.assertEqual(mk["source"], "demo")       # Plumb's field stays for the old screens

    def test_local_preview_carries_local_provenance(self):
        rng = np.random.default_rng(3)
        lm = (rng.random((478, 2)) * 0.4 + 0.3).tolist()
        lm[33], lm[263], lm[1] = [0.38, 0.45], [0.62, 0.45], [0.5, 0.55]
        r = self.c.post("/api/surgery/preview", json={"photo_id": self.sample, "selection": {"brow_lift": 40},
                                                      "landmarks": lm}).json()
        self.assertEqual((r["provenance"]["source"], r["provenance"]["simulation"]), ("local", True))

    def test_start_serves_a_recorded_result_at_once(self):
        top = "F08N"  # An explicitly selected approved synthetic makeup fixture.
        out = self.c.post("/api/tasks/start", json={"photo_id": self.sample, "action": "makeup",
                                                    "foundation_id": top,
                                                    "consent": attestation(self.sample, "makeup")}).json()
        self.assertEqual((out["status"], out["ticket"]), ("done", None))
        got = self.c.get(f"/api/tasks/{out['request_key']}").json()
        self.assertEqual(got["status"], "done")
        self.assertTrue(got["image"].startswith("data:image/"))
        self.assertEqual(got["provenance"]["source"], "recorded")

    def test_start_errors(self):
        bad = self.c.post("/api/tasks/start", json={"photo_id": self.sample, "action": "hair-color",
                                                    "options": {"color": "red"},
                                                    "consent": attestation(self.sample, "hair-color")})
        self.assertEqual(bad.status_code, 422)
        missing = self.c.post("/api/tasks/start", json={"photo_id": self.sample, "action": "hair-color",
                                                        "options": {"color": "#112233"},
                                                        "consent": attestation(self.sample, "hair-color")})
        self.assertEqual(missing.status_code, 409)
        self.assertEqual(missing.json()["error"]["code"], "not_in_demo")
        self.assertEqual(self.c.get("/api/tasks/not-a-key!").status_code, 400)
        self.assertEqual(self.c.get("/api/tasks/k2" + "0" * 46).json()["status"], "unknown")

    def test_resume_rejects_forged_tickets(self):
        forged = {"request_key": "k2" + "1" * 46, "task_id": "t", "feature": "makeup-vto", "version": "v2.0",
                  "owner": "o", "units": 1, "sig": "f" * 32}
        out = self.c.post("/api/tasks/resume", json={"tickets": [forged]}).json()
        self.assertEqual(out["tasks"][0]["status"], "rejected")

    def test_cors_allows_the_session_header(self):
        r = self.c.options("/api/session", headers={"Origin": "http://localhost:8080",
                                                    "Access-Control-Request-Method": "GET",
                                                    "Access-Control-Request-Headers": "x-beljour-session"})
        self.assertEqual(r.status_code, 200)
        self.assertIn("x-beljour-session", r.headers.get("access-control-allow-headers", "").lower())


class LiveTaskRoutesTest(unittest.TestCase):
    """A key is set, but the YouCam client replays a cassette."""

    def test_background_makeup_task_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            client, replay = client_for(cassette(credit(), makeup_task(polls=2)))
            app = create_app(Settings(youcam_api_key="replay", data_dir=Path(tmp), fixtures_dir=Path(tmp) / "none",
                                      resume_secret="s"), client=client)
            with TestClient(app, headers=SESSION) as c:
                pid = c.post("/api/photos", files={"file": ("me.jpg", jpeg(4, 640, 800), "image/jpeg")}).json()["photo_id"]
                start = c.post("/api/tasks/start", json={"photo_id": pid, "action": "makeup", "lip_id": "L01",
                                                         "consent": attestation(pid, "makeup")},
                               headers=SESSION)
                self.assertEqual(start.status_code, 200, start.text)
                out = start.json()
                self.assertEqual(out["ticket"]["task_id"], "task-1")
                status = {}
                for _ in range(50):
                    status = c.get(f"/api/tasks/{out['request_key']}").json()
                    if status["status"] == "done":
                        break
                    time.sleep(0.02)
                self.assertEqual(status["status"], "done")
                self.assertEqual(status["provenance"]["source"], "live")
                session = c.get("/api/session", headers=SESSION).json()
                self.assertEqual(session["spent"], 1)
                again = c.post("/api/tasks/resume", json={"tickets": [out["ticket"]]}).json()
                self.assertEqual(again["tasks"][0]["status"], "done")
            self.assertEqual(replay.log.count("api POST /s2s/v2.0/task/makeup-vto"), 1)

    def test_local_skin_route_never_calls_live_provider(self):
        with tempfile.TemporaryDirectory() as tmp:
            client, replay = client_for(cassette(credit()))
            app = create_app(Settings(youcam_api_key="replay", data_dir=Path(tmp), fixtures_dir=Path(tmp) / "none"),
                             client=client)
            c = TestClient(app, headers=SESSION)
            pid = c.post("/api/photos", files={"file": ("me.jpg", jpeg(5, 640, 800), "image/jpeg")}).json()["photo_id"]
            r = c.post("/api/skin/analyze", json={"photo_id": pid})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json()["source"], "local")
            self.assertEqual(r.json()["scores"], [])
            self.assertEqual(r.json()["units_spent"], 0)
            self.assertEqual(replay.log, [])


if __name__ == "__main__":
    unittest.main()

"""R9 route tests for plan N22: no photo reaches YouCam without a consent attestation.

Live mode replays a cassette, so a refused request must leave the replay log empty (no provider
call at all) and the session's spend at zero. Demo mode checks every refusal reason.
Author: John Khan.
"""
import os
import tempfile
import time
import unittest
from pathlib import Path

os.environ["PLUMB_NO_AUTOCREATE"] = "1"

from fastapi.testclient import TestClient  # noqa: E402

from plumb_api.config import Settings  # noqa: E402
from plumb_api.consent import (CONSENT_VERSION, MAX_AGE_MS, ConsentIn, attestation, require_consent,  # noqa: E402
                               scope_for)
from plumb_api.errors import PlumbError  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from tests.replay_helpers import cassette, client_for, credit, jpeg, makeup_task  # noqa: E402

FIXTURES = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"
SESSION = {"X-Beljour-Session": "consentSessionAAAAAAA"}


def now_ms() -> int:
    return int(time.time() * 1000)


class ConsentRuleTest(unittest.TestCase):
    def test_scopes_follow_the_styling_actions(self) -> None:
        self.assertEqual(scope_for("makeup"), "makeup")
        for action in ("hair-color", "hair-style", "hair-bang", "hair-curl", "hair-extension", "hair-volume"):
            self.assertEqual(scope_for(action), "hair")
        with self.assertRaises(PlumbError) as err:
            scope_for("skin-analysis")
        self.assertEqual(err.exception.status, 422)

    def test_each_mismatch_has_its_own_code_and_says_nothing_was_sent(self) -> None:
        t = now_ms()
        good = attestation("photo0001", "makeup", t)
        cases = [
            (None, "consent_required"),
            ({**good, "version": "beljour-consent/0"}, "consent_outdated"),
            ({**good, "adult": False}, "consent_adult"),
            ({**good, "photo_id": "photo0002"}, "consent_photo"),
            ({**good, "scope": "hair"}, "consent_scope"),
            ({**good, "given_at": t - MAX_AGE_MS - 1}, "consent_expired"),
            ({**good, "given_at": t + 3_600_000}, "consent_expired"),
        ]
        for raw, code in cases:
            with self.subTest(code=code), self.assertRaises(PlumbError) as err:
                require_consent(ConsentIn(**raw) if raw else None, "photo0001", "makeup", t)
            self.assertEqual((err.exception.status, err.exception.code), (428, code))
            self.assertIn("Nothing was sent", err.exception.message)
        self.assertEqual(require_consent(ConsentIn(**good), "photo0001", "makeup", t), "makeup")

    def test_the_attestation_shape_is_strict(self) -> None:
        good = attestation("photo0001", "hair-color")
        self.assertEqual(good["version"], CONSENT_VERSION)
        self.assertEqual(sorted(good), ["adult", "given_at", "photo_id", "scope", "version"])
        # "skin" became a valid scope in R13 (Skin AI matching, decisions.md 2026-10-23
        # 10:21 AM ET); "body" stays out of scope, so the shape check keeps its teeth.
        for bad in ({**good, "face": [1, 2]}, {**good, "scope": "body"}, {**good, "given_at": -1}):
            with self.subTest(bad=sorted(bad)), self.assertRaises(ValueError):
                ConsentIn(**bad)


class DemoConsentRoutesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.c = TestClient(create_app(Settings(data_dir=Path(self.tmp.name), fixtures_dir=FIXTURES)), headers=SESSION)
        self.sample = self.c.get("/api/photos/sample").json()["photo_id"]
        self.top = "F08N"  # Approved synthetic makeup fixture, not a borrowed skin measurement.

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def start(self, consent: dict | None, action: str = "makeup", photo: str | None = None) -> dict:
        body: dict = {"photo_id": photo or self.sample, "action": action}
        if action == "makeup":
            body["foundation_id"] = self.top
        else:
            body["options"] = {"color": "#112233"}
        if consent is not None:
            body["consent"] = consent
        return self.c.post("/api/tasks/start", json=body, headers=SESSION)

    def test_task_start_refuses_without_consent_and_spends_nothing(self) -> None:
        r = self.start(None)
        self.assertEqual(r.status_code, 428)
        self.assertEqual(r.json()["error"]["code"], "consent_required")
        self.assertEqual(self.c.get("/api/session", headers=SESSION).json()["spent"], 0)

    def test_task_start_refuses_a_consent_for_another_photo_or_scope(self) -> None:
        other = self.c.post("/api/photos", files={"file": ("me.jpg", jpeg(3, 640, 800), "image/jpeg")}).json()["photo_id"]
        self.assertEqual(self.start(attestation(other, "makeup")).json()["error"]["code"], "consent_photo")
        hair = attestation(self.sample, "hair-color")
        self.assertEqual(self.start(hair).json()["error"]["code"], "consent_scope")
        self.assertEqual(self.start(attestation(self.sample, "makeup"), action="hair-color").json()["error"]["code"], "consent_scope")

    def test_task_start_runs_with_a_matching_consent(self) -> None:
        r = self.start(attestation(self.sample, "makeup"))
        self.assertEqual(r.status_code, 200, r.text)
        got = self.c.get(f"/api/tasks/{r.json()['request_key']}").json()
        self.assertEqual(got["status"], "done")

    def test_unknown_actions_are_refused_before_consent_is_even_read(self) -> None:
        r = self.c.post("/api/tasks/start", json={"photo_id": self.sample, "action": "skin-analysis"})
        self.assertEqual(r.status_code, 422)

    def test_the_legacy_makeup_route_needs_consent_too(self) -> None:
        refused = self.c.post("/api/makeup/try", json={"photo_id": self.sample, "foundation_id": self.top})
        self.assertEqual((refused.status_code, refused.json()["error"]["code"]), (428, "consent_required"))
        ok = self.c.post("/api/makeup/try", json={"photo_id": self.sample, "foundation_id": self.top,
                                                  "consent": attestation(self.sample, "makeup")})
        self.assertEqual(ok.status_code, 200, ok.text)
        self.assertTrue(ok.json()["image"].startswith("data:image/"))

    def test_consent_fields_never_appear_in_the_reply(self) -> None:
        r = self.start(attestation(self.sample, "makeup")).json()
        self.assertNotIn("consent", r)
        self.assertNotIn("given_at", str(r))


class LiveConsentRoutesTest(unittest.TestCase):
    """A key is set and the YouCam client replays a cassette: a refusal makes no provider call."""

    def test_no_provider_call_without_consent_then_one_call_with_it(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            client, replay = client_for(cassette(credit(), makeup_task(polls=1)))
            app = create_app(Settings(youcam_api_key="replay", data_dir=Path(tmp), fixtures_dir=Path(tmp) / "none",
                                      resume_secret="s"), client=client)
            with TestClient(app, headers=SESSION) as c:
                pid = c.post("/api/photos", files={"file": ("me.jpg", jpeg(6, 640, 800), "image/jpeg")}).json()["photo_id"]
                refused = c.post("/api/tasks/start", json={"photo_id": pid, "action": "makeup", "lip_id": "L01"}, headers=SESSION)
                self.assertEqual(refused.status_code, 428)
                legacy = c.post("/api/makeup/try", json={"photo_id": pid, "lip_id": "L01"}, headers=SESSION)
                self.assertEqual(legacy.status_code, 428)
                self.assertEqual(replay.log, [], "nothing reached the provider")
                self.assertEqual(c.get("/api/session", headers=SESSION).json()["spent"], 0)
                ok = c.post("/api/tasks/start", json={"photo_id": pid, "action": "makeup", "lip_id": "L01",
                                                      "consent": attestation(pid, "makeup")}, headers=SESSION)
                self.assertEqual(ok.status_code, 200, ok.text)
                for _ in range(50):
                    if c.get(f"/api/tasks/{ok.json()['request_key']}").json()["status"] == "done":
                        break
                    time.sleep(0.02)
            self.assertEqual(replay.log.count("api POST /s2s/v2.0/task/makeup-vto"), 1)


if __name__ == "__main__":
    unittest.main()

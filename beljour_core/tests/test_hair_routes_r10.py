"""R10 reference-cut quote/start consent, rights, pricing and isolation tests.

All server requests run with TestClient and a synthetic fixture. Zero live YouCam
credentials, HTTP requests, real faces, or external provider calls.
Author: John Khan.
"""
from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path

os.environ["PLUMB_NO_AUTOCREATE"] = "1"

from fastapi.testclient import TestClient  # noqa: E402

from plumb_api.config import Settings  # noqa: E402
from plumb_api.consent import attestation  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from plumb_api.youcam.units import FLAT_COSTS, UNVERIFIED  # noqa: E402
from tests.replay_helpers import jpeg  # noqa: E402

FIXTURES = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"
SESSION = {"X-Beljour-Session": "hairR10NoNetworkAAAAAAA"}


class HairReferenceRouteR10(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.client = TestClient(create_app(Settings(data_dir=Path(self.temp.name), fixtures_dir=FIXTURES)), headers=SESSION)
        self.photo = self.client.post("/api/photos", files={"file": ("source.jpg", jpeg(400, 640, 800), "image/jpeg")}).json()["photo_id"]
        self.reference = self.client.post("/api/photos", files={"file": ("reference.jpg", jpeg(401, 640, 800), "image/jpeg")}).json()["photo_id"]
        self.base = {"photo_id": self.photo, "action": "hair-transfer", "reference_photo_id": self.reference,
                     "reference_rights": True, "options": {}}

    def tearDown(self) -> None:
        self.client.close()
        self.temp.cleanup()

    def post(self, endpoint: str, payload: dict) -> tuple[int, dict]:
        response = self.client.post(endpoint, json=payload, headers=SESSION)
        return response.status_code, response.json()

    def test_distinct_synthetic_photo_hashes(self) -> None:
        self.assertNotEqual(self.photo, self.reference)
        self.assertEqual(len(self.photo), 64)
        self.assertEqual(len(self.reference), 64)

    def test_rights_before_quote(self) -> None:
        cases = [
            ({"reference_rights": False}, "reference_required"),
            ({"reference_photo_id": None}, "reference_required"),
            ({"reference_photo_id": self.photo}, "reference_required"),
        ]
        for change, reason in cases:
            with self.subTest(change=change):
                status, body = self.post("/api/quote", {**self.base, **change})
                self.assertEqual((status, body["error"]["code"]), (422, reason))

    def test_quote_does_not_spend_units(self) -> None:
        status, body = self.post("/api/quote", self.base)
        self.assertEqual(status, 200, body)
        self.assertEqual(body["feature"], "hair-transfer")
        self.assertEqual(body["scope"], "youcam")
        self.assertEqual(body["units"], FLAT_COSTS["hair-transfer"])
        self.assertFalse(body["pricing_verified"])
        self.assertFalse(body["live"])
        self.assertFalse(body["can_apply"])
        self.assertEqual(self.client.get("/api/session", headers=SESSION).json()["spent"], 0)
        self.assertIn("hair-transfer", UNVERIFIED)

    def test_reference_options_are_not_makeup_or_face_payloads(self) -> None:
        for options in ({"face_reshape": True}, {"template_id": "tpl-bob"}, {"strength": 100}):
            with self.subTest(options=options):
                status, body = self.post("/api/quote", {**self.base, "options": options})
                self.assertEqual(status, 422)
                self.assertEqual(body["error"]["code"], "bad_request")

    def test_ref_fails_on_same_or_unknown_photo(self) -> None:
        status, body = self.post("/api/quote", {**self.base, "reference_photo_id": "unknown-photo"})
        self.assertIn(status, (400, 404, 422))
        self.assertIn("error", body)

    def test_start_requires_consent_before_it_even_looks_for_reference(self) -> None:
        for payload in (self.base, {**self.base, "reference_photo_id": "unknown-photo"},
                        {**self.base, "reference_rights": False}):
            with self.subTest(payload=payload):
                status, body = self.post("/api/tasks/start", payload)
                self.assertEqual((status, body["error"]["code"]), (428, "consent_required"))
        self.assertEqual(self.client.get("/api/session", headers=SESSION).json()["spent"], 0)

    def test_start_rejects_missing_or_wrong_rights_after_photo_consent(self) -> None:
        valid = {**self.base, "consent": attestation(self.photo, "hair-style")}
        for change, reason in (
            ({"reference_rights": False}, "reference_rights"),
            ({"reference_photo_id": None}, "reference_required"),
            ({"reference_photo_id": self.photo}, "reference_same"),
        ):
            with self.subTest(change=change):
                status, body = self.post("/api/tasks/start", {**valid, **change})
                self.assertEqual((status, body["error"]["code"]), (422, reason))

    def test_start_cannot_use_a_makeup_scope_attestation(self) -> None:
        status, body = self.post("/api/tasks/start", {**self.base, "consent": attestation(self.photo, "makeup")})
        self.assertEqual((status, body["error"]["code"]), (428, "consent_scope"))

    def test_reference_cannot_be_smuggled_into_other_styling_action(self) -> None:
        attempts = (
            {**self.base, "action": "hair-style", "options": {"template_id": "tpl-bob"}},
            {**self.base, "action": "hair-curl", "options": {"strength": 25}},
        )
        for attempt in attempts:
            with self.subTest(action=attempt["action"]):
                status, body = self.post("/api/quote", attempt)
                self.assertEqual((status, body["error"]["code"]), (422, "reference_unexpected"))
                status, body = self.post("/api/tasks/start", {**attempt,
                    "consent": attestation(self.photo, "hair-style")})
                self.assertEqual((status, body["error"]["code"]), (422, "reference_unexpected"))

    def test_on_device_only_does_not_enable_any_provider_path(self) -> None:
        status, body = self.post("/api/quote", self.base)
        self.assertFalse(body["can_apply"])
        self.assertGreaterEqual(body["units"], 1)
        self.assertEqual(status, 200)

    def test_reference_is_not_persisted_in_a_quoted_response(self) -> None:
        _, result = self.post("/api/quote", self.base)
        self.assertNotIn(self.reference, str(result))
        self.assertNotIn("reference_photo_id", result)
        self.assertNotIn("file_id", result)

    def test_reference_can_be_deleted_after_the_request(self) -> None:
        result = self.client.delete(f"/api/photos/{self.reference}").json()
        self.assertTrue(result["deleted"])
        status, _ = self.post("/api/quote", self.base)
        self.assertIn(status, (400, 404, 422))

    def test_provider_scope_only_contains_approved_hair_and_makeup(self) -> None:
        out = self.client.get("/api/styling/scope").json()
        self.assertIn("hair-transfer", out["actions"])
        for action in ("skin-analysis", "body-reshape", "face-reshape", "aging", "cloth-v4"):
            self.assertNotIn(action, out["actions"])


class HairRouteNamespaceR10(unittest.TestCase):
    def test_new_reference_call_does_not_create_a_second_provider_adapter(self) -> None:
        root = Path(__file__).resolve().parents[1] / "plumb_api"
        source = (root / "routes" / "tasks.py").read_text()
        self.assertNotIn("YouCamClient(", source)
        self.assertIn("state.gateway.start(", source)
        self.assertIn("refs=refs", source)

    def test_reference_versions_shared_between_quote_and_start(self) -> None:
        root = Path(__file__).resolve().parents[1] / "plumb_api"
        for filename in ("routes/core.py", "routes/tasks.py"):
            with self.subTest(filename=filename):
                self.assertIn("endpoint_version(", (root / filename).read_text())

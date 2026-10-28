"""R8 integration tests: public quote envelopes and local/provider task separation.

Never supply a live YouCam client. TestClient runs against fresh temporary state
and replay/demo fixtures. Session counters come from the actual UnitPolicy.
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
from plumb_api.main import create_app  # noqa: E402
from plumb_api.routes.quote_scope import LOCAL_ACTIONS, decorate, local_quote  # noqa: E402
from plumb_api.state import get_state  # noqa: E402

FIXTURES = Path(__file__).resolve().parents[1] / "plumb_api" / "demo" / "fixtures"
SESSION = {"X-Beljour-Session": "quoteR8SessionAAAAAAA"}
OTHER = {"X-Beljour-Session": "quoteR8SessionBBBBBBB"}


class QuoteRoutesR8(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.app = create_app(Settings(data_dir=Path(self.tmp.name), fixtures_dir=FIXTURES))
        self.client = TestClient(self.app)
        result = self.client.get("/api/photos/sample")
        self.assertEqual(result.status_code, 200, result.text)
        self.sample = result.json()["photo_id"]

    def tearDown(self) -> None:
        self.client.close()
        self.tmp.cleanup()

    def quote(self, action: str, **kwargs: object) -> dict:
        response = self.client.post("/api/quote", json={"photo_id": self.sample, "action": action, **kwargs},
                                    headers=SESSION)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_local_tools_use_no_photo_id_or_provider_gateway(self) -> None:
        for feature in sorted(LOCAL_ACTIONS):
            response = self.client.post("/api/quote", json={"action": feature}, headers=SESSION)
            self.assertEqual(response.status_code, 200, response.text)
            q = response.json()
            self.assertEqual(q["feature"], feature)
            self.assertEqual(q["scope"], "local")
            self.assertEqual(q["units"], 0)
            self.assertTrue(q["can_apply"])
            self.assertFalse(q["cached"])
            self.assertFalse(q["live"])
            self.assertEqual(q["data_flow"], "stays on this device")
            self.assertEqual(q["visit_units_left"], 6)
            self.assertEqual(q["visit_units_after"], 6)
            self.assertIsNone(q["unavailable_reason"])
        self.assertEqual(self.client.get("/api/session", headers=SESSION).json()["spent"], 0)

    def test_local_action_never_triggers_a_task_or_creates_a_photo(self) -> None:
        for feature in LOCAL_ACTIONS:
            r = self.client.post("/api/tasks/start", json={"photo_id": self.sample, "action": feature})
            self.assertEqual(r.status_code, 422, r.text)
        assert self.client.get("/api/session", headers=SESSION).json()["spent"] == 0

    def test_styling_quote_contains_visit_units_and_scope(self) -> None:
        for action, options, cost in (
            ("hair-color", {"color": "#AA3355"}, 1),
            ("hair-style", {"template_id": "bob"}, 2),
            ("hair-bang", {"strength": 60}, 1),
            ("hair-curl", {"strength": 60}, 1),
            ("hair-extension", {"strength": 60}, 1),
            ("hair-volume", {"strength": 60}, 2),
        ):
            q = self.quote(action, options=options)
            self.assertEqual(q["feature"], action)
            self.assertEqual(q["scope"], "youcam")
            self.assertEqual(q["units"], cost)
            self.assertFalse(q["cached"])
            self.assertFalse(q["can_apply"])
            self.assertEqual(q["data_flow"], "sent to YouCam, deleted after the result")
            self.assertFalse(q["pricing_verified"])
            self.assertTrue(q["is_estimate"])
            self.assertEqual(q["visit_units_left"], 6)
            self.assertEqual(q["visit_units_used"], 0)
            self.assertEqual(q["visit_units_after"], 6 - cost)
            self.assertIn("styling", q["unavailable_reason"])

    def test_missing_photo_or_bad_styling_options_fail_closed(self) -> None:
        missing = self.client.post("/api/quote", json={"action": "hair-style", "options": {"template_id": "bob"}})
        self.assertEqual(missing.status_code, 422)
        bad = self.client.post("/api/quote", json={"photo_id": self.sample, "action": "hair-color",
                                                     "options": {"color": "red"}})
        self.assertEqual(bad.status_code, 422)
        self.assertEqual(self.client.get("/api/session", headers=SESSION).json()["spent"], 0)

    def test_replaced_routes_use_local_server_engines_without_youcam(self) -> None:
        for action in ("skin", "shade", "proportions", "aging"):
            q = self.quote(action)
            self.assertEqual(q["scope"], "local")
            self.assertEqual(q["units"], 0)
            self.assertIn("this server", q["data_flow"])
            self.assertIn("no YouCam call", q["data_flow"])
            self.assertIsNone(q["pricing_verified"])
            self.assertFalse(q["cached"])
            self.assertTrue(q["can_apply"])
            self.assertIsNone(q["unavailable_reason"])
        self.assertEqual(self.client.get("/api/session", headers=SESSION).json()["spent"], 0)

    def test_two_sessions_get_independent_visit_counters(self) -> None:
        state = self.app.dependency_overrides.get(get_state)
        self.assertIsNone(state)
        a = self.client.get("/api/session", headers=SESSION).json()
        b = self.client.get("/api/session", headers=OTHER).json()
        self.assertEqual(a["remaining"], b["remaining"])
        self.assertEqual(a["cap"], 6)
        self.assertNotEqual(a["session"], b["session"])
        for headers in (SESSION, OTHER):
            q = self.client.post("/api/quote", json={"action": "enhance"}, headers=headers).json()
            self.assertEqual(q["visit_units_used"], 0)
            self.assertEqual(q["visit_units_left"], 6)

    def test_session_budget_gate_is_not_a_claim_of_reserved_units(self) -> None:
        q1 = self.quote("hair-style", options={"template_id": "bob"})
        q2 = self.quote("hair-style", options={"template_id": "bob"})
        self.assertEqual(q1["visit_units_left"], q2["visit_units_left"])
        self.assertEqual(q1["visit_units_after"], q2["visit_units_after"])
        self.assertTrue(q1["is_estimate"])
        self.assertEqual(self.client.get("/api/session", headers=SESSION).json()["spent"], 0)


class ScopeUnitR8(unittest.TestCase):
    def test_only_four_named_local_engine_actions(self) -> None:
        self.assertEqual(LOCAL_ACTIONS, frozenset({"enhance", "posture", "hair-fibre", "beard"}))
        for feature in LOCAL_ACTIONS:
            self.assertEqual(local_quote(feature)["units"], 0)
        for bogus in ("filters", "makeup-vto", "face-reshape", "face-turn"):
            with self.assertRaises(ValueError):
                local_quote(bogus)

    def test_quote_decorator_does_not_invent_a_session_or_server(self) -> None:
        class FakePolicy:
            def status(self, session: str) -> dict:
                return {"remaining": 3, "spent": 3, "cap": 6, "daily_cap": 8,
                        "spent_today": 4, "kill_switch": False}
        class FakeGateway:
            policy = FakePolicy()
            class FakeProvider:
                client = None
            provider = FakeProvider()
        class FakeSettings:
            live = False
            youcam_styling = False
        class FakeState:
            gateway = FakeGateway()
            settings = FakeSettings()
        q = decorate({"feature": "enhance", "units": 0, "cached": False, "live": False}, FakeState())  # type: ignore[arg-type]
        self.assertEqual((q["scope"], q["visit_units_left"], q["daily_units_left"]), ("local", 3, 4))
        self.assertTrue(q["can_apply"])
        self.assertEqual(q["visit_units_after"], 3)
        self.assertIsNone(q["pricing_verified"])


if __name__ == "__main__":
    unittest.main()

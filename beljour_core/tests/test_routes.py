import io
import os
import tempfile
import unittest
from pathlib import Path

os.environ["PLUMB_NO_AUTOCREATE"] = "1"

import numpy as np  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

from plumb_api.consent import attestation  # noqa: E402
from plumb_api.config import Settings  # noqa: E402
from plumb_api.demo.synthetic import SyntheticYouCam  # noqa: E402
from plumb_api.main import create_app  # noqa: E402

FIXTURES = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"


def photo_bytes(seed=0) -> bytes:
    arr = (np.random.default_rng(seed).random((800, 640, 3)) * 255).astype(np.uint8)
    out = io.BytesIO()
    Image.fromarray(arr).save(out, "JPEG")
    return out.getvalue()


class DemoModeTest(unittest.TestCase):
    """No API key: local engines work; approved makeup examples are labelled fixtures."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.app = create_app(Settings(data_dir=Path(self.tmp.name), fixtures_dir=FIXTURES))
        self.c = TestClient(self.app, headers={"X-Beljour-Session": "routesPrivateSessionR14"})
        self.sample = self.c.get("/api/photos/sample").json()["photo_id"]

    def tearDown(self):
        self.tmp.cleanup()

    def test_health(self):
        h = self.c.get("/api/health").json()
        self.assertFalse(h["live"])
        self.assertTrue(h["sample_available"])

    def test_sample_flows_cost_nothing(self):
        skin = self.c.post("/api/skin/analyze", json={"photo_id": self.sample}).json()
        self.assertEqual(skin["source"], "local")
        self.assertEqual(skin["scores"], [])
        self.assertIsNone(skin["skin_age"])
        self.assertEqual(skin["units_spent"], 0)
        self.assertTrue(skin["routine"]["morning"])
        shade = self.c.post("/api/shade/analyze", json={"photo_id": self.sample})
        self.assertEqual(shade.status_code, 422)
        self.assertEqual(shade.json()["error"]["code"], "face_points_required")
        top = "F08N"
        mk = self.c.post("/api/makeup/try", json={"photo_id": self.sample, "foundation_id": top,
                                                  "consent": attestation(self.sample, "makeup")}).json()
        self.assertTrue(mk["image"].startswith("data:image/jpeg;base64,"))
        props = self.c.post("/api/face/proportions", json={"photo_id": self.sample})
        self.assertEqual(props.status_code, 422)
        self.assertEqual(props.json()["error"]["code"], "face_points_required")
        sur = self.c.post("/api/surgery/preview", json={"photo_id": self.sample, "selection": {"lip_filler": 30}})
        self.assertEqual(sur.status_code, 422)
        self.assertEqual(sur.json()["error"]["code"], "local_effect_unavailable")

    def test_unimplemented_local_effect_is_a_clear_422(self):
        r = self.c.post("/api/surgery/preview", json={"photo_id": self.sample, "selection": {"lip_filler": 50}})
        self.assertEqual(r.status_code, 422)
        self.assertEqual(r.json()["error"]["code"], "local_effect_unavailable")

    def test_quote_reports_actual_local_processing(self):
        q = self.c.post("/api/quote", json={"photo_id": self.sample, "action": "skin"}).json()
        # R8 adds source, user-visible data flow and the live session allowance.
        self.assertEqual({key: q[key] for key in ("feature", "units", "cached", "live")},
                         {"feature": "skin", "units": 0, "cached": False, "live": False})
        self.assertEqual((q["scope"], q["can_apply"], q["visit_units_left"]),
                         ("local", True, 6))
        q = self.c.post("/api/quote", json={"photo_id": self.sample, "action": "surgery", "selection": {"lip_filler": 50}}).json()
        self.assertEqual(q["units"], 0)

    def test_upload_and_delete(self):
        r = self.c.post("/api/photos", files={"file": ("me.jpg", photo_bytes(), "image/jpeg")})
        self.assertEqual(r.status_code, 200)
        pid = r.json()["photo_id"]
        self.assertEqual(self.c.get(f"/api/photos/{pid}.jpg").status_code, 200)
        self.assertTrue(self.c.delete(f"/api/photos/{pid}").json()["deleted"])
        self.assertEqual(self.c.get(f"/api/photos/{pid}.jpg").status_code, 404)

    def test_bad_upload(self):
        r = self.c.post("/api/photos", files={"file": ("x.jpg", b"hello", "image/jpeg")})
        self.assertEqual(r.status_code, 415)


class LiveModeTest(unittest.TestCase):
    """A key is set, but the client is the offline SyntheticYouCam."""

    def make(self, cap=1000):
        self.tmp = tempfile.TemporaryDirectory()
        self.fake = SyntheticYouCam()
        # skin analysis and skin tone are Plumb features outside YouCam's styling scope
        # (decisions.md), so these live tests opt in to the legacy flag; the session cap is off
        # because no browser session header is sent
        self.app = create_app(Settings(youcam_api_key="test", data_dir=Path(self.tmp.name),
                                       fixtures_dir=Path(self.tmp.name) / "none", daily_unit_cap=cap,
                                       youcam_legacy=True, session_cap_public=0),
                              client=self.fake)
        self.c = TestClient(self.app, headers={"X-Beljour-Session": "routesPrivateSessionR14"})
        r = self.c.post("/api/photos", files={"file": ("me.jpg", photo_bytes(1), "image/jpeg")})
        self.pid = r.json()["photo_id"]

    def tearDown(self):
        self.tmp.cleanup()

    def test_skin_endpoint_never_calls_youcam(self):
        self.make()
        a = self.c.post("/api/skin/analyze", json={"photo_id": self.pid})
        b = self.c.post("/api/skin/analyze", json={"photo_id": self.pid})
        self.assertEqual((a.status_code, b.status_code), (200, 200))
        self.assertEqual(self.fake.calls, [])
        self.assertEqual(self.c.get("/api/budget").json()["spent_today"], 0)

    def test_daily_cap_does_not_reenable_legacy(self):
        self.make(cap=15)
        a = self.c.post("/api/skin/analyze", json={"photo_id": self.pid})
        r = self.c.post("/api/shade/analyze", json={"photo_id": self.pid})
        self.assertEqual((a.status_code, r.status_code), (200, 422))
        self.assertEqual(len(self.fake.calls), 0)

    def test_delete_without_legacy_calls(self):
        self.make()
        self.c.post("/api/skin/analyze", json={"photo_id": self.pid})
        out = self.c.delete(f"/api/photos/{self.pid}").json()
        self.assertEqual(out["results_removed"], 0)

    def test_local_only_procedure_uses_landmarks_and_no_units(self):
        self.make()
        rng = np.random.default_rng(3)
        lm = (rng.random((478, 2)) * 0.4 + 0.3).tolist()
        lm[33], lm[263], lm[1] = [0.38, 0.45], [0.62, 0.45], [0.5, 0.55]
        r = self.c.post("/api/surgery/preview", json={"photo_id": self.pid, "selection": {"brow_lift": 40}, "landmarks": lm}).json()
        self.assertEqual(r["units_spent"], 0)
        self.assertEqual(r["source"], "local")
        self.assertGreater(r["honesty"]["changed_percent"], 0)
        self.assertEqual(self.fake.calls, [])
        r2 = self.c.post("/api/surgery/preview", json={"photo_id": self.pid, "selection": {"brow_lift": 40}})
        self.assertEqual(r2.status_code, 422)
        self.assertEqual(r2.json()["error"]["code"], "face_points_required")

    def test_nothing_selected(self):
        self.make()
        r = self.c.post("/api/surgery/preview", json={"photo_id": self.pid, "selection": {"lip_filler": 2}})
        self.assertEqual(r.status_code, 422)


if __name__ == "__main__":
    unittest.main()

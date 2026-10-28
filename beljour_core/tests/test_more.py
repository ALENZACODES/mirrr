import io
import json
import os
import tempfile
import time
import unittest
from pathlib import Path

os.environ["PLUMB_NO_AUTOCREATE"] = "1"

import numpy as np  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

from plumb_api.config import Settings  # noqa: E402
from plumb_api.demo.synthetic import SyntheticYouCam  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from plumb_api.services import procedures, warp  # noqa: E402
from plumb_api.youcam import payloads, units  # noqa: E402
from plumb_api.youcam.client import _extract_credit  # noqa: E402
from tests.local_feature_helpers import drawn_photo  # noqa: E402

FIXTURES = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"


def jpeg(seed=0, w=640, h=800) -> bytes:
    arr = (np.random.default_rng(seed).random((h, w, 3)) * 255).astype(np.uint8)
    out = io.BytesIO()
    Image.fromarray(arr).save(out, "JPEG")
    return out.getvalue()


class PayloadsTest(unittest.TestCase):
    def test_simulation_rounds_and_prices(self):
        p = payloads.skin_simulation({"acne": 0.44, "pores": 0.06, "redness": 0})
        self.assertEqual(p, {"acne": 0.4, "pores": 0.1})
        self.assertEqual(units.estimate("skin-simulation", p), 4)
        many = payloads.skin_simulation({k: 0.5 for k in payloads.SIMULATION_KEYS[:5]})
        self.assertEqual(units.estimate("skin-simulation", many), 6)
        with self.assertRaises(ValueError):
            payloads.skin_simulation({"acne": 0})

    def test_face_lift(self):
        p = payloads.face_lift({"cheek": 120, "eye_bag": 0})
        self.assertEqual(p["features"], {"cheek": 100})
        self.assertEqual(p["type"], "custom")
        with self.assertRaises(ValueError):
            payloads.face_lift({"chin": 10})
        self.assertFalse(hasattr(payloads, "cloth"), "clothes payloads were removed in R3")

    def test_credit_reply_shape_from_docs(self):
        future = int(time.time() * 1000) + 10**9
        reply = {"status": 200, "results": [
            {"type": "ApiPaygToken", "amount": 10, "amount_dec": 10.5, "expiry": future},
            {"type": "ApiSubsToken", "amount": 990, "amount_dec": 990.0, "expiry": future},
            {"type": "ApiSubsToken", "amount": 50, "amount_dec": 50.0, "expiry": 1}]}
        self.assertEqual(_extract_credit(reply), 1000)   # expired entry ignored, status ignored
        self.assertIsNone(_extract_credit({"status": 200}))


class ProcedurePlanTest(unittest.TestCase):
    def test_lift_and_reshape_cost_two_units(self):
        plan = procedures.build_plan({"facelift": 50, "lip_filler": 50, "cleft_chin": 50})
        self.assertEqual(plan.lift, {"cheek": 35, "shape": 30})
        self.assertTrue(plan.reshape)
        self.assertEqual(plan.units, 2)
        self.assertEqual(plan.local, [("cleft_chin", 0.5)])
        self.assertEqual(plan.skipped, [])

    def test_every_procedure_is_runnable_now(self):
        self.assertFalse([p.id for p in procedures.CATALOGUE if p.engine == "planned"])
        for p in procedures.CATALOGUE:
            if p.engine == "lift":
                for name in p.params:
                    self.assertIn(name, payloads.FACE_LIFT_PARAMS)


def fake_face(w=600, h=800):
    lm = np.random.default_rng(5).random((478, 2)) * 0.3 + 0.35
    fixed = {33: (0.38, 0.42), 263: (0.62, 0.42), 1: (0.5, 0.55), 17: (0.5, 0.7), 152: (0.5, 0.82),
             234: (0.3, 0.5), 454: (0.7, 0.5), 127: (0.31, 0.4), 356: (0.69, 0.4)}
    for i, (x, y) in fixed.items():
        lm[i] = (x, y)
    return lm


class LocalWarpTest(unittest.TestCase):
    def test_chin_dimple_darkens_the_chin_only(self):
        img = np.full((800, 600, 3), 180, np.uint8)
        out = warp.apply_local(img, fake_face(), "cleft_chin", 1.0)
        cy = int((0.7 + 0.62 * 0.12) * 800)
        self.assertLess(out[cy, 300, 0], 160)
        self.assertEqual(out[50, 50, 0], 180)

    def test_otoplasty_moves_ear_zone_inwards(self):
        img = np.zeros((800, 600, 3), np.uint8)
        img[360:440, 140:160] = 255           # a bright "ear" left of the face edge at x=180
        out = warp.apply_local(img, fake_face(), "otoplasty", 1.0)
        xs_before = np.nonzero(img[400, :, 0] > 128)[0].mean()
        xs_after = np.nonzero(out[400, :, 0] > 128)[0].mean()
        self.assertGreater(xs_after, xs_before + 2)


class NewRoutesTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.tmp.cleanup()

    def test_demo_covers_new_features(self):
        c = TestClient(create_app(Settings(data_dir=Path(self.tmp.name), fixtures_dir=FIXTURES)), headers={"X-Beljour-Session": "morePrivateSessionR14"})
        raw, mesh = drawn_photo()
        pid = c.post("/api/photos", files={"file": ("drawn.png", raw, "image/png")}).json()["photo_id"]
        aging = c.post("/api/transform/aging", json={"photo_id": pid, "landmarks": mesh}).json()
        self.assertEqual([f["age"] for f in aging["frames"]], [None, None, None])
        self.assertEqual(aging["source"], "local")
        self.assertEqual(len({f["image"] for f in aging["frames"]}), 3)
        tryon = c.post("/api/fashion/tryon", json={"photo_id": pid, "garment_id": "x"}).json()
        self.assertEqual(tryon["error"]["code"], "feature_removed")
        lift = c.post("/api/surgery/preview", json={"photo_id": pid, "selection": {"facelift": 30}, "landmarks": mesh}).json()
        self.assertEqual(lift["source"], "local")
        self.assertEqual(lift["units_spent"], 0)
        skin = c.post("/api/skin/analyze", json={"photo_id": pid}).json()
        self.assertEqual(skin["scores"], [])
        sim = c.post("/api/skin/simulate", json={"photo_id": pid, "strengths": {"texture": .5}, "landmarks": mesh})
        self.assertEqual(sim.status_code, 200)

    def test_chained_legacy_preview_is_blocked_without_spending(self):
        fake = SyntheticYouCam()
        c = TestClient(create_app(Settings(youcam_api_key="t", data_dir=Path(self.tmp.name),
                                           fixtures_dir=Path(self.tmp.name) / "none",
                                           youcam_legacy=True, session_cap_public=0), client=fake), headers={"X-Beljour-Session": "morePrivateSessionR14"})
        pid = c.post("/api/photos", files={"file": ("a.jpg", jpeg(), "image/jpeg")}).json()["photo_id"]
        r = c.post("/api/surgery/preview", json={"photo_id": pid,
                     "selection": {"facelift": 50, "rhino_lift": 50}}).json()
        self.assertEqual(r["error"]["code"], "local_effect_unavailable")
        self.assertEqual(fake.calls, [])
        self.assertEqual(c.delete(f"/api/photos/{pid}").json()["results_removed"], 0)

    def test_clothes_and_fit_routes_are_gone(self):
        c = TestClient(create_app(Settings(data_dir=Path(self.tmp.name), fixtures_dir=FIXTURES)), headers={"X-Beljour-Session": "morePrivateSessionR14"})
        calls = [("get", "/api/fashion/sample"), ("post", "/api/fashion/product"), ("post", "/api/fashion/garment"),
                 ("post", "/api/fashion/style"), ("get", "/api/fashion/garment/abc.jpg"),
                 ("post", "/api/fit/chart"), ("post", "/api/fit/recommend")]
        for method, path in calls:
            with self.subTest(path=path):
                r = getattr(c, method)(path, json={}) if method == "post" else c.get(path)
                self.assertEqual(r.status_code, 410)
                self.assertEqual(r.json()["error"]["code"], "feature_removed")
        pid = c.get("/api/photos/sample").json()["photo_id"]
        quote = c.post("/api/quote", json={"photo_id": pid, "action": "outfit"})
        self.assertEqual(quote.status_code, 410)
        self.assertNotIn("garment.jpg", [p.name for p in FIXTURES.iterdir()])
        self.assertFalse(any(json.loads(p.read_text()).get("feature") == "cloth-v4"
                             for p in FIXTURES.glob("*.json")))


if __name__ == "__main__":
    unittest.main()

import io
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from plumb_api.errors import PlumbError
from plumb_api.services import imaging, photos, procedures, proportions, skin, warp
from plumb_api.youcam import payloads, units
from plumb_api.youcam.cache import CachedResult, ResultCache, cache_key


def jpeg(w=640, h=800, color=(180, 140, 120), exif=False) -> bytes:
    img = Image.new("RGB", (w, h), color)
    out = io.BytesIO()
    if exif:
        ex = Image.Exif()
        ex[0x010F] = "SecretCameraMaker"
        ex[0x0112] = 6  # rotate 90
        img.save(out, "JPEG", exif=ex.tobytes())
    else:
        img.save(out, "JPEG")
    return out.getvalue()


class UnitsTest(unittest.TestCase):
    def test_skin_tiers(self):
        self.assertEqual([units.skin_analysis_units(n) for n in (1, 4, 5, 8, 9, 12, 13, 16)], [9, 9, 12, 12, 14, 14, 16, 16])
        self.assertEqual(units.skin_analysis_units(8, hd=True), 16)
        with self.assertRaises(ValueError):
            units.skin_analysis_units(17)

    def test_face_attr_and_video(self):
        self.assertEqual([units.face_attr_units(n) for n in (5, 6, 14, 15)], [10, 20, 20, 30])
        self.assertEqual(units.video_sr_units(60), 30)
        self.assertEqual(units.video_sr_units(3), 2)

    def test_estimate_matches_payloads(self):
        self.assertEqual(units.estimate("skin-analysis", payloads.skin_analysis()), 12)
        self.assertEqual(units.estimate("face-attr-analysis", payloads.face_attributes()), 20)
        self.assertEqual(units.estimate("face-reshape", {}), 1)


class PayloadTest(unittest.TestCase):
    def test_reshape_clamps_and_rejects(self):
        p = payloads.face_reshape({"nose_size": -140, "jaw": -5, "lip_size": 30})
        self.assertEqual(p["features"], {"nose_size": -100, "jaw": 0, "lip_size": 30})
        with self.assertRaises(ValueError):
            payloads.face_reshape({"nose_size": 0})
        with self.assertRaises(ValueError):
            payloads.face_reshape({"ear_size": 10})

    def test_makeup_shapes_follow_docs(self):
        f = payloads.foundation_effect("#c4967a")
        self.assertEqual(set(f["palettes"][0]), {"color", "colorIntensity", "glowIntensity", "coverageIntensity"})
        self.assertNotIn("pattern", f)
        lip = payloads.lip_effect("#A8545A")
        self.assertEqual(lip["style"], {"type": "full"})
        self.assertIn("shape", lip)
        with self.assertRaises(ValueError):
            payloads.makeup([f, payloads.foundation_effect("#000000")])
        with self.assertRaises(ValueError):
            payloads.foundation_effect("red")

    def test_skin_concerns_validated(self):
        with self.assertRaises(ValueError):
            payloads.skin_analysis(["acne", "hd_acne"])


class CacheTest(unittest.TestCase):
    def test_put_get_expire_and_purge(self):
        with tempfile.TemporaryDirectory() as tmp:
            c = ResultCache(Path(tmp), None, ttl_s=100)
            key = cache_key("sha1", "makeup-vto", {"b": 1, "a": 2})
            self.assertEqual(key, cache_key("sha1", "makeup-vto", {"a": 2, "b": 1}))
            c.put(key, CachedResult("makeup-vto", "sha1", {"url": "x"}, 1, b"IMG", "image/jpeg", 1000.0))
            self.assertEqual(c.get(key, now=1050).image, b"IMG")
            self.assertIsNone(c.get(key, now=1200))
            c.put(key, CachedResult("makeup-vto", "sha1", {}, 1, b"IMG", "image/jpeg", 1000.0))
            self.assertEqual(c.purge_image("sha1"), 1)
            self.assertEqual(list((Path(tmp) / "blobs").iterdir()), [])

    def test_spend_ledger(self):
        with tempfile.TemporaryDirectory() as tmp:
            c = ResultCache(Path(tmp))
            c.record_spend(12)
            c.record_spend(1)
            self.assertEqual(c.spent_on(), 13)
            self.assertEqual(c.spent_total(), 13)


class PhotoTest(unittest.TestCase):
    def test_exif_removed_and_rotation_applied(self):
        data, w, h = photos.normalise(jpeg(640, 800, exif=True))
        self.assertEqual((w, h), (800, 640))  # orientation 6 applied
        self.assertNotIn(b"SecretCameraMaker", data)
        self.assertEqual(len(Image.open(io.BytesIO(data)).getexif()), 0)

    def test_store_rejects_small_and_junk(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = photos.PhotoStore(Path(tmp))
            with self.assertRaises(PlumbError):
                store.put(jpeg(300, 300))
            with self.assertRaises(PlumbError):
                store.put(b"not an image")
            p = store.put(jpeg())
            self.assertEqual(store.get(p.sha).data, p.data)
            self.assertTrue(store.delete(p.sha))
            with self.assertRaises(PlumbError):
                store.get(p.sha)


class ImagingTest(unittest.TestCase):
    def test_honesty_meter(self):
        a = np.full((100, 100, 3), 120, np.uint8)
        b = a.copy()
        b[:25] = 200
        m = imaging.honesty_meter(imaging.to_jpeg(a), imaging.to_jpeg(b))
        self.assertAlmostEqual(m["changed_percent"], 25.0, delta=1.5)
        self.assertEqual(imaging.honesty_meter(imaging.to_jpeg(a), imaging.to_jpeg(a))["changed_percent"], 0.0)

    def test_label_is_burned_in(self):
        img = jpeg(640, 800, (255, 255, 255))
        out = Image.open(io.BytesIO(imaging.burn_label(img))).convert("RGB")
        bottom = np.asarray(out)[-5:].mean(axis=(0, 1))
        self.assertLess(bottom[0], 120)  # blue strip, not white


class SkinTest(unittest.TestCase):
    RESULTS = {"output": [
        {"type": "acne", "ui_score": 88, "raw_score": 92.3, "mask_urls": ["m"]},
        {"type": "moisture", "ui_score": 70, "raw_score": 48.7, "mask_urls": []},
        {"type": "pore", "ui_score": 84, "raw_score": 66.0, "mask_urls": []},
        {"type": "redness", "ui_score": 77, "raw_score": 72.0, "mask_urls": []},
        {"type": "unknown_new_type", "ui_score": 1, "raw_score": 1},
    ], "all": {"score": 75.7}, "skin_age": 37}

    def test_parse_sorts_by_measured_score(self):
        p = skin.parse(self.RESULTS)
        self.assertEqual([s["concern"] for s in p["scores"]], ["moisture", "pore", "redness", "acne"])
        self.assertEqual(p["overall"], 75.7)
        self.assertEqual(p["skin_age"], 37)
        self.assertEqual(p["scores"][0]["band"], "worth focusing on")

    def test_routine_rules(self):
        r = skin.routine(skin.parse(self.RESULTS)["scores"])
        self.assertEqual(r["focus"], ["Hydration", "Pores", "Redness"])
        self.assertEqual(r["morning"][-1]["id"], "sunscreen")
        names = [s["id"] for s in r["morning"] + r["evening"]]
        self.assertIn("hyaluronic_acid", names)
        self.assertIn("niacinamide", names)

    def test_one_retinoid_and_exfoliant_moves_to_alternate_nights(self):
        scores = [{"concern": "wrinkle", "label": "Lines", "raw_score": 40},
                  {"concern": "acne", "label": "Breakouts", "raw_score": 45},
                  {"concern": "texture", "label": "Texture", "raw_score": 50}]
        r = skin.routine(scores)
        groups = [skin.guide()["ingredients"][s["id"]]["group"] for s in r["evening"] if s["id"] in skin.guide()["ingredients"]]
        self.assertEqual(groups.count("retinoid"), 1)
        self.assertNotIn("exfoliant", groups)
        self.assertTrue(r["alternate_nights"])


class ProportionsTest(unittest.TestCase):
    def test_parse(self):
        p = proportions.parse({"faceshape": "Oval", "facialratio": {
            "face_aspect_ratio": [1, 1.46], "horizontal_third": [30, 36, 34],
            "upper_lip_to_lower_lip": [1, 1.3], "nose_aspect_ratio": "bad"}})
        by = {r["key"]: r for r in p["ratios"]}
        self.assertEqual(by["face_aspect_ratio"]["difference_percent"], 0.0)
        self.assertEqual(by["face_aspect_ratio"]["plain"], "Very close to the reference.")
        self.assertNotIn("nose_aspect_ratio", by)
        self.assertGreater(abs(by["horizontal_third"]["difference_percent"]), 2)
        text = " ".join(r["plain"] for r in p["ratios"]).lower()
        for word in ("ugly", "attractive", "beautiful", "flaw"):
            self.assertNotIn(word, text)


class ProcedureTest(unittest.TestCase):
    def test_snap_and_combine(self):
        plan = procedures.build_plan({"lip_filler": 44, "lip_reduce": 0, "rhino_bridge": 100, "brow_lift": 50})
        self.assertEqual({a["id"]: a["level"] for a in plan.applied}, {"lip_filler": 40, "rhino_bridge": 100, "brow_lift": 50})
        self.assertEqual(plan.reshape["lip_size"], 24)
        self.assertEqual(plan.reshape["nose_bridge_width"], -70)
        self.assertEqual(plan.local, [("brow_lift", 0.5)])
        self.assertEqual(plan.units, 1)
        self.assertTrue(any("past what usually looks natural" in w for w in plan.warnings))

    def test_unknown_procedures_are_refused(self):
        with self.assertRaises(ValueError):
            procedures.build_plan({"liposuction": 50})

    def test_every_youcam_param_is_valid(self):
        for p in procedures.CATALOGUE:
            if p.engine != "youcam":
                continue
            for name in p.params:
                self.assertIn(name, payloads.RESHAPE_PARAMS, p.id)


class WarpTest(unittest.TestCase):
    def test_tps_interpolates_control_points(self):
        rng = np.random.default_rng(0)
        out_pts = rng.random((12, 2))
        in_pts = out_pts + rng.normal(0, 0.01, (12, 2))
        tps = warp.TPS.fit(out_pts, in_pts)
        np.testing.assert_allclose(tps(out_pts), in_pts, atol=1e-4)

    def test_identity_when_nothing_moves(self):
        img = (np.random.default_rng(1).random((120, 100, 3)) * 255).astype(np.uint8)
        pts = np.array([[30.0, 40.0], [70.0, 80.0]])
        out = warp.warp(img, pts, pts, np.array([[50.0, 60.0]]))
        self.assertLess(np.abs(out.astype(int) - img.astype(int)).mean(), 1.0)

    def test_moved_content_lands_on_target(self):
        img = np.zeros((200, 200, 3), np.uint8)
        img[95:105, 95:105] = 255                       # white square centred at (100, 100)
        out = warp.warp(img, np.array([[100.0, 100.0]]), np.array([[100.0, 80.0]]),
                        np.array([[40.0, 40.0], [160.0, 160.0], [40.0, 160.0], [160.0, 40.0]]))
        ys, xs = np.nonzero(out[:, :, 0] > 128)
        self.assertAlmostEqual(ys.mean(), 80, delta=3)
        self.assertAlmostEqual(xs.mean(), 100, delta=3)

    def test_brow_lift_moves_brows_up_and_keeps_eyes(self):
        lm = np.random.default_rng(2).random((478, 2)) * 0.4 + 0.3
        lm[33], lm[263], lm[1] = [0.35, 0.45], [0.65, 0.45], [0.5, 0.55]
        moved, disp, pinned = warp.local_moves("brow_lift", lm * 1000, 1.0)
        self.assertTrue((disp[:, 1] < 0).all())
        self.assertIn(33, pinned)


if __name__ == "__main__":
    unittest.main()

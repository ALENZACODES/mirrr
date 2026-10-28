"""Photo studio (features 57, 58, 62, 63, 68) and illustration looks (67, 83, 84) on drawn
scenes with known ground truth: her pixels stay hers, the background is what changes, nothing
lightens her face, marks survive the illustration looks on six tones, refusals are coded and
the TypeScript vectors are current. Code-drawn faces only. Author: John Khan.
"""
from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

import numpy as np

from plumb_api.arena.synthetic import SKIN_TONES, drawn_face
from plumb_api.engines.core.filters import box_mean
from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.studio import authentic, backdrops, headshot, studio
from plumb_api.engines.studio.common import StudioRefusal, face_box
from plumb_api.engines.studio.synthetic import studio_scene
from plumb_api.filters.artistic.illustration import LOOKS, illustrate

API = Path(__file__).resolve().parents[1]
TONES = list(SKIN_TONES)


def face_l(image: np.ndarray, scene) -> float:
    x0, y0, x1, y1 = (int(v) for v in face_box(scene.points))
    region = box_mean(scene.person, 3)[y0:y1, x0:x1] >= 0.999   # her face away from the matte edge
    return float(srgb_to_lab(image[y0:y1, x0:x1, :3][region].astype(float))[:, 0].mean())


class VectorsTest(unittest.TestCase):
    def test_typescript_vectors_are_current(self):
        spec = importlib.util.spec_from_file_location("studio_vectors", API / "scripts" / "studio_vectors.py")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        self.assertEqual(json.dumps(module.vectors(), indent=1, sort_keys=True) + "\n",
                         module.TARGET.read_text(encoding="utf-8"))


class BackgroundTest(unittest.TestCase):
    def setUp(self):
        self.scene = studio_scene("tan")

    def test_her_pixels_stay_and_the_background_changes(self):
        inside = self.scene.person > 0.5
        for tool, kw in (("blur", {}), ("replace", {"backdrop": "quimper"})):
            r = studio.render(tool, self.scene.image, self.scene.person, **kw)
            self.assertEqual(r.metrics["person_changed_share"], 0.0, tool)
            far = ~inside & (np.abs(np.arange(inside.shape[1]) - inside.shape[1] / 2) > 0)[None, :]
            moved = np.any(r.image != self.scene.image, axis=2)
            self.assertGreater(moved[far].mean(), 0.5, tool)

    def test_blur_lowers_background_detail_and_strength_zero_is_a_no_op(self):
        r = studio.render("blur", self.scene.image, self.scene.person, strength=100)
        bg = self.scene.person < 0.5
        detail = lambda img: float(np.abs(img.astype(float) - box_mean(img.astype(float), 3))[bg].mean())  # noqa: E731
        self.assertLess(detail(r.image), detail(self.scene.image) * 0.7)
        same = studio.render("blur", self.scene.image, self.scene.person, strength=0)
        self.assertTrue(np.array_equal(same.image, self.scene.image))
        self.assertIn("no depth", r.label)

    def test_alpha_is_kept_and_remove_is_transparent(self):
        rgba = np.dstack([self.scene.image, np.full(self.scene.person.shape, 200, np.uint8)])
        for tool in ("blur", "replace"):
            r = studio.render(tool, rgba, self.scene.person)
            self.assertTrue(np.array_equal(r.image[..., 3], rgba[..., 3]), tool)
        cut = studio.render("remove", self.scene.image, self.scene.person)
        self.assertEqual(cut.image.shape[2], 4)
        self.assertTrue(np.all(cut.image[..., 3][self.scene.person == 0][:50] == 0))
        self.assertGreater((cut.image[..., 3][self.scene.person == 1] == 255).mean(), 0.9)

    def test_refusals_are_coded(self):
        for mask, code in ((None, "no_person_mask"), (np.zeros(self.scene.person.shape), "person_mask_unusable")):
            with self.assertRaises(StudioRefusal) as caught:
                studio.render("replace", self.scene.image, mask)
            self.assertEqual(caught.exception.code, code)
        for tool in ("relight", "headshot", "authentic"):
            with self.assertRaises(StudioRefusal) as caught:
                studio.render(tool, self.scene.image, self.scene.person, None)
            self.assertEqual(caught.exception.code, "no_face_points")
        with self.assertRaises(StudioRefusal):
            studio.render("blur", np.zeros((10, 10, 3), np.uint8), np.ones((10, 10)))


class BackdropTest(unittest.TestCase):
    def test_thirty_distinct_deterministic_backdrops(self):
        self.assertEqual(len(backdrops.BACKDROPS), 30)
        means = set()
        for bid in backdrops.BACKDROPS:
            a = backdrops.render_backdrop(bid, 40, 30)
            self.assertEqual(a.shape, (30, 40, 3))
            self.assertTrue(np.array_equal(a, backdrops.render_backdrop(bid, 40, 30)))
            means.add(tuple(np.round(a.mean(axis=(0, 1)))))
        self.assertEqual(len(means), 30)
        with self.assertRaises(ValueError):
            backdrops.render_backdrop("nowhere", 4, 4)


class LightTest(unittest.TestCase):
    def test_relight_shapes_without_lightening_on_six_tones(self):
        for tone in TONES:
            scene = studio_scene(tone)
            r = studio.render("relight", scene.image, scene.person, scene.points, strength=100, side="left")
            self.assertLessEqual(face_l(r.image, scene) - face_l(scene.image, scene), 0.5, tone)
            x0, y0, x1, y1 = (int(v) for v in face_box(scene.points))
            mid, cy = (x0 + x1) // 2, (y0 + y1) // 2
            left = r.image[cy, x0 + 3:mid].astype(float).mean() - scene.image[cy, x0 + 3:mid].astype(float).mean()
            right = r.image[cy, mid:x1 - 3].astype(float).mean() - scene.image[cy, mid:x1 - 3].astype(float).mean()
            self.assertGreater(left, right, tone)

    def test_headshot_per_industry(self):
        scene = studio_scene("medium", width=200, height=300)
        for industry in headshot.INDUSTRIES:
            r = studio.render("headshot", scene.image, scene.person, scene.points, industry=industry)
            self.assertEqual(r.metrics["retouch"], "even tone")
            self.assertEqual([c[0] for c in r.crops], ["square", "portrait-4x5"])
            for _, x, y, w, h in r.crops:
                self.assertTrue(0 <= x and 0 <= y and x + w <= 200 and y + h <= 300)
            self.assertAlmostEqual(r.crops[0][3] / r.crops[0][4], 1.0, places=1)
            self.assertAlmostEqual(r.crops[1][3] / r.crops[1][4], 0.8, places=1)
            self.assertLessEqual(face_l(r.image, scene) - face_l(scene.image, scene), 0.5, industry)
            back = scene.person < 0.5
            self.assertFalse(np.array_equal(r.image[back], scene.image[back]))
        self.assertIn("lighting simulation", r.label)

    def test_authenticity_keeps_her_on_six_tones(self):
        for tone in TONES:
            scene = studio_scene(tone)
            r = studio.render("authentic", scene.image, scene.person, scene.points, strength=100)
            self.assertTrue(r.metrics["still_her"], tone)
            self.assertLessEqual(r.metrics["lightness_change"], authentic.MAX_LIGHTER)
            self.assertEqual([c[0] for c in r.crops], ["portrait-4x5"])

    def test_still_her_catches_lightening_and_smoothing(self):
        scene = studio_scene("dark")
        x0, y0, x1, y1 = (int(v) for v in face_box(scene.points))
        region = np.zeros(scene.person.shape)
        region[y0:y1, x0:x1] = scene.person[y0:y1, x0:x1] > 0.5
        rgb = scene.image.astype(float)
        self.assertFalse(authentic.still_her(rgb, rgb * 1.15, region)["still_her"])
        flat = rgb.copy()
        flat[region > 0] = rgb[region > 0].mean(axis=0)
        self.assertFalse(authentic.still_her(rgb, flat, region)["still_her"])
        self.assertTrue(authentic.still_her(rgb, rgb, region)["still_her"])


class IllustrationTest(unittest.TestCase):
    def test_marks_stay_and_nothing_lightens_on_six_tones(self):
        for tone in TONES:
            face = drawn_face(tone, seed=3, width=200, height=240, freckles=6)
            for look in LOOKS:
                r = illustrate(look, face.image)
                self.assertEqual(r.metrics["geometry_displacement"], 0.0)
                self.assertLessEqual(r.metrics["mean_luma_change"], 0.5, (tone, look))
                grey = r.image.astype(float).mean(axis=2)
                for x, y, rad in face.marks:
                    xi, yi, k = int(round(x)), int(round(y)), int(3 * rad) + 2
                    ring = float(np.median(grey[yi - k:yi + k + 1, xi - k:xi + k + 1]))
                    self.assertGreater(ring - grey[yi, xi], 4, (tone, look))

    def test_amount_zero_is_the_photo_and_labels_say_illustration(self):
        face = drawn_face("medium", seed=2, width=80, height=96)
        for look in LOOKS:
            r = illustrate(look, face.image, {"amount": 0})
            self.assertTrue(np.array_equal(r.image, face.image))
            self.assertIn("Illustration filter", r.label)
        with self.assertRaises(ValueError):
            illustrate("anime-3d", face.image)


if __name__ == "__main__":
    unittest.main()

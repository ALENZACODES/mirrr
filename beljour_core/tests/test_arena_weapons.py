"""Quality weapons: Adaptive Strength, Identity Lock, Texture Graft, Best-of-N, and the producers."""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.arena import identity as I
from plumb_api.arena import marks as M
from plumb_api.arena import producers as P
from plumb_api.arena import weapons as W
from plumb_api.arena.synthetic import drawn_face
from plumb_api.engines.core.filters import box_mean


def smooth(image: np.ndarray, radius: int = 2) -> np.ndarray:
    return np.stack([np.clip(np.rint(box_mean(image[..., c].astype(float), radius)), 0, 255) for c in range(3)],
                    axis=-1).astype(np.uint8)


class ProducerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.face = drawn_face("medium", seed=2, width=180, height=216)

    def test_hero_filters_render_with_aligned_source(self) -> None:
        for filt, row in (("old", {}), ("young", {}), ("gender_swap", {"gender": "Female"})):
            edit = P.render(filt, self.face.image, self.face.points, strength=0.8, seed=3, row=row)
            self.assertEqual(edit.image.shape, self.face.image.shape)
            self.assertEqual(edit.aligned.shape, self.face.image.shape)
            self.assertEqual(edit.points_after.shape, self.face.points.shape)
            self.assertFalse(np.array_equal(edit.image, self.face.image), filt)

    def test_age_aligned_is_warp_only(self) -> None:
        edit = P.render("old", self.face.image, self.face.points, strength=1.0, seed=1)
        warp_only = P.render_age(self.face.image, self.face.points, stop=P.OLD_STOP, strength=1.0, seed=1,
                                 layers={"lines": 0, "texture": 0, "spots": 0, "colour": 0, "hair": 0})
        np.testing.assert_array_equal(edit.aligned, warp_only.image)

    def test_gender_needs_a_label_and_zero_strength_is_identity(self) -> None:
        with self.assertRaises(ValueError):
            P.render("gender_swap", self.face.image, self.face.points, row={"gender": ""})
        self.assertEqual(P.gender_direction("Male"), -1)
        edit = P.render_gender(self.face.image, self.face.points, direction=1, strength=0.0)
        np.testing.assert_array_equal(edit.image, self.face.image)
        with self.assertRaises(ValueError):
            P.render("old", self.face.image, self.face.points, strength=1.5)


class GraftTest(unittest.TestCase):
    def setUp(self) -> None:
        self.face = drawn_face("light", seed=6)
        self.skin = I.zones(self.face.points, self.face.image.shape[:2])["skin"]

    def test_lost_fine_detail_comes_back_inside_the_skin(self) -> None:
        soft = smooth(self.face.image, 2)
        out, info = W.texture_graft(soft, self.face.image, self.skin, amount=1.0)
        hf = lambda img: float(np.mean(W.fine_band(img)[self.skin >= 0.5] ** 2))  # noqa: E731
        self.assertGreater(hf(out), hf(soft) * 1.5)
        self.assertGreater(info["grafted_share"], 0)
        outside = self.skin < 0.01
        np.testing.assert_array_equal(out[outside], soft[outside])

    def test_added_detail_is_kept(self) -> None:
        lined = self.face.image.copy()
        y = int(self.face.points[9][1]) - 6
        lined[y, 60:140] = (lined[y, 60:140] * 0.6).astype(np.uint8)
        out, _ = W.texture_graft(lined, self.face.image, self.skin, amount=1.0)
        self.assertLess(float(out[y, 80:120].mean()), float(self.face.image[y, 80:120].mean()) - 10)

    def test_protected_marks_are_restored(self) -> None:
        scale = I.iod(self.face.points)
        found = M.find_marks(self.face.image, self.skin, scale)
        soft = smooth(self.face.image, 4)
        self.assertLess(M.retention(found, soft, scale).share, 0.6)
        out, info = W.texture_graft(soft, self.face.image, self.skin, amount=0.8,
                                    protect=M.mark_mask(found, self.face.image.shape[:2]))
        self.assertGreaterEqual(M.retention(found, out, scale).share, 0.8)
        self.assertGreater(info["mark_restore"], 0)
        with self.assertRaises(ValueError):
            W.texture_graft(soft, self.face.image, self.skin, amount=1.5)


class LockAndPipelineTest(unittest.TestCase):
    def setUp(self) -> None:
        self.face = drawn_face("tan", seed=7, width=180, height=216)

    def renderer(self, filt: str = "old", row=None):
        def make(overrides):
            return lambda s, seed: P.render(filt, self.face.image, self.face.points, strength=s, seed=seed,
                                            row=row or {}, overrides=overrides)
        return make

    def test_lock_lowers_strength_until_the_threshold(self) -> None:
        render = self.renderer("gender_swap", {"gender": "Female"})({})
        free = W.identity_lock(self.face.image, self.face.points, render, 1.0, 1, "gender_swap", threshold=1.0)
        self.assertFalse(free.locked)
        target = (free.score + 10.0) / 2  # stricter than what full strength reaches
        locked = W.identity_lock(self.face.image, self.face.points, render, 1.0, 1, "gender_swap", threshold=target)
        self.assertTrue(locked.locked)
        self.assertLess(locked.strength, 1.0)
        self.assertGreaterEqual(locked.score, target)
        self.assertTrue(locked.met)
        # without re-rendering, the lock blends toward the geometry-aligned original: that can
        # win back texture and colour (OLD) but never geometry (gender swap is geometry only)
        old = self.renderer("old")({})
        full = W.identity_lock(self.face.image, self.face.points, old, 1.0, 1, "old", threshold=1.0)
        aligned_score = I.identity_score(self.face.image, full.edit.aligned, points_before=self.face.points,
                                         points_after=full.edit.points_after, filter_name="old").score
        goal = (full.score + aligned_score) / 2
        blended = W.identity_lock(self.face.image, self.face.points, old, 1.0, 1, "old", threshold=goal, can_rerender=False)
        self.assertEqual(blended.method, "blend")
        self.assertTrue(blended.met)
        self.assertGreaterEqual(blended.score, goal)
        stuck = W.identity_lock(self.face.image, self.face.points, render, 1.0, 1, "gender_swap", threshold=target,
                                can_rerender=False)
        self.assertFalse(stuck.met)

    def test_adaptive_strength_rules(self) -> None:
        dark = W.read_face(drawn_face("very_dark", seed=1).image, drawn_face("very_dark", seed=1).points)
        plan = W.adaptive_strength("old", dark)
        self.assertLess(plan.overrides["layers"].get("lines", 1.0), 1.0)
        self.assertTrue(any("darker skin" in r for r in plan.reasons))
        reading = W.read_face(self.face.image, self.face.points)
        glasses = W.FaceReading(**{**reading.__dict__, "eye_edges": 5.0, "yaw": 0.4})
        g = W.adaptive_strength("gender_swap", glasses, 1.0)
        self.assertEqual(g.overrides["regions"]["eyes"], 0.5)
        self.assertAlmostEqual(g.strength, 0.75)
        smooth_young = W.FaceReading(**{**reading.__dict__, "line_energy": 0.0})
        self.assertAlmostEqual(W.adaptive_strength("young", smooth_young).strength, 0.6)

    def test_candidate_strengths(self) -> None:
        self.assertEqual(W.candidate_strengths(1.0), [0.8, 0.8667, 0.9333, 1.0])
        self.assertEqual(len(set(W.candidate_strengths(0.5))), 4)
        self.assertTrue(all(0 < s <= 1 for s in W.candidate_strengths(0.02)))
        with self.assertRaises(ValueError):
            W.candidate_strengths(0.5, 0)

    def test_pipeline_is_seeded_and_picks_a_usable_candidate(self) -> None:
        a = W.run_pipeline(self.face.image, self.face.points, "old", self.renderer("old"), seed=9)
        b = W.run_pipeline(self.face.image, self.face.points, "old", self.renderer("old"), seed=9)
        self.assertEqual(len(a.candidates), W.BEST_OF_N)
        np.testing.assert_array_equal(a.best.edit.image, b.best.edit.image)
        self.assertEqual(a.best.refused, "")
        self.assertEqual(a.best.rank_score, max(c.rank_score for c in a.candidates if not c.refused))
        trace = a.trace()
        self.assertEqual(len(trace["candidates"]), 4)
        self.assertIn("chosen", trace)


if __name__ == "__main__":
    unittest.main()

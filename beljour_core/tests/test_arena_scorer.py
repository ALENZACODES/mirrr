"""Identity score, marks, the six-dimension proxies and the unrequested-change checks."""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.arena import identity as I
from plumb_api.arena import marks as M
from plumb_api.arena import scorer
from plumb_api.arena.synthetic import SKIN_TONES, drawn_face
from plumb_api.engines.core.filters import box_mean


def blur(image: np.ndarray, radius: int = 2) -> np.ndarray:
    return np.stack([np.clip(np.rint(box_mean(image[..., c].astype(float), radius)), 0, 255) for c in range(3)],
                    axis=-1).astype(np.uint8)


class IdentityTest(unittest.TestCase):
    def setUp(self) -> None:
        self.face = drawn_face("medium", seed=3)

    def test_unchanged_face_scores_ten(self) -> None:
        s = I.identity_score(self.face.image, self.face.image, points_before=self.face.points,
                             points_after=self.face.points, filter_name="old")
        self.assertAlmostEqual(s.score, 10.0, places=6)
        self.assertTrue(s.used_landmarks)

    def test_moving_protected_landmarks_lowers_geometry(self) -> None:
        moved = self.face.points.copy()
        moved[I.L["nose_tip"]] += (0, 0.06 * I.iod(self.face.points))
        self.assertLess(I.geometry_similarity(self.face.points, moved, "old"), 0.6)
        # the jaw is not protected for OLD: moving it leaves the signature alone
        jaw = self.face.points.copy()
        jaw[152] += (0, 5)
        self.assertAlmostEqual(I.geometry_similarity(self.face.points, jaw, "old"), 1.0)

    def test_skin_tone_shift_lowers_colour_and_score(self) -> None:
        lighter = np.clip(self.face.image.astype(int) + 30, 0, 255).astype(np.uint8)
        s = I.identity_score(self.face.image, lighter, points_before=self.face.points, points_after=self.face.points)
        self.assertGreater(s.delta_e, 5)
        self.assertLess(s.score, 9.5)

    def test_lbp_codes_and_uniform_bins(self) -> None:
        flat = np.full((5, 5), 10.0)
        self.assertTrue(np.all(I.lbp(flat)[1:-1, 1:-1] == 255))
        self.assertEqual(int(I.UNIFORM.max()), 58)
        self.assertEqual(len(set(I.UNIFORM[I.UNIFORM < 58].tolist())), 58)

    def test_works_without_landmarks(self) -> None:
        s = I.identity_score(self.face.image, blur(self.face.image), filter_name="young")
        self.assertFalse(s.used_landmarks)
        self.assertIsNone(s.geometry)
        self.assertLess(s.score, 10)


class MarksTest(unittest.TestCase):
    def test_marks_found_on_every_skin_tone(self) -> None:
        for tone in SKIN_TONES:
            face = drawn_face(tone, seed=2)
            skin = I.zones(face.points, face.image.shape[:2])["skin"]
            found = M.find_marks(face.image, skin, I.iod(face.points))
            hits = sum(any((m.x - x) ** 2 + (m.y - y) ** 2 < (2 * r + 2) ** 2 for m in found) for x, y, r in face.marks)
            self.assertGreaterEqual(hits, 8, f"{tone}: {hits} of 10 drawn marks found")

    def test_retention_drops_when_marks_are_smoothed_away(self) -> None:
        face = drawn_face("light", seed=5)
        skin = I.zones(face.points, face.image.shape[:2])["skin"]
        scale = I.iod(face.points)
        found = M.find_marks(face.image, skin, scale)
        self.assertEqual(M.retention(found, face.image, scale).share, 1.0)
        smooth = blur(face.image, 4)
        self.assertLess(M.retention(found, smooth, scale).share, 0.5)

    def test_marks_follow_the_warp(self) -> None:
        face = drawn_face("tan", seed=1)
        after = face.points + np.array([3.0, -2.0])
        mark = M.Mark(100.0, 120.0, 2.0, 0.2, 9)
        moved = M.displaced([mark], face.points, after)[0]
        self.assertAlmostEqual(moved.x, 103.0)
        self.assertAlmostEqual(moved.y, 118.0)
        self.assertEqual(M.displaced([mark], None, None), [mark])


class ScorerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.face = drawn_face("dark", seed=4)
        self.skin = I.zones(self.face.points, self.face.image.shape[:2])["skin"]

    def score(self, after: np.ndarray, filt: str = "old", points_after=None) -> scorer.ImageScores:
        return scorer.score_image(self.face.image, after, filt, points_before=self.face.points,
                                  points_after=self.face.points if points_after is None else points_after)

    def test_flattering_has_no_proxy_and_fairness_is_not_per_image(self) -> None:
        s = self.score(self.face.image)
        self.assertIsNone(s.flattering)
        self.assertNotIn("fairness", scorer.as_judge_scores(s))
        self.assertEqual(s.flags, [])
        self.assertEqual(scorer.likely_reason(s, "old"), "Too Weak", "an untouched photo is too weak a result")

    def test_smoothing_reads_as_plastic_and_erases_marks(self) -> None:
        s = self.score(blur(self.face.image, 3), "young")
        self.assertLess(s.realism, 7)
        self.assertIn("marks erased", s.flags)
        self.assertEqual(scorer.likely_reason(s, "young"), "Not Her / Erased Marks")

    def test_skin_lightening_is_flagged_unless_asked(self) -> None:
        light = self.face.image.astype(float)
        light += 25 * self.skin[..., None]
        light = np.clip(light, 0, 255).astype(np.uint8)
        self.assertIn("skin lightened", self.score(light, "old").flags)
        self.assertNotIn("skin lightened", self.score(light, "tan_remove").flags)
        everything = np.clip(self.face.image.astype(int) + 25, 0, 255).astype(np.uint8)
        self.assertNotIn("skin lightened", self.score(everything, "old").flags, "a whole-photo exposure change is not skin lightening")

    def test_face_slimming_is_flagged_except_for_gender_swap(self) -> None:
        pts = self.face.points.copy()
        centre = pts[:, 0].mean()
        pts[:, 0] = centre + (pts[:, 0] - centre) * 0.95
        pts[[468, 473]] = self.face.points[[468, 473]]  # pupils stay, so IOD is unchanged
        self.assertIn("face slimmed", self.score(self.face.image, "young", pts).flags)
        self.assertNotIn("face slimmed", self.score(self.face.image, "gender_swap", pts).flags)

    def test_outside_change_lowers_artifact_score(self) -> None:
        noisy = self.face.image.astype(int)
        noisy[:, :20] = 255 - noisy[:, :20]
        s = self.score(np.clip(noisy, 0, 255).astype(np.uint8))
        self.assertLess(s.artifact_free, 6)
        self.assertEqual(scorer.likely_reason(s, "old"), "Warped Glasses/Ears/Background")

    def test_judged_quality_charges_for_no_visible_effect(self) -> None:
        s = self.score(self.face.image)
        self.assertAlmostEqual(scorer.judged_quality(s, "old"), scorer.overall(s) - 1.0)


if __name__ == "__main__":
    unittest.main()

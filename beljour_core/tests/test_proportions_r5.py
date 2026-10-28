"""R5 start of E10: anatomy table, symmetry analysis and targets, proportion ratios, on
synthetic 478-point faces (no photos). Includes plan M20's check: region asymmetry drops by
strength x (1 +/- 10%) (here exactly), and an E06 warp driven by the symmetry targets.
Author: John Khan.
"""
import importlib.util
import math
import re
import unittest
from pathlib import Path

import numpy as np

from plumb_api.engines.core import regions
from plumb_api.engines.proportions import anatomy, ratios, symmetry, synthetic
from plumb_api.engines.warp import field as fields
from plumb_api.engines.warp import fold
from plumb_api.engines.warp.mls import mls_field

ROOT = Path(__file__).resolve().parents[2]


def sync_module():
    spec = importlib.util.spec_from_file_location("sync_r5_data_under_test", ROOT / "scripts" / "sync_r5_data.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class AnatomyTest(unittest.TestCase):
    def test_derived_pairs_contain_the_legacy_table(self):
        derived = anatomy.contour_pairs()
        flat = {p for pairs in derived.values() for p in pairs}
        for region in ("eyes", "brows", "mouth", "jaw"):
            for pair in anatomy.FEATURE_PAIRS[region]:
                self.assertIn(pair, flat, (region, pair))

    def test_pairs_are_valid_and_disjoint(self):
        used = set()
        for name, pairs in anatomy.region_pairs().items():
            for r, l in pairs:
                self.assertTrue(0 <= r < anatomy.MESH_POINTS and 0 <= l < anatomy.MESH_POINTS)
                self.assertNotEqual(r, l)
                self.assertNotIn(r, used, name)
                self.assertNotIn(l, used, name)
                used |= {r, l}
        self.assertFalse(used & set(anatomy.MIDLINE))
        self.assertEqual(len(set(anatomy.MIDLINE)), len(anatomy.MIDLINE))
        self.assertEqual(set(anatomy.region_pairs()), set(anatomy.SYMMETRY_REGIONS))

    def test_lip_and_outline_mirrors_follow_the_loops(self):
        pairs = anatomy.contour_pairs()
        self.assertIn((regions.LIPS_OUTER[0], regions.LIPS_OUTER[10]), pairs["lips"])
        self.assertIn((234, 454), pairs["outline"])
        self.assertEqual(len(pairs["outline"]), len(regions.FACE_OVAL) // 2 - 1)

    def test_generated_typescript_table_is_current(self):
        sync = sync_module()
        self.assertEqual((ROOT / "web/src/data/face/generated/anatomy.ts").read_text(), sync.source())

    def test_ratio_references(self):
        self.assertAlmostEqual(anatomy.PHI, 1.6180339887, places=9)
        for key, (label, parts, refs) in anatomy.RATIOS.items():
            self.assertTrue(label and parts)
            self.assertEqual(set(refs), {"classical", "golden"})


class SymmetryTest(unittest.TestCase):
    def setUp(self):
        self.face = synthetic.symmetric_face()
        self.shifted = synthetic.with_asymmetry(self.face, {"eyes": (3.0, -2.0), "jaw": (-4.0, 0.0)})

    def test_a_mirror_symmetric_face_reads_zero(self):
        rep = symmetry.analyse(self.face)
        self.assertLess(rep.mean, 1e-12)
        self.assertAlmostEqual(rep.tilt_degrees, 0.0, places=9)
        self.assertTrue(rep.facing_camera)
        self.assertAlmostEqual(rep.iod, 88.0)
        self.assertEqual(len(rep.regions), len(anatomy.SYMMETRY_REGIONS))

    def test_shifts_are_measured_in_iod_with_signs(self):
        rep = symmetry.analyse(self.shifted)
        eyes, jaw = rep.region("eyes"), rep.region("jaw")
        self.assertAlmostEqual(eyes.across, -3 / 88)
        self.assertAlmostEqual(eyes.along, 2 / 88)
        self.assertAlmostEqual(eyes.mean, math.hypot(3, 2) / 88)
        self.assertAlmostEqual(jaw.across, 4 / 88)
        self.assertLess(rep.region("nose").mean, 1e-12)
        self.assertEqual(len(rep.pairs), sum(r.pairs for r in rep.regions))
        self.assertIn("regions", rep.to_json())
        with self.assertRaises(KeyError):
            rep.region("ears")

    def test_roll_does_not_change_the_reading(self):
        flat = symmetry.analyse(self.shifted)
        tilted = symmetry.analyse(synthetic.rolled(self.shifted, 14.0))
        for a, b in zip(flat.regions, tilted.regions):
            self.assertAlmostEqual(a.mean, b.mean, places=9)
            self.assertAlmostEqual(a.across, b.across, places=9)
        self.assertAlmostEqual(abs(tilted.tilt_degrees), 14.0, delta=0.6)

    def test_targets_shrink_asymmetry_by_exactly_one_minus_strength(self):
        before = symmetry.analyse(self.shifted)
        for side in symmetry.SIDES:
            for strength in (0.0, 0.25, 0.6, 1.0):
                after = symmetry.analyse(symmetry.targets(self.shifted, strength, side=side))
                for a, b in zip(before.regions, after.regions):
                    self.assertAlmostEqual(b.mean, (1 - strength) * a.mean, places=9, msg=(side, strength, a.name))

    def test_master_side_and_region_choice(self):
        moved = symmetry.targets(self.shifted, 1.0, side="right", regions=["eyes"])
        for r, l in anatomy.region_pairs()["eyes"]:
            np.testing.assert_allclose(moved[r], self.shifted[r])
        jaw_left = [l for _, l in anatomy.region_pairs()["jaw"]]
        np.testing.assert_allclose(moved[jaw_left], self.shifted[jaw_left])
        with self.assertRaises(ValueError):
            symmetry.targets(self.shifted, 1.5)
        with self.assertRaises(ValueError):
            symmetry.targets(self.shifted, 0.5, side="middle")
        with self.assertRaises(ValueError):
            symmetry.analyse(self.shifted, ["ears"])

    def test_targets_drive_a_fold_free_warp(self):
        """E06 link: symmetry targets become MLS similarity handles; the warp stays fold-free."""
        h, w = 500, 400
        after = symmetry.targets(self.shifted, 0.8)
        src, dst, moved = symmetry.controls(self.shifted, after)
        self.assertTrue(moved)
        anchors = synthetic.symmetric_face()[[10, 152, 234, 454]]
        f = mls_field(h, w, np.vstack([src, anchors]), np.vstack([dst, anchors]), mode="similarity", step=8)
        self.assertTrue(fold.fold_report(f).passed)
        self.assertGreater(fields.move_stats(f).max_move, 1.0)

    def test_yaw_and_short_meshes(self):
        turned = self.face.copy()
        turned[anatomy.LANDMARKS["nose_tip"]] += (30.0, 0.0)
        rep = symmetry.analyse(turned)
        self.assertFalse(rep.facing_camera)
        self.assertGreater(rep.yaw_share, 0.08)
        short = symmetry.analyse(self.face[:468])
        self.assertAlmostEqual(short.iod, 88.0)
        with self.assertRaises(ValueError):
            symmetry.analyse(self.face[:100])
        bad = self.face.copy()
        bad[5, 0] = np.nan
        with self.assertRaises(ValueError):
            symmetry.analyse(bad)


class RatiosTest(unittest.TestCase):
    def setUp(self):
        self.face = synthetic.symmetric_face()

    def test_known_layout_is_measured(self):
        rep = ratios.measure(self.face, "classical")
        np.testing.assert_allclose(rep.ratio("thirds").value, [0.30, 0.36, 0.34], atol=1e-12)
        self.assertAlmostEqual(rep.ratio("eye_width_gap").value, 1.0)
        self.assertAlmostEqual(rep.ratio("nose_width_gap").value, 1.0)
        self.assertAlmostEqual(rep.ratio("mouth_nose_width").value, 1.5)
        self.assertAlmostEqual(rep.ratio("upper_lower_lip").value, 1.0)
        self.assertAlmostEqual(sum(rep.ratio("fifths").value), 1.0)
        self.assertAlmostEqual(rep.ratio("mouth_nose_width").difference_percent, 0.0)
        self.assertEqual(rep.ratio("mouth_nose_width").plain, "Close to the reference.")
        self.assertIsNone(rep.ratio("face_length_width").difference_percent)

    def test_golden_set_and_differences(self):
        rep = ratios.measure(self.face, "golden")
        mouth = rep.ratio("mouth_nose_width")
        self.assertAlmostEqual(mouth.difference_percent, 100 * (1.5 - anatomy.PHI) / anatomy.PHI)
        self.assertEqual(mouth.plain, "A little below the reference.")   # -7.3%, under the 8% line
        self.assertIsNone(rep.ratio("thirds").reference)
        self.assertAlmostEqual(ratios.difference([0.3, 0.36, 0.34], [1, 1, 1]), 100 * (0.30 - 1 / 3))

    def test_roll_and_scale_do_not_change_ratios(self):
        a = ratios.measure_values(self.face)[1]
        b = ratios.measure_values(synthetic.rolled(self.face * 1.7, -11.0))[1]
        for key in a:
            np.testing.assert_allclose(np.asarray(b[key]), np.asarray(a[key]), atol=1e-9, err_msg=key)

    def test_custom_set_and_validation(self):
        rep = ratios.measure(self.face, "custom", {"thirds": [1, 1, 1], "lips_chin": 0.5})
        self.assertIsNotNone(rep.ratio("thirds").difference_percent)
        self.assertIsNone(rep.ratio("fifths").reference)
        for bad in ({"thirds": [1, 1]}, {"lips_chin": -1}, {"ears": 1.0}, {"lips_chin": True}):
            with self.assertRaises(ValueError):
                ratios.measure(self.face, "custom", bad)
        with self.assertRaises(ValueError):
            ratios.measure(self.face, "perfect")

    def test_copy_has_no_score_or_medical_words(self):
        rep = ratios.measure(self.face, "golden")
        text = " ".join([rep.note] + [r.plain + r.label + r.parts for r in rep.ratios])
        self.assertIn("nothing here is a score", text)
        for pattern in (r"\bbeauty\b", r"\bsurg", r"\bclini", r"\bflaw", r"\battractive"):
            self.assertIsNone(re.search(pattern, text, re.I), pattern)


if __name__ == "__main__":
    unittest.main()

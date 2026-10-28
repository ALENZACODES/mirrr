"""services/tps.py (NumPy thin plate spline with fold checks) and services/fibre.py (fibre
cover prototype)."""
import unittest

import numpy as np

from plumb_api.services import fibre, tps
from plumb_api.services.shade import ciede2000, hex_to_lab, rgb_to_lab


class SplineTest(unittest.TestCase):
    def test_fits_control_points_exactly(self):
        src = np.array([[0, 0], [10, 0], [0, 10], [10, 10], [5, 5]], float)
        dst = src + np.array([[0, 0], [0, 0], [0, 0], [0, 0], [1.5, -2.0]])
        spline = tps.Spline.fit(src, dst)
        np.testing.assert_allclose(spline(src), dst, atol=1e-6)

    def test_needs_three_points_and_matching_shapes(self):
        with self.assertRaises(ValueError):
            tps.Spline.fit(np.zeros((2, 2)), np.zeros((2, 2)))
        with self.assertRaises(ValueError):
            tps.Spline.fit(np.zeros((4, 2)), np.zeros((3, 2)))

    def test_affine_moves_are_reproduced(self):
        src = np.array([[0, 0], [10, 0], [0, 10], [10, 10]], float)
        spline = tps.Spline.fit(src, src * 2 + 3)
        np.testing.assert_allclose(spline(np.array([[5.0, 5.0]])), [[13.0, 13.0]], atol=1e-6)


class WarpTest(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(0)
        self.img = (rng.random((60, 80, 3)) * 255).astype(np.uint8)

    def test_no_move_is_the_identity(self):
        pts = np.array([[40.0, 30.0], [20.0, 20.0]])
        out, check = tps.warp(self.img, pts, pts)
        self.assertLessEqual(np.abs(out.astype(int) - self.img.astype(int)).max(), 1)
        self.assertAlmostEqual(check.min_jacobian, 1.0, places=3)
        self.assertAlmostEqual(check.max_move_px, 0.0, places=6)
        self.assertEqual(check.moved_share, 0.0)

    def test_small_move_is_safe_and_measured(self):
        out, check = tps.warp(self.img, np.array([[40.0, 30.0]]), np.array([[43.0, 30.0]]), reference_length=80)
        self.assertEqual(out.shape, self.img.shape)
        self.assertGreater(check.min_jacobian, 0.5)
        self.assertAlmostEqual(check.max_move_px, 3.0, delta=0.6)
        self.assertAlmostEqual(check.max_move_share, check.max_move_px / 80, places=6)

    def test_crossing_moves_are_caught_as_a_fold(self):
        src = np.array([[30.0, 30.0], [50.0, 30.0]])
        dst = np.array([[52.0, 30.0], [28.0, 30.0]])   # the two points swap sides
        _, check = tps.warp(self.img, src, dst)
        self.assertLess(check.min_jacobian, 0.0)

    def test_greyscale_and_border_pins(self):
        grey = self.img[..., 0]
        out, _ = tps.warp(grey, np.array([[40.0, 30.0]]), np.array([[41.0, 31.0]]))
        self.assertEqual(out.shape, grey.shape)
        pins = tps.border_pins(80, 60, per_side=4)
        self.assertEqual(len(pins), 5 * 2 + 3 * 2)
        self.assertTrue((pins[:, 0] <= 79).all() and (pins[:, 1] <= 59).all())


class FibreTest(unittest.TestCase):
    def setUp(self):
        self.crown = fibre.synthetic_crown(240, 240)
        self.zone = fibre.ellipse_mask(240, 240, 0.5, 0.45, 0.22, 0.2)

    def test_lab_array_matches_the_scalar_formula(self):
        rng = np.random.default_rng(5)
        for rgb in rng.integers(0, 256, (20, 3)):
            got = fibre.rgb_to_lab_array(rgb[None, :].astype(np.uint8))[0]
            np.testing.assert_allclose(got, rgb_to_lab(tuple(int(v) for v in rgb)), atol=1e-6)

    def test_two_means_splits_dark_from_light(self):
        values = np.vstack([np.full((50, 3), 20.0), np.full((30, 3), 80.0)])
        labels, centres = fibre.two_means(values)
        self.assertEqual(labels[:50].tolist(), [0] * 50)
        self.assertEqual(labels[50:].tolist(), [1] * 30)
        self.assertLess(centres[0, 0], centres[1, 0])
        with self.assertRaises(ValueError):
            fibre.two_means(np.zeros((1, 3)))

    def test_zone_reading_finds_the_hair_colour(self):
        reading, _ = fibre.read_zone(self.crown, self.zone)
        self.assertGreater(reading.scalp_share, 0.05)
        self.assertLess(reading.scalp_share, 0.6)
        self.assertLess(ciede2000(reading.hair_lab, rgb_to_lab((58, 42, 33))), 3.0)
        self.assertEqual(reading.pixels, int(self.zone.sum()))
        self.assertTrue(reading.hair_hex.startswith("#"))

    def test_each_level_hides_more_scalp(self):
        reading, centres = fibre.read_zone(self.crown, self.zone)
        shares = []
        for level in ("light", "medium", "full"):
            out = fibre.render_cover(self.crown, self.zone, centres, "#3B2A22", level)
            self.assertTrue((out[~self.zone] == self.crown[~self.zone]).all())   # only the zone changes
            shares.append(fibre.read_zone(out, self.zone, centres=centres)[0].scalp_share)
        self.assertGreater(reading.scalp_share, shares[0])
        self.assertGreater(shares[0], shares[1])
        self.assertGreater(shares[1], shares[2])
        with self.assertRaises(ValueError):
            fibre.render_cover(self.crown, self.zone, centres, "#3B2A22", "extreme")

    def test_shade_match_is_sorted_and_generic(self):
        rows = fibre.shade_match(hex_to_lab("#5A4030"), top=8)
        self.assertEqual(rows[0]["id"], "FB3")
        self.assertEqual(rows[0]["delta_e"], 0.0)
        self.assertEqual([r["delta_e"] for r in rows], sorted(r["delta_e"] for r in rows))
        self.assertEqual(len({r["id"] for r in rows}), 8)

    def test_strand_noise_range(self):
        n = fibre.strand_noise(50, 70)
        self.assertEqual(n.shape, (50, 70))
        self.assertAlmostEqual(float(n.min()), 0.0)
        self.assertAlmostEqual(float(n.max()), 1.0)


if __name__ == "__main__":
    unittest.main()

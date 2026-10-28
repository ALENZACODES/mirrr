"""R5 E07 fill part 1: fast marching, PatchMatch-lite, biharmonic fill, the wrapper and
its engine, with seam (Q4) and outside-hole (Q1) checks on synthetic images.
Author: John Khan.
"""
import unittest

import numpy as np

from plumb_api.engines.core.engine import run_engine
from plumb_api.engines.fill import biharmonic as bh
from plumb_api.engines.fill import fill as wrapper
from plumb_api.engines.fill import fmm, patchmatch as pm
from plumb_api.quality import metrics


def disc(h, w, cx, cy, r):
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r).astype(np.float32)


def stripes(h, w, period=6):
    yy, xx = np.mgrid[0:h, 0:w]
    phase = (xx + 2 * yy) % period
    img = np.stack([60 + 25 * phase, 200 - 20 * phase, 90 + 10 * (phase % 2)], -1)
    return img.astype(np.uint8)


def smooth_photo(h, w):
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    r = 90 + 80 * xx / w + 20 * np.sin(yy / 9)
    g = 70 + 60 * yy / h
    b = 120 + 40 * np.cos((xx + yy) / 14)
    return np.clip(np.rint(np.stack([r, g, b], -1)), 0, 255).astype(np.uint8)


class FastMarchingTest(unittest.TestCase):
    def test_linear_ramps_are_reproduced_exactly(self):
        yy, xx = np.mgrid[0:24, 0:30].astype(float)
        ramp = np.stack([0.2 + 0.01 * xx, 0.7 - 0.02 * yy + 0.005 * xx], -1)
        hole = disc(24, 30, 14, 12, 6)
        damaged = np.where(hole[..., None] > 0, 0.0, ramp)
        res = fmm.fast_marching(damaged, hole, radius=4)
        np.testing.assert_allclose(res.image, ramp, atol=1e-9)

    def test_order_arrival_and_flat_fill(self):
        hole = disc(20, 20, 10, 10, 5)
        res = fmm.fast_marching(np.full((20, 20), 0.4), hole, gradient=False)
        np.testing.assert_allclose(res.image, 0.4, atol=1e-12)
        self.assertEqual(sorted(res.order), np.flatnonzero(hole.ravel() > 0).tolist())
        self.assertTrue(np.all(res.arrival[hole == 0] == 0))
        self.assertTrue(np.all(res.arrival[hole > 0] > 0.5))
        self.assertGreater(res.arrival[10, 10], res.arrival[10, 6])
        arrivals = [res.arrival.ravel()[i] for i in res.order]
        # the march starts at the edge and reaches the centre last
        self.assertLessEqual(max(arrivals[:len(arrivals) // 4]), 1.5)
        self.assertEqual(res.order[-1], 10 * 20 + 10)

    def test_values_stay_within_the_known_range_without_gradient(self):
        rng = np.random.default_rng(3)
        values = rng.uniform(0.2, 0.6, (18, 22, 3))
        hole = disc(18, 22, 11, 9, 4)
        res = fmm.fast_marching(values, hole, gradient=False)
        inside = res.image[hole > 0]
        self.assertGreaterEqual(inside.min(), 0.2)
        self.assertLessEqual(inside.max(), 0.6)
        self.assertTrue(np.array_equal(res.image[hole == 0], values[hole == 0]))

    def test_validation(self):
        with self.assertRaises(ValueError):
            fmm.fast_marching(np.zeros((4, 4)), np.ones((4, 4)))
        with self.assertRaises(ValueError):
            fmm.fast_marching(np.zeros((4, 4)), np.zeros((4, 4)), radius=0)
        with self.assertRaises(ValueError):
            fmm.fast_marching(np.zeros((4, 4, 5)), np.zeros((4, 4)))
        with self.assertRaises(ValueError):
            fmm.fast_marching(np.full((4, 4), np.nan), np.zeros((4, 4)))
        with self.assertRaises(ValueError):
            fmm.fast_marching(np.full((4, 4, 2), np.nan), np.zeros((4, 4)))


class PatchMatchTest(unittest.TestCase):
    def test_xorshift_and_rounding(self):
        rng = pm.XorShift32(1)
        first = [rng.next() for _ in range(3)]
        self.assertEqual(first, [pm.XorShift32(1).next(), *first[1:]])
        self.assertTrue(all(0 < v < 2 ** 32 for v in first))
        self.assertNotEqual(pm.XorShift32(2).next(), first[0])
        self.assertEqual(pm.XorShift32(0).state, (0x9E3779B9))
        self.assertEqual([pm.round_div(5, 2), pm.round_div(7, 2), pm.round_div(7, 3), pm.round_div(8, 3)], [2, 4, 2, 3])
        with self.assertRaises(ValueError):
            pm.XorShift32(-1)

    def test_onion_peel_fills_inwards(self):
        img = np.full((9, 9, 3), 100, np.uint8)
        img[4, 4] = 0
        hole = np.zeros((9, 9), bool)
        hole[3:6, 3:6] = True
        out = pm.onion_peel(img, hole)
        self.assertTrue(np.all(out == 100))

    def test_periodic_texture_is_restored_exactly(self):
        truth = stripes(40, 44)
        hole = disc(40, 44, 22, 20, 5)
        damaged = truth.copy()
        damaged[hole > 0] = [255, 0, 255]
        res = pm.patchmatch(damaged, hole, patch_radius=3, iterations=6, seed=7)
        self.assertTrue(np.array_equal(res.image, truth))
        self.assertEqual(res.mean_distance[-1], 0.0)
        self.assertEqual(len(res.targets), len(res.matches))

    def test_deterministic_and_alpha_kept(self):
        truth = smooth_photo(32, 32)
        rgba = np.concatenate([truth, np.full((32, 32, 1), 200, np.uint8)], -1)
        hole = disc(32, 32, 16, 16, 4)
        a = pm.patchmatch(rgba, hole, seed=3)
        b = pm.patchmatch(rgba, hole, seed=3)
        self.assertTrue(np.array_equal(a.image, b.image))
        self.assertTrue(np.all(a.image[..., 3] == 200))
        self.assertTrue(np.array_equal(a.image[hole == 0], rgba[hole == 0]))
        history = a.mean_distance
        self.assertLessEqual(history[-1], history[0])

    def test_no_sources_and_bad_args(self):
        img = smooth_photo(8, 8)
        with self.assertRaises(ValueError):
            pm.patchmatch(img, disc(8, 8, 4, 4, 2), patch_radius=3)
        with self.assertRaises(ValueError):
            pm.patchmatch(img, np.zeros((8, 8)), patch_radius=0)
        with self.assertRaises(ValueError):
            pm.patchmatch(img.astype(np.float32), np.zeros((8, 8)))
        empty = pm.patchmatch(img, np.zeros((8, 8)))
        self.assertTrue(np.array_equal(empty.image, img))


class BiharmonicTest(unittest.TestCase):
    def test_cubic_surfaces_are_reproduced(self):
        yy, xx = np.mgrid[0:30, 0:34].astype(float)
        surface = 0.3 + 0.002 * xx ** 2 - 0.001 * xx * yy + 0.00005 * yy ** 3 + 0.01 * yy
        hole = disc(30, 34, 17, 15, 7)
        damaged = np.where(hole > 0, 0.0, surface)
        res = bh.biharmonic(damaged, hole)
        self.assertTrue(res.converged)
        np.testing.assert_allclose(res.image, surface, atol=1e-7)
        self.assertEqual(res.box, (8, 6, 26, 24))

    def test_multichannel_and_untouched_outside(self):
        rng = np.random.default_rng(8)
        values = rng.uniform(0, 1, (16, 18, 3))
        hole = disc(16, 18, 9, 8, 3)
        res = bh.biharmonic(values, hole)
        self.assertTrue(np.array_equal(res.image[hole == 0], values[hole == 0]))
        self.assertEqual(len(res.iterations), 3)
        self.assertTrue(np.all(np.isfinite(res.image)))

    def test_laplacian_and_onion_mean(self):
        u = np.arange(12, dtype=float).reshape(3, 4) ** 2
        lap = bh.laplacian(u)
        self.assertAlmostEqual(float(lap.sum()), 0.0)
        hole = np.zeros((5, 5), bool)
        hole[2, 2] = True
        plane = np.full((5, 5), 3.0)
        self.assertEqual(bh.onion_mean(plane, hole)[2, 2], 3.0)

    def test_validation(self):
        with self.assertRaises(ValueError):
            bh.biharmonic(np.zeros((5, 5)), np.ones((5, 5)))
        with self.assertRaises(ValueError):
            bh.biharmonic(np.zeros((5, 5)), np.zeros((5, 5)), tolerance=0)


class FillWrapperTest(unittest.TestCase):
    def setUp(self):
        self.truth = smooth_photo(40, 48)
        self.hole = disc(40, 48, 24, 20, 6)
        self.damaged = self.truth.copy()
        self.damaged[self.hole > 0] = [250, 10, 250]

    def test_every_method_changes_only_the_hole_and_has_no_seam(self):
        for method in wrapper.METHODS:
            out = wrapper.fill(self.damaged, self.hole, method)
            self.assertEqual(out.method, method)
            self.assertEqual(out.hole_pixels, int((self.hole > 0).sum()))
            self.assertTrue(metrics.q1_outside_mask(self.damaged, out.image, self.hole, dilate_px=0).passed, method)
            seam = metrics.q4_seam(self.truth, out.image, self.hole)
            self.assertTrue(seam.passed, (method, seam.measured))
            error = np.abs(out.image.astype(int) - self.truth.astype(int))[self.hole > 0].mean()
            self.assertLess(error, 12, method)

    def test_smooth_methods_beat_the_damage_by_far(self):
        bihar = wrapper.fill(self.damaged, self.hole, "biharmonic")
        error = np.abs(bihar.image.astype(int) - self.truth.astype(int))[self.hole > 0].mean()
        self.assertLess(error, 3)
        self.assertIn("iterations", bihar.details)

    def test_grow_widens_the_hole(self):
        out = wrapper.fill(self.damaged, self.hole, "fast-marching", grow=2)
        self.assertGreater(out.hole_pixels, int((self.hole > 0).sum()))
        with self.assertRaises(ValueError):
            wrapper.fill(self.damaged, self.hole, "fast-marching", grow=-1)
        with self.assertRaises(ValueError):
            wrapper.fill(self.damaged, self.hole, "lama")
        empty = wrapper.fill(self.damaged, np.zeros((40, 48)), "biharmonic")
        self.assertEqual(empty.hole_pixels, 0)

    def test_engine_through_the_contract(self):
        for method in wrapper.METHODS:
            res = run_engine(wrapper.FillEngine(), self.damaged, None, {"hole": self.hole},
                             {"method": method}, seed=5)
            self.assertEqual(res.pipelineVersion, wrapper.VERSION)
            self.assertEqual(res.metrics["hole_pixels"], float((self.hole > 0).sum()))
        with self.assertRaises(ValueError):
            run_engine(wrapper.FillEngine(), self.damaged, None, {}, {"method": "biharmonic"})


if __name__ == "__main__":
    unittest.main()

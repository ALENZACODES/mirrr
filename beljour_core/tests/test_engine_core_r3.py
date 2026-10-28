"""R3 E04 core: filters, distance, guided feathering, regions, pyramids, blending, resampling.
Author: John Khan.
"""
import math
import unittest

import numpy as np

from plumb_api.engines.core import blending, colour, composite, distance, filters, guided, masks, pyramid, regions, resample
from plumb_api.quality import metrics
from plumb_api.services import tps

RNG = np.random.default_rng(7)


class FiltersTest(unittest.TestCase):
    def test_reflect101(self):
        self.assertEqual(list(filters.reflect101(np.arange(-3, 7), 4)), [3, 2, 1, 0, 1, 2, 3, 2, 1, 0])
        self.assertEqual(list(filters.reflect101(np.array([-5, 0, 9]), 1)), [0, 0, 0])
        with self.assertRaises(ValueError):
            filters.reflect101(np.array([0]), 0)

    def test_box_mean_matches_brute_force(self):
        img = RNG.random((7, 9))
        for r in (1, 2, 4):
            pad = np.pad(img, r, mode="edge")
            brute = np.array([[pad[y:y + 2 * r + 1, x:x + 2 * r + 1].mean() for x in range(9)] for y in range(7)])
            np.testing.assert_allclose(filters.box_mean(img, r), brute, atol=1e-12)
        np.testing.assert_array_equal(filters.box_mean(img, 0), img)
        with self.assertRaises(ValueError):
            filters.box_mean(img, 513)
        with self.assertRaises(ValueError):
            filters.box_mean(np.array([[np.nan]]), 1)

    def test_box_mean_channels_independent(self):
        img = RNG.random((5, 6, 3))
        out = filters.box_mean(img, 1)
        for c in range(3):
            np.testing.assert_allclose(out[..., c], filters.box_mean(img[..., c], 1))

    def test_convolve_reflect101(self):
        row = np.array([[1.0, 2.0, 3.0, 4.0]])
        out = filters.convolve(row, np.array([1.0, 0.0, 0.0]), axis=1)    # out[i] = x[i-1]
        np.testing.assert_array_equal(out, [[2.0, 1.0, 2.0, 3.0]])
        with self.assertRaises(ValueError):
            filters.convolve(row, np.array([1.0, 1.0]), axis=1)
        with self.assertRaises(ValueError):
            filters.convolve(row, np.array([1.0]), axis=2)

    def test_gradient_matches_numpy(self):
        img = RNG.random((6, 5))
        gx, gy = filters.gradient(img)
        np.testing.assert_allclose(gx, np.gradient(img, axis=1))
        np.testing.assert_allclose(gy, np.gradient(img, axis=0))
        flat = filters.gradient(np.ones((1, 1)))
        self.assertEqual(float(flat[0][0, 0]), 0.0)

    def test_quantile_matches_numpy(self):
        data = RNG.random(37)
        for q in (0, 0.1, 0.5, 0.9, 1):
            self.assertAlmostEqual(filters.quantile(data, q), float(np.quantile(data, q)), places=12)
        with self.assertRaises(ValueError):
            filters.quantile(np.array([]), 0.5)


class DistanceTest(unittest.TestCase):
    def test_edt_matches_brute_force(self):
        for _ in range(60):
            h, w = RNG.integers(1, 12, 2)
            on = RNG.random((h, w)) < 0.15
            got = distance.squared_edt(on)
            if not on.any():
                self.assertTrue((got == -1).all())
                continue
            ys, xs = np.nonzero(on)
            yy, xx = np.mgrid[:h, :w]
            brute = ((yy[..., None] - ys) ** 2 + (xx[..., None] - xs) ** 2).min(-1)
            np.testing.assert_array_equal(got, brute)

    def test_distance_to_and_inside(self):
        m = masks.rectangle(9, 9, 3, 3, 6, 6)
        d = distance.distance_to(m)
        self.assertEqual(d[4, 4], 0)
        self.assertEqual(d[4, 0], 3)
        self.assertAlmostEqual(d[0, 0], math.hypot(3, 3))
        inside = distance.distance_inside(m)
        self.assertEqual(inside[4, 4], 2)
        self.assertEqual(inside[0, 0], 0)
        self.assertTrue(np.isinf(distance.distance_to(masks.empty(3, 3))).all())
        self.assertTrue(np.isinf(distance.distance_inside(masks.full(3, 3))).all())

    def test_dilate_is_a_disc(self):
        dot = masks.empty(11, 11)
        dot[5, 5] = 1
        disc = distance.dilate(dot, 3)
        yy, xx = np.mgrid[:11, :11]
        np.testing.assert_array_equal(disc, ((yy - 5) ** 2 + (xx - 5) ** 2 <= 9).astype(np.float32))
        self.assertEqual(int(distance.dilate(dot, 0).sum()), 1)

    def test_erode_undoes_dilate_on_a_large_square(self):
        square = masks.rectangle(20, 20, 6, 6, 14, 14)
        np.testing.assert_array_equal(distance.erode(distance.dilate(square, 2), 2), square)
        self.assertEqual(float(distance.erode(square, 10).sum()), 0.0)

    def test_feather_modes(self):
        square = masks.rectangle(24, 24, 6, 6, 18, 18)
        inside = distance.feather(square, 4, "inside")
        self.assertTrue(np.all(inside[square == 0] == 0), "inside feather must not leak")
        self.assertEqual(float(inside[12, 12]), 1.0)
        outside = distance.feather(square, 4, "outside")
        self.assertTrue(np.all(outside[square == 1] == 1))
        self.assertGreater(float(outside[12, 4]), 0)
        centred = distance.feather(square, 4, "centered")
        self.assertGreater(float(centred[12, 6]), 0.5)
        self.assertLess(float(centred[12, 5]), 0.5)
        row = inside[12, :12]
        self.assertTrue(np.all(np.diff(row) >= 0), "ramp rises towards the centre")
        np.testing.assert_array_equal(distance.feather(square, 0), square)
        with self.assertRaises(ValueError):
            distance.feather(square, 2, "sideways")
        with self.assertRaises(ValueError):
            distance.dilate(square, -1)


class GuidedTest(unittest.TestCase):
    def test_constant_guide_is_a_double_box_blur(self):
        src = RNG.random((10, 12))
        flat = np.full((10, 12), 0.4)
        expected = filters.box_mean(filters.box_mean(src, 2), 2)     # a = 0, q = mean(b) = mean(mean(p))
        np.testing.assert_allclose(guided.guided_filter(flat, src, 2, 1e-3), expected, atol=1e-9)

    def test_softens_without_crossing_the_photo_edge(self):
        h = w = 32
        guide_img = np.zeros((h, w, 3), np.uint8)
        guide_img[:, 16:] = 230                                    # the photo's edge at x = 16
        truth = masks.rectangle(h, w, 16, 0, w, h)
        coarse = truth.copy()
        for y in range(h):                                         # a jagged segmenter edge, +-2 px
            coarse[y] = 0
            coarse[y, 16 + (y * 7) % 5 - 2:] = 1
        refined = guided.edge_aware_feather(coarse, guide_img, radius=4, eps=1e-4)
        blurred = masks.blur(coarse, 4)
        self.assertLess(np.abs(refined - truth).mean(), 0.6 * np.abs(blurred - truth).mean())
        self.assertLess(float(refined[:, 15].mean()), 0.3)
        self.assertGreater(float(refined[:, 16].mean()), 0.7)
        self.assertTrue(0.3 < float(blurred[:, 15].mean()) < 0.7, "a box blur straddles the edge")

    def test_colour_guide_separates_equal_luma(self):
        h, w = 16, 16
        img = np.zeros((h, w, 3), np.uint8)
        img[:, :8] = (200, 40, 40)
        img[:, 8:] = (40, 120, 40)                   # different hue, similar brightness
        coarse = masks.rectangle(h, w, 6, 0, w, h)
        grey = (img @ np.array([0.2126, 0.7152, 0.0722]) / 255)
        colour_out = guided.edge_aware_feather(coarse, img, radius=3, eps=1e-4)
        grey_out = guided.edge_aware_feather(coarse, grey, radius=3, eps=1e-4)
        self.assertLess(float(colour_out[8, 6]), float(grey_out[8, 6]))

    def test_band_limits_change(self):
        coarse = masks.rectangle(20, 20, 5, 5, 15, 15)
        noisy = RNG.integers(0, 256, (20, 20, 3), dtype=np.uint8)
        out = guided.edge_aware_feather(coarse, noisy, radius=2, band=1.0)
        strip = guided.edge_band(coarse, 1.0)
        np.testing.assert_array_equal(out[~strip], coarse[~strip])
        self.assertFalse(guided.edge_band(masks.full(4, 4), 2).any())

    def test_validation(self):
        with self.assertRaises(ValueError):
            guided.guided_filter(np.zeros((4, 4)), np.zeros((4, 5)), 1, 1e-3)
        with self.assertRaises(ValueError):
            guided.guided_filter(np.zeros((4, 4)), np.zeros((4, 4)), 0, 1e-3)
        with self.assertRaises(ValueError):
            guided.guided_filter(np.zeros((4, 4)), np.zeros((4, 4)), 1, 0)
        with self.assertRaises(ValueError):
            guided.as_guide(np.zeros((3, 3, 2)))


def mesh(n: int = 478) -> np.ndarray:
    """Normalised synthetic Face Mesh with every contour on its own ellipse."""
    pts = np.tile([0.5, 0.5], (n, 1))
    shapes = {"face_oval": (0.5, 0.5, 0.35, 0.45), "lips_outer": (0.5, 0.75, 0.12, 0.05),
              "lips_inner": (0.5, 0.75, 0.07, 0.015), "right_eye": (0.35, 0.4, 0.07, 0.03),
              "left_eye": (0.65, 0.4, 0.07, 0.03), "right_brow": (0.35, 0.32, 0.08, 0.02),
              "left_brow": (0.65, 0.32, 0.08, 0.02)}
    for name, (cx, cy, rx, ry) in shapes.items():
        loop = regions.CONTOURS[name]
        for k, i in enumerate(loop):
            a = 2 * math.pi * k / len(loop)
            pts[i] = (cx + rx * math.cos(a), cy + ry * math.sin(a))
    if n == 478:
        for centre, edge, cx in ((468, (469, 470, 471, 472), 0.35), (473, (474, 475, 476, 477), 0.65)):
            pts[centre] = (cx, 0.4)
            for k, i in enumerate(edge):
                a = math.pi / 2 * k
                pts[i] = (cx + 0.02 * math.cos(a), 0.4 + 0.02 * math.sin(a))
    return pts


class RegionsTest(unittest.TestCase):
    def test_axis_aligned_square_is_exact(self):
        m = regions.polygon(10, 10, [(2, 3), (7, 3), (7, 8), (2, 8)])
        np.testing.assert_array_equal(m, masks.rectangle(10, 10, 2, 3, 7, 8))

    def test_half_pixel_edges_are_anti_aliased(self):
        m = regions.polygon(6, 6, [(1.5, 1), (4, 1), (4, 4), (1.5, 4)], supersample=4)
        self.assertEqual(float(m[2, 1]), 0.5)
        self.assertEqual(float(m[2, 2]), 1.0)

    def test_area_converges(self):
        tri = [(1.0, 1.0), (30.0, 4.0), (8.0, 27.0)]
        exact = abs((30 - 1) * (27 - 1) - (4 - 1) * (8 - 1)) / 2
        self.assertAlmostEqual(float(regions.polygon(32, 32, tri, 8).sum()), exact, delta=exact * 0.01)

    def test_even_odd_star_has_a_hole(self):
        star = [(16 + 14 * math.cos(math.radians(90 + 144 * k)), 16 - 14 * math.sin(math.radians(90 + 144 * k)))
                for k in range(5)]
        m = regions.polygon(32, 32, star, 4)
        self.assertEqual(float(m[16, 16]), 0.0)
        self.assertEqual(float(m[5, 16]), 1.0)

    def test_crossings_and_validation(self):
        verts = np.array([[0, 0], [4, 0], [4, 4], [0, 4]], float)
        np.testing.assert_array_equal(regions.scanline_crossings(verts, 2.0), [0.0, 4.0])
        self.assertEqual(regions.scanline_crossings(verts, 4.0).size, 0)
        with self.assertRaises(ValueError):
            regions.polygon(4, 4, [(0, 0), (1, 1)])
        with self.assertRaises(ValueError):
            regions.polygon(4, 4, [(0, 0), (1, 1), (0, 1)], supersample=0)
        self.assertEqual(float(regions.polygon(4, 4, [(10, 10), (12, 10), (12, 12)]).sum()), 0.0)

    def test_face_regions(self):
        pts = mesh()
        h, w = 120, 100
        lips = regions.region_mask("lips", pts, h, w)
        opening = regions.region_mask("mouth_opening", pts, h, w)
        self.assertEqual(float(lips[90, 50]), 0.0, "mouth opening excluded")
        self.assertGreater(float(opening[90, 50]), 0.9)
        self.assertGreater(float(lips[90, 40]), 0.9)
        skin = regions.region_mask("skin", pts, h, w)
        self.assertEqual(float(skin[48, 35]), 0.0, "eye excluded from skin")
        self.assertGreater(float(skin[65, 50]), 0.9, "cheek area kept")
        irises = regions.region_mask("irises", pts, h, w)
        self.assertGreater(float(irises[48, 35]), 0.9)
        self.assertEqual(float(irises[48, 50]), 0.0)
        for name in regions.REGIONS:
            self.assertGreater(float(regions.region_mask(name, pts, h, w).sum()), 0, name)

    def test_landmark_input_forms(self):
        pts = mesh()
        as_dicts = [{"x": float(x), "y": float(y), "z": 0.0} for x, y in pts]
        a = regions.region_mask("face_oval", pts, 60, 50)
        b = regions.region_mask("face_oval", as_dicts, 60, 50)
        c = regions.region_mask("face_oval", pts * [50, 60], 60, 50, normalized=False)
        np.testing.assert_array_equal(a, b)
        np.testing.assert_array_equal(a, c)

    def test_errors(self):
        with self.assertRaises(ValueError):
            regions.region_mask("irises", mesh(468), 40, 40)
        with self.assertRaises(ValueError):
            regions.region_mask("ears", mesh(), 40, 40)
        with self.assertRaises(ValueError):
            regions.region_mask("lips", mesh()[:100], 40, 40)


class PyramidTest(unittest.TestCase):
    def test_sizes_and_constants(self):
        img = np.full((13, 10, 3), 0.25)
        small = pyramid.down(img)
        self.assertEqual(small.shape, (7, 5, 3))
        np.testing.assert_allclose(small, 0.25)
        np.testing.assert_allclose(pyramid.up(small, 13, 10), 0.25)
        with self.assertRaises(ValueError):
            pyramid.up(small, 20, 10)

    def test_laplacian_round_trip(self):
        for shape in ((17, 23), (8, 8, 3), (1, 5), (31, 2)):
            img = RNG.random(shape)
            bands = pyramid.laplacian(img, 5)
            np.testing.assert_allclose(pyramid.collapse(bands), img, atol=1e-12)

    def test_levels(self):
        self.assertEqual(pyramid.max_levels(64, 64, 8), 4)
        self.assertEqual(pyramid.max_levels(5, 5, 8), 1)
        self.assertEqual(len(pyramid.gaussian(np.zeros((4, 4)), 10)), 3)
        with self.assertRaises(ValueError):
            pyramid.gaussian(np.zeros((4, 4)), 0)

    def test_high_frequency_finds_texture_not_flat(self):
        self.assertTrue(np.allclose(pyramid.high_frequency(np.full((9, 9), 0.7)), 0))
        noise = RNG.random((16, 16))
        self.assertGreater(float((pyramid.high_frequency(noise) ** 2).mean()), 0.01)


class BlendingTest(unittest.TestCase):
    def px(self, *rgb):
        return np.array([rgb], dtype=np.float64)

    def test_separable_values(self):
        cb, cs = self.px(0.5, 0.2, 1.0), self.px(0.5, 0.8, 0.0)
        np.testing.assert_allclose(blending.mode_float(cb, cs, "multiply"), self.px(0.25, 0.16, 0))
        np.testing.assert_allclose(blending.mode_float(cb, cs, "screen"), self.px(0.75, 0.84, 1))
        np.testing.assert_allclose(blending.mode_float(cb, cs, "difference"), self.px(0, 0.6, 1))
        np.testing.assert_allclose(blending.mode_float(cb, cs, "exclusion"), self.px(0.5, 0.68, 1))
        np.testing.assert_allclose(blending.mode_float(cb, cs, "normal"), cs)

    def test_dodge_and_burn_edges(self):
        zero, one, half = self.px(0, 0, 0), self.px(1, 1, 1), self.px(0.5, 0.5, 0.5)
        np.testing.assert_array_equal(blending.mode_float(zero, one, "color-dodge"), zero)
        np.testing.assert_array_equal(blending.mode_float(half, one, "color-dodge"), one)
        np.testing.assert_array_equal(blending.mode_float(one, zero, "color-burn"), one)
        np.testing.assert_array_equal(blending.mode_float(half, zero, "color-burn"), zero)

    def test_overlay_is_hard_light_swapped(self):
        a, b = RNG.random((5, 3)), RNG.random((5, 3))
        np.testing.assert_allclose(blending.mode_float(a, b, "overlay"), blending.mode_float(b, a, "hard-light"))

    def test_soft_light_keeps_base_at_half(self):
        base = RNG.random((6, 3))
        np.testing.assert_allclose(blending.mode_float(base, np.full((6, 3), 0.5), "soft-light"), base)

    def test_colour_mode_keeps_base_luminance(self):
        base, top = RNG.uniform(0.1, 0.9, (20, 3)), RNG.uniform(0.1, 0.9, (20, 3))
        out = blending.mode_float(base, top, "color")
        np.testing.assert_allclose(blending.lum(out), blending.lum(base), atol=1e-9)
        lumi = blending.mode_float(base, top, "luminosity")
        np.testing.assert_allclose(blending.lum(lumi), blending.lum(top), atol=1e-9)
        grey = np.full((1, 3), 0.4)
        np.testing.assert_allclose(blending.mode_float(grey, grey, "hue"), grey)

    def test_apply_mode(self):
        base = RNG.integers(0, 256, (6, 7, 3), dtype=np.uint8)
        top = RNG.integers(0, 256, (6, 7, 4), dtype=np.uint8)
        np.testing.assert_array_equal(blending.apply_mode(base, top, "multiply", opacity=0), base)
        mask = masks.rectangle(6, 7, 0, 0, 3, 6)
        out = blending.apply_mode(base, top, "screen", mask=mask, space="linear")
        np.testing.assert_array_equal(out[:, 3:], base[:, 3:])
        rgba = np.dstack([base, np.full((6, 7), 77, np.uint8)])
        self.assertTrue((blending.apply_mode(rgba, top, "color")[..., 3] == 77).all())
        for bad in ({"opacity": 2}, {"space": "cmyk"}):
            with self.assertRaises(ValueError):
                blending.apply_mode(base, top, "multiply", **bad)
        with self.assertRaises(ValueError):
            blending.mode_float(self.px(0, 0, 0), self.px(0, 0, 0), "glow")

    def test_multiband_extremes_and_seam(self):
        h, w = 32, 32
        a = np.zeros((h, w, 3), np.uint8)
        a[:] = (60, 70, 80)
        b = a.copy()
        b[:] = (200, 150, 120)
        b[::2, ::2] = (215, 160, 130)                       # fine texture on the overlay
        np.testing.assert_array_equal(blending.multiband_blend(a, b, masks.full(h, w)), b)
        np.testing.assert_array_equal(blending.multiband_blend(a, b, masks.empty(h, w)), a)
        hard = masks.rectangle(h, w, 16, 0, w, h)
        seam_mb = metrics.q4_seam(a, blending.multiband_blend(a, b, hard), hard).measured["seam"]
        seam_alpha = metrics.q4_seam(a, composite.blend(a, b, hard), hard).measured["seam"]
        self.assertLess(seam_mb, seam_alpha)
        with self.assertRaises(ValueError):
            blending.multiband_blend(a, b[:, :8], hard)


class ResampleTest(unittest.TestCase):
    def test_identity_and_shift(self):
        img = RNG.integers(0, 256, (8, 9, 3), dtype=np.uint8)
        mx, my = resample.identity(8, 9)
        np.testing.assert_array_equal(resample.remap(img, mx, my), img)
        np.testing.assert_array_equal(resample.remap(img, mx, my, linear_light=False), img)
        shifted = resample.remap(img, mx + 1, my)
        np.testing.assert_array_equal(shifted[:, :-1], img[:, 1:])

    def test_linear_light_is_brighter_between_dark_and_light(self):
        img = np.zeros((1, 2, 3), np.uint8)
        img[0, 1] = 255
        mx, my = np.array([[0.5]]), np.array([[0.0]])
        lin = int(resample.remap(img, mx, my)[0, 0, 0])
        srgb = int(resample.remap(img, mx, my, linear_light=False)[0, 0, 0])
        self.assertEqual(srgb, 128)
        self.assertEqual(lin, 188)              # encode(0.5): no dark fringe

    def test_constant_border_and_premultiplied_alpha(self):
        img = np.full((4, 4, 3), 200, np.uint8)
        mx, my = resample.identity(4, 4)
        out = resample.remap(img, mx - 0.5, my, border="constant")
        self.assertLess(int(out[0, 0, 0]), 200)
        self.assertEqual(int(out[0, 2, 0]), 200)
        rgba = np.zeros((1, 2, 4), np.uint8)
        rgba[0, 0] = (255, 0, 0, 255)
        rgba[0, 1] = (0, 255, 0, 0)              # transparent green must not tint the red
        mid = resample.remap(rgba, np.array([[0.5]]), np.array([[0.0]]))
        self.assertEqual(tuple(int(v) for v in mid[0, 0]), (255, 0, 0, 128))
        with self.assertRaises(ValueError):
            resample.remap(img, mx, my, border="wrap")
        with self.assertRaises(ValueError):
            resample.remap(img, mx, my[:2])

    def test_jacobian(self):
        mx, my = resample.identity(6, 6)
        np.testing.assert_allclose(resample.jacobian_determinant(mx, my), 1)
        np.testing.assert_allclose(resample.jacobian_determinant(mx * 2, my * 0.5), 1)
        self.assertLess(float(resample.jacobian_determinant(-mx, my).max()), 0)

    def test_tps_uses_linear_light_for_colour(self):
        img = np.zeros((40, 40, 3), np.uint8)
        img[:, 20:] = 255
        src, dst = np.array([[20.0, 20.0]]), np.array([[21.5, 20.0]])
        lin, _ = tps.warp(img, src, dst)
        old, _ = tps.warp(img, src, dst, linear_light=False)
        self.assertGreaterEqual(int(lin[20, 20, 0]), int(old[20, 20, 0]))
        grey, _ = tps.warp(img[..., 0], src, dst)
        self.assertEqual(grey.ndim, 2)


class ColourR3Test(unittest.TestCase):
    def test_oklab_reference(self):
        white = colour.rgb_to_oklab((255, 255, 255))
        self.assertAlmostEqual(white[0], 1.0, places=6)
        self.assertAlmostEqual(white[1], 0.0, places=6)
        red = colour.rgb_to_oklab((255, 0, 0))     # Ottosson's published value
        for got, want in zip(red, (0.62796, 0.22486, 0.12585)):
            self.assertAlmostEqual(got, want, places=4)
        back = colour.oklab_to_rgb(colour.rgb_to_oklab((12, 200, 77)))
        self.assertLess(max(abs(a - b) for a, b in zip(back, (12, 200, 77))), 1e-3)

    def test_mix_oklab(self):
        a, b = (10, 20, 200), (240, 200, 10)
        self.assertLess(max(abs(x - y) for x, y in zip(colour.mix_oklab(a, b, 0), a)), 1e-3)
        self.assertLess(max(abs(x - y) for x, y in zip(colour.mix_oklab(a, b, 1), b)), 1e-3)
        mid = colour.mix_oklab(a, b, 0.5)
        self.assertTrue(all(0 <= v <= 255 for v in mid))
        with self.assertRaises(ValueError):
            colour.mix_oklab(a, b, 1.5)

    def test_lab_array_matches_scalar(self):
        px = RNG.integers(0, 256, (10, 3))
        arr = colour.srgb_to_lab_array(px)
        for row, lab in zip(px, arr):
            np.testing.assert_allclose(lab, colour.rgb_to_lab(row), atol=1e-9)
        with self.assertRaises(ValueError):
            colour.srgb_to_lab_array(np.zeros((2, 2)))


class ResizeTest(unittest.TestCase):
    def test_area_weights_partition_each_output(self):
        for source, target in ((10, 3), (7, 7), (9, 4), (5, 1)):
            weights = resample._area_weights(source, target)
            np.testing.assert_allclose(weights.sum(axis=1), 1)
            np.testing.assert_allclose(weights.sum(axis=0), target / source)

    def test_area_average_is_in_linear_light(self):
        checker = np.zeros((2, 2, 3), np.uint8)
        checker[0, 0] = checker[1, 1] = 255
        self.assertEqual(int(resample.resize_area(checker, 1, 1)[0, 0, 0]), 188)
        same = RNG.integers(0, 256, (6, 5, 3), dtype=np.uint8)
        np.testing.assert_array_equal(resample.resize_area(same, 5, 6), same)

    def test_area_respects_alpha(self):
        rgba = np.zeros((1, 2, 4), np.uint8)
        rgba[0, 0] = (255, 0, 0, 255)
        rgba[0, 1] = (0, 255, 0, 0)
        self.assertEqual(tuple(int(v) for v in resample.resize_area(rgba, 1, 1)[0, 0]), (255, 0, 0, 128))

    def test_bilinear_and_dispatch(self):
        flat = np.full((4, 4, 3), 90, np.uint8)
        np.testing.assert_array_equal(resample.resize_bilinear(flat, 9, 7), np.full((7, 9, 3), 90, np.uint8))
        img = RNG.integers(0, 256, (6, 8, 3), dtype=np.uint8)
        np.testing.assert_array_equal(resample.resize_bilinear(img, 8, 6), img)
        self.assertEqual(resample.resize(img, 4, 3).shape, (3, 4, 3))
        self.assertEqual(resample.resize(img, 16, 3).shape, (3, 16, 3))
        with self.assertRaises(ValueError):
            resample.resize_area(img, 9, 3)
        with self.assertRaises(ValueError):
            resample.resize_bilinear(img, 0, 3)


class LchTest(unittest.TestCase):
    def test_round_trip_and_grey(self):
        lab = (52.0, 30.0, -40.0)
        lch = colour.lab_to_lch(lab)
        self.assertAlmostEqual(lch[1], 50.0)
        self.assertTrue(0 <= lch[2] < 360)
        for got, want in zip(colour.lch_to_lab(lch), lab):
            self.assertAlmostEqual(got, want)
        self.assertEqual(colour.lab_to_lch((40, 0, 0)), (40, 0.0, 0.0))
        with self.assertRaises(ValueError):
            colour.lch_to_lab((50, -1, 0))

    def test_rotate_hue_keeps_lightness(self):
        rgb = (180, 60, 70)
        for turn in (0, 360):
            self.assertLess(max(abs(a - b) for a, b in zip(colour.rotate_hue(rgb, turn), rgb)), 1e-3)
        turned = colour.rotate_hue(rgb, 120)
        self.assertAlmostEqual(colour.rgb_to_oklab(turned)[0], colour.rgb_to_oklab(rgb)[0], delta=0.02)
        self.assertGreater(turned[1], rgb[1])


if __name__ == "__main__":
    unittest.main()

"""R5 E06 warp: fields, thin plate spline, moving least squares, Delaunay, piecewise affine,
fold checks, falloff and the warp engine. Synthetic inputs only.
Author: John Khan.
"""
import math
import unittest

import numpy as np

from plumb_api.engines.core.engine import run_engine
from plumb_api.engines.proportions import symmetry, synthetic
from plumb_api.engines.warp import falloff, fold, mesh, mls, piecewise, triangulate
from plumb_api.engines.warp import field as fields
from plumb_api.engines.warp.engine import WarpEngine, build_field
from plumb_api.engines.warp.tps import ThinPlateSpline, border_pins, forward_spline, tps_field
from plumb_api.services import tps as service


def similarity(points, angle, s, tx, ty):
    c, d = math.cos(angle) * s, math.sin(angle) * s
    p = np.asarray(points, dtype=float)
    return np.stack([c * p[:, 0] - d * p[:, 1] + tx, d * p[:, 0] + c * p[:, 1] + ty], 1)


def checker(h, w, cell=4):
    yy, xx = np.mgrid[0:h, 0:w]
    on = ((xx // cell + yy // cell) % 2).astype(np.uint8)
    img = np.stack([40 + 180 * on, 90 + 60 * on, 200 - 120 * on], -1)
    return img.astype(np.uint8)


class FieldTest(unittest.TestCase):
    def test_grid_nodes_cover_the_image(self):
        gx, gy = fields.grid_nodes(10, 13, 4)
        self.assertEqual(gx.tolist(), [0, 4, 8, 12, 16])
        self.assertEqual(gy.tolist(), [0, 4, 8, 12])
        gx1, gy1 = fields.grid_nodes(3, 5, 1)
        self.assertEqual(len(gx1), 5)
        self.assertEqual(len(gy1), 3)
        for bad in (0, 65, 2.5, True):
            with self.assertRaises(ValueError):
                fields.grid_nodes(4, 4, bad)

    def test_function_fields_match_exact_evaluation_on_affine_maps(self):
        def fn(x, y):
            return 0.9 * x + 0.1 * y + 2, -0.05 * x + 1.1 * y - 1
        coarse = fields.from_function(17, 23, fn, 4)
        exact = fields.from_function(17, 23, fn, 1)
        np.testing.assert_allclose(coarse.map_x, exact.map_x, atol=1e-9)
        np.testing.assert_allclose(coarse.map_y, exact.map_y, atol=1e-9)

    def test_identity_scale_and_weights(self):
        ident = fields.identity(6, 7)
        self.assertEqual(fields.move_stats(ident).max_move, 0.0)
        np.testing.assert_allclose(ident.jacobian(), 1.0)
        shifted = fields.Field(ident.map_x + 3, ident.map_y - 2)
        half = fields.scale(shifted, 0.5)
        np.testing.assert_allclose(half.map_x - ident.map_x, 1.5)
        weights = np.zeros((6, 7))
        weights[2:4, 2:5] = 1
        w = fields.weighted(shifted, weights)
        self.assertTrue(np.array_equal(w.map_x[weights == 0], ident.map_x[weights == 0]))
        np.testing.assert_allclose(w.map_y[weights == 1] - ident.map_y[weights == 1], -2)
        with self.assertRaises(ValueError):
            fields.weighted(shifted, weights * 2)
        with self.assertRaises(ValueError):
            fields.scale(shifted, math.inf)

    def test_compose_adds_translations_and_identity_is_neutral(self):
        ident = fields.identity(9, 9)
        a = fields.Field(ident.map_x + 1.25, ident.map_y)
        b = fields.Field(ident.map_x, ident.map_y + 0.5)
        both = fields.compose(a, b)
        inner = (slice(1, 7), slice(1, 7))
        np.testing.assert_allclose(both.map_x[inner] - ident.map_x[inner], 1.25)
        np.testing.assert_allclose(both.map_y[inner] - ident.map_y[inner], 0.5)
        same = fields.compose(ident, a)
        np.testing.assert_allclose(same.map_x, a.map_x)

    def test_apply_identity_returns_the_same_bytes(self):
        img = checker(12, 10)
        out = fields.apply(img, fields.identity(12, 10))
        self.assertTrue(np.array_equal(out, img))

    def test_field_validation(self):
        with self.assertRaises(ValueError):
            fields.Field(np.zeros((2, 2)), np.zeros((2, 3)))
        with self.assertRaises(ValueError):
            fields.Field(np.full((2, 2), np.nan), np.zeros((2, 2)))


class ThinPlateTest(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(5)
        self.src = rng.uniform(0, 60, (9, 2))
        self.dst = self.src + rng.uniform(-4, 4, (9, 2))

    def test_interpolates_control_points(self):
        spline = ThinPlateSpline.fit(self.src, self.dst)
        np.testing.assert_allclose(spline(self.src), self.dst, atol=1e-8)

    def test_affine_targets_give_an_affine_spline(self):
        a = np.array([[1.1, 0.2], [-0.15, 0.95]])
        dst = self.src @ a.T + [3, -2]
        spline = ThinPlateSpline.fit(self.src, dst)
        self.assertLess(abs(spline.bending_energy()), 1e-8)
        probe = np.array([[10.5, 3.25], [55, 40]])
        np.testing.assert_allclose(spline(probe), probe @ a.T + [3, -2], atol=1e-8)
        np.testing.assert_allclose(spline.jacobian(probe), np.broadcast_to(a, (2, 2, 2)), atol=1e-9)

    def test_analytic_jacobian_matches_finite_differences(self):
        spline = ThinPlateSpline.fit(self.src, self.dst)
        probe = np.array([[12.3, 20.7], [33.1, 5.5], [50.2, 48.8]])
        h = 1e-5
        jac = spline.jacobian(probe)
        for k in range(2):
            step = np.zeros(2)
            step[k] = h
            numeric = (spline(probe + step) - spline(probe - step)) / (2 * h)
            np.testing.assert_allclose(jac[:, :, k], numeric, atol=1e-6)
        np.testing.assert_allclose(spline.determinant(probe),
                                   jac[:, 0, 0] * jac[:, 1, 1] - jac[:, 0, 1] * jac[:, 1, 0])

    def test_smoothing_relaxes_interpolation(self):
        exact = ThinPlateSpline.fit(self.src, self.dst)
        smooth = ThinPlateSpline.fit(self.src, self.dst, smooth=50.0)
        self.assertGreater(np.abs(smooth(self.src) - self.dst).max(), 1e-3)
        self.assertLess(smooth.bending_energy(), exact.bending_energy())

    def test_degenerate_points_raise(self):
        line = np.array([[0, 0], [1, 1], [2, 2], [3, 3]], float)
        with self.assertRaises(ValueError):
            ThinPlateSpline.fit(line, line)
        with self.assertRaises(ValueError):
            ThinPlateSpline.fit(self.src[:2], self.dst[:2])
        with self.assertRaises(ValueError):
            ThinPlateSpline.fit(self.src, self.dst[:5])
        with self.assertRaises(ValueError):
            ThinPlateSpline.fit(self.src, self.dst, smooth=-1)

    def test_service_spline_keeps_least_squares_for_repeated_points(self):
        src = np.array([[0, 0], [10, 0], [0, 10], [10, 10], [10, 10]], float)
        spline = service.Spline.fit(src, src)
        np.testing.assert_allclose(spline(np.array([[5.0, 5.0]])), [[5.0, 5.0]], atol=1e-6)
        self.assertIs(spline.src, spline.centres)

    def test_field_moves_the_handle_and_keeps_the_border(self):
        h, w = 40, 50
        f = tps_field(h, w, [[25, 20]], [[29, 18]], step=1)
        # the output pixel at the moved position reads the original handle position
        self.assertAlmostEqual(f.map_x[18, 29], 25.0, places=6)
        self.assertAlmostEqual(f.map_y[18, 29], 20.0, places=6)
        for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
            self.assertAlmostEqual(f.map_x[y, x], x, places=6)
            self.assertAlmostEqual(f.map_y[y, x], y, places=6)
        self.assertEqual(len(border_pins(w, h)), 16)
        fwd = forward_spline([[25, 20]], [[29, 18]], width=w, height=h)
        self.assertGreater(fwd.determinant(np.array([[25.0, 20.0]]))[0], 0.2)


class MovingLeastSquaresTest(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(11)
        self.p = rng.uniform(0, 100, (7, 2))
        self.v = rng.uniform(0, 100, (40, 2))

    def test_each_mode_reproduces_its_transform(self):
        affine = np.array([[1.2, 0.3], [-0.1, 0.8]])
        q_aff = self.p @ affine.T + [5, 7]
        np.testing.assert_allclose(mls.deform(self.v, self.p, q_aff, "affine"), self.v @ affine.T + [5, 7], atol=1e-8)
        q_sim = similarity(self.p, 0.4, 1.3, -6, 2)
        np.testing.assert_allclose(mls.deform(self.v, self.p, q_sim, "similarity"), similarity(self.v, 0.4, 1.3, -6, 2),
                                   atol=1e-8)
        q_rig = similarity(self.p, -0.7, 1.0, 3, 9)
        np.testing.assert_allclose(mls.deform(self.v, self.p, q_rig, "rigid"), similarity(self.v, -0.7, 1.0, 3, 9),
                                   atol=1e-8)

    def test_handles_land_exactly_on_targets(self):
        q = self.p + np.random.default_rng(2).uniform(-5, 5, self.p.shape)
        for mode in mls.MODES:
            np.testing.assert_allclose(mls.deform(self.p, self.p, q, mode), q, atol=1e-9)

    def test_one_handle_is_a_translation(self):
        out = mls.deform(self.v, [[10, 10]], [[13, 6]], "rigid")
        np.testing.assert_allclose(out - self.v, np.broadcast_to([3, -4], self.v.shape))

    def test_alpha_controls_locality(self):
        p = np.array([[20.0, 20.0], [80.0, 20.0], [50.0, 80.0]])
        q = p.copy()
        q[0] += [6, 0]
        near = np.array([[25.0, 22.0]])
        moves = [float(np.hypot(*(mls.deform(near, p, q, "similarity", a) - near)[0])) for a in (0.5, 1.0, 2.0)]
        self.assertLess(moves[0], moves[1])
        self.assertLess(moves[1], moves[2])

    def test_validation(self):
        with self.assertRaises(ValueError):
            mls.deform(self.v, self.p, self.p, "warp")
        with self.assertRaises(ValueError):
            mls.deform(self.v, [[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1], [2, 2]], "affine")
        with self.assertRaises(ValueError):
            mls.deform(self.v, [[1, 1], [1, 1]], [[0, 0], [2, 2]], "similarity")
        with self.assertRaises(ValueError):
            mls.deform(self.v, self.p, self.p, "rigid", alpha=0.0)

    def test_field_is_smooth_and_fold_free_for_a_small_drag(self):
        f = mls.mls_field(48, 48, [[24, 24]], [[27, 24]], mode="rigid", pins=[[4, 4], [44, 4], [4, 44], [44, 44]])
        self.assertTrue(fold.fold_report(f).passed)
        self.assertAlmostEqual(f.map_x[24, 27], 24.0, places=1)


class TriangulateTest(unittest.TestCase):
    def assertDelaunay(self, pts, tris):
        for a, b, c in tris:
            self.assertGreater(triangulate.signed_area(pts[a], pts[b], pts[c]), 0)
            cx, cy, r2 = triangulate.circumcircle(pts[a], pts[b], pts[c])
            for k, (x, y) in enumerate(pts):
                if k in (a, b, c):
                    continue
                self.assertGreaterEqual((x - cx) ** 2 + (y - cy) ** 2, r2 * (1 - 1e-9))

    def test_random_points(self):
        pts = np.random.default_rng(4).uniform(0, 50, (40, 2)).tolist()
        tris = triangulate.delaunay(pts)
        self.assertDelaunay(pts, tris)
        hull = triangulate.hull_edges(tris)
        # Euler: triangles = 2n - 2 - h for a triangulated point set
        self.assertEqual(len(tris), 2 * len(pts) - 2 - len(hull))
        self.assertEqual(tris, sorted(tris))

    def test_square_grid_is_fully_triangulated(self):
        pts = [(x * 10.0, y * 10.0) for y in range(5) for x in range(6)]
        tris = triangulate.delaunay(pts)
        self.assertEqual(len(tris), 2 * 5 * 4)
        area = sum(triangulate.signed_area(pts[a], pts[b], pts[c]) / 2 for a, b, c in tris)
        self.assertAlmostEqual(area, 50 * 40)

    def test_bad_input(self):
        with self.assertRaises(ValueError):
            triangulate.delaunay([(0, 0), (1, 1)])
        with self.assertRaises(ValueError):
            triangulate.delaunay([(0, 0), (1, 1), (2, 2), (3, 3)])
        with self.assertRaises(ValueError):
            triangulate.delaunay([(0, 0), (5, 0), (0, 5), (5, 0)])
        with self.assertRaises(ValueError):
            triangulate.delaunay([(0, 0), (5, 0), (math.nan, 5)])

    def test_barycentric_and_ring(self):
        l1, l2, l3 = triangulate.barycentric(1, 1, (0, 0), (4, 0), (0, 4))
        self.assertAlmostEqual(l1 + l2 + l3, 1)
        self.assertAlmostEqual(l2, 0.25)
        self.assertIsNone(triangulate.barycentric(0, 0, (0, 0), (1, 1), (2, 2)))
        ring = triangulate.ring(10, 10, 5, 3, 8)
        self.assertEqual(len(ring), 8)
        self.assertAlmostEqual(ring[0][0], 15)


class PiecewiseTest(unittest.TestCase):
    def setUp(self):
        self.h, self.w = 36, 44
        self.src = np.array(border_pins(self.w, self.h).tolist() + [[20, 15], [25, 22], [12, 24]], float)
        self.tris = triangulate.delaunay(self.src)

    def test_identity_layout_gives_identity_maps(self):
        res = piecewise.piecewise_affine(self.h, self.w, self.src, self.src, self.tris)
        ident = fields.identity(self.h, self.w)
        np.testing.assert_allclose(res.field.map_x, ident.map_x, atol=1e-9)
        self.assertEqual(res.covered_share(), 1.0)

    def test_global_affine_is_reproduced_where_covered(self):
        a = np.array([[0.95, 0.05], [-0.04, 1.02]])
        dst = self.src @ a.T + [1.5, -0.5]
        res = piecewise.piecewise_affine(self.h, self.w, self.src, dst, self.tris)
        inv = np.linalg.inv(a)
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(float)
        expect = np.stack([xx - 1.5, yy + 0.5], -1) @ inv.T
        cov = res.covered
        np.testing.assert_allclose(res.field.map_x[cov], expect[..., 0][cov], atol=1e-8)
        np.testing.assert_allclose(res.field.map_y[cov], expect[..., 1][cov], atol=1e-8)
        self.assertTrue(np.array_equal(res.field.map_x[~cov], xx[~cov]))

    def test_moving_one_vertex_changes_only_its_triangles(self):
        dst = self.src.copy()
        dst[-3] += [2, 1]
        res = piecewise.piecewise_affine(self.h, self.w, self.src, dst, self.tris)
        moved = res.field.move() > 1e-9
        touching = {i for i, t in enumerate(self.tris) if len(self.src) - 3 in t}
        self.assertTrue(moved.any())
        self.assertTrue(set(np.unique(res.owner[moved]).tolist()) <= touching)

    def test_affine_between_and_validation(self):
        m = piecewise.affine_between([[0, 0], [2, 0], [0, 2]], [[1, 1], [3, 1], [1, 3]])
        np.testing.assert_allclose(m, [[1, 0, -1], [0, 1, -1]], atol=1e-12)
        with self.assertRaises(ValueError):
            piecewise.affine_between([[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1], [2, 2]])
        with self.assertRaises(ValueError):
            piecewise.piecewise_affine(4, 4, self.src, self.src, [(0, 0, 1)])
        areas = piecewise.triangle_areas(self.src, self.tris)
        self.assertAlmostEqual(float(areas.sum()), (self.w - 1) * (self.h - 1))


class FoldTest(unittest.TestCase):
    def test_fold_report_on_identity_and_a_fold(self):
        ident = fields.identity(10, 10)
        self.assertTrue(fold.fold_report(ident).passed)
        flipped = fields.Field(ident.map_x[:, ::-1].copy(), ident.map_y)
        rep = fold.fold_report(flipped)
        self.assertFalse(rep.passed)
        self.assertEqual(rep.folded_share, 1.0)
        self.assertIn("worst_x", rep.to_json())

    def test_triangle_flips(self):
        src = [[0, 0], [10, 0], [0, 10], [10, 10]]
        tris = triangulate.delaunay(src)
        dst = [[0, 0], [10, 0], [0, 10], [-4, -4]]
        rep = fold.triangle_flips(src, dst, tris)
        self.assertFalse(rep.passed)
        self.assertTrue(rep.flipped)
        self.assertTrue(fold.triangle_flips(src, src, tris).passed)

    def test_safe_strength_lowers_a_folding_drag(self):
        h, w = 48, 48
        big = tps_field(h, w, [[20, 24], [28, 24]], [[34, 24], [14, 24]], step=2)
        self.assertFalse(fold.fold_report(big).passed)
        safe = fold.safe_strength(fold.scaled_builder(big))
        self.assertTrue(safe.reduced)
        self.assertTrue(safe.report.passed)
        self.assertGreater(safe.strength, 0.0)
        self.assertLess(safe.strength, 1.0)
        easy = fold.safe_strength(fold.scaled_builder(fields.identity(5, 5)))
        self.assertEqual(easy.strength, 1.0)
        self.assertFalse(easy.reduced)
        with self.assertRaises(ValueError):
            fold.safe_strength(fold.scaled_builder(big), requested=2)


class FalloffTest(unittest.TestCase):
    def test_curves(self):
        t = np.linspace(0, 1, 11)
        for kind in falloff.CURVES:
            c = falloff.curve(t, kind)
            self.assertAlmostEqual(c[0], 0.0)
            self.assertAlmostEqual(c[-1], 1.0)
            self.assertTrue(np.all(np.diff(c) >= 0))
        self.assertAlmostEqual(float(falloff.curve(0.5, "smootherstep")), 0.5)
        with self.assertRaises(ValueError):
            falloff.curve(0.5, "step")

    def test_band_weights_are_zero_outside_and_full_inside(self):
        band = np.zeros((30, 30), np.float32)
        band[5:25, 5:25] = 1
        weights = falloff.band_weights(band, 6)
        self.assertTrue(np.all(weights[band == 0] == 0))
        self.assertEqual(weights[15, 15], 1.0)
        self.assertGreater(weights[5, 15], 0.0)
        self.assertLess(weights[5, 15], 0.1)
        np.testing.assert_array_equal(falloff.band_weights(band, 0), band)

    def test_radial_weights_and_point_bands(self):
        r = falloff.radial_weights(21, 21, 10, 10, 8)
        self.assertEqual(r[10, 10], 1.0)
        self.assertEqual(r[10, 18], 0.0)
        band = falloff.band_from_points(20, 20, np.array([[5, 5], [15, 15]]), 3)
        self.assertEqual(band[5, 5], 1.0)
        self.assertEqual(band[10, 10], 0.0)

    def test_band_warp_leaves_outside_pixels_identical(self):
        h, w = 48, 64
        img = checker(h, w)
        band = falloff.band_from_points(h, w, np.array([[32, 24]]), 14)
        res = service.warp_in_band(img, [[32, 24]], [[36, 24]], band, ramp=6)
        outside = band == 0
        self.assertTrue(np.array_equal(res.image[outside], img[outside]))
        self.assertTrue(res.fold.passed)
        self.assertGreater(res.check.max_move_px, 1.0)


class FaceMeshWarpTest(unittest.TestCase):
    """Piecewise affine over the triangulated 478-point mesh, ring and border held still."""

    def setUp(self):
        self.face = synthetic.with_asymmetry(synthetic.symmetric_face(), {"eyes": (3.0, -2.0), "jaw": (-4.0, 0.0)})
        self.lay = mesh.layout(self.face, 400, 500)

    def test_layout_and_ring(self):
        ring = mesh.anchor_ring(self.face, 1.35)
        self.assertEqual(len(ring), mesh.RING_POINTS)
        self.assertEqual(self.lay.mesh_count, 478)
        self.assertEqual(len(self.lay.points), 478 + mesh.RING_POINTS + 16)
        oval = self.face[[10, 152]]
        self.assertLess(ring[:, 1].min(), oval[:, 1].min())
        self.assertGreater(ring[:, 1].max(), oval[:, 1].max())
        with self.assertRaises(ValueError):
            mesh.anchor_ring(self.face, 1.0)
        with self.assertRaises(ValueError):
            mesh.anchor_ring(self.face[:100])

    def test_identity_and_symmetry_targets(self):
        same = mesh.mesh_warp(500, 400, self.face, self.face, lay=self.lay)
        self.assertEqual(same.strength_used, 1.0)
        self.assertLess(same.result.field.move().max(), 1e-9)
        moved = mesh.mesh_warp(500, 400, self.face, symmetry.targets(self.face, 0.8), lay=self.lay)
        self.assertTrue(moved.flips.passed)
        self.assertGreater(moved.strength_used, 0.5)
        self.assertTrue(fold.fold_report(moved.result.field).passed)
        # beyond the anchor ring nothing moves
        ring = mesh.anchor_ring(self.face)
        centre = ring.mean(0)
        yy, xx = np.mgrid[0:500, 0:400]
        far = np.hypot(xx - centre[0], yy - centre[1]) > np.hypot(*(ring - centre).T).max() + 2
        self.assertTrue(far.any())
        self.assertLess(moved.result.field.move()[far].max(), 1e-9)

    def test_guard_and_validation(self):
        crushed = self.face.copy()
        crushed[list(range(0, 478, 2))] = crushed[list(range(1, 478, 2))]
        res = mesh.mesh_warp(500, 400, self.face, crushed, lay=self.lay)
        self.assertTrue(res.reduced)
        self.assertTrue(res.flips.passed)
        self.assertLess(res.strength_used, 1.0)
        with self.assertRaises(ValueError):
            mesh.mesh_warp(500, 400, self.face, self.face[:400], lay=self.lay)
        with self.assertRaises(ValueError):
            mesh.mesh_warp(500, 400, self.face + 1.0, self.face, lay=self.lay)
        with self.assertRaises(ValueError):
            mesh.mesh_warp(500, 400, self.face, self.face, lay=self.lay, strength=1.5)


class WarpEngineTest(unittest.TestCase):
    def test_every_method_through_the_contract(self):
        h, w = 40, 48
        img = checker(h, w)
        band = falloff.band_from_points(h, w, np.array([[24, 20]]), 12)
        for method in ("tps", "mls-affine", "mls-similarity", "mls-rigid", "piecewise"):
            params = {"method": method, "from": [24, 20, 16, 14, 31, 27], "to": [26, 21, 16, 14, 31, 27],
                      "band": "band", "ramp": 5}
            res = run_engine(WarpEngine(), img, None, {"band": band}, params)
            self.assertEqual(res.image.shape, img.shape)
            self.assertGreater(res.metrics["min_det"], 0.2, method)
            self.assertTrue(np.array_equal(res.image[band == 0], img[band == 0]), method)

    def test_guard_reports_the_strength_used(self):
        img = checker(40, 40)
        params = {"method": "tps", "from": [16, 20, 24, 20], "to": [30, 20, 10, 20]}
        res = run_engine(WarpEngine(), img, None, {}, params)
        self.assertLess(res.metrics["strength_used"], 1.0)
        self.assertGreater(res.metrics["min_det"], 0.2)
        raw = run_engine(WarpEngine(), img, None, {}, dict(params, guard=False))
        self.assertLessEqual(raw.metrics["min_det"], 0.2)

    def test_bad_params(self):
        img = checker(20, 20)
        for params in ({"method": "x", "from": [1, 1], "to": [2, 2]},
                       {"from": [1, 1, 2], "to": [1, 1, 2]},
                       {"from": [1, 1], "to": [2, 2, 3, 3]},
                       {"from": [1, 1], "to": [2, 2], "band": "missing"},
                       {"from": [1, 1], "to": [2, 2], "strength": 2}):
            with self.assertRaises(ValueError):
                run_engine(WarpEngine(), img, None, {}, params)
        with self.assertRaises(ValueError):
            build_field(10, 10, "nope", np.zeros((1, 2)), np.zeros((1, 2)))


if __name__ == "__main__":
    unittest.main()

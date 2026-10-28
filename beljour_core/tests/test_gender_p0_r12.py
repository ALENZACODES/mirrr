"""R12 P0 geometry regressions on drawn coordinates only. Author: John Khan.

Definitions are in the assertions before execution: Q3 stays strictly >0.2,
triangle area ratio stays >=0.2, fixed identity pins are exact, and accepted
synthetic recipe edits must retain visible nonzero motion. There are no photos,
downloaded weights, inferred demographics or live services in this test module.
"""
from __future__ import annotations

import math
import unittest
from unittest.mock import patch

import numpy as np

from plumb_api.engines.shape import gender, geometry
from plumb_api.engines.warp import field, fold, mesh
from plumb_api.engines.warp.piecewise import piecewise_affine
from plumb_api.engines.warp.regularize import (
    EDGE_SLOPE_LIMIT,
    GLOBAL_CAP_SHARE,
    LOCAL_CAP_SHARE,
    neighbour_graph,
    regularize_targets,
)
from plumb_api.engines.warp.tps import border_pins
from plumb_api.engines.warp.triangulate import delaunay
from lab.python.beljour_lab import face_harness as local
from lab.python.beljour_lab.face_harness import synthetic_case


def triangle_case():
    """A tiny triangle expanding in an otherwise stationary image.

    The old forward-area-only guard accepts it at strength one although the
    inverse determinant is 1/256 inside the expanded triangle.
    """
    source = np.array([[20.0, 20.0], [20.5, 20.0], [20.0, 20.5]])
    target = np.array([[20.0, 20.0], [28.0, 20.0], [20.0, 28.0]])
    all_points = np.vstack((source, border_pins(48, 48)))
    layout = mesh.MeshLayout(all_points, len(source), delaunay(all_points))
    return source, target, layout


def compact_face(seed=1, *, yaw=0, roll=0, eyelid_share=1):
    """Simulated projections and compressed eye spacing, never real face samples."""
    xyz, image = synthetic_case(seed, width=90, height=100)
    points = xyz[:, :2].copy()
    centre = points[[468, 473]].mean(0)
    points[:, 0] = centre[0] + (points[:, 0] - centre[0]) * math.cos(math.radians(yaw))
    from plumb_api.engines.core.regions import LEFT_EYE, RIGHT_EYE
    for contour in (RIGHT_EYE, LEFT_EYE):
        indices = list(contour)
        cy = float(points[indices, 1].mean())
        points[indices, 1] = cy + (points[indices, 1] - cy) * eyelid_share
    angle = math.radians(roll)
    rotate = np.array([[math.cos(angle), -math.sin(angle)],
                       [math.sin(angle), math.cos(angle)]])
    points = (points - centre) @ rotate.T + centre
    return points, image


class RasterGuardRegression(unittest.TestCase):
    def test_forward_triangle_pass_does_not_imply_backward_q3(self):
        before, after, lay = triangle_case()
        unguarded = mesh.mesh_warp(48, 48, before, after, lay=lay, guard=False)
        self.assertTrue(unguarded.flips.passed)
        self.assertGreater(unguarded.flips.min_area_ratio, 0.7)
        self.assertFalse(unguarded.jacobian.passed)
        self.assertAlmostEqual(unguarded.jacobian.min_det, 1 / 256, places=12)
        self.assertEqual(unguarded.strength_used, 1)
        self.assertIsNone(unguarded.guard_reason)
        self.assertEqual(fold.Q3_MINIMUM, 0.2)

    def test_fixed_guard_evaluates_actual_sampled_field(self):
        before, after, lay = triangle_case()
        safe = mesh.mesh_warp(48, 48, before, after, lay=lay)
        measured = fold.fold_report(safe.result.field)
        self.assertTrue(measured.passed)
        self.assertGreater(measured.min_det, 0.2)
        self.assertEqual(safe.jacobian, measured)
        self.assertTrue(safe.flips.passed)
        self.assertEqual(safe.guard_reason, "raster_q3")
        self.assertTrue(safe.reduced)
        self.assertFalse(safe.refused)
        self.assertGreater(safe.strength_used, 0.15)
        self.assertLess(safe.strength_used, 0.2)
        self.assertGreater(safe.evaluations, 1)

    def test_reported_strength_reconstructs_pixels_and_landmark_targets(self):
        before, after, lay = triangle_case()
        safe = mesh.mesh_warp(48, 48, before, after, lay=lay)
        actual = lay.points.copy()
        actual[:len(before)] = before + safe.strength_used * (after - before)
        reconstructed = piecewise_affine(48, 48, lay.points, actual, lay.triangles)
        np.testing.assert_array_equal(reconstructed.field.map_x, safe.result.field.map_x)
        np.testing.assert_array_equal(reconstructed.field.map_y, safe.result.field.map_y)
        np.testing.assert_array_equal(reconstructed.owner, safe.result.owner)
        self.assertGreater(float(safe.result.field.move().max()), 1)

    def test_gross_triangle_fold_is_still_rejected_without_threshold_change(self):
        before, after, lay = triangle_case()
        after = before.copy()
        after[1] = [19, 19]
        raw = mesh.mesh_warp(48, 48, before, after, lay=lay, guard=False)
        self.assertFalse(raw.flips.passed)
        safe = mesh.mesh_warp(48, 48, before, after, lay=lay)
        self.assertTrue(safe.flips.passed)
        self.assertGreaterEqual(safe.flips.min_area_ratio, 0.2)
        self.assertTrue(safe.jacobian.passed)
        self.assertTrue(safe.reduced)
        self.assertIn("triangle_area", safe.guard_reason)

    def test_safe_requested_strength_is_not_needlessly_reduced(self):
        before, after, lay = triangle_case()
        safe = mesh.mesh_warp(48, 48, before, after, lay=lay, strength=0.05)
        self.assertEqual(safe.strength_used, 0.05)
        self.assertFalse(safe.reduced)
        self.assertIsNone(safe.guard_reason)
        self.assertTrue(safe.jacobian.passed)
        self.assertEqual(safe.evaluations, 1)

    def test_zero_strength_keeps_identity_and_pixels(self):
        before, after, lay = triangle_case()
        zero = mesh.mesh_warp(48, 48, before, after, lay=lay, strength=0)
        photo = np.arange(48 * 48 * 3, dtype=np.uint32).reshape(48, 48, 3).astype(np.uint8)
        np.testing.assert_array_equal(field.apply(photo, zero.result.field), photo)
        self.assertEqual(zero.strength_used, 0)
        self.assertFalse(zero.refused)
        self.assertAlmostEqual(zero.jacobian.min_det, 1, places=12)

    def test_guard_inputs_fail_before_silent_bypass(self):
        before, after, lay = triangle_case()
        for value in (0, 41, 1.2, True):
            with self.subTest(iterations=value), self.assertRaises(ValueError):
                mesh.mesh_warp(48, 48, before, after, lay=lay, iterations=value)
        for value in (-1, 1.01, float("nan")):
            with self.subTest(strength=value), self.assertRaises(ValueError):
                mesh.mesh_warp(48, 48, before, after, lay=lay, strength=value)
        with self.assertRaisesRegex(ValueError, "another mesh"):
            mesh.mesh_warp(48, 48, before + 1, after, lay=lay)


class LocalRegularizerTests(unittest.TestCase):
    def setUp(self):
        self.before = np.array([[0., 0.], [1., 0.], [0., 1.], [1., 1.],
                                [2., 0.], [2., 1.], [0., 2.], [1., 2.], [2., 2.]])
        self.target = self.before.copy()
        self.target[4] += [1.3, -0.7]
        self.target[8] += [-0.8, 0.5]

    def test_graph_has_no_self_edges_and_deterministic_ties(self):
        graph = neighbour_graph(self.before, 10)
        self.assertEqual(graph.neighbours[0][:2], (1, 2))
        for i, (indices, weights) in enumerate(zip(graph.neighbours, graph.weights, strict=True)):
            self.assertNotIn(i, indices)
            self.assertEqual(len(indices), 6)
            self.assertEqual(len(set(indices)), len(indices))
            self.assertAlmostEqual(sum(weights), 1, places=12)
            self.assertTrue(all(weight > 0 for weight in weights))
        self.assertTrue(all(i < j for i, j, _ in graph.edges))
        self.assertEqual(len({(i, j) for i, j, _ in graph.edges}), len(graph.edges))

    def test_regularization_caps_against_local_and_global_spacing(self):
        graph = neighbour_graph(self.before, 10)
        result = regularize_targets(self.before, self.target, reference_scale=10)
        motion = np.linalg.norm(result.points - self.before, axis=1)
        self.assertTrue(np.all(motion <= graph.spacing * LOCAL_CAP_SHARE + 1e-12))
        self.assertTrue(np.all(motion <= 10 * GLOBAL_CAP_SHARE + 1e-12))
        self.assertGreater(result.capped_landmarks, 0)
        self.assertGreater(result.smoothed_landmarks, 0)
        self.assertGreater(result.applied_max, 0.01)
        self.assertLess(result.applied_max, result.requested_max)
        self.assertLessEqual(result.max_edge_slope, EDGE_SLOPE_LIMIT + 0.01)

    def test_pins_are_exact_and_inputs_are_immutable(self):
        a, b = self.before.copy(), self.target.copy()
        result = regularize_targets(self.before, self.target, reference_scale=10, pinned=[0, 4, 0])
        np.testing.assert_array_equal(result.points[[0, 4]], self.before[[0, 4]])
        np.testing.assert_array_equal(self.before, a)
        np.testing.assert_array_equal(self.target, b)
        self.assertEqual(result.pinned, (0, 4))
        self.assertTrue(result.to_json()["raster_q3_required"])

    def test_displacement_sign_symmetry_uses_identical_policy(self):
        delta = self.target - self.before
        positive = regularize_targets(self.before, self.before + delta, reference_scale=10, pinned=[0])
        negative = regularize_targets(self.before, self.before - delta, reference_scale=10, pinned=[0])
        np.testing.assert_allclose(positive.points - self.before, self.before - negative.points, atol=1e-14)
        self.assertEqual(positive.capped_landmarks, negative.capped_landmarks)
        self.assertAlmostEqual(positive.applied_max, negative.applied_max, places=13)

    def test_scale_translation_and_roll_follow_geometry(self):
        angle = 0.35
        rotation = np.array([[math.cos(angle), -math.sin(angle)], [math.sin(angle), math.cos(angle)]])
        factor = 2.75
        translation = np.array([37., 53.])
        before = self.before @ rotation.T * factor + translation
        target = self.target @ rotation.T * factor + translation
        base = regularize_targets(self.before, self.target, reference_scale=10, pinned=[0])
        transformed = regularize_targets(before, target, reference_scale=10 * factor, pinned=[0])
        expected = (base.points - self.before) @ rotation.T * factor
        np.testing.assert_allclose(transformed.points - before, expected, atol=1e-12)

    def test_duplicate_vertices_share_motion_and_pin_ownership(self):
        before = self.before.copy()
        before[1] = before[0]
        target = before.copy()
        target[1] += [1, 0]
        target[4] += [0.5, 0.5]
        result = regularize_targets(before, target, reference_scale=10, pinned=[0])
        np.testing.assert_array_equal(result.points[0], before[0])
        np.testing.assert_array_equal(result.points[1], before[1])
        result = regularize_targets(before, target, reference_scale=10)
        np.testing.assert_array_equal(result.points[0], result.points[1])

    def test_identity_and_all_pinned_targets_are_exact(self):
        zero = regularize_targets(self.before, self.before, reference_scale=10)
        np.testing.assert_array_equal(zero.points, self.before)
        self.assertEqual(zero.requested_max, 0)
        self.assertEqual(zero.applied_max, 0)
        self.assertEqual(zero.smoothed_landmarks, 0)
        fixed = regularize_targets(self.before, self.target, reference_scale=10, pinned=range(len(self.before)))
        np.testing.assert_array_equal(fixed.points, self.before)

    def test_invalid_regularizer_inputs_do_not_return_a_success(self):
        for reference in (0, -1, float("inf"), float("nan")):
            with self.subTest(reference=reference), self.assertRaises(ValueError):
                regularize_targets(self.before, self.target, reference_scale=reference)
        for pins in ([True], [-1], [9], [1.5]):
            with self.subTest(pins=pins), self.assertRaises(ValueError):
                regularize_targets(self.before, self.target, reference_scale=10, pinned=pins)
        for count in (0, 25, 2.5, True):
            with self.subTest(neighbours=count), self.assertRaises(ValueError):
                neighbour_graph(self.before, 10, neighbours=count)
        with self.assertRaises(ValueError):
            regularize_targets(self.before, self.target[:-1], reference_scale=10)
        bad = self.target.copy()
        bad[0, 0] = float("nan")
        with self.assertRaises(ValueError):
            regularize_targets(self.before, bad, reference_scale=10)


class GenderP0Regression(unittest.TestCase):
    def test_api_direction_is_explicit_and_backwards_compatible(self):
        face, _ = compact_face()
        for stop, name in ((-33, "feminine"), (33, "masculine"), (0, "original")):
            with self.subTest(stop=stop):
                _, report = gender.recipe_targets(face, stop)
                self.assertEqual(report["direction"], name)
                self.assertFalse(report["validated_on_released_photos"])
                self.assertIn("simulation", report["simulation"])
        self.assertLess(gender.parameters(-33)["jaw_width_fw"], 0)
        self.assertGreater(gender.parameters(33)["jaw_width_fw"], 0)

    def test_feminine_and_masculine_stops_use_the_same_safety_policy(self):
        variants = (
            {"seed": 1},
            {"seed": 3, "yaw": 30, "roll": 12},
            {"seed": 5, "yaw": 50, "roll": -10},
            {"seed": 8, "eyelid_share": 0.3},
        )
        failures = {"feminine": 0, "masculine": 0}
        for options in variants:
            face, photo = compact_face(**options)
            lay = mesh.layout(face, photo.shape[1], photo.shape[0])
            for stop in (-100, -66, -33, 33, 66, 100):
                with self.subTest(options=options, stop=stop):
                    target, report = gender.recipe_targets(face, stop)
                    safe = mesh.mesh_warp(photo.shape[0], photo.shape[1], face, target, lay=lay)
                    passed = safe.flips.passed and safe.jacobian.passed
                    failures[report["direction"]] += int(not passed)
                    self.assertTrue(passed)
                    self.assertGreater(safe.strength_used, 0.01)
                    actual = face + (target - face) * safe.strength_used
                    self.assertGreater(geometry.displacement(face, actual)["max_iod_percent"], 0.05)
                    self.assertLessEqual(report["max_iod_percent"], 12 + 1e-9)
                    np.testing.assert_array_equal(actual[list(gender.IDENTITY_PINS)], face[list(gender.IDENTITY_PINS)])
                    self.assertEqual(report["target_safety"]["method"], "local-spacing-diffusion-projection/1")
        self.assertEqual(failures, {"feminine": 0, "masculine": 0})

    def test_high_region_factors_keep_pupil_distance_and_root_exact(self):
        face, _ = compact_face(seed=4, roll=17)
        original = face.copy()
        for stop in (-100, 100):
            target, report = gender.recipe_targets(face, stop, region_strengths={name: 1.5 for name in gender.REGIONS})
            np.testing.assert_array_equal(target[list(gender.IDENTITY_PINS)], face[list(gender.IDENTITY_PINS)])
            self.assertLessEqual(report["max_iod_percent"], 12 + 1e-9)
            self.assertGreater(report["target_safety"]["smoothed_landmarks"], 0)
            self.assertGreater(report["max_iod_percent"], 0.1)
        np.testing.assert_array_equal(face, original)

    def test_disabled_regions_and_zero_slider_are_identity(self):
        face, _ = compact_face()
        factors = {name: 0 for name in gender.REGIONS}
        for stop in (-100, 0, 100):
            target, report = gender.recipe_targets(face, stop, region_strengths=factors)
            np.testing.assert_array_equal(target, face)
            self.assertEqual(report["target_safety"]["applied_max"], 0)
        target, _ = gender.recipe_targets(face, 0)
        np.testing.assert_array_equal(target, face)

    def test_regularized_result_is_deterministic_and_explicitly_unproven_on_faces(self):
        face, _ = compact_face(seed=6, yaw=30)
        a, report_a = gender.recipe_targets(face, -66, scope="keep_my_hair")
        b, report_b = gender.recipe_targets(face, -66, scope="keep_my_hair")
        np.testing.assert_array_equal(a, b)
        self.assertEqual(report_a, report_b)
        self.assertTrue(report_a["styling_pending"])
        self.assertFalse(report_a["validated_on_released_photos"])
        self.assertTrue(report_a["target_safety"]["raster_q3_required"])


class LocalGenderAcceptance(unittest.TestCase):
    """Exercise report acceptance independently of the already-tested raster guard."""

    def row(self, *, strength=1.0, refused=False, movement=2.0, slider=33, q3=True, q4=True):
        xyz, photo = synthetic_case(width=90, height=100)
        # Exactly 100px IOD makes the requested displacement equal its IOD percent.
        xyz[468, :2] = (0, 0)
        xyz[473, :2] = (100, 0)
        xyz[0, :2] = (0, 0)
        target = xyz[:, :2].copy()
        target[0, 0] = movement
        report = {"requested_bands": {}, "max_iod_percent": 12.0, "capped_landmarks": 0}
        gate = {"strength_used": strength, "refused": refused, "triangle_guard_pass": True,
                "q3": {"passed": q3}, "q4": {"passed": q4}}
        case = local.Input(xyz, photo, "synthetic", "ls2-effect")
        with patch.object(local.gender, "STOPS", (slider,)), \
                patch.object(local.gender, "recipe_targets", return_value=(target, report)), \
                patch.object(local, "mesh_checks", return_value=(gate, photo.copy())) as raster:
            result = local.ls2([case], previews=None)
        return result["evaluations"][0], result, raster

    def test_refused_identity_does_not_certify_a_requested_effect(self):
        for strength in (0.0, 1.0):
            with self.subTest(strength=strength):
                row, result, _ = self.row(strength=strength, refused=True)
                self.assertFalse(row["auto_pass"])
                self.assertFalse(row["checks"]["effect_pass"])
                self.assertEqual(result["automated_passed"], 0)
        row, _, _ = self.row(strength=0.0, refused=True)
        self.assertEqual(row["applied_move_iod_pct"], 0.0)
        self.assertEqual(row["target_move_iod_pct"], 2.0)

    def test_strength_floor_uses_unrounded_value_and_reports_effective_movement(self):
        for strength, expected in ((math.nextafter(0.05, 0.0), False), (0.05, True), (0.25, True)):
            with self.subTest(strength=strength):
                row, _, _ = self.row(strength=strength)
                self.assertEqual(row["auto_pass"], expected)
                self.assertEqual(row["strength_used"], strength)
                self.assertEqual(row["applied_move_iod_pct"], row["target_move_iod_pct"] * strength)

    def test_target_movement_floor_uses_measured_geometry_and_is_strict(self):
        for movement, expected in ((0.0, False), (0.0001, False), (0.0001001, True)):
            with self.subTest(movement=movement):
                row, _, _ = self.row(movement=movement)
                self.assertEqual(row["auto_pass"], expected)
                # Recipe metadata deliberately says 12%; it must not certify an identity target.
                self.assertEqual(row["max_iod_percent"], 12.0)
                self.assertAlmostEqual(row["target_move_iod_pct"], movement, places=12)

    def test_effect_floor_does_not_override_quality_failure_or_the_original_stop(self):
        for quality in ({"q3": False}, {"q4": False}):
            with self.subTest(quality=quality):
                row, _, _ = self.row(**quality)
                self.assertTrue(row["checks"]["effect_pass"])
                self.assertFalse(row["auto_pass"])
        original, _, raster = self.row(slider=0, movement=0.0)
        self.assertTrue(original["auto_pass"])
        self.assertEqual(original["setting"], "0_original")
        raster.assert_not_called()


if __name__ == "__main__":
    unittest.main()

"""Negative-strength shape, local guard and original seam threshold regressions.

All inputs are artificial faces, flat colours and generated background patterns.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shape import geometry
from plumb_api.engines.shape.shape_guard import (
    MIN_STRENGTH,
    ShapeSafetyRefusal,
    guarded_shape_render,
    local_shape_targets,
    needs_local_projection,
)
from plumb_api.engines.warp import field, mesh as warp_mesh, regularize
from plumb_api.quality.metrics import q4_seam

from tests.gatefix_e_drawn import TONES, build_case

NEGATIVE_SHAPES = ("face_width", "jaw_length", "cheek_fullness")


def _original_result(image: np.ndarray, face: np.ndarray, control: str) -> np.ndarray:
    target = geometry.target_mesh(face, {control: -100})
    warp = warp_mesh.mesh_warp(image.shape[0], image.shape[1], face, target)
    return field.apply(image, warp.result.field)


@pytest.mark.parametrize("control", NEGATIVE_SHAPES)
def test_drawn_hard_edge_reproduces_original_seam_failure(control: str) -> None:
    case = build_case(tone=143)
    original = _original_result(case.image, case.face, control)
    baseline = q4_seam(case.image, original, case.oval)
    assert not baseline.passed
    assert float(baseline.measured["ratio"]) > 1.5


@pytest.mark.parametrize("control", NEGATIVE_SHAPES)
def test_negative_shape_keeps_meaningful_strength_and_q4(control: str) -> None:
    case = build_case(tone=143)
    before = case.image.copy()
    mesh = case.face.copy()
    image, report = geometry.raster_warp(case.image, case.face, {control: -100})
    q4 = q4_seam(case.image, image, case.oval)
    assert q4.passed
    assert report["strength_used"] >= MIN_STRENGTH
    assert report["min_area_ratio"] >= 0.2
    assert report["q4_pass"] == 1.0
    assert report["q1_pass"] == 1.0
    assert report["max_iod_percent"] > 0
    assert not np.array_equal(image, before)
    np.testing.assert_array_equal(case.image, before)
    np.testing.assert_array_equal(case.face, mesh)


@pytest.mark.parametrize("control", NEGATIVE_SHAPES)
def test_black_background_stays_pixel_identical_at_image_corners(control: str) -> None:
    case = build_case()
    result, _ = geometry.raster_warp(case.image, case.face, {control: -100})
    for y, x in ((0, 0), (0, -1), (-1, 0), (-1, -1)):
        np.testing.assert_array_equal(result[y, x], case.image[y, x])


@pytest.mark.parametrize("control", NEGATIVE_SHAPES)
def test_scale_search_never_raises_an_existing_limit(control: str) -> None:
    case = build_case()

    def original(face: np.ndarray, values: dict[str, float]) -> np.ndarray:
        return geometry.target_mesh(face, values)

    safe = guarded_shape_render(case.image, case.face, {control: -100}, original)
    assert safe.passed
    assert safe.jacobian_min > 0.2
    assert safe.triangle_ratio >= 0.2
    assert safe.seam_ratio <= 1.5
    assert safe.guard_strength >= MIN_STRENGTH
    assert safe.affected_pixels > 0
    assert safe.scales[control] >= 0.0625


@pytest.mark.parametrize("tone", TONES)
def test_tone_invariance_of_shape_coordinate_targets(tone: int) -> None:
    case = build_case(tone=tone)
    reference = build_case(tone=143)
    for control in NEGATIVE_SHAPES:
        target = geometry.target_mesh(case.face, {control: -100})
        baseline = geometry.target_mesh(reference.face, {control: -100})
        np.testing.assert_array_equal(target, baseline)


@pytest.mark.parametrize("tone", TONES)
def test_negative_shape_reports_an_honest_result_for_each_flat_tone(tone: int) -> None:
    case = build_case(tone=tone)
    results: list[bool] = []
    for control in NEGATIVE_SHAPES:
        try:
            image, report = geometry.raster_warp(case.image, case.face, {control: -100})
        except ShapeSafetyRefusal:
            results.append(False)
            continue
        results.append(True)
        assert q4_seam(case.image, image, case.oval).passed
        assert report["strength_used"] >= MIN_STRENGTH
        assert report["min_area_ratio"] >= 0.2
    assert len(results) == len(NEGATIVE_SHAPES)
    assert any(results)


def test_local_projection_only_corrects_strained_landmark_movements() -> None:
    case = build_case()
    face = case.face
    initial = geometry.target_mesh(face, {"face_width": -100})
    projected = local_shape_targets(face, initial, iod=geometry.frame(face).iod)
    assert projected.shape == initial.shape
    assert np.isfinite(projected).all()
    assert np.max(np.linalg.norm(projected - face, axis=1)) > 0
    assert np.max(np.linalg.norm(projected - face, axis=1)) <= geometry.frame(face).iod * 0.12
    assert not np.shares_memory(projected, initial)


def test_safe_projection_is_exact_identity_when_no_edit() -> None:
    case = build_case()
    projected = local_shape_targets(case.face, case.face.copy(), iod=geometry.frame(case.face).iod)
    np.testing.assert_array_equal(projected, case.face)


@pytest.mark.parametrize("invalid", [0.0, -1.0, float("nan"), float("inf")])
def test_projection_rejects_invalid_scale(invalid: float) -> None:
    face = build_case().face
    with pytest.raises(ValueError):
        local_shape_targets(face, face, iod=invalid)


def test_preview_rejects_unsupported_color_layout() -> None:
    case = build_case()
    with pytest.raises(ValueError):
        geometry.raster_warp(case.image[:, :, :1], case.face, {"face_width": -100})


def test_preview_refuses_if_no_safe_strength_exists() -> None:
    case = build_case()

    def impossible(face: np.ndarray, values: dict[str, float]) -> np.ndarray:
        del values
        out = face.copy()
        out[:, 0] += 1e4
        return out

    with pytest.raises((ShapeSafetyRefusal, ValueError)):
        guarded_shape_render(case.image, case.face, {"face_width": -100}, impossible)


def test_zero_request_keeps_historic_identity_result() -> None:
    case = build_case()
    image, report = geometry.raster_warp(case.image, case.face, {"face_width": 0})
    np.testing.assert_array_equal(image, case.image)
    assert report["strength_used"] == 1.0


def test_extreme_isolated_strain_is_detected_without_a_photo() -> None:
    case = build_case()
    moved = case.face.copy()
    iod = geometry.frame(case.face).iod
    graph = regularize.neighbour_graph(case.face, iod)
    i, _, distance = min((edge for edge in graph.edges if edge[2] > 1e-6), key=lambda e: e[2])
    moved[i] += [max(35.0 * distance, 0.03 * iod), 0.0]
    assert needs_local_projection(case.face, moved, iod=iod)
    assert not needs_local_projection(
        case.face, case.face.copy(), iod=geometry.frame(case.face).iod
    )


def test_ordinary_target_does_not_need_strain_projection() -> None:
    case = build_case()
    source = case.face
    target = geometry.target_mesh(source, {"cheek_fullness": -25})
    assert not needs_local_projection(source, target, iod=geometry.frame(source).iod)

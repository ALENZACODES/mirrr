"""Offline box and mesh injection plus synthetic group-level shape checks.

No downloadable model, person, reference photo or private identifier is used.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np
import pytest

from plumb_api.engines.shape import age
from plumb_api.engines.shape.geometry import raster_warp
from plumb_api.engines.shape.shape_guard import ShapeSafetyRefusal
from plumb_api.quality.metrics import q4_seam
from plumb_api.vision.box_first import BoxFirstDetector

from tests.gatefix_e_drawn import TONES, build_case


def _fake_mesh() -> np.ndarray:
    """A normalized oval with 478 distinct coordinates, not an observed face."""
    theta = np.arange(478, dtype=float) * (2 * np.pi / 478)
    x = 0.5 + 0.2 * np.cos(theta)
    y = 0.5 + 0.25 * np.sin(theta)
    z = np.zeros_like(x)
    return np.column_stack((x, y, z))


def test_injected_detector_does_not_require_a_download_or_a_model() -> None:
    case = build_case()
    calls: list[str] = []

    def boxes(image: np.ndarray) -> list[list[float]]:
        calls.append("box")
        assert image.shape == case.image.shape
        return [[43.0, 32.0, 90.0, 133.0, 0.99]]

    def meshes(image: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        calls.append("mesh")
        assert image.dtype == np.uint8
        assert image.shape[:2] == (256, 256)
        return [_fake_mesh()], [{}]

    output = BoxFirstDetector(boxes, meshes).detect(case.image)
    assert calls == ["box", "mesh"]
    assert len(output.faces) == 1
    assert not output.used_fallback
    assert len(output.attempts) == 1
    assert output.attempts[0]["matched"]
    assert output.faces[0].shape == (478, 3)


def test_injected_empty_box_returns_explicit_fallback() -> None:
    case = build_case()
    calls: list[str] = []
    mesh_shapes: list[tuple[int, ...]] = []

    def boxes(image: np.ndarray) -> Sequence[Sequence[float]]:
        calls.append("box")
        assert image.dtype == np.uint8
        return []

    def meshes(image: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        calls.append("mesh")
        assert image.dtype == np.uint8
        assert image.ndim == 3
        assert image.shape[2] == case.image.shape[2]
        mesh_shapes.append(image.shape)
        return [], []

    outcome = BoxFirstDetector(boxes, meshes).detect(case.image)
    assert calls == ["box", *["mesh" for _ in mesh_shapes]]
    assert mesh_shapes[0] == case.image.shape
    assert any(shape != case.image.shape for shape in mesh_shapes[1:])
    assert not outcome.faces
    assert outcome.used_fallback
    assert outcome.reason_code == "no_face"
    assert outcome.attempts[0]["stage"] == "full_image_fallback"
    assert all(not attempt.get("matched") for attempt in outcome.attempts)


@pytest.mark.parametrize("tone", TONES)
def test_synthetic_groups_keep_the_same_shape_pass_decision(tone: int) -> None:
    case = build_case(tone=tone)
    checks: list[bool] = []
    for control in ("face_width", "jaw_length", "cheek_fullness"):
        try:
            output, measurements = raster_warp(case.image, case.face, {control: -100})
        except ShapeSafetyRefusal:
            checks.append(False)
            continue
        seam = q4_seam(case.image, output, case.oval)
        check = (
            seam.passed
            and measurements["strength_used"] >= 0.05
            and measurements["min_area_ratio"] >= 0.2
        )
        checks.append(bool(check))
    assert checks == [True, True, True]


@pytest.mark.parametrize("tone", TONES)
def test_synthetic_groups_preserve_explicit_coverings(tone: int) -> None:
    case = build_case(tone=tone, covering="wrap")
    result, edit, _ = age.render(
        case.image, case.face, stop=3, protected_mask=case.covering
    )
    protected = case.covering >= 0.5
    np.testing.assert_array_equal(result[protected], case.image[protected])
    assert not edit[protected].any()
    assert q4_seam(case.image, result, case.oval).passed


def test_aggregate_only_group_result_requires_no_photo_serialization() -> None:
    groups = {str(tone): {"shape": 0, "age": 0} for tone in TONES}
    for tone in TONES:
        case = build_case(tone=tone, covering="wrap")
        shape, stats = raster_warp(case.image, case.face, {"jaw_length": -100})
        shaped = q4_seam(case.image, shape, case.oval).passed
        groups[str(tone)]["shape"] += int(shaped and stats["strength_used"] >= 0.05)
        aged, _, _ = age.render(case.image, case.face, stop=3, protected_mask=case.covering)
        groups[str(tone)]["age"] += int(q4_seam(case.image, aged, case.oval).passed)
    assert all(row == {"shape": 1, "age": 1} for row in groups.values())
    assert len(groups) == len(TONES)
    assert all(isinstance(value, int) for row in groups.values() for value in row.values())

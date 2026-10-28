"""R12 mask gates: synthetic geometry, 10 Monk swatches and five illuminants.

Pass: all 13 masks finite/nonempty, skin 45--97% of oval, eyes >=95% inside
oval, no colour dependency; severely invalid raw geometry stays a failure.
Synthetic checks cannot establish real-face demographic performance.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face, rolled

MONK = ("f6ede4", "f3e7db", "f7ead0", "eadaba", "d7bd96",
        "a07e56", "825c43", "604134", "3a312a", "292420")
LIGHTS = {
    "daylight": (1.0, 1.0, 1.0),
    "office": (0.82, 1.0, 0.9),
    "evening": (0.85, 0.61, 0.4),
    "dim": (0.22, 0.22, 0.22),
    "flash": (1.4, 1.35, 1.3),
}
HEIGHT, WIDTH = 160, 144


def made_up_face(*, occlusion: float = 0, roll: float = 0) -> np.ndarray:
    points = symmetric_face(WIDTH, HEIGHT, face_width=80, face_length=120)
    ids = [*regions.RIGHT_EYE, 468, 469, 470, 471, 472]
    points[ids, 0] -= occlusion
    return rolled(points, roll, (WIDTH / 2, HEIGHT / 2)) if roll else points


def synthetic_colour(tone: int, light: str) -> np.ndarray:
    swatch = MONK[tone - 1]
    rgb = np.array([int(swatch[i:i + 2], 16) for i in (0, 2, 4)], dtype=float)
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    texture = 0.94 + 0.03 * np.sin(xx * 0.7) + 0.02 * np.cos(yy * 0.6)
    return np.clip(np.rint(texture[..., None] * rgb * LIGHTS[light]), 0, 255).astype(np.uint8)


def bench_metrics(masks: dict[str, np.ndarray]) -> tuple[float, float]:
    oval = float(masks["face_oval"].sum())
    skin = float(masks["skin"].sum()) / oval
    inside = float((masks["eyes"] * masks["face_oval"]).sum()) / float(masks["eyes"].sum())
    return skin, inside


@pytest.mark.parametrize("tone", range(1, 11))
@pytest.mark.parametrize("light", LIGHTS)
def test_ten_tones_five_lights_share_exact_geometric_masks(tone: int, light: str) -> None:
    image = synthetic_colour(tone, light)
    before = image.copy()
    points = made_up_face(occlusion=20)
    # Only image dimensions enter a landmark-driven mask.
    masks = regions.region_masks(points, *image.shape[:2], normalized=False, supersample=2)
    reference = regions.region_masks(points, HEIGHT, WIDTH, normalized=False, supersample=2)
    assert set(masks) == set(regions.REGIONS)
    for name, mask in masks.items():
        assert np.all(np.isfinite(mask)) and np.any(mask > 0), name
        np.testing.assert_array_equal(mask, reference[name])
    skin, inside = bench_metrics(masks)
    assert 0.45 <= skin <= 0.97
    assert inside >= 0.95
    np.testing.assert_array_equal(image, before)


def test_reproduces_old_independent_polygon_eye_spill() -> None:
    points = made_up_face(occlusion=20)
    oval = regions.polygon(HEIGHT, WIDTH, points[list(regions.FACE_OVAL)], 2)
    right = regions.polygon(HEIGHT, WIDTH, points[list(regions.RIGHT_EYE)], 2)
    left = regions.polygon(HEIGHT, WIDTH, points[list(regions.LEFT_EYE)], 2)
    raw = 1 - (1 - right) * (1 - left)
    old_inside = float((raw * oval).sum() / raw.sum())
    assert old_inside < 0.90, "the fixture must trigger the old 95% gate"
    masks = regions.region_masks(points, HEIGHT, WIDTH, normalized=False, supersample=2)
    assert bench_metrics(masks)[1] >= 0.95
    np.testing.assert_array_equal(masks["face_oval"], oval)
    assert np.any(masks["right_eye"] > 0)
    assert np.all(masks["right_eye"][oval < 1] == 0)
    assert float(masks["right_eye"].sum()) < float(right.sum())


@pytest.mark.parametrize("angle", (-35, -15, 0, 15, 35))
@pytest.mark.parametrize("shift", (0, 16, 20, 24))
def test_pose_grid_keeps_visibility_without_expanding_oval(angle: float, shift: float) -> None:
    points = made_up_face(occlusion=shift, roll=angle)
    masks = regions.region_masks(points, HEIGHT, WIDTH, normalized=False, supersample=4)
    skin, inside = bench_metrics(masks)
    assert 0.45 <= skin <= 0.97
    assert inside >= 0.95
    assert np.all(masks["right_iris"] <= masks["right_eye"])
    assert np.all(masks["left_iris"] <= masks["left_eye"])
    diag = regions.region_diagnostics(points, HEIGHT, WIDTH, normalized=False, supersample=4)
    assert not diag["colour_dependent"]
    assert not diag["invalid_geometry"]
    assert diag["features"]["right_eye"]["raw_area_px"] >= diag["features"]["right_eye"]["visible_area_px"]


def test_diagnostics_do_not_hide_bad_mesh_after_clipping() -> None:
    points = made_up_face(occlusion=28)
    masks = regions.region_masks(points, HEIGHT, WIDTH, normalized=False, supersample=2)
    assert bench_metrics(masks)[1] >= 0.95
    diag = regions.region_diagnostics(points, HEIGHT, WIDTH, normalized=False, supersample=2)
    assert diag["invalid_geometry"]
    assert diag["features"]["right_eye"]["raw_support_share"] < 0.25
    assert diag["features"]["right_eye"]["retained_share"] < 0.25


def test_wholly_off_face_eye_stays_empty_and_invalid() -> None:
    points = made_up_face(occlusion=70)
    masks = regions.region_masks(points, HEIGHT, WIDTH, normalized=False)
    assert float(masks["right_eye"].sum()) == 0
    assert float(masks["right_iris"].sum()) == 0
    assert regions.region_diagnostics(points, HEIGHT, WIDTH, normalized=False)["invalid_geometry"]


def test_projected_iris_uses_ellipse_not_mean_radius_circle() -> None:
    points = made_up_face()
    centre = points[468].copy()
    points[[469, 470, 471, 472]] = centre + np.array([(1, 0), (0, 4), (-1, 0), (0, -4)])
    outline = regions.iris_outline(points, regions.RIGHT_IRIS)
    assert np.max(np.abs(outline[:, 0] - centre[0])) == pytest.approx(1)
    assert np.max(np.abs(outline[:, 1] - centre[1])) == pytest.approx(4)
    iris = regions.region_mask("right_iris", points, HEIGHT, WIDTH, normalized=False)
    eye = regions.region_mask("right_eye", points, HEIGHT, WIDTH, normalized=False)
    assert np.all(iris <= eye)
    assert iris.sum() > 0


def test_iris_ellipse_preserves_rotation_and_shear() -> None:
    points = made_up_face()
    centre = points[468].copy()
    u, v = np.array([3, 2]), np.array([-1, 2])
    points[[469, 470, 471, 472]] = centre + np.array([u, v, -u, -v])
    outline = regions.iris_outline(points, regions.RIGHT_IRIS)
    np.testing.assert_allclose(outline[0], centre + u)
    np.testing.assert_allclose(outline[regions.IRIS_SEGMENTS // 4], centre + v)
    np.testing.assert_allclose(outline[regions.IRIS_SEGMENTS // 2], centre - u)


def test_closed_eyelid_does_not_receive_circular_iris_overlay() -> None:
    points = made_up_face()
    centre = points[468]
    points[list(regions.RIGHT_EYE), 1] = centre[1] + (points[list(regions.RIGHT_EYE), 1] - centre[1]) * 0.15
    eye = regions.region_mask("right_eye", points, HEIGHT, WIDTH, normalized=False)
    iris = regions.region_mask("right_iris", points, HEIGHT, WIDTH, normalized=False)
    assert 0 < iris.sum() <= eye.sum()
    assert np.all(iris[eye == 0] == 0)


def test_batch_is_independent_of_order_and_subset() -> None:
    points = made_up_face(occlusion=20)
    all_masks = regions.region_masks(points, HEIGHT, WIDTH, normalized=False)
    subset = ("skin", "eyes", "right_iris", "face_oval")
    masks = regions.region_masks(points, HEIGHT, WIDTH, names=subset, normalized=False)
    assert set(masks) == set(subset)
    for name in subset:
        np.testing.assert_array_equal(masks[name], all_masks[name])
        np.testing.assert_array_equal(masks[name], regions.region_mask(name, points, HEIGHT, WIDTH, normalized=False))


def test_normalized_and_absolute_batch_outputs_match() -> None:
    points = made_up_face(occlusion=20, roll=15)
    normal = points / [WIDTH, HEIGHT]
    pixels = regions.region_masks(points, HEIGHT, WIDTH, normalized=False, supersample=4)
    normalized = regions.region_masks(normal, HEIGHT, WIDTH, supersample=4)
    for name in pixels:
        np.testing.assert_array_equal(pixels[name], normalized[name])


def test_468_point_noniris_requests_remain_supported() -> None:
    points = made_up_face()[:468]
    masks = regions.region_masks(points, HEIGHT, WIDTH, names=("face_oval", "skin", "eyes"), normalized=False)
    assert all(m.sum() > 0 for m in masks.values())
    with pytest.raises(ValueError, match="478-point"):
        regions.region_masks(points, HEIGHT, WIDTH, names=("right_iris",), normalized=False)


def test_region_calls_preserve_source_landmarks() -> None:
    points = made_up_face(occlusion=20)
    source = points.copy()
    regions.region_masks(points, HEIGHT, WIDTH, normalized=False)
    regions.region_diagnostics(points, HEIGHT, WIDTH, normalized=False)
    np.testing.assert_array_equal(points, source)


@pytest.mark.parametrize("supersample", (1, 2, 4, 8))
def test_antialias_resolution_does_not_reintroduce_spill(supersample: int) -> None:
    points = made_up_face(occlusion=20)
    masks = regions.region_masks(points, HEIGHT, WIDTH, normalized=False, supersample=supersample)
    assert bench_metrics(masks)[1] >= 0.95
    assert np.any((masks["face_oval"] > 0) & (masks["face_oval"] < 1)) or supersample == 1


def test_r12_full_field_parity_fixture_matches_current_python() -> None:
    import subprocess
    import sys
    from pathlib import Path
    root = Path(__file__).resolve().parents[2]
    result = subprocess.run([sys.executable, "api/scripts/make_parity.py", "regions-turn", "--check"],
                            cwd=root, capture_output=True, text=True, check=False, timeout=30)
    assert result.returncode == 0, result.stdout + result.stderr

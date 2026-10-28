"""Pixel regressions for local iris and hair-colour evidence on drawn inputs.

The probes call the real acceptance functions with explicit synthetic regions;
they do not use model files, photographs of people or external labels.
Author: John Khan.
"""
from __future__ import annotations

import importlib
import math
import sys
from pathlib import Path
from types import ModuleType

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.haircolour import balayage, recolour
from plumb_api.engines.shape.synthetic_heads import drawn_head
from plumb_api.engines.shape.turn_field import silhouette_depth


HEIGHT = 128
WIDTH = 128


def _checks() -> ModuleType:
    """Load the actual box-side probe, without importing production from tests."""
    folder = Path(__file__).resolve().parents[2] / "tests" / "realface"
    if str(folder) not in sys.path:
        sys.path.insert(0, str(folder))
    return importlib.import_module("feature_checks")


def _turned(seed: int, degrees: float) -> tuple[np.ndarray, np.ndarray]:
    points, source = drawn_head(seed)
    base_x = float(points[:, 0].mean())
    base_z = silhouette_depth(points)
    xx = points[:, 0] - base_x
    zz = points[:, 2] - base_z
    angle = math.radians(degrees)
    cosine, sine = math.cos(angle), math.sin(angle)
    points[:, 0] = base_x + xx * cosine + zz * sine
    points[:, 2] = base_z - xx * sine + zz * cosine
    return points, source


def _draw_iris_scene(seed: int, yaw: float, skin: int, iris: int) -> tuple[np.ndarray, np.ndarray]:
    """Draw actual visible iris pixels over a plain artificial backdrop."""
    points, source = _turned(seed, yaw)
    source = np.full(source.shape, (skin, skin * 0.8, skin * 0.7), dtype=np.uint8)
    for side in ("right", "left"):
        mask = regions.region_mask(
            side + "_iris", points, *source.shape[:2], normalized=False, supersample=1
        )
        support = mask >= 0.5
        source[support] = (iris, max(0, iris - 8), max(0, iris - 16))
        positions = np.argwhere(support)
        if len(positions):
            yy, xx = positions[len(positions) // 3]
            source[yy, xx] = (252, 252, 252)
    return points, source


@pytest.mark.parametrize("skin", (22, 55, 93, 136, 185, 236))
@pytest.mark.parametrize("iris", (31, 82, 145))
@pytest.mark.parametrize("yaw", (0.0, 45.0, 80.0, -80.0))
def test_iris_probe_accepts_measured_visible_eye(
    skin: int, iris: int, yaw: float
) -> None:
    points, source = _draw_iris_scene(0, yaw, skin, iris)
    unchanged = source.copy()
    result = _checks().iris_recolour(source, points)
    assert result.passed, (result.check, result.measurements)
    expected = 1 if abs(yaw) == 80.0 else 2
    assert result.measurements["visible_irises"] == expected
    assert not result.measurements["undeclared_missing"]
    assert result.measurements["outside_unchanged"]
    assert result.measurements["catchlight_unchanged"]
    assert result.measurements["iris_pixels"] > 0
    assert result.output is not None
    np.testing.assert_array_equal(source, unchanged)
    if yaw == 80.0:
        assert "right:hidden_by_turn" in result.measurements["declared_not_visible"]
    elif yaw == -80.0:
        assert "left:hidden_by_turn" in result.measurements["declared_not_visible"]


def _closed_eye(points: np.ndarray, side: str) -> np.ndarray:
    out = points.copy()
    indices = list(regions.RIGHT_EYE if side == "right" else regions.LEFT_EYE)
    centre = float(np.mean(out[indices, 1]))
    out[indices, 1] = centre
    iris = (468, 469, 470, 471, 472) if side == "right" else (473, 474, 475, 476, 477)
    out[list(iris), 1] = centre
    return out


@pytest.mark.parametrize("closed", ("right", "left"))
def test_one_closed_eye_keeps_the_other_eligible(closed: str) -> None:
    points, source = _draw_iris_scene(0, 0, 105, 48)
    points = _closed_eye(points, closed)
    result = _checks().iris_recolour(source, points)
    assert result.passed
    assert result.measurements["visible_irises"] == 1
    assert closed + ":closed" in result.measurements["declared_not_visible"]


def test_both_closed_eyes_cannot_be_a_quality_pass() -> None:
    points, source = _draw_iris_scene(0, 0, 114, 55)
    points = _closed_eye(_closed_eye(points, "left"), "right")
    result = _checks().iris_recolour(source, points)
    assert not result.passed
    assert result.measurements["visible_irises"] == 0
    assert result.measurements["iris_pixels"] == 0


def test_undeclared_missing_iris_is_not_a_hidden_side() -> None:
    points, source = _draw_iris_scene(0, 0, 93, 45)
    ids = (468, 469, 470, 471, 472)
    points[list(ids), 0] = -50.0
    result = _checks().iris_recolour(source, points)
    assert not result.passed
    assert result.measurements["undeclared_missing"]
    assert not result.measurements["declared_not_visible"]


def _hair_scene(
    mean: float,
    depth: float,
    texture: str,
    mask_kind: str,
) -> tuple[np.ndarray, np.ndarray]:
    """Draw striped strands with a soft annotation edge, no real hair data."""
    yy, xx = np.indices((HEIGHT, WIDTH), dtype=np.float64)
    mask = np.zeros((HEIGHT, WIDTH), dtype=np.float64)
    mask[15:95, 15:110] = 1.0
    if mask_kind == "soft":
        mask[15:95, 15:19] = 0.2
        mask[15:95, 19:23] = 0.75
    period = {"straight": 7.0, "wavy": 10.0, "curly": 13.0, "coily": 5.0}[texture]
    displacement = {"straight": 0.0, "wavy": 2.0, "curly": 5.0, "coily": 2.0}[texture]
    phase = 2 * math.pi * (xx + displacement * np.sin(yy / 11)) / period
    luminance = mean + depth * np.sin(phase) + depth * 0.2 * np.sin(yy / 11)
    image = np.full((HEIGHT, WIDTH, 3), (175, 176, 180), np.uint8)
    for channel, scale in enumerate((1.0, 0.95, 0.9)):
        values = np.clip(luminance * scale, 0, 255).astype(np.uint8)
        image[..., channel][mask > 0] = values[mask > 0]
    return image, mask


@pytest.mark.parametrize("texture", ("straight", "wavy", "curly", "coily"))
@pytest.mark.parametrize("mask_kind", ("boolean", "soft"))
@pytest.mark.parametrize("mean,depth", ((35.0, 35.0), (85.0, 45.0), (130.0, 60.0)))
def test_hair_colours_pass_box_probes_with_observed_mask(
    mean: float, depth: float, texture: str, mask_kind: str
) -> None:
    image, mask = _hair_scene(mean, depth, texture, mask_kind)
    original = image.copy()
    choices = _checks().hair_w39(image, mask)
    assert len(choices) == 3
    for result in choices:
        assert result.passed, (result.check, result.measurements)
        assert result.measurements["mask_observed"]
        assert result.measurements["outside_max_abs_diff"] == 0.0
        assert result.measurements["highlight_correlation"] >= 0.9
        assert result.output is not None
        np.testing.assert_array_equal(result.output[mask < 0.5], original[mask < 0.5])
    np.testing.assert_array_equal(image, original)


@pytest.mark.parametrize("texture", ("straight", "wavy", "curly", "coily"))
@pytest.mark.parametrize("mask_kind", ("boolean", "soft"))
@pytest.mark.parametrize("mean,depth", ((35.0, 60.0), (85.0, 55.0), (130.0, 60.0)))
def test_balayage_passes_box_probe_with_observed_mask(
    mean: float, depth: float, texture: str, mask_kind: str
) -> None:
    image, mask = _hair_scene(mean, depth, texture, mask_kind)
    original = image.copy()
    result = _checks().balayage_w28(image, mask)
    assert result.passed, result.measurements
    assert result.measurements["mask_observed"]
    assert result.measurements["outside_max_abs_diff"] == 0.0
    assert result.measurements["highlight_correlation"] >= 0.9
    assert result.output is not None
    np.testing.assert_array_equal(result.output[mask < 0.5], original[mask < 0.5])
    np.testing.assert_array_equal(image, original)


def test_missing_external_hair_annotation_remains_unmeasured() -> None:
    image, _ = _hair_scene(80, 50, "coily", "boolean")
    checks = _checks().hair_w39(image, None)
    assert len(checks) == 3
    assert all(not item.passed and item.measurements["mask_observed"] is False for item in checks)
    item = _checks().balayage_w28(image, None)
    assert not item.passed
    assert item.measurements["outside_max_abs_diff"] == -1.0


def test_soft_mask_never_changes_pixels_below_observed_boundary() -> None:
    image, mask = _hair_scene(75, 60, "coily", "soft")
    result = recolour.recolour_hair(image, mask, (55.0, 18.0, 22.0), strength=0.6)
    np.testing.assert_array_equal(result.image[mask < 0.5], image[mask < 0.5])
    assert np.any(result.image[mask >= 0.5] != image[mask >= 0.5])
    assert np.all(result.alpha[mask < 0.5] == 0)
    strokes = np.zeros(mask.shape, dtype=np.float64)
    strokes[20:90, 20:95] = 1.0
    painted = balayage.paint(image, mask, strokes, base_level=4, target_level=6)
    np.testing.assert_array_equal(painted.image[mask < 0.5], image[mask < 0.5])
    assert np.all(painted.lift[mask < 0.5] == 0)


def test_changed_background_is_caught_as_an_actual_leak() -> None:
    image, mask = _hair_scene(85, 40, "wavy", "boolean")
    altered = image.copy()
    altered[0, 0, 0] ^= 1
    assert not recolour.geometry_checks(image, altered, mask)["outside_unchanged"]

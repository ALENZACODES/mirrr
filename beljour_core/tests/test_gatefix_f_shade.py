"""Drawn-only shade gate regression and truthful cosmetic limits.

No real-person photo, licence-restricted dataset or provider request is used.
Author: John Khan.
"""
from __future__ import annotations

import io
import math

import numpy as np
import pytest
from PIL import Image

from plumb_api.engines.core import regions
from plumb_api.engines.core.colour import ciede2000
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.finder import find_from_pixels, thresholds, zone_masks
from plumb_api.engines.shade.measurement import (
    background_from_face,
    measure_shade,
    measure_shade_with_audit,
)
from plumb_api.services.local_features import shade_analysis

HEIGHT = 192
WIDTH = 160
POINTS = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)
OVAL = regions.region_mask(
    "face_oval", POINTS, HEIGHT, WIDTH, normalized=False, supersample=2,
) >= 0.5


def make_lab(lightness: float, hue: float = 53.0, chroma: float = 17.0) -> np.ndarray:
    angle = math.radians(hue)
    return np.array([lightness, chroma * math.cos(angle), chroma * math.sin(angle)])


def painted_face(
    lab: np.ndarray,
    *,
    background: tuple[int, int, int] = (128, 128, 128),
    gains: tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> np.ndarray:
    image = np.empty((HEIGHT, WIDTH, 3), dtype=np.uint8)
    image[:] = background
    image[OVAL] = cs.to_bytes(cs.lab_to_srgb(lab))
    if gains != (1.0, 1.0, 1.0):
        image = cs.to_bytes(cs.encode(cs.decode(image) * np.asarray(gains)))
    return image


def zone_colours(image: np.ndarray) -> dict[str, np.ndarray]:
    masks = zone_masks(POINTS, HEIGHT, WIDTH)
    return {name: image[mask] for name, mask in masks.items()}


@pytest.mark.parametrize(
    "lightness", [20, 22, 24, 28, 32, 36, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
)
@pytest.mark.parametrize("hue", [40, 53, 65, 80])
def test_64_original_undertone_depth_readings_are_representable(
    lightness: int, hue: int,
) -> None:
    image = painted_face(make_lab(lightness, hue))
    result, audit, evidence = measure_shade_with_audit(image, POINTS)
    assert evidence.estimated
    assert evidence.reason == "grey_world_estimate"
    assert audit.usable
    assert result.white.mode == "grey_world"
    assert not result.refused, result.reason
    assert result.best is not None and result.measured_lab is not None
    assert result.best["delta_e"] <= thresholds()["confidence"]["refuse_delta_e_above"]
    assert result.best["lab"][0] <= result.measured_lab[0] + 1.0
    assert result.confidence["overall"] >= thresholds()["confidence"]["refuse_below"]


def test_one_public_entry_matches_complete_compatibility_record() -> None:
    image = painted_face(make_lab(55, 65))
    result = measure_shade(image, POINTS)
    read, audit, _ = measure_shade_with_audit(image, POINTS)
    assert result.to_json() == read.to_json()
    assert result.to_json()["white"]["mode"] == audit.white_mode
    assert result.to_json()["tested_against_real_products"] is False


def test_no_neutral_or_background_alone_does_not_force_good_skin_to_refuse() -> None:
    image = painted_face(make_lab(55, 53), background=(255, 255, 255))
    rgb = zone_colours(image)
    report = find_from_pixels(rgb)
    assert report.white.mode == "none"
    assert not report.refused
    assert report.confidence["lighting"] == 0.7
    assert report.confidence["overall"] >= 0.45


@pytest.mark.parametrize("gains", [(1.18, 1.0, 0.78), (0.84, 1.0, 1.22)])
def test_background_estimate_recovers_warm_and_cool_lighting(
    gains: tuple[float, float, float],
) -> None:
    target = make_lab(60, 53)
    neutral = measure_shade(painted_face(target), POINTS)
    under_cast = measure_shade(painted_face(target, gains=gains), POINTS)
    assert neutral.measured_lab is not None and under_cast.measured_lab is not None
    assert under_cast.white.mode == "grey_world"
    assert not under_cast.white.clamped
    assert ciede2000(neutral.measured_lab, under_cast.measured_lab) < 2.0
    assert under_cast.best is not None
    assert under_cast.best["lab"][0] <= under_cast.measured_lab[0] + 1.0


def test_no_guess_on_very_deep_readings_outside_own_reference() -> None:
    result = measure_shade(painted_face(make_lab(10, 65)), POINTS)
    assert result.refused
    assert result.best is None
    assert "deep enough" in str(result.reason)


def test_declared_limits_are_not_modified_by_shared_entry() -> None:
    conf = thresholds()["confidence"]
    assert conf["refuse_below"] == 0.45
    assert conf["refuse_delta_e_above"] == 6.0
    assert thresholds()["never_lighter_allowance"] == 1.0


def test_background_excludes_face_hair_and_part_of_upper_head() -> None:
    mask = background_from_face(painted_face(make_lab(55)), POINTS)
    assert mask.mask is not None
    assert not np.any(mask.mask[OVAL])
    outline = POINTS[list(regions.FACE_OVAL)]
    upper = int(max(0, np.min(outline[:, 1]) - 12))
    centre = int(round(np.mean(outline[:, 0])))
    assert not mask.mask[upper, centre]
    assert mask.usable_pixels >= 100


def test_uneven_or_multicoloured_background_is_not_used_as_neutral() -> None:
    image = painted_face(make_lab(60))
    xx = np.arange(WIDTH)[None, :]
    checker = (xx // 4) % 2 == 0
    image[~OVAL] = np.broadcast_to(
        np.where(checker[..., None], (60, 122, 197), (201, 98, 34)), image.shape,
    )[~OVAL]
    evidence = background_from_face(image, POINTS)
    assert evidence.mask is None
    assert evidence.reason == "background_mixed"
    reading = measure_shade(image, POINTS)
    assert reading.white.mode == "none"


def test_warm_light_on_one_cheek_is_reported_as_mixed_light() -> None:
    image = painted_face(make_lab(55, 60))
    zones = zone_masks(POINTS, HEIGHT, WIDTH)
    left = zones["cheek_left"]
    modified = cs.to_bytes(cs.encode(cs.decode(image[left]) * [1.8, 0.7, 0.55]))
    image[left] = modified
    result, audit, _ = measure_shade_with_audit(image, POINTS)
    assert audit.usable is False
    assert audit.reason == "mixed_lighting"
    assert result.refused and result.best is None
    assert "Lighting audit" in " ".join(result.notes)


def test_missing_background_from_cropped_image_does_not_crash_or_invent_white() -> None:
    image = painted_face(make_lab(50))
    cropped = image[25:170, 33:128]
    mesh = POINTS - np.array([33.0, 25.0])
    with pytest.raises(ValueError, match="mesh"):
        measure_shade(cropped, mesh)


@pytest.mark.parametrize("skin", [make_lab(24, 52), make_lab(60, 65), make_lab(80, 40)])
def test_local_shade_route_calls_the_same_entry(skin: np.ndarray) -> None:
    image = painted_face(skin)
    out = io.BytesIO()
    Image.fromarray(image, mode="RGB").save(out, format="PNG")
    normalized = POINTS / np.array([WIDTH, HEIGHT])
    response = shade_analysis(out.getvalue(), normalized)
    assert response["measurement"]["white"]["mode"] == "grey_world"
    assert response["measurement"]["refused"] is False
    assert response["measurement"]["never_lighter"] is True
    assert response["source"] == "local" and response["units_spent"] == 0


def test_original_image_and_mesh_are_immutable() -> None:
    image = painted_face(make_lab(34, 80))
    before = image.copy()
    mesh = POINTS.copy()
    a = measure_shade(image, mesh).to_json()
    b = measure_shade(image, mesh).to_json()
    assert a == b
    np.testing.assert_array_equal(image, before)
    np.testing.assert_array_equal(mesh, POINTS)


@pytest.mark.parametrize("bad", [None, {}, [[0.2, 0.3]], np.ones((478, 2)) * np.nan])
def test_invalid_primary_mesh_is_never_guessed(bad: object) -> None:
    with pytest.raises((TypeError, ValueError)):
        measure_shade(painted_face(make_lab(60)), bad)

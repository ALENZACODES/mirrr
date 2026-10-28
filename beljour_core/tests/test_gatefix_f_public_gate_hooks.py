"""Boundary tests for actual shade and hair render entry points.

The checked verdict never claims human quality and needs no provider call.
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import assess_shade
from plumb_api.engines.shade.colourspace import lab_to_srgb
from plumb_api.styling import checked_demo, checked_demo_batch
from plumb_api.styling.local_demo import DemoRefusal, DemoRender

HEIGHT = 192
WIDTH = 160
FACE = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)
OVAL = regions.region_mask(
    "face_oval", FACE, HEIGHT, WIDTH, normalized=False, supersample=2,
) >= 0.5


def scene(lightness: float) -> np.ndarray:
    image = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    image[:] = (128, 128, 128)
    image[OVAL] = np.rint(lab_to_srgb([lightness, 12, 18])).astype(np.uint8)
    return image


def test_shade_hook_exposes_true_observed_white_mode_and_distance() -> None:
    record = assess_shade(scene(60), FACE)
    assert record.measurable
    assert record.accepted
    assert record.reason is None
    assert record.white_mode == "grey_world"
    assert record.background_reason == "grey_world_estimate"
    assert record.confidence > 0.45
    assert record.nearest_delta_e is not None and record.nearest_delta_e <= 6.0
    assert record.measured_zones >= 2
    assert record.never_lighter
    assert record.reference_lightness is not None and record.skin_lightness is not None
    assert record.reference_lightness <= record.skin_lightness + 1.0


def test_shade_hook_coded_refusal_for_missing_mesh() -> None:
    record = assess_shade(scene(50), None)
    assert not record.measurable
    assert not record.accepted
    assert record.reason == "no_mesh"
    assert record.nearest_delta_e is None
    assert record.public()["physical_product_tested"] is False


def test_shade_hook_very_deep_out_of_range_never_makes_up_product() -> None:
    record = assess_shade(scene(7), FACE)
    assert not record.accepted
    assert record.never_lighter
    assert record.reference_lightness is None
    assert record.public()["reference_type"] == "fictional_in_house_swatch"


def test_hair_hook_returns_changed_image_and_checked_mask() -> None:
    image = scene(55)
    result = checked_demo(image, FACE, "tpl-bob", level=4.0)
    assert result.rendered
    assert isinstance(result.preview, DemoRender)
    assert result.evidence.valid
    assert result.evidence.edited_pixels > 0
    assert result.evidence.leaked_pixels == 0
    assert result.quality_status == "UNPROVEN"
    assert result.public()["quality_status"] == "UNPROVEN"
    np.testing.assert_array_equal(result.preview.image[~result.preview.support_mask],
                                  image[~result.preview.support_mask])


def test_all_twelve_local_demo_styles_have_an_actual_rendered_result() -> None:
    result = checked_demo_batch(scene(55), FACE, level=4.0)
    assert result.total == result.valid == 12
    assert result.failed == result.refused == 0
    assert result.provider_calls == 0
    assert len(result.styles) == 12


def test_hair_hook_coded_no_mesh_and_unproven_quality() -> None:
    sample = checked_demo(scene(55), None, "tpl-low-fade", level=4.0)
    assert not sample.rendered
    assert isinstance(sample.preview, DemoRefusal)
    assert sample.evidence.status == "no_mesh"
    assert sample.public()["quality_status"] == "UNPROVEN"


def test_level_one_is_not_falsely_reported_as_a_render() -> None:
    result = checked_demo(scene(55), FACE, "tpl-long-layers", level=1.0)
    assert not result.rendered
    assert result.evidence.valid
    assert result.evidence.status == "unchanged_by_level"
    assert result.public()["reason"] == "unchanged_by_level"


def test_checked_batch_is_defensive_on_duplicate_unknown_or_oversized_inputs() -> None:
    with pytest.raises(ValueError):
        checked_demo_batch(scene(55), FACE, style_ids=[])
    with pytest.raises(ValueError):
        checked_demo_batch(scene(55), FACE, style_ids=["tpl-bob", "tpl-bob"])
    with pytest.raises(ValueError):
        checked_demo_batch(scene(55), FACE, style_ids=["tpl-bob"] * 13)
    failed = checked_demo_batch(scene(55), FACE, style_ids=["not-a-real-style"])
    assert failed.total == failed.failed == failed.refused == 1
    assert failed.valid == 0


def test_primary_face_box_is_enforced_in_public_checked_path() -> None:
    image = scene(50)
    out = np.concatenate([image, image], axis=1)
    checked = checked_demo(
        out,
        FACE,
        "tpl-mid-fade-crop",
        level=4.0,
        primary_box=(0, 0, WIDTH, HEIGHT),
    )
    assert checked.rendered
    assert isinstance(checked.preview, DemoRender)
    np.testing.assert_array_equal(checked.preview.image[:, WIDTH:], out[:, WIDTH:])
    assert checked.evidence.leaked_pixels == 0


def test_disclosed_skin_lightness_and_reference_distance_are_finite() -> None:
    for lightness in (24, 30, 40, 50, 60, 70, 80):
        observation = assess_shade(scene(lightness), FACE)
        body = observation.public()
        assert body["measured_zones"] >= 2
        assert math.isfinite(body["skin_lightness"])
        if body["nearest_delta_e"] is not None:
            assert math.isfinite(body["nearest_delta_e"])
        assert body["physical_product_tested"] is False
        assert body["never_lighter"] is True

"""Controlled lighting and synthetic specular preservation property checks.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from typing import Any

import numpy as np
import pytest

from lab.synth_diversity.calibration import lighting_diagnostics, texture_diagnostics
from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.lighting import LightingSpec, apply_lighting, lighting_grid
from lab.synth_diversity.optics import median_ita
from lab.synth_diversity.skin_tone import adjust_skin_tone
from lab.synth_diversity.types import SyntheticInputError


@pytest.mark.parametrize("size", [(96, 96), (192, 224), (512, 512)])
def test_illumination_changes_skin_but_not_background(size: tuple[int, int]) -> None:
    face = make_drawn_face(size=size)
    spec = LightingSpec(-0.5, 0.45, "right", 0.23, 0.6, 0.31, 0.08)
    result = apply_lighting(face, spec)
    assert result.image.dtype == np.uint8
    assert result.illumination.shape == face.skin_mask.shape
    assert result.specular.shape == face.skin_mask.shape
    assert result.outside_changed_pixels == 0
    assert np.count_nonzero(result.image != face.image) > 100
    assert 0 <= result.hard_clipped_fraction <= 1
    assert result.face_peak_linear > 0
    np.testing.assert_array_equal(
        result.image[face.skin_mask == 0], face.image[face.skin_mask == 0]
    )


def test_default_lamp_is_rgb_identity() -> None:
    face = make_drawn_face()
    result = apply_lighting(face, LightingSpec())
    np.testing.assert_array_equal(result.image, face.image)
    assert result.hard_clipped_fraction == 0
    assert result.outside_changed_pixels == 0


def test_strong_specular_has_measurable_preencoding_clipping() -> None:
    face = make_drawn_face(skin_rgb=(185, 128, 101))
    spec = LightingSpec(exposure_stops=1.8, specular_gain=0.9)
    illuminated = apply_lighting(face, spec)
    assert illuminated.hard_clipped_fraction > 0.10
    assert illuminated.face_peak_linear > 1.0
    assert illuminated.specular_pixel_count > 0


def test_hard_shadow_retains_non_skin_pixels_and_skin_texture() -> None:
    face = make_drawn_face(skin_rgb=(96, 62, 43))
    shaded = apply_lighting(
        face,
        LightingSpec(exposure_stops=-0.4, side_shadow_strength=0.5),
    )
    measured = texture_diagnostics(face.image, shaded.image, face.skin_mask)
    assert measured.non_skin_changed_pixels == 0
    assert measured.detail_cosine > 0.95
    assert measured.variance_ratio > 0.4


@pytest.mark.parametrize("seed", [1, 17, 400])
def test_lighting_grid_seed_identical(seed: int) -> None:
    first = lighting_grid(seed, 8)
    second = lighting_grid(seed, 8)
    assert first == second
    assert len(set(first)) == 8
    face = make_drawn_face()
    for spec in first:
        a = apply_lighting(face, spec)
        b = apply_lighting(face, spec)
        assert hashlib.sha256(a.image.tobytes()).digest() == hashlib.sha256(
            b.image.tobytes()
        ).digest()


def test_lighting_diagnostics_identify_lost_highlight_contrast() -> None:
    face = make_drawn_face()
    damaged = apply_lighting(face, LightingSpec(exposure_stops=1.7, specular_gain=0.8))
    measured = lighting_diagnostics(face.image, damaged.image, face.skin_mask)
    assert measured.highlight_contrast_before > 0
    assert np.isfinite(measured.highlight_contrast_after)
    assert np.isfinite(measured.contrast_ratio)


def test_moderate_light_has_bounded_deep_tone_target_shift() -> None:
    face = make_drawn_face(skin_rgb=(98, 67, 46))
    lamp = apply_lighting(
        face,
        LightingSpec(exposure_stops=-0.1, side_shadow_strength=0.25, specular_gain=0.11),
    )
    original = adjust_skin_tone(face.image, face.skin_mask, "VI")
    affected = adjust_skin_tone(lamp.image, face.skin_mask, "VI")
    assert affected.inside_band
    assert original.inside_band
    assert abs(median_ita(affected.image, face.skin_mask) - original.final_ita) < 2
    assert np.isfinite(affected.texture_variance_ratio)


@pytest.mark.parametrize(
    "bad",
    [
        {"exposure_stops": 5.0},
        {"side_shadow_strength": 0.95},
        {"side_shadow_direction": "up"},
        {"specular_gain": -0.1},
        {"specular_x": -0.2},
        {"specular_y": 1.01},
        {"specular_radius": 0.01},
        {"warm_bias": 0.5},
        {"warm_bias": float("nan")},
    ],
)
def test_invalid_test_lamp_is_rejected(bad: dict[str, Any]) -> None:
    with pytest.raises(SyntheticInputError):
        LightingSpec(**bad)


def test_lighting_grid_bounds_and_seed_validation() -> None:
    with pytest.raises(SyntheticInputError):
        lighting_grid(-1, 3)
    with pytest.raises(SyntheticInputError):
        lighting_grid(17, 0)
    with pytest.raises(SyntheticInputError):
        lighting_grid(17, 513)

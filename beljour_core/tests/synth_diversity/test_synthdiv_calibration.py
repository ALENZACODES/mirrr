"""Controlled synthetic palette checks of the optical model's declared limits.
Author: John Khan.
"""

from __future__ import annotations

from typing import cast

import numpy as np
import pytest

from lab.synth_diversity.calibration import (
    calibration_grid,
    gamut_diagnostics,
    lighting_diagnostics,
    texture_diagnostics,
    tone_diagnostics,
)
from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.optics import (
    apply_density_shift,
    chromophore_projection,
    optical_density,
    reconstruction,
)
from lab.synth_diversity.skin_tone import ITA_BANDS, adjust_skin_tone
from lab.synth_diversity.types import SyntheticInputError, UInt8Image


@pytest.mark.parametrize("palette", [(178, 128, 103), (96, 62, 43), (205, 150, 120)])
def test_calibration_retains_optical_high_pass_on_skin(palette: tuple[int, int, int]) -> None:
    fixture = make_drawn_face(skin_rgb=palette)
    original = fixture.image.copy()
    for name in ("I", "IV", "VI"):
        tone = adjust_skin_tone(fixture.image, fixture.skin_mask, name)
        report = tone_diagnostics(
            fixture.image, tone.image, fixture.skin_mask, name, tone.melanin_shift
        )
        assert ITA_BANDS[name][0] <= report.ita_after <= ITA_BANDS[name][1]
        assert report.hue_change_degrees < 15
        assert 0.84 < report.texture.variance_ratio < 1.16
        assert report.texture.detail_cosine > 0.97
        assert report.texture.non_skin_changed_pixels == 0
        assert report.clipped_fraction_after <= report.clipped_fraction_before + 0.01
        assert report.gamut.output_of_range_fraction < 0.02
        assert np.isfinite(report.lab_b_after)
        assert np.isfinite(report.mean_saturation_after)
    np.testing.assert_array_equal(original, fixture.image)


def test_calibration_grid_has_one_case_per_target_and_palette() -> None:
    palette_list = ((178, 128, 103), (96, 62, 43))
    results = calibration_grid(palette_list, size=(144, 160), seed=7)
    assert len(results) == 12
    assert [r.target for r in results[:6]] == list(ITA_BANDS)
    assert [r.target for r in results[6:]] == list(ITA_BANDS)
    assert all(-90 <= r.ita_before <= 90 for r in results)
    assert all(-90 <= r.ita_after <= 90 for r in results)
    assert all(0 <= r.mean_saturation_after <= 1 for r in results)
    assert all(0 <= r.clipped_fraction_after <= 1 for r in results)
    assert all(0 <= r.gamut.near_white_fraction <= 1 for r in results)
    assert all(0 <= r.gamut.near_black_fraction <= 1 for r in results)


def test_identical_buffers_have_identical_texture_measurements() -> None:
    fixture = make_drawn_face()
    report = texture_diagnostics(fixture.image, fixture.image, fixture.skin_mask)
    assert report.variance_ratio == pytest.approx(1.0, abs=1e-7)
    assert report.detail_cosine == pytest.approx(1.0, abs=1e-7)
    assert report.detail_rms_error == pytest.approx(0.0, abs=1e-7)
    assert report.non_skin_changed_pixels == 0


def test_colour_shift_does_not_corrupt_outside_mask() -> None:
    fixture = make_drawn_face()
    transformed = apply_density_shift(fixture.image, fixture.skin_mask, melanin_shift=0.55)
    report = texture_diagnostics(fixture.image, transformed, fixture.skin_mask)
    assert report.non_skin_changed_pixels == 0
    assert 0.88 <= report.variance_ratio <= 1.12
    np.testing.assert_array_equal(
        transformed[fixture.skin_mask == 0], fixture.image[fixture.skin_mask == 0]
    )


def test_sharp_synthetic_highlights_remain_distinct() -> None:
    fixture = make_drawn_face()
    for target in ("I", "IV", "VI"):
        tone = adjust_skin_tone(fixture.image, fixture.skin_mask, target)
        metric = lighting_diagnostics(fixture.image, tone.image, fixture.skin_mask)
        assert metric.highlight_contrast_before > 0
        assert metric.highlight_contrast_after > 0
        assert metric.contrast_ratio > 0.30
        assert 0 <= metric.lightness_99_after <= 100
        assert metric.lightness_99_before >= 0


def test_projected_layers_reconstruct_original_optical_density() -> None:
    fixture = make_drawn_face(skin_rgb=(96, 62, 43))
    density = optical_density(fixture.image)
    projected = chromophore_projection(density)
    reconstructed = reconstruction(projected)
    np.testing.assert_allclose(reconstructed, density, rtol=1e-5, atol=2e-6)
    assert np.isfinite(projected.residual).all()
    assert np.isfinite(projected.melanin).all()
    assert np.isfinite(projected.haemoglobin).all()


def test_gamut_check_distinguishes_unclipped_model_and_display_rails() -> None:
    fixture = make_drawn_face(skin_rgb=(96, 62, 43))
    standard = gamut_diagnostics(fixture.image, fixture.skin_mask, melanin_shift=0.9)
    impossible = gamut_diagnostics(fixture.image, fixture.skin_mask, melanin_shift=-20.0)
    assert standard.output_of_range_fraction == 0
    assert impossible.output_of_range_fraction > 0.5
    assert impossible.negative_density_fraction > 0.5
    assert standard.mean_linear_margin > -0.1
    assert impossible.mean_linear_margin < standard.mean_linear_margin


def test_calibration_refuses_invalid_geometry_types_or_nan() -> None:
    fixture = make_drawn_face()
    with pytest.raises(SyntheticInputError, match="dimensions differ"):
        texture_diagnostics(fixture.image, fixture.image[:-1], fixture.skin_mask)
    with pytest.raises(SyntheticInputError, match="finite"):
        gamut_diagnostics(fixture.image, fixture.skin_mask, float("nan"))
    with pytest.raises(SyntheticInputError, match="sigma"):
        texture_diagnostics(fixture.image, fixture.image, fixture.skin_mask, sigma=0)
    with pytest.raises(SyntheticInputError, match="finite"):
        lighting_diagnostics(fixture.image, fixture.image, fixture.skin_mask * float("nan"))
    with pytest.raises(SyntheticInputError, match="RGB uint8"):
        lighting_diagnostics(
            cast(UInt8Image, fixture.image.astype(np.float32)),
            fixture.image,
            fixture.skin_mask,
        )


def test_palettes_are_strictly_validated_before_drawing() -> None:
    with pytest.raises(SyntheticInputError, match="at least one"):
        calibration_grid(())
    with pytest.raises(SyntheticInputError, match="palette channel"):
        calibration_grid(((10, 30, 999),))
    with pytest.raises(SyntheticInputError, match="palette channel"):
        calibration_grid(((True, 20, 30),))

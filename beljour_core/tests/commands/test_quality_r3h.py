"""Reference-based, synthetic-only quality measurements and no-op regressions.
Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.quality_r3h import assess_levels, assess_pair, psnr, ssim
from plumb_api.commands.studio import StudioQualityProcessor
from plumb_api.commands.upscale import UpscaleProcessor


def image(value: int, size: int = 36) -> ImageFrame:
    yy, xx = np.indices((size, size))
    rgb = np.stack((np.clip(xx + value, 0, 255),
                    np.clip(yy + value + 10, 0, 255),
                    np.clip((xx + yy) // 2 + value + 25, 0, 255)), axis=-1).astype(np.uint8)
    return ImageFrame(size, size, 3, rgb.tobytes())


def blend(src: ImageFrame, target: ImageFrame, level: int) -> ImageFrame:
    alpha = (level - 10) / 40
    start = np.frombuffer(src.pixels, dtype=np.uint8).astype(np.float64)
    end = np.frombuffer(target.pixels, dtype=np.uint8).astype(np.float64)
    pixels = np.floor(np.clip(start + (end - start) * alpha, 0, 255) + 0.5).astype(np.uint8)
    return ImageFrame(src.width, src.height, src.channels, pixels.tobytes())


def test_perfect_reference_psnr_and_ssim() -> None:
    reference = image(65)
    assert math.isinf(psnr(reference, reference))
    assert ssim(reference, reference) == pytest.approx(1.0)


def test_actual_reference_values_are_bounded_and_ordered() -> None:
    truth = image(70)
    damaged = image(38)
    middle = blend(damaged, truth, 30)
    assert psnr(truth, damaged) < psnr(truth, middle)
    assert ssim(truth, damaged) < ssim(truth, middle)


def test_missing_reference_is_explicit_null() -> None:
    original = image(40)
    enhanced = image(43)
    report = assess_pair("enhance", DecimalLevel(30), original, enhanced)
    assert report.psnr_db is None
    assert report.ssim is None
    assert report.reference_rmse is None
    assert report.public_metadata()["realface_pass"] is False


@pytest.mark.parametrize("name", ["enhance", "denoise", "studioquality", "poseonly"])
def test_synthetic_linear_restoration_improves_psnr_ssim_monotonically(name: str) -> None:
    damaged = image(35)
    truth = image(75)
    steps = tuple((DecimalLevel(value), blend(damaged, truth, value))
                  for value in range(10, 51, 5))
    summary = assess_levels(name, damaged, steps, reference=truth)
    assert summary.neutral_unchanged
    assert summary.modification_monotone
    assert summary.psnr_monotone
    assert summary.ssim_monotone
    assert summary.reference_present


def test_sweep_without_truth_does_not_produce_quality_pass() -> None:
    source = image(40)
    steps = ((DecimalLevel(10), source), (DecimalLevel(50), image(80)))
    summary = assess_levels("denoise", source, steps)
    assert summary.psnr_monotone is None
    assert summary.ssim_monotone is None
    assert not summary.public_metadata()["realface_pass"]


def test_upscale_neutral_baseline_is_scaled_not_same_dimensions() -> None:
    low = image(37)
    processor = UpscaleProcessor()
    initial = processor.render(low, scale=2, dose=0.2, preview=False, neutral_detail=True)
    expected = resize_reference(low, initial.width, initial.height)
    assert initial.width == 2 * low.width
    report = assess_pair("upscale", DecimalLevel(10), low, initial,
                         reference=initial, resize_baseline=expected)
    assert report.reference_rmse == 0
    assert report.ssim == pytest.approx(1.0)


def test_studio_is_measured_against_correctly_sized_reference() -> None:
    source = image(38)
    enhanced = StudioQualityProcessor().render(source, level=DecimalLevel(36), preview=True)
    quality = assess_pair("studioquality", DecimalLevel(36), source, enhanced, reference=image(58))
    assert quality.psnr_db is not None
    assert quality.ssim is not None
    assert quality.alpha_max_error == 0


def test_real_engine_level_one_is_exact_noop() -> None:
    source = image(50)
    stage = StudioQualityProcessor()
    output = stage.render(source, level=DecimalLevel(10), preview=False)
    assert output.pixels == source.pixels
    quality = assess_pair("enhance", DecimalLevel(10), source, output)
    assert quality.modified_fraction == 0.0


@pytest.mark.parametrize("wrong", ["upscale", "studioquality", "enhance"])
def test_invalid_reference_geometry_is_refused(wrong: str) -> None:
    source = image(40)
    with pytest.raises(CommandValidationError):
        assess_pair(wrong, DecimalLevel(20), source, source, reference=image(50, 48))


def test_unsorted_strength_levels_cannot_pretend_to_be_monotonic() -> None:
    source = image(40)
    with pytest.raises(CommandValidationError):
        assess_levels("denoise", source, (
            (DecimalLevel(10), source),
            (DecimalLevel(30), source),
            (DecimalLevel(20), source),
        ))


def test_missing_neutral_step_cannot_be_called_noop() -> None:
    source = image(40)
    with pytest.raises(CommandValidationError):
        assess_levels("denoise", source, (
            (DecimalLevel(20), source),
            (DecimalLevel(30), source),
        ))


def test_degrading_reference_is_reported_not_masked_by_mean_change() -> None:
    source = image(55)
    truth = image(75)
    steps = (
        (DecimalLevel(10), source),
        (DecimalLevel(30), blend(source, truth, 30)),
        (DecimalLevel(50), image(0)),
    )
    summary = assess_levels("enhance", source, steps, reference=truth)
    assert summary.psnr_monotone is False
    assert summary.ssim_monotone is False


def test_quality_metadata_contains_no_raw_frame_or_mask() -> None:
    source = image(30)
    sample = assess_pair("denoise", DecimalLevel(40), source, image(32), reference=image(36))
    exported = sample.public_metadata()
    assert "pixels" not in exported
    assert "mask" not in exported
    assert "source_hash" not in exported
    assert exported["synthetic_only"]

"""Numerical, source-checked acceptance probes with missing-truth cases.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commands.cleanup import CleanupProcessor
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.quality_metrics import cleanup_quality, upscale_quality
from plumb_api.commands.upscale import UpscaleProcessor


def scene(size: int = 35) -> ImageFrame:
    yy, xx = np.indices((size, size))
    grid = ((xx // 5 + yy // 5) % 2) * 120 + 60
    rgb = np.stack((grid, grid, (grid + xx) % 256), axis=-1).astype(np.uint8)
    return ImageFrame(size, size, 3, rgb.tobytes())


def test_cleanup_metrics_reject_false_texture_claim_without_truth() -> None:
    original = scene()
    edited = CleanupProcessor().cleanup(original, dose=0.4, preview=False)
    report = cleanup_quality(original, edited)
    assert report.measurements["texture_retention_fraction"] is None
    assert report.measurements["identity_cosine"] is None
    assert report.public_metadata()["realface_pass"] is False
    assert "pixels" not in report.public_metadata()


def test_cleanup_with_truth_records_measured_texture_fraction() -> None:
    original = scene()
    edited = CleanupProcessor().cleanup(original, dose=0.6, preview=True)
    report = cleanup_quality(original, edited, ground_truth=original, identity_cosine=0.95)
    assert report.measurements["texture_retention_fraction"] is not None
    assert report.measurements["identity_cosine"] == 0.95


def test_declared_protected_pixels_are_measured_not_inferred() -> None:
    original = scene()
    mask = bytes([255]) * (original.width * original.height)
    changed = CleanupProcessor().cleanup(original, dose=0.6, preview=False)
    report = cleanup_quality(original, changed, checked_protected=mask, checked_skin=mask)
    assert report.measurements["protected_pixel_change_fraction"] is not None
    assert report.measurements["skin_max_lstar_increase"] is not None


def test_upscale_seams_alpha_and_missing_sharpness_are_separate() -> None:
    source = scene()
    a = UpscaleProcessor(tile_size=16).upscale(source, scale=2, preview=False)
    b = UpscaleProcessor(tile_size=64).upscale(source, scale=2, preview=False)
    report = upscale_quality(source, a, independent_tiled=b)
    assert report.measurements["tile_seam_max_byte_error"] == 0
    assert report.measurements["alpha_max_byte_error"] == 0
    assert report.measurements["sharpness_change_fraction"] is None
    assert report.measurements["identity_cosine"] is None


def test_high_resolution_reference_enables_bounded_sharpness_metric() -> None:
    original = scene()
    upscaled = UpscaleProcessor().upscale(original, scale=2, preview=False)
    report = upscale_quality(original, upscaled, high_resolution_truth=upscaled)
    assert report.measurements["sharpness_change_fraction"] is not None


@pytest.mark.parametrize("bad", [-2.0, 1.4, float("nan")])
def test_invalid_identity_evidence_does_not_enter_quality_metric(bad: float) -> None:
    with pytest.raises(CommandValidationError):
        cleanup_quality(scene(), scene(), identity_cosine=bad)


def test_reject_mismatched_truth_without_reinterpreting_geometry() -> None:
    original = scene()
    other = scene(30)
    with pytest.raises(CommandValidationError):
        cleanup_quality(original, original, ground_truth=other)
    upscaled = UpscaleProcessor().upscale(original, scale=2, preview=False)
    with pytest.raises(CommandValidationError):
        upscale_quality(original, upscaled, high_resolution_truth=other)

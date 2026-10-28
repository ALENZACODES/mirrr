"""Synthetic image properties across layouts, levels and reversible plans.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commands.cleanup import CleanupProcessor
from plumb_api.commands.errors import CommandUnavailable, CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.numeric import resample_plane, validate_dose
from plumb_api.commands.regions import FaceRegions, PhotoRegionCache
from plumb_api.commands.upscale import UpscaleProcessor


def miniature(size: int, channels: int) -> ImageFrame:
    rng = np.random.default_rng(2701 + size + channels)
    data = rng.integers(0, 256, size=(size, size, channels), dtype=np.uint8)
    if channels == 4:
        data[:, :, 3] = np.where(np.indices((size, size))[0] % 3 == 0, 0, 255)
    return ImageFrame(size, size, channels, data.tobytes())


@pytest.mark.parametrize("channels", [3, 4])
@pytest.mark.parametrize("size", [1, 2, 7, 16, 33])
def test_cleanup_output_is_deterministic_for_odd_and_small_sizes(size: int, channels: int) -> None:
    image = miniature(size, channels)
    processor = CleanupProcessor()
    first = processor.cleanup(image, dose=0.4, preview=True)
    second = processor.cleanup(image, dose=0.4, preview=True)
    assert first.pixels == second.pixels
    assert first.same_layout(image)
    if channels == 4:
        assert first.pixels[3::4] == image.pixels[3::4]


@pytest.mark.parametrize("channels", [3, 4])
@pytest.mark.parametrize("size", [1, 2, 7, 16, 33])
def test_upscale_output_is_repeatable_and_clamped(size: int, channels: int) -> None:
    frame = miniature(size, channels)
    result = UpscaleProcessor(tile_size=16).upscale(frame, scale=2, preview=True)
    assert (result.width, result.height) == (2 * size, 2 * size)
    assert len(result.pixels) == (2 * size) ** 2 * channels
    assert result.pixels == UpscaleProcessor(tile_size=32).upscale(frame, scale=2, preview=True).pixels


def test_one_pixel_masks_and_repeated_resize_remain_finite() -> None:
    photo = miniature(1, 3)
    cache = PhotoRegionCache()
    cache.open(photo, lambda frame: FaceRegions(1, 1, skin=bytes([255])))
    output = cache.mask("skin", 11, 12)
    assert output is not None
    assert output.shape == (12, 11)
    assert np.all(output == 1)
    assert cache.mask("skin", 11, 12) is output


def test_face_masks_reject_missing_or_wrong_dimensions() -> None:
    photo = miniature(16, 3)
    cache = PhotoRegionCache()
    with pytest.raises(CommandValidationError):
        cache.open(photo, lambda frame: FaceRegions(1, 1, skin=bytes([255])))
    assert cache.stats.retained_bytes == 0
    with pytest.raises(CommandUnavailable):
        cache.mask("skin", 16, 16)


def test_subsecond_preview_budget_must_not_be_claimed_for_full_resolution() -> None:
    image = miniature(64, 3)
    processor = CleanupProcessor()
    processor.cleanup(image, dose=0.6, preview=False)
    report = processor.last_report
    assert report is not None
    assert report.preview is False
    assert report.elapsed_ms >= 0
    assert report.public_metadata()["quality_source"] == "local_synthetic_or_manual"


def test_bilinear_mask_resize_stays_within_original_bounds() -> None:
    source = np.zeros((7, 9), dtype=np.float64)
    source[2:5, 2:7] = 1.0
    resized = resample_plane(source, 29, 31)
    assert resized.shape == (31, 29)
    assert float(np.min(resized)) >= 0
    assert float(np.max(resized)) <= 1
    assert np.sum(resized) > 0
    assert np.sum(resized) < 29 * 31


@pytest.mark.parametrize("dose", [0.2, 0.32, 0.4, 0.51, 0.6, 0.8, 1.0])
def test_strength_is_validated_at_effect_boundary(dose: float) -> None:
    if abs(dose * 50 - round(dose * 50)) < 1e-8:
        assert validate_dose(dose) == dose
    else:
        with pytest.raises(CommandValidationError):
            validate_dose(dose)


def test_all_region_reads_are_local_and_not_serialized() -> None:
    frame = miniature(16, 3)
    mask = bytes([255]) * (16 * 16)
    cache = PhotoRegionCache()
    cache.open(frame, lambda frame: FaceRegions(16, 16, protected=mask, evidence="synthetic_test"))
    record = cache.regions
    assert record is not None
    metadata = record.public_metadata()
    assert metadata["protected_present"]
    assert "protected" not in metadata
    assert "original" not in metadata
    assert "pixels" not in metadata
    cache.close()
    assert cache.stats.retained_bytes == 0

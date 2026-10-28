"""Synthetic only: cleanup frequencies, noise, spot decisions and image invariants.
Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.commands.cleanup import CleanupProcessor
from plumb_api.commands.cleanup_detail import (
    SpotHint,
    boundary_excess,
    correct_isolated_dust,
    deblock_8x8,
    hint_coverage,
    isolated_noise_mask,
    noise_mad,
    signals,
)
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.numeric import capped_skin_rise, float_image, image_from_float, smooth5
from plumb_api.commands.regions import FaceRegions, PhotoRegionCache


def drawn(width: int = 64, height: int = 64, channels: int = 4) -> ImageFrame:
    image = np.empty((height, width, channels), dtype=np.uint8)
    yy, xx = np.indices((height, width))
    image[:, :, 0] = (40 + xx * 3 + (yy % 3) * 7) % 256
    image[:, :, 1] = (70 + yy * 2 + (xx % 4) * 5) % 256
    image[:, :, 2] = (110 + xx + yy) % 256
    if channels == 4:
        image[:, :, 3] = np.where(xx < width // 2, 255, 128)
    return ImageFrame(width, height, channels, image.tobytes())


def mask(width: int, height: int, left: int, right: int) -> bytes:
    values = np.zeros((height, width), dtype=np.uint8)
    values[:, left:right] = 255
    return values.tobytes()


@pytest.mark.parametrize("dose", [0.2, 0.4, 0.6, 0.8, 1.0])
def test_cleanup_preserves_alpha_bytes_and_input(dose: float) -> None:
    frame = drawn()
    original_bytes = bytes(frame.pixels)
    result = CleanupProcessor().cleanup(frame, dose=dose, preview=False)
    assert frame.pixels == original_bytes
    assert result.same_layout(frame)
    assert result.pixels[3::4] == frame.pixels[3::4]
    assert CleanupProcessor().last_report is None


def test_protected_eyes_and_user_checked_marks_are_unchanged() -> None:
    original = drawn()
    eye_region = mask(64, 64, 10, 24)
    protects = mask(64, 64, 38, 42)
    cache = PhotoRegionCache()
    cache.open(original, lambda frame: FaceRegions(64, 64, eyes=eye_region, protected=protects))
    processor = CleanupProcessor(cache, spots=(SpotHint(0.6, 0.45, 0.08),))
    edited = processor.cleanup(original, dose=1.0, preview=False)
    first = np.frombuffer(original.pixels, dtype=np.uint8).reshape(64, 64, 4)
    second = np.frombuffer(edited.pixels, dtype=np.uint8).reshape(64, 64, 4)
    assert np.array_equal(first[:, 10:24], second[:, 10:24])
    assert np.array_equal(first[:, 38:42], second[:, 38:42])
    assert processor.last_report is not None
    assert processor.last_report.protected_preserved


def test_dust_reduction_does_not_conflate_with_face_marks() -> None:
    image = np.full((36, 36, 3), 110, dtype=np.uint8)
    image[15, 15] = 255
    image[20, 20] = 0
    original = ImageFrame(36, 36, 3, image.tobytes())
    edited = CleanupProcessor().cleanup(original, dose=1.0, preview=True)
    result = np.frombuffer(edited.pixels, dtype=np.uint8).reshape(36, 36, 3)
    assert 110 <= result[15, 15, 0] < 255
    assert 0 < result[20, 20, 0] <= 110
    assert result[0, 0, 0] == 110


def test_restrict_auto_spots_to_isolated_extrema_only() -> None:
    image = np.full((30, 30, 3), 0.5, dtype=np.float64)
    image[14, 14] = 1.0
    image[17:22, 17:22] = 0.0
    found = isolated_noise_mask(image)
    assert found[14, 14] == 1
    assert found[19, 19] == 0
    corrected, count = correct_isolated_dust(image, 1.0)
    assert count == 1
    assert corrected[14, 14, 0] < image[14, 14, 0]
    assert np.array_equal(corrected[19, 19], image[19, 19])


def test_deblock_uses_repeated_periodic_evidence() -> None:
    frame = np.full((40, 40, 3), 0.35, dtype=np.float64)
    for x in range(8, 40, 8):
        frame[:, x:] += 0.05
    initial = boundary_excess(frame)
    corrected = deblock_8x8(frame, 1.0)
    assert initial > 0.006
    assert boundary_excess(corrected) < initial
    assert np.all(np.isfinite(corrected))


def test_nonblocky_smooth_scene_is_not_forced_to_change() -> None:
    scene = np.full((40, 40, 3), 0.4, dtype=np.float64)
    assert boundary_excess(scene) == 0
    assert np.array_equal(scene, deblock_8x8(scene, 1.0))
    assert noise_mad(scene) == 0
    frame = ImageFrame(40, 40, 3, np.full((40, 40, 3), 102, dtype=np.uint8).tobytes())
    assert CleanupProcessor().cleanup(frame, dose=1.0, preview=False).pixels == frame.pixels


def test_checked_spot_hint_changes_only_its_local_mask() -> None:
    coverage = hint_coverage(40, 40, (SpotHint(0.25, 0.25, 0.09),))
    assert 0 < np.sum(coverage) < 40 * 40 / 8
    assert coverage[10, 10] > 0
    assert coverage[39, 39] == 0


@pytest.mark.parametrize("bad", [(-0.2, 0.5, 0.01), (0.5, 1.1, 0.01), (0.5, 0.5, 0.2), (math.inf, 0.5, 0.02)])
def test_reject_invalid_checked_spot(bad: tuple[float, float, float]) -> None:
    with pytest.raises(CommandValidationError):
        SpotHint(*bad)


@pytest.mark.parametrize("value", [0, 0.19, 0.21, 1.1, math.nan, math.inf])
def test_dose_requires_explicit_decimal_level(value: float) -> None:
    with pytest.raises(CommandValidationError):
        CleanupProcessor().cleanup(drawn(8, 8), dose=value, preview=False)


def test_skin_lightness_guard_keeps_positive_lstar_change_small() -> None:
    original = np.full((12, 12, 3), 0.2, dtype=np.float64)
    edited = original + 0.5
    skin = np.ones((12, 12), dtype=np.float64)
    checked = capped_skin_rise(original, edited, skin)
    assert float(np.max(checked)) < 0.28


def test_signal_report_serializes_no_photo_or_mask_data() -> None:
    frame = drawn()
    processor = CleanupProcessor()
    processor.cleanup(frame, dose=0.6, preview=True)
    report = processor.last_report
    assert report is not None
    metadata = report.public_metadata()
    assert metadata["target_ms"] == 100.0
    assert "pixels" not in metadata
    assert "mask" not in metadata
    assert isinstance(metadata["before"], dict)


def test_noise_suppression_keeps_strong_edges_in_place() -> None:
    yy, xx = np.indices((64, 64))
    noise = ((xx * 17 + yy * 13) % 7) - 3
    picture = np.full((64, 64, 3), 80, dtype=np.int16)
    picture[:, 32:] = 170
    picture += noise[:, :, None] * 6
    frame = ImageFrame(64, 64, 3, np.clip(picture, 0, 255).astype(np.uint8).tobytes())
    original = float_image(frame)
    result = float_image(CleanupProcessor().cleanup(frame, dose=1.0, preview=False))
    original_flat = float(np.var(original[:, 8:22]))
    result_flat = float(np.var(result[:, 8:22]))
    assert result_flat <= original_flat
    contrast_before = float(np.mean(original[:, 35:40]) - np.mean(original[:, 25:30]))
    contrast_after = float(np.mean(result[:, 35:40]) - np.mean(result[:, 25:30]))
    assert abs(contrast_before - contrast_after) < 0.03


def test_numeric_round_trip_preserves_exact_uint8_rgb_and_alpha() -> None:
    frame = drawn()
    assert image_from_float(frame, float_image(frame)).pixels == frame.pixels
    assert smooth5(float_image(frame)).shape == (64, 64, 3)
    assert signals(float_image(frame)).edge_energy > 0

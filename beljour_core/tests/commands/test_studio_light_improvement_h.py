"""STUDIO light soft-key, sculpting, texture and colour diagnostics.

These checks measure final bytes, not a post-hoc release threshold.
Author: John Khan.
"""

from __future__ import annotations

from typing import cast

import numpy as np
import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.regions import FaceRegions, PhotoRegionCache
from plumb_api.commands.studio import STUDIO_LIGHT_REFERENCE, StudioQualityProcessor
from plumb_api.commands.studio_light_audit import measure_studio_light


def photo(width: int = 46, height: int = 43, *, rgba: bool = True) -> ImageFrame:
    yy, xx = np.indices((height, width))
    red = np.asarray((25 + xx * 11 + yy * 3) % 211, dtype=np.uint8)
    green = np.asarray((23 + xx * 9 + yy * 5) % 211, dtype=np.uint8)
    blue = np.asarray((27 + xx * 7 + yy * 11) % 211, dtype=np.uint8)
    pixels = np.stack((red, green, blue), axis=-1)
    if rgba:
        alpha = np.asarray((xx * 3 + yy * 7 + 19) % 256, dtype=np.uint8)
        pixels = np.dstack((pixels, alpha))
    return ImageFrame(width, height, 4 if rgba else 3, pixels.tobytes())


def checked_region(frame: ImageFrame) -> tuple[bytes, FaceRegions]:
    mask = np.zeros((frame.height, frame.width), dtype=np.uint8)
    mask[7:22, 9:25] = 255
    mask[18:21, 25:27] = 1
    packed = mask.tobytes()
    return packed, FaceRegions(frame.width, frame.height, protected=packed)


def studio_with_regions(frame: ImageFrame) -> StudioQualityProcessor:
    _mask, regions = checked_region(frame)
    cache = PhotoRegionCache()
    cache.open(frame, lambda _photo: regions)
    return StudioQualityProcessor(cache)


def test_exact_studio_light_reference_is_preserved_in_public_diagnostics() -> None:
    before = photo()
    report = measure_studio_light(before, before)
    assert report.reference == STUDIO_LIGHT_REFERENCE
    assert "soft key" in report.reference
    assert "gentle sculpting" in report.reference
    assert "texture preserved" in report.reference
    assert "colour true" in report.reference
    assert report.mean_lift_l == 0.0
    assert report.peak_lift_l == 0.0
    assert report.mean_chromaticity_drift == 0.0
    assert report.texture_energy_ratio == pytest.approx(1.0)
    assert report.sculpting_gradient_change == 0.0
    assert report.neutral_bytes_unchanged
    assert not report.realface_approved


@pytest.mark.parametrize("level", (10, 11, 17, 23, 33, 41, 50))
def test_actual_studio_levels_keep_protected_pixels_and_alpha(level: int) -> None:
    before = photo()
    mask, _regions = checked_region(before)
    processor = studio_with_regions(before)
    edited = processor.render(before, level=DecimalLevel(level), preview=False)
    result = measure_studio_light(before, edited, protected_mask=mask)
    assert result.protected_evidence_present
    assert result.protected_changed_pixels == 0
    assert result.alpha_unchanged
    assert result.mean_chromaticity_drift >= 0.0
    assert result.texture_energy_ratio is not None
    assert result.public_metadata()["realface_approved"] is False
    if level == 10:
        assert result.neutral_bytes_unchanged
    else:
        assert not result.neutral_bytes_unchanged


def test_reference_soft_key_brightens_a_generated_dark_canvas() -> None:
    before = ImageFrame(40, 30, 3, bytes([25, 28, 34] * 1200))
    edited = StudioQualityProcessor().render(before, level=DecimalLevel(45), preview=True)
    result = measure_studio_light(before, edited)
    assert result.mean_lift_l > 0.0
    assert result.peak_lift_l > 0.0
    assert result.protected_changed_pixels is None
    assert result.texture_energy_ratio is None
    assert not result.neutral_bytes_unchanged


def test_colour_shift_and_texture_loss_are_observable_without_a_new_gate() -> None:
    before = photo(rgba=False)
    raw = np.frombuffer(before.pixels, dtype=np.uint8).reshape(before.height, before.width, 3)
    shifted = raw.copy()
    shifted[:, :, 0] = 255 - shifted[:, :, 0]
    result = measure_studio_light(
        before, ImageFrame(before.width, before.height, 3, shifted.tobytes()),
    )
    assert result.mean_chromaticity_drift > 0.01
    blurred = np.full(raw.shape, 90, dtype=np.uint8)
    flat = measure_studio_light(
        before, ImageFrame(before.width, before.height, 3, blurred.tobytes()),
    )
    assert flat.texture_energy_ratio == 0.0
    assert flat.sculpting_gradient_change < 0.0
    assert flat.mean_chromaticity_drift >= 0.0


def test_fractional_protected_mask_edge_cannot_hide_a_pixel_change() -> None:
    original = photo(width=12, height=10, rgba=False)
    bytes_out = bytearray(original.pixels)
    row, column = 4, 5
    offset = (row * original.width + column) * original.channels
    bytes_out[offset] ^= 15
    mask = bytearray(original.width * original.height)
    mask[row * original.width + column] = 1
    result = measure_studio_light(
        original, ImageFrame(original.width, original.height, 3, bytes(bytes_out)),
        protected_mask=bytes(mask),
    )
    assert result.protected_changed_pixels == 1
    assert result.protected_evidence_present


def test_changed_alpha_is_visible_even_with_no_protected_annotation() -> None:
    before = photo(width=18, height=17)
    changed = bytearray(before.pixels)
    changed[3] ^= 1
    after = ImageFrame(before.width, before.height, 4, bytes(changed))
    report = measure_studio_light(before, after)
    assert not report.alpha_unchanged
    assert report.neutral_bytes_unchanged is False
    assert report.protected_changed_pixels is None


@pytest.mark.parametrize("kind", ("wrong_channels", "wrong_size", "invalid_mask", "wrong_mask_type"))
def test_studio_audit_invalid_inputs_are_rejected(kind: str) -> None:
    before = photo()
    after = before
    mask: bytes | None = None
    if kind == "wrong_channels":
        after = photo(rgba=False)
    elif kind == "wrong_size":
        after = photo(width=47)
    elif kind == "invalid_mask":
        mask = bytes(3)
    else:
        mask = cast(bytes, "not bytes")
    with pytest.raises(CommandValidationError):
        measure_studio_light(before, after, protected_mask=mask)


def test_neutral_studio_does_not_fetch_missed_masks_or_change_original() -> None:
    source = photo()
    cache = PhotoRegionCache()
    calls = 0

    def supplier(_frame: ImageFrame) -> FaceRegions:
        nonlocal calls
        calls += 1
        return checked_region(source)[1]

    cache.open(source, supplier)
    processor = StudioQualityProcessor(cache)
    for level in (10, 10, 10):
        out = processor.render(source, level=DecimalLevel(level), preview=True)
        assert out.identical(source)
    assert calls == 1
    assert cache.stats.reads == 1

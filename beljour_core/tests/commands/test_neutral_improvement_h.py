"""Adversarial final-byte resampling checks on generated colour grids.

The fixture generator and scalar reference are separate from the tiled CPU
renderer. No image files or externally sourced photographs. Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import replace
from typing import cast

import numpy as np
import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.neutral_audit import NeutralAudit, audit_neutral_upscale
from plumb_api.commands.neutral_resize import resize_neutral_tiled
from plumb_api.commands.upscale import UpscaleProcessor


def image(width: int, height: int, channels: int, kind: str) -> ImageFrame:
    yy, xx = np.indices((height, width))
    if kind == "uniform":
        red = np.full((height, width), 127, dtype=np.uint8)
    elif kind == "checker":
        red = np.asarray(((xx + yy) % 2) * 255, dtype=np.uint8)
    elif kind == "ramp":
        red = np.asarray((xx * 31 + yy * 19) % 256, dtype=np.uint8)
    else:
        red = np.zeros((height, width), dtype=np.uint8)
        red[-1, -1] = 255
    green = np.asarray((red.astype(np.int16) * 3 + 29) % 256, dtype=np.uint8)
    blue = np.asarray((red.astype(np.int16) * 7 + 41) % 256, dtype=np.uint8)
    rgb = np.stack((red, green, blue), axis=-1)
    if channels == 4:
        alpha = np.asarray((red.astype(np.int16) * 5 + 17) % 256, dtype=np.uint8)
        rgb = np.dstack((rgb, alpha))
    return ImageFrame(width, height, channels, rgb.tobytes())


@pytest.mark.parametrize("dimensions", ((1, 1), (1, 37), (39, 1), (17, 19), (63, 61)))
@pytest.mark.parametrize("channels", (3, 4))
@pytest.mark.parametrize("scale", (2, 4))
@pytest.mark.parametrize("tiles", (16, 17, 19, 32, 96))
@pytest.mark.parametrize("kind", ("uniform", "checker", "ramp", "corner"))
def test_reference_parity_at_adversarial_boundaries(
    dimensions: tuple[int, int], channels: int, scale: int, tiles: int, kind: str,
) -> None:
    source = image(*dimensions, channels, kind)
    bytes_before = source.pixels
    report = audit_neutral_upscale(source, scale=scale, tile_size=tiles)
    assert isinstance(report, NeutralAudit)
    assert report.neutral_pixel_exact
    assert report.first_difference is None
    assert report.different_bytes == 0
    assert report.largest_delta == 0
    assert report.source_unchanged and source.pixels == bytes_before
    assert report.compared_bytes == source.width * source.height * scale**2 * channels
    assert not report.realface_approved
    assert report.public_metadata()["realface_approved"] is False
    assert "sha256" not in str(report.public_metadata())
    assert report.tile_fast_path is (kind == "uniform" or dimensions == (1, 1))


def test_uniform_shortcut_does_not_hide_a_single_changed_pixel() -> None:
    original = bytearray(image(48, 52, 4, "uniform").pixels)
    modified = len(original) // 3
    original[modified] ^= 0x5A
    frame = ImageFrame(48, 52, 4, bytes(original))
    for factor in (2, 4):
        for tile in (16, 19, 51):
            measured = audit_neutral_upscale(frame, scale=factor, tile_size=tile)
            assert measured.neutral_pixel_exact
            assert not measured.tile_fast_path


def test_uniform_shortcut_matches_all_channel_bytes_and_alpha() -> None:
    for channels in (3, 4):
        source = image(93, 88, channels, "uniform")
        for scale in (2, 4):
            reference = resize_reference(source, source.width * scale, source.height * scale)
            result = resize_neutral_tiled(source, scale=scale, tile_size=17)
            assert result.fast_path_used
            assert result.estimated_peak_tile_bytes == 0
            assert result.image.pixels == reference.pixels
            assert result.tiles > 1
            assert result.image.channels == channels


def test_mismatched_reference_is_reported_with_exact_pixel_and_channel() -> None:
    source = image(17, 19, 4, "checker")

    def wrong_reference(frame: ImageFrame, width: int, height: int) -> ImageFrame:
        valid = resize_reference(frame, width, height)
        corrupted = bytearray(valid.pixels)
        position = (2 * width + 4) * valid.channels + 3
        corrupted[position] ^= 1
        return ImageFrame(width, height, valid.channels, bytes(corrupted))

    report = audit_neutral_upscale(source, scale=2, tile_size=16, reference=wrong_reference)
    assert report.neutral_pixel_exact is False
    assert report.first_difference == (2, 4, 3)
    assert report.different_bytes == 1
    assert report.largest_delta == 1
    assert report.public_metadata()["first_difference"] == (2, 4, 3)


def test_wrong_layout_is_refused_not_reported_as_a_mismatch() -> None:
    source = image(3, 4, 3, "ramp")

    def wrong_shape(frame: ImageFrame, width: int, height: int) -> ImageFrame:
        return ImageFrame(width + 1, height, frame.channels, bytes((width + 1) * height * 3))

    with pytest.raises(CommandValidationError, match="Reference dimensions"):
        audit_neutral_upscale(source, scale=4, tile_size=16, reference=wrong_shape)


@pytest.mark.parametrize("value", (True, 0, -1, 3, 5, 2.5))
def test_invalid_factor_refused_before_reference_work(value: object) -> None:
    frame = image(4, 5, 3, "ramp")
    with pytest.raises(CommandValidationError):
        audit_neutral_upscale(frame, scale=cast(int, value), tile_size=16)


@pytest.mark.parametrize("value", (0, 15, 1025, False, "64"))
def test_invalid_tiles_refused_before_reference_work(value: object) -> None:
    frame = image(4, 5, 3, "checker")
    with pytest.raises(CommandValidationError):
        audit_neutral_upscale(frame, scale=2, tile_size=cast(int, value))


def test_neutral_processor_report_and_higher_level_contract_are_distinct() -> None:
    frame = image(31, 29, 4, "ramp")
    for scale in (2, 4):
        engine = UpscaleProcessor(tile_size=19)
        neutral = engine.render(frame, scale=scale, dose=0.2, preview=False)
        reference = resize_reference(frame, frame.width * scale, frame.height * scale)
        assert neutral.identical(reference)
        assert engine.last_report is not None
        assert not engine.last_report.face_detail_enabled
        treated = engine.render(frame, scale=scale, dose=0.8, preview=False)
        assert treated.width == neutral.width and treated.height == neutral.height
        assert not treated.identical(reference)


def test_frame_layout_and_source_are_read_only() -> None:
    frame = image(21, 32, 4, "corner")
    initial = frame.pixels
    a = audit_neutral_upscale(frame, scale=2, tile_size=16)
    b = audit_neutral_upscale(frame, scale=2, tile_size=29)
    assert a == replace(b, tile_size=16)
    assert frame.pixels == initial


def test_reference_injection_must_be_callable() -> None:
    frame = image(8, 7, 3, "checker")
    with pytest.raises(CommandValidationError):
        audit_neutral_upscale(
            frame, scale=2, tile_size=16, reference=cast(Callable[..., ImageFrame], None),
        )

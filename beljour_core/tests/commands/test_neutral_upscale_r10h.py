"""Byte-exact neutral upscale and negative controls on generated images only.

Pixel-center reference is independent from the tiled production sampler.
Author: John Khan.
"""

from __future__ import annotations

from typing import cast

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.neutral_resize import resize_neutral_tiled
from plumb_api.commands.observed_lock import LockCaptureOptions, collect_guarded_observation
from plumb_api.commands.pro_plan import parse_pro_commands
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.upscale import UpscaleProcessor


def _frame(width: int, height: int, channels: int, seed: int = 13) -> ImageFrame:
    generator = np.random.default_rng(seed)
    pixels = generator.integers(0, 256, (height, width, channels), dtype=np.uint8)
    if channels == 4:
        pixels[0, 0, :] = [255, 0, 255, 0]
        pixels[-1, -1, :] = [14, 210, 85, 255]
    return ImageFrame(width, height, channels, pixels.tobytes())


@pytest.mark.parametrize("size", ((1, 1), (3, 5), (7, 2), (18, 19), (28, 32), (41, 37)))
@pytest.mark.parametrize("channels", (3, 4))
@pytest.mark.parametrize("scale", (2, 4))
@pytest.mark.parametrize("tile_size", (16, 17, 32, 96))
def test_neutral_equals_independent_reference(
    size: tuple[int, int], channels: int, scale: int, tile_size: int,
) -> None:
    frame = _frame(*size, channels, seed=150 + sum(size))
    original_bytes = frame.pixels
    expected = resize_reference(frame, frame.width * scale, frame.height * scale)
    resized = resize_neutral_tiled(frame, scale=scale, tile_size=tile_size)
    assert resized.image.identical(expected)
    assert resized.tiles >= 1
    assert resized.estimated_peak_tile_bytes <= tile_size * tile_size * channels * 57
    assert frame.pixels == original_bytes


@pytest.mark.parametrize("scale", (2, 4))
@pytest.mark.parametrize("channels", (3, 4))
def test_processor_uses_reference_at_level_one(scale: int, channels: int) -> None:
    source = _frame(28, 20, channels)
    processor = UpscaleProcessor(tile_size=16)
    output = processor.render(source, scale=scale, dose=0.2, preview=True)
    assert output.identical(resize_reference(source, source.width * scale, source.height * scale))
    assert processor.last_report is not None
    assert not processor.last_report.face_detail_enabled
    assert processor.last_report.tile_count > 1
    assert processor.last_report.elapsed_ms >= 0.0


@pytest.mark.parametrize("scale", (2, 4))
def test_higher_strength_skip_detail_keeps_cubic_sampler(scale: int) -> None:
    source = _frame(21, 15, 4)
    result = UpscaleProcessor(tile_size=17).render(
        source, scale=scale, dose=0.72, preview=False, neutral_detail=True,
    )
    assert not result.identical(resize_reference(source, source.width * scale, source.height * scale))


def test_non_neutral_cubic_resample_preserved() -> None:
    source = _frame(21, 15, 4)
    expected = resize_reference(source, 42, 30)
    output = UpscaleProcessor().render(source, scale=2, dose=0.8, preview=False)
    assert not output.identical(expected)


def test_neutral_cubic_mismatch_negative_control() -> None:
    source = _frame(21, 15, 3)
    expected = resize_reference(source, 42, 30)
    cubic = UpscaleProcessor().render(source, scale=2, dose=0.8, preview=True)
    differences = sum(a != b for a, b in zip(expected.pixels, cubic.pixels, strict=True))
    assert differences > 0
    neutral = UpscaleProcessor().render(source, scale=2, dose=0.2, preview=True)
    assert neutral.identical(expected)


def test_real_guarded_preview_and_export_accept_neutral() -> None:
    photo = _frame(32, 28, 4)
    guard = IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
    session = R2HSession(identity=guard)
    session.open_photo(photo)
    plan = parse_pro_commands("/upscale 1.0 scale=2x")
    preview = session.run(plan, quality="preview")
    exported = session.run(plan, quality="export")
    evidence = collect_guarded_observation(
        photo, preview, exported,
        options=LockCaptureOptions(
            neutral_upscale_detail=True,
            checked_protected_regions=True,
        ),
    )
    assert evidence.neutral_correct
    assert evidence.alpha_unchanged
    assert evidence.identity_applied
    assert not evidence.measured_device


@pytest.mark.parametrize("scale", (0, 1, 3, 5, -2))
def test_bad_scale_rejected(scale: int) -> None:
    photo = _frame(2, 2, 3)
    with pytest.raises(CommandValidationError):
        resize_neutral_tiled(photo, scale=scale, tile_size=32)


@pytest.mark.parametrize("tile_size", (0, 7, 1025, 1.5, True))
def test_bad_tile_size_rejected(tile_size: object) -> None:
    photo = _frame(2, 2, 3)
    with pytest.raises(CommandValidationError):
        resize_neutral_tiled(photo, scale=2, tile_size=cast(int, tile_size))

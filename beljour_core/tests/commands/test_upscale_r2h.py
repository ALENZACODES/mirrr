"""Drawn-only resampling, memory, alpha and tile-seam regressions.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.regions import FaceRegions, PhotoRegionCache
from plumb_api.commands.upscale import UpscaleProcessor
from plumb_api.commands.upscale_kernel import cubic_kernel, sample_alpha_tile, tile_regions


def example(width: int = 31, height: int = 24, channels: int = 4) -> ImageFrame:
    yy, xx = np.indices((height, width))
    pixels = np.empty((height, width, channels), dtype=np.uint8)
    pixels[:, :, 0] = (40 + xx * 5 + yy * 7) % 255
    pixels[:, :, 1] = (30 + xx * xx + yy) % 255
    pixels[:, :, 2] = (20 + yy * yy + xx) % 255
    if channels == 4:
        pixels[:, :, 3] = (yy * 17 + xx * 11) % 255
    return ImageFrame(width, height, channels, pixels.tobytes())


@pytest.mark.parametrize("scale", [2, 4])
@pytest.mark.parametrize("tile", [16, 32, 96])
def test_tiled_and_single_tile_are_identical(scale: int, tile: int) -> None:
    frame = example()
    baseline = UpscaleProcessor(tile_size=256).upscale(frame, scale=scale, preview=False)
    tiled = UpscaleProcessor(tile_size=tile).upscale(frame, scale=scale, preview=False)
    assert tiled.pixels == baseline.pixels
    assert (tiled.width, tiled.height) == (frame.width * scale, frame.height * scale)


@pytest.mark.parametrize("scale", [2, 4])
def test_upscale_alpha_matches_existing_identity_aligner(scale: int) -> None:
    frame = example(13, 10, 4)
    edited = UpscaleProcessor().upscale(frame, scale=scale, preview=False)
    reference = resize_reference(frame, edited.width, edited.height)
    assert edited.pixels[3::4] == reference.pixels[3::4]


@pytest.mark.parametrize("scale", [2, 4])
def test_constant_rgba_remains_constant(scale: int) -> None:
    array = np.full((17, 23, 4), [90, 120, 180, 255], dtype=np.uint8)
    source = ImageFrame(23, 17, 4, array.tobytes())
    upscaled = UpscaleProcessor().upscale(source, scale=scale, preview=False)
    target = np.frombuffer(upscaled.pixels, dtype=np.uint8).reshape(17 * scale, 23 * scale, 4)
    assert np.all(np.abs(target[:, :, :3].astype(int) - [90, 120, 180]) <= 1)
    assert np.all(target[:, :, 3] == 255)


def test_face_detail_only_with_explicit_mask_evidence() -> None:
    frame = example(32, 32, 3)
    eye = np.zeros((32, 32), dtype=np.uint8)
    eye[10:15, 8:22] = 255
    cache = PhotoRegionCache()
    cache.open(frame, lambda source: FaceRegions(32, 32, eyes=eye.tobytes()))
    enhanced = UpscaleProcessor(cache).upscale(frame, scale=2, preview=False)
    plain = UpscaleProcessor().upscale(frame, scale=2, preview=False)
    assert enhanced.pixels != plain.pixels
    assert enhanced.pixels[:100] == plain.pixels[:100]
    assert enhanced.width == plain.width


def test_protected_region_disables_face_detail() -> None:
    frame = example(32, 32, 3)
    full = bytes([255]) * (32 * 32)
    cache = PhotoRegionCache()
    cache.open(frame, lambda source: FaceRegions(32, 32, eyes=full, protected=full))
    protected = UpscaleProcessor(cache).upscale(frame, scale=2, preview=False)
    plain = UpscaleProcessor().upscale(frame, scale=2, preview=False)
    assert protected.pixels == plain.pixels


def test_preview_keeps_true_scale_and_reports_actual_work() -> None:
    frame = example(20, 19, 3)
    processor = UpscaleProcessor(tile_size=16)
    result = processor.upscale(frame, scale=4, preview=True)
    assert (result.width, result.height) == (80, 76)
    report = processor.last_report
    assert report is not None
    assert report.preview
    assert report.tile_count > 1
    assert report.output_pixels == 6080
    assert report.largest_tile_bytes > 0
    assert report.elapsed_ms >= 0


def test_tile_plan_covers_every_output_pixel_once() -> None:
    regions = tile_regions(85, 53, tile_size=24)
    covered = np.zeros((53, 85), dtype=np.uint8)
    for entry in regions:
        covered[entry.y0:entry.y1, entry.x0:entry.x1] += 1
    assert np.all(covered == 1)
    assert max(region.pixel_count for region in regions) <= 24 * 24


@pytest.mark.parametrize("invalid", [0, 1, 3, 5, True, 2.0])
def test_invalid_scale_is_rejected(invalid: object) -> None:
    with pytest.raises(CommandValidationError):
        UpscaleProcessor().upscale(example(), scale=invalid, preview=False)


def test_max_output_pixels_refuses_without_allocating_target() -> None:
    frame = ImageFrame(2100, 1900, 3, bytes(2100 * 1900 * 3))
    with pytest.raises(CommandValidationError):
        UpscaleProcessor().upscale(frame, scale=4, preview=False)


def test_cubic_kernel_is_interpolating_and_compact() -> None:
    sample = cubic_kernel(np.array([0.0, 1.0, 2.0, 2.1]))
    assert sample[0] == 1.0
    assert all(abs(float(x)) < 1e-10 for x in sample[1:])


def test_source_never_mutated_by_upscale() -> None:
    source = example()
    initial = source.pixels
    _ = UpscaleProcessor().upscale(source, scale=2, preview=False)
    assert source.pixels == initial


def test_rgba_corners_remain_transparent_and_rgb_cannot_bleed() -> None:
    image = np.zeros((24, 24, 4), dtype=np.uint8)
    image[8:16, 8:16, :] = [255, 0, 0, 255]
    image[:2, :2, :3] = [0, 255, 255]
    frame = ImageFrame(24, 24, 4, image.tobytes())
    result = UpscaleProcessor().upscale(frame, scale=4, preview=False)
    data = np.frombuffer(result.pixels, dtype=np.uint8).reshape(96, 96, 4)
    assert np.all(data[:10, :10, 3] == 0)
    assert np.all(data[:10, :10, :3] == 0)
    assert data[45, 45, 0] >= 240

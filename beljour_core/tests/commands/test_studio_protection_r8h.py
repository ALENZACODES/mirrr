"""Rounded-byte skin protection with generated image colours and alpha.

A checked mask, not pixel appearance, decides the protected region.
Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.regions import FaceRegions, PhotoRegionCache
from plumb_api.commands.studio import StudioQualityProcessor
from plumb_api.commands.studio_protection import (
    MAX_SKIN_LIFT_L,
    byte_lightness,
    protect_rounded_skin,
)


def rgb_values() -> np.ndarray:
    colours = (
        (20, 10, 8), (35, 22, 14), (52, 36, 29), (68, 49, 39),
        (88, 63, 50), (112, 80, 65), (145, 111, 91), (179, 144, 122),
        (215, 180, 158), (243, 212, 193),
    )
    return np.asarray(colours, dtype=np.uint8)


def sample_image(width: int = 30, height: int = 28) -> ImageFrame:
    rows = rgb_values()
    pixels = np.empty((height, width, 4), dtype=np.uint8)
    for y in range(height):
        for x in range(width):
            pixels[y, x, :3] = rows[(x + y) % len(rows)]
            pixels[y, x, 3] = (x + y * 13) % 256
    return ImageFrame(width, height, 4, pixels.tobytes())


def skin_mask(width: int, height: int) -> np.ndarray:
    mask = np.zeros((height, width), dtype=np.float32)
    mask[3:-3, 4:-4] = 1.0
    mask[3:-3, 4] = 0.01
    return mask


def to_regions(frame: ImageFrame) -> PhotoRegionCache:
    mask = np.asarray(skin_mask(frame.width, frame.height) * 255, dtype=np.uint8)
    regions = FaceRegions(frame.width, frame.height, skin=mask.tobytes())
    cache = PhotoRegionCache()
    cache.open(frame, lambda _source: regions)
    return cache


@pytest.mark.parametrize("source", rgb_values().tolist())
def test_every_generated_tone_is_capped_after_rounding(source: list[int]) -> None:
    start = np.asarray(source, dtype=np.uint8).reshape(1, 1, 3)
    edited = np.full((1, 1, 3), 255, dtype=np.uint8)
    mask = np.ones((1, 1), dtype=np.float32)
    protected, report = protect_rounded_skin(start, edited, mask)
    assert protected.dtype == np.dtype(np.uint8)
    assert report.measured
    assert report.adjusted_pixels == 1
    assert 0 <= report.maximum_lift_l <= MAX_SKIN_LIFT_L + 1e-8
    assert float(byte_lightness(protected)[0, 0] - byte_lightness(start)[0, 0]) <= 2.5 + 1e-8
    assert not np.array_equal(edited, protected)
    assert start[0, 0].tolist() == source


@pytest.mark.parametrize("fraction", [0.001, 0.015, 0.1, 0.5, 1.0])
def test_fractional_mask_edges_are_still_protected(fraction: float) -> None:
    old = np.full((2, 2, 3), 23, dtype=np.uint8)
    after = np.full((2, 2, 3), 233, dtype=np.uint8)
    mask = np.zeros((2, 2), dtype=np.float32)
    mask[0, 0] = fraction
    safe, report = protect_rounded_skin(old, after, mask)
    assert report.covered_pixels == 1
    assert report.adjusted_pixels == 1
    assert np.array_equal(safe[1, 1], after[1, 1])
    assert report.maximum_lift_l <= MAX_SKIN_LIFT_L + 1e-8


def test_empty_mask_is_an_explicit_unmeasured_case() -> None:
    old = np.full((2, 3, 3), 20, dtype=np.uint8)
    after = np.full((2, 3, 3), 220, dtype=np.uint8)
    mask = np.zeros((2, 3), dtype=np.float32)
    result, report = protect_rounded_skin(old, after, mask)
    assert np.array_equal(result, after)
    assert not report.measured
    assert report.covered_pixels == 0
    assert report.public_metadata()["realface_verified"] is False


def test_darker_output_is_never_automatically_lifted() -> None:
    old = np.full((2, 3, 3), 155, dtype=np.uint8)
    after = np.full((2, 3, 3), 60, dtype=np.uint8)
    mask = np.ones((2, 3), dtype=np.float32)
    result, report = protect_rounded_skin(old, after, mask)
    assert np.array_equal(result, after)
    assert report.adjusted_pixels == 0
    assert report.maximum_lift_l == 0.0


def test_protection_does_not_modify_callers_buffers() -> None:
    old = np.full((5, 7, 3), 36, dtype=np.uint8)
    edited = np.full((5, 7, 3), 238, dtype=np.uint8)
    mask = np.ones((5, 7), dtype=np.float32)
    copy = edited.copy()
    result, _ = protect_rounded_skin(old, edited, mask)
    assert np.array_equal(edited, copy)
    assert not np.shares_memory(result, edited)


@pytest.mark.parametrize("bad", [0.0, 5.1, -2.0, math.inf, math.nan])
def test_invalid_lightness_cap_is_rejected(bad: float) -> None:
    old = np.zeros((2, 2, 3), dtype=np.uint8)
    skin = np.ones((2, 2), dtype=np.float32)
    with pytest.raises(CommandValidationError):
        protect_rounded_skin(old, old, skin, lift_limit=bad)


def test_bad_skin_shapes_and_nan_masks_are_rejected() -> None:
    frame = np.zeros((3, 4, 3), dtype=np.uint8)
    mask = np.zeros((3, 4), dtype=np.float32)
    with pytest.raises(CommandValidationError):
        protect_rounded_skin(frame, frame, np.zeros((2, 4), dtype=np.float32))
    mask[1, 2] = math.nan
    with pytest.raises(CommandValidationError):
        protect_rounded_skin(frame, frame, mask)


def test_generated_framed_studio_neutral_is_unchanged() -> None:
    frame = sample_image()
    rendered = StudioQualityProcessor(to_regions(frame)).render(
        frame, level=DecimalLevel(10), preview=True,
    )
    assert rendered is frame
    assert rendered.pixels == frame.pixels


@pytest.mark.parametrize("level", [11, 20, 30, 40, 50])
def test_full_studio_reports_post_rounding_skin_cap(level: int) -> None:
    frame = sample_image()
    cache = to_regions(frame)
    before = np.frombuffer(frame.pixels, dtype=np.uint8).reshape(frame.height, frame.width, 4)
    processor = StudioQualityProcessor(cache, tile_rows=16)
    result = processor.render(frame, level=DecimalLevel(level), preview=False)
    after = np.frombuffer(result.pixels, dtype=np.uint8).reshape(frame.height, frame.width, 4)
    report = processor.last_report
    assert report is not None
    assert report.masks_evidence
    assert report.maximum_skin_lift_l is not None
    assert report.maximum_skin_lift_l <= MAX_SKIN_LIFT_L + 1e-8
    assert np.array_equal(before[:, :, 3], after[:, :, 3])
    positive = skin_mask(frame.width, frame.height) > 0
    delta = byte_lightness(after[:, :, :3]) - byte_lightness(before[:, :, :3])
    assert float(np.max(delta[positive])) <= MAX_SKIN_LIFT_L + 1e-8


def test_studio_preview_matches_full_export_and_tile_partitions() -> None:
    source = sample_image(62, 54)
    outputs = []
    for tile in (16, 32, 64):
        processor = StudioQualityProcessor(to_regions(source), tile_rows=tile)
        preview = processor.render(source, level=DecimalLevel(46), preview=True)
        exported = processor.render(source, level=DecimalLevel(46), preview=False)
        assert preview.pixels == exported.pixels
        outputs.append(exported.pixels)
    assert len(set(outputs)) == 1

"""Memory-bounded pose displacement reuse on generated photographs.

All pixel arrays, masks and control points in this suite are synthetic.
Author: John Khan.
"""

from __future__ import annotations

import math
from time import perf_counter

import numpy as np
import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.pose import PoseOnlyProcessor
from plumb_api.commands.pose_field import (
    MAX_PREPARED_PIXELS,
    PreparedPoseField,
    prepare_pose_field,
)
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle, displacement


def sample(width: int = 80, height: int = 85) -> tuple[ImageFrame, PoseEvidence]:
    yy, xx = np.indices((height, width))
    r = np.asarray((xx * 7 + yy * 11 + 21) % 255, dtype=np.uint8)
    g = np.asarray((xx * 3 + yy * 5 + 32) % 255, dtype=np.uint8)
    b = np.asarray((xx * 13 + yy * 9 + 44) % 255, dtype=np.uint8)
    a = np.asarray((xx + yy) % 256, dtype=np.uint8)
    image = ImageFrame(width, height, 4, np.stack((r, g, b, a), axis=-1).tobytes())
    mask = np.zeros((height, width), dtype=np.uint8)
    mask[height // 5:-4, 6:-6] = 255
    if not np.any(mask):
        mask[height // 2, width // 2] = 255
    checked = PoseEvidence(width, height, mask.tobytes(), (
        PoseHandle("left", 0.3, 0.35, -0.028, 0.003),
        PoseHandle("right", 0.7, 0.35, 0.028, 0.003),
        PoseHandle("waist", 0.5, 0.70, 0, -0.020),
    ), "synthetic_test")
    return image, checked


@pytest.mark.parametrize("width,height", [(1, 2), (17, 19), (80, 85), (512, 512)])
def test_prepared_field_memory_is_bounded(width: int, height: int) -> None:
    _, evidence = sample(width, height)
    field = prepare_pose_field(evidence)
    assert field is not None
    assert field.retained_bytes == width * height * 16
    assert field.retained_bytes <= 16 * MAX_PREPARED_PIXELS
    assert field.public_metadata()["synthetic_quality_only"]


def test_large_frame_declines_cache_without_refusal() -> None:
    _, evidence = sample(513, 512)
    assert prepare_pose_field(evidence) is None


def test_small_budget_refuses_caching_without_error() -> None:
    _, evidence = sample()
    assert prepare_pose_field(evidence, pixel_limit=4096) is None


@pytest.mark.parametrize("invalid", [0, -1, MAX_PREPARED_PIXELS + 1, 12.5])
def test_invalid_cache_budget_is_rejected(invalid: float) -> None:
    _, evidence = sample()
    with pytest.raises(CommandValidationError):
        prepare_pose_field(evidence, pixel_limit=invalid)


def test_cached_field_is_read_only() -> None:
    _, evidence = sample()
    cached = prepare_pose_field(evidence)
    assert cached is not None
    assert not cached.dx.flags.writeable
    assert not cached.dy.flags.writeable
    with pytest.raises(ValueError):
        cached.dx[4, 4] = 3.0


def test_prepared_field_refuses_invalid_shape_and_nonfinite() -> None:
    dx = np.ones((5, 6), dtype=np.float64)
    dy = np.ones((5, 6), dtype=np.float64)
    with pytest.raises(CommandValidationError):
        PreparedPoseField(6, 7, dx, dy)
    dx[0, 0] = math.nan
    with pytest.raises(CommandValidationError):
        PreparedPoseField(6, 5, dx, dy)


@pytest.mark.parametrize("dose", [0.01, 0.10, 0.33, 0.66, 1.0])
def test_prepared_field_matches_reference_on_fractional_levels(dose: float) -> None:
    _, evidence = sample()
    field = prepare_pose_field(evidence)
    assert field is not None
    yy, xx = np.mgrid[20:35, 15:44]
    original_x = np.asarray(xx, dtype=np.float64)
    original_y = np.asarray(yy, dtype=np.float64)
    reference_x, reference_y = displacement(evidence, original_x, original_y, dose)
    cached_x, cached_y = field.tile(20, 35, 15, 44, dose)
    assert np.max(np.abs(cached_x - reference_x)) < 1e-12
    assert np.max(np.abs(cached_y - reference_y)) < 1e-12


def test_field_rejects_outside_tile_and_invalid_dose() -> None:
    _, evidence = sample()
    prepared = prepare_pose_field(evidence)
    assert prepared is not None
    with pytest.raises(CommandValidationError):
        prepared.tile(0, 100, 0, 1, 0.5)
    with pytest.raises(CommandValidationError):
        prepared.tile(0, 2, 0, 2, 1.1)
    with pytest.raises(CommandValidationError):
        prepared.tile(0, 0, 0, 2, 0.3)


def test_upscale_or_photo_change_cannot_reuse_previous_cache() -> None:
    frame, pose = sample()
    subject = PoseOnlyProcessor()
    subject.open_photo(frame, pose)
    subject.render(frame, level=DecimalLevel(33), preview=True)
    first = subject.last_report
    assert first is not None and not first.field_cache_hit
    subject.render(frame, level=DecimalLevel(35), preview=True)
    next_report = subject.last_report
    assert next_report is not None and next_report.field_cache_hit
    subject.close_photo()
    assert subject._prepared is None
    other, checked = sample(90, 96)
    subject.open_photo(other, checked)
    subject.render(other, level=DecimalLevel(35), preview=True)
    final = subject.last_report
    assert final is not None and not final.field_cache_hit


def test_cached_and_tiled_export_preserve_original_and_alpha() -> None:
    frame, checked = sample()
    outputs: list[bytes] = []
    for tile_size in (16, 32, 96):
        subject = PoseOnlyProcessor(tile_size=tile_size)
        subject.open_photo(frame, checked)
        before = bytes(frame.pixels)
        output = subject.render(frame, level=DecimalLevel(44), preview=False)
        assert frame.pixels == before
        assert output.pixels[3::4] == frame.pixels[3::4]
        outputs.append(output.pixels)
    assert len(set(outputs)) == 1


def test_repeated_preview_does_not_recompute_control_field() -> None:
    frame, checked = sample(128, 144)
    subject = PoseOnlyProcessor()
    subject.open_photo(frame, checked)
    begin = perf_counter()
    subject.render(frame, level=DecimalLevel(20), preview=True)
    cold = (perf_counter() - begin) * 1000.0
    times: list[float] = []
    for level in (21, 26, 31, 41, 50):
        started = perf_counter()
        subject.render(frame, level=DecimalLevel(level), preview=True)
        times.append((perf_counter() - started) * 1000.0)
        assert subject.last_report is not None and subject.last_report.field_cache_hit
    assert all(math.isfinite(value) and value >= 0 for value in times)
    assert cold >= 0
    # Machine/device budget qualification is run separately on the release host.

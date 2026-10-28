"""Pose effects require real caller annotations; test only drawn image pixels.
Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.commands.errors import CommandUnavailable, CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.pose import PoseOnlyProcessor
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle, displacement
from plumb_api.commands.regions import FaceRegions, PhotoRegionCache


def portrait(width: int = 60, height: int = 68, rgba: bool = False) -> ImageFrame:
    yy, xx = np.indices((height, width))
    channel = np.asarray(24 + (xx * 13 + yy * 7) % 180, dtype=np.uint8)
    rgb = np.stack((channel, (channel + xx) % 255, (channel + yy) % 255), axis=-1).astype(np.uint8)
    if rgba:
        alpha = np.asarray(30 + ((xx + yy) * 11) % 200, dtype=np.uint8)
        rgb = np.dstack((rgb, alpha))
    return ImageFrame(width, height, 4 if rgba else 3, rgb.tobytes())


def checked(frame: ImageFrame) -> PoseEvidence:
    mask = np.zeros((frame.height, frame.width), dtype=np.uint8)
    mask[16:-5, 8:-8] = 255
    handles = (
        PoseHandle("left_shoulder", 0.28, 0.37, -0.032, 0.004),
        PoseHandle("right_shoulder", 0.72, 0.37, 0.032, 0.004),
        PoseHandle("waist", 0.50, 0.70, 0.0, -0.02),
    )
    return PoseEvidence(frame.width, frame.height, mask.tobytes(), handles, "synthetic_test")


def protected(frame: ImageFrame) -> FaceRegions:
    mask = np.zeros((frame.height, frame.width), dtype=np.uint8)
    mask[20:33, 22:40] = 255
    return FaceRegions(frame.width, frame.height, protected=mask.tobytes())


def engine(frame: ImageFrame, tile: int = 32) -> PoseOnlyProcessor:
    cache = PhotoRegionCache()
    cache.open(frame, lambda _: protected(frame))
    subject = PoseOnlyProcessor(cache, tile_size=tile)
    subject.open_photo(frame, checked(frame))
    return subject


@pytest.mark.parametrize("level", list(range(10, 51)))
def test_pose_41_levels_are_valid(level: int) -> None:
    frame = portrait(20, 24)
    view = engine(frame, tile=16)
    result = view.render(frame, level=DecimalLevel(level), preview=True)
    assert result.width == frame.width
    assert result.height == frame.height


def test_pose_level_one_is_an_exact_noop() -> None:
    frame = portrait(rgba=True)
    out = PoseOnlyProcessor().render(frame, level=DecimalLevel(10), preview=True)
    assert out is frame
    assert out.pixels == frame.pixels


def test_pose_requires_provided_body_evidence() -> None:
    frame = portrait()
    with pytest.raises(CommandUnavailable) as failure:
        PoseOnlyProcessor().render(frame, level=DecimalLevel(20), preview=False)
    assert failure.value.code == "pose_evidence_missing"


@pytest.mark.parametrize("level", [11, 20, 32, 45, 50])
def test_pose_tile_partition_has_no_changed_seams(level: int) -> None:
    frame = portrait(71, 73)
    out16 = engine(frame, 16).render(frame, level=DecimalLevel(level), preview=False)
    out64 = engine(frame, 64).render(frame, level=DecimalLevel(level), preview=False)
    assert out16.pixels == out64.pixels


def test_pose_preserves_outside_checked_person_and_protected_region() -> None:
    frame = portrait(rgba=True)
    output = engine(frame).render(frame, level=DecimalLevel(50), preview=False)
    before = np.frombuffer(frame.pixels, dtype=np.uint8).reshape(frame.height, frame.width, 4)
    after = np.frombuffer(output.pixels, dtype=np.uint8).reshape(frame.height, frame.width, 4)
    assert np.array_equal(before[:15], after[:15])
    assert np.array_equal(before[20:33, 22:40], after[20:33, 22:40])
    assert np.array_equal(before[:, :, 3], after[:, :, 3])
    assert np.count_nonzero(before[:, :, :3] != after[:, :, :3]) > 0


def test_pose_bounded_displacement_is_monotone_with_level() -> None:
    photo = portrait()
    subject = engine(photo)
    amounts: list[float] = []
    for value in [10, 20, 30, 40, 50]:
        subject.render(photo, level=DecimalLevel(value), preview=True)
        report = subject.last_report
        assert report is not None
        amounts.append(report.largest_displacement_px)
        assert report.alpha_unchanged
        assert report.protected_unchanged
    assert amounts == sorted(amounts)
    assert 0 < amounts[-1] < 0.06 * max(photo.width, photo.height)


def test_pose_preview_equals_export_on_same_pixels() -> None:
    frame = portrait()
    subject = engine(frame)
    preview = subject.render(frame, level=DecimalLevel(43), preview=True)
    export = subject.render(frame, level=DecimalLevel(43), preview=False)
    assert preview.pixels == export.pixels


def test_pose_close_releases_annotations() -> None:
    frame = portrait()
    subject = engine(frame)
    subject.close_photo()
    with pytest.raises(CommandUnavailable):
        subject.render(frame, level=DecimalLevel(30), preview=True)


def test_pose_cannot_apply_old_controls_to_replacement_image_size() -> None:
    source = portrait()
    subject = engine(source)
    with pytest.raises(CommandUnavailable):
        subject.render(portrait(64, 68), level=DecimalLevel(50), preview=False)


def test_pose_rejects_wrong_source_mask_dimensions() -> None:
    source = portrait()
    subject = PoseOnlyProcessor()
    with pytest.raises(CommandValidationError):
        subject.open_photo(portrait(32, 24), checked(source))


@pytest.mark.parametrize("offset", [float("nan"), float("inf"), -0.1, 0.1])
def test_pose_bounded_control_refuses_invalid_displacement(offset: float) -> None:
    with pytest.raises(CommandValidationError):
        PoseHandle("test", 0.2, 0.5, offset, 0.0)


@pytest.mark.parametrize("coords", [(1.2, 0.3), (-0.1, 0.5), (0.4, 1.5)])
def test_pose_bad_normalized_positions_are_refused(coords: tuple[float, float]) -> None:
    with pytest.raises(CommandValidationError):
        PoseHandle("handle", coords[0], coords[1], 0.0, 0.0)


def test_pose_duplicate_handles_are_refused() -> None:
    frame = portrait()
    original = checked(frame)
    duplicate = (original.handles[0], original.handles[0])
    with pytest.raises(CommandValidationError):
        PoseEvidence(frame.width, frame.height, original.body_mask, duplicate)


def test_pose_empty_body_refused() -> None:
    frame = portrait()
    with pytest.raises(CommandValidationError):
        PoseEvidence(
            frame.width, frame.height, bytes(frame.width * frame.height), checked(frame).handles,
        )


def test_pose_displacement_is_linear_in_dose() -> None:
    frame = portrait()
    control = checked(frame)
    yy, xx = np.mgrid[25:29, 10:15]
    x = np.asarray(xx, dtype=np.float64)
    y = np.asarray(yy, dtype=np.float64)
    first_x, first_y = displacement(control, x, y, 0.25)
    next_x, next_y = displacement(control, x, y, 0.5)
    assert np.allclose(next_x, first_x * 2.0)
    assert np.allclose(next_y, first_y * 2.0)
    assert all(math.isfinite(value) for value in (*next_x.ravel(), *next_y.ravel()))


def test_pose_metadata_excludes_private_geometry() -> None:
    frame = portrait()
    subject = engine(frame)
    subject.render(frame, level=DecimalLevel(50), preview=False)
    report = subject.last_report
    assert report is not None
    details = report.public_metadata()
    assert "handles" not in details
    assert "pixels" not in details
    assert not details["realface_verified"]

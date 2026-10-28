"""Deterministic studio reference, safe masks, level lattice and tile parity.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.regions import FaceRegions, PhotoRegionCache
from plumb_api.commands.studio import STUDIO_LIGHT_REFERENCE, StudioQualityProcessor
from plumb_api.commands.studio_kernels import StudioSettings, studio_dose


def test_studio_reference_is_cover_lighting_not_a_release_verdict() -> None:
    assert STUDIO_LIGHT_REFERENCE == (
        "STUDIO light: cover lighting; soft key; gentle sculpting; "
        "texture preserved; colour true."
    )


def picture(width: int = 49, height: int = 47, rgba: bool = False) -> ImageFrame:
    yy, xx = np.indices((height, width))
    base = np.asarray((32 + xx * 3 + yy * 2) % 171, dtype=np.uint8)
    image = np.stack((base, (base + 24) % 255, (base + 38) % 255), axis=-1)
    if rgba:
        alpha = np.asarray((xx * 7 + yy * 11) % 255, dtype=np.uint8)
        image = np.dstack((image, alpha))
    return ImageFrame(width, height, 4 if rgba else 3, image.tobytes())


def masks(photo: ImageFrame) -> FaceRegions:
    shape = (photo.height, photo.width)
    protected = np.zeros(shape, dtype=np.uint8)
    protected[8:23, 12:28] = 255
    eyes = np.zeros(shape, dtype=np.uint8)
    eyes[12:15, 17:23] = 255
    skin = np.zeros(shape, dtype=np.uint8)
    skin[5:31, 8:37] = 255
    return FaceRegions(photo.width, photo.height, skin=skin.tobytes(),
                       eyes=eyes.tobytes(), protected=protected.tobytes())


def processor(photo: ImageFrame, *, tile_rows: int = 32) -> StudioQualityProcessor:
    cache = PhotoRegionCache()
    cache.open(photo, lambda _: masks(photo))
    return StudioQualityProcessor(cache, tile_rows=tile_rows)


@pytest.mark.parametrize("value", list(range(10, 51)))
def test_studio_41_decimal_levels_are_valid(value: int) -> None:
    level = DecimalLevel(value)
    assert 0.0 <= studio_dose(level) <= 1.0
    assert studio_dose(level) == (value - 10) / 40


def test_studio_level_one_is_byte_identical_rgba() -> None:
    frame = picture(rgba=True)
    image = StudioQualityProcessor().render(frame, level=DecimalLevel(10), preview=True)
    assert image is frame
    assert image.pixels == frame.pixels
    report = StudioQualityProcessor()
    report.render(frame, level=DecimalLevel(10), preview=True)
    assert report.last_report is not None
    assert report.last_report.modified_pixels == 0
    assert report.last_report.tile_count == 0


@pytest.mark.parametrize("level", [11, 20, 26, 33, 42, 50])
def test_studio_tile_partition_matches_absolute_reference(level: int) -> None:
    frame = picture(65, 61)
    row16 = processor(frame, tile_rows=16).render(frame, level=DecimalLevel(level), preview=False)
    row128 = processor(frame, tile_rows=128).render(frame, level=DecimalLevel(level), preview=False)
    assert row16.pixels == row128.pixels
    assert row16.width == frame.width
    assert row16.height == frame.height


def test_studio_respects_checked_regions_and_alpha_exactly() -> None:
    frame = picture(rgba=True)
    original = np.frombuffer(frame.pixels, dtype=np.uint8).reshape(frame.height, frame.width, 4)
    engine = processor(frame)
    result = engine.render(frame, level=DecimalLevel(50), preview=False)
    out = np.frombuffer(result.pixels, dtype=np.uint8).reshape(frame.height, frame.width, 4)
    assert np.array_equal(out[:, :, 3], original[:, :, 3])
    assert np.array_equal(out[8:23, 12:28], original[8:23, 12:28])
    assert np.count_nonzero(out[:, :, :3] != original[:, :, :3]) > 0
    report = engine.last_report
    assert report is not None
    assert report.protected_unchanged
    assert report.alpha_unchanged
    assert report.masks_evidence
    assert not report.public_metadata()["realface_verified"]


def test_studio_preview_and_export_use_the_same_math() -> None:
    photo = picture(64, 64)
    engine = processor(photo)
    preview = engine.render(photo, level=DecimalLevel(28), preview=True)
    full = engine.render(photo, level=DecimalLevel(28), preview=False)
    assert preview.pixels == full.pixels
    assert engine.last_report is not None
    assert engine.last_report.preview is False


def test_no_masks_does_not_infer_skin_from_rgb() -> None:
    photo = picture()
    engine = StudioQualityProcessor()
    result = engine.render(photo, level=DecimalLevel(31), preview=True)
    assert result.pixels != photo.pixels
    assert engine.last_report is not None
    assert engine.last_report.masks_evidence is False


def test_exposure_strength_has_monotone_mean_on_dark_scene() -> None:
    rgb = np.full((48, 48, 3), 28, dtype=np.uint8)
    source = ImageFrame(48, 48, 3, rgb.tobytes())
    engine = StudioQualityProcessor()
    means: list[float] = []
    for level in range(10, 51, 5):
        result = engine.render(source, level=DecimalLevel(level), preview=True)
        means.append(float(np.mean(np.frombuffer(result.pixels, dtype=np.uint8))))
    assert means == sorted(means)
    assert means[-1] > means[0]


@pytest.mark.parametrize(
    "settings",
    [
        StudioSettings(exposure_ev=0.0, contrast=0.0, warmth=0.0, clarity=0.0),
        StudioSettings(exposure_ev=-0.4, contrast=0.2, warmth=-0.025),
        StudioSettings(exposure_ev=0.5, contrast=-0.2, warmth=0.03),
    ],
)
def test_supported_manual_profiles_are_finite(settings: StudioSettings) -> None:
    frame = picture()
    engine = StudioQualityProcessor(settings=settings)
    out = engine.render(frame, level=DecimalLevel(40), preview=False)
    assert len(out.pixels) == len(frame.pixels)
    assert out.channels == frame.channels


@pytest.mark.parametrize(
    "kwargs",
    [
        {"exposure_ev": 1.2},
        {"contrast": 0.5},
        {"warmth": -0.1},
        {"clarity": -0.1},
        {"highlight_recovery": float("nan")},
    ],
)
def test_invalid_studio_settings_fail_closed(kwargs: dict[str, float]) -> None:
    with pytest.raises(CommandValidationError):
        StudioSettings(**kwargs)


@pytest.mark.parametrize("tile", [0, 1, 15, 513, 1024, True])
def test_studio_tile_budget_is_checked(tile: int) -> None:
    with pytest.raises(CommandValidationError):
        StudioQualityProcessor(tile_rows=tile)


def test_studio_readings_reused_for_level_changes() -> None:
    frame = picture()
    cache = PhotoRegionCache()
    count = [0]

    def supplier(_: ImageFrame) -> FaceRegions:
        count[0] += 1
        return masks(frame)

    cache.open(frame, supplier)
    engine = StudioQualityProcessor(cache)
    for value in [20, 28, 33, 45]:
        engine.render(frame, level=DecimalLevel(value), preview=True)
    assert count == [1]
    assert cache.stats.reads == 1
    assert cache.stats.hits >= 3


def test_studio_source_remains_immutable_on_multiple_edits() -> None:
    source = picture(rgba=True)
    original = bytes(source.pixels)
    engine = StudioQualityProcessor()
    first = engine.render(source, level=DecimalLevel(40), preview=False)
    second = engine.render(source, level=DecimalLevel(40), preview=False)
    assert first.pixels == second.pixels
    assert original == source.pixels


def test_studio_public_metadata_is_photo_free() -> None:
    source = picture()
    engine = StudioQualityProcessor()
    engine.render(source, level=DecimalLevel(40), preview=True)
    report = engine.last_report
    assert report is not None
    details = report.public_metadata()
    assert not {"pixels", "mask", "filename", "landmarks"}.intersection(details)
    assert details["peak_working_bytes"] >= 0

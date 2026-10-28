"""Protection metrics on drawn synthetic masks; no inferred facial regions.
Author: John Khan.
"""

from __future__ import annotations

import math

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.protected_quality import MaskEvidence, measure_protection


def frame(value: int, *, alpha: bool = False, width: int = 8, height: int = 6) -> ImageFrame:
    channels = 4 if alpha else 3
    data = bytearray()
    for row in range(height):
        for col in range(width):
            data.extend((value, min(255, value + col * 2), min(255, value + row * 3)))
            if alpha:
                data.append(255)
    return ImageFrame(width, height, 4 if alpha else 3, bytes(data))


def patch(source: ImageFrame, rgb: tuple[int, int, int], mask: bytes) -> ImageFrame:
    data = bytearray(source.pixels)
    for pixel, coverage in enumerate(mask):
        if coverage:
            offset = pixel * source.channels
            data[offset:offset + 3] = bytes(rgb)
    return ImageFrame(source.width, source.height, source.channels, bytes(data))


def rectangle(width: int = 8, height: int = 6) -> bytes:
    return bytes(255 if 1 <= row < height - 1 and 1 <= col < width - 1 else 0
                 for row in range(height) for col in range(width))


def test_unchanged_checked_mask_measures_zero_and_not_quality_pass() -> None:
    source = frame(55)
    report = measure_protection(
        source, source, (MaskEvidence("face", 8, 6, rectangle(), True),), required=("face",)
    )
    assert report.complete
    assert report.readings[0].changed_pixels == 0
    assert report.readings[0].mean_rgb_delta == 0
    assert report.readings[0].largest_rgb_delta == 0
    assert report.realface_pass is False
    assert report.public_metadata()["realface_pass"] is False


def test_skin_lightening_is_reported_not_hidden_in_rgb_mean() -> None:
    source = frame(40)
    mask = rectangle()
    result = patch(source, (190, 190, 190), mask)
    reading = measure_protection(
        source, result, (MaskEvidence("skin", 8, 6, mask, True),)
    ).readings[0]
    assert reading.changed_pixels == reading.eligible_pixels
    assert reading.skin_lstar_max_rise is not None
    assert reading.skin_lstar_max_rise > 0
    assert reading.boundary_largest_delta is not None
    assert reading.boundary_largest_delta > 100


def test_darkening_does_not_report_skin_lightening() -> None:
    original = frame(200)
    mask = rectangle()
    edited = patch(original, (20, 20, 20), mask)
    report = measure_protection(original, edited, (MaskEvidence("skin", 8, 6, mask, True),))
    rise = report.readings[0].skin_lstar_max_rise
    assert rise is not None
    assert rise < 0


def test_protection_evidence_can_be_empty_without_becoming_pass() -> None:
    source = frame(80)
    mask = bytes(48)
    reading = measure_protection(
        source, source, (MaskEvidence("protected", 8, 6, mask, True),),
        required=("protected",),
    )
    assert not reading.complete
    assert reading.readings[0].mean_rgb_delta is None
    assert reading.readings[0].largest_rgb_delta is None


def test_missing_required_categories_reported() -> None:
    source = frame(20)
    report = measure_protection(
        source, source, (MaskEvidence("face", 8, 6, rectangle(), True),),
        required=("face", "hair", "skin"),
    )
    assert report.missing_categories == ("hair", "skin")
    assert not report.complete


def test_unchecked_mask_is_never_complete() -> None:
    source = frame(40)
    report = measure_protection(
        source, source, (MaskEvidence("skin", 8, 6, rectangle(), False),)
    )
    assert not report.complete
    assert not report.readings[0].reference_checked


def test_alpha_changes_are_observed_only_in_relevant_regions() -> None:
    original = frame(100, alpha=True)
    mask = rectangle()
    changed = bytearray(original.pixels)
    changed[(2 * 8 + 2) * 4 + 3] = 70
    changed[3] = 0
    edited = ImageFrame(8, 6, 4, bytes(changed))
    report = measure_protection(
        original, edited, (MaskEvidence("protected", 8, 6, mask, True),)
    )
    assert report.readings[0].alpha_mismatch_pixels == 1
    assert report.readings[0].changed_pixels == 0


def test_chunked_and_single_chunk_readings_agree() -> None:
    original = frame(45, width=17, height=31)
    mask = rectangle(17, 31)
    changed = patch(original, (100, 110, 120), mask)
    evidence = (MaskEvidence("skin", 17, 31, mask, True),)
    first = measure_protection(original, changed, evidence, rows_per_chunk=1)
    second = measure_protection(original, changed, evidence, rows_per_chunk=31)
    assert first == second


@pytest.mark.parametrize("issue", ["shape", "category", "width", "kind", "duplicate"])
def test_bad_masks_fail_closed(issue: str) -> None:
    source = frame(20)
    mask = rectangle()
    if issue == "shape":
        with pytest.raises(CommandValidationError):
            MaskEvidence("skin", 8, 6, mask[:-1], True)
    elif issue == "category":
        with pytest.raises(CommandValidationError):
            measure_protection(source, source, (), required=("not-a-region",))
    elif issue == "width":
        with pytest.raises(CommandValidationError):
            measure_protection(source, source, (MaskEvidence("face", 6, 8, mask, True),))
    elif issue == "kind":
        with pytest.raises(CommandValidationError):
            MaskEvidence("unknown", 8, 6, mask, True)
    elif issue == "duplicate":
        with pytest.raises(CommandValidationError):
            evidence = (MaskEvidence("face", 8, 6, mask, True),) * 2
            measure_protection(source, source, evidence)


def test_invalid_chunk_rejected() -> None:
    source = frame(20)
    with pytest.raises(CommandValidationError):
        measure_protection(source, source, (), rows_per_chunk=0)


def test_no_nan_in_lstar_diagnostics() -> None:
    original = frame(1)
    changed = patch(original, (253, 253, 253), rectangle())
    reading = measure_protection(
        original, changed, (MaskEvidence("skin", 8, 6, rectangle(), True),)
    ).readings[0]
    assert reading.skin_lstar_max_rise is not None
    assert math.isfinite(reading.skin_lstar_max_rise)

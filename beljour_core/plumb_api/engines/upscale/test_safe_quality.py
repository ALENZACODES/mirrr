"""Invariant inspection catches tampered guarded outputs. Author: John Khan."""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from .engine import upscale
from .reference import synthetic_detail
from .safe import FaceSelection, SafeUpscaleResult, safe_upscale
from .safe_quality import inspect_safe_result


@pytest.fixture
def case() -> tuple[np.ndarray, FaceSelection, SafeUpscaleResult]:
    image = np.concatenate((synthetic_detail(36, 44), np.full((36, 44, 1), 200, np.uint8)), axis=2)
    mask = np.zeros((36, 44), np.uint8)
    mask[10:26, 12:30] = 255
    selection = FaceSelection(mask, True)
    return image, selection, safe_upscale(image, selection, detail_level=4.5)


def test_an_untouched_result_holds_every_invariant(
    case: tuple[np.ndarray, FaceSelection, SafeUpscaleResult],
) -> None:
    image, selection, result = case
    report = inspect_safe_result(image, selection, result)
    assert report["status"] == "INVARIANTS_HOLD"
    assert report["face_output_pixels"] == 16 * 18 * 4
    assert report["full_lock_pixels"] == report["face_output_pixels"]
    assert report["real_face_quality"] == "NOT_RUN"
    assert report["identity_verification"] == "NOT_PERFORMED"


def _tampered(result: SafeUpscaleResult, where: tuple[slice, slice], channel: slice) -> SafeUpscaleResult:
    pixels = result.image.copy()
    pixels[where[0], where[1], channel] ^= 1
    return replace(result, image=pixels)


@pytest.mark.parametrize(("where", "channel", "invariant"), [
    ((slice(30, 31), slice(30, 31)), slice(0, 1), "identity_lock"),
    ((slice(0, 1), slice(0, 1)), slice(1, 2), "outside_unchanged"),
    ((slice(5, 6), slice(70, 71)), slice(3, 4), "alpha"),
])
def test_single_value_tampering_is_counted(
    case: tuple[np.ndarray, FaceSelection, SafeUpscaleResult],
    where: tuple[slice, slice], channel: slice, invariant: str,
) -> None:
    image, selection, result = case
    report = inspect_safe_result(image, selection, _tampered(result, where, channel))
    assert report["status"] == "INVARIANT_FAILED"
    assert report["invariants"][invariant] is False
    assert sum(report[key] for key in ("lock_mismatches", "outside_mismatches", "alpha_mismatches")) == 1


def test_wrong_size_label_and_face_count_are_caught(
    case: tuple[np.ndarray, FaceSelection, SafeUpscaleResult],
) -> None:
    image, selection, result = case
    cropped = inspect_safe_result(image, selection, replace(result, image=result.image[:-2]))
    assert cropped["invariants"]["geometry"] is False and cropped["status"] == "INVARIANT_FAILED"
    relabelled = inspect_safe_result(image, selection, replace(result, label="Real-face PASS"))
    assert relabelled["invariants"]["evidence_label"] is False
    miscounted = inspect_safe_result(image, selection, replace(result, face_pixels=1))
    assert miscounted["invariants"]["coverage"] is False


def test_an_unguarded_engine_output_fails_the_lock(
    case: tuple[np.ndarray, FaceSelection, SafeUpscaleResult],
) -> None:
    image, selection, result = case
    plain = replace(result, image=upscale(image, scale=2, detail=0.875))
    report = inspect_safe_result(image, selection, plain)
    assert report["invariants"]["identity_lock"] is False
    assert report["full_lock_deviations"] > 0


def test_inspection_reports_counts_only(case: tuple[np.ndarray, FaceSelection, SafeUpscaleResult]) -> None:
    image, selection, result = case
    report = inspect_safe_result(image, selection, result)
    for key, value in report.items():
        assert isinstance(value, (int, str, dict)), key

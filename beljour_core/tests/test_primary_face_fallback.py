"""Detection retries on entirely synthetic arrays and frozen-denominator accounting."""
from __future__ import annotations

import math
import sys
from importlib import import_module
from pathlib import Path

import numpy as np
import pytest

from plumb_api.vision.box_first import BoxFirstDetector, DetectionResult, FaceBox
from plumb_api.vision.retry_faces import center_crop, failure_code, ordered, recover

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
select = import_module("primary_face").select


def synthetic(cx: float = 0.5, cy: float = 0.5, rx: float = 0.12,
              ry: float = 0.17) -> np.ndarray:
    theta = np.arange(478, dtype=np.float64) * (2 * math.pi / 478)
    return np.column_stack((cx + rx * np.cos(theta), cy + ry * np.sin(theta),
                            np.zeros_like(theta)))


def photo(width: int = 320, height: int = 256) -> np.ndarray:
    return np.zeros((height, width, 3), dtype=np.uint8)


def box(x: int = 104, y: int = 50, w: int = 100, h: int = 135,
        score: float = 0.95) -> FaceBox:
    return FaceBox(float(x), float(y), float(w), float(h), score)


def test_centre_crop_is_bounded_and_central() -> None:
    c = center_crop(320, 256)
    assert c.output_size == 512
    assert c.side >= 32
    assert c.left == (320 - c.side) // 2
    assert c.top == (256 - c.side) // 2


def test_larger_candidate_first_central_tiebreak() -> None:
    central = box(110, 100, 100, 100)
    edge = box(1, 1, 100, 100)
    biggest = box(200, 80, 105, 110)
    assert ordered([edge, central, biggest], 320, 256) == [biggest, central, edge]


def test_upscaled_centre_can_recover_missing_mesh() -> None:
    attempts: list[tuple[int, int]] = []
    def source(frame: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        attempts.append(frame.shape[:2])
        return [synthetic()], [{}]
    detector = BoxFirstDetector(lambda _image: [], source)
    initial = DetectionResult()
    recovered = recover(detector, photo(), initial)
    assert recovered is initial
    assert len(recovered.faces) == 1
    assert recovered.used_fallback
    assert recovered.attempts[0]["stage"] == "upscaled_centre"
    assert attempts == [(512, 512)]
    assert failure_code(recovered) == "recovered"


def test_detector_box_can_recover_off_centre_face() -> None:
    proposal = box(222, 35, 72, 88)
    def source(frame: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        if frame.mean() < 5:
            return [], []
        return [synthetic()], [{}]
    frame = photo()
    frame[:, 195:, :] = 80
    detector = BoxFirstDetector(lambda _image: [], source)
    initial = DetectionResult(boxes=[proposal])
    output = recover(detector, frame, initial)
    assert len(output.faces) == 1
    assert output.used_fallback
    assert any(a["stage"] == "upscaled_box" for a in output.attempts)


def test_too_small_box_refused_without_fake_success() -> None:
    tiny = box(20, 20, 4, 4)
    detector = BoxFirstDetector(lambda _frame: [], lambda _frame: ([], []))
    output = recover(detector, photo(), DetectionResult(boxes=[tiny]))
    assert output.faces == []
    assert failure_code(output) == "face_too_small"


def test_failed_recovery_reports_no_face_found() -> None:
    detector = BoxFirstDetector(lambda _frame: [], lambda _frame: ([], []))
    output = recover(detector, photo(), DetectionResult())
    assert failure_code(output) == "no_face_found"
    assert len(output.attempts) == 1


def test_group_crop_primary_stays_one_observation() -> None:
    main = synthetic(0.45, 0.5, 0.19, 0.24)
    visitor = synthetic(0.81, 0.5, 0.045, 0.08)
    chosen = select([visitor, main], [], 320, 256, group_crop=True)
    assert chosen.index == 1
    assert chosen.candidate_count == 2
    assert chosen.others_not_processed == 1
    assert len([chosen.index]) == 1


def test_near_equal_faces_have_deterministic_centre_tiebreak() -> None:
    main = synthetic(0.35)
    visitor = synthetic(0.65)
    outcome = select([main, visitor], [], 320, 256)
    assert outcome.accepted
    assert outcome.reason_code == "selected_centre_tiebreak"
    assert outcome.index in (0, 1)


@pytest.mark.parametrize("bad", [-1, 0, 1, 257, 1.0, float("nan")])
def test_retry_rejects_invalid_resolution_settings(bad: object) -> None:
    detector = BoxFirstDetector(lambda _frame: [], lambda _frame: ([], []))
    with pytest.raises(ValueError):
        recover(detector, photo(), DetectionResult(), min_pixels=bad)


def test_repeated_recover_does_not_duplicate_a_face() -> None:
    def source(_frame: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        return [synthetic()], [{}]
    detector = BoxFirstDetector(lambda _frame: [], source)
    result = recover(detector, photo(), DetectionResult())
    assert len(recover(detector, photo(), result).faces) == 1


def test_malformed_mesh_is_not_claimed() -> None:
    detector = BoxFirstDetector(lambda _frame: [], lambda _frame: ([np.full((478, 3), np.nan)], [{}]))
    result = recover(detector, photo(), DetectionResult())
    assert not result.faces
    assert failure_code(result) == "no_face_found"


def test_existing_mesh_does_not_hide_an_unresolved_second_person() -> None:
    existing = synthetic(0.24, 0.48, .09, .15)
    already_found = box(44, 79, 68, 90)
    missing = box(224, 65, 72, 108)
    calls: list[tuple[int, int]] = []

    def source(frame: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        calls.append(frame.shape[:2])
        if len(calls) == 1:
            return [], []
        return [synthetic(.5, .5, .18, .24)], [{}]

    detector = BoxFirstDetector(lambda _frame: [], source)
    initial = DetectionResult(faces=[existing], blendshapes=[{}], boxes=[already_found, missing])
    result = recover(detector, photo(), initial)
    assert len(result.faces) == 2
    assert len(result.blendshapes) == 2
    assert result.faces[0] is existing
    assert result.used_fallback is True
    assert [item["stage"] for item in result.attempts] == ["upscaled_centre", "upscaled_box"]
    assert len(calls) == 2


def test_every_matched_box_keeps_successful_first_pass_without_retries() -> None:
    existing = synthetic(.25, .5, .08, .14)
    proposal = box(52, 89, 58, 77)
    calls: list[int] = []

    def source(_frame: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        calls.append(1)
        return [], []

    detector = BoxFirstDetector(lambda _frame: [], source)
    initial = DetectionResult(faces=[existing], boxes=[proposal])
    recovered = recover(detector, photo(), initial)
    assert recovered is initial
    assert len(recovered.faces) == 1
    assert not calls

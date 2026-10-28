"""Drawn-only regressions for bounded mesh retries, coordinates, and refusal codes.

These exercise injected detector callbacks, never a real image or model file.
Author: John Khan.
"""
from __future__ import annotations

import math
import statistics
import time

import numpy as np
import pytest

from plumb_api.vision.box_first import BoxFirstDetector, FaceBox
from plumb_api.vision.mesh_recovery import (
    Budget,
    MAX_EXTRA_PER_BOX,
    MAX_EXTRA_PER_PHOTO,
    angles,
    attempt_counts,
    crop_trial,
    frame_share,
    rotate_trial,
    scale_trial,
)


def mesh(cx: float = 0.5, cy: float = 0.5,
         rx: float = 0.28, ry: float = 0.29) -> np.ndarray:
    theta = np.arange(478, dtype=np.float64) * (2.0 * math.pi / 478)
    return np.column_stack((cx + rx * np.cos(theta), cy + ry * np.sin(theta),
                            np.zeros_like(theta)))


def image(height: int = 280, width: int = 320) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    return np.stack(((xx + 5) % 255, (yy * 2 + 17) % 255,
                     (xx // 2 + yy // 2) % 255), axis=-1).astype(np.uint8)


def proposal(x: float = 98, y: float = 58, w: float = 115,
             h: float = 135) -> list[float]:
    return [x, y, w, h, 0.95]


def test_first_crop_keeps_exact_historical_call_sequence_and_attempts() -> None:
    frames: list[tuple[int, int, int]] = []

    def boxes(photo: np.ndarray) -> list[list[float]]:
        return [proposal()]

    def engine(photo: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        frames.append(photo.shape)
        return [mesh()], [{"mouthSmileLeft": 0.6}]

    detector = BoxFirstDetector(boxes, engine)
    result = detector.detect(image())
    assert frames == [(256, 256, 3)]
    assert len(result.faces) == 1
    assert result.blendshapes == [{"mouthSmileLeft": 0.6}]
    assert not result.used_fallback
    assert result.reason_code == "detected"
    assert result.attempts == [{"stage": "crop", "margin": 1.6,
                                "size": 256, "raw_meshes": 1,
                                "invalid_meshes": 0, "matched": True}]


@pytest.mark.parametrize("stage,call", [
    ("tight_crop", 4),
    ("wide_crop", 5),
    ("upscaled_crop", 6),
    ("rotated_crop", 7),
    ("confidence_expanded_roi", 11),
    ("contrast_crop", 12),
])
def test_recovery_stage_can_supply_a_valid_associated_mesh(
    stage: str, call: int,
) -> None:
    calls = 0

    def boxes(photo: np.ndarray) -> list[list[float]]:
        return [proposal()]

    def engine(photo: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        nonlocal calls
        calls += 1
        return ([mesh()], [{"jawOpen": 0.2}]) if calls == call else ([], [])

    result = BoxFirstDetector(boxes, engine).detect(image())
    assert len(result.faces) == 1
    assert result.reason_code == "recovered"
    assert result.used_fallback
    extra = [entry for entry in result.attempts if entry.get("extra_call")]
    assert extra[-1]["stage"] == stage
    assert extra[-1]["matched"] is True
    assert len(extra) == call - 3
    assert all(entry["matched"] is False for entry in extra[:-1])
    assert len(result.blendshapes) == 1
    assert result.blendshapes[0] == {"jawOpen": 0.2}


def test_grey_padding_recovers_a_face_near_the_edge() -> None:
    calls = 0
    box = proposal(5, 40, 65, 110)
    padding_seen = False

    def engine(photo: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        nonlocal calls, padding_seen
        calls += 1
        if calls == 7:
            padding_seen = bool((photo[0, 0] == 127).all())
            return [mesh(rx=0.18, ry=0.23)], [{}]
        return [], []

    detector = BoxFirstDetector(lambda _: [box], engine)
    result = detector.detect(image())
    assert padding_seen
    assert len(result.faces) == 1
    assert result.attempts[-1]["stage"] == "padded_crop"
    assert result.attempts[-1]["pad"] == "grey"
    assert frame_share(result.faces[0]) >= 0.98


def test_rotation_restores_mesh_coordinates_without_clipping() -> None:
    original = image(240, 320)
    box = FaceBox(100, 35, 85, 110)
    crop = crop_trial(original, box, 1.3, stage="tight_crop")
    rotated = rotate_trial(crop, 30.0)
    centre = mesh(0.4, 0.48, 0.12, 0.17)
    from plumb_api.vision.box_first import valid_mesh

    recovered = rotated.restore(centre, 320, 240, valid_mesh)
    assert recovered.shape == (478, 3)
    assert np.isfinite(recovered).all()
    # Inverse first, then original crop coordinates: roll cannot lose offsets.
    rotated_again = rotate_trial(crop, -30.0)
    assert not np.array_equal(rotated.image, rotated_again.image)
    assert abs(float(recovered[:, 0].mean()) - 0.44) < 0.04
    assert frame_share(recovered) >= 0.98


def test_yunet_five_landmarks_prioritize_a_reported_roll() -> None:
    flat = FaceBox(10, 15, 60, 80)
    assert angles(flat) == (15, -15, 30, -30, 90, -90, 180)
    upside_down = FaceBox(10, 15, 60, 80, 0.9,
                          ((80.0, 40.0), (20.0, 40.0), (45.0, 55.0),
                           (35.0, 70.0), (55.0, 70.0)))
    assert 180 in angles(upside_down)[:4]


def test_multiscale_without_boxes_tries_half_then_double() -> None:
    calls: list[tuple[int, int]] = []

    def engine(photo: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        calls.append(photo.shape[:2])
        return ([mesh()], [{}]) if len(calls) == 3 else ([], [])

    result = BoxFirstDetector(lambda _: [], engine).detect(image(240, 320))
    assert calls == [(240, 320), (120, 160), (480, 640)]
    assert len(result.faces) == 1
    assert result.reason_code == "recovered"
    assert [entry["scale"] for entry in result.attempts if entry.get("extra_call")] == [0.5, 2.0]


def test_out_of_frame_coordinates_remain_unclamped_and_unaccepted() -> None:
    invalid = mesh(1.1, 0.5, 0.30, 0.20)
    calls = 0

    def engine(photo: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        nonlocal calls
        calls += 1
        return ([invalid], [{}]) if calls == 1 else ([], [])

    result = BoxFirstDetector(lambda _: [proposal()], engine).detect(image())
    assert not result.faces
    assert result.reason_code == "mesh_out_of_frame"
    assert len(result.attempts) <= MAX_EXTRA_PER_BOX + 3


@pytest.mark.parametrize("outside_fraction", [0.05, 0.15, 0.40])
def test_partially_cropped_face_measures_actual_outside_fraction(
    outside_fraction: float,
) -> None:
    data = mesh()
    count = round(outside_fraction * len(data))
    data[:count, 0] = -0.02
    assert frame_share(data) == pytest.approx((478 - count) / 478)
    assert frame_share(data) < 0.98
    # A forged clipped-to-edge copy cannot be used as its evidence replacement.
    assert (data[:count, 0] < 0).all()


def test_extra_inference_budgets_count_every_attempt() -> None:
    calls = 0
    boxes = [proposal(40 + 70 * i, 50, 55, 66) for i in range(4)]

    def engine(photo: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        nonlocal calls
        calls += 1
        return [], []

    result = BoxFirstDetector(lambda _: boxes, engine, max_faces=6).detect(image())
    extra = [entry for entry in result.attempts if entry.get("extra_call")]
    assert 1 <= len(extra) <= MAX_EXTRA_PER_PHOTO
    assert calls == len(result.boxes) * 2 + 1 + len(extra)
    assert result.reason_code == "face_box_without_mesh"
    counts = attempt_counts(result.attempts)
    assert counts.get("rotated_crop", 0) <= MAX_EXTRA_PER_PHOTO
    assert len(extra) <= len(result.boxes) * MAX_EXTRA_PER_BOX


def test_budget_binds_at_every_boundary() -> None:
    budget = Budget()
    assert budget.per_box == 0
    for _ in range(MAX_EXTRA_PER_BOX):
        assert budget.consume()
    assert not budget.consume()
    budget.next_box()
    for _ in range(MAX_EXTRA_PER_PHOTO - MAX_EXTRA_PER_BOX):
        assert budget.consume()
    assert not budget.consume()
    assert budget.total == MAX_EXTRA_PER_PHOTO


def test_no_face_reports_a_coded_result_without_inventing_a_mesh() -> None:
    empty = BoxFirstDetector(lambda _: [], lambda _: ([], [])).detect(image())
    assert empty.reason_code == "no_face"
    assert empty.faces == []
    assert not any(entry["matched"] for entry in empty.attempts)


def test_filtered_low_confidence_box_keeps_its_refusal_code() -> None:
    calls = 0

    def engine(photo: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        nonlocal calls
        calls += 1
        return [], []

    result = BoxFirstDetector(
        lambda _: [[25.0, 40.0, 50.0, 60.0, 0.2]], engine,
    ).detect(image())
    assert not result.faces
    assert not result.boxes
    assert result.reason_code == "low_confidence"
    assert calls <= 3


def test_no_crop_recovery_returns_are_deterministic() -> None:
    box = proposal()
    def callback(frame: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        return [mesh()], [{}]
    first = BoxFirstDetector(lambda _: [box], callback).detect(image())
    second = BoxFirstDetector(lambda _: [box], callback).detect(image())
    np.testing.assert_array_equal(first.faces[0], second.faces[0])
    assert first.attempts == second.attempts


def test_timing_first_pass_has_no_additional_mesh_calls() -> None:
    """Timing test: records CPU latency, and enforces zero retry overhead calls."""
    latencies: list[float] = []
    mesh_calls = 0
    def callback(frame: np.ndarray) -> tuple[list[np.ndarray], list[dict[str, float]]]:
        nonlocal mesh_calls
        mesh_calls += 1
        return [mesh()], [{}]
    detector = BoxFirstDetector(lambda _: [proposal()], callback)
    for _ in range(5):
        start = time.perf_counter()
        result = detector.detect(image())
        latencies.append(time.perf_counter() - start)
        assert len(result.attempts) == 1
    assert mesh_calls == 5
    assert statistics.median(latencies) < 0.5


def test_contrast_and_rotation_inputs_do_not_mutate_original() -> None:
    source = image()
    before = source.copy()
    trial = crop_trial(source, FaceBox(80, 45, 120, 120), 1.6, stage="normal")
    rotated = rotate_trial(trial, 90)
    assert rotated.image.flags.c_contiguous
    assert rotated.image.dtype == np.uint8
    np.testing.assert_array_equal(source, before)
    assert scale_trial(source, 2.0).image.shape == (560, 640, 3)

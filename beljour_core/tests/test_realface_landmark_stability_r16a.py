"""R16A synthetic label-free stability; no accuracy or identity labels invented.

A detector callback is simulated with arrays so the tests use zero models,
faces, network calls and GPU allocations. Author: John Khan.
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
from landmark_stability import (  # noqa: E402
    CENTER_ANCHORS,
    JITTER_ANCHORS,
    MIRROR_PAIRS,
    assess,
    flip_distances,
    iod_pixels,
    jitter_distances,
    p95,
    summarize,
)

WIDTH, HEIGHT = 160, 128


def original() -> np.ndarray:
    rng = np.random.default_rng(7)
    mesh = np.empty((478, 3), dtype=np.float64)
    mesh[:, 0] = rng.uniform(.32, .68, 478)
    mesh[:, 1] = rng.uniform(.24, .78, 478)
    mesh[:, 2] = 0
    mesh[33, :2] = [.38, .5]
    mesh[263, :2] = [.62, .5]
    return mesh


def flip(mesh: np.ndarray) -> np.ndarray:
    mirrored = mesh.copy()
    mirrored[:, 0] = 1 - mesh[:, 0]
    for left, right in MIRROR_PAIRS:
        mirrored[left, 0] = 1 - mesh[right, 0]
        mirrored[left, 1] = mesh[right, 1]
        mirrored[right, 0] = 1 - mesh[left, 0]
        mirrored[right, 1] = mesh[left, 1]
    for index in CENTER_ANCHORS:
        mirrored[index, 0] = 1 - mesh[index, 0]
        mirrored[index, 1] = mesh[index, 1]
    return mirrored


def jitter(mesh: np.ndarray, *, dx: int = 1, dy: int = 1) -> np.ndarray:
    output = mesh.copy()
    output[:, 0] += dx / WIDTH
    output[:, 1] += dy / HEIGHT
    return output


def image() -> np.ndarray:
    output = np.full((HEIGHT, WIDTH, 3), 110, dtype=np.uint8)
    output[0, 0, 0] = 23
    return output


def detector(reference: np.ndarray, *, unstable_flip: bool = False,
             unstable_jitter: bool = False, no_flip: bool = False):
    flipped = flip(reference)
    shifted = jitter(reference)
    if unstable_flip:
        for left, right in MIRROR_PAIRS[:8]:
            flipped[left, 0] += .15
            flipped[right, 0] -= .15
    if unstable_jitter:
        shifted[list(JITTER_ANCHORS[:16]), 1] += .15

    def detect(value: np.ndarray):
        if value[0, -1, 0] == 23:
            if no_flip:
                return SimpleNamespace(faces=[], boxes=[])
            return SimpleNamespace(faces=[flipped], boxes=[])
        if value[1, 1, 0] == 23:
            return SimpleNamespace(faces=[shifted], boxes=[])
        return SimpleNamespace(faces=[], boxes=[])

    return detect


def test_expected_anchor_topology_is_disjoint_and_symmetric():
    pairs = [index for pair in MIRROR_PAIRS for index in pair]
    assert len(set(pairs)) == len(pairs)
    assert not (set(pairs) & set(CENTER_ANCHORS))
    assert max(JITTER_ANCHORS) < 478
    assert len(JITTER_ANCHORS) >= 24


def test_identity_mirror_has_zero_flip_error():
    reference = original()
    values = flip_distances(reference, flip(reference), WIDTH, HEIGHT)
    assert len(values) >= 40
    assert p95(values) == pytest.approx(0, abs=1e-12)


def test_one_pixel_translation_after_alignment_has_zero_error():
    reference = original()
    result = jitter_distances(reference, jitter(reference), WIDTH, HEIGHT)
    assert len(result) == len(JITTER_ANCHORS)
    assert p95(result) == pytest.approx(0, abs=1e-12)


def test_positive_reference_interocular_distance_is_measured_in_pixels():
    assert iod_pixels(original(), WIDTH, HEIGHT) == pytest.approx(.24 * WIDTH)


def test_full_label_free_pipeline_succeeds_and_outputs_only_scalars():
    reference = original()
    result = assess(image(), reference, detector(reference))
    assert result["flip_consistent"] is True
    assert result["jitter_stable"] is True
    assert result["label_free_pass"] is True
    assert result["landmark_stability_reason"] == "ok"
    assert result["flip_p95_iod"] == 0
    assert result["jitter_p95_iod"] == 0
    assert "mesh" not in json.dumps(result)
    assert all(not isinstance(value, np.ndarray) for value in result.values())


def test_mirrored_anchor_drift_breaks_self_consistency():
    reference = original()
    result = assess(image(), reference, detector(reference, unstable_flip=True))
    assert result["flip_consistent"] is False
    assert result["label_free_pass"] is False
    assert result["landmark_stability_reason"] == "stability_threshold_miss"


def test_jitter_drift_breaks_self_consistency():
    reference = original()
    result = assess(image(), reference, detector(reference, unstable_jitter=True))
    assert result["jitter_stable"] is False
    assert result["label_free_pass"] is False


def test_failure_to_detect_mirror_is_refusal_not_a_pass():
    reference = original()
    result = assess(image(), reference, detector(reference, no_flip=True))
    assert result["label_free_pass"] is False
    assert result["landmark_stability_reason"] == "flip_no_face"
    assert result["jitter_p95_iod"] is None


def test_perturbation_does_not_modify_original_pixels_or_landmarks():
    photograph = image()
    reference = original()
    untouched_photo = photograph.copy()
    untouched_mesh = reference.copy()
    assess(photograph, reference, detector(reference))
    assert np.array_equal(photograph, untouched_photo)
    assert np.array_equal(reference, untouched_mesh)


@pytest.mark.parametrize("value", [float("nan"), -1, 0, float("inf")])
def test_tolerances_are_strictly_positive_and_finite(value):
    reference = original()
    with pytest.raises(ValueError):
        assess(image(), reference, detector(reference), flip_limit=value)
    with pytest.raises(ValueError):
        assess(image(), reference, detector(reference), jitter_limit=value)


def test_broken_mesh_is_not_converted_to_zero_stability_error():
    wrong = np.zeros((477, 3))
    result = assess(image(), wrong, detector(original()))
    assert result["label_free_pass"] is False
    assert result["landmark_stability_reason"] == "invalid_probe"


def test_insufficient_scale_is_an_explicit_refusal():
    reference = original()
    reference[33, :2] = reference[263, :2]
    result = assess(image(), reference, detector(reference))
    assert result["landmark_stability_reason"] == "invalid_probe"
    assert result["label_free_pass"] is False


@pytest.mark.parametrize("source", [[], [1, 2, 3], [0.2] * 23, [float("nan")] * 32])
def test_insufficient_or_nonfinite_anchor_errors_cannot_pass(source):
    with pytest.raises(ValueError):
        p95(source)


def test_aggregate_is_unproven_with_single_stable_face():
    faces = [{"face_id": "sample", "labels": {"race": "unknown", "gender": "unknown"}}]
    rows = [{"module": "landmarks", "check": "mesh_valid", "face_id": "sample",
             "label_free_pass": True, "file": "do-not-export.png"}]
    summary = summarize(rows, faces)
    assert summary["whole_set"]["status"] == "UNPROVEN"
    assert summary["whole_set"]["reason"] == "small_group"
    assert "do-not-export" not in json.dumps(summary)


def test_self_consistency_can_have_an_engineering_pass_for_large_stable_set():
    faces = [{"face_id": f"synthetic{i}", "labels": {"yaw": "frontal", "slice": "drawn"}}
             for i in range(300)]
    rows = [{"module": "landmarks", "check": "mesh_valid", "face_id": face["face_id"],
             "label_free_pass": True} for face in faces]
    summary = summarize(rows, faces)
    assert summary["whole_set"]["status"] == "PASS"
    assert "does not prove" in summary["limitations"]
    assert summary["slices"][0]["total"] == 300


def test_duplicate_mesh_row_is_counted_as_unproven_not_duplicate_success():
    faces = [{"face_id": "face", "labels": {"gender": "unknown"}}]
    row = {"module": "landmarks", "check": "mesh_valid", "face_id": "face", "label_free_pass": True}
    result = summarize([row, copy.deepcopy(row)], faces)
    assert result["whole_set"]["passed"] == 0


def test_missing_face_observation_stays_in_denominator():
    faces = [{"face_id": "face", "labels": {"yaw": "profile"}}]
    result = summarize([], faces)
    assert result["whole_set"]["passed"] == 0
    assert result["whole_set"]["total"] == 1


def test_outside_frozen_cohort_is_rejected():
    faces = [{"face_id": "target", "labels": {}}]
    row = {"module": "landmarks", "check": "mesh_valid", "face_id": "bystander", "label_free_pass": True}
    with pytest.raises(ValueError, match="unregistered"):
        summarize([row], faces)


@pytest.mark.parametrize("error", [RuntimeError("inference failed"), OSError("no weights")])
def test_detector_exceptions_are_counted_as_failed_probes_not_benchmark_crashes(error):
    def raise_error(value: np.ndarray):
        raise error
    result = assess(image(), original(), raise_error)
    assert result["label_free_pass"] is False
    assert result["landmark_stability_reason"] == "invalid_probe"
    assert str(error) not in json.dumps(result)

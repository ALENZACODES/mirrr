"""One-to-one synthetic mesh matching, crop IoU and evidence failure tests.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from math import inf, nan

import pytest

from lab.synth_diversity.stress_mesh_budget import make_mesh_budget
from lab.synth_diversity.stress_mesh_oracle import (
    MeshDetection,
    MeshObservation,
    MeshPolicy,
    assess_scene,
    intersection_over_union,
)
from lab.synth_diversity.stress_pose_pack import PoseScene, Rect
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.types import SyntheticInputError


def policy(landmarks: bool = True, yaw: bool = True, extras: bool = True) -> MeshPolicy:
    return MeshPolicy(0.45, 0.45, 0.45, 0.50, landmarks, 20, yaw, 15.0, extras)


def scenes() -> tuple[PoseScene, ...]:
    schedule = StressSchedule(seed=43, count=len(ALL_PROFILES))
    return tuple(make_mesh_budget(schedule, 33).scenes())


def clipped_box(box: Rect) -> Rect:
    x = max(0.0, box.x)
    y = max(0.0, box.y)
    width = min(1.0, box.x + box.width) - x
    height = min(1.0, box.y + box.height) - y
    return Rect(float(x), float(y), float(width), float(height))


def perfect(scene: PoseScene) -> MeshObservation:
    detections = tuple(
        MeshDetection(clipped_box(subject.rectangle), 0.99, 468,
                      float(subject.yaw_degrees))
        for subject in scene.subjects
    )
    return MeshObservation(scene.identity, detections)


@pytest.mark.parametrize("index", range(25))
def test_perfect_synthetic_scenes_have_complete_recovery(index: int) -> None:
    scene = scenes()[index]
    result = assess_scene(scene, perfect(scene), policy())
    assert result.matched_faces == len(scene.subjects)
    assert result.recovered_faces == len(scene.subjects)
    assert result.expected_faces == len(scene.subjects)
    assert result.passed
    assert result.extra_detections == 0
    assert all(face.iou == pytest.approx(1.0) for face in result.faces)


def test_a_partially_out_of_frame_subject_is_perfectly_detected_after_clipping() -> None:
    scene = next(value for value in scenes() if value.scenario == "cropped")
    expected = scene.subjects[0].rectangle
    assert expected.visible_fraction < 0.92
    observed = clipped_box(expected)
    assert intersection_over_union(expected, observed) == pytest.approx(1.0)


def test_nonoverlapping_boxes_have_zero_iou() -> None:
    left = Rect(0.05, 0.05, 0.20, 0.20)
    right = Rect(0.70, 0.70, 0.20, 0.20)
    assert intersection_over_union(left, right) == 0.0


def test_touching_box_edges_do_not_count_as_overlap() -> None:
    left = Rect(0.1, 0.1, 0.30, 0.3)
    right = Rect(0.4, 0.1, 0.30, 0.3)
    assert intersection_over_union(left, right) == pytest.approx(0.0)


def test_half_overlap_iou_matches_reference_fraction() -> None:
    first = Rect(0.0, 0.0, 0.4, 0.4)
    second = Rect(0.2, 0.0, 0.4, 0.4)
    assert intersection_over_union(first, second) == pytest.approx(1.0 / 3.0)


def test_empty_results_are_counted_as_missing_not_as_success() -> None:
    scene = scenes()[0]
    result = assess_scene(scene, MeshObservation(scene.identity, ()), policy())
    assert result.matched_faces == 0
    assert result.recovered_faces == 0
    assert not result.passed
    assert all(not face.recovered for face in result.faces)


def test_runner_error_is_not_accepted_as_no_detections() -> None:
    scene = scenes()[0]
    result = assess_scene(scene, MeshObservation(scene.identity, (), "error"), policy())
    assert result.status == "error"
    assert not result.passed


def test_low_confidence_predictions_are_not_matched() -> None:
    scene = scenes()[0]
    source = perfect(scene)
    weak = tuple(replace(value, confidence=0.49) for value in source.detections)
    score = assess_scene(scene, MeshObservation(scene.identity, weak), policy())
    assert score.matched_faces == 0
    assert not score.passed


def test_confidence_cutoff_is_inclusive() -> None:
    scene = scenes()[0]
    source = perfect(scene)
    threshold = tuple(replace(value, confidence=0.5) for value in source.detections)
    score = assess_scene(scene, MeshObservation(scene.identity, threshold), policy())
    assert score.recovered_faces == len(scene.subjects)


def test_missing_landmark_metadata_blocks_mesh_recovery() -> None:
    scene = scenes()[0]
    values = tuple(replace(item, landmark_count=None) for item in perfect(scene).detections)
    score = assess_scene(scene, MeshObservation(scene.identity, values), policy())
    assert score.matched_faces == len(scene.subjects)
    assert score.recovered_faces == 0
    assert not score.passed
    assert all(not row.landmarks_ok for row in score.faces)


def test_insufficient_landmark_count_does_not_recover() -> None:
    scene = scenes()[0]
    values = tuple(replace(item, landmark_count=19) for item in perfect(scene).detections)
    score = assess_scene(scene, MeshObservation(scene.identity, values), policy())
    assert score.matched_faces == len(scene.subjects)
    assert score.recovered_faces == 0
    assert not score.passed


def test_missing_yaw_is_a_failure_when_pose_check_is_required() -> None:
    scene = next(item for item in scenes() if item.scenario == "profile")
    source = perfect(scene)
    values = (replace(source.detections[0], yaw_degrees=None),)
    score = assess_scene(scene, MeshObservation(scene.identity, values), policy())
    assert score.matched_faces == 1
    assert score.recovered_faces == 0
    assert not score.faces[0].yaw_ok


def test_incorrect_turn_sign_is_a_pose_failure() -> None:
    scene = next(item for item in scenes() if item.scenario == "profile")
    source = perfect(scene)
    values = (replace(source.detections[0], yaw_degrees=-float(scene.subjects[0].yaw_degrees)),)
    score = assess_scene(scene, MeshObservation(scene.identity, values), policy())
    assert score.faces[0].detected
    assert not score.faces[0].recovered


def test_explicitly_optional_landmark_or_pose_checks_do_not_claim_measurements() -> None:
    scene = next(item for item in scenes() if item.scenario == "profile")
    values = (replace(perfect(scene).detections[0], landmark_count=None, yaw_degrees=None),)
    gate = policy(landmarks=False, yaw=False)
    score = assess_scene(scene, MeshObservation(scene.identity, values), gate)
    assert score.recovered_faces == 1
    assert score.passed
    assert gate.to_dict()["require_landmarks"] is False
    assert gate.to_dict()["require_yaw"] is False


def test_extra_high_confidence_false_positive_blocks_gate_when_required() -> None:
    scene = scenes()[0]
    false_positive = MeshDetection(Rect(0.01, 0.01, 0.05, 0.05), 0.91, 468, 0.0)
    values = (*perfect(scene).detections, false_positive)
    score = assess_scene(scene, MeshObservation(scene.identity, values), policy())
    assert score.extra_detections == 1
    assert score.recovered_faces == len(scene.subjects)
    assert not score.passed


def test_extra_detection_is_reported_even_when_policy_allows_it() -> None:
    scene = scenes()[0]
    extra = MeshDetection(Rect(0.01, 0.01, 0.05, 0.05), 0.91, 468, 0.0)
    values = (*perfect(scene).detections, extra)
    score = assess_scene(scene, MeshObservation(scene.identity, values), policy(extras=False))
    assert score.extra_detections == 1
    assert score.passed


def test_duplicate_detections_do_not_double_match_one_subject() -> None:
    scene = next(value for value in scenes() if value.scenario == "cropped")
    duplicated = (*perfect(scene).detections, *perfect(scene).detections)
    score = assess_scene(scene, MeshObservation(scene.identity, duplicated), policy())
    assert score.matched_faces == 1
    assert score.extra_detections == 1
    assert not score.passed


def test_group_matching_is_invariant_to_prediction_order() -> None:
    scene = next(value for value in scenes() if value.scenario == "group"
                 and len(value.subjects) == 4)
    original = perfect(scene)
    forward = assess_scene(scene, original, policy())
    backward = assess_scene(
        scene, MeshObservation(scene.identity, tuple(reversed(original.detections))), policy(),
    )
    assert forward.to_dict() == backward.to_dict()
    assert forward.recovered_faces == 4


def test_group_face_cannot_reuse_same_prediction() -> None:
    scene = next(value for value in scenes() if value.scenario == "group"
                 and len(value.subjects) == 4)
    only_one = MeshObservation(scene.identity, perfect(scene).detections[:1])
    score = assess_scene(scene, only_one, policy())
    assert score.matched_faces == 1
    assert score.recovered_faces == 1
    assert not score.passed


def test_scene_identity_mismatch_fails_before_matching() -> None:
    scene = scenes()[0]
    forged = replace(perfect(scene), scene_id="0" * 64)
    with pytest.raises(SyntheticInputError):
        assess_scene(scene, forged, policy())


def test_exact_observation_provenance_flags_are_test_only() -> None:
    scene = scenes()[0]
    row = perfect(scene).as_row()
    assert row["test_only"] is True
    assert row["train_allowed"] is False
    assert "pixels" not in row
    assert "image" not in row


def test_assessment_per_face_tags_are_declared_not_inferred() -> None:
    scene = scenes()[0]
    result = assess_scene(scene, perfect(scene), policy())
    assert len(result.faces) == len(scene.subjects)
    for source, matched in zip(scene.subjects, result.faces, strict=True):
        assert matched.case_id == source.case.identity
        assert len(matched.declared_traits) == 12
        assert matched.detected
        assert matched.recovered


@pytest.mark.parametrize("bad", (nan, inf, -inf, -0.01, 1.01, True))
def test_confidence_rejects_nonfinite_and_bad_values(bad: float) -> None:
    with pytest.raises(SyntheticInputError):
        MeshDetection(Rect(0.1, 0.1, 0.3, 0.3), bad)


@pytest.mark.parametrize("bad", (nan, inf, -inf, -91.0, 91.0, True))
def test_yaw_rejects_nonfinite_out_of_range_and_bool(bad: float) -> None:
    with pytest.raises(SyntheticInputError):
        MeshDetection(Rect(0.1, 0.1, 0.3, 0.3), 0.9, 15, bad)


@pytest.mark.parametrize("bad", (-1, 2049, 1.5, True))
def test_landmarks_reject_invalid_count_type_or_range(bad: object) -> None:
    with pytest.raises(SyntheticInputError):
        MeshDetection(Rect(0.1, 0.1, 0.3, 0.3), 0.9, bad)  # type: ignore[arg-type]


@pytest.mark.parametrize("bad", (
    Rect(-0.1, 0.1, 0.3, 0.3),
    Rect(0.9, 0.1, 0.3, 0.3),
    Rect(0.1, 0.9, 0.3, 0.3),
))
def test_detected_box_must_lie_entirely_in_camera_frame(bad: Rect) -> None:
    with pytest.raises(SyntheticInputError):
        MeshDetection(bad, 0.9)


@pytest.mark.parametrize("bad", (0.0, -0.1, nan, inf))
def test_iou_and_confidence_threshold_cannot_be_nonpositive(bad: float) -> None:
    with pytest.raises(SyntheticInputError):
        MeshPolicy(bad, 0.5, 0.5, 0.5, False, 0, False, 10.0, True)
    with pytest.raises(SyntheticInputError):
        MeshPolicy(0.5, 0.5, 0.5, bad, False, 0, False, 10.0, True)


def test_mesh_policy_bound_to_every_report() -> None:
    scene = scenes()[0]
    first = policy()
    second = replace(first, minimum_confidence=0.8)
    assert first.digest != second.digest
    assert assess_scene(scene, perfect(scene), first).policy_sha256 == first.digest


def test_errored_observation_cannot_claim_detections() -> None:
    scene = scenes()[0]
    with pytest.raises(SyntheticInputError):
        MeshObservation(scene.identity, perfect(scene).detections, "error")


def test_unrecognized_runner_status_cannot_be_accepted() -> None:
    scene = scenes()[0]
    with pytest.raises(SyntheticInputError):
        MeshObservation(scene.identity, (), "pending")

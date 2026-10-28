"""Property-oriented tests for the Lane A bounded recovery policy."""
from __future__ import annotations

import math
import random

import pytest

from plumb_api.vision.recovery_policy import (
    FailureClass,
    MAX_BOX_CALLS,
    MAX_FACES,
    MAX_PHOTO_CALLS,
    RecoveryCandidate,
    RecoveryStage,
    RecoveryTask,
    plan_recovery,
    summarize_attempts,
    validate_attempt_record,
)


def candidate(
    candidate_id: str = "face-0",
    failure: FailureClass = FailureClass.UNKNOWN,
    *,
    x: float = 20,
    y: float = 20,
    width: float = 80,
    height: float = 90,
    score: float = 0.5,
    peers: int = 0,
    edges: tuple[str, ...] = (),
    confidence: float | None = None,
) -> RecoveryCandidate:
    return RecoveryCandidate(candidate_id, x, y, width, height, score,
                             failure, edges, peers, confidence)


def test_plan_is_deterministic_for_same_ordered_candidates() -> None:
    rows = [candidate("b", FailureClass.CROPPED, edges=("left",)),
            candidate("a", FailureClass.GROUP, peers=3)]
    first = plan_recovery(rows, 1280, 720)
    second = plan_recovery(rows, 1280, 720)
    assert first == second
    assert first.count_by_stage() == second.count_by_stage()


def test_plan_orders_group_and_crop_before_generic_failures() -> None:
    rows = [candidate("z", FailureClass.UNKNOWN),
            candidate("b", FailureClass.CROPPED),
            candidate("a", FailureClass.GROUP, peers=2)]
    plan = plan_recovery(rows, 1280, 720, per_photo_limit=3)
    assert [task.candidate_id for task in plan.tasks] == ["a", "b", "z"]


@pytest.mark.parametrize("failure", list(FailureClass))
def test_every_failure_class_has_a_bounded_plan(failure: FailureClass) -> None:
    plan = plan_recovery([candidate(failure=failure)], 640, 480)
    plan.validate()
    assert 1 <= len(plan.tasks) <= MAX_BOX_CALLS
    assert all(task.candidate_id == "face-0" for task in plan.tasks)


def test_edge_failure_gets_shift_and_padding_retries() -> None:
    plan = plan_recovery([candidate(edges=("left", "top"))], 640, 480)
    stages = {task.stage for task in plan.tasks}
    assert RecoveryStage.EDGE_SHIFT in stages
    assert RecoveryStage.PADDED in stages


def test_group_failure_gets_isolation_and_overlap_tile() -> None:
    plan = plan_recovery([candidate(failure=FailureClass.GROUP, peers=4)], 1920, 1080)
    stages = {task.stage for task in plan.tasks}
    assert RecoveryStage.GROUP_ISOLATION in stages
    assert RecoveryStage.OVERLAP_TILE in stages


def test_low_confidence_gets_expanded_roi() -> None:
    plan = plan_recovery([candidate(confidence=0.2)], 640, 480)
    assert RecoveryStage.EXPANDED_ROI in {task.stage for task in plan.tasks}


def test_high_confidence_does_not_get_expanded_roi() -> None:
    plan = plan_recovery([candidate(confidence=0.95)], 640, 480)
    assert RecoveryStage.EXPANDED_ROI not in {task.stage for task in plan.tasks}


def test_profile_has_more_rotation_candidates_than_unknown() -> None:
    profile = plan_recovery([candidate(failure=FailureClass.PROFILE)], 640, 480)
    unknown = plan_recovery([candidate(failure=FailureClass.UNKNOWN)], 640, 480)
    profile_angles = {task.angle for task in profile.tasks if task.stage == RecoveryStage.ROTATE}
    unknown_angles = {task.angle for task in unknown.tasks if task.stage == RecoveryStage.ROTATE}
    assert len(profile_angles) > len(unknown_angles)


def test_low_resolution_upscale_is_capped() -> None:
    plan = plan_recovery([candidate(width=20, height=24)], 640, 480)
    upscale = [task for task in plan.tasks if task.stage == RecoveryStage.UPSCALE]
    assert len(upscale) == 1
    assert upscale[0].scale <= 4


def test_per_candidate_and_photo_limits_are_hard() -> None:
    rows = [candidate(f"face-{index}", FailureClass.PROFILE, peers=4)
            for index in range(20)]
    plan = plan_recovery(rows, 4096, 4096)
    plan.validate()
    assert len(plan.tasks) <= MAX_PHOTO_CALLS
    assert max(sum(task.candidate_id == row.candidate_id for task in plan.tasks)
               for row in rows) <= MAX_BOX_CALLS


def test_candidate_count_limit_rejects_unbounded_input() -> None:
    rows = [candidate(f"face-{index}") for index in range(MAX_FACES + 1)]
    with pytest.raises(ValueError, match="too many candidates"):
        plan_recovery(rows, 640, 480)


@pytest.mark.parametrize("width,height", [(0, 640), (640, 1), (16385, 640), (640, 16385)])
def test_image_dimensions_are_validated(width: int, height: int) -> None:
    with pytest.raises(ValueError):
        plan_recovery([candidate()], width, height)


@pytest.mark.parametrize("kwargs", [
    {"x": math.nan}, {"y": math.inf}, {"width": 0}, {"height": -1},
    {"score": -0.1}, {"score": 1.1}, {"peers": -1}, {"peers": 65},
    {"edges": ("left", "left")}, {"edges": ("diagonal",)},
    {"confidence": math.nan}, {"confidence": 1.01},
])
def test_malformed_candidate_fields_rejected(kwargs: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        plan_recovery([candidate(**kwargs)], 640, 480)  # type: ignore[arg-type]


@pytest.mark.parametrize("per_candidate,per_photo", [(0, 1), (13, 1), (1, 0), (1, 25)])
def test_budget_configuration_cannot_exceed_frozen_contract(
    per_candidate: int, per_photo: int,
) -> None:
    with pytest.raises(ValueError):
        plan_recovery([candidate()], 640, 480,
                      per_candidate_limit=per_candidate, per_photo_limit=per_photo)


def test_tasks_have_unique_monotonic_execution_priorities() -> None:
    plan = plan_recovery([candidate("a", FailureClass.PROFILE),
                          candidate("b", FailureClass.GROUP)], 1280, 720)
    assert [task.priority for task in plan.tasks] == list(range(len(plan.tasks)))


def test_task_validator_rejects_invalid_transform_values() -> None:
    with pytest.raises(ValueError):
        RecoveryTask("face", RecoveryStage.ROTATE, 0, angle=181).validate()
    with pytest.raises(ValueError):
        RecoveryTask("face", RecoveryStage.UPSCALE, 0, scale=8).validate()
    with pytest.raises(ValueError):
        RecoveryTask("face", RecoveryStage.TIGHT_CROP, 0, margin=0.2).validate()
    with pytest.raises(ValueError):
        RecoveryTask("face", RecoveryStage.TIGHT_CROP, 0, padding="transparent").validate()


def test_attempt_normalization_drops_private_or_unknown_fields() -> None:
    safe = validate_attempt_record({
        "stage": "tight_crop", "raw_meshes": 2, "invalid_meshes": 1,
        "matched": True, "confidence": 0.81234, "angle": 15, "scale": 1,
        "person_id": "private", "image": b"not serializable", "landmarks": [[1, 2]],
    })
    assert safe == {"stage": "tight_crop", "angle": 15.0, "scale": 1.0,
            "raw_meshes": 2, "invalid_meshes": 1, "matched": True,
            "extra_call": True, "confidence": 0.8123}
    assert "person_id" not in safe
    assert "image" not in safe
    assert "landmarks" not in safe


@pytest.mark.parametrize("record", [
    {}, {"stage": "unknown-stage"}, {"stage": "tight_crop", "raw_meshes": -1},
    {"stage": "tight_crop", "invalid_meshes": 10001},
    {"stage": "tight_crop", "confidence": math.inf},
    {"stage": "tight_crop", "confidence": -0.1},
    {"stage": "tight_crop", "angle": math.nan},
    {"stage": "tight_crop", "angle": 181},
    {"stage": "tight_crop", "scale": 0.01},
])
def test_attempt_validator_rejects_malformed_evidence(record: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        validate_attempt_record(record)


def test_attempt_summary_is_stable_and_count_only() -> None:
    rows = [
        {"stage": "tight_crop", "raw_meshes": 1, "invalid_meshes": 0, "matched": False},
        {"stage": "overlap_tile", "raw_meshes": 2, "invalid_meshes": 1, "matched": True},
    ]
    summary = summarize_attempts(rows)
    assert summary == {
        "attempt_count": 2, "matched_attempts": 1, "raw_meshes": 3,
        "invalid_meshes": 1, "stages": {"overlap_tile": 1, "tight_crop": 1},
    }
    assert summarize_attempts(rows) == summary


def test_attempt_summary_refuses_more_than_frozen_call_budget() -> None:
    rows = [{"stage": "tight_crop"} for _ in range(MAX_PHOTO_CALLS + 1)]
    with pytest.raises(ValueError, match="ceiling"):
        summarize_attempts(rows)


def test_randomized_candidate_inputs_never_break_budget_or_determinism() -> None:
    rng = random.Random(1337)
    classes = list(FailureClass)
    for case in range(100):
        rows = []
        for index in range(rng.randint(1, 12)):
            width = rng.uniform(20, 220)
            height = rng.uniform(20, 240)
            edges = tuple(side for side in ("left", "right", "top", "bottom")
                          if rng.random() < 0.12)
            confidence = None if rng.random() < 0.5 else rng.random()
            rows.append(candidate(f"{case}-{index}", rng.choice(classes),
                                  x=rng.uniform(-30, 600), y=rng.uniform(-30, 450),
                                  width=width, height=height, score=rng.random(),
                                  peers=rng.randint(0, 6), edges=edges,
                                  confidence=confidence))
        plan = plan_recovery(rows, 640, 480)
        plan.validate()
        assert len(plan.tasks) <= MAX_PHOTO_CALLS
        assert plan == plan_recovery(rows, 640, 480)


def test_reordering_input_does_not_change_candidate_priority_semantics() -> None:
    rows = [candidate("unknown", FailureClass.UNKNOWN),
            candidate("group", FailureClass.GROUP, peers=3),
            candidate("crop", FailureClass.CROPPED, edges=("right",))]
    left = plan_recovery(rows, 1024, 768, per_photo_limit=3)
    right = plan_recovery(list(reversed(rows)), 1024, 768, per_photo_limit=3)
    assert [task.candidate_id for task in left.tasks] == [task.candidate_id for task in right.tasks]


def test_plan_stage_counts_sum_to_task_count() -> None:
    rows = [candidate("a", FailureClass.GROUP, peers=3),
            candidate("b", FailureClass.CROPPED, edges=("left",)),
            candidate("c", FailureClass.PROFILE)]
    plan = plan_recovery(rows, 1920, 1080)
    assert sum(plan.count_by_stage().values()) == len(plan.tasks)


def test_face_identity_is_not_part_of_attempt_summary() -> None:
    record = {"stage": "tight_crop", "candidate_id": "private-person-7",
              "identity_reference": "biometric-secret", "matched": True}
    summary = summarize_attempts([record])
    serialized = repr(summary)
    assert "private-person-7" not in serialized
    assert "biometric-secret" not in serialized


def test_plan_is_safe_for_empty_candidate_list() -> None:
    plan = plan_recovery([], 640, 480)
    assert plan.tasks == ()
    assert plan.count_by_stage() == {}
    plan.validate()


def test_missing_box_rank_prioritizes_crowded_then_edge_candidates() -> None:
    from dataclasses import dataclass

    from plumb_api.vision.recovery_policy import rank_missing_boxes

    @dataclass
    class Box:
        x: float
        y: float
        width: float
        height: float
        score: float = 0.5

    group = Box(100, 100, 80, 80)
    peer = Box(140, 110, 70, 70)
    edge = Box(-5, 10, 50, 50)
    ordinary = Box(400, 300, 50, 50)
    ranked = rank_missing_boxes([ordinary, edge, group], [group, peer], 640, 480)
    assert ranked[0] is group
    assert ranked[1] is edge
    assert ranked[2] is ordinary


def test_missing_box_rank_rejects_non_finite_geometry() -> None:
    from plumb_api.vision.recovery_policy import rank_missing_boxes

    with pytest.raises(ValueError, match="finite"):
        rank_missing_boxes([candidate(x=math.nan)], [], 640, 480)


def test_missing_box_rank_is_stable_for_equal_candidates() -> None:
    from dataclasses import dataclass

    from plumb_api.vision.recovery_policy import rank_missing_boxes

    @dataclass
    class Box:
        x: float
        y: float
        width: float
        height: float
        label: str

    first = Box(10, 10, 40, 40, "first")
    second = Box(10, 10, 40, 40, "second")
    assert rank_missing_boxes([first, second], [], 640, 480) == (first, second)

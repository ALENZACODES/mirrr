"""Fail-closed synthetic mesh recovery, fairness-slice and defect-report tests.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_mesh_budget import MeshFaceBudget, make_mesh_budget
from lab.synth_diversity.stress_mesh_oracle import MeshDetection, MeshObservation, MeshPolicy
from lab.synth_diversity.stress_mesh_report import MeshAcceptance, audit_mesh_run
from lab.synth_diversity.stress_pose_pack import PoseScene, Rect
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.types import SyntheticInputError


def budget(count: int = 1000, seed: int = 29) -> MeshFaceBudget:
    return make_mesh_budget(StressSchedule(seed=seed, count=len(ALL_PROFILES)), count)


def policy() -> MeshPolicy:
    return MeshPolicy(0.45, 0.45, 0.45, 0.50, True, 20, True, 15.0, True)


def acceptance(
    scenario_recall: float = 0.95, trait_recall: float = 0.95,
    minimum_support: int = 1, extras: int = 0,
) -> MeshAcceptance:
    return MeshAcceptance(
        {"group": scenario_recall, "cropped": scenario_recall,
         "profile": scenario_recall}, minimum_support, trait_recall, extras,
    )


def fitted(box: Rect) -> Rect:
    x = max(0.0, box.x)
    y = max(0.0, box.y)
    return Rect(x, y, min(1.0, box.x + box.width) - x,
                min(1.0, box.y + box.height) - y)


def complete(scene: PoseScene) -> MeshObservation:
    return MeshObservation(scene.identity, tuple(
        MeshDetection(fitted(face.rectangle), 0.99, 468, float(face.yaw_degrees))
        for face in scene.subjects
    ))


def all_observations(plan: MeshFaceBudget) -> tuple[MeshObservation, ...]:
    return tuple(complete(scene) for scene in plan.scenes())


def test_complete_1000_face_synthetic_pass_is_not_real_face_certification() -> None:
    plan = budget(1000)
    result = audit_mesh_run(plan, all_observations(plan), policy(), acceptance())
    data = result.to_dict()
    assert data["synthetic_screen"] == "PASS"
    assert data["expected_faces"] == 1000
    assert data["received_scenes"] == plan.total_scenes
    assert data["real_face_gate"] == "NOT_EVALUATED"
    assert data["hundred_thousand_face_gate"] == "NOT_EVALUATED"
    assert data["runner_attestation"] == "SUPPLIED_RESULTS_NOT_INDEPENDENTLY_ATTESTED"
    assert data["test_only"] is True
    assert data["train_allowed"] is False


def test_1000_face_detection_counts_reconcile_across_scenarios() -> None:
    plan = budget(1000)
    result = audit_mesh_run(plan, all_observations(plan), policy(), acceptance())
    assert sum(row.expected for row in result.scenario_slices.values()) == 1000
    assert sum(row.detected for row in result.scenario_slices.values()) == 1000
    assert sum(row.recovered for row in result.scenario_slices.values()) == 1000
    assert result.scenario_slices["group"].expected == 398
    assert result.scenario_slices["cropped"].expected == 301
    assert result.scenario_slices["profile"].expected == 301
    assert all(row.detection_recall == 1.0 for row in result.scenario_slices.values())


def test_skin_tone_slice_totals_equal_exact_face_budget() -> None:
    plan = budget(1000)
    result = audit_mesh_run(plan, all_observations(plan), policy(), acceptance())
    total = sum(value.expected for label, value in result.trait_slices.items()
                if label.startswith("fitzpatrick="))
    assert total == 1000
    assert result.trait_slices["fitzpatrick=VI"].expected > 0
    assert result.trait_slices["fitzpatrick=V"].expected > 0
    assert all(row.recovered == row.expected for row in result.trait_slices.values())


def test_trait_slices_include_vitiligo_acne_birthmark_age_and_eyewear() -> None:
    plan = budget(1000)
    report = audit_mesh_run(plan, all_observations(plan), policy(), acceptance())
    for label in (
        "vitiligo=generalised", "albinism=true", "freckles=dense",
        "birthmark=port_wine", "scar=hypertrophic", "acne=moderate",
        "rosacea=mild", "head_covering=hijab", "beard=full",
        "glasses=tinted", "age_band=70+",
    ):
        assert report.trait_slices[label].expected > 0
    assert "age_band=0-9" not in report.trait_slices


def test_130_of_1000_missing_detections_fails_synthetic_screen() -> None:
    plan = budget(1000)
    missing = 130
    cursor = 0
    observations: list[MeshObservation] = []
    for scene in plan.scenes():
        present: list[MeshDetection] = []
        for face in scene.subjects:
            if cursor >= missing:
                present.append(MeshDetection(
                    fitted(face.rectangle), 0.99, 468, float(face.yaw_degrees),
                ))
            cursor += 1
        observations.append(MeshObservation(scene.identity, tuple(present)))
    assert cursor == 1000
    report = audit_mesh_run(plan, observations, policy(), acceptance())
    assert sum(row.detected for row in report.scenario_slices.values()) == 870
    assert sum(row.expected - row.detected for row in report.scenario_slices.values()) == 130
    assert report.synthetic_screen == "FAIL"
    assert len(report.failures) <= 50
    assert all(row["reason"] == "missed_detection" for row in report.failures)


def test_empty_prediction_stream_is_not_an_absent_trait() -> None:
    plan = budget(40)
    observations = tuple(MeshObservation(scene.identity, ()) for scene in plan.scenes())
    report = audit_mesh_run(plan, observations, policy(), acceptance())
    assert report.synthetic_screen == "FAIL"
    assert all(row.detected == 0 for row in report.scenario_slices.values())
    assert all(row.recovered == 0 for row in report.trait_slices.values())


def test_runner_error_fails_even_with_mostly_perfect_detections() -> None:
    plan = budget(100)
    observations = list(all_observations(plan))
    observations[0] = MeshObservation(observations[0].scene_id, (), "error")
    report = audit_mesh_run(plan, observations, policy(), acceptance(0.50, 0.50))
    assert report.error_scenes == 1
    assert report.synthetic_screen == "FAIL"
    assert any(note["reason"] == "runner_error" for note in report.failures)


def test_missing_landmark_metadata_is_reported_not_marked_detected_failure() -> None:
    plan = budget(50)
    observations = list(all_observations(plan))
    changed = tuple(replace(det, landmark_count=None)
                    for det in observations[0].detections)
    observations[0] = replace(observations[0], detections=changed)
    report = audit_mesh_run(plan, observations, policy(), acceptance())
    assert report.synthetic_screen == "FAIL"
    assert any(note["reason"] == "mesh_landmarks_missing" for note in report.failures)
    assert sum(row.detected for row in report.scenario_slices.values()) == 50
    assert sum(row.recovered for row in report.scenario_slices.values()) < 50


def test_wrong_turn_sign_produces_pose_failure_note() -> None:
    plan = budget(50)
    observations = list(all_observations(plan))
    for index, scene in enumerate(plan.scenes()):
        if scene.scenario == "profile":
            item = observations[index].detections[0]
            observations[index] = replace(
                observations[index],
                detections=(replace(item, yaw_degrees=-item.yaw_degrees),),
            )
            break
    report = audit_mesh_run(plan, observations, policy(), acceptance())
    assert report.synthetic_screen == "FAIL"
    assert any(note["reason"] == "pose_turn_mismatch" for note in report.failures)


def test_extra_detections_reported_independently_of_recovery() -> None:
    plan = budget(100)
    observations = list(all_observations(plan))
    extra = MeshDetection(Rect(0.01, 0.01, 0.05, 0.05), 0.8, 468, 0.0)
    observations[0] = replace(
        observations[0], detections=(*observations[0].detections, extra),
    )
    report = audit_mesh_run(plan, observations, policy(), acceptance())
    assert report.extra_detections == 1
    assert any(note["reason"] == "extra_detections" for note in report.failures)
    assert report.synthetic_screen == "FAIL"


def test_acceptance_may_allow_explicitly_bounded_extras() -> None:
    plan = budget(1000)
    observations = list(all_observations(plan))
    extra = MeshDetection(Rect(0.01, 0.01, 0.05, 0.05), 0.8, 468, 0.0)
    observations[0] = replace(
        observations[0], detections=(*observations[0].detections, extra),
    )
    report = audit_mesh_run(plan, observations, policy(), acceptance(extras=1))
    assert report.synthetic_screen == "PASS"
    assert report.extra_detections == 1


def test_incomplete_observation_roster_refused_even_before_gate() -> None:
    plan = budget(100)
    rows = all_observations(plan)
    with pytest.raises(SyntheticInputError, match="missing"):
        audit_mesh_run(plan, rows[:-1], policy(), acceptance())


def test_extra_observation_roster_refused_even_if_duplicate() -> None:
    plan = budget(100)
    rows = all_observations(plan)
    with pytest.raises(SyntheticInputError, match="extra"):
        audit_mesh_run(plan, (*rows, rows[-1]), policy(), acceptance())


def test_wrong_scene_identity_refused() -> None:
    plan = budget(100)
    rows = list(all_observations(plan))
    rows[0] = replace(rows[0], scene_id="a" * 64)
    with pytest.raises(SyntheticInputError):
        audit_mesh_run(plan, rows, policy(), acceptance())


def test_reordered_results_refused() -> None:
    plan = budget(100)
    rows = list(all_observations(plan))
    rows[0], rows[1] = rows[1], rows[0]
    with pytest.raises(SyntheticInputError):
        audit_mesh_run(plan, rows, policy(), acceptance())


def test_low_support_slice_fails_closed_even_with_perfect_result() -> None:
    plan = budget(40)
    report = audit_mesh_run(plan, all_observations(plan), policy(),
                            acceptance(minimum_support=100))
    assert report.synthetic_screen == "FAIL"
    assert any(row.expected < 100 for row in report.trait_slices.values())


def test_perfect_result_with_uncleared_trait_inventory_does_not_pass() -> None:
    plan = budget(20)
    report = audit_mesh_run(plan, all_observations(plan), policy(), acceptance())
    assert report.synthetic_screen == "FAIL"
    assert any(row.expected == 0 for row in report.trait_slices.values())


def test_report_binding_changes_with_policy_or_acceptance() -> None:
    plan = budget(100)
    rows = all_observations(plan)
    one = audit_mesh_run(plan, rows, policy(), acceptance())
    two = audit_mesh_run(plan, rows, replace(policy(), minimum_confidence=0.75),
                         acceptance())
    three = audit_mesh_run(plan, rows, policy(), acceptance(0.80, 0.80))
    assert one.policy_sha256 != two.policy_sha256
    assert one.acceptance_sha256 != three.acceptance_sha256
    assert one.digest != two.digest
    assert one.digest != three.digest


def test_digest_stable_with_identical_inputs() -> None:
    plan = budget(50)
    rows = all_observations(plan)
    assert audit_mesh_run(plan, rows, policy(), acceptance()).digest == audit_mesh_run(
        plan, rows, policy(), acceptance(),
    ).digest


@pytest.mark.parametrize("bad", (0.0, -0.1, 1.01, float("nan"), float("inf"), True))
def test_zero_invalid_nonfinite_recall_thresholds_rejected(bad: float) -> None:
    with pytest.raises(SyntheticInputError):
        MeshAcceptance({"group": bad, "cropped": 0.9, "profile": 0.9}, 1, 0.9, 0)
    with pytest.raises(SyntheticInputError):
        MeshAcceptance({"group": 0.9, "cropped": 0.9, "profile": 0.9}, 1, bad, 0)


@pytest.mark.parametrize("bad", (0, -1, True, 1.5, None))
def test_trait_support_must_be_positive_integer(bad: object) -> None:
    with pytest.raises(SyntheticInputError):
        MeshAcceptance({"group": 0.9, "cropped": 0.9, "profile": 0.9},
                       bad, 0.9, 0)  # type: ignore[arg-type]


def test_acceptance_must_name_all_scenarios() -> None:
    with pytest.raises(SyntheticInputError):
        MeshAcceptance({"group": 0.9, "cropped": 0.9}, 1, 0.9, 0)
    with pytest.raises(SyntheticInputError):
        MeshAcceptance({"group": 0.9, "cropped": 0.9, "profile": 0.9,
                        "other": 0.9}, 1, 0.9, 0)


def test_failure_notes_are_bounded_for_1000_missed_faces() -> None:
    plan = budget(1000)
    rows = tuple(MeshObservation(scene.identity, ()) for scene in plan.scenes())
    report = audit_mesh_run(plan, rows, policy(), acceptance())
    assert len(report.failures) == 50
    assert report.synthetic_screen == "FAIL"
    assert all(len(str(note)) < 300 for note in report.failures)

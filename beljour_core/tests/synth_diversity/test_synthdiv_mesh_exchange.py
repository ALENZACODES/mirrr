"""Checksum, tamper, path-safety and runner-return tests for Lane A mesh exchange.
Author: John Khan.
"""

from __future__ import annotations

import json
from hashlib import sha256
from dataclasses import replace
from pathlib import Path

import pytest

from lab.synth_diversity.stress_mesh_budget import MeshFaceBudget, make_mesh_budget
from lab.synth_diversity.stress_mesh_exchange import (
    RESULTS_NAME,
    RESULTS_SPEC,
    SCENES_NAME,
    SCENES_SPEC,
    iter_verified_observations,
    mesh_file_fingerprint,
    observation_from_row,
    verify_mesh_plan,
    write_mesh_observations,
    write_mesh_plan,
)
from lab.synth_diversity.stress_mesh_oracle import MeshDetection, MeshObservation, MeshPolicy
from lab.synth_diversity.stress_pose_pack import PoseScene, Rect
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_provenance import canonical_bytes
from lab.synth_diversity.types import SyntheticInputError


def plan(seed: int = 8, count: int = 24) -> MeshFaceBudget:
    return make_mesh_budget(StressSchedule(seed=seed, count=len(ALL_PROFILES)), count)


def policy() -> MeshPolicy:
    return MeshPolicy(0.4, 0.4, 0.4, 0.5, True, 20, True, 15.0, True)


def fitted(rectangle: Rect) -> Rect:
    x = max(0.0, rectangle.x)
    y = max(0.0, rectangle.y)
    return Rect(x, y, min(1.0, rectangle.x + rectangle.width) - x,
                min(1.0, rectangle.y + rectangle.height) - y)


def complete(scene: PoseScene) -> MeshObservation:
    return MeshObservation(scene.identity, tuple(
        MeshDetection(fitted(subject.rectangle), 0.99, 468, float(subject.yaw_degrees))
        for subject in scene.subjects
    ))


def examples(budget: MeshFaceBudget) -> tuple[MeshObservation, ...]:
    return tuple(complete(scene) for scene in budget.scenes())


def write_example(tmp_path: Path, count: int = 24) -> tuple[MeshFaceBudget, Path, Path]:
    budget = plan(count=count)
    source = tmp_path / "expected"
    result = tmp_path / "outcomes"
    write_mesh_plan(source, budget)
    write_mesh_observations(result, budget, policy(), examples(budget), "local_test_run")
    return budget, source, result


def test_plan_round_trip_replays_exact_synthetic_rows(tmp_path: Path) -> None:
    budget = plan()
    location = tmp_path / "scene-plan"
    file = write_mesh_plan(location, budget)
    assert file.name == SCENES_NAME
    header = verify_mesh_plan(location, budget)
    assert header["rows"] == budget.total_scenes
    assert header["face_budget"] == 24
    assert header["test_only"] is True
    assert header["train_allowed"] is False
    assert header["measurement_status"] == "NOT_RUN"
    assert file.stat().st_size < 100000


def test_plan_is_bitwise_stable_from_same_seed(tmp_path: Path) -> None:
    first = plan(seed=902)
    left = tmp_path / "left"
    right = tmp_path / "right"
    write_mesh_plan(left, first)
    write_mesh_plan(right, plan(seed=902))
    assert (left / SCENES_NAME).read_bytes() == (right / SCENES_NAME).read_bytes()
    assert (left / SCENES_SPEC).read_bytes() == (right / SCENES_SPEC).read_bytes()


def test_different_study_seed_changes_plan_hash(tmp_path: Path) -> None:
    first = plan(seed=11)
    second = plan(seed=12)
    write_mesh_plan(tmp_path / "first", first)
    with pytest.raises(SyntheticInputError):
        verify_mesh_plan(tmp_path / "first", second)


def test_plan_has_complete_ground_truth_for_each_scene(tmp_path: Path) -> None:
    budget = plan(count=100)
    output = write_mesh_plan(tmp_path / "target", budget)
    rows = tuple(json.loads(line) for line in output.read_text().splitlines())
    assert len(rows) == budget.total_scenes
    assert len({row["scene"]["scene_id"] for row in rows}) == len(rows)
    assert [row["ordinal"] for row in rows] == list(range(len(rows)))
    assert sum(row["scene"]["expected_face_count"] for row in rows) == 100
    assert all(row["scene"]["lane_a_input"] == "SYNTHETIC_MESH_STRESS_ONLY"
               for row in rows)


def test_verified_plan_rejects_modified_payload_even_with_old_header(tmp_path: Path) -> None:
    budget = plan()
    directory = tmp_path / "plan"
    target = write_mesh_plan(directory, budget)
    content = target.read_bytes().replace(b"group", b"other", 1)
    target.write_bytes(content)
    with pytest.raises(SyntheticInputError):
        verify_mesh_plan(directory, budget)


def test_verified_plan_rejects_recomputed_digest_if_row_changed(tmp_path: Path) -> None:
    budget = plan()
    directory = tmp_path / "plan"
    target = write_mesh_plan(directory, budget)
    rows = [json.loads(line) for line in target.read_text().splitlines()]
    rows[0]["scene"]["expected_face_count"] = 99
    payload = b"".join(canonical_bytes(value) + b"\n" for value in rows)
    target.write_bytes(payload)
    spec = directory / SCENES_SPEC
    header = json.loads(spec.read_text())
    header["sha256"] = sha256(payload).hexdigest()
    header["bytes"] = len(payload)
    spec.write_bytes(canonical_bytes(header) + b"\n")
    with pytest.raises(SyntheticInputError, match="deterministic"):
        verify_mesh_plan(directory, budget)


def test_unexpected_file_rejects_plan_verification(tmp_path: Path) -> None:
    budget = plan()
    directory = tmp_path / "plan"
    write_mesh_plan(directory, budget)
    (directory / "unexpected.txt").write_text("not part of contract")
    with pytest.raises(SyntheticInputError, match="unexpected"):
        verify_mesh_plan(directory, budget)


def test_symlinked_plan_file_is_not_read(tmp_path: Path) -> None:
    budget = plan()
    directory = tmp_path / "plan"
    write_mesh_plan(directory, budget)
    actual = directory / SCENES_NAME
    original = tmp_path / "old-rows.txt"
    actual.rename(original)
    actual.symlink_to(original)
    with pytest.raises(SyntheticInputError):
        verify_mesh_plan(directory, budget)


def test_plan_does_not_overwrite_existing_output(tmp_path: Path) -> None:
    budget = plan()
    target = tmp_path / "plan"
    write_mesh_plan(target, budget)
    before = (target / SCENES_NAME).read_bytes()
    with pytest.raises(SyntheticInputError):
        write_mesh_plan(target, budget)
    assert before == (target / SCENES_NAME).read_bytes()


def test_complete_observation_round_trip(tmp_path: Path) -> None:
    budget, _, result = write_example(tmp_path)
    rows = tuple(iter_verified_observations(result, budget, policy()))
    assert rows == examples(budget)
    assert len(rows) == budget.total_scenes
    assert all(row.status == "completed" for row in rows)


def test_obs_file_fingerprint_is_a_content_sha(tmp_path: Path) -> None:
    budget, source, result = write_example(tmp_path)
    assert len(mesh_file_fingerprint(source, True)) == 64
    assert len(mesh_file_fingerprint(result, False)) == 64
    assert budget.digest != mesh_file_fingerprint(result, False)


def test_results_are_bound_to_exact_policy(tmp_path: Path) -> None:
    budget, _, result = write_example(tmp_path)
    modified = replace(policy(), minimum_confidence=0.6)
    with pytest.raises(SyntheticInputError):
        tuple(iter_verified_observations(result, budget, modified))


def test_results_are_bound_to_exact_plan(tmp_path: Path) -> None:
    _, _, result = write_example(tmp_path)
    with pytest.raises(SyntheticInputError):
        tuple(iter_verified_observations(result, plan(seed=999), policy()))


def test_error_and_empty_observation_rows_are_valid_evidence(tmp_path: Path) -> None:
    budget = plan()
    observations = list(examples(budget))
    observations[0] = MeshObservation(observations[0].scene_id, (), "error")
    observations[1] = MeshObservation(observations[1].scene_id, ())
    directory = tmp_path / "results"
    write_mesh_observations(directory, budget, policy(), observations, "local_errors")
    parsed = tuple(iter_verified_observations(directory, budget, policy()))
    assert parsed[0].status == "error"
    assert not parsed[1].detections


def test_missing_row_fails_closed_before_final_publication(tmp_path: Path) -> None:
    budget = plan()
    directory = tmp_path / "results"
    with pytest.raises(SyntheticInputError, match="missing"):
        write_mesh_observations(directory, budget, policy(), examples(budget)[:-1], "run")
    assert not directory.exists()


def test_extra_row_fails_closed_before_final_publication(tmp_path: Path) -> None:
    budget = plan()
    directory = tmp_path / "results"
    rows = (*examples(budget), examples(budget)[-1])
    with pytest.raises(SyntheticInputError, match="extra"):
        write_mesh_observations(directory, budget, policy(), rows, "run")
    assert not directory.exists()


def test_reordered_evidence_fails_closed(tmp_path: Path) -> None:
    budget = plan()
    rows = list(examples(budget))
    rows[0], rows[1] = rows[1], rows[0]
    with pytest.raises(SyntheticInputError):
        write_mesh_observations(tmp_path / "results", budget, policy(), rows, "run")


def test_cannot_write_evidence_into_existing_directory(tmp_path: Path) -> None:
    budget = plan()
    directory = tmp_path / "results"
    write_mesh_observations(directory, budget, policy(), examples(budget), "run")
    with pytest.raises(SyntheticInputError):
        write_mesh_observations(directory, budget, policy(), examples(budget), "run")


def test_evidence_header_is_not_an_attestation(tmp_path: Path) -> None:
    _, _, result = write_example(tmp_path)
    header = json.loads((result / RESULTS_SPEC).read_text())
    assert header["evidence_status"] == "RUNNER_SUPPLIED_NOT_INDEPENDENTLY_VERIFIED"
    assert header["contains_image_bytes"] is False
    assert header["test_only"] is True
    assert header["train_allowed"] is False


def test_results_reject_hidden_extra_files(tmp_path: Path) -> None:
    budget, _, result = write_example(tmp_path)
    (result / ".unexpected").write_text("marker")
    with pytest.raises(SyntheticInputError):
        tuple(iter_verified_observations(result, budget, policy()))


def test_results_reject_byte_tampering(tmp_path: Path) -> None:
    budget, _, result = write_example(tmp_path)
    path = result / RESULTS_NAME
    path.write_bytes(path.read_bytes() + b"\n")
    with pytest.raises(SyntheticInputError):
        tuple(iter_verified_observations(result, budget, policy()))


@pytest.mark.parametrize("mutate", ("format", "extra", "training", "image", "scene"))
def test_observation_parser_rejects_forbidden_changes(mutate: str) -> None:
    scene = next(plan().scenes())
    row = complete(scene).as_row()
    if mutate == "format":
        row["format"] = 5
    elif mutate == "extra":
        row["base64_photo"] = "not_allowed"
    elif mutate == "training":
        row["train_allowed"] = True
    elif mutate == "image":
        row["detections"][0]["image_bytes"] = "forbidden"
    else:
        row["scene_id"] = "not-a-digest"
    with pytest.raises(SyntheticInputError):
        observation_from_row(row)


@pytest.mark.parametrize("invalid", ("", "UPPER", "has space", "some.name", "x" * 65))
def test_run_id_must_be_safe_small_identifier(tmp_path: Path, invalid: str) -> None:
    budget = plan()
    with pytest.raises(SyntheticInputError):
        write_mesh_observations(tmp_path / "run", budget, policy(),
                                examples(budget), invalid)


def test_1000_face_plan_round_trips_without_any_image_assets(tmp_path: Path) -> None:
    budget = plan(count=1000)
    destination = tmp_path / "plan"
    write_mesh_plan(destination, budget)
    assert verify_mesh_plan(destination, budget)["face_budget"] == 1000
    assert {path.suffix for path in destination.iterdir()} == {".json", ".jsonl"}
    assert sum(1 for _ in (destination / SCENES_NAME).open()) == 735

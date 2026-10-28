"""Exact-count synthetic mesh scenario scheduling and deterministic chunk tests.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_mesh_budget import (
    MAX_FACE_BUDGET,
    group_face_count,
    group_scenes_within_faces,
    make_mesh_budget,
)
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.types import SyntheticInputError


def schedule(seed: int = 19) -> StressSchedule:
    return StressSchedule(seed=seed, count=len(ALL_PROFILES))


@pytest.mark.parametrize("value", (0, 1, 2, 3, 4, 5, 6, 11, 25, 300, 1000))
def test_group_count_agrees_with_actual_pattern(value: int) -> None:
    expected = sum((2, 3, 4)[position % 3] for position in range(value))
    assert group_face_count(value) == expected


@pytest.mark.parametrize("value", (-100, -1, True, 1.1, "4", None))
def test_group_counter_refuses_illegal_scene_count(value: object) -> None:
    with pytest.raises(SyntheticInputError):
        group_face_count(value)  # type: ignore[arg-type]


@pytest.mark.parametrize("limit", range(0, 500))
def test_group_floor_is_maximal(limit: int) -> None:
    chosen = group_scenes_within_faces(limit)
    assert group_face_count(chosen) <= limit
    assert group_face_count(chosen + 1) > limit


@pytest.mark.parametrize("invalid", (-1, -5, True, 1.5, "23", None))
def test_group_floor_refuses_invalid_input(invalid: object) -> None:
    with pytest.raises(SyntheticInputError):
        group_scenes_within_faces(invalid)  # type: ignore[arg-type]


@pytest.mark.parametrize("size", (20, 21, 22, 31, 40, 99, 100, 211, 333, 999, 1000))
def test_face_budget_is_exact_without_cutting_any_group(size: int) -> None:
    budget = make_mesh_budget(schedule(), size)
    expected = sum(len(scene.subjects) for scene in budget.scenes())
    assert expected == size
    assert sum(budget.scenario_faces.values()) == size
    assert budget.group_faces == group_face_count(budget.group_scenes)
    assert budget.total_scenes <= size


def test_1000_face_frozen_inventory_is_exact_and_balanced() -> None:
    budget = make_mesh_budget(schedule(), 1000)
    assert budget.face_budget == 1000
    assert budget.group_faces == 398
    assert budget.cropped_scenes == 301
    assert budget.profile_scenes == 301
    assert budget.total_scenes == 735
    assert all(row.scenario == "group" for row in budget.scenes(0, budget.group_scenes))
    group_end = budget.group_scenes
    cropped_end = group_end + budget.cropped_scenes
    assert all(row.scenario == "cropped" for row in budget.scenes(group_end, cropped_end))
    assert all(row.scenario == "profile" for row in budget.scenes(cropped_end))


def test_budget_seed_controls_identity_without_affecting_counts() -> None:
    one = make_mesh_budget(schedule(11), 100)
    two = make_mesh_budget(schedule(12), 100)
    assert one.specification()["scenario_faces"] == two.specification()["scenario_faces"]
    assert one.digest != two.digest
    assert one.at(0).identity != two.at(0).identity


def test_repeating_same_budget_is_byte_for_byte_stable() -> None:
    one = make_mesh_budget(schedule(888), 100)
    two = make_mesh_budget(schedule(888), 100)
    assert one.digest == two.digest
    assert one.specification() == two.specification()
    assert tuple(row.to_dict() for row in one.scenes()) == tuple(
        row.to_dict() for row in two.scenes()
    )


@pytest.mark.parametrize("chunk_size", (1, 2, 7, 13, 31, 100))
def test_independent_chunks_equal_complete_schedule(chunk_size: int) -> None:
    budget = make_mesh_budget(schedule(), 131)
    total = tuple(budget.scenes())
    assembled = tuple(
        row for start in range(0, budget.total_scenes, chunk_size)
        for row in budget.scenes(start, min(start + chunk_size, budget.total_scenes))
    )
    assert assembled == total


@pytest.mark.parametrize("position", (0, 1, 2, 3, 5, 13, 18, 19, 20, 25))
def test_random_access_equals_forward_iteration(position: int) -> None:
    budget = make_mesh_budget(schedule(), 31)
    rows = tuple(budget.scenes())
    if position < len(rows):
        assert budget.at(position) == rows[position]


def test_scenario_boundaries_preserve_case_identity() -> None:
    budget = make_mesh_budget(schedule(), 100)
    group_end = budget.group_scenes
    crop_end = group_end + budget.cropped_scenes
    assert budget.at(group_end - 1).scenario == "group"
    assert budget.at(group_end).scenario == "cropped"
    assert budget.at(crop_end - 1).scenario == "cropped"
    assert budget.at(crop_end).scenario == "profile"


def test_subject_slots_and_scenes_are_unique_within_frozen_pack() -> None:
    budget = make_mesh_budget(schedule(90), 250)
    ids = {scene.identity for scene in budget.scenes()}
    assert len(ids) == budget.total_scenes
    for scene in budget.scenes():
        assert scene.subjects
        assert tuple(subject.slot for subject in scene.subjects) == tuple(
            range(len(scene.subjects))
        )
        assert len({subject.case.identity for subject in scene.subjects}) == len(scene.subjects)


def test_count_audit_reconciles_without_pixels() -> None:
    budget = make_mesh_budget(schedule(), 1000)
    audit = budget.count_only_audit()
    assert audit["faces"] == 1000
    assert audit["scenes"] == 735
    assert sum(audit["faces_by_scenario"].values()) == 1000
    assert sum(audit["faces_by_fitzpatrick"].values()) == 1000
    assert audit["train_allowed"] is False
    assert audit["test_only"] is True


def test_chunk_audit_reconciles_full_without_duplicate_face_counts() -> None:
    budget = make_mesh_budget(schedule(), 300)
    middle = budget.total_scenes // 2
    first = budget.count_only_audit(0, middle)
    second = budget.count_only_audit(middle, budget.total_scenes)
    whole = budget.count_only_audit()
    assert first["faces"] + second["faces"] == whole["faces"]
    assert first["scenes"] + second["scenes"] == whole["scenes"]
    assert first["mesh_budget_sha256"] == whole["mesh_budget_sha256"]
    assert second["mesh_budget_sha256"] == whole["mesh_budget_sha256"]


@pytest.mark.parametrize("bad", (-1, 0, 1, 5, 19, 100001, True, 22.5, "1000"))
def test_budget_refuses_unbounded_or_bad_values(bad: object) -> None:
    with pytest.raises(SyntheticInputError):
        make_mesh_budget(schedule(), bad)  # type: ignore[arg-type]


@pytest.mark.parametrize("fields", (
    {"group_scenes": 0},
    {"cropped_scenes": 0},
    {"profile_scenes": 0},
    {"face_budget": 101},
    {"group_scenes": 14},
    {"cropped_scenes": 11},
    {"profile_scenes": 15},
))
def test_cannot_relabel_frozen_scene_distribution(fields: dict[str, int]) -> None:
    budget = make_mesh_budget(schedule(), 100)
    with pytest.raises(SyntheticInputError):
        replace(budget, **fields)


@pytest.mark.parametrize("bounds", ((-1, 1), (0, -1), (3, 2), (0, 500)))
def test_invalid_shard_ranges_are_rejected(bounds: tuple[int, int]) -> None:
    budget = make_mesh_budget(schedule(), 100)
    with pytest.raises(SyntheticInputError):
        tuple(budget.scenes(*bounds))


@pytest.mark.parametrize("invalid", (-1, 100, True, None, 3.5))
def test_invalid_random_access_ordinals_rejected(invalid: object) -> None:
    budget = make_mesh_budget(schedule(), 100)
    with pytest.raises(SyntheticInputError):
        budget.at(invalid)  # type: ignore[arg-type]


def test_budget_spec_contains_no_image_bytes_or_training_flags() -> None:
    budget = make_mesh_budget(schedule(), 100)
    record = budget.specification()
    assert record["face_budget"] == 100
    assert record["test_only"] is True
    assert record["train_allowed"] is False
    assert record["contains_image_bytes"] is False
    assert "source_id" not in record


def test_registry_max_faces_bound_is_not_exceeded() -> None:
    assert MAX_FACE_BUDGET == 100_000
    budget = make_mesh_budget(schedule(), MAX_FACE_BUDGET)
    assert budget.total_scenes < MAX_FACE_BUDGET
    assert sum(budget.scenario_faces.values()) == MAX_FACE_BUDGET

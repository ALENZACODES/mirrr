"""Group, edge-crop and near-profile scene instructions from seeded synthetic cases.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_pose_pack import (
    CROP_EDGES,
    CROP_MAX_VISIBLE,
    CROP_MIN_VISIBLE,
    FRONTAL_MAX_YAW,
    MAX_SCENES_PER_SCENARIO,
    PROFILE_MAX_YAW,
    PROFILE_MIN_YAW,
    PosePackPlan,
    PoseScene,
    PoseSubject,
    Rect,
)
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.types import SyntheticInputError

SCHEDULE = StressSchedule(seed=29, count=len(ALL_PROFILES))


def plan(count: int = 8) -> PosePackPlan:
    return PosePackPlan(SCHEDULE, count)


def scenes(scenario: str, count: int = 30) -> list[PoseScene]:
    return [scene for scene in plan(count).scenes() if scene.scenario == scenario]


def test_demo_pack_has_24_scenes_and_39_placements() -> None:
    summary = plan(8).summary()
    assert summary["scenes"] == 24 and summary["subject_placements"] == 39
    assert summary["placements_by_scenario"] == {"cropped": 8, "group": 23, "profile": 8}
    assert summary["test_only"] is True and summary["train_allowed"] is False


def test_group_sizes_cycle_two_three_four_without_overlap() -> None:
    groups = scenes("group")
    assert [len(scene.subjects) for scene in groups[:6]] == [2, 3, 4, 2, 3, 4]
    for scene in groups:
        boxes = [subject.rectangle for subject in scene.subjects]
        assert all(box.in_frame() for box in boxes)
        assert not any(a.overlaps(b) for i, a in enumerate(boxes) for b in boxes[i + 1:])
        assert all(abs(subject.yaw_degrees) <= FRONTAL_MAX_YAW for subject in scene.subjects)


def test_edge_crops_cover_all_four_edges_with_bounded_loss() -> None:
    crops = scenes("cropped")
    assert {scene.layout for scene in crops} == set(CROP_EDGES)
    for scene in crops:
        visible = scene.subjects[0].rectangle.visible_fraction
        assert CROP_MIN_VISIBLE - 1e-4 <= visible <= CROP_MAX_VISIBLE + 1e-4


def test_profiles_turn_left_and_right_near_profile() -> None:
    turns = scenes("profile")
    assert {scene.layout for scene in turns} == {"left", "right"}
    for scene in turns:
        yaw = scene.subjects[0].yaw_degrees
        assert PROFILE_MIN_YAW <= abs(yaw) <= PROFILE_MAX_YAW
        assert (yaw < 0) == (scene.layout == "left")


def test_every_subject_keeps_twelve_declared_traits_and_adult_case() -> None:
    for scene in plan().scenes():
        for subject in scene.to_dict()["subjects"]:
            assert len(subject["declared_traits"]) == 12
            assert 18 <= subject["age_years"] <= 80


def test_random_access_equals_iteration_and_ids_are_unique() -> None:
    pack = plan(12)
    rows = list(pack.scenes())
    assert [pack.at(i) for i in range(len(rows))] == rows
    assert len({scene.identity for scene in rows}) == len(rows)


def test_scene_identity_depends_on_seed() -> None:
    other = PosePackPlan(StressSchedule(seed=30, count=len(ALL_PROFILES)), 8)
    assert plan().at(0).identity != other.at(0).identity


def test_scene_rows_have_no_image_data_and_are_test_only() -> None:
    row = plan().at(9).to_dict()
    assert row["contains_image_bytes"] is False and row["train_allowed"] is False
    assert row["traits_declared_not_inferred"] is True
    assert row["expected_face_count"] == len(row["subjects"])


def test_rect_visible_fraction_and_bounds() -> None:
    assert Rect(-0.1, 0.0, 0.2, 0.2).visible_fraction == pytest.approx(0.5)
    with pytest.raises(SyntheticInputError):
        Rect(1.2, 0.0, 0.1, 0.1)
    with pytest.raises(SyntheticInputError):
        Rect(0.1, 0.1, 0.0, 0.1)
    with pytest.raises(SyntheticInputError):
        Rect(0.1, 0.1, float("nan"), 0.1)


def test_tampered_scenes_are_refused() -> None:
    group = scenes("group")[2]
    first, second = group.subjects[0], group.subjects[1]
    with pytest.raises(SyntheticInputError, match="overlap"):
        PoseScene("group", group.index, group.layout,
                  (first, replace(second, rectangle=first.rectangle), *group.subjects[2:]))
    profile = scenes("profile")[0]
    flipped = replace(profile.subjects[0], yaw_degrees=-profile.subjects[0].yaw_degrees)
    with pytest.raises(SyntheticInputError, match="sign"):
        PoseScene("profile", profile.index, profile.layout, (flipped,))
    crop = scenes("cropped")[0]
    inside = replace(crop.subjects[0], rectangle=Rect(0.3, 0.3, 0.2, 0.2))
    with pytest.raises(SyntheticInputError, match="edge"):
        PoseScene("cropped", crop.index, crop.layout, (inside,))


def test_duplicate_case_in_one_scene_is_refused() -> None:
    group = scenes("group")[0]
    twin = PoseSubject(1, group.subjects[0].case, group.subjects[1].rectangle,
                       group.subjects[1].yaw_degrees)
    with pytest.raises(SyntheticInputError, match="twice"):
        PoseScene("group", group.index, group.layout, (group.subjects[0], twin))


@pytest.mark.parametrize("count", (0, MAX_SCENES_PER_SCENARIO + 1, True))
def test_pack_size_bounds(count: object) -> None:
    with pytest.raises(SyntheticInputError):
        PosePackPlan(SCHEDULE, count)  # type: ignore[arg-type]

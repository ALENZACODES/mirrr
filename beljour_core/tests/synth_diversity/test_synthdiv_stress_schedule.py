"""Seeded, independently reproducible adult stress-case schedules.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule, case_summary
from lab.synth_diversity.stress_spec import MAX_CASES, STRESS_FORMAT
from lab.synth_diversity.types import SyntheticInputError


def test_one_anchor_per_required_profile() -> None:
    schedule = StressSchedule(seed=9, count=len(ALL_PROFILES))
    cases = list(schedule.cases())
    assert len(cases) == len(ALL_PROFILES)
    assert {case.profile for case in cases} == {profile.name for profile in ALL_PROFILES}
    assert {case.ordinal for case in cases} == set(range(len(ALL_PROFILES)))
    assert len({case.identity for case in cases}) == len(ALL_PROFILES)


@pytest.mark.parametrize("seed", [0, 1, 99, 4294967296, 2**64 - 1])
def test_identical_seed_produces_identical_canonical_cases(seed: int) -> None:
    left = StressSchedule(seed=seed, count=96)
    right = StressSchedule(seed=seed, count=96)
    assert [case.manifest_row() for case in left.cases()] == [
        case.manifest_row() for case in right.cases()
    ]


def test_different_study_seeds_change_case_identifiers() -> None:
    one = StressSchedule(seed=10, count=80)
    two = StressSchedule(seed=11, count=80)
    assert [case.identity for case in one.cases()] != [case.identity for case in two.cases()]


def test_random_access_matches_sequential_generation() -> None:
    schedule = StressSchedule(seed=1029, count=450)
    cases = list(schedule.cases())
    for index in (0, 1, 10, 37, 38, 79, 128, 229, 449):
        assert cases[index] == schedule.at(index)
        assert cases[index].identity == schedule.at(index).identity


def test_chunk_order_and_boundaries_do_not_change_rows() -> None:
    schedule = StressSchedule(seed=17, count=101)
    baseline = list(schedule.cases())
    parts = [list(schedule.cases(0, 22)), list(schedule.cases(22, 79))]
    parts.append(list(schedule.cases(79, 101)))
    assert sum(parts, []) == baseline
    assert list(schedule.cases(2, 2)) == []
    assert list(schedule.cases(0, schedule.count)) == baseline


def test_supplemental_ages_vary_and_stay_adult() -> None:
    schedule = StressSchedule(seed=26, count=500)
    supplemental = list(schedule.cases(schedule.anchor_count))
    ages = {case.age_years for case in supplemental}
    assert min(ages) >= 18
    assert max(ages) <= 80
    assert len(ages) >= 45
    assert len({case.profile for case in supplemental}) == len(ALL_PROFILES)
    assert len({case.identity for case in supplemental}) == len(supplemental)


def test_anchor_ages_span_18_and_80_endpoints() -> None:
    schedule = StressSchedule(seed=5, count=40)
    ages = [case.age_years for case in schedule.cases(0, schedule.anchor_count)]
    assert 18 in ages
    assert 80 in ages


def test_case_summary_excludes_image_data_and_counts_anchors() -> None:
    schedule = StressSchedule(seed=23, count=60, base_source_id="S05")
    result = case_summary(schedule)
    assert result["study_seed"] == 23
    assert result["required_profiles"] == len(ALL_PROFILES)
    assert result["base_source_id"] == "S05"
    assert result["test_only"] is True
    assert result["train_allowed"] is False
    assert "image" not in result
    assert STRESS_FORMAT >= 1


@pytest.mark.parametrize("count", [0, -1, len(ALL_PROFILES) - 1, MAX_CASES + 1, True, 1.5])
def test_schedule_rejects_invalid_count(count: object) -> None:
    with pytest.raises(SyntheticInputError):
        StressSchedule(seed=3, count=count)  # type: ignore[arg-type]


@pytest.mark.parametrize("seed", [-1, True, 2**64, 3.14, "3"])
def test_schedule_rejects_invalid_seed(seed: object) -> None:
    with pytest.raises(SyntheticInputError):
        StressSchedule(seed=seed, count=40)  # type: ignore[arg-type]


@pytest.mark.parametrize("source", ["S12", "photo", "", "S21"])
def test_schedule_rejects_nonbase_sources(source: str) -> None:
    with pytest.raises(SyntheticInputError):
        StressSchedule(seed=3, count=40, base_source_id=source)


@pytest.mark.parametrize("start,stop", [
    (-1, 1),
    (1, 0),
    (0, 100),
    (49, 51),
    (0, -1),
])
def test_schedule_rejects_outside_chunk_boundaries(start: int, stop: int) -> None:
    schedule = StressSchedule(seed=2, count=50)
    with pytest.raises(SyntheticInputError):
        list(schedule.cases(start, stop))


def test_schedule_rejects_invalid_random_access() -> None:
    schedule = StressSchedule(seed=11, count=41)
    for index in (-1, 41, 60, True):
        with pytest.raises(SyntheticInputError):
            schedule.at(index)


def test_anchor_invariance_when_additional_cases_requested() -> None:
    first = StressSchedule(seed=1111, count=38)
    second = StressSchedule(seed=1111, count=930)
    assert [case.identity for case in first.cases()] == [
        case.identity for case in second.cases(0, first.count)
    ]


def test_cannot_override_source_through_base_name() -> None:
    with pytest.raises(SyntheticInputError):
        StressSchedule(seed=3, count=42, base_id="../out")

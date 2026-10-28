"""Input-uniqueness gate: complete job rosters, duplicates and label shortfalls.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.stress_near_duplicate import difference_hash, slice_key
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_similarity_gate import (
    SimilarityPolicy,
    adult_labels,
    similarity_audit,
)
from lab.synth_diversity.stress_spec import declared_labels
from lab.synth_diversity.stress_variations import render_variation, variation_jobs
from lab.synth_diversity.types import SyntheticInputError

VIEWS = ("reference", "warm")


def schedule(count: int = len(ALL_PROFILES)) -> StressSchedule:
    return StressSchedule(seed=17, count=count)


def spread(index: int) -> int:
    """Pseudo-random 64-bit values; a chance pair within four bits is negligible."""
    return ((index * 0x9E37_79B9_7F4A_7C15) ^ (index << 13)) & ((1 << 64) - 1)


def distinct(plan: StressSchedule) -> list[tuple[str, int]]:
    return [(job.identity, spread(position))
            for position, job in enumerate(variation_jobs(plan, VIEWS))]


def policy(strict: bool = True, minimum: int = 1) -> SimilarityPolicy:
    return SimilarityPolicy(strict, minimum, VIEWS)


def test_complete_distinct_roster_passes() -> None:
    report = similarity_audit(schedule(), distinct(schedule()), policy())
    data = report.to_dict()
    assert data["status"] == "PASS"
    assert data["scheduled_jobs"] == data["observed_jobs"] == len(ALL_PROFILES) * 2
    assert data["near_duplicates"] == 0
    assert data["editor_quality_status"] == "NOT_EVALUATED"


def test_missing_job_fails_closed() -> None:
    rows = distinct(schedule())[:-1]
    report = similarity_audit(schedule(), rows, policy(strict=False))
    assert report.status == "FAIL"
    assert len(report.missing_jobs) == 1


def test_unexpected_job_fails() -> None:
    rows = [*distinct(schedule()), ("S21V-" + "0" * 32, 5)]
    assert similarity_audit(schedule(), rows, policy()).status == "FAIL"


def test_duplicate_observation_of_one_job_is_refused() -> None:
    rows = distinct(schedule())
    with pytest.raises(SyntheticInputError):
        similarity_audit(schedule(), [*rows, rows[0]], policy())


def test_identical_hashes_in_one_slice_and_view_are_near_duplicates() -> None:
    plan = schedule()
    rows = distinct(plan)
    jobs = list(variation_jobs(plan, VIEWS))
    seen: dict[tuple[str, str], int] = {}
    pair = None
    for position, job in enumerate(jobs):
        key = (job.view, slice_key(job.case.plan.tags))
        if key in seen:
            pair = (seen[key], position)
            break
        seen[key] = position
    assert pair is not None
    first, repeat = pair
    rows[repeat] = (rows[repeat][0], rows[first][1] ^ 0b1011)
    strict = similarity_audit(plan, rows, policy(strict=True))
    relaxed = similarity_audit(plan, rows, policy(strict=False))
    assert strict.status == "FAIL" and relaxed.status == "PASS"
    assert strict.duplicate_pairs == ((rows[repeat][0], rows[first][0], 3),)


def test_equal_hashes_across_different_slices_are_not_duplicates() -> None:
    plan = schedule()
    rows = [(job_id, 0) for job_id, _ in distinct(plan)]
    jobs = list(variation_jobs(plan, VIEWS))
    keys = {(job.view, slice_key(job.case.plan.tags)) for job in jobs}
    report = similarity_audit(plan, rows, policy(strict=True))
    assert len(report.duplicate_pairs) == len(jobs) - len(keys)


def test_minimum_unique_cases_per_label_creates_shortfalls() -> None:
    report = similarity_audit(schedule(), distinct(schedule()), policy(minimum=3))
    counts = dict.fromkeys(adult_labels(), 0)
    for case in schedule().cases():
        for label in declared_labels(case.plan.tags):
            counts[label] += 1
    expected = tuple(label for label in adult_labels() if counts[label] < 3)
    assert expected
    assert report.shortfalls == expected
    assert report.unique_cases == counts
    assert report.status == "FAIL"
    assert set(report.unique_cases) == set(adult_labels())
    assert "age_band=0-9" not in report.unique_cases


def test_cases_with_missing_jobs_do_not_count_as_unique() -> None:
    plan = schedule()
    rows = distinct(plan)
    full = similarity_audit(plan, rows, policy())
    partial = similarity_audit(plan, rows[1:], policy())
    assert sum(partial.unique_cases.values()) == sum(full.unique_cases.values()) - 12


def test_policy_validation() -> None:
    with pytest.raises(SyntheticInputError):
        SimilarityPolicy("yes", 1)  # type: ignore[arg-type]
    with pytest.raises(SyntheticInputError):
        SimilarityPolicy(True, -1)
    with pytest.raises(SyntheticInputError):
        similarity_audit(schedule(), [], None)  # type: ignore[arg-type]


def test_real_rendered_hashes_flow_through_the_gate() -> None:
    plan = schedule()
    base = {"drawn_face": make_drawn_face()}
    jobs = list(variation_jobs(plan, ("reference",), 0, 2))
    rows = [(job.identity, difference_hash(render_variation(job, base))) for job in jobs]
    small = SimilarityPolicy(False, 0, ("reference",))
    report = similarity_audit(plan, rows, small)
    assert report.observed_jobs == 2
    assert len(report.missing_jobs) == len(ALL_PROFILES) - 2
    assert report.status == "FAIL"

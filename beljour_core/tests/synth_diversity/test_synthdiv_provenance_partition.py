"""Corpus job partition bounds: pools, 100,000-record jobs and plan-bound IDs.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_provenance_resume import (
    MAX_JOB_RECORDS,
    CorpusPlanSpec,
    plan_jobs,
)
from lab.synth_diversity.stress_provenance_resume_fixtures import (
    FIXTURE_POOL_COUNTS,
    fixture_spec,
)
from lab.synth_diversity.types import SyntheticInputError


def counts(**change: int) -> dict[str, int]:
    return {**dict.fromkeys(FIXTURE_POOL_COUNTS, 0), **change}


def test_fixture_plan_has_expected_job_bounds() -> None:
    jobs = plan_jobs(fixture_spec())
    assert [(job.pool, job.start, job.stop) for job in jobs] == [
        ("own_render", 0, 100_000), ("own_render", 100_000, 200_000),
        ("own_render", 200_000, 250_000), ("sfhq", 0, 100_000), ("sfhq", 100_000, 120_000),
        ("research_test", 0, 30_000)]
    assert [job.index for job in jobs] == list(range(6))


def test_three_million_records_need_at_least_thirty_jobs() -> None:
    spec = CorpusPlanSpec(1, counts(own_render=3_000_000))
    jobs = plan_jobs(spec)
    assert len(jobs) == 30
    assert all(job.size == MAX_JOB_RECORDS for job in jobs)


def test_zero_record_plan_has_no_jobs() -> None:
    assert plan_jobs(CorpusPlanSpec(1, counts())) == ()


def test_job_ids_depend_on_seed_and_bounds() -> None:
    first = plan_jobs(fixture_spec(seed=1))
    second = plan_jobs(fixture_spec(seed=2))
    assert [job.job_id for job in first] != [job.job_id for job in second]
    assert len({job.job_id for job in first}) == len(first)


@pytest.mark.parametrize("pool_counts", (
    counts(own_render=3_000_001),
    counts(own_render=2_000_000, sfhq=1_000_001),
    counts(own_render=-1),
    {"own_render": 10},
    {**counts(), "public_web": 5},
))
def test_invalid_pool_counts_are_refused(pool_counts: dict[str, int]) -> None:
    with pytest.raises(SyntheticInputError):
        CorpusPlanSpec(1, pool_counts)


@pytest.mark.parametrize("size", (0, 100_001, 1.5))
def test_job_size_is_bounded(size: object) -> None:
    with pytest.raises(SyntheticInputError):
        CorpusPlanSpec(1, counts(sfhq=10), size)  # type: ignore[arg-type]


def test_smaller_job_size_splits_evenly() -> None:
    jobs = plan_jobs(CorpusPlanSpec(3, counts(research_test=10), 4))
    assert [(job.start, job.stop) for job in jobs] == [(0, 4), (4, 8), (8, 10)]

"""Seeded partition properties: exact coverage, no overlap, stable identifiers.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.stress_provenance import POOLS
from lab.synth_diversity.stress_provenance_resume import CorpusPlanSpec, plan_jobs


def random_spec(seed: int) -> CorpusPlanSpec:
    rng = np.random.default_rng(seed)
    pool_counts = {pool: int(rng.integers(0, 400_000)) for pool in POOLS}
    return CorpusPlanSpec(seed, pool_counts, int(rng.integers(1_000, 100_001)))


@pytest.mark.parametrize("seed", range(20))
def test_jobs_cover_each_pool_exactly_once(seed: int) -> None:
    spec = random_spec(seed)
    jobs = plan_jobs(spec)
    for pool in POOLS:
        bounds = [(job.start, job.stop) for job in jobs if job.pool == pool]
        position = 0
        for start, stop in bounds:
            assert start == position and 0 < stop - start <= spec.job_size
            position = stop
        assert position == spec.pool_counts[pool]
    assert sum(job.size for job in jobs) == spec.total


@pytest.mark.parametrize("seed", range(10))
def test_replanning_is_identical(seed: int) -> None:
    assert plan_jobs(random_spec(seed)) == plan_jobs(random_spec(seed))


@pytest.mark.parametrize("seed", range(10))
def test_any_count_change_changes_every_job_id(seed: int) -> None:
    spec = random_spec(seed)
    changed = dict(spec.pool_counts)
    changed["quarantine"] += 1
    other = CorpusPlanSpec(spec.seed, changed, spec.job_size)
    first = {job.job_id for job in plan_jobs(spec)}
    assert not first & {job.job_id for job in plan_jobs(other)}

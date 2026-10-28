"""Resume state from accepted receipt prefixes: counts and ordering.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_provenance_resume import check_receipts, plan_jobs
from lab.synth_diversity.stress_provenance_resume_fixtures import fixture_receipts, fixture_spec


@pytest.mark.parametrize("done", range(0, 7))
def test_prefix_receipts_advance_resume_state(done: int) -> None:
    spec = fixture_spec()
    state = check_receipts(spec, fixture_receipts(spec, done))
    jobs = plan_jobs(spec)
    assert state.completed == done
    assert state.completed_records == sum(job.size for job in jobs[:done])
    assert state.finished is (done == len(jobs))
    assert state.planned_records == 400_000


def test_state_is_scheduling_only() -> None:
    spec = fixture_spec()
    data = check_receipts(spec, fixture_receipts(spec)).to_dict()
    assert data["finished"] is True
    assert data["evidence_status"] == "SCHEDULING_ONLY_NOT_CLEARANCE"


def test_resumed_and_uninterrupted_runs_agree() -> None:
    spec = fixture_spec()
    receipts = list(fixture_receipts(spec))
    first = check_receipts(spec, receipts[:3])
    rest = check_receipts(spec, receipts)
    assert first.completed == 3 and rest.completed == len(receipts)
    assert check_receipts(spec, list(fixture_receipts(spec))) == rest

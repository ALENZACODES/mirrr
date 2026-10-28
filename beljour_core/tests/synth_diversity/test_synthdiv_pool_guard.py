"""Runtime training prohibition, pool fence and producer test markers.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_camera_seed_registry import build_registry
from lab.synth_diversity.stress_mesh_budget import make_mesh_budget
from lab.synth_diversity.stress_pool_guard import (
    ALLOWED_PURPOSES,
    PURPOSES,
    check_pool_isolation,
    check_test_markers,
    require_access,
    training_fence,
)
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_provenance import DISPOSITIONS
from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
)
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.types import SyntheticInputError

TABLE = {record.record_id: record for record in fixture_records()}


def test_every_disposition_has_a_purpose_row() -> None:
    assert set(ALLOWED_PURPOSES) == set(DISPOSITIONS)
    assert all(purposes <= set(PURPOSES) for purposes in ALLOWED_PURPOSES.values())
    assert [state for state, purposes in ALLOWED_PURPOSES.items() if "train" in purposes] == [
        "TRAIN_ELIGIBLE"]


@pytest.mark.parametrize(("record_id", "purpose", "allowed"), (
    ("own-0001", "train", True), ("own-0001", "experiment", True),
    ("sfhq-0001", "experiment", True), ("sfhq-0001", "test", False),
    ("sfhq-0001", "train", False), ("research-0001", "test", True),
    ("research-0001", "experiment", False), ("research-0001", "train", False),
))
def test_access_table(record_id: str, purpose: str, allowed: bool) -> None:
    record = TABLE[record_id]
    if allowed:
        require_access(record, purpose, fixture_approvals(), FIXTURE_NOW)
    else:
        with pytest.raises(SyntheticInputError, match="not permitted"):
            require_access(record, purpose, fixture_approvals(), FIXTURE_NOW)


def test_quarantine_permits_nothing() -> None:
    quarantined = replace(TABLE["own-0001"], pool="quarantine", source_class="unverified")
    for purpose in PURPOSES:
        with pytest.raises(SyntheticInputError):
            require_access(quarantined, purpose, fixture_approvals(), FIXTURE_NOW)


def test_fence_admits_only_approved_witnessed_originals() -> None:
    admitted = training_fence(TABLE, ["own-0003", "own-0001"], fixture_approvals(),
                              {"own-0001", "own-0003"}, FIXTURE_NOW)
    assert admitted == ("own-0001", "own-0003")


def test_one_bad_proposal_fails_the_whole_selection() -> None:
    with pytest.raises(SyntheticInputError):
        training_fence(TABLE, ["own-0001", "sfhq-0002"], fixture_approvals(), set(TABLE),
                       FIXTURE_NOW)


def test_pool_isolation_rejects_shared_tokens() -> None:
    records = list(fixture_records())
    records[5] = replace(records[5], rights_token="rights-research")
    with pytest.raises(SyntheticInputError, match="shared"):
        check_pool_isolation(records)


@pytest.mark.parametrize("payload", (
    {}, {"test_only": True}, {"test_only": True, "train_allowed": True},
    {"test_only": "true", "train_allowed": False}, {"test_only": True, "train_allowed": 0},
))
def test_payloads_without_exact_markers_are_refused(payload: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError, match="test_only"):
        check_test_markers(payload)


def test_stress_producers_emit_test_markers() -> None:
    schedule = StressSchedule(seed=5, count=len(ALL_PROFILES))
    check_test_markers(build_registry(schedule, ("reference",)).to_payload())
    check_test_markers(make_mesh_budget(schedule, 40).specification())
    check_test_markers(schedule.at(0).manifest_row())
    for scene in make_mesh_budget(schedule, 40).scenes(0, 3):
        check_test_markers(scene.to_dict())

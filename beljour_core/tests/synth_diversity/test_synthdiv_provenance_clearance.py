"""Rights approvals bind run, token and licence; dispositions are derived by code.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_pool_guard import ALLOWED_PURPOSES, require_access
from lab.synth_diversity.stress_provenance import (
    EXPERIMENTS_ONLY,
    QUARANTINED,
    REVIEW_REQUIRED,
    TEST_ONLY,
    TRAIN_ELIGIBLE,
    ApprovalRegistry,
    RightsApproval,
    disposition,
)
from lab.synth_diversity.stress_provenance_fixtures import (
    DAY,
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
)
from lab.synth_diversity.types import SyntheticInputError

OWN = fixture_records()[0]


def approval(**change: object) -> RightsApproval:
    base = RightsApproval(OWN.record_id, OWN.generator_run, OWN.rights_token,
                          OWN.licence_sha256, "reviewer-a", FIXTURE_NOW - DAY,
                          FIXTURE_NOW + DAY)
    return replace(base, **change)  # type: ignore[arg-type]


def test_unapproved_fixture_has_zero_train_eligible_records() -> None:
    states = [disposition(record, None, FIXTURE_NOW) for record in fixture_records()]
    assert TRAIN_ELIGIBLE not in states
    assert states.count(REVIEW_REQUIRED) == 3


def test_pool_dispositions() -> None:
    registry = fixture_approvals()
    states = {record.record_id: disposition(record, registry, FIXTURE_NOW)
              for record in fixture_records()}
    assert states["own-0001"] == TRAIN_ELIGIBLE
    assert states["sfhq-0001"] == EXPERIMENTS_ONLY
    assert states["research-0001"] == TEST_ONLY
    quarantined = replace(OWN, pool="quarantine", source_class="unverified")
    assert disposition(quarantined, registry, FIXTURE_NOW) == QUARANTINED


def test_sfhq_cannot_be_approved_even_with_a_matching_approval() -> None:
    sfhq = next(record for record in fixture_records() if record.pool == "sfhq")
    forged = ApprovalRegistry([RightsApproval(
        sfhq.record_id, sfhq.generator_run, sfhq.rights_token, sfhq.licence_sha256,
        "reviewer-a", FIXTURE_NOW - DAY, FIXTURE_NOW + DAY)])
    assert disposition(sfhq, forged, FIXTURE_NOW) == EXPERIMENTS_ONLY


@pytest.mark.parametrize("change", (
    {"generator_run": "run-other"},
    {"rights_token": "rights-other"},
    {"licence_sha256": "0" * 64},
    {"record_id": "own-0002"},
))
def test_altered_binding_does_not_approve(change: dict[str, object]) -> None:
    registry = ApprovalRegistry([approval(**change)])
    assert disposition(OWN, registry, FIXTURE_NOW) == REVIEW_REQUIRED


def test_expired_and_future_approvals_do_not_approve() -> None:
    registry = ApprovalRegistry([approval()])
    assert disposition(OWN, registry, FIXTURE_NOW) == TRAIN_ELIGIBLE
    assert disposition(OWN, registry, FIXTURE_NOW + DAY) == REVIEW_REQUIRED
    assert disposition(OWN, registry, FIXTURE_NOW - 2 * DAY) == REVIEW_REQUIRED


@pytest.mark.parametrize("change", (
    {"expires_at": FIXTURE_NOW - DAY},
    {"expires_at": FIXTURE_NOW + 400 * DAY},
    {"approved_at": -1},
    {"reviewer": "Reviewer A"},
))
def test_approval_window_and_fields_are_validated(change: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        approval(**change)


def test_registry_refuses_duplicates_and_untyped_entries() -> None:
    with pytest.raises(SyntheticInputError):
        ApprovalRegistry([approval(), approval()])
    with pytest.raises(SyntheticInputError):
        ApprovalRegistry([{"record_id": "own-0001"}])  # type: ignore[list-item]


def test_registry_digest_binds_contents() -> None:
    assert ApprovalRegistry([approval()]).digest != ApprovalRegistry(
        [approval(reviewer="reviewer-b")]).digest


def test_purpose_table() -> None:
    sfhq = next(record for record in fixture_records() if record.pool == "sfhq")
    research = next(record for record in fixture_records() if record.pool == "research_test")
    assert require_access(sfhq, "experiment", None, FIXTURE_NOW) == EXPERIMENTS_ONLY
    with pytest.raises(SyntheticInputError):
        require_access(sfhq, "train", fixture_approvals(), FIXTURE_NOW)
    with pytest.raises(SyntheticInputError):
        require_access(research, "experiment", None, FIXTURE_NOW)
    with pytest.raises(SyntheticInputError):
        require_access(OWN, "train", None, FIXTURE_NOW)
    assert ALLOWED_PURPOSES[QUARANTINED] == frozenset()
    with pytest.raises(SyntheticInputError):
        require_access(OWN, "publish", None, FIXTURE_NOW)

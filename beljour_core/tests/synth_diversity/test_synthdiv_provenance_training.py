"""Fail-closed metadata-only training allowlist and the training-selection fence.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_pool_guard import training_fence
from lab.synth_diversity.stress_provenance_fixtures import (
    DAY,
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
    fixture_sketches,
)
from lab.synth_diversity.stress_provenance_overlap import scan_overlap, training_allowlist
from lab.synth_diversity.types import SyntheticInputError

OWN_IDS = {"own-0001", "own-0002", "own-0003"}


def allowlist(contaminate: str | None = None, approvals: bool = True,
              witnessed: set[str] = OWN_IDS, now: int = FIXTURE_NOW) -> tuple[str, ...]:
    records = fixture_records()
    receipt = scan_overlap(records, fixture_sketches(contaminate))
    registry = fixture_approvals() if approvals else None
    return training_allowlist(records, receipt, registry, witnessed, now)


def test_approved_clean_witnessed_own_render_is_listed() -> None:
    assert allowlist() == ("own-0001", "own-0002", "own-0003")


def test_without_approvals_nothing_is_listed() -> None:
    assert allowlist(approvals=False) == ()


def test_stale_approvals_list_nothing() -> None:
    assert allowlist(now=FIXTURE_NOW + 60 * DAY) == ()


def test_contamination_excludes_record_and_descendants() -> None:
    assert allowlist("own-0002") == ("own-0001", "own-0003")
    assert allowlist("own-0001") == ("own-0002",)


def test_unwitnessed_records_are_not_listed() -> None:
    assert allowlist(witnessed={"own-0002"}) == ("own-0002",)


def test_receipt_for_another_inventory_is_refused() -> None:
    records = fixture_records()
    receipt = scan_overlap(records, fixture_sketches())
    changed = (replace(records[0], content_sha256="2" * 64), *records[1:])
    with pytest.raises(SyntheticInputError, match="exact inventory"):
        training_allowlist(changed, receipt, fixture_approvals(), OWN_IDS, FIXTURE_NOW)


def test_sfhq_and_research_never_appear_even_if_witnessed_and_approved() -> None:
    every = {record.record_id for record in fixture_records()}
    listed = allowlist(witnessed=every)
    assert all(name.startswith("own-") for name in listed)


@pytest.mark.parametrize("proposal", ("sfhq-0001", "research-0002", "own-9999"))
def test_fence_refuses_any_non_eligible_proposal(proposal: str) -> None:
    table = {record.record_id: record for record in fixture_records()}
    with pytest.raises(SyntheticInputError):
        training_fence(table, ["own-0001", proposal], fixture_approvals(),
                       set(table), FIXTURE_NOW)


def test_fence_refuses_invented_training_flags_and_repeats() -> None:
    table = {record.record_id: record for record in fixture_records()}
    forged = {"record_id": "sfhq-0001", "train_allowed": True}
    with pytest.raises(SyntheticInputError, match="bare record identifiers"):
        training_fence(table, [forged], fixture_approvals(), set(table), FIXTURE_NOW)
    with pytest.raises(SyntheticInputError, match="repeats"):
        training_fence(table, ["own-0001", "own-0001"], fixture_approvals(),
                       set(table), FIXTURE_NOW)


def test_fence_requires_witnessed_source_audit() -> None:
    table = {record.record_id: record for record in fixture_records()}
    with pytest.raises(SyntheticInputError, match="witnessed"):
        training_fence(table, ["own-0001"], fixture_approvals(), set(), FIXTURE_NOW)

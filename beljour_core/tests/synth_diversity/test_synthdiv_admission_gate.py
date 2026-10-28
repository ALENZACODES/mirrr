"""Provenance admission decisions over the fictional seven-record inventory.
Author: John Khan.
"""

from __future__ import annotations

from lab.synth_diversity.stress_provenance import ApprovalRegistry
from lab.synth_diversity.stress_provenance_admission import admit_records
from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
    fixture_sketches,
)
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fixture_trust,
    fixture_witness_receipts,
)

ROSTER = "a" * 64


def decide(contaminate: str | None = None, registry: ApprovalRegistry | None = None):
    receipts = fixture_witness_receipts(sketches=fixture_sketches(contaminate))
    return admit_records(fixture_records(), ROSTER, receipts, fixture_trust(),
                         fixture_approvals() if registry is None else registry, FIXTURE_NOW)


def test_clean_approved_witnessed_originals_are_admitted() -> None:
    result = decide()
    assert result.allowlist == ("own-0001", "own-0002", "own-0003")
    assert result.by_disposition["EXPERIMENTS_ONLY"] == 2
    assert result.by_disposition["TEST_ONLY"] == 2


def test_empty_registry_admits_nothing() -> None:
    result = decide(registry=ApprovalRegistry())
    assert result.allowlist == ()
    assert result.by_disposition["REVIEW_REQUIRED"] == 3


def test_contaminated_original_and_descendant_are_excluded() -> None:
    result = decide("own-0001")
    assert result.allowlist == ("own-0002",)
    assert result.contaminated == 1
    assert result.excluded_eligible == 2


def test_restricted_pools_never_appear() -> None:
    for contaminate in (None, "own-0002"):
        assert all(name.startswith("own-") for name in decide(contaminate).allowlist)


def test_result_binds_roster_inventory_and_registry() -> None:
    data = decide().to_dict()
    assert data["roster_sha256"] == ROSTER
    assert data["registry_sha256"] == fixture_approvals().digest
    assert data["loader_must_recheck"] is True

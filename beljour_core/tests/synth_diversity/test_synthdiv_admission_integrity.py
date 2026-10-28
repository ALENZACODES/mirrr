"""Stale and changed admission inputs fail before any identifier is returned.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_provenance import ApprovalRegistry, RightsApproval
from lab.synth_diversity.stress_provenance_admission import admit_records
from lab.synth_diversity.stress_provenance_fixtures import (
    DAY,
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
)
from lab.synth_diversity.stress_provenance_receipts import TrustRoot, TrustStore
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fictional_key,
    fixture_trust,
    fixture_witness_receipts,
)
from lab.synth_diversity.types import SyntheticInputError

RECEIPTS = fixture_witness_receipts()


def test_expired_witness_receipts_fail() -> None:
    with pytest.raises(SyntheticInputError, match="not current"):
        admit_records(fixture_records(), "c" * 64, RECEIPTS, fixture_trust(),
                      fixture_approvals(), FIXTURE_NOW + 10 * DAY)


def test_record_changed_after_witnessing_fails() -> None:
    records = list(fixture_records())
    records[4] = replace(records[4], content_sha256="5" * 64)
    with pytest.raises(SyntheticInputError):
        admit_records(records, "c" * 64, RECEIPTS, fixture_trust(), fixture_approvals(),
                      FIXTURE_NOW)


def test_stale_approval_admits_nothing_but_still_verifies() -> None:
    expired = ApprovalRegistry(
        RightsApproval(r.record_id, r.generator_run, r.rights_token, r.licence_sha256,
                       "reviewer", FIXTURE_NOW - 40 * DAY, FIXTURE_NOW - DAY)
        for r in fixture_records() if r.pool == "own_render")
    result = admit_records(fixture_records(), "c" * 64, RECEIPTS, fixture_trust(), expired,
                           FIXTURE_NOW)
    assert result.allowlist == ()


def test_missing_registry_is_refused() -> None:
    with pytest.raises(SyntheticInputError, match="registry"):
        admit_records(fixture_records(), "c" * 64, RECEIPTS, fixture_trust(),
                      None, FIXTURE_NOW)  # type: ignore[arg-type]


def test_trust_store_without_overlap_role_fails() -> None:
    with pytest.raises(SyntheticInputError, match="not trusted"):
        admit_records(fixture_records(), "c" * 64, RECEIPTS,
                      fixture_trust(("render", "rights")), fixture_approvals(), FIXTURE_NOW)


def test_scan_issuer_cannot_also_be_the_render_issuer() -> None:
    shared = "shared-box"
    with pytest.raises(SyntheticInputError, match="two witness roles"):
        TrustStore([TrustRoot("render", shared, fictional_key("render")),
                    TrustRoot("overlap", shared, fictional_key("overlap"))])

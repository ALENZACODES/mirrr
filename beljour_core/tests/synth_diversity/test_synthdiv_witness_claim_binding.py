"""Per-record render and rights claims and the scan checksum must bind exactly.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_records,
    fixture_sketches,
)
from lab.synth_diversity.stress_provenance_witness import verify_witnesses
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fixture_trust,
    fixture_witness_receipts,
)
from lab.synth_diversity.types import SyntheticInputError

RECEIPTS = fixture_witness_receipts()


def test_complete_receipts_witness_every_record() -> None:
    result = verify_witnesses(fixture_records(), RECEIPTS, fixture_trust(), FIXTURE_NOW)
    assert result.render_witnessed == {record.record_id for record in fixture_records()}
    assert result.fully_witnessed == {"own-0001", "own-0002", "own-0003"}
    assert result.overlap.matches == ()


@pytest.mark.parametrize("change", (
    {"generator_run": "run-own-z"}, {"licence_sha256": "9" * 64},
    {"rights_token": "rights-own-z"}, {"content_sha256": "8" * 64},
    {"generator": "other-gen"}, {"parents": ("own-0002",)},
))
def test_altered_record_fields_break_render_binding(change: dict[str, object]) -> None:
    records = list(fixture_records())
    records[0] = replace(records[0], **change)  # type: ignore[arg-type]
    with pytest.raises(SyntheticInputError, match="claim differs|exact inventory"):
        verify_witnesses(records, RECEIPTS, fixture_trust(), FIXTURE_NOW)


def test_receipts_for_contaminated_scan_report_matches() -> None:
    sketches = fixture_sketches("own-0003")
    receipts = fixture_witness_receipts(sketches=sketches)
    result = verify_witnesses(fixture_records(), receipts, fixture_trust(), FIXTURE_NOW)
    assert result.overlap.contaminated == {"own-0003"}


def test_scan_for_a_different_inventory_is_refused() -> None:
    records = fixture_records()
    smaller = records[:-1]
    stale = fixture_witness_receipts(records=smaller)
    scan = [item for item in stale if item.role == "overlap"]
    rest = [item for item in RECEIPTS if item.role != "overlap"]
    with pytest.raises(SyntheticInputError, match="exact inventory"):
        verify_witnesses(records, [*rest, *scan], fixture_trust(), FIXTURE_NOW)


def test_rights_claim_for_wrong_licence_is_refused() -> None:
    other = list(fixture_records())
    other[1] = replace(other[1], licence_sha256="7" * 64)
    forged_rights = [item for item in fixture_witness_receipts(records=tuple(other))
                     if item.role == "rights" and item.subject == "own-0002"]
    receipts = [item for item in RECEIPTS
                if not (item.role == "rights" and item.subject == "own-0002")]
    with pytest.raises(SyntheticInputError, match="rights claim differs"):
        verify_witnesses(fixture_records(), [*receipts, *forged_rights], fixture_trust(),
                         FIXTURE_NOW)


def test_tampered_signature_is_refused() -> None:
    receipts = list(RECEIPTS)
    receipts[0] = replace(receipts[0], signature="0" * 64)
    with pytest.raises(SyntheticInputError, match="bad signature"):
        verify_witnesses(fixture_records(), receipts, fixture_trust(), FIXTURE_NOW)

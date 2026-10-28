"""Complete corpus witness coverage: no missing, extra or duplicate receipts.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_provenance_fixtures import FIXTURE_NOW, fixture_records
from lab.synth_diversity.stress_provenance_receipts import WitnessReceipt, sign_receipt
from lab.synth_diversity.stress_provenance_witness import (
    INVENTORY_SUBJECT,
    render_claim,
    rights_claim,
    verify_witnesses,
)
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fixture_root,
    fixture_trust,
    fixture_witness_receipts,
)
from lab.synth_diversity.types import SyntheticInputError

RECEIPTS = fixture_witness_receipts()


def without(role: str, subject: str) -> list[WitnessReceipt]:
    return [item for item in RECEIPTS if (item.role, item.subject) != (role, subject)]


def run(receipts: list[WitnessReceipt]) -> None:
    verify_witnesses(fixture_records(), receipts, fixture_trust(), FIXTURE_NOW)


def test_missing_render_receipt() -> None:
    with pytest.raises(SyntheticInputError, match="missing for sfhq-0002"):
        run(without("render", "sfhq-0002"))


def test_render_receipt_for_unknown_record() -> None:
    extra = sign_receipt(fixture_root("render"), "own-0999", {}, FIXTURE_NOW - 1,
                         FIXTURE_NOW + 9)
    with pytest.raises(SyntheticInputError, match="outside the inventory"):
        run([*RECEIPTS, extra])


def test_duplicate_render_receipt() -> None:
    first = next(item for item in RECEIPTS if item.role == "render")
    with pytest.raises(SyntheticInputError, match="two render receipts"):
        run([*RECEIPTS, first])


def test_missing_rights_review_for_an_original() -> None:
    with pytest.raises(SyntheticInputError, match="own-render"):
        run(without("rights", "own-0002"))


def test_rights_receipt_for_sfhq_is_refused() -> None:
    sfhq = next(record for record in fixture_records() if record.pool == "sfhq")
    extra = sign_receipt(fixture_root("rights"), sfhq.record_id, rights_claim(sfhq),
                         FIXTURE_NOW - 1, FIXTURE_NOW + 9)
    with pytest.raises(SyntheticInputError, match="own-render"):
        run([*RECEIPTS, extra])


def test_missing_or_extra_overlap_scan() -> None:
    with pytest.raises(SyntheticInputError, match="exactly one"):
        run(without("overlap", INVENTORY_SUBJECT))
    scan = next(item for item in RECEIPTS if item.role == "overlap")
    other = sign_receipt(fixture_root("overlap"), "other-scope", scan.claim,
                         FIXTURE_NOW - 1, FIXTURE_NOW + 9)
    with pytest.raises(SyntheticInputError, match="exactly one"):
        run([*RECEIPTS, other])


def test_source_role_receipt_is_not_a_witness() -> None:
    record = fixture_records()[0]
    stray = sign_receipt(fixture_root("source"), record.record_id, render_claim(record),
                         FIXTURE_NOW - 1, FIXTURE_NOW + 9)
    with pytest.raises(SyntheticInputError, match="unexpected receipt role"):
        run([*RECEIPTS, stray])


def test_expired_receipts_fail_the_inventory() -> None:
    with pytest.raises(SyntheticInputError, match="not current"):
        verify_witnesses(fixture_records(), RECEIPTS, fixture_trust(), FIXTURE_NOW + 8 * 86_400)

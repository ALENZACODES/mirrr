"""Exact signed-envelope schema: fields, types, formats and canonical encoding.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_provenance_fixtures import FIXTURE_NOW
from lab.synth_diversity.stress_provenance_receipts import (
    RECEIPT_FIELDS,
    receipt_from_dict,
    sign_receipt,
    verify_receipt,
)
from lab.synth_diversity.stress_provenance_witness_fixtures import fixture_root, fixture_trust
from lab.synth_diversity.types import SyntheticInputError


def row() -> dict[str, object]:
    item = sign_receipt(fixture_root("rights"), "own-0002", {"decision": "approved"},
                        FIXTURE_NOW - 5, FIXTURE_NOW + 5)
    return item.to_dict()


def test_round_trip_preserves_verification() -> None:
    parsed = receipt_from_dict(row())
    assert set(parsed.to_dict()) == RECEIPT_FIELDS
    assert verify_receipt(parsed, fixture_trust(), "rights", FIXTURE_NOW) == {
        "decision": "approved"}


@pytest.mark.parametrize("change", (
    {"extra": 1}, {"format": 2}, {"format": True}, {"signature": "A" * 64},
    {"signature": "0" * 63}, {"subject": "Own 0002"}, {"role": "admin"},
    {"claim": ["approved"]}, {"issued_at": "1"}, {"expires_at": 1.5},
))
def test_schema_violations_are_refused(change: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        receipt_from_dict({**row(), **change})


def test_missing_field_is_refused() -> None:
    data = row()
    del data["issuer"]
    with pytest.raises(SyntheticInputError, match="inventory"):
        receipt_from_dict(data)


def test_claim_must_be_finite_json() -> None:
    with pytest.raises(SyntheticInputError):
        sign_receipt(fixture_root("render"), "s", {"x": float("nan")}, 0, 10)


def test_signature_does_not_reveal_key() -> None:
    data = row()
    assert fixture_root("rights").key.hex() not in str(data)

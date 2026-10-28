"""Witness receipt roles, validity windows, signatures and independent trust roots.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_provenance_fixtures import FIXTURE_NOW
from lab.synth_diversity.stress_provenance_receipts import (
    MAX_VALIDITY_SECONDS,
    TrustRoot,
    TrustStore,
    sign_receipt,
    verify_receipt,
)
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fictional_key,
    fixture_root,
    fixture_trust,
)
from lab.synth_diversity.types import SyntheticInputError

CLAIM = {"record_id": "own-0001", "value": 3}


def receipt(role: str = "render", start: int = FIXTURE_NOW - 10, length: int = 100):
    return sign_receipt(fixture_root(role), "own-0001", CLAIM, start, start + length)


def test_valid_receipt_returns_its_claim() -> None:
    assert verify_receipt(receipt(), fixture_trust(), "render", FIXTURE_NOW) == CLAIM


def test_window_is_inclusive_start_exclusive_end() -> None:
    item = receipt(start=FIXTURE_NOW, length=50)
    assert verify_receipt(item, fixture_trust(), "render", FIXTURE_NOW)
    assert verify_receipt(item, fixture_trust(), "render", FIXTURE_NOW + 49)
    with pytest.raises(SyntheticInputError, match="not current"):
        verify_receipt(item, fixture_trust(), "render", FIXTURE_NOW + 50)
    with pytest.raises(SyntheticInputError, match="not current"):
        verify_receipt(item, fixture_trust(), "render", FIXTURE_NOW - 1)


def test_validity_cannot_exceed_thirty_days() -> None:
    root = fixture_root("render")
    sign_receipt(root, "s", {}, 0, MAX_VALIDITY_SECONDS)
    with pytest.raises(SyntheticInputError, match="30 days"):
        sign_receipt(root, "s", {}, 0, MAX_VALIDITY_SECONDS + 1)


def test_role_mismatch_is_refused() -> None:
    with pytest.raises(SyntheticInputError, match="expected a rights receipt"):
        verify_receipt(receipt("render"), fixture_trust(), "rights", FIXTURE_NOW)


def test_untrusted_issuer_is_refused() -> None:
    rogue = TrustRoot("render", "rogue-box", fictional_key("render", "rogue"))
    item = sign_receipt(rogue, "own-0001", CLAIM, FIXTURE_NOW - 1, FIXTURE_NOW + 1)
    with pytest.raises(SyntheticInputError, match="not trusted"):
        verify_receipt(item, fixture_trust(), "render", FIXTURE_NOW)


def test_wrong_key_with_trusted_issuer_name_is_refused() -> None:
    forger = TrustRoot("render", fixture_root("render").issuer, fictional_key("x", "forged"))
    item = sign_receipt(forger, "own-0001", CLAIM, FIXTURE_NOW - 1, FIXTURE_NOW + 1)
    with pytest.raises(SyntheticInputError, match="bad signature"):
        verify_receipt(item, fixture_trust(), "render", FIXTURE_NOW)


@pytest.mark.parametrize("change", (
    {"subject": "own-0002"}, {"claim": {**CLAIM, "value": 4}},
    {"issued_at": FIXTURE_NOW - 11}, {"expires_at": FIXTURE_NOW + 91},
))
def test_every_signed_field_is_covered(change: dict[str, object]) -> None:
    item = replace(receipt(), **change)  # type: ignore[arg-type]
    with pytest.raises(SyntheticInputError, match="bad signature"):
        verify_receipt(item, fixture_trust(), "render", FIXTURE_NOW)


def test_signatures_are_domain_separated_by_role() -> None:
    shared = fictional_key("shared")
    render = sign_receipt(TrustRoot("render", "box-a", shared), "s", {}, 0, 10)
    rights = sign_receipt(TrustRoot("rights", "box-a", shared), "s", {}, 0, 10)
    assert render.signature != rights.signature


def test_trust_roots_must_be_independent() -> None:
    key = fictional_key("dup")
    with pytest.raises(SyntheticInputError, match="key"):
        TrustStore([TrustRoot("render", "a", key), TrustRoot("rights", "b", key)])
    with pytest.raises(SyntheticInputError, match="issuer"):
        TrustStore([TrustRoot("render", "a", fictional_key("1")),
                    TrustRoot("rights", "a", fictional_key("2"))])
    with pytest.raises(SyntheticInputError, match="duplicate"):
        TrustStore([fixture_root("render"), fixture_root("render")])


def test_short_keys_and_unknown_roles_are_refused() -> None:
    with pytest.raises(SyntheticInputError):
        TrustRoot("render", "a", b"short")
    with pytest.raises(SyntheticInputError):
        TrustRoot("approval", "a", fictional_key("z"))


def test_keys_are_not_in_repr() -> None:
    root = fixture_root("render")
    assert root.key.hex() not in repr(root)

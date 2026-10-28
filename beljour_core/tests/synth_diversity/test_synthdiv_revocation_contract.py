"""Revocation snapshot contract: epoch, digests, sorted IDs and exact claims.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_provenance_revocation import (
    CLAIM_FIELDS,
    RevocationSnapshot,
    snapshot_from_claim,
)
from lab.synth_diversity.types import SyntheticInputError

BASE = RevocationSnapshot(2, "a" * 64, "b" * 64, ("own-0001", "own-0003"), "c" * 64)


def test_claim_round_trip() -> None:
    assert snapshot_from_claim(BASE.claim()) == BASE
    assert set(BASE.claim()) == CLAIM_FIELDS


@pytest.mark.parametrize("change", (
    {"epoch": 0}, {"epoch": -3}, {"epoch": True}, {"inventory_sha256": "x"},
    {"roster_sha256": "B" * 64}, {"evidence_sha256": ""},
    {"revoked": ("own-0003", "own-0001")}, {"revoked": ("own-0001", "own-0001")},
    {"revoked": ["own-0001"]}, {"revoked": ("Own 1",)},
))
def test_invalid_snapshots_are_refused(change: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        replace(BASE, **change)  # type: ignore[arg-type]


def test_claim_with_extra_or_wrong_kind_is_refused() -> None:
    with pytest.raises(SyntheticInputError):
        snapshot_from_claim({**BASE.claim(), "note": "x"})
    with pytest.raises(SyntheticInputError):
        snapshot_from_claim({**BASE.claim(), "kind": "approval"})
    with pytest.raises(SyntheticInputError):
        snapshot_from_claim({**BASE.claim(), "epoch": 2.0})


def test_empty_revocation_set_is_valid() -> None:
    empty = replace(BASE, revoked=())
    assert snapshot_from_claim(empty.claim()).revoked == ()

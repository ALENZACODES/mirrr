"""Four-bit oracle versus block index, cross-pool receipts and protected dedup.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from lab.synth_diversity.stress_collision_audit import (
    DedupEntry,
    audit_cross_pool,
    audit_index,
    exhaustive_pairs,
    protected_dedup,
)
from lab.synth_diversity.stress_provenance_fixtures import fixture_records, fixture_sketches
from lab.synth_diversity.stress_provenance_overlap import scan_overlap
from lab.synth_diversity.types import SyntheticInputError


def flipped(value: int, bits: tuple[int, ...]) -> int:
    for bit in bits:
        value ^= 1 << bit
    return value


@pytest.mark.parametrize(("bits", "found"), (((1, 2, 3, 4), True), ((1, 2, 3, 4, 5), False)))
def test_oracle_radius_four_inclusive(bits: tuple[int, ...], found: bool) -> None:
    pairs = exhaustive_pairs({"a": 0, "b": flipped(0, bits)})
    assert bool(pairs) is found


@pytest.mark.parametrize("bits", ((12, 13, 25, 26), (0, 63, 38, 39), (51, 52, 12, 13)))
def test_block_boundary_pairs_agree(bits: tuple[int, ...]) -> None:
    audit = audit_index({"a": 0xABCD_EF01_2345_6789, "b": flipped(0xABCD_EF01_2345_6789, bits)})
    assert audit.status == "AGREES" and audit.oracle == 1


@pytest.mark.parametrize("seed", range(8))
def test_index_agrees_with_exhaustive_scan_on_clustered_data(seed: int) -> None:
    rng = np.random.default_rng(seed)
    centres = [int(rng.integers(0, 2**63)) for _ in range(5)]
    sketches = {}
    for index in range(150):
        value = centres[index % 5]
        for bit in rng.choice(64, size=int(rng.integers(0, 7)), replace=False):
            value ^= 1 << int(bit)
        sketches[f"item-{index:03d}"] = value
    audit = audit_index(sketches)
    assert audit.oracle > 0
    assert audit.to_dict()["status"] == "AGREES"


def test_cross_pool_receipt_matches_oracle() -> None:
    sketches = fixture_sketches("own-0002")
    receipt = scan_overlap(fixture_records(), sketches)
    assert audit_cross_pool(fixture_records(), sketches, receipt).status == "AGREES"


def test_receipt_missing_a_match_is_detected() -> None:
    sketches = fixture_sketches("own-0002")
    clean = scan_overlap(fixture_records(), fixture_sketches())
    audit = audit_cross_pool(fixture_records(), sketches, clean)
    assert audit.missed == (("own-0002", "sfhq-0001", 2),)


def test_receipt_with_an_invented_match_is_detected() -> None:
    receipt = scan_overlap(fixture_records(), fixture_sketches())
    forged = replace(receipt, matches=(("own-0001", "research-0001", 0),))
    audit = audit_cross_pool(fixture_records(), fixture_sketches(), forged)
    assert audit.spurious == (("own-0001", "research-0001", 0),)


def test_cross_pool_audit_needs_every_sketch() -> None:
    sketches = fixture_sketches()
    del sketches["own-0001"]
    with pytest.raises(SyntheticInputError):
        audit_cross_pool(fixture_records(), sketches, scan_overlap(
            fixture_records(), fixture_sketches()))


def test_protected_strata_survive_within_slice_dedup() -> None:
    entries = [
        DedupEntry("a", "slice", 0, ("fitzpatrick=III",)),
        DedupEntry("b", "slice", 1, ("fitzpatrick=III",)),
        DedupEntry("c", "slice", 3, ("fitzpatrick=VI", "vitiligo=focal")),
        DedupEntry("d", "other", 0, ("fitzpatrick=III",)),
    ]
    kept, dropped = protected_dedup(entries, {"vitiligo=focal"})
    assert kept == ("a", "c", "d") and dropped == ("b",)
    kept_all, dropped_none = protected_dedup(entries, {"fitzpatrick=III", "vitiligo=focal"})
    assert dropped_none == () and len(kept_all) == 4


def test_oracle_is_bounded() -> None:
    with pytest.raises(SyntheticInputError, match="bounded"):
        exhaustive_pairs({f"k{i}": i for i in range(5_001)})

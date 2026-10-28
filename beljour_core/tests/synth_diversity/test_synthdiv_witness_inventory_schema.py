"""Overlap inventory claim schema: four-bit contract and well-formed matches.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_provenance_fixtures import fixture_records, fixture_sketches
from lab.synth_diversity.stress_provenance_overlap import scan_overlap
from lab.synth_diversity.stress_provenance_witness import overlap_claim, overlap_from_claim
from lab.synth_diversity.types import SyntheticInputError


def claim(contaminate: str | None = "own-0001") -> dict[str, object]:
    return overlap_claim(scan_overlap(fixture_records(), fixture_sketches(contaminate)))


def test_claim_round_trips() -> None:
    scan = scan_overlap(fixture_records(), fixture_sketches("own-0001"))
    assert overlap_from_claim(overlap_claim(scan)) == scan


def test_claim_holds_ids_and_distances_only() -> None:
    data = claim()
    assert set(data) == {"inventory_sha256", "scanned_records", "max_distance", "matches"}
    assert data["matches"] == [["own-0001", "sfhq-0001", 2]]


@pytest.mark.parametrize("change", (
    {"max_distance": 6}, {"max_distance": 3}, {"extra": True},
    {"matches": [["own-0001", "sfhq-0001"]]}, {"matches": "none"},
    {"matches": [["own-0001", "sfhq-0001", "2"]]}, {"scanned_records": "7"},
))
def test_malformed_claims_are_refused(change: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        overlap_from_claim({**claim(), **change})


def test_missing_key_is_refused() -> None:
    data = claim()
    del data["scanned_records"]
    with pytest.raises(SyntheticInputError):
        overlap_from_claim(data)

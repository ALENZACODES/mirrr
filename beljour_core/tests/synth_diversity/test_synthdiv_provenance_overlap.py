"""Cross-pool four-bit matching ignores slices and binds the exact inventory.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_provenance import inventory_digest
from lab.synth_diversity.stress_provenance_fixtures import fixture_records, fixture_sketches
from lab.synth_diversity.stress_provenance_overlap import excluded_lineage, scan_overlap
from lab.synth_diversity.types import SyntheticInputError


def test_separated_sketches_have_no_matches() -> None:
    receipt = scan_overlap(fixture_records(), fixture_sketches())
    assert receipt.matches == ()
    assert receipt.scanned_records == 7
    assert receipt.inventory_sha256 == inventory_digest(fixture_records())


def test_own_render_near_sfhq_is_flagged() -> None:
    receipt = scan_overlap(fixture_records(), fixture_sketches("own-0002"))
    assert receipt.matches == (("own-0002", "sfhq-0001", 2),)
    assert receipt.contaminated == frozenset({"own-0002"})


@pytest.mark.parametrize(("bits", "flagged"), ((4, True), (5, False)))
def test_four_bits_inclusive_five_excluded(bits: int, flagged: bool) -> None:
    sketches = fixture_sketches()
    sketches["own-0001"] = sketches["research-0002"] ^ ((1 << bits) - 1)
    receipt = scan_overlap(fixture_records(), sketches)
    assert bool(receipt.matches) is flagged


def test_restricted_records_matching_each_other_are_not_own_contamination() -> None:
    sketches = fixture_sketches()
    sketches["sfhq-0002"] = sketches["research-0001"]
    assert scan_overlap(fixture_records(), sketches).matches == ()


def test_own_records_matching_each_other_are_not_flagged() -> None:
    sketches = fixture_sketches()
    sketches["own-0002"] = sketches["own-0001"]
    assert scan_overlap(fixture_records(), sketches).matches == ()


def test_one_own_record_can_match_several_restricted_records() -> None:
    sketches = fixture_sketches()
    sketches["sfhq-0002"] = sketches["sfhq-0001"] ^ 1
    sketches["own-0003"] = sketches["sfhq-0001"]
    receipt = scan_overlap(fixture_records(), sketches)
    assert receipt.matches == (("own-0003", "sfhq-0001", 0), ("own-0003", "sfhq-0002", 1))


def test_missing_or_extra_sketch_is_refused() -> None:
    sketches = fixture_sketches()
    del sketches["research-0002"]
    with pytest.raises(SyntheticInputError, match="exactly one sketch"):
        scan_overlap(fixture_records(), sketches)
    with pytest.raises(SyntheticInputError):
        scan_overlap(fixture_records(), {**fixture_sketches(), "own-9999": 1})


def test_receipt_carries_no_sketch_values() -> None:
    sketches = fixture_sketches("own-0001")
    text = str(scan_overlap(fixture_records(), sketches).to_dict())
    assert all(str(value) not in text for value in sketches.values())


def test_descendants_of_contaminated_records_are_excluded() -> None:
    table = {record.record_id: record for record in fixture_records()}
    assert excluded_lineage(table, {"own-0001"}) == frozenset({"own-0001", "own-0003"})
    assert excluded_lineage(table, {"own-0003"}) == frozenset({"own-0003"})

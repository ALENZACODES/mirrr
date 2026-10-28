"""Witness-row contract: subjects, roles, rights placement and exact encoding.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_provenance_fixtures import fixture_records
from lab.synth_diversity.stress_provenance_stream_contract import (
    ROW_FIELDS,
    WitnessRow,
    row_from_dict,
)
from lab.synth_diversity.stress_provenance_witness_fixtures import fixture_witness_receipts
from lab.synth_diversity.types import SyntheticInputError

RECEIPTS = {(item.role, item.subject): item for item in fixture_witness_receipts()}
OWN, SFHQ = fixture_records()[0], fixture_records()[5]


def own_row() -> WitnessRow:
    return WitnessRow("own-render-0000", OWN, RECEIPTS[("render", OWN.record_id)],
                      RECEIPTS[("rights", OWN.record_id)])


def test_round_trip_is_exact() -> None:
    row = own_row()
    assert row_from_dict(row.to_row()) == row
    assert set(row.to_row()) == ROW_FIELDS
    sfhq = WitnessRow("sfhq-0000", SFHQ, RECEIPTS[("render", SFHQ.record_id)], None)
    assert row_from_dict(sfhq.to_row()).rights is None


def test_render_subject_must_match_record() -> None:
    with pytest.raises(SyntheticInputError, match="subject"):
        WitnessRow("s", OWN, RECEIPTS[("render", "own-0002")], RECEIPTS[("rights", "own-0001")])


def test_rights_receipt_is_required_for_originals_only() -> None:
    with pytest.raises(SyntheticInputError, match="own-render rows only"):
        WitnessRow("s", OWN, RECEIPTS[("render", OWN.record_id)], None)
    with pytest.raises(SyntheticInputError, match="own-render rows only"):
        WitnessRow("s", SFHQ, RECEIPTS[("render", SFHQ.record_id)],
                   RECEIPTS[("rights", "own-0001")])


def test_roles_cannot_be_swapped() -> None:
    with pytest.raises(SyntheticInputError, match="render receipt"):
        WitnessRow("s", OWN, RECEIPTS[("rights", OWN.record_id)],
                   RECEIPTS[("rights", OWN.record_id)])
    with pytest.raises(SyntheticInputError, match="role or subject"):
        WitnessRow("s", OWN, RECEIPTS[("render", OWN.record_id)],
                   RECEIPTS[("render", OWN.record_id)])


def test_foreign_fields_and_formats_are_refused() -> None:
    row = own_row().to_row()
    with pytest.raises(SyntheticInputError):
        row_from_dict({**row, "image_bytes": "x"})
    with pytest.raises(SyntheticInputError):
        row_from_dict({**row, "format": 9})
    with pytest.raises(SyntheticInputError):
        row_from_dict({**row, "shard_id": "Bad Shard"})


def test_row_digest_changes_with_any_field() -> None:
    row = own_row()
    other = WitnessRow("own-render-0001", OWN, row.render, row.rights)
    assert row.digest != other.digest

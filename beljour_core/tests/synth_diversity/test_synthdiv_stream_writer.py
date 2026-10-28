"""Stream writer: two files, signed header, strict ordering and no overwrite.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_fixtures import FIXTURE_NOW, fixture_records
from lab.synth_diversity.stress_provenance_stream_contract import WitnessRow
from lab.synth_diversity.stress_provenance_stream_fixtures import shard_layout, stream_rows
from lab.synth_diversity.stress_provenance_stream_io import (
    STREAM_HEADER,
    STREAM_ROWS,
    open_stream,
    write_stream,
)
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fixture_root,
    fixture_witness_receipts,
)
from lab.synth_diversity.types import SyntheticInputError

RECORDS = fixture_records()
RECEIPTS = fixture_witness_receipts()
OVERLAP = next(item for item in RECEIPTS if item.role == "overlap")
ROSTER = "1" * 64


def rows() -> list[WitnessRow]:
    return stream_rows(RECORDS, RECEIPTS, shard_layout(RECORDS, 2))


def write(folder: Path, items: list[WitnessRow] | None = None) -> Path:
    return write_stream(folder, rows() if items is None else items, ROSTER, OVERLAP,
                        fixture_root("source"), FIXTURE_NOW - 10, FIXTURE_NOW + 1000)


def test_stream_folder_has_exactly_two_files(tmp_path: Path) -> None:
    write(tmp_path / "s")
    assert sorted(child.name for child in (tmp_path / "s").iterdir()) == sorted(
        [STREAM_ROWS, STREAM_HEADER])


def test_header_binds_counts_bounds_and_roster(tmp_path: Path) -> None:
    write(tmp_path / "s")
    header = open_stream(tmp_path / "s")
    assert header.rows == 7
    assert (header.first_record_id, header.last_record_id) == ("own-0001", "sfhq-0002")
    assert header.roster_sha256 == ROSTER
    assert header.source.role == "source" and header.source.claim == header.claim()


def test_rows_must_be_strictly_increasing(tmp_path: Path) -> None:
    items = rows()
    with pytest.raises(SyntheticInputError, match="increasing"):
        write(tmp_path / "s", [items[1], items[0]])
    with pytest.raises(SyntheticInputError, match="increasing"):
        write(tmp_path / "t", [items[0], items[0]])
    assert not (tmp_path / "s").exists()


def test_existing_folder_is_never_replaced(tmp_path: Path) -> None:
    write(tmp_path / "s")
    with pytest.raises(SyntheticInputError):
        write(tmp_path / "s")


def test_signer_must_have_source_role(tmp_path: Path) -> None:
    with pytest.raises(SyntheticInputError, match="source-role"):
        write_stream(tmp_path / "s", rows(), ROSTER, OVERLAP, fixture_root("render"),
                     FIXTURE_NOW, FIXTURE_NOW + 10)


def test_overlap_receipt_is_required(tmp_path: Path) -> None:
    render = next(item for item in RECEIPTS if item.role == "render")
    with pytest.raises(SyntheticInputError, match="overlap"):
        write_stream(tmp_path / "s", rows(), ROSTER, render, fixture_root("source"),
                     FIXTURE_NOW, FIXTURE_NOW + 10)


def test_repository_destination_is_refused() -> None:
    inside = Path(__file__).resolve().parent / "stream-should-not-exist"
    with pytest.raises(SyntheticInputError, match="repo"):
        write(inside)
    assert not inside.exists()


def test_empty_stream_is_representable(tmp_path: Path) -> None:
    write(tmp_path / "s", [])
    header = open_stream(tmp_path / "s")
    assert header.rows == 0 and header.first_record_id is None

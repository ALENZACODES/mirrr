"""Stream reader: rows replay exactly and counts, order and digest are enforced.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_stream_fixtures import (
    build_world,
    shard_layout,
    stream_rows,
)
from lab.synth_diversity.stress_provenance_stream_io import iter_stream, open_stream
from lab.synth_diversity.stress_provenance_witness_fixtures import fixture_witness_receipts
from lab.synth_diversity.types import SyntheticInputError


def test_rows_replay_in_order(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    header = open_stream(world.stream)
    rows = list(iter_stream(world.stream, header))
    expected = stream_rows(world.records, fixture_witness_receipts(),
                           shard_layout(world.records, 2))
    assert rows == expected


def test_header_with_fewer_rows_than_file_fails(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    header = replace(open_stream(world.stream), rows=3)
    with pytest.raises(SyntheticInputError, match="more rows"):
        list(iter_stream(world.stream, header))


def test_header_with_more_rows_than_file_fails(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    header = replace(open_stream(world.stream), rows=9)
    with pytest.raises(SyntheticInputError, match="count"):
        list(iter_stream(world.stream, header))


def test_wrong_first_or_last_record_fails(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    header = open_stream(world.stream)
    with pytest.raises(SyntheticInputError, match="first record"):
        list(iter_stream(world.stream, replace(header, first_record_id="own-0002")))
    with pytest.raises(SyntheticInputError, match="last record"):
        list(iter_stream(world.stream, replace(header, last_record_id="sfhq-0001")))


def test_digest_mismatch_during_read_fails(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    header = replace(open_stream(world.stream), sha256="0" * 64)
    with pytest.raises(SyntheticInputError, match="changed while"):
        list(iter_stream(world.stream, header))

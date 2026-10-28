"""Edited, truncated, noncanonical, replayed or oversized journal lines fail closed.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_cursor_journal import MAX_ENTRY_BYTES, CursorJournal
from lab.synth_diversity.stress_provenance_cursor_plan import plan_cursor
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.types import SyntheticInputError


def journal(tmp_path: Path) -> CursorJournal:
    cursor = plan_cursor(build_world(tmp_path / "w").stream, 2)
    (tmp_path / "j").mkdir()
    item = CursorJournal(tmp_path / "j", cursor)
    item.append(0, cursor.ranges[0].sha256)
    item.append(1, cursor.ranges[1].sha256)
    return item


def lines(item: CursorJournal) -> list[bytes]:
    return item.path.read_bytes().splitlines(keepends=True)


def test_edited_field_breaks_entry_digest(tmp_path: Path) -> None:
    item = journal(tmp_path)
    rows = lines(item)
    data = json.loads(rows[1])
    data["range_index"] = 0
    rows[1] = (json.dumps(data, sort_keys=True, separators=(",", ":")) + "\n").encode()
    item.path.write_bytes(b"".join(rows))
    with pytest.raises(SyntheticInputError, match="digest or encoding"):
        item.entries()


def test_truncated_last_line_fails(tmp_path: Path) -> None:
    item = journal(tmp_path)
    item.path.write_bytes(item.path.read_bytes()[:-7])
    with pytest.raises(SyntheticInputError, match="truncated"):
        item.entries()


def test_replayed_line_fails(tmp_path: Path) -> None:
    item = journal(tmp_path)
    rows = lines(item)
    item.path.write_bytes(b"".join([*rows, rows[1]]))
    with pytest.raises(SyntheticInputError, match="gap, replay"):
        item.entries()


def test_noncanonical_line_fails(tmp_path: Path) -> None:
    item = journal(tmp_path)
    rows = lines(item)
    rows[0] = (json.dumps(json.loads(rows[0]), sort_keys=True) + "\n").encode()
    item.path.write_bytes(b"".join(rows))
    with pytest.raises(SyntheticInputError, match="canonical"):
        item.entries()


def test_oversized_line_fails(tmp_path: Path) -> None:
    item = journal(tmp_path)
    item.path.write_bytes(item.path.read_bytes() + b"{" + b" " * MAX_ENTRY_BYTES + b"}\n")
    with pytest.raises(SyntheticInputError, match="oversized"):
        item.entries()


def test_append_refuses_a_tampered_journal(tmp_path: Path) -> None:
    item = journal(tmp_path)
    item.path.write_bytes(lines(item)[1])
    with pytest.raises(SyntheticInputError):
        item.append(2, item.plan.ranges[2].sha256)

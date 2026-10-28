"""Journal chain integrity: a journal from another plan or a broken chain fails.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_cursor_journal import JOURNAL_NAME, CursorJournal
from lab.synth_diversity.stress_provenance_cursor_plan import plan_cursor
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.types import SyntheticInputError


def test_journal_reopened_with_another_plan_fails(tmp_path: Path) -> None:
    stream = build_world(tmp_path / "w").stream
    first = plan_cursor(stream, 3)
    (tmp_path / "j").mkdir()
    CursorJournal(tmp_path / "j", first).append(0, first.ranges[0].sha256)
    other = plan_cursor(stream, 2)
    with pytest.raises(SyntheticInputError, match="different cursor plan"):
        CursorJournal(tmp_path / "j", other).entries()


def test_entries_spliced_from_another_journal_fail(tmp_path: Path) -> None:
    stream = build_world(tmp_path / "w").stream
    cursor = plan_cursor(stream, 2)
    for name in ("a", "b"):
        (tmp_path / name).mkdir()
    a = CursorJournal(tmp_path / "a", cursor)
    a.append(0, cursor.ranges[0].sha256)
    a.append(1, cursor.ranges[1].sha256)
    lines = (tmp_path / "a" / JOURNAL_NAME).read_bytes().splitlines(keepends=True)
    (tmp_path / "b" / JOURNAL_NAME).write_bytes(lines[1])
    with pytest.raises(SyntheticInputError, match="gap"):
        CursorJournal(tmp_path / "b", cursor).entries()


def test_reopened_journal_continues_the_same_chain(tmp_path: Path) -> None:
    cursor = plan_cursor(build_world(tmp_path / "w").stream, 2)
    (tmp_path / "j").mkdir()
    CursorJournal(tmp_path / "j", cursor).append(0, cursor.ranges[0].sha256)
    reopened = CursorJournal(tmp_path / "j", cursor)
    entry = reopened.append(1, cursor.ranges[1].sha256)
    assert entry.previous_sha256 == reopened.entries()[0].digest

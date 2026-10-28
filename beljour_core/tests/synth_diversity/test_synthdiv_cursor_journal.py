"""Cursor journal appends in plan order, chains digests and reports scheduling state.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_cursor_journal import JOURNAL_NAME, CursorJournal
from lab.synth_diversity.stress_provenance_cursor_plan import CursorPlan, plan_cursor
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.types import SyntheticInputError


def plan(tmp_path: Path) -> CursorPlan:
    return plan_cursor(build_world(tmp_path / "w").stream, 3)


def test_entries_chain_from_the_plan_digest(tmp_path: Path) -> None:
    cursor = plan(tmp_path)
    (tmp_path / "j").mkdir()
    journal = CursorJournal(tmp_path / "j", cursor)
    first = journal.append(0, cursor.ranges[0].sha256)
    second = journal.append(1, cursor.ranges[1].sha256)
    assert first.previous_sha256 == cursor.digest
    assert second.previous_sha256 == first.digest
    assert journal.entries() == (first, second)


def test_state_is_scheduling_only(tmp_path: Path) -> None:
    cursor = plan(tmp_path)
    (tmp_path / "j").mkdir()
    journal = CursorJournal(tmp_path / "j", cursor)
    for item in cursor.ranges:
        journal.append(item.index, item.sha256)
    state = journal.state()
    assert state["finished"] is True and state["completed_ranges"] == 3
    assert state["authorization"] == "SCHEDULING_ONLY_NOT_TRAINING_OR_RIGHTS"


def test_out_of_order_and_duplicate_appends_are_refused(tmp_path: Path) -> None:
    cursor = plan(tmp_path)
    (tmp_path / "j").mkdir()
    journal = CursorJournal(tmp_path / "j", cursor)
    with pytest.raises(SyntheticInputError, match="gap"):
        journal.append(1, cursor.ranges[1].sha256)
    journal.append(0, cursor.ranges[0].sha256)
    with pytest.raises(SyntheticInputError, match="gap"):
        journal.append(0, cursor.ranges[0].sha256)
    assert len(journal.entries()) == 1


def test_wrong_range_digest_is_refused(tmp_path: Path) -> None:
    cursor = plan(tmp_path)
    (tmp_path / "j").mkdir()
    with pytest.raises(SyntheticInputError, match="range digest"):
        CursorJournal(tmp_path / "j", cursor).append(0, "0" * 64)


def test_append_after_finish_is_refused(tmp_path: Path) -> None:
    cursor = plan(tmp_path)
    (tmp_path / "j").mkdir()
    journal = CursorJournal(tmp_path / "j", cursor)
    for item in cursor.ranges:
        journal.append(item.index, item.sha256)
    with pytest.raises(SyntheticInputError, match="more entries"):
        journal.append(3, cursor.ranges[0].sha256)


def test_empty_journal_has_no_entries_and_no_file(tmp_path: Path) -> None:
    (tmp_path / "j").mkdir()
    journal = CursorJournal(tmp_path / "j", plan(tmp_path))
    assert journal.entries() == ()
    assert not (tmp_path / "j" / JOURNAL_NAME).exists()

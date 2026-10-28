"""After a crash the journal resumes exactly; a restart still re-verifies the stream.
Author: John Khan.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_cursor_journal import CursorJournal
from lab.synth_diversity.stress_provenance_cursor_plan import check_plan, plan_cursor
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_io import STREAM_ROWS
from lab.synth_diversity.types import SyntheticInputError


def test_crash_before_fsync_records_nothing(tmp_path: Path,
                                            monkeypatch: pytest.MonkeyPatch) -> None:
    cursor = plan_cursor(build_world(tmp_path / "w").stream, 2)
    (tmp_path / "j").mkdir()
    journal = CursorJournal(tmp_path / "j", cursor)
    journal.append(0, cursor.ranges[0].sha256)

    def crash(data: int, payload: bytes) -> int:
        raise OSError("simulated crash")

    monkeypatch.setattr(os, "write", crash)
    with pytest.raises(OSError):
        journal.append(1, cursor.ranges[1].sha256)
    monkeypatch.undo()
    assert len(journal.entries()) == 1
    journal.append(1, cursor.ranges[1].sha256)
    assert journal.state()["completed_ranges"] == 2


def test_resume_point_is_the_next_planned_range(tmp_path: Path) -> None:
    cursor = plan_cursor(build_world(tmp_path / "w").stream, 3)
    (tmp_path / "j").mkdir()
    CursorJournal(tmp_path / "j", cursor).append(0, cursor.ranges[0].sha256)
    resumed = CursorJournal(tmp_path / "j", cursor)
    next_index = len(resumed.entries())
    assert next_index == 1
    resumed.append(next_index, cursor.ranges[next_index].sha256)


def test_restart_against_a_changed_stream_is_detected(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    cursor = plan_cursor(world.stream, 2)
    rows = world.stream / STREAM_ROWS
    rows.write_bytes(rows.read_bytes().replace(b"run-sfhq", b"run-sfhz", 1))
    with pytest.raises(SyntheticInputError):
        check_plan(world.stream, cursor)

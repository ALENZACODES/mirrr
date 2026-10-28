"""Journal location rules: no repository paths, no symlinked folders or files.
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
    return plan_cursor(build_world(tmp_path / "w").stream, 4)


def test_repository_folder_is_refused(tmp_path: Path) -> None:
    with pytest.raises(SyntheticInputError, match="repo"):
        CursorJournal(Path(__file__).resolve().parent, plan(tmp_path))


def test_missing_or_symlinked_folder_is_refused(tmp_path: Path) -> None:
    cursor = plan(tmp_path)
    with pytest.raises(SyntheticInputError):
        CursorJournal(tmp_path / "absent", cursor)
    (tmp_path / "real").mkdir()
    (tmp_path / "alias").symlink_to(tmp_path / "real")
    with pytest.raises(SyntheticInputError):
        CursorJournal(tmp_path / "alias", cursor)


def test_symlinked_journal_file_is_refused_for_read_and_append(tmp_path: Path) -> None:
    cursor = plan(tmp_path)
    (tmp_path / "j").mkdir()
    (tmp_path / "j" / JOURNAL_NAME).symlink_to(tmp_path / "redirected.jsonl")
    journal = CursorJournal(tmp_path / "j", cursor)
    with pytest.raises(SyntheticInputError, match="symlink"):
        journal.entries()
    with pytest.raises(SyntheticInputError):
        journal.append(0, cursor.ranges[0].sha256)
    assert not (tmp_path / "redirected.jsonl").exists()


def test_journal_file_is_private(tmp_path: Path) -> None:
    cursor = plan(tmp_path)
    (tmp_path / "j").mkdir()
    journal = CursorJournal(tmp_path / "j", cursor)
    journal.append(0, cursor.ranges[0].sha256)
    assert journal.path.stat().st_mode & 0o077 == 0

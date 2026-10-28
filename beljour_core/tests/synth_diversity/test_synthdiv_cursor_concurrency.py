"""Exclusive process locking: a second writer is refused while the lock is held.
Author: John Khan.
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_cursor_journal import LOCK_NAME, CursorJournal
from lab.synth_diversity.stress_provenance_cursor_plan import plan_cursor
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.types import SyntheticInputError

HOLDER = textwrap.dedent("""
    import fcntl, os, sys
    handle = os.open(sys.argv[1], os.O_CREAT | os.O_RDWR, 0o600)
    fcntl.flock(handle, fcntl.LOCK_EX)
    print("locked", flush=True)
    sys.stdin.readline()
""")


def test_lock_held_by_another_process_blocks_append(tmp_path: Path) -> None:
    cursor = plan_cursor(build_world(tmp_path / "w").stream, 2)
    (tmp_path / "j").mkdir()
    journal = CursorJournal(tmp_path / "j", cursor)
    holder = subprocess.Popen([sys.executable, "-c", HOLDER, str(tmp_path / "j" / LOCK_NAME)],
                              stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    try:
        assert holder.stdout is not None and holder.stdout.readline().strip() == "locked"
        with pytest.raises(SyntheticInputError, match="another process"):
            journal.append(0, cursor.ranges[0].sha256)
        assert journal.entries() == ()
    finally:
        assert holder.stdin is not None
        holder.stdin.write("\n")
        holder.stdin.flush()
        holder.wait(timeout=30)
    journal.append(0, cursor.ranges[0].sha256)
    assert len(journal.entries()) == 1


def test_nested_writer_in_same_process_is_refused(tmp_path: Path) -> None:
    cursor = plan_cursor(build_world(tmp_path / "w").stream, 2)
    (tmp_path / "j").mkdir()
    first = CursorJournal(tmp_path / "j", cursor)
    second = CursorJournal(tmp_path / "j", cursor)
    with first.locked():
        with pytest.raises(SyntheticInputError, match="another process"):
            second.append(0, cursor.ranges[0].sha256)
    second.append(0, cursor.ranges[0].sha256)

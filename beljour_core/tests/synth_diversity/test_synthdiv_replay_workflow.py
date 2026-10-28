"""Replay workflow: stream admission, cursor journal and revocation filtering.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from lab.synth_diversity.stress_provenance_cursor_journal import CursorJournal
from lab.synth_diversity.stress_provenance_cursor_plan import check_plan, plan_cursor
from lab.synth_diversity.stress_provenance_fixtures import fixture_sketches
from lab.synth_diversity.stress_provenance_replay_fixtures import (
    admitted,
    signed_snapshot,
    world_inventory,
)
from lab.synth_diversity.stress_provenance_revocation_release import (
    iter_allowlist,
    release_filtered,
)
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world


def test_scheduled_replay_then_revocation(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w", sketches=fixture_sketches("own-0003"))
    cursor = plan_cursor(world.stream, 3)
    (tmp_path / "journal").mkdir()
    journal = CursorJournal(tmp_path / "journal", cursor)
    for item in cursor.ranges[:2]:
        journal.append(item.index, item.sha256)
    resumed = CursorJournal(tmp_path / "journal", cursor)
    check_plan(world.stream, cursor)
    for item in cursor.ranges[len(resumed.entries()):]:
        resumed.append(item.index, item.sha256)
    assert resumed.state()["finished"] is True
    path, summary = admitted(world, tmp_path / "admitted")
    assert list(iter_allowlist(path)) == ["own-0001", "own-0002"]
    result = release_filtered(path, summary.allowlist_sha256,
                              signed_snapshot(world, ("own-0001",), epoch=7), world.trust,
                              world.now, 7, world_inventory(world), world.roster.digest,
                              tmp_path / "released.jsonl")
    assert list(iter_allowlist(tmp_path / "released.jsonl")) == ["own-0002"]
    assert result.epoch == 7

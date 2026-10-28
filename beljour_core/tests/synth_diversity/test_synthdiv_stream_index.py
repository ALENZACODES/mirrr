"""Private SQLite index: uniqueness, pool isolation, lineage and cleanup.
Author: John Khan.
"""

from __future__ import annotations

import os
import stat
from dataclasses import replace
from pathlib import Path

import pytest

import lab.synth_diversity.stress_provenance_stream_verify as stream_verify
from lab.synth_diversity.stress_provenance import POOLS, ProvenanceRecord
from lab.synth_diversity.stress_provenance_fixtures import fixture_records, with_parent
from lab.synth_diversity.stress_provenance_ledger import read_shard, write_shard
from lab.synth_diversity.stress_provenance_roster import ShardRoster, build_roster
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_verify import (
    check_index_lineage,
    index_shards,
    open_index,
    verify_and_export,
)
from lab.synth_diversity.types import SyntheticInputError


def ledger(root: Path, groups: list[list[ProvenanceRecord]]) -> ShardRoster:
    shards = [read_shard(write_shard(root, f"part-{index}", group))
              for index, group in enumerate(groups)]
    totals = dict.fromkeys(POOLS, 0)
    for group in groups:
        totals[group[0].pool] += len(group)
    return build_roster(shards, totals)


def by_pool(records: list[ProvenanceRecord]) -> list[list[ProvenanceRecord]]:
    return [[r for r in records if r.pool == pool] for pool in POOLS
            if any(r.pool == pool for r in records)]


def index(tmp_path: Path, records: list[ProvenanceRecord]) -> None:
    roster = ledger(tmp_path / "ledger", by_pool(records))
    db = open_index(tmp_path / "index.sqlite3")
    try:
        index_shards(db, roster, tmp_path / "ledger")
        check_index_lineage(db)
    finally:
        db.close()


def test_clean_fixture_indexes(tmp_path: Path) -> None:
    index(tmp_path, list(fixture_records()))


def test_duplicate_content_across_shards_is_refused(tmp_path: Path) -> None:
    records = list(fixture_records())
    records[5] = replace(records[5], content_sha256=records[0].content_sha256)
    with pytest.raises(SyntheticInputError, match="duplicate"):
        index(tmp_path, records)


def test_generator_run_shared_across_pools_is_refused(tmp_path: Path) -> None:
    records = list(fixture_records())
    records[3] = replace(records[3], generator_run="run-own-a")
    with pytest.raises(SyntheticInputError, match="shared across pools"):
        index(tmp_path, records)


def test_cross_pool_parent_is_refused(tmp_path: Path) -> None:
    records = list(fixture_records())
    records[1] = with_parent(records[1], "sfhq-0001")
    with pytest.raises(SyntheticInputError, match="cross-pool"):
        index(tmp_path, records)


def test_cycle_across_shards_is_refused(tmp_path: Path) -> None:
    own = [r for r in fixture_records() if r.pool == "own_render"]
    own[0] = with_parent(own[0], "own-0003")
    roster = ledger(tmp_path / "ledger", [own[:1], own[1:]])
    db = open_index(tmp_path / "index.sqlite3")
    try:
        index_shards(db, roster, tmp_path / "ledger")
        with pytest.raises(SyntheticInputError, match="cycle"):
            check_index_lineage(db)
    finally:
        db.close()


def test_index_database_must_be_new(tmp_path: Path) -> None:
    (tmp_path / "index.sqlite3").write_bytes(b"")
    with pytest.raises(SyntheticInputError):
        open_index(tmp_path / "index.sqlite3")


def test_workspace_is_private_and_removed(tmp_path: Path,
                                          monkeypatch: pytest.MonkeyPatch) -> None:
    world = build_world(tmp_path / "w")
    (tmp_path / "work").mkdir()
    modes: list[int] = []
    original = stream_verify._private_workdir

    def spy(parent: Path | None) -> Path:
        folder = original(parent)
        modes.append(stat.S_IMODE(os.stat(folder).st_mode))
        return folder

    monkeypatch.setattr(stream_verify, "_private_workdir", spy)
    verify_and_export(world.roster, world.ledger, world.stream, world.trust, world.registry,
                      world.now, tmp_path / "allow.jsonl", tmp_path / "work")
    assert modes == [0o700]
    assert list((tmp_path / "work").iterdir()) == []

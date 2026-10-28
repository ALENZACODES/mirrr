"""Frozen shard rosters: build, publish, reload and reconcile against the ledger.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_fixtures import fixture_records
from lab.synth_diversity.stress_provenance_ledger import RECORDS_NAME, read_shard, write_shard
from lab.synth_diversity.stress_provenance_roster import (
    ROSTER_NAME,
    ShardRoster,
    build_roster,
    load_roster,
    reconcile_roster,
    write_roster,
)
from lab.synth_diversity.types import SyntheticInputError

TOTALS = {"own_render": 3, "sfhq": 2, "research_test": 2, "quarantine": 0}


def ledger(root: Path) -> ShardRoster:
    shards = []
    for pool in ("own_render", "sfhq", "research_test"):
        rows = [record for record in fixture_records() if record.pool == pool]
        shards.append(read_shard(write_shard(root, f"{pool}-1", rows)))
    return build_roster(shards, TOTALS)


def test_roster_round_trip(tmp_path: Path) -> None:
    roster = ledger(tmp_path / "ledger")
    path = write_roster(tmp_path / "roster", roster)
    assert path.name == ROSTER_NAME
    assert load_roster(tmp_path / "roster") == roster
    assert load_roster(tmp_path / "roster").digest == roster.digest


def test_reconcile_returns_every_verified_shard(tmp_path: Path) -> None:
    roster = ledger(tmp_path / "ledger")
    shards = reconcile_roster(roster, tmp_path / "ledger")
    assert sum(len(shard.records) for shard in shards) == 7


def test_planned_totals_must_equal_shard_counts(tmp_path: Path) -> None:
    roster = ledger(tmp_path / "ledger")
    with pytest.raises(SyntheticInputError, match="planned totals"):
        ShardRoster(roster.entries, {**TOTALS, "sfhq": 3})


def test_missing_shard_fails(tmp_path: Path) -> None:
    roster = ledger(tmp_path / "ledger")
    target = tmp_path / "ledger" / "sfhq" / "sfhq-1"
    for child in target.iterdir():
        child.unlink()
    target.rmdir()
    with pytest.raises(SyntheticInputError, match="missing"):
        reconcile_roster(roster, tmp_path / "ledger")


def test_extra_shard_fails(tmp_path: Path) -> None:
    roster = ledger(tmp_path / "ledger")
    extra = replace(fixture_records()[0], record_id="own-0100", content_sha256="3" * 64)
    write_shard(tmp_path / "ledger", "own_render-2", [extra])
    with pytest.raises(SyntheticInputError, match="not in frozen roster"):
        reconcile_roster(roster, tmp_path / "ledger")


def test_rewritten_shard_with_same_name_fails(tmp_path: Path) -> None:
    roster = ledger(tmp_path / "ledger")
    target = tmp_path / "ledger" / "research_test" / "research_test-1"
    for child in target.iterdir():
        child.unlink()
    target.rmdir()
    rows = [record for record in fixture_records() if record.pool == "research_test"]
    write_shard(tmp_path / "ledger", "research_test-1", rows[:1])
    with pytest.raises(SyntheticInputError, match="roster entry"):
        reconcile_roster(roster, tmp_path / "ledger")


def test_tampered_shard_bytes_fail(tmp_path: Path) -> None:
    roster = ledger(tmp_path / "ledger")
    rows = tmp_path / "ledger" / "own_render" / "own_render-1" / RECORDS_NAME
    rows.write_bytes(rows.read_bytes().replace(b"own-0002", b"own-0009"))
    with pytest.raises(SyntheticInputError):
        reconcile_roster(roster, tmp_path / "ledger")


def test_edited_roster_file_is_refused(tmp_path: Path) -> None:
    write_roster(tmp_path / "roster", ledger(tmp_path / "ledger"))
    path = tmp_path / "roster" / ROSTER_NAME
    data = json.loads(path.read_text())
    data["planned_totals"]["quarantine"] = 1
    path.write_text(json.dumps(data, sort_keys=True, separators=(",", ":")) + "\n")
    with pytest.raises(SyntheticInputError):
        load_roster(tmp_path / "roster")


def test_roster_is_never_overwritten(tmp_path: Path) -> None:
    roster = ledger(tmp_path / "ledger")
    write_roster(tmp_path / "roster", roster)
    with pytest.raises(SyntheticInputError):
        write_roster(tmp_path / "roster", roster)

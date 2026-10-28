"""Admission from actual on-disk shards reconciled against a frozen roster.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_admission import AdmissionResult, admit
from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
)
from lab.synth_diversity.stress_provenance_ledger import RECORDS_NAME, read_shard, write_shard
from lab.synth_diversity.stress_provenance_roster import ShardRoster, build_roster
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fixture_trust,
    fixture_witness_receipts,
)
from lab.synth_diversity.types import SyntheticInputError

TOTALS = {"own_render": 3, "sfhq": 2, "research_test": 2, "quarantine": 0}


def ledger(root: Path) -> ShardRoster:
    shards = [read_shard(write_shard(root, f"{pool}-1",
                                     [r for r in fixture_records() if r.pool == pool]))
              for pool in ("own_render", "sfhq", "research_test")]
    return build_roster(shards, TOTALS)


def run(roster: ShardRoster, root: Path) -> AdmissionResult:
    return admit(roster, root, fixture_witness_receipts(), fixture_trust(),
                 fixture_approvals(), FIXTURE_NOW)


def test_admission_from_verified_shards(tmp_path: Path) -> None:
    roster = ledger(tmp_path)
    result = run(roster, tmp_path)
    assert result.allowlist == ("own-0001", "own-0002", "own-0003")
    assert result.roster_sha256 == roster.digest
    assert sum(result.by_pool.values()) == 7


def test_tampered_shard_on_disk_fails(tmp_path: Path) -> None:
    roster = ledger(tmp_path)
    rows = tmp_path / "sfhq" / "sfhq-1" / RECORDS_NAME
    rows.write_bytes(rows.read_bytes().replace(b"sfhq-0002", b"sfhq-0003"))
    with pytest.raises(SyntheticInputError):
        run(roster, tmp_path)


def test_unrostered_shard_fails(tmp_path: Path) -> None:
    roster = ledger(tmp_path)
    extra = replace(fixture_records()[0], record_id="own-0500", content_sha256="6" * 64)
    write_shard(tmp_path, "own_render-9", [extra])
    with pytest.raises(SyntheticInputError, match="not in frozen roster"):
        run(roster, tmp_path)


def test_omitted_restricted_shard_fails(tmp_path: Path) -> None:
    roster = ledger(tmp_path)
    shard = tmp_path / "research_test" / "research_test-1"
    for child in shard.iterdir():
        child.unlink()
    shard.rmdir()
    with pytest.raises(SyntheticInputError, match="missing"):
        run(roster, tmp_path)


def test_roster_object_is_required(tmp_path: Path) -> None:
    ledger(tmp_path)
    with pytest.raises(SyntheticInputError):
        admit(None, tmp_path, [], fixture_trust(), fixture_approvals(),  # type: ignore[arg-type]
              FIXTURE_NOW)

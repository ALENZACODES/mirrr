"""Observed counts by class with SQLite cross-shard uniqueness and lineage checks.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_counts import PROGRAMME_CAPACITY, count_shards
from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
)
from lab.synth_diversity.stress_provenance_ledger import discover_shards, write_shard
from lab.synth_diversity.types import SyntheticInputError


def ledger(root: Path) -> list[Path]:
    for name in ("own_render", "sfhq", "research_test"):
        write_shard(root, f"{name}-1", [r for r in fixture_records() if r.pool == name])
    return discover_shards(root)


def test_fixture_counts_by_class_pool_and_generator(tmp_path: Path) -> None:
    counts = count_shards(ledger(tmp_path), None, FIXTURE_NOW).to_dict()
    assert counts["observed_total"] == 7
    assert counts["by_source_class"] == {"original_3d": 3, "research": 2, "sfhq": 2}
    assert counts["by_generator"] == {"beljour-3d": 3, "lab-capture": 2, "sfhq-generator": 2}
    assert counts["by_disposition"]["TRAIN_ELIGIBLE"] == 0
    assert counts["by_disposition"]["REVIEW_REQUIRED"] == 3
    assert counts["programme_capacity"] == PROGRAMME_CAPACITY
    assert counts["capacity_is_not_an_observed_count"] is True


def test_approvals_change_only_own_render_dispositions(tmp_path: Path) -> None:
    counts = count_shards(ledger(tmp_path), fixture_approvals(), FIXTURE_NOW).to_dict()
    assert counts["by_disposition"]["TRAIN_ELIGIBLE"] == 3
    assert counts["by_disposition"]["EXPERIMENTS_ONLY"] == 2
    assert counts["by_disposition"]["TEST_ONLY"] == 2


def test_duplicate_id_across_shards_is_refused(tmp_path: Path) -> None:
    shards = ledger(tmp_path)
    own = [r for r in fixture_records() if r.pool == "own_render"]
    copy = replace(own[0], content_sha256="1" * 64)
    write_shard(tmp_path, "own_render-2", [copy])
    with pytest.raises(SyntheticInputError, match="duplicate"):
        count_shards([*shards, tmp_path / "own_render" / "own_render-2"], None, FIXTURE_NOW)


def test_duplicate_content_across_shards_is_refused(tmp_path: Path) -> None:
    shards = ledger(tmp_path)
    own = [r for r in fixture_records() if r.pool == "own_render"]
    copy = replace(own[0], record_id="own-0099")
    write_shard(tmp_path, "own_render-2", [copy])
    with pytest.raises(SyntheticInputError, match="duplicate"):
        count_shards([*shards, tmp_path / "own_render" / "own_render-2"], None, FIXTURE_NOW)


def test_parent_in_another_shard_of_same_pool_is_accepted(tmp_path: Path) -> None:
    own = [r for r in fixture_records() if r.pool == "own_render"]
    write_shard(tmp_path, "a", own[:1])
    write_shard(tmp_path, "b", own[1:])
    counts = count_shards(discover_shards(tmp_path), None, FIXTURE_NOW)
    assert counts.total == 3


def test_missing_parent_shard_is_detected(tmp_path: Path) -> None:
    own = [r for r in fixture_records() if r.pool == "own_render"]
    write_shard(tmp_path, "b", own[1:])
    with pytest.raises(SyntheticInputError, match="parent"):
        count_shards(discover_shards(tmp_path), None, FIXTURE_NOW)


def test_external_cache_is_used_and_removed(tmp_path: Path) -> None:
    cache = tmp_path / "cache"
    counts = count_shards(ledger(tmp_path / "ledger"), None, FIXTURE_NOW, cache)
    assert counts.total == 7
    assert not cache.exists()


def test_cache_inside_repository_is_refused(tmp_path: Path) -> None:
    inside = Path(__file__).resolve().parent / "cache-should-not-exist"
    with pytest.raises(SyntheticInputError):
        count_shards(ledger(tmp_path), None, FIXTURE_NOW, inside)


def test_same_shard_twice_is_refused(tmp_path: Path) -> None:
    shards = ledger(tmp_path)
    with pytest.raises(SyntheticInputError, match="duplicate"):
        count_shards([*shards, shards[0]], None, FIXTURE_NOW)

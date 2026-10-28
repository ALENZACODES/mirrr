"""Pool-separated shard IO: layout, manifest binding, limits and refusals.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance import ProvenanceRecord
from lab.synth_diversity.stress_provenance_fixtures import fixture_records
from lab.synth_diversity.stress_provenance_ledger import (
    MANIFEST_NAME,
    RECORDS_NAME,
    discover_shards,
    read_shard,
    write_shard,
)
from lab.synth_diversity.types import SyntheticInputError


def pool(name: str) -> list[ProvenanceRecord]:
    return [record for record in fixture_records() if record.pool == name]


def test_shard_layout_is_root_pool_shard(tmp_path: Path) -> None:
    path = write_shard(tmp_path, "shard-0001", pool("own_render"))
    assert path == (tmp_path / "own_render" / "shard-0001").resolve()
    assert sorted(child.name for child in path.iterdir()) == [MANIFEST_NAME, RECORDS_NAME]


def test_round_trip_and_manifest_binding(tmp_path: Path) -> None:
    write_shard(tmp_path, "s1", pool("sfhq"))
    shard = read_shard(tmp_path / "sfhq" / "s1")
    assert shard.records == tuple(pool("sfhq"))
    manifest = shard.manifest
    assert manifest["count"] == 2 and manifest["source_class"] == "sfhq"
    assert manifest["generators"] == ["sfhq-generator"]
    assert manifest["contains_image_data"] is False


def test_rows_hold_metadata_only(tmp_path: Path) -> None:
    write_shard(tmp_path, "s1", pool("own_render"))
    for line in (tmp_path / "own_render" / "s1" / RECORDS_NAME).read_text().splitlines():
        row = json.loads(line)
        assert not {"path", "pixels", "image", "embedding", "sketch"} & set(row)


def test_mixed_pools_cannot_share_a_shard(tmp_path: Path) -> None:
    with pytest.raises(SyntheticInputError, match="one pool"):
        write_shard(tmp_path, "mixed", fixture_records())


def test_records_must_be_sorted_and_unique(tmp_path: Path) -> None:
    records = pool("own_render")
    with pytest.raises(SyntheticInputError, match="sorted"):
        write_shard(tmp_path, "s1", list(reversed(records)))
    with pytest.raises(SyntheticInputError, match="sorted"):
        write_shard(tmp_path, "s2", [records[0], records[0]])


def test_empty_shard_and_bad_ids_are_refused(tmp_path: Path) -> None:
    with pytest.raises(SyntheticInputError):
        write_shard(tmp_path, "s1", [])
    with pytest.raises(SyntheticInputError):
        write_shard(tmp_path, "../escape", pool("sfhq"))


def test_existing_shard_is_never_overwritten(tmp_path: Path) -> None:
    write_shard(tmp_path, "s1", pool("sfhq"))
    before = (tmp_path / "sfhq" / "s1" / RECORDS_NAME).read_bytes()
    with pytest.raises(SyntheticInputError):
        write_shard(tmp_path, "s1", pool("sfhq")[:1])
    assert (tmp_path / "sfhq" / "s1" / RECORDS_NAME).read_bytes() == before


def test_repository_root_is_refused() -> None:
    inside = Path(__file__).resolve().parent / "ledger-should-not-exist"
    with pytest.raises(SyntheticInputError, match="repo"):
        write_shard(inside, "s1", pool("sfhq"))
    assert not inside.exists()


def test_discovery_lists_every_pool_in_stable_order(tmp_path: Path) -> None:
    for name in ("sfhq", "own_render", "research_test"):
        write_shard(tmp_path, f"{name}-a", pool(name))
    found = [(path.parent.name, path.name) for path in discover_shards(tmp_path)]
    assert found == [("own_render", "own_render-a"), ("research_test", "research_test-a"),
                     ("sfhq", "sfhq-a")]


def test_discovery_refuses_unknown_pools_and_links(tmp_path: Path) -> None:
    write_shard(tmp_path, "s1", pool("sfhq"))
    (tmp_path / "public_web").mkdir()
    with pytest.raises(SyntheticInputError, match="unexpected"):
        discover_shards(tmp_path)
    (tmp_path / "public_web").rmdir()
    (tmp_path / "sfhq" / "linked").symlink_to(tmp_path / "sfhq" / "s1")
    with pytest.raises(SyntheticInputError):
        discover_shards(tmp_path)


def test_hidden_staging_folders_are_ignored(tmp_path: Path) -> None:
    write_shard(tmp_path, "s1", pool("sfhq"))
    (tmp_path / "sfhq" / ".s21-ledger-leftover").mkdir()
    assert [path.name for path in discover_shards(tmp_path)] == ["s1"]

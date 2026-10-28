"""Corrupted, relocated, truncated and symlinked shard metadata fails closed.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance import sha256_bytes
from lab.synth_diversity.stress_provenance_fixtures import fixture_records
from lab.synth_diversity.stress_provenance_ledger import (
    MANIFEST_NAME,
    RECORDS_NAME,
    read_shard,
    write_shard,
)
from lab.synth_diversity.types import SyntheticInputError


@pytest.fixture()
def shard(tmp_path: Path) -> Path:
    own = [record for record in fixture_records() if record.pool == "own_render"]
    return write_shard(tmp_path, "s1", own)


def rewrite_manifest(shard: Path, **change: object) -> None:
    path = shard / MANIFEST_NAME
    data = json.loads(path.read_text())
    data.update(change)
    path.write_text(json.dumps(data, sort_keys=True, separators=(",", ":")) + "\n")


def test_edited_row_fails_digest(shard: Path) -> None:
    rows = shard / RECORDS_NAME
    rows.write_bytes(rows.read_bytes().replace(b"rights-own-a", b"rights-own-z", 1))
    with pytest.raises(SyntheticInputError, match="digest"):
        read_shard(shard)


def test_edit_with_recomputed_digest_still_fails_on_row_content(shard: Path) -> None:
    rows = shard / RECORDS_NAME
    data = rows.read_bytes().replace(b'"own_render"', b'"sfhq"', 1)
    rows.write_bytes(data)
    rewrite_manifest(shard, records_sha256=sha256_bytes(data), records_bytes=len(data))
    with pytest.raises(SyntheticInputError):
        read_shard(shard)


def test_injected_training_flag_with_valid_digest_is_refused(shard: Path) -> None:
    rows = shard / RECORDS_NAME
    lines = rows.read_text().splitlines()
    row = json.loads(lines[0])
    row["train_allowed"] = True
    lines[0] = json.dumps(row, sort_keys=True, separators=(",", ":"))
    data = ("\n".join(lines) + "\n").encode()
    rows.write_bytes(data)
    rewrite_manifest(shard, records_sha256=sha256_bytes(data), records_bytes=len(data))
    with pytest.raises(SyntheticInputError, match="inventory"):
        read_shard(shard)


def test_truncated_rows_fail(shard: Path) -> None:
    rows = shard / RECORDS_NAME
    rows.write_bytes(rows.read_bytes()[:-5])
    with pytest.raises(SyntheticInputError):
        read_shard(shard)


@pytest.mark.parametrize("change", (
    {"count": 99}, {"generators": ["other"]}, {"schema": "OTHER"},
    {"contains_image_data": True}, {"source_class": "sfhq"}, {"extra": 1},
))
def test_manifest_edits_are_detected(shard: Path, change: dict[str, object]) -> None:
    rewrite_manifest(shard, **change)
    with pytest.raises(SyntheticInputError):
        read_shard(shard)


def test_noncanonical_manifest_is_refused(shard: Path) -> None:
    path = shard / MANIFEST_NAME
    path.write_text(json.dumps(json.loads(path.read_text()), indent=2) + "\n")
    with pytest.raises(SyntheticInputError, match="canonical"):
        read_shard(shard)


def test_shard_moved_to_another_pool_folder_is_refused(shard: Path, tmp_path: Path) -> None:
    (tmp_path / "sfhq").mkdir()
    moved = tmp_path / "sfhq" / "s1"
    shard.rename(moved)
    with pytest.raises(SyntheticInputError, match="pool directory"):
        read_shard(moved)


def test_symlinked_records_and_extra_files_are_refused(shard: Path, tmp_path: Path) -> None:
    (shard / "notes.txt").write_text("x")
    with pytest.raises(SyntheticInputError):
        read_shard(shard)
    (shard / "notes.txt").unlink()
    rows = shard / RECORDS_NAME
    rows.rename(tmp_path / "elsewhere.jsonl")
    rows.symlink_to(tmp_path / "elsewhere.jsonl")
    with pytest.raises(SyntheticInputError):
        read_shard(shard)


def test_symlinked_shard_directory_is_refused(shard: Path, tmp_path: Path) -> None:
    link = tmp_path / "own_render" / "alias"
    link.symlink_to(shard)
    with pytest.raises(SyntheticInputError):
        read_shard(link)

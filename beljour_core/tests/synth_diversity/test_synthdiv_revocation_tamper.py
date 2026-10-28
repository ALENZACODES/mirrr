"""Tampered allowlists, digests and snapshot scopes publish nothing.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_replay_fixtures import (
    admitted,
    signed_snapshot,
    world_inventory,
)
from lab.synth_diversity.stress_provenance_revocation_release import release_filtered
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world
from lab.synth_diversity.stress_provenance_stream_verify import StreamSummary
from lab.synth_diversity.types import SyntheticInputError


def setup(tmp_path: Path) -> tuple[StreamWorld, Path, StreamSummary]:
    world = build_world(tmp_path / "w")
    path, summary = admitted(world, tmp_path / "a")
    return world, path, summary


def test_edited_allowlist_fails_digest(tmp_path: Path) -> None:
    world, path, summary = setup(tmp_path)
    path.write_bytes(path.read_bytes() + b'{"record_id":"sfhq-0001"}\n')
    with pytest.raises(SyntheticInputError, match="admitted digest"):
        release_filtered(path, summary.allowlist_sha256, signed_snapshot(world, ()),
                         world.trust, world.now, 1, world_inventory(world),
                         world.roster.digest, tmp_path / "out.jsonl")
    assert not (tmp_path / "out.jsonl").exists()


def test_unsorted_allowlist_with_matching_digest_fails(tmp_path: Path) -> None:
    world, path, _ = setup(tmp_path)
    lines = path.read_bytes().splitlines(keepends=True)
    path.write_bytes(b"".join(reversed(lines)))
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    with pytest.raises(SyntheticInputError, match="strictly increasing"):
        release_filtered(path, digest, signed_snapshot(world, ()), world.trust, world.now, 1,
                         world_inventory(world), world.roster.digest, tmp_path / "out.jsonl")
    assert not (tmp_path / "out.jsonl").exists()


def test_extra_fields_in_allowlist_fail(tmp_path: Path) -> None:
    world, path, _ = setup(tmp_path)
    path.write_bytes(b'{"record_id":"own-0001","train":true}\n')
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    with pytest.raises(SyntheticInputError, match="record IDs only"):
        release_filtered(path, digest, signed_snapshot(world, ()), world.trust, world.now, 1,
                         world_inventory(world), world.roster.digest, tmp_path / "out.jsonl")


def test_snapshot_for_another_roster_or_inventory_fails(tmp_path: Path) -> None:
    world, path, summary = setup(tmp_path)
    receipt = signed_snapshot(world, ())
    with pytest.raises(SyntheticInputError, match="roster"):
        release_filtered(path, summary.allowlist_sha256, receipt, world.trust, world.now, 1,
                         world_inventory(world), "0" * 64, tmp_path / "out.jsonl")
    with pytest.raises(SyntheticInputError, match="inventory"):
        release_filtered(path, summary.allowlist_sha256, receipt, world.trust, world.now, 1,
                         "0" * 64, world.roster.digest, tmp_path / "out.jsonl")

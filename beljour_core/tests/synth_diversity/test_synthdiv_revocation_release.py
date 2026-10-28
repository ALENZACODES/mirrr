"""Revocation-filtered export: removes only, reconciles counts, publishes once.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from lab.synth_diversity.stress_provenance_replay_fixtures import (
    admitted,
    signed_snapshot,
    world_inventory,
)
from lab.synth_diversity.stress_provenance_revocation_release import (
    ReleaseResult,
    iter_allowlist,
    release_filtered,
)
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world


def release(world: StreamWorld, root: Path, revoked: tuple[str, ...]) -> ReleaseResult:
    path, summary = admitted(world, root / "a")
    return release_filtered(path, summary.allowlist_sha256, signed_snapshot(world, revoked),
                            world.trust, world.now, 1, world_inventory(world),
                            world.roster.digest, root / "released.jsonl")


def test_revoked_ids_are_removed(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    result = release(world, tmp_path, ("own-0002",))
    assert list(iter_allowlist(tmp_path / "released.jsonl")) == ["own-0001", "own-0003"]
    assert (result.kept, result.removed, result.revoked_not_in_input) == (2, 1, 0)


def test_revoking_unadmitted_ids_adds_nothing(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    result = release(world, tmp_path, ("research-0001", "sfhq-0002"))
    assert list(iter_allowlist(tmp_path / "released.jsonl")) == [
        "own-0001", "own-0002", "own-0003"]
    assert result.revoked_not_in_input == 2


def test_empty_snapshot_keeps_everything(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    result = release(world, tmp_path, ())
    assert result.input_sha256 == result.output_sha256
    assert result.to_dict()["filter_can_only_remove"] is True


def test_input_allowlist_is_not_modified(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    release(world, tmp_path, ("own-0001",))
    assert list(iter_allowlist(tmp_path / "a" / "admitted.jsonl")) == [
        "own-0001", "own-0002", "own-0003"]

"""Release paths: existing outputs, symlinks, in-place replacement and repo paths.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_replay_fixtures import (
    admitted,
    signed_snapshot,
    world_inventory,
)
from lab.synth_diversity.stress_provenance_revocation_release import release_filtered
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world
from lab.synth_diversity.types import SyntheticInputError


def attempt(world: StreamWorld, source: Path, digest: str, output: Path) -> None:
    release_filtered(source, digest, signed_snapshot(world, ("own-0001",)), world.trust,
                     world.now, 1, world_inventory(world), world.roster.digest, output)


def test_existing_output_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    path, summary = admitted(world, tmp_path / "a")
    (tmp_path / "out.jsonl").write_text("old")
    with pytest.raises(SyntheticInputError, match="already exists"):
        attempt(world, path, summary.allowlist_sha256, tmp_path / "out.jsonl")
    assert (tmp_path / "out.jsonl").read_text() == "old"


def test_output_cannot_replace_input(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    path, summary = admitted(world, tmp_path / "a")
    with pytest.raises(SyntheticInputError):
        attempt(world, path, summary.allowlist_sha256, path)


def test_symlinked_input_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    path, summary = admitted(world, tmp_path / "a")
    link = tmp_path / "link.jsonl"
    link.symlink_to(path)
    with pytest.raises(SyntheticInputError, match="unlinked"):
        attempt(world, link, summary.allowlist_sha256, tmp_path / "out.jsonl")
    assert not (tmp_path / "out.jsonl").exists()


def test_symlinked_output_name_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    path, summary = admitted(world, tmp_path / "a")
    (tmp_path / "out.jsonl").symlink_to(tmp_path / "elsewhere")
    with pytest.raises(SyntheticInputError):
        attempt(world, path, summary.allowlist_sha256, tmp_path / "out.jsonl")


def test_repository_output_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    path, summary = admitted(world, tmp_path / "a")
    inside = Path(__file__).resolve().parent / "released-should-not-exist.jsonl"
    with pytest.raises(SyntheticInputError, match="repo"):
        attempt(world, path, summary.allowlist_sha256, inside)

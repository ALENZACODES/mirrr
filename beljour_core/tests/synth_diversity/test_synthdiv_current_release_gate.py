"""Composite release gate: fresh verification plus signed revocation, all or nothing.
Author: John Khan.
"""

from __future__ import annotations

import inspect
import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_release_gate import (
    RELEASED_NAME,
    SUMMARY_NAME,
    GateOutcome,
    release_gate,
)
from lab.synth_diversity.stress_provenance_replay_fixtures import signed_snapshot
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world
from lab.synth_diversity.stress_provenance_stream_io import STREAM_ROWS
from lab.synth_diversity.types import SyntheticInputError


def gate(world: StreamWorld, out: Path, revoked: tuple[str, ...] = (), epoch: int = 3,
         floor: int = 3) -> GateOutcome:
    return release_gate(world.roster, world.ledger, world.stream, world.trust, world.registry,
                        world.now, signed_snapshot(world, revoked, epoch), floor, out)


def test_gate_publishes_released_ids_and_summary(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    outcome = gate(world, tmp_path / "out", ("own-0003",))
    assert sorted(path.name for path in (tmp_path / "out").iterdir()) == sorted(
        [RELEASED_NAME, SUMMARY_NAME])
    lines = (tmp_path / "out" / RELEASED_NAME).read_text().splitlines()
    assert [json.loads(line)["record_id"] for line in lines] == ["own-0001", "own-0002"]
    summary = json.loads((tmp_path / "out" / SUMMARY_NAME).read_text())
    assert summary["train_permission_granted"] is False
    assert summary == outcome.to_dict()
    assert not [p for p in tmp_path.iterdir() if p.name.startswith(".out")]


def test_stale_epoch_publishes_nothing(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    with pytest.raises(SyntheticInputError, match="older than floor"):
        gate(world, tmp_path / "out", epoch=2, floor=3)
    assert not (tmp_path / "out").exists()
    assert not [p for p in tmp_path.iterdir() if p.name.startswith(".out")]


def test_tampered_stream_publishes_nothing(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    rows = world.stream / STREAM_ROWS
    rows.write_bytes(rows.read_bytes().replace(b"own-0002", b"own-0009", 1))
    with pytest.raises(SyntheticInputError):
        gate(world, tmp_path / "out")
    assert not (tmp_path / "out").exists()


def test_gate_accepts_no_precomputed_admission_or_cursor() -> None:
    names = set(inspect.signature(release_gate).parameters)
    assert names == {"roster", "ledger_root", "stream_folder", "trust", "registry", "now",
                     "revocation", "minimum_epoch", "out_dir"}


def test_existing_output_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    (tmp_path / "out").mkdir()
    with pytest.raises(SyntheticInputError, match="already exists"):
        gate(world, tmp_path / "out")

"""Signed exact-inventory overlap findings exclude contaminated originals.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_fixtures import fixture_sketches
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world
from lab.synth_diversity.stress_provenance_stream_io import (
    iter_stream,
    open_stream,
    write_stream,
)
from lab.synth_diversity.stress_provenance_stream_verify import StreamSummary, verify_and_export
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    WINDOW,
    fixture_root,
    fixture_witness_receipts,
)
from lab.synth_diversity.types import SyntheticInputError


def ids(path: Path) -> list[str]:
    return [line.split('"')[3] for line in path.read_text().splitlines()]


def export(world: StreamWorld, out: Path) -> StreamSummary:
    return verify_and_export(world.roster, world.ledger, world.stream, world.trust,
                             world.registry, world.now, out)


def test_contaminated_original_and_descendant_are_excluded(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w", sketches=fixture_sketches("own-0001"))
    summary = export(world, tmp_path / "allow.jsonl")
    assert ids(tmp_path / "allow.jsonl") == ["own-0002"]
    assert summary.excluded_contaminated == 2


def test_clean_scan_excludes_nothing(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    export(world, tmp_path / "allow.jsonl")
    assert ids(tmp_path / "allow.jsonl") == ["own-0001", "own-0002", "own-0003"]


def test_scan_for_another_inventory_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    header = open_stream(world.stream)
    stale = fixture_witness_receipts(world.records[:-1])
    overlap = next(item for item in stale if item.role == "overlap")
    rows = list(iter_stream(world.stream, header))
    write_stream(tmp_path / "s2", rows, world.roster.digest, overlap, fixture_root("source"),
                 world.now - 10, world.now - 10 + WINDOW)
    moved = replace(world, stream=tmp_path / "s2")
    with pytest.raises(SyntheticInputError, match="exact inventory"):
        export(moved, tmp_path / "allow.jsonl")
    assert not (tmp_path / "allow.jsonl").exists()

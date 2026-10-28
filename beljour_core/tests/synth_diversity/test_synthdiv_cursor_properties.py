"""Cursor plan properties across range sizes: coverage, determinism, digests.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance import ProvenanceRecord, sha256_bytes
from lab.synth_diversity.stress_provenance_cursor_plan import plan_cursor
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world

LICENCE = sha256_bytes(b"fictional cursor licence")


def records(count: int) -> tuple[ProvenanceRecord, ...]:
    return tuple(ProvenanceRecord(f"res-{i:04d}", "research_test", "research", "gen", "run-r",
                                  LICENCE, "rights-r", sha256_bytes(f"r{i}".encode()))
                 for i in range(count))


@pytest.fixture(scope="module")
def stream(tmp_path_factory: pytest.TempPathFactory) -> Path:
    rows = records(23)
    sketches = {r.record_id: i * 0x9E37_79B9_7F4A_7C15 % (1 << 64) for i, r in enumerate(rows)}
    return build_world(tmp_path_factory.mktemp("cursor"), records=rows, sketches=sketches,
                       shard_size=5).stream


@pytest.mark.parametrize("size", range(1, 25))
def test_ranges_cover_rows_once(stream: Path, size: int) -> None:
    plan = plan_cursor(stream, size)
    covered = [row for item in plan.ranges for row in range(item.start, item.stop)]
    assert covered == list(range(23))
    assert all(0 < item.stop - item.start <= size for item in plan.ranges)
    assert [item.index for item in plan.ranges] == list(range(len(plan.ranges)))


@pytest.mark.parametrize("size", (1, 4, 23))
def test_replanning_is_deterministic(stream: Path, size: int) -> None:
    assert plan_cursor(stream, size) == plan_cursor(stream, size)
    assert plan_cursor(stream, size).digest == plan_cursor(stream, size).digest


def test_different_sizes_give_different_plan_digests(stream: Path) -> None:
    digests = {plan_cursor(stream, size).digest for size in (1, 2, 3, 23)}
    assert len(digests) == 4

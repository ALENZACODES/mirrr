"""Cursor plans: disjoint contiguous ranges bound to stream, roster and inventory.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_cursor_plan import (
    check_plan,
    plan_cursor,
    range_bytes_sha256,
)
from lab.synth_diversity.stress_provenance_replay_fixtures import world_inventory
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_io import STREAM_ROWS, open_stream
from lab.synth_diversity.types import SyntheticInputError


@pytest.mark.parametrize(("size", "bounds"), (
    (1, [(i, i + 1) for i in range(7)]), (3, [(0, 3), (3, 6), (6, 7)]), (7, [(0, 7)]),
    (50, [(0, 7)]),
))
def test_ranges_partition_rows(tmp_path: Path, size: int, bounds: list[tuple[int, int]]) -> None:
    world = build_world(tmp_path)
    plan = plan_cursor(world.stream, size)
    assert [(item.start, item.stop) for item in plan.ranges] == bounds
    assert plan.rows == 7


def test_plan_binds_stream_roster_and_inventory(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    plan = plan_cursor(world.stream, 2)
    assert plan.stream_sha256 == open_stream(world.stream).sha256
    assert plan.roster_sha256 == world.roster.digest
    assert plan.inventory_sha256 == world_inventory(world)
    assert plan.to_dict()["authorization"] == "SCHEDULING_ONLY"


def test_range_digests_equal_raw_byte_digests(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    plan = plan_cursor(world.stream, 3)
    for item in plan.ranges:
        assert range_bytes_sha256(world.stream, item) == item.sha256


def test_first_and_last_ids_are_recorded(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    plan = plan_cursor(world.stream, 4)
    assert (plan.ranges[0].first_record_id, plan.ranges[-1].last_record_id) == (
        "own-0001", "sfhq-0002")


def test_check_plan_detects_a_different_stream(tmp_path: Path) -> None:
    first = build_world(tmp_path / "a")
    second = build_world(tmp_path / "b", shard_size=3)
    plan = plan_cursor(first.stream, 2)
    check_plan(first.stream, plan)
    with pytest.raises(SyntheticInputError, match="does not match"):
        check_plan(second.stream, plan)


@pytest.mark.parametrize("size", (0, 100_001, 2.5))
def test_range_size_bounds(tmp_path: Path, size: object) -> None:
    world = build_world(tmp_path)
    with pytest.raises(SyntheticInputError):
        plan_cursor(world.stream, size)  # type: ignore[arg-type]


def test_plan_requires_a_valid_stream(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    rows = world.stream / STREAM_ROWS
    rows.write_bytes(rows.read_bytes()[:-3])
    with pytest.raises(SyntheticInputError):
        plan_cursor(world.stream, 2)

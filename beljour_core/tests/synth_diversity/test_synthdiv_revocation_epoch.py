"""External monotonic epoch floor: old snapshots cannot be replayed.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_replay_fixtures import signed_snapshot, world_inventory
from lab.synth_diversity.stress_provenance_revocation import verify_snapshot
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world
from lab.synth_diversity.types import SyntheticInputError


def check(world: StreamWorld, epoch: int, floor: int) -> int:
    receipt = signed_snapshot(world, ("own-0001",), epoch)
    return verify_snapshot(receipt, world.trust, world.now, floor, world_inventory(world),
                           world.roster.digest).epoch


@pytest.mark.parametrize(("epoch", "floor", "accepted"), (
    (3, 1, True), (3, 3, True), (3, 4, False), (10, 9, True), (1, 2, False),
))
def test_floor_is_inclusive(tmp_path: Path, epoch: int, floor: int, accepted: bool) -> None:
    world = build_world(tmp_path)
    if accepted:
        assert check(world, epoch, floor) == epoch
    else:
        with pytest.raises(SyntheticInputError, match="older than floor"):
            check(world, epoch, floor)


def test_advancing_floor_retires_a_previously_valid_snapshot(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    assert check(world, 5, 5) == 5
    with pytest.raises(SyntheticInputError, match="older than floor"):
        check(world, 5, 6)


@pytest.mark.parametrize("floor", (0, -1, True, 1.0))
def test_floor_is_mandatory_and_positive(tmp_path: Path, floor: object) -> None:
    world = build_world(tmp_path)
    receipt = signed_snapshot(world, ())
    with pytest.raises(SyntheticInputError, match="minimum epoch"):
        verify_snapshot(receipt, world.trust, world.now, floor,  # type: ignore[arg-type]
                        world_inventory(world), world.roster.digest)

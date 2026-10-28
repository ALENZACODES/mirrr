"""Random revocation sets: output equals input minus revoked, never more.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from lab.synth_diversity.stress_provenance import ProvenanceRecord, sha256_bytes
from lab.synth_diversity.stress_provenance_replay_fixtures import (
    admitted,
    signed_snapshot,
    world_inventory,
)
from lab.synth_diversity.stress_provenance_revocation_release import (
    iter_allowlist,
    release_filtered,
)
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world

LICENCE = sha256_bytes(b"fictional revocation property licence")


def records(count: int) -> tuple[ProvenanceRecord, ...]:
    own = tuple(ProvenanceRecord(f"own-{i:04d}", "own_render", "original_3d", "gen", "run-a",
                                 LICENCE, "rights-a", sha256_bytes(f"own{i}".encode()))
                for i in range(count))
    other = (ProvenanceRecord("sfhq-0000", "sfhq", "sfhq", "sgen", "run-s", LICENCE,
                              "rights-s", sha256_bytes(b"sfhq")),)
    return own + other


@pytest.mark.parametrize("seed", range(6))
def test_filtered_is_admitted_minus_revoked(tmp_path: Path, seed: int) -> None:
    rng = np.random.default_rng(seed)
    rows = records(int(rng.integers(3, 15)))
    sketches = {r.record_id: (i + 1) * 0x1F3D_5B79_A2C4_E6F8 % (1 << 64)
                for i, r in enumerate(rows)}
    world = build_world(tmp_path / "w", records=rows, sketches=sketches, shard_size=4)
    path, summary = admitted(world, tmp_path / "a")
    every = [r.record_id for r in rows]
    revoked = tuple(sorted({every[int(i)] for i in rng.integers(0, len(every), 4)}))
    result = release_filtered(path, summary.allowlist_sha256, signed_snapshot(world, revoked),
                              world.trust, world.now, 1, world_inventory(world),
                              world.roster.digest, tmp_path / "out.jsonl")
    before = list(iter_allowlist(path))
    after = list(iter_allowlist(tmp_path / "out.jsonl"))
    assert after == [name for name in before if name not in revoked]
    assert set(after) <= set(before)
    assert result.kept + result.removed == len(before)
    assert result.removed + result.revoked_not_in_input == len(revoked)

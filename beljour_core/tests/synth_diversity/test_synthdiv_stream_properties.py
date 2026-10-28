"""Random synthetic corpora: streamed admission equals the in-memory admission.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from lab.synth_diversity.stress_provenance import ProvenanceRecord, sha256_bytes
from lab.synth_diversity.stress_provenance_admission import admit_records
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_verify import verify_and_export
from lab.synth_diversity.stress_provenance_witness_fixtures import fixture_witness_receipts

CLASSES = {"own_render": "original_3d", "sfhq": "sfhq", "research_test": "research"}


def corpus(seed: int) -> tuple[tuple[ProvenanceRecord, ...], dict[str, int]]:
    rng = np.random.default_rng(seed)
    records: list[ProvenanceRecord] = []
    for pool in CLASSES:
        for index in range(int(rng.integers(1, 9))):
            record_id = f"{pool[:3]}-{seed:02d}-{index:03d}"
            parents: tuple[str, ...] = ()
            if pool == "own_render" and index and rng.random() < 0.4:
                parents = (f"own-{seed:02d}-{int(rng.integers(0, index)):03d}",)
            records.append(ProvenanceRecord(
                record_id, pool, CLASSES[pool], f"gen-{pool[:3]}", f"run-{pool[:3]}",
                sha256_bytes(pool.encode()), f"rights-{pool[:3]}",
                sha256_bytes(record_id.encode()), parents))
    sketches = {r.record_id: int(rng.integers(0, 2**63)) for r in records}
    restricted = [r.record_id for r in records if r.pool != "own_render"]
    for record in records:
        if record.pool == "own_render" and rng.random() < 0.25:
            sketches[record.record_id] = sketches[restricted[0]] ^ 0b11
    return tuple(sorted(records, key=lambda r: r.record_id)), sketches


@pytest.mark.parametrize("seed", range(8))
def test_stream_equals_memory_admission(tmp_path: Path, seed: int) -> None:
    records, sketches = corpus(seed)
    world = build_world(tmp_path / "w", records=records, sketches=sketches,
                        shard_size=int(seed % 3) + 1)
    summary = verify_and_export(world.roster, world.ledger, world.stream, world.trust,
                                world.registry, world.now, tmp_path / "allow.jsonl")
    reference = admit_records(records, world.roster.digest,
                              fixture_witness_receipts(records, sketches, world.now - 3600),
                              world.trust, world.registry, world.now)
    published = [line.split('"')[3] for line in
                 (tmp_path / "allow.jsonl").read_text().splitlines()]
    assert tuple(published) == reference.allowlist
    assert summary.by_pool == reference.by_pool

"""Variable-size synthetic corpora: admission equals an independent reference rule.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.stress_provenance import (
    ApprovalRegistry,
    ProvenanceRecord,
    RightsApproval,
    sha256_bytes,
)
from lab.synth_diversity.stress_provenance_admission import admit_records
from lab.synth_diversity.stress_provenance_fixtures import DAY, FIXTURE_NOW
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fixture_trust,
    fixture_witness_receipts,
)

LICENCE = sha256_bytes(b"fictional property licence")
POOL_CLASS = {"own_render": "original_3d", "sfhq": "sfhq", "research_test": "research"}


Corpus = tuple[tuple[ProvenanceRecord, ...], dict[str, int], set[str], set[str]]


def corpus(seed: int) -> Corpus:
    """Random pools; about 30% of originals copy a restricted sketch within 4 bits."""
    rng = np.random.default_rng(seed)
    records = []
    sketches: dict[str, int] = {}
    for pool, prefix in (("own_render", "own"), ("sfhq", "sfhq"), ("research_test", "res")):
        for index in range(int(rng.integers(1, 25))):
            record_id = f"{prefix}-{index:04d}"
            records.append(ProvenanceRecord(
                record_id, pool, POOL_CLASS[pool], f"gen-{prefix}", f"run-{prefix}",
                LICENCE, f"rights-{prefix}", sha256_bytes(f"{seed}:{record_id}".encode())))
            sketches[record_id] = int(rng.integers(0, 2**63))
    restricted = [r.record_id for r in records if r.pool != "own_render"]
    contaminated: set[str] = set()
    for record in records:
        if record.pool == "own_render" and rng.random() < 0.3:
            source = restricted[int(rng.integers(0, len(restricted)))]
            sketches[record.record_id] = sketches[source] ^ int(rng.integers(0, 16))  # <= 4 bits
            contaminated.add(record.record_id)
    approved = {r.record_id for r in records if r.pool == "own_render" and rng.random() < 0.7}
    return tuple(sorted(records, key=lambda r: r.record_id)), sketches, approved, contaminated


@pytest.mark.parametrize("seed", range(15))
def test_allowlist_matches_reference_rule(seed: int) -> None:
    records, sketches, approved, contaminated = corpus(seed)
    registry = ApprovalRegistry(
        RightsApproval(r.record_id, r.generator_run, r.rights_token, r.licence_sha256,
                       "reviewer", FIXTURE_NOW - DAY, FIXTURE_NOW + DAY)
        for r in records if r.record_id in approved)
    receipts = fixture_witness_receipts(records, sketches)
    result = admit_records(records, "f" * 64, receipts, fixture_trust(), registry, FIXTURE_NOW)
    expected = tuple(sorted(approved - contaminated))
    assert result.allowlist == expected
    assert result.contaminated == len(contaminated)
    assert sum(result.by_pool.values()) == len(records)

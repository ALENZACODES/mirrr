"""Seeded property checks: the block index equals a brute-force four-bit scan.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.stress_near_duplicate import (
    MAX_DISTANCE,
    NearDuplicateIndex,
    hamming,
)


def clustered_hashes(seed: int, count: int) -> list[int]:
    """Random 64-bit centres with nearby mutants, so both outcomes occur often."""
    rng = np.random.default_rng(seed)
    centres = [int(rng.integers(0, 2**63)) * 2 + int(rng.integers(0, 2)) for _ in range(8)]
    values: list[int] = []
    for _ in range(count):
        value = centres[int(rng.integers(0, len(centres)))]
        for bit in rng.choice(64, size=int(rng.integers(0, 8)), replace=False):
            value ^= 1 << int(bit)
        values.append(value)
    return values


def brute_force(values: list[int]) -> list[tuple[int, int, int] | None]:
    accepted: list[tuple[int, int]] = []
    outcome: list[tuple[int, int, int] | None] = []
    for ordinal, value in enumerate(values):
        near = sorted((hamming(value, stored), index) for index, stored in accepted
                      if hamming(value, stored) <= MAX_DISTANCE)
        if near:
            outcome.append((ordinal, near[0][1], near[0][0]))
        else:
            accepted.append((ordinal, value))
            outcome.append(None)
    return outcome


@pytest.mark.parametrize("seed", range(12))
def test_index_decisions_equal_exhaustive_scan(seed: int) -> None:
    values = clustered_hashes(seed, 300)
    index = NearDuplicateIndex()
    observed = []
    for ordinal, value in enumerate(values):
        match = index.add(ordinal, value, "slice")
        observed.append(None if match is None else
                        (match.ordinal, match.reference_ordinal, match.distance))
    assert observed == brute_force(values)


@pytest.mark.parametrize("seed", range(6))
def test_query_returns_every_accepted_neighbour(seed: int) -> None:
    rng = np.random.default_rng(100 + seed)
    index = NearDuplicateIndex()
    accepted: dict[int, int] = {}
    for ordinal in range(200):
        value = int(rng.integers(0, 2**63)) << 1
        if index.add(ordinal, value, "s") is None:
            accepted[ordinal] = value
    probe = next(iter(accepted.values()))
    for bit in rng.choice(64, size=3, replace=False):
        probe ^= 1 << int(bit)
    expected = sorted(((ordinal, hamming(probe, value)) for ordinal, value in accepted.items()
                       if hamming(probe, value) <= MAX_DISTANCE),
                      key=lambda item: (item[1], item[0]))
    assert index.query(probe, "s") == expected


@pytest.mark.parametrize("seed", range(4))
def test_report_counts_reconcile_with_inputs(seed: int) -> None:
    values = clustered_hashes(seed + 50, 150)
    index = NearDuplicateIndex()
    for ordinal, value in enumerate(values):
        index.add(ordinal, value, f"slice-{ordinal % 3}")
    report = index.report()
    assert report["accepted"] + report["rejected"] == len(values)
    assert len(report["matches"]) == report["rejected"]
    assert report["slices"] == 3

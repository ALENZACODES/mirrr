"""Tests for per-item seeds, the shard rule and the 2M unique seed list.

Pure maths; no images, no real faces.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import os
import time

import numpy as np
import pytest

from lab.facescale_synth.seeds import (
    item_rng,
    item_seed,
    shard_indices,
    shard_of,
    shard_size,
    unique_seed_list,
)
from lab.facescale_synth.stress.audit import count_distinct
from lab.facescale_synth.stress.scene import SceneConfig

timing = pytest.mark.skipif(
    os.environ.get("FSSYNTH_SKIP_TIMING") == "1",
    reason="timing test switched off by FSSYNTH_SKIP_TIMING=1",
)


def test_item_seed_is_sha256_of_master_and_index() -> None:
    expected = hashlib.sha256((7).to_bytes(8, "big") + (3).to_bytes(8, "big")).digest()
    assert item_seed(7, 3) == int.from_bytes(expected[:8], "big")
    assert item_seed(7, 3) == item_seed(7, 3)
    assert item_seed(7, 3) != item_seed(7, 4)
    assert item_seed(7, 3) != item_seed(8, 3)


@pytest.mark.parametrize("bad", [-1, 2**64, True])
def test_item_seed_rejects_out_of_range_values(bad: int) -> None:
    with pytest.raises((ValueError, TypeError)):
        item_seed(bad, 0)
    with pytest.raises((ValueError, TypeError)):
        item_seed(0, bad)


def test_item_rng_streams_repeat() -> None:
    a = item_rng(11, 99).random(8)
    b = item_rng(11, 99).random(8)
    assert np.array_equal(a, b)
    assert not np.array_equal(a, item_rng(11, 100).random(8))


def test_shard_rule_partitions_the_set() -> None:
    total, count = 1003, 7
    seen: list[int] = []
    for shard in range(count):
        members = list(shard_indices(total, count, shard))
        assert members == sorted(members)
        assert all(shard_of(i, count) == shard for i in members)
        assert len(members) == shard_size(total, count, shard)
        seen.extend(members)
    assert sorted(seen) == list(range(total))


def test_shard_size_edges() -> None:
    assert shard_size(0, 4, 0) == 0
    assert shard_size(3, 4, 3) == 0
    assert shard_size(4, 4, 3) == 1
    assert shard_size(2_000_000, 64, 63) == 31_250
    with pytest.raises(ValueError):
        shard_size(10, 4, 4)
    with pytest.raises(ValueError):
        list(shard_indices(10, 0, 0))
    with pytest.raises(ValueError):
        shard_of(-1, 3)


def test_shard_indices_are_lazy() -> None:
    stream = shard_indices(10**12, 1000, 5)
    assert next(stream) == 5
    assert next(stream) == 1005


def test_hundred_thousand_seeds_give_distinct_item_streams() -> None:
    digests = {item_rng(2026, i).bytes(16) for i in range(100_000)}
    assert len(digests) == 100_000


def test_unique_seed_list_is_fixed_and_31_bit() -> None:
    seeds = unique_seed_list(5, 1000)
    assert seeds.dtype == np.int64
    assert len(np.unique(seeds)) == 1000
    assert seeds.min() >= 0 and seeds.max() < 2**31
    assert np.array_equal(seeds, unique_seed_list(5, 1000))
    assert np.array_equal(seeds[:10], unique_seed_list(5, 10))


@timing
def test_two_million_unique_seeds_in_memory() -> None:
    started = time.perf_counter()
    seeds = unique_seed_list(20261025, 2_000_000)
    elapsed = time.perf_counter() - started
    assert len(seeds) == 2_000_000
    assert len(np.unique(seeds)) == 2_000_000
    assert elapsed < 60.0


def test_small_audit_counts_distinct_items_inline() -> None:
    assert count_distinct("face", 3, 300) == 300
    assert count_distinct("scene", 3, 40, config=SceneConfig(width=64, height=64)) == 40
    with pytest.raises(ValueError):
        count_distinct("video", 3, 10)


@timing
def test_hundred_thousand_seeds_give_distinct_content_hashes() -> None:
    workers = max(1, min(4, os.cpu_count() or 1))
    assert count_distinct("face", 20261025, 100_000, workers=workers, chunk=5000) == 100_000

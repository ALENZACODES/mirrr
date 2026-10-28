"""Exact and near-duplicate removal on drawn images and synthetic hashes.

Near copies: resize, JPEG re-encode, small crop and brightness shift of a
seeded cartoon portrait. Distinct images are other seeds. The timing test
runs the multi-index over 100k random 64-bit hashes.
Author: John Khan.
"""

from __future__ import annotations

import itertools
import time

import numpy as np
import pytest
from numpy.typing import NDArray

from plumb_api.data_factory import perceptual, synthetic
from plumb_api.data_factory.dedup import (
    HashedItem,
    MultiIndex,
    NearDupConfig,
    UnionFind,
    chunk_layout,
    exact_dedup,
    flip_masks,
    near_dedup,
    plan_chunks,
)

TRANSFORMS = {
    "resize-half": lambda rgb: synthetic.resized(rgb, 0.5),
    "resize-up": lambda rgb: synthetic.resized(rgb, 1.6),
    "jpeg-q60": lambda rgb: synthetic.jpeg_roundtrip(rgb, 60),
    "crop-2pc": lambda rgb: synthetic.cropped(rgb, 0.02),
    "brighter": lambda rgb: synthetic.brightened(rgb, 1.12),
    "darker": lambda rgb: synthetic.brightened(rgb, 0.88),
}


def hashed(name: str, rgb: NDArray[np.uint8], rank: int) -> HashedItem[str]:
    return HashedItem(name, perceptual.phash(rgb), perceptual.dhash(rgb), (rank,), name)


def brute_pairs(values: NDArray[np.uint64], threshold: int) -> list[tuple[int, int, int]]:
    out = []
    for i, j in itertools.combinations(range(len(values)), 2):
        distance = perceptual.hamming(int(values[i]), int(values[j]))
        if distance <= threshold:
            out.append((i, j, distance))
    return out


def test_exact_dedup_by_any_key() -> None:
    items = [("a", "h1", "o1", 2), ("b", "h2", "o2", 1), ("c", "h1", "o3", 0),
             ("d", "h4", "o2", 5), ("e", "h5", "o5", 0)]
    kept, links = exact_dedup(items, ident=lambda i: i[0], keys=lambda i: (i[1], i[2]),
                              rank=lambda i: (i[3],))
    assert [item[0] for item in kept] == ["b", "c", "e"]
    assert sorted((link.dropped, link.kept) for link in links) == [("a", "c"), ("d", "b")]
    assert all(link.kind == "exact" for link in links)


def test_exact_dedup_tie_breaks_on_position() -> None:
    items = [("x", "k"), ("y", "k")]
    kept, links = exact_dedup(items, ident=lambda i: i[0], keys=lambda i: (i[1],),
                              rank=lambda i: ())
    assert kept == [("x", "k")]
    assert links[0].to_dict() == {"dropped": "y", "kept": "x", "kind": "exact"}


def test_union_find() -> None:
    groups = UnionFind(5)
    groups.union(3, 4)
    groups.union(4, 1)
    assert groups.find(3) == groups.find(1) == 1
    assert groups.find(0) == 0


@pytest.mark.parametrize("transform", sorted(TRANSFORMS))
def test_near_copies_are_within_threshold(transform: str) -> None:
    config = NearDupConfig()
    for seed in range(12):
        rgb = synthetic.portrait(seed)
        copy = TRANSFORMS[transform](rgb)
        p_dist = perceptual.hamming(perceptual.phash(rgb), perceptual.phash(copy))
        d_dist = perceptual.hamming(perceptual.dhash(rgb), perceptual.dhash(copy))
        assert p_dist <= config.phash_threshold, (seed, p_dist)
        assert d_dist <= config.dhash_threshold, (seed, d_dist)


def test_distinct_portraits_are_not_duplicates() -> None:
    entries = [hashed(f"seed-{seed}", synthetic.portrait(seed), seed) for seed in range(80)]
    result = near_dedup(entries, NearDupConfig())
    assert len(result.kept) == 80
    assert result.links == []


def test_near_dedup_keeps_best_ranked_original() -> None:
    entries: list[HashedItem[str]] = []
    for seed in range(10):
        rgb = synthetic.portrait(seed + 100)
        entries.append(hashed(f"orig-{seed}", rgb, 0))
        for number, name in enumerate(sorted(TRANSFORMS)):
            entries.append(hashed(f"copy-{seed}-{name}", TRANSFORMS[name](rgb), number + 1))
    result = near_dedup(entries, NearDupConfig())
    assert sorted(result.kept) == sorted(f"orig-{seed}" for seed in range(10))
    assert len(result.links) == 10 * len(TRANSFORMS)
    for link in result.links:
        assert link.kept == "orig-" + link.dropped.split("-")[1]
        assert link.kind == "near" and link.phash_distance is not None
    assert result.confirmed_pairs <= result.candidate_pairs


def test_greedy_order_prevents_chains() -> None:
    base = 0
    middle = base ^ 0b1111
    far = middle ^ (0b1111 << 8)
    entries = [HashedItem(name, value, value, (rank,), name)
               for rank, (name, value) in enumerate([("a", base), ("b", middle), ("c", far)])]
    result = near_dedup(entries, NearDupConfig(phash_threshold=5, dhash_threshold=5))
    assert result.kept == ["a", "c"]
    assert [link.dropped for link in result.links] == ["b"]


def test_dhash_must_confirm() -> None:
    entries = [HashedItem("a", 0, 0, (0,), "a"), HashedItem("b", 1, (1 << 40) - 1, (1,), "b")]
    result = near_dedup(entries, NearDupConfig(phash_threshold=4, dhash_threshold=4))
    assert result.kept == ["a", "b"]
    assert result.candidate_pairs == 1 and result.confirmed_pairs == 0


@pytest.mark.parametrize("threshold", [0, 2, 5, 8, 10, 13])
def test_multi_index_matches_brute_force(threshold: int) -> None:
    rng = np.random.default_rng(threshold)
    values = rng.integers(0, 2**64 - 1, size=240, dtype=np.uint64, endpoint=True)
    flips = rng.integers(0, 2**64 - 1, size=80, dtype=np.uint64, endpoint=True)
    values[160:] = values[:80] ^ (flips & np.uint64(0x0F0F00000000F00F))
    expected = brute_pairs(values, threshold)
    for chunks in {None, threshold + 1, max(1, (threshold + 1) // 2)}:
        try:
            index = MultiIndex(values, threshold, chunks)
        except ValueError:
            continue
        assert index.pairs() == expected
        probe = int(values[7])
        assert index.query(probe) == [(j, d) for j, d in (
            (j, perceptual.hamming(probe, int(v))) for j, v in enumerate(values)
        ) if d <= threshold]


def test_layout_and_masks() -> None:
    assert chunk_layout(4) == [(0, 16), (16, 16), (32, 16), (48, 16)]
    assert sum(width for _, width in chunk_layout(11)) == 64
    assert len(flip_masks(16, 2)) == 1 + 16 + 120
    assert flip_masks(3, 1) == [0, 1, 2, 4]
    assert plan_chunks(0, 1000) == 1
    assert plan_chunks(10, 100_000) == 4
    with pytest.raises(ValueError):
        plan_chunks(30, 10)
    with pytest.raises(ValueError):
        MultiIndex([1, 2], 10, chunks=1)
    with pytest.raises(ValueError):
        NearDupConfig(phash_threshold=99)


def test_empty_and_single_inputs() -> None:
    assert MultiIndex([], 6).pairs() == []
    assert MultiIndex([5], 6).query(5) == [(0, 0)]
    assert near_dedup([], NearDupConfig()).kept == []


def test_hundred_thousand_hashes_avoid_quadratic_work() -> None:
    rng = np.random.default_rng(2026)
    values = rng.integers(0, 2**64 - 1, size=100_000, dtype=np.uint64, endpoint=True)
    planted = np.arange(0, 2_000, 2)
    values[planted + 1] = values[planted] ^ np.uint64(0b1000100010001)
    started = time.perf_counter()
    pairs = MultiIndex(values, 10).pairs()
    elapsed = time.perf_counter() - started
    found = {(i, j) for i, j, _ in pairs}
    assert all((int(i), int(i) + 1) in found for i in planted)
    assert elapsed < 30.0, f"multi-index took {elapsed:.1f}s for 100k hashes"


def test_hex_helpers() -> None:
    assert perceptual.to_hex(255) == "00000000000000ff"
    assert perceptual.from_hex("00000000000000ff") == 255
    with pytest.raises(ValueError):
        perceptual.to_hex(-1)
    with pytest.raises(ValueError):
        perceptual.from_hex("ff")
    many = perceptual.hamming_many(0, np.array([0, 1, 3], dtype=np.uint64))
    assert many.tolist() == [0, 1, 2]

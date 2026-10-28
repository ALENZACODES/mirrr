"""Exact and near-duplicate removal for large image sets.

Exact duplicates share a content hash (or any other exact key, such as the
hash of the original upload) and are removed first. Near duplicates are found
with a multi-index over 64-bit perceptual hashes: the hash is cut into m
chunks, so two hashes within t bits differ by at most t // m bits in some
chunk. Each chunk is probed with the few flip masks of that radius, and only
hashes in the probed buckets are compared, which keeps 500k images far from
N^2 comparisons. Candidate pairs from pHash are
confirmed with dHash. Selection is deterministic.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable, Hashable, Sequence
from dataclasses import dataclass
from itertools import combinations
from math import comb
from typing import Generic, TypeVar

import numpy as np
from numpy.typing import NDArray

from .perceptual import HASH_BITS, UIntArray, hamming

T = TypeVar("T")
MAX_THRESHOLD = 20
MAX_PROBES = 6000
PROBE_OVERHEAD = 20_000
DIRECT_BITS = 22
IntArray = NDArray[np.int64]


class UnionFind:
    """Disjoint sets over 0..n-1 with path halving."""

    def __init__(self, size: int) -> None:
        self.parent = list(range(size))

    def find(self, item: int) -> int:
        """Root of the set holding item."""
        parent = self.parent
        while parent[item] != item:
            parent[item] = parent[parent[item]]
            item = parent[item]
        return item

    def union(self, left: int, right: int) -> None:
        """Merge the sets of left and right; the smaller root wins."""
        a, b = self.find(left), self.find(right)
        if a != b:
            low, high = (a, b) if a < b else (b, a)
            self.parent[high] = low


@dataclass(frozen=True)
class DuplicateLink:
    """One removed item and the item kept in its place."""

    dropped: str
    kept: str
    kind: str
    phash_distance: int | None = None
    dhash_distance: int | None = None

    def to_dict(self) -> dict[str, object]:
        """JSON form for the dedup log."""
        out: dict[str, object] = {"dropped": self.dropped, "kept": self.kept, "kind": self.kind}
        if self.phash_distance is not None:
            out["phash_distance"] = self.phash_distance
        if self.dhash_distance is not None:
            out["dhash_distance"] = self.dhash_distance
        return out


def exact_dedup(items: Sequence[T], *, ident: Callable[[T], str],
                keys: Callable[[T], Sequence[str]],
                rank: Callable[[T], tuple[Hashable, ...]]) -> tuple[list[T], list[DuplicateLink]]:
    """Keep one item per group of items sharing any exact key.

    The kept item has the lowest rank; ties fall back to input position. Kept
    items stay in input order.
    """
    owner: dict[str, int] = {}
    groups = UnionFind(len(items))
    for position, item in enumerate(items):
        for key in keys(item):
            if key in owner:
                groups.union(owner[key], position)
            else:
                owner[key] = position
    best: dict[int, int] = {}
    for position, item in enumerate(items):
        root = groups.find(position)
        current = best.get(root)
        if current is None or (rank(item), position) < (rank(items[current]), current):
            best[root] = position
    kept_positions = set(best.values())
    links = [DuplicateLink(ident(item), ident(items[best[groups.find(position)]]), "exact")
             for position, item in enumerate(items) if position not in kept_positions]
    kept = [item for position, item in enumerate(items) if position in kept_positions]
    return kept, links


def chunk_layout(chunks: int, bits: int = HASH_BITS) -> list[tuple[int, int]]:
    """(shift, width) of `chunks` nearly equal chunks covering all bits."""
    if not 1 <= chunks <= bits:
        raise ValueError("chunk count must be between 1 and the hash width")
    base, extra = divmod(bits, chunks)
    layout: list[tuple[int, int]] = []
    shift = 0
    for index in range(chunks):
        width = base + (1 if index < extra else 0)
        layout.append((shift, width))
        shift += width
    return layout


def flip_masks(width: int, radius: int) -> list[int]:
    """Every mask of at most `radius` set bits within `width` bits, zero first."""
    masks = [0]
    for count in range(1, radius + 1):
        for bits in combinations(range(width), count):
            masks.append(sum(1 << bit for bit in bits))
    return masks


def plan_chunks(threshold: int, size: int, bits: int = HASH_BITS) -> int:
    """Chunk count with the lowest estimated work for `size` hashes.

    With m chunks, two hashes within `threshold` bits differ by at most
    threshold // m bits in some chunk, so each chunk is probed with every flip
    mask of that radius. Work is probes times size plus expected candidates.
    """
    if not 0 <= threshold <= MAX_THRESHOLD:
        raise ValueError(f"threshold must be between 0 and {MAX_THRESHOLD}")
    best_chunks, best_cost = threshold + 1, float("inf")
    for chunks in range(1, threshold + 2):
        width = bits // chunks
        radius = threshold // chunks
        probes = chunks * sum(comb(width, count) for count in range(radius + 1))
        if probes > MAX_PROBES or width > 40:
            continue
        cost = probes * (size + PROBE_OVERHEAD) + size * size * probes / float(1 << width)
        if cost < best_cost:
            best_chunks, best_cost = chunks, cost
    return best_chunks


def _chunk_values(hashes: UIntArray, shift: int, width: int) -> UIntArray:
    mask = np.uint64((1 << width) - 1)
    return np.bitwise_and(np.right_shift(hashes, np.uint64(shift)), mask)


@dataclass(frozen=True)
class _ChunkTable:
    """Bucket lookup for one chunk; direct-addressed when the chunk is narrow."""

    keys: UIntArray
    starts: IntArray
    counts: IntArray
    order: IntArray
    sorted_hashes: UIntArray
    direct_starts: IntArray | None
    direct_counts: IntArray | None

    def lookup(self, wanted: UIntArray) -> tuple[IntArray, IntArray, IntArray]:
        """(probe position, bucket start, bucket count) for each probe that hits."""
        if self.direct_starts is not None and self.direct_counts is not None:
            counts = self.direct_counts[wanted]
            probe = np.flatnonzero(counts).astype(np.int64)
            return probe, self.direct_starts[wanted[probe]], counts[probe]
        if self.keys.size == 0:
            empty = np.zeros(0, dtype=np.int64)
            return empty, empty, empty
        slot = np.searchsorted(self.keys, wanted)
        slot = np.minimum(slot, self.keys.size - 1)
        hit = self.keys[slot] == wanted
        probe = np.flatnonzero(hit).astype(np.int64)
        return probe, self.starts[slot[hit]], self.counts[slot[hit]]


def _expand(probe: IntArray, starts: IntArray, counts: IntArray
            ) -> tuple[IntArray, IntArray]:
    """Repeat each probe once per bucket member; return (probe, sorted position)."""
    total = int(counts.sum())
    if total == 0:
        empty = np.zeros(0, dtype=np.int64)
        return empty, empty
    left = np.repeat(probe, counts)
    offsets = np.arange(total, dtype=np.int64) - np.repeat(np.cumsum(counts) - counts, counts)
    return left, np.repeat(starts, counts) + offsets


class MultiIndex:
    """Multi-index Hamming search on 64-bit hashes (chunks plus flip radius)."""

    def __init__(self, hashes: Sequence[int] | UIntArray, threshold: int,
                 chunks: int | None = None) -> None:
        self.hashes: UIntArray = np.asarray(hashes, dtype=np.uint64)
        self.threshold = threshold
        count = chunks or plan_chunks(threshold, len(self))
        self.layout = chunk_layout(count)
        self.radius = threshold // count
        probes = sum(comb(width, r) for _, width in self.layout for r in range(self.radius + 1))
        if probes > MAX_PROBES:
            raise ValueError(f"{count} chunks need {probes} probes; use more chunks")
        self._tables = [self._table(shift, width) for shift, width in self.layout]
        self._masks = [np.asarray(flip_masks(width, self.radius), dtype=np.uint64)
                       for _, width in self.layout]

    def __len__(self) -> int:
        return int(self.hashes.shape[0])

    def _table(self, shift: int, width: int) -> _ChunkTable:
        values = _chunk_values(self.hashes, shift, width)
        order = np.argsort(values, kind="stable").astype(np.int64)
        keys, starts, counts = np.unique(values[order], return_index=True, return_counts=True)
        starts, counts = starts.astype(np.int64), counts.astype(np.int64)
        direct_starts: IntArray | None = None
        direct_counts: IntArray | None = None
        if width <= DIRECT_BITS:
            direct_starts = np.zeros(1 << width, dtype=np.int64)
            direct_counts = np.zeros(1 << width, dtype=np.int64)
            direct_starts[keys] = starts
            direct_counts[keys] = counts
        return _ChunkTable(keys, starts, counts, order, self.hashes[order], direct_starts,
                           direct_counts)

    def _first_matching_chunk(self, xor: UIntArray) -> IntArray:
        first = np.full(xor.shape, len(self.layout), dtype=np.int64)
        for index in range(len(self.layout) - 1, -1, -1):
            shift, width = self.layout[index]
            close = np.bitwise_count(_chunk_values(xor, shift, width)) <= self.radius
            first[close] = index
        return first

    def _probe_pairs(self, table: _ChunkTable, sources: IntArray, starts: IntArray,
                     counts: IntArray) -> tuple[IntArray, IntArray, IntArray]:
        """(source index, bucket member index, distance) of probed pairs within the threshold.

        Only hash values are expanded per candidate; indices are worked out for
        the few survivors, which keeps the per-candidate work small.
        """
        total = int(counts.sum())
        if total == 0:
            empty = np.zeros(0, dtype=np.int64)
            return empty, empty, empty
        ends = np.cumsum(counts)
        position = np.arange(total, dtype=np.int64) + np.repeat(starts - (ends - counts), counts)
        left_hash = np.repeat(self.hashes[sources], counts)
        distance = np.bitwise_count(np.bitwise_xor(left_hash, table.sorted_hashes[position]))
        near = np.flatnonzero(distance <= self.threshold)
        owner = np.searchsorted(ends, near, side="right")
        return sources[owner], table.order[position[near]], distance[near].astype(np.int64)

    def pairs(self) -> list[tuple[int, int, int]]:
        """Every (i, j, distance) with i < j and distance within the threshold.

        A pair is kept only from the first chunk where it is within the radius,
        so each pair appears once.
        """
        found: list[tuple[IntArray, IntArray, IntArray]] = []
        for chunk, ((shift, width), table) in enumerate(zip(self.layout, self._tables,
                                                             strict=True)):
            values = _chunk_values(self.hashes, shift, width)
            for mask in self._masks[chunk].tolist():
                wanted = np.bitwise_xor(values, np.uint64(mask))
                if mask:
                    # Each unordered bucket pair is probed once, from its lower key.
                    source = np.flatnonzero(wanted > values).astype(np.int64)
                    probe, starts, counts = table.lookup(wanted[source])
                    sources = source[probe]
                else:
                    sources, starts, counts = table.lookup(wanted)
                left, right, distance = self._probe_pairs(table, sources, starts, counts)
                if not mask:
                    keep = left < right
                    left, right, distance = left[keep], right[keep], distance[keep]
                low, high = np.minimum(left, right), np.maximum(left, right)
                xor = np.bitwise_xor(self.hashes[low], self.hashes[high])
                first = self._first_matching_chunk(xor) == chunk
                if np.any(first):
                    found.append((low[first], high[first], distance[first]))
        if not found:
            return []
        left_all = np.concatenate([part[0] for part in found])
        right_all = np.concatenate([part[1] for part in found])
        dist_all = np.concatenate([part[2] for part in found])
        order = np.lexsort((right_all, left_all))
        return list(zip(left_all[order].tolist(), right_all[order].tolist(),
                        dist_all[order].tolist(), strict=True))

    def query(self, value: int) -> list[tuple[int, int]]:
        """(index, distance) of indexed hashes within the threshold, by index."""
        candidates: list[IntArray] = []
        for (shift, width), table, masks in zip(self.layout, self._tables, self._masks,
                                                strict=True):
            key = np.uint64((value >> shift) & ((1 << width) - 1))
            _, starts, counts = table.lookup(np.bitwise_xor(masks, key))
            _, position = _expand(np.zeros(starts.shape, dtype=np.int64), starts, counts)
            candidates.append(table.order[position])
        if not candidates:
            return []
        unique = np.unique(np.concatenate(candidates))
        xor = np.bitwise_xor(self.hashes[unique], np.uint64(value))
        distance = np.bitwise_count(xor).astype(np.int64)
        near = distance <= self.threshold
        return list(zip(unique[near].tolist(), distance[near].tolist(), strict=True))


@dataclass(frozen=True)
class NearDupConfig:
    """Thresholds in bits; a pair is a duplicate only when both hashes agree."""

    phash_threshold: int = 10
    dhash_threshold: int = 14

    def __post_init__(self) -> None:
        if not 0 <= self.phash_threshold <= MAX_THRESHOLD:
            raise ValueError(f"phash_threshold must be between 0 and {MAX_THRESHOLD}")
        if not 0 <= self.dhash_threshold <= 64:
            raise ValueError("dhash_threshold must be between 0 and 64")

    def to_dict(self) -> dict[str, int]:
        """Plain form for config hashing."""
        return {"phash_threshold": self.phash_threshold, "dhash_threshold": self.dhash_threshold}


@dataclass(frozen=True)
class HashedItem(Generic[T]):
    """An item with its perceptual hashes and a rank (lower is preferred)."""

    ident: str
    phash: int
    dhash: int
    rank: tuple[Hashable, ...]
    item: T


@dataclass(frozen=True)
class NearDedupResult(Generic[T]):
    """Kept items in input order and one link per removed item."""

    kept: list[T]
    links: list[DuplicateLink]
    candidate_pairs: int
    confirmed_pairs: int


def near_dedup(entries: Sequence[HashedItem[T]], config: NearDupConfig) -> NearDedupResult[T]:
    """Greedy removal in rank order: an item goes only if a kept item is near it.

    Greedy order avoids chains, where A~B and B~C would otherwise remove C
    although C is far from the kept A.
    """
    index = MultiIndex([entry.phash for entry in entries], config.phash_threshold)
    neighbours: dict[int, list[tuple[int, int, int]]] = {}
    candidates = index.pairs()
    confirmed = 0
    for left, right, p_dist in candidates:
        d_dist = hamming(entries[left].dhash, entries[right].dhash)
        if d_dist > config.dhash_threshold:
            continue
        confirmed += 1
        neighbours.setdefault(left, []).append((right, p_dist, d_dist))
        neighbours.setdefault(right, []).append((left, p_dist, d_dist))
    order = sorted(range(len(entries)), key=lambda pos: (entries[pos].rank, pos))
    kept_flags = [False] * len(entries)
    links: list[DuplicateLink] = []
    for position in order:
        near_kept = [(p, d, entries[other].rank, other)
                     for other, p, d in neighbours.get(position, []) if kept_flags[other]]
        if not near_kept:
            kept_flags[position] = True
            continue
        p_dist, d_dist, _, other = min(near_kept)
        links.append(DuplicateLink(entries[position].ident, entries[other].ident, "near",
                                   p_dist, d_dist))
    kept = [entry.item for pos, entry in enumerate(entries) if kept_flags[pos]]
    links.sort(key=lambda link: link.dropped)
    return NearDedupResult(kept, links, len(candidates), confirmed)

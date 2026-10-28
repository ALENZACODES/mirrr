"""Depth-balanced frozen-1000 scheduling for R18B Skin & More evidence. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from collections.abc import Iterable
from dataclasses import asdict, dataclass

from .frozen1000 import FrozenCase, FrozenManifest


@dataclass(frozen=True)
class ScheduledCase:
    ordinal: int
    case_id: str
    depth_slice: str
    feature_ids: tuple[str, ...]


@dataclass(frozen=True)
class Schedule:
    manifest_sha256: str
    cases: tuple[ScheduledCase, ...]
    author: str = "John Khan"

    def validate(self, manifest: FrozenManifest) -> None:
        manifest.validate(require_complete=False)
        if self.author != "John Khan" or self.manifest_sha256 != manifest.sha256:
            raise ValueError("schedule provenance mismatch")
        expected = {case.case_id: case for case in manifest.cases}
        if len(self.cases) != len(expected):
            raise ValueError("schedule size mismatch")
        for ordinal, item in enumerate(self.cases):
            source = expected.get(item.case_id)
            if source is None or item.ordinal != ordinal:
                raise ValueError("schedule case mismatch")
            if item.depth_slice != source.depth_slice or item.feature_ids != source.feature_ids:
                raise ValueError("schedule metadata drift")
        if len({item.case_id for item in self.cases}) != len(self.cases):
            raise ValueError("duplicate scheduled case")

    def canonical(self, manifest: FrozenManifest) -> str:
        self.validate(manifest)
        return json.dumps(
            {
                "author": self.author,
                "manifest_sha256": self.manifest_sha256,
                "cases": [asdict(item) for item in self.cases],
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @property
    def case_ids(self) -> tuple[str, ...]:
        return tuple(item.case_id for item in self.cases)

    def sha256(self, manifest: FrozenManifest) -> str:
        return hashlib.sha256(self.canonical(manifest).encode("utf-8")).hexdigest()


def build(manifest: FrozenManifest) -> Schedule:
    manifest.validate(require_complete=False)
    buckets: dict[str, list[FrozenCase]] = defaultdict(list)
    for case in manifest.cases:
        buckets[case.depth_slice].append(case)
    for rows in buckets.values():
        rows.sort(key=lambda item: item.case_id)
    keys = sorted(buckets)
    ordered: list[FrozenCase] = []
    index = 0
    while any(index < len(buckets[key]) for key in keys):
        for key in keys:
            if index < len(buckets[key]):
                ordered.append(buckets[key][index])
        index += 1
    cases = tuple(
        ScheduledCase(position, item.case_id, item.depth_slice, item.feature_ids)
        for position, item in enumerate(ordered)
    )
    result = Schedule(manifest.sha256, cases)
    result.validate(manifest)
    return result


def shards(schedule: Schedule, count: int) -> tuple[tuple[ScheduledCase, ...], ...]:
    if count < 1:
        raise ValueError("count must be positive")
    return tuple(tuple(schedule.cases[index::count]) for index in range(count))


def pending(schedule: Schedule, completed_case_ids: Iterable[str]) -> tuple[ScheduledCase, ...]:
    completed = set(completed_case_ids)
    known = set(schedule.case_ids)
    if not completed <= known:
        raise ValueError("unknown completed case")
    return tuple(item for item in schedule.cases if item.case_id not in completed)


def depth_counts(schedule: Schedule) -> dict[str, int]:
    return dict(sorted(Counter(item.depth_slice for item in schedule.cases).items()))


def maximum_prefix_depth_spread(schedule: Schedule) -> int:
    depths = sorted({item.depth_slice for item in schedule.cases})
    counts = {depth: 0 for depth in depths}
    maximum = 0
    for item in schedule.cases:
        counts[item.depth_slice] += 1
        values = tuple(counts.values())
        maximum = max(maximum, max(values) - min(values))
    return maximum

"""Balanced frozen-1000 scheduling for R18B makeup fairness evidence. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from collections.abc import Iterable, Sequence
from dataclasses import asdict, dataclass

from .frozen1000 import FrozenCase, FrozenManifest


@dataclass(frozen=True)
class ScheduledCase:
    ordinal: int
    case_id: str
    depth_slice: str
    undertone_slice: str
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
        seen: set[str] = set()
        for ordinal, item in enumerate(self.cases):
            if item.ordinal != ordinal or item.case_id in seen or item.case_id not in expected:
                raise ValueError("invalid schedule ordering")
            source = expected[item.case_id]
            if (item.depth_slice, item.undertone_slice, item.feature_ids) != (
                source.depth_slice,
                source.undertone_slice,
                source.feature_ids,
            ):
                raise ValueError("schedule metadata drift")
            seen.add(item.case_id)

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

    def sha256(self, manifest: FrozenManifest) -> str:
        return hashlib.sha256(self.canonical(manifest).encode("utf-8")).hexdigest()


def _balanced_order(cases: Sequence[FrozenCase]) -> tuple[FrozenCase, ...]:
    groups: dict[tuple[str, str], list[FrozenCase]] = defaultdict(list)
    for case in cases:
        groups[(case.depth_slice, case.undertone_slice)].append(case)
    for rows in groups.values():
        rows.sort(key=lambda item: item.case_id)
    result: list[FrozenCase] = []
    keys = sorted(groups)
    cursor = 0
    while any(cursor < len(groups[key]) for key in keys):
        for key in keys:
            if cursor < len(groups[key]):
                result.append(groups[key][cursor])
        cursor += 1
    return tuple(result)


def build(manifest: FrozenManifest) -> Schedule:
    manifest.validate(require_complete=False)
    rows = _balanced_order(manifest.cases)
    result = Schedule(
        manifest.sha256,
        tuple(
            ScheduledCase(index, row.case_id, row.depth_slice, row.undertone_slice, row.feature_ids)
            for index, row in enumerate(rows)
        ),
    )
    result.validate(manifest)
    return result


def shards(schedule: Schedule, count: int) -> tuple[tuple[ScheduledCase, ...], ...]:
    if count < 1:
        raise ValueError("count must be positive")
    return tuple(tuple(schedule.cases[index::count]) for index in range(count))


def pending(schedule: Schedule, completed_case_ids: Iterable[str]) -> tuple[ScheduledCase, ...]:
    completed = set(completed_case_ids)
    known = {item.case_id for item in schedule.cases}
    if not completed <= known:
        raise ValueError("completed set contains unknown case")
    return tuple(item for item in schedule.cases if item.case_id not in completed)


def slice_counts(schedule: Schedule) -> dict[str, dict[str, int]]:
    depth = Counter(item.depth_slice for item in schedule.cases)
    undertone = Counter(item.undertone_slice for item in schedule.cases)
    intersection = Counter(f"{item.depth_slice}|{item.undertone_slice}" for item in schedule.cases)
    return {
        "depth": dict(sorted(depth.items())),
        "undertone": dict(sorted(undertone.items())),
        "intersection": dict(sorted(intersection.items())),
    }


def prefix_fairness(schedule: Schedule, prefix: int) -> dict[str, int]:
    if prefix < 0 or prefix > len(schedule.cases):
        raise ValueError("prefix outside schedule")
    rows = schedule.cases[:prefix]
    depths = Counter(item.depth_slice for item in rows)
    undertones = Counter(item.undertone_slice for item in rows)
    depth_spread = max(depths.values()) - min(depths.values()) if depths else 0
    undertone_spread = max(undertones.values()) - min(undertones.values()) if undertones else 0
    return {"depth_spread": depth_spread, "undertone_spread": undertone_spread}

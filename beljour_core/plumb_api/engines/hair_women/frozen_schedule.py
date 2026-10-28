"""Balanced frozen-1000 scheduling for R18B women's hair evidence. Author: John Khan."""
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
    hair_slice: str
    tone_slice: str
    feature_ids: tuple[str, ...]


@dataclass(frozen=True)
class Schedule:
    manifest_sha256: str
    cases: tuple[ScheduledCase, ...]
    author: str = "John Khan"

    def validate(self, manifest: FrozenManifest) -> None:
        manifest.validate(require_complete=False)
        if self.author != "John Khan":
            raise ValueError("author must be John Khan")
        if self.manifest_sha256 != manifest.sha256:
            raise ValueError("manifest hash mismatch")
        expected = {case.case_id: case for case in manifest.cases}
        if len(self.cases) != len(expected):
            raise ValueError("schedule must contain each manifest case exactly once")
        seen: set[str] = set()
        for ordinal, item in enumerate(self.cases):
            if item.ordinal != ordinal:
                raise ValueError("schedule ordinals must be contiguous")
            if item.case_id in seen or item.case_id not in expected:
                raise ValueError("schedule case mismatch")
            source = expected[item.case_id]
            if (item.hair_slice, item.tone_slice, item.feature_ids) != (
                source.hair_slice,
                source.tone_slice,
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


def _round_robin_groups(cases: Sequence[FrozenCase]) -> tuple[FrozenCase, ...]:
    groups: dict[tuple[str, str], list[FrozenCase]] = defaultdict(list)
    for case in cases:
        groups[(case.hair_slice, case.tone_slice)].append(case)
    for rows in groups.values():
        rows.sort(key=lambda item: item.case_id)
    ordered_keys = sorted(groups)
    result: list[FrozenCase] = []
    cursor = 0
    while True:
        appended = False
        for key in ordered_keys:
            rows = groups[key]
            if cursor < len(rows):
                result.append(rows[cursor])
                appended = True
        if not appended:
            break
        cursor += 1
    return tuple(result)


def build(manifest: FrozenManifest) -> Schedule:
    manifest.validate(require_complete=False)
    ordered = _round_robin_groups(manifest.cases)
    schedule = Schedule(
        manifest.sha256,
        tuple(
            ScheduledCase(index, case.case_id, case.hair_slice, case.tone_slice, case.feature_ids)
            for index, case in enumerate(ordered)
        ),
    )
    schedule.validate(manifest)
    return schedule


def shards(schedule: Schedule, count: int) -> tuple[tuple[ScheduledCase, ...], ...]:
    if count < 1:
        raise ValueError("count must be positive")
    result = tuple(tuple(schedule.cases[index::count]) for index in range(count))
    flattened = [item.case_id for shard in result for item in shard]
    if len(flattened) != len(set(flattened)):
        raise AssertionError("shard planner duplicated a case")
    return result


def pending(schedule: Schedule, completed_case_ids: Iterable[str]) -> tuple[ScheduledCase, ...]:
    completed = set(completed_case_ids)
    known = {item.case_id for item in schedule.cases}
    unexpected = completed - known
    if unexpected:
        raise ValueError(f"unknown completed cases: {sorted(unexpected)!r}")
    return tuple(item for item in schedule.cases if item.case_id not in completed)


def slice_counts(schedule: Schedule) -> dict[str, dict[str, int]]:
    hair = Counter(item.hair_slice for item in schedule.cases)
    tone = Counter(item.tone_slice for item in schedule.cases)
    intersections = Counter(f"{item.hair_slice}|{item.tone_slice}" for item in schedule.cases)
    return {
        "hair_slice": dict(sorted(hair.items())),
        "tone_slice": dict(sorted(tone.items())),
        "intersection": dict(sorted(intersections.items())),
    }


def maximum_prefix_imbalance(schedule: Schedule) -> int:
    """Largest group-count spread observed in any schedule prefix."""
    if not schedule.cases:
        return 0
    groups = sorted({(item.hair_slice, item.tone_slice) for item in schedule.cases})
    counts = {key: 0 for key in groups}
    maximum = 0
    for item in schedule.cases:
        counts[(item.hair_slice, item.tone_slice)] += 1
        values = tuple(counts.values())
        maximum = max(maximum, max(values) - min(values))
    return maximum

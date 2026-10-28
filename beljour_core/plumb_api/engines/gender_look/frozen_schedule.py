"""Level-balanced frozen-1000 scheduling for R18B gender-look evidence. Author: John Khan."""
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
    levels: tuple[str, ...]


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
            source = expected.get(item.case_id)
            if source is None or item.case_id in seen or item.ordinal != ordinal:
                raise ValueError("invalid scheduled case")
            if item.levels != source.levels:
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


def _signature(case: FrozenCase) -> str:
    return "+".join(case.levels)


def build(manifest: FrozenManifest) -> Schedule:
    manifest.validate(require_complete=False)
    groups: dict[str, list[FrozenCase]] = defaultdict(list)
    for case in manifest.cases:
        groups[_signature(case)].append(case)
    for rows in groups.values():
        rows.sort(key=lambda item: item.case_id)
    keys = sorted(groups)
    ordered: list[FrozenCase] = []
    index = 0
    while any(index < len(groups[key]) for key in keys):
        for key in keys:
            if index < len(groups[key]):
                ordered.append(groups[key][index])
        index += 1
    result = Schedule(
        manifest.sha256,
        tuple(ScheduledCase(position, item.case_id, tuple(item.levels)) for position, item in enumerate(ordered)),
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
        raise ValueError("unknown completed case")
    return tuple(item for item in schedule.cases if item.case_id not in completed)


def signature_counts(schedule: Schedule) -> dict[str, int]:
    counts = Counter("+".join(item.levels) for item in schedule.cases)
    return dict(sorted(counts.items()))


def level_evaluation_counts(schedule: Schedule) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for item in schedule.cases:
        counts.update(item.levels)
    return dict(sorted(counts.items()))


def maximum_prefix_signature_spread(schedule: Schedule) -> int:
    signatures = sorted({"+".join(item.levels) for item in schedule.cases})
    counts = {key: 0 for key in signatures}
    maximum = 0
    for item in schedule.cases:
        counts["+".join(item.levels)] += 1
        values = tuple(counts.values())
        maximum = max(maximum, max(values) - min(values))
    return maximum

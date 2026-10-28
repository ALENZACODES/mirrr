"""Privacy-minimal frozen-set count ingestion for women's Top 5 features.

Consumes ONLY count summaries from the authoritative Lane A runner; never
accepts face identifiers, photos, raw similarity scores or inferred labels.
It cannot return PASS: frozen quality release depends on independent human
and numerical results checked by Lane A. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Feature = Literal["W6", "W39", "W98", "W28", "W93"]
Group = Literal["monk", "gender", "age", "yaw", "hair_texture", "occlusion", "intersection"]


@dataclass(frozen=True, slots=True)
class GroupCount:
    feature: Feature
    group: Group
    group_name: str
    passed: int
    failed: int
    unproven: int
    shard: int

    def validate(self) -> None:
        if self.feature not in ("W6", "W39", "W98", "W28", "W93"):
            raise ValueError("Unexpected feature id")
        if self.group not in ("monk", "gender", "age", "yaw", "hair_texture", "occlusion", "intersection"):
            raise ValueError("Unknown quality group")
        if not self.group_name or len(self.group_name) > 56 or not self.group_name.isascii():
            raise ValueError("Only a short aggregate group name may leave the runner")
        if any(char in self.group_name for char in ("@", "/", "\\", "#")):
            raise ValueError("Group name appears to contain a personal identifier")
        if type(self.shard) is not int or not 0 <= self.shard < 1000:
            raise ValueError("Shard identifier must be a bounded nonnegative integer")
        for value in (self.passed, self.failed, self.unproven):
            if type(value) is not int or not 0 <= value <= 100_000:
                raise ValueError("Invalid bounded aggregate count")
        if self.passed + self.failed + self.unproven > 100_000:
            raise ValueError("Aggregate count exceeds the declared frozen-set maximum")


@dataclass(frozen=True, slots=True)
class AggregatedGroup:
    feature: Feature
    group: Group
    group_name: str
    passed: int
    failed: int
    unproven: int
    total: int
    shards: int
    release_status: Literal["UNPROVEN"] = "UNPROVEN"

    def public(self) -> dict[str, str | int]:
        return {
            "feature": self.feature,
            "group": self.group,
            "group_name": self.group_name,
            "passed": self.passed,
            "failed": self.failed,
            "unproven": self.unproven,
            "total": self.total,
            "shards": self.shards,
            "release_status": self.release_status,
        }


def aggregate_counts(records: tuple[GroupCount, ...]) -> tuple[AggregatedGroup, ...]:
    """Reject duplicate shard/group reports rather than double-counting faces."""
    by_group: dict[tuple[str, str, str], list[GroupCount]] = {}
    seen: set[tuple[str, str, str, int]] = set()
    for record in records:
        record.validate()
        label = (record.feature, record.group, record.group_name)
        entry = (*label, record.shard)
        if entry in seen:
            raise ValueError("Duplicated group and shard entry")
        seen.add(entry)
        by_group.setdefault(label, []).append(record)
    summaries: list[AggregatedGroup] = []
    for group_key, batch in sorted(by_group.items()):
        passed = sum(row.passed for row in batch)
        failed = sum(row.failed for row in batch)
        unproven = sum(row.unproven for row in batch)
        total = passed + failed + unproven
        if total > 100_000:
            raise ValueError("Aggregated count exceeds frozen-set maximum")
        feature = batch[0].feature
        group = batch[0].group
        summaries.append(AggregatedGroup(feature, group, group_key[2], passed, failed, unproven, total, len(batch)))
    return tuple(summaries)


def public_report(records: tuple[GroupCount, ...]) -> dict[str, object]:
    """Only counts and group names; no raw evidence or demographic guesses."""
    return {
        "format": "beljour-women-r24c-counts/1",
        "release_status": "UNPROVEN",
        "groups": [entry.public() for entry in aggregate_counts(records)],
        "note": "Count-only summary; no frozen quality PASS inferred.",
    }

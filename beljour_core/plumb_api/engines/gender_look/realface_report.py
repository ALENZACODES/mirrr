"""Privacy-safe R18B gender full-look evidence reporting. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass

from plumb_api.arena.r17b_evidence import EvidenceRecord

from .realface import LEVELS, GenderCase, Level, definitions

FORMAT = "beljour.r18b.gender.report/1"


@dataclass(frozen=True)
class ReportRow:
    case_id: str
    level: Level
    direction: str
    status: str
    definition_sha256: str
    input_sha256: str
    metrics: tuple[tuple[str, float | bool], ...]
    missing: tuple[str, ...]

    def validate(self) -> None:
        if self.level not in LEVELS:
            raise ValueError("unknown gender-look level")
        if self.direction not in {"feminine", "masculine", "neutral"}:
            raise ValueError("unknown direction")
        if self.status not in {"passed", "failed", "not_tested"}:
            raise ValueError("invalid status")
        for digest in (self.definition_sha256, self.input_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("invalid sha256")


@dataclass(frozen=True)
class GenderReport:
    dataset_id: str
    rows: tuple[ReportRow, ...]
    author: str = "John Khan"

    def validate(self) -> None:
        if self.author != "John Khan" or not self.dataset_id.strip():
            raise ValueError("invalid report identity")
        seen: set[tuple[str, str, str]] = set()
        for row in self.rows:
            row.validate()
            key = (row.case_id, row.level, row.direction)
            if key in seen:
                raise ValueError("duplicate case/level/direction row")
            seen.add(key)

    def canonical(self) -> str:
        self.validate()
        return json.dumps(
            {
                "format": FORMAT,
                "author": self.author,
                "dataset_id": self.dataset_id,
                "definition_set_sha256": definition_set_sha256(),
                "levels": LEVELS,
                "rows": [asdict(row) for row in self.rows],
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


def definition_set_sha256() -> str:
    return hashlib.sha256("\n".join(item.sha256 for item in definitions()).encode("ascii")).hexdigest()


def row_from(case: GenderCase, record: EvidenceRecord) -> ReportRow:
    record.validate()
    return ReportRow(
        case_id=case.case_id,
        level=case.level,
        direction=case.direction,
        status=record.status,
        definition_sha256=record.definition_sha256,
        input_sha256=record.input_sha256,
        metrics=tuple(sorted(record.metrics.items())),
        missing=record.missing,
    )


def _rate(rows: list[ReportRow]) -> float | None:
    tested = [row for row in rows if row.status != "not_tested"]
    if not tested:
        return None
    return sum(row.status == "passed" for row in tested) / len(tested)


def coverage(report: GenderReport) -> dict[str, object]:
    report.validate()
    per_level = {level: {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0} for level in LEVELS}
    by_direction: dict[str, list[ReportRow]] = {}
    max_cheek = 0.0
    for row in report.rows:
        bucket = per_level[row.level]
        bucket[row.status] += 1
        if row.status != "not_tested":
            bucket["tested"] += 1
        by_direction.setdefault(row.direction, []).append(row)
        for name, value in row.metrics:
            if name == "cheek_delta_e_proxy" and not isinstance(value, bool):
                max_cheek = max(max_cheek, float(value))
    direction_rates = {direction: _rate(rows) for direction, rows in sorted(by_direction.items())}
    complete_levels = sum(
        1
        for bucket in per_level.values()
        if bucket["passed"] > 0 and bucket["failed"] == 0 and bucket["not_tested"] == 0
    )
    return {
        "registry_feature_count": len(LEVELS),
        "complete_levels": complete_levels,
        "per_level": per_level,
        "direction_pass_rates": direction_rates,
        "max_cheek_delta_e_proxy": max_cheek,
        "complete": bool(report.rows) and complete_levels == len(LEVELS),
    }

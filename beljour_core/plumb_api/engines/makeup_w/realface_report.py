"""Privacy-safe R18B makeup evidence and slice reporting. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass

from plumb_api.arena.r17b_evidence import EvidenceRecord

from .realface import MakeupCase, definitions, registry_feature_ids

FORMAT = "beljour.r18b.makeup.report/1"


@dataclass(frozen=True)
class ReportRow:
    case_id: str
    feature_id: str
    status: str
    depth_slice: str
    undertone_slice: str
    definition_sha256: str
    input_sha256: str
    metrics: tuple[tuple[str, float | bool], ...]
    missing: tuple[str, ...]

    def validate(self) -> None:
        if self.feature_id not in registry_feature_ids():
            raise ValueError("unknown makeup feature")
        if self.status not in {"passed", "failed", "not_tested"}:
            raise ValueError("invalid status")
        for digest in (self.definition_sha256, self.input_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("invalid sha256")


@dataclass(frozen=True)
class MakeupReport:
    dataset_id: str
    rows: tuple[ReportRow, ...]
    author: str = "John Khan"

    def validate(self) -> None:
        if self.author != "John Khan" or not self.dataset_id.strip():
            raise ValueError("invalid report identity")
        seen: set[tuple[str, str]] = set()
        for row in self.rows:
            row.validate()
            key = (row.case_id, row.feature_id)
            if key in seen:
                raise ValueError("duplicate case/feature row")
            seen.add(key)

    def canonical(self) -> str:
        self.validate()
        payload = {
            "format": FORMAT,
            "author": self.author,
            "dataset_id": self.dataset_id,
            "definition_set_sha256": definition_set_sha256(),
            "registry_features": registry_feature_ids(),
            "rows": [asdict(row) for row in self.rows],
        }
        return json.dumps(payload, sort_keys=True, separators=(",", ":"))

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


def definition_set_sha256() -> str:
    payload = "\n".join(item.sha256 for item in definitions())
    return hashlib.sha256(payload.encode("ascii")).hexdigest()


def row_from(case: MakeupCase, record: EvidenceRecord) -> ReportRow:
    record.validate()
    return ReportRow(
        case_id=case.case_id,
        feature_id=case.feature_id,
        status=record.status,
        depth_slice=case.depth_slice,
        undertone_slice=case.undertone_slice,
        definition_sha256=record.definition_sha256,
        input_sha256=record.input_sha256,
        metrics=tuple(sorted(record.metrics.items())),
        missing=record.missing,
    )


def _pass_rate(rows: list[ReportRow]) -> float | None:
    tested = [row for row in rows if row.status != "not_tested"]
    if not tested:
        return None
    return sum(row.status == "passed" for row in tested) / len(tested)


def coverage(report: MakeupReport) -> dict[str, object]:
    report.validate()
    features = registry_feature_ids()
    per_feature = {feature: {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0} for feature in features}
    by_depth: dict[str, list[ReportRow]] = {}
    by_undertone: dict[str, list[ReportRow]] = {}
    for row in report.rows:
        item = per_feature[row.feature_id]
        item[row.status] += 1
        if row.status != "not_tested":
            item["tested"] += 1
        by_depth.setdefault(row.depth_slice, []).append(row)
        by_undertone.setdefault(row.undertone_slice, []).append(row)
    depth_rates = {key: _pass_rate(rows) for key, rows in sorted(by_depth.items())}
    undertone_rates = {key: _pass_rate(rows) for key, rows in sorted(by_undertone.items())}
    complete = all(item["passed"] > 0 and item["failed"] == 0 and item["not_tested"] == 0 for item in per_feature.values())
    return {
        "registry_feature_count": len(features),
        "per_feature": per_feature,
        "depth_pass_rates": depth_rates,
        "undertone_pass_rates": undertone_rates,
        "deep_cases": len(by_depth.get("deep", ())),
        "olive_cases": len(by_undertone.get("olive", ())),
        "complete": bool(report.rows) and complete,
    }


def pass_rate_spread(rates: dict[str, float | None]) -> float | None:
    measured = [value for value in rates.values() if value is not None]
    if len(measured) < 2:
        return None
    return max(measured) - min(measured)

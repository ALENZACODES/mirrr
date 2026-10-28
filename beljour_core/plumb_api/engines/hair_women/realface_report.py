"""Privacy-safe R18B hair evidence reporting. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass

from plumb_api.arena.r17b_evidence import EvidenceRecord

from .realface import HairCase, definitions, registry_feature_ids

FORMAT = "beljour.r18b.hair.report/1"


@dataclass(frozen=True)
class ReportRow:
    case_id: str
    feature_id: str
    definition_sha256: str
    input_sha256: str
    status: str
    hair_slice: str
    tone_slice: str
    metrics: tuple[tuple[str, float | bool], ...]
    missing: tuple[str, ...]

    def validate(self) -> None:
        if self.feature_id not in registry_feature_ids():
            raise ValueError("unknown hair feature")
        if self.status not in {"passed", "failed", "not_tested"}:
            raise ValueError("invalid status")
        for digest in (self.definition_sha256, self.input_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("invalid sha256")
        if self.status == "not_tested" and not self.missing:
            raise ValueError("not_tested row must state missing evidence")
        if self.status != "not_tested" and self.missing:
            raise ValueError("tested row cannot retain missing evidence")


@dataclass(frozen=True)
class HairReport:
    dataset_id: str
    rows: tuple[ReportRow, ...]
    author: str = "John Khan"

    def validate(self) -> None:
        if self.author != "John Khan" or not self.dataset_id.strip():
            raise ValueError("invalid report identity")
        keys: set[tuple[str, str]] = set()
        for row in self.rows:
            row.validate()
            key = (row.case_id, row.feature_id)
            if key in keys:
                raise ValueError("duplicate case/feature row")
            keys.add(key)

    def canonical(self) -> str:
        self.validate()
        return json.dumps(
            {
                "format": FORMAT,
                "author": self.author,
                "dataset_id": self.dataset_id,
                "definition_set_sha256": definition_set_sha256(),
                "registry_features": registry_feature_ids(),
                "rows": [asdict(row) for row in self.rows],
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


def definition_set_sha256() -> str:
    payload = "\n".join(item.sha256 for item in definitions())
    return hashlib.sha256(payload.encode("ascii")).hexdigest()


def row_from(case: HairCase, record: EvidenceRecord) -> ReportRow:
    record.validate()
    if not record.definition_id.endswith(case.feature_id.lower()):
        raise ValueError("record definition does not match case feature")
    return ReportRow(
        case_id=case.case_id,
        feature_id=case.feature_id,
        definition_sha256=record.definition_sha256,
        input_sha256=record.input_sha256,
        status=record.status,
        hair_slice=case.hair_slice,
        tone_slice=case.tone_slice,
        metrics=tuple(sorted(record.metrics.items())),
        missing=record.missing,
    )


def coverage(report: HairReport) -> dict[str, object]:
    report.validate()
    features = registry_feature_ids()
    per_feature = {feature: {"total": 0, "tested": 0, "passed": 0, "failed": 0, "not_tested": 0} for feature in features}
    per_slice: dict[str, dict[str, int]] = {}
    for row in report.rows:
        item = per_feature[row.feature_id]
        item["total"] += 1
        item[row.status] += 1
        if row.status != "not_tested":
            item["tested"] += 1
        key = f"hair={row.hair_slice}|tone={row.tone_slice}"
        bucket = per_slice.setdefault(key, {"total": 0, "tested": 0, "passed": 0, "failed": 0, "not_tested": 0})
        bucket["total"] += 1
        bucket[row.status] += 1
        if row.status != "not_tested":
            bucket["tested"] += 1
    feature_coverage = sum(1 for item in per_feature.values() if item["tested"] > 0)
    clean_features = sum(1 for item in per_feature.values() if item["passed"] > 0 and item["failed"] == 0 and item["not_tested"] == 0)
    return {
        "registry_feature_count": len(features),
        "covered_features": feature_coverage,
        "clean_features": clean_features,
        "per_feature": per_feature,
        "per_slice": per_slice,
        "complete": clean_features == len(features),
    }


def minimum_slice_count(report: HairReport) -> int:
    summary = coverage(report)
    slices = summary["per_slice"]
    if not isinstance(slices, dict) or not slices:
        return 0
    return min(int(value["tested"]) for value in slices.values())

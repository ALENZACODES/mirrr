"""Privacy-safe R18B Skin & More evidence reporting. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass

from plumb_api.arena.r17b_evidence import EvidenceRecord

from .realface import SkinCase, definitions, registry_feature_ids

FORMAT = "beljour.r18b.skin.report/1"


@dataclass(frozen=True)
class ReportRow:
    case_id: str
    feature_id: str
    status: str
    depth_slice: str
    definition_sha256: str
    input_sha256: str
    metrics: tuple[tuple[str, float | bool], ...]
    missing: tuple[str, ...]

    def validate(self) -> None:
        if self.feature_id not in registry_feature_ids():
            raise ValueError("unknown skin feature")
        if self.status not in {"passed", "failed", "not_tested"}:
            raise ValueError("invalid status")
        for digest in (self.definition_sha256, self.input_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("invalid sha256")


@dataclass(frozen=True)
class SkinReport:
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
    return hashlib.sha256("\n".join(item.sha256 for item in definitions()).encode("ascii")).hexdigest()


def row_from(case: SkinCase, record: EvidenceRecord) -> ReportRow:
    record.validate()
    return ReportRow(
        case_id=case.case_id,
        feature_id=case.feature_id,
        status=record.status,
        depth_slice=case.depth_slice,
        definition_sha256=record.definition_sha256,
        input_sha256=record.input_sha256,
        metrics=tuple(sorted(record.metrics.items())),
        missing=record.missing,
    )


def coverage(report: SkinReport) -> dict[str, object]:
    report.validate()
    features = registry_feature_ids()
    per_feature = {feature: {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0} for feature in features}
    per_depth: dict[str, dict[str, int]] = {}
    continuity = {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0}
    freckle = {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0}
    for row in report.rows:
        item = per_feature[row.feature_id]
        item[row.status] += 1
        if row.status != "not_tested":
            item["tested"] += 1
        depth = per_depth.setdefault(row.depth_slice, {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0})
        depth[row.status] += 1
        if row.status != "not_tested":
            depth["tested"] += 1
        special = continuity if row.feature_id == "W91" else freckle if row.feature_id == "W90" else None
        if special is not None:
            special[row.status] += 1
            if row.status != "not_tested":
                special["tested"] += 1
    complete = all(item["passed"] > 0 and item["failed"] == 0 and item["not_tested"] == 0 for item in per_feature.values())
    return {
        "registry_feature_count": len(features),
        "per_feature": per_feature,
        "per_depth": per_depth,
        "continuity_w91": continuity,
        "freckle_w90": freckle,
        "complete": bool(report.rows) and complete,
    }

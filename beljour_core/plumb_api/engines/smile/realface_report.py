"""Privacy-safe R18B smile evidence reporting. Author: John Khan."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

from plumb_api.arena.r17b_evidence import EvidenceRecord
from plumb_api.engines.r18b_shared import (
    FeatureReport,
    FeatureReportRow,
    canonical_feature_report,
    validate_feature_report,
)
from plumb_api.engines.r18b_shared import (
    definition_set_sha256 as shared_definition_set_sha256,
)

from .realface import SmileCase, definitions, registry_feature_ids

FORMAT = "beljour.r18b.smile.report/1"


@dataclass(frozen=True)
class ReportRow(FeatureReportRow):
    def validate(self) -> None:
        super().validate()
        if self.feature_id not in registry_feature_ids():
            raise ValueError("unknown smile feature")


@dataclass(frozen=True)
class SmileReport(FeatureReport):
    rows: tuple[ReportRow, ...]

    def validate(self) -> None:
        validate_feature_report(self, registry_feature_ids(), "smile")

    def canonical(self) -> str:
        self.validate()
        return canonical_feature_report(
            FORMAT,
            self,
            definition_hash=definition_set_sha256(),
            registry_features=registry_feature_ids(),
        )

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


def definition_set_sha256() -> str:
    return shared_definition_set_sha256(item.sha256 for item in definitions())


def row_from(case: SmileCase, record: EvidenceRecord) -> ReportRow:
    record.validate()
    return ReportRow(
        case_id=case.case_id,
        feature_id=case.feature_id,
        status=record.status,
        definition_sha256=record.definition_sha256,
        input_sha256=record.input_sha256,
        metrics=tuple(sorted(record.metrics.items())),
        missing=record.missing,
    )


def coverage(report: SmileReport) -> dict[str, object]:
    report.validate()
    features = registry_feature_ids()
    per_feature = {feature: {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0} for feature in features}
    motion = {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0}
    dental = {"tested": 0, "passed": 0, "failed": 0, "not_tested": 0}
    for row in report.rows:
        bucket = per_feature[row.feature_id]
        bucket[row.status] += 1
        if row.status != "not_tested":
            bucket["tested"] += 1
        special = motion if row.feature_id == "W58" else dental
        special[row.status] += 1
        if row.status != "not_tested":
            special["tested"] += 1
    complete_features = sum(
        1
        for bucket in per_feature.values()
        if bucket["passed"] > 0 and bucket["failed"] == 0 and bucket["not_tested"] == 0
    )
    return {
        "registry_feature_count": len(features),
        "complete_features": complete_features,
        "per_feature": per_feature,
        "motion_w58": motion,
        "dental_w50_w53": dental,
        "complete": bool(report.rows) and complete_features == len(features),
    }

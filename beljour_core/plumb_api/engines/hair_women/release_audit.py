"""R18B release audit for women's-hair frozen evidence. Author: John Khan."""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from plumb_api.engines.r18b_shared import parse_int

from .frozen1000 import FrozenManifest, feature_case_counts, required_evaluations
from .frozen_results import ResultLedger, pending, statuses
from .frozen_schedule import Schedule, maximum_prefix_imbalance, slice_counts
from .quality_matrix import definition_metric_matrix, release_candidate
from .realface import registry_feature_ids
from .realface_report import HairReport, coverage, minimum_slice_count


@dataclass(frozen=True)
class AuditIssue:
    code: str
    severity: str
    message: str


@dataclass(frozen=True)
class AuditResult:
    issues: tuple[AuditIssue, ...]
    required_evaluations: int
    completed_evaluations: int
    feature_count: int
    minimum_slice_cases: int
    schedule_prefix_imbalance: int

    @property
    def release_ready(self) -> bool:
        return not any(issue.severity == "block" for issue in self.issues)


def audit(
    manifest: FrozenManifest,
    ledger: ResultLedger,
    report: HairReport,
    schedule: Schedule,
    *,
    minimum_feature_cases: int = 1,
    minimum_slice_cases: int = 1,
) -> AuditResult:
    if minimum_feature_cases < 1 or minimum_slice_cases < 1:
        raise ValueError("minimum case requirements must be positive")
    manifest.validate(require_complete=False)
    ledger.validate(manifest)
    schedule.validate(manifest)
    report.validate()
    issues: list[AuditIssue] = []
    features = registry_feature_ids()
    counts = feature_case_counts(manifest)
    missing_manifest_features = tuple(feature for feature in features if counts[feature] == 0)
    if missing_manifest_features:
        issues.append(AuditIssue("HAIR_MANIFEST_COVERAGE", "block", f"manifest has no cases for {missing_manifest_features}"))
    remaining = pending(manifest, ledger)
    if remaining:
        issues.append(AuditIssue("HAIR_LEDGER_INCOMPLETE", "block", f"{len(remaining)} frozen evaluations remain"))
    state = statuses(ledger)
    if state["failed"]:
        issues.append(AuditIssue("HAIR_FAILED_RESULTS", "block", f"{state['failed']} frozen evaluations failed"))
    if state["not_tested"]:
        issues.append(AuditIssue("HAIR_NOT_TESTED_RESULTS", "block", f"{state['not_tested']} evaluations remain not tested"))
    summary = coverage(report)
    if parse_int(summary["covered_features"], field="covered_features") != len(features):
        issues.append(AuditIssue("HAIR_REPORT_COVERAGE", "block", "privacy-safe report does not cover every registry feature"))
    report_slice_minimum = minimum_slice_count(report)
    if report_slice_minimum < minimum_slice_cases:
        issues.append(AuditIssue("HAIR_SLICE_COVERAGE", "block", f"minimum tested slice count is {report_slice_minimum}"))
    if not release_candidate(report, minimum_cases=minimum_feature_cases, minimum_slice_cases=minimum_slice_cases):
        issues.append(AuditIssue("HAIR_QUALITY_MATRIX", "block", "quality matrix is not release-ready"))
    metrics = definition_metric_matrix()
    missing_rules = tuple(feature for feature in features if not metrics.get(feature))
    if missing_rules:
        issues.append(AuditIssue("HAIR_DEFINITION_RULES", "block", f"features missing metric rules: {missing_rules}"))
    scheduled_counts = slice_counts(schedule)
    manifest_intersections = Counter(f"{case.hair_slice}|{case.tone_slice}" for case in manifest.cases)
    if scheduled_counts["intersection"] != dict(sorted(manifest_intersections.items())):
        issues.append(AuditIssue("HAIR_SCHEDULE_DRIFT", "block", "schedule slice counts differ from manifest"))
    imbalance = maximum_prefix_imbalance(schedule)
    if imbalance > 1:
        issues.append(AuditIssue("HAIR_SCHEDULE_BALANCE", "warn", f"maximum schedule prefix imbalance is {imbalance}"))
    if len(manifest.cases) != manifest.expected_cases:
        issues.append(AuditIssue("HAIR_FROZEN1000_INCOMPLETE", "block", f"manifest contains {len(manifest.cases)} of 1000 required cases"))
    return AuditResult(
        tuple(issues),
        required_evaluations(manifest),
        len(ledger.rows),
        len(features),
        report_slice_minimum,
        imbalance,
    )

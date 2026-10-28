"""R18B release audit for dental and smile evidence. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from .frozen1000 import FrozenManifest, feature_case_counts, required_evaluations
from .frozen_results import ResultLedger, pending, statuses
from .quality_matrix import definition_metric_matrix, release_candidate
from .realface import registry_feature_ids
from .realface_report import SmileReport, coverage


@dataclass(frozen=True)
class AuditResult:
    blockers: tuple[str, ...]
    required: int
    completed: int
    motion_tested: int
    dental_tested: int

    @property
    def release_ready(self) -> bool:
        return not self.blockers


def audit(manifest: FrozenManifest, ledger: ResultLedger, report: SmileReport, minimum_cases: int = 1) -> AuditResult:
    if minimum_cases < 1:
        raise ValueError("minimum_cases must be positive")
    manifest.validate(require_complete=False)
    ledger.validate(manifest)
    report.validate()
    blockers: list[str] = []
    features = registry_feature_ids()
    manifest_counts = feature_case_counts(manifest)
    if any(manifest_counts[feature] < minimum_cases for feature in features):
        blockers.append("SMILE_MANIFEST_COVERAGE")
    if pending(manifest, ledger):
        blockers.append("SMILE_LEDGER_INCOMPLETE")
    state = statuses(ledger)
    if state["failed"]:
        blockers.append("SMILE_FAILED_RESULTS")
    if state["not_tested"]:
        blockers.append("SMILE_NOT_TESTED_RESULTS")
    summary = coverage(report)
    motion = summary["motion_w58"]
    dental = summary["dental_w50_w53"]
    if not isinstance(motion, dict) or not isinstance(dental, dict):
        raise TypeError("invalid smile coverage payload")
    motion_tested = int(motion["tested"])
    dental_tested = int(dental["tested"])
    if motion_tested < minimum_cases or int(motion["failed"]) != 0:
        blockers.append("SMILE_W58_MOTION")
    if dental_tested < minimum_cases or int(dental["failed"]) != 0:
        blockers.append("SMILE_DENTAL_W50_W53")
    if not release_candidate(report, minimum_cases):
        blockers.append("SMILE_QUALITY_MATRIX")
    matrix = definition_metric_matrix()
    if set(matrix) != set(features) or any(not rules for rules in matrix.values()):
        blockers.append("SMILE_DEFINITION_RULES")
    if len(manifest.cases) != manifest.expected_cases:
        blockers.append("SMILE_FROZEN1000_INCOMPLETE")
    return AuditResult(tuple(dict.fromkeys(blockers)), required_evaluations(manifest), len(ledger.rows), motion_tested, dental_tested)

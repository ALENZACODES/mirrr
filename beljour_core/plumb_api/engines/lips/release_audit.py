"""R18B release audit for lip simulation evidence. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from .frozen1000 import FrozenManifest, feature_case_counts, required_evaluations
from .frozen_results import ResultLedger, pending, statuses
from .quality_matrix import definition_metric_matrix, release_candidate
from .realface import registry_feature_ids
from .realface_report import LipReport, coverage


@dataclass(frozen=True)
class AuditResult:
    blocking_codes: tuple[str, ...]
    required: int
    completed: int
    teeth_tested: int
    pigmentation_tested: int

    @property
    def release_ready(self) -> bool:
        return not self.blocking_codes


def audit(manifest: FrozenManifest, ledger: ResultLedger, report: LipReport, *, minimum_cases: int = 1) -> AuditResult:
    if minimum_cases < 1:
        raise ValueError("minimum_cases must be positive")
    manifest.validate(require_complete=False)
    ledger.validate(manifest)
    report.validate()
    codes: list[str] = []
    features = registry_feature_ids()
    case_counts = feature_case_counts(manifest)
    if any(case_counts[feature] < minimum_cases for feature in features):
        codes.append("LIPS_MANIFEST_COVERAGE")
    if pending(manifest, ledger):
        codes.append("LIPS_LEDGER_INCOMPLETE")
    state = statuses(ledger)
    if state["failed"]:
        codes.append("LIPS_FAILED_RESULTS")
    if state["not_tested"]:
        codes.append("LIPS_NOT_TESTED_RESULTS")
    summary = coverage(report)
    teeth = summary["teeth_protection_w54"]
    pigment = summary["pigmentation_w57"]
    if not isinstance(teeth, dict) or not isinstance(pigment, dict):
        raise TypeError("invalid special-feature coverage")
    teeth_tested = int(teeth["tested"])
    pigment_tested = int(pigment["tested"])
    if teeth_tested < minimum_cases or int(teeth["failed"]) != 0:
        codes.append("LIPS_W54_TEETH_PROTECTION")
    if pigment_tested < minimum_cases or int(pigment["failed"]) != 0:
        codes.append("LIPS_W57_PIGMENTATION")
    if not release_candidate(report, minimum_cases):
        codes.append("LIPS_QUALITY_MATRIX")
    matrix = definition_metric_matrix()
    if set(matrix) != set(features) or any(not rules for rules in matrix.values()):
        codes.append("LIPS_DEFINITION_RULES")
    if len(manifest.cases) != manifest.expected_cases:
        codes.append("LIPS_FROZEN1000_INCOMPLETE")
    return AuditResult(tuple(dict.fromkeys(codes)), required_evaluations(manifest), len(ledger.rows), teeth_tested, pigment_tested)

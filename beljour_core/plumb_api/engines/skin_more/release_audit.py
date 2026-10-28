"""R18B Skin & More release audit with depth and special-feature gates. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from .frozen1000 import FrozenManifest, feature_case_counts, required_evaluations
from .frozen_results import ResultLedger, pending, statuses
from .frozen_schedule import Schedule, depth_counts, maximum_prefix_depth_spread
from .quality_matrix import definition_metric_matrix, release_candidate
from .realface import registry_feature_ids
from .realface_report import SkinReport, coverage


@dataclass(frozen=True)
class AuditResult:
    blockers: tuple[str, ...]
    warnings: tuple[str, ...]
    required: int
    completed: int
    depth_counts: tuple[tuple[str, int], ...]

    @property
    def release_ready(self) -> bool:
        return not self.blockers


def audit(
    manifest: FrozenManifest,
    ledger: ResultLedger,
    report: SkinReport,
    schedule: Schedule,
    *,
    minimum_feature_cases: int = 1,
    minimum_depth_cases: int = 1,
) -> AuditResult:
    if minimum_feature_cases < 1 or minimum_depth_cases < 1:
        raise ValueError("minimum case requirements must be positive")
    manifest.validate(require_complete=False)
    ledger.validate(manifest)
    report.validate()
    schedule.validate(manifest)
    blockers: list[str] = []
    warnings: list[str] = []
    features = registry_feature_ids()
    feature_counts = feature_case_counts(manifest)
    if any(feature_counts[feature] < minimum_feature_cases for feature in features):
        blockers.append("SKIN_MANIFEST_FEATURE_COVERAGE")
    if pending(manifest, ledger):
        blockers.append("SKIN_LEDGER_INCOMPLETE")
    state = statuses(ledger)
    if state["failed"]:
        blockers.append("SKIN_FAILED_RESULTS")
    if state["not_tested"]:
        blockers.append("SKIN_NOT_TESTED_RESULTS")
    summary = coverage(report)
    depths = summary["per_depth"]
    if not isinstance(depths, dict):
        raise TypeError("invalid depth payload")
    if not depths or any(int(item["tested"]) < minimum_depth_cases or int(item["failed"]) for item in depths.values()):
        blockers.append("SKIN_DEPTH_COVERAGE")
    continuity = summary["continuity_w91"]
    freckles = summary["freckle_w90"]
    if not isinstance(continuity, dict) or int(continuity["tested"]) < minimum_feature_cases:
        blockers.append("SKIN_W91_CONTINUITY")
    if not isinstance(freckles, dict) or int(freckles["tested"]) < minimum_feature_cases:
        blockers.append("SKIN_W90_FRECKLES")
    if not release_candidate(report, minimum_feature_cases, minimum_depth_cases):
        blockers.append("SKIN_QUALITY_MATRIX")
    matrix = definition_metric_matrix()
    if set(matrix) != set(features) or any(not rules for rules in matrix.values()):
        blockers.append("SKIN_DEFINITION_RULES")
    scheduled_depths = depth_counts(schedule)
    manifest_depths: dict[str, int] = {}
    for case in manifest.cases:
        manifest_depths[case.depth_slice] = manifest_depths.get(case.depth_slice, 0) + 1
    if scheduled_depths != dict(sorted(manifest_depths.items())):
        blockers.append("SKIN_SCHEDULE_DRIFT")
    spread = maximum_prefix_depth_spread(schedule)
    if spread > 1:
        warnings.append(f"SKIN_SCHEDULE_PREFIX_SPREAD:{spread}")
    if len(manifest.cases) != manifest.expected_cases:
        blockers.append("SKIN_FROZEN1000_INCOMPLETE")
    return AuditResult(
        tuple(dict.fromkeys(blockers)),
        tuple(warnings),
        required_evaluations(manifest),
        len(ledger.rows),
        tuple(sorted(scheduled_depths.items())),
    )

"""R18B release audit for makeup frozen evidence and fairness. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from plumb_api.engines.r18b_shared import parse_int

from .frozen1000 import FrozenManifest, feature_case_counts, required_evaluations
from .frozen_results import ResultLedger, pending, statuses
from .frozen_schedule import Schedule, prefix_fairness, slice_counts
from .quality_matrix import definition_metric_matrix, fairness_spreads, release_candidate
from .realface import registry_feature_ids
from .realface_report import MakeupReport, coverage


@dataclass(frozen=True)
class FairnessRequirement:
    minimum_deep_cases: int = 1
    minimum_olive_cases: int = 1
    maximum_pass_rate_spread: float = 0.10

    def validate(self) -> None:
        if self.minimum_deep_cases < 1 or self.minimum_olive_cases < 1:
            raise ValueError("fairness case minima must be positive")
        if not 0 <= self.maximum_pass_rate_spread <= 1:
            raise ValueError("maximum pass-rate spread must be 0..1")


@dataclass(frozen=True)
class AuditIssue:
    code: str
    message: str


@dataclass(frozen=True)
class AuditResult:
    blocking: tuple[AuditIssue, ...]
    warnings: tuple[AuditIssue, ...]
    required_evaluations: int
    completed_evaluations: int
    depth_spread: float | None
    undertone_spread: float | None

    @property
    def release_ready(self) -> bool:
        return not self.blocking


def audit(
    manifest: FrozenManifest,
    ledger: ResultLedger,
    report: MakeupReport,
    schedule: Schedule,
    requirement: FairnessRequirement | None = None,
) -> AuditResult:
    requirement = FairnessRequirement() if requirement is None else requirement
    requirement.validate()
    manifest.validate(require_complete=False)
    ledger.validate(manifest)
    report.validate()
    schedule.validate(manifest)
    blocking: list[AuditIssue] = []
    warnings: list[AuditIssue] = []
    features = registry_feature_ids()
    counts = feature_case_counts(manifest)
    uncovered = tuple(feature for feature in features if counts[feature] == 0)
    if uncovered:
        blocking.append(AuditIssue("MAKEUP_MANIFEST_COVERAGE", f"manifest lacks {uncovered}"))
    remainder = pending(manifest, ledger)
    if remainder:
        blocking.append(AuditIssue("MAKEUP_LEDGER_INCOMPLETE", f"{len(remainder)} evaluations remain"))
    state = statuses(ledger)
    if state["failed"]:
        blocking.append(AuditIssue("MAKEUP_FAILED_RESULTS", f"{state['failed']} evaluations failed"))
    if state["not_tested"]:
        blocking.append(AuditIssue("MAKEUP_NOT_TESTED", f"{state['not_tested']} evaluations are not tested"))
    summary = coverage(report)
    deep_cases = parse_int(summary["deep_cases"], field="deep_cases")
    olive_cases = parse_int(summary["olive_cases"], field="olive_cases")
    if deep_cases < requirement.minimum_deep_cases:
        blocking.append(AuditIssue("MAKEUP_DEEP_COVERAGE", f"only {deep_cases} deep-skin report rows"))
    if olive_cases < requirement.minimum_olive_cases:
        blocking.append(AuditIssue("MAKEUP_OLIVE_COVERAGE", f"only {olive_cases} olive report rows"))
    spreads = fairness_spreads(report)
    for dimension in ("depth", "undertone"):
        spread = spreads[dimension]
        if spread is None:
            blocking.append(AuditIssue(f"MAKEUP_{dimension.upper()}_UNMEASURED", f"{dimension} fairness spread is unmeasured"))
        elif spread > requirement.maximum_pass_rate_spread:
            blocking.append(AuditIssue(f"MAKEUP_{dimension.upper()}_SPREAD", f"{dimension} pass-rate spread is {spread:.4f}"))
    if not release_candidate(report, maximum_pass_rate_spread=requirement.maximum_pass_rate_spread):
        blocking.append(AuditIssue("MAKEUP_QUALITY_MATRIX", "quality matrix is not release-ready"))
    metric_matrix = definition_metric_matrix()
    if any(not metric_matrix.get(feature) for feature in features):
        blocking.append(AuditIssue("MAKEUP_DEFINITION_RULES", "one or more features have no metric rules"))
    counts_by_slice = slice_counts(schedule)
    if not counts_by_slice["depth"] or not counts_by_slice["undertone"]:
        blocking.append(AuditIssue("MAKEUP_SCHEDULE_SLICES", "schedule has no fairness slices"))
    fairness = prefix_fairness(schedule, min(len(schedule.cases), max(1, len(counts_by_slice["intersection"]))))
    if max(fairness.values(), default=0) > 1:
        warnings.append(AuditIssue("MAKEUP_SCHEDULE_PREFIX", f"early schedule spread is {fairness}"))
    if len(manifest.cases) != manifest.expected_cases:
        blocking.append(AuditIssue("MAKEUP_FROZEN1000_INCOMPLETE", f"manifest contains {len(manifest.cases)} cases"))
    return AuditResult(
        tuple(blocking),
        tuple(warnings),
        required_evaluations(manifest),
        len(ledger.rows),
        spreads["depth"],
        spreads["undertone"],
    )

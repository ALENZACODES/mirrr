"""R18B gender-look release audit for levels, directions, and cheek identity. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from plumb_api.engines.r18b_shared import parse_float

from .frozen1000 import FrozenManifest
from .frozen_results import ResultLedger, pending
from .frozen_schedule import Schedule, level_evaluation_counts, maximum_prefix_signature_spread
from .quality_matrix import definition_metric_matrix, direction_spread, level_gates, release_candidate
from .realface import LEVELS
from .realface_report import GenderReport, coverage


@dataclass(frozen=True)
class AuditResult:
    blockers: tuple[str, ...]
    warnings: tuple[str, ...]
    required: int
    completed: int
    maximum_cheek_delta: float
    direction_pass_rate_spread: float | None

    @property
    def release_ready(self) -> bool:
        return not self.blockers


def audit(
    manifest: FrozenManifest,
    ledger: ResultLedger,
    report: GenderReport,
    schedule: Schedule,
    *,
    minimum_level_cases: int = 1,
    maximum_direction_spread: float = 0.10,
) -> AuditResult:
    if minimum_level_cases < 1:
        raise ValueError("minimum_level_cases must be positive")
    if not 0 <= maximum_direction_spread <= 1:
        raise ValueError("maximum_direction_spread must be 0..1")
    manifest.validate(require_complete=False)
    ledger.validate(manifest)
    report.validate()
    schedule.validate(manifest)
    blockers: list[str] = []
    warnings: list[str] = []
    if pending(manifest, ledger):
        blockers.append("GENDER_LEDGER_INCOMPLETE")
    gates = level_gates(report, minimum_level_cases)
    if len(gates) != len(LEVELS) or not all(gate.ready for gate in gates):
        blockers.append("GENDER_LEVEL_COVERAGE")
    summary = coverage(report)
    cheek = parse_float(summary["max_cheek_delta_e_proxy"], field="max_cheek_delta_e_proxy")
    if cheek > 4.0:
        blockers.append("GENDER_CHEEK_DELTA")
    spread = direction_spread(report)
    if spread is None:
        blockers.append("GENDER_DIRECTION_UNMEASURED")
    elif spread > maximum_direction_spread:
        blockers.append("GENDER_DIRECTION_SPREAD")
    if not release_candidate(report, minimum_level_cases, maximum_direction_spread):
        blockers.append("GENDER_QUALITY_MATRIX")
    matrix = definition_metric_matrix()
    if set(matrix) != set(LEVELS) or any(not rules for rules in matrix.values()):
        blockers.append("GENDER_DEFINITION_RULES")
    planned = level_evaluation_counts(schedule)
    manifest_counts = {level: 0 for level in LEVELS}
    for case in manifest.cases:
        for level in case.levels:
            manifest_counts[level] += 1
    if planned != dict(sorted(manifest_counts.items())):
        blockers.append("GENDER_SCHEDULE_DRIFT")
    prefix_spread = maximum_prefix_signature_spread(schedule)
    if prefix_spread > 1:
        warnings.append(f"GENDER_SCHEDULE_PREFIX_SPREAD:{prefix_spread}")
    if len(manifest.cases) != manifest.expected_cases:
        blockers.append("GENDER_FROZEN1000_INCOMPLETE")
    return AuditResult(
        tuple(dict.fromkeys(blockers)),
        tuple(warnings),
        sum(len(case.levels) for case in manifest.cases),
        len(ledger.rows),
        cheek,
        spread,
    )

"""R18B hair real-face quality matrix. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from .realface import definitions, registry_feature_ids
from .realface_report import HairReport, coverage


@dataclass(frozen=True)
class FeatureGate:
    feature_id: str
    tested: int
    passed: int
    failed: int
    not_tested: int
    ready: bool


def feature_gates(report: HairReport, *, minimum_cases: int = 1) -> tuple[FeatureGate, ...]:
    if minimum_cases < 1:
        raise ValueError("minimum_cases must be positive")
    summary = coverage(report)
    raw = summary["per_feature"]
    if not isinstance(raw, dict):
        raise TypeError("invalid coverage payload")
    rows: list[FeatureGate] = []
    for feature_id in registry_feature_ids():
        item = raw[feature_id]
        tested = int(item["tested"])
        passed = int(item["passed"])
        failed = int(item["failed"])
        not_tested = int(item["not_tested"])
        rows.append(
            FeatureGate(
                feature_id,
                tested,
                passed,
                failed,
                not_tested,
                tested >= minimum_cases and passed == tested and failed == 0 and not_tested == 0,
            )
        )
    return tuple(rows)


def definition_metric_matrix() -> dict[str, tuple[str, ...]]:
    return {item.id.split(".")[-1].upper(): tuple(rule.name for rule in item.rules) for item in definitions()}


def missing_features(report: HairReport, *, minimum_cases: int = 1) -> tuple[str, ...]:
    return tuple(row.feature_id for row in feature_gates(report, minimum_cases=minimum_cases) if not row.ready)


def release_candidate(report: HairReport, *, minimum_cases: int = 1, minimum_slice_cases: int = 1) -> bool:
    if minimum_slice_cases < 1:
        raise ValueError("minimum_slice_cases must be positive")
    gates = feature_gates(report, minimum_cases=minimum_cases)
    if not gates or not all(gate.ready for gate in gates):
        return False
    summary = coverage(report)
    slices = summary["per_slice"]
    if not isinstance(slices, dict) or not slices:
        return False
    return all(int(item["tested"]) >= minimum_slice_cases and int(item["failed"]) == 0 for item in slices.values())

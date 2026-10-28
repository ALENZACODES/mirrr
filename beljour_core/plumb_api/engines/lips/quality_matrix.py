"""R18B lip real-face quality matrix. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from .realface import definitions, registry_feature_ids
from .realface_report import LipReport, coverage


@dataclass(frozen=True)
class FeatureGate:
    feature_id: str
    tested: int
    passed: int
    failed: int
    not_tested: int
    ready: bool


def feature_gates(report: LipReport, minimum_cases: int = 1) -> tuple[FeatureGate, ...]:
    if minimum_cases < 1:
        raise ValueError("minimum_cases must be positive")
    summary = coverage(report)
    raw = summary["per_feature"]
    if not isinstance(raw, dict):
        raise TypeError("invalid coverage payload")
    result: list[FeatureGate] = []
    for feature_id in registry_feature_ids():
        item = raw[feature_id]
        tested = int(item["tested"])
        passed = int(item["passed"])
        failed = int(item["failed"])
        not_tested = int(item["not_tested"])
        result.append(
            FeatureGate(
                feature_id,
                tested,
                passed,
                failed,
                not_tested,
                tested >= minimum_cases and passed == tested and failed == 0 and not_tested == 0,
            )
        )
    return tuple(result)


def definition_metric_matrix() -> dict[str, tuple[str, ...]]:
    return {item.id.split(".")[-1].upper(): tuple(rule.name for rule in item.rules) for item in definitions()}


def release_candidate(report: LipReport, minimum_cases: int = 1) -> bool:
    gates = feature_gates(report, minimum_cases)
    if not gates or not all(item.ready for item in gates):
        return False
    summary = coverage(report)
    teeth = summary["teeth_protection_w54"]
    pigment = summary["pigmentation_w57"]
    if not isinstance(teeth, dict) or not isinstance(pigment, dict):
        raise TypeError("invalid special-feature payload")
    return int(teeth["tested"]) >= minimum_cases and int(pigment["tested"]) >= minimum_cases

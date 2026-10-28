"""R18B smile real-face quality matrix. Author: John Khan."""
from __future__ import annotations

from plumb_api.engines.r18b_shared import FeatureGate, build_feature_gates, parse_int

from .realface import definitions, registry_feature_ids
from .realface_report import SmileReport, coverage


def feature_gates(report: SmileReport, minimum_cases: int = 1) -> tuple[FeatureGate, ...]:
    summary = coverage(report)
    return build_feature_gates(summary["per_feature"], registry_feature_ids(), minimum_cases=minimum_cases)


def definition_metric_matrix() -> dict[str, tuple[str, ...]]:
    return {item.id.split(".")[-1].upper(): tuple(rule.name for rule in item.rules) for item in definitions()}


def release_candidate(report: SmileReport, minimum_cases: int = 1) -> bool:
    if not all(item.ready for item in feature_gates(report, minimum_cases)):
        return False
    summary = coverage(report)
    motion = summary["motion_w58"]
    dental = summary["dental_w50_w53"]
    if not isinstance(motion, dict) or not isinstance(dental, dict):
        raise TypeError("invalid special-feature payload")
    return parse_int(motion.get("tested"), field="motion.tested") >= minimum_cases and parse_int(dental.get("tested"), field="dental.tested") >= minimum_cases

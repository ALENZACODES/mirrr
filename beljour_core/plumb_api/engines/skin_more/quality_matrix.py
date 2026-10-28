"""R18B Skin & More real-face quality matrix. Author: John Khan."""
from __future__ import annotations

from plumb_api.engines.r18b_shared import FeatureGate, build_feature_gates, parse_int

from .realface import definitions, registry_feature_ids
from .realface_report import SkinReport, coverage


def feature_gates(report: SkinReport, minimum_cases: int = 1) -> tuple[FeatureGate, ...]:
    summary = coverage(report)
    return build_feature_gates(summary["per_feature"], registry_feature_ids(), minimum_cases=minimum_cases)


def definition_metric_matrix() -> dict[str, tuple[str, ...]]:
    return {item.id.split(".")[-1].upper(): tuple(rule.name for rule in item.rules) for item in definitions()}


def release_candidate(report: SkinReport, minimum_cases: int = 1, minimum_depth_cases: int = 1) -> bool:
    if not all(item.ready for item in feature_gates(report, minimum_cases)):
        return False
    summary = coverage(report)
    depths = summary["per_depth"]
    if not isinstance(depths, dict) or not depths:
        return False
    if not all(parse_int(item.get("tested"), field="tested") >= minimum_depth_cases and parse_int(item.get("failed"), field="failed") == 0 for item in depths.values()):
        return False
    continuity = summary["continuity_w91"]
    freckle = summary["freckle_w90"]
    if not isinstance(continuity, dict) or not isinstance(freckle, dict):
        raise TypeError("invalid special-feature payload")
    return parse_int(continuity.get("tested"), field="continuity.tested") >= minimum_cases and parse_int(freckle.get("tested"), field="freckle.tested") >= minimum_cases

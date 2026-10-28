"""R18B makeup real-face quality matrix. Author: John Khan."""
from __future__ import annotations

from plumb_api.engines.r18b_shared import FeatureGate, build_feature_gates, parse_int

from .realface import definitions, registry_feature_ids
from .realface_report import MakeupReport, coverage, pass_rate_spread


def feature_gates(report: MakeupReport, *, minimum_cases: int = 1) -> tuple[FeatureGate, ...]:
    summary = coverage(report)
    return build_feature_gates(summary["per_feature"], registry_feature_ids(), minimum_cases=minimum_cases)


def definition_metric_matrix() -> dict[str, tuple[str, ...]]:
    return {item.id.split(".")[-1].upper(): tuple(rule.name for rule in item.rules) for item in definitions()}


def fairness_spreads(report: MakeupReport) -> dict[str, float | None]:
    summary = coverage(report)
    depth = summary["depth_pass_rates"]
    undertone = summary["undertone_pass_rates"]
    if not isinstance(depth, dict) or not isinstance(undertone, dict):
        raise TypeError("invalid pass-rate payload")
    return {"depth": pass_rate_spread(depth), "undertone": pass_rate_spread(undertone)}


def release_candidate(report: MakeupReport, *, minimum_cases: int = 1, maximum_pass_rate_spread: float = 0.10) -> bool:
    if not 0 <= maximum_pass_rate_spread <= 1:
        raise ValueError("maximum_pass_rate_spread must be 0..1")
    if not all(gate.ready for gate in feature_gates(report, minimum_cases=minimum_cases)):
        return False
    summary = coverage(report)
    if parse_int(summary["deep_cases"], field="deep_cases") < minimum_cases or parse_int(summary["olive_cases"], field="olive_cases") < minimum_cases:
        return False
    spreads = fairness_spreads(report)
    measured = [value for value in spreads.values() if value is not None]
    return bool(measured) and all(value <= maximum_pass_rate_spread for value in measured)

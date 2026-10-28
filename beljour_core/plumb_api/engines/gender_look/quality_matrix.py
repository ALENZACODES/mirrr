"""R18B gender full-look real-face quality matrix. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from plumb_api.engines.r18b_shared import parse_float

from .realface import LEVELS, definitions
from .realface_report import GenderReport, coverage


@dataclass(frozen=True)
class LevelGate:
    level: str
    tested: int
    failed: int
    not_tested: int
    ready: bool


def level_gates(report: GenderReport, minimum_cases: int = 1) -> tuple[LevelGate, ...]:
    if minimum_cases < 1:
        raise ValueError("minimum_cases must be positive")
    summary = coverage(report)
    raw = summary["per_level"]
    if not isinstance(raw, dict):
        raise TypeError("invalid coverage payload")
    result: list[LevelGate] = []
    for level in LEVELS:
        item = raw[level]
        tested = int(item["tested"])
        failed = int(item["failed"])
        not_tested = int(item["not_tested"])
        result.append(LevelGate(level, tested, failed, not_tested, tested >= minimum_cases and failed == 0 and not_tested == 0))
    return tuple(result)


def definition_metric_matrix() -> dict[str, tuple[str, ...]]:
    return {item.id.rsplit(".", 1)[-1]: tuple(rule.name for rule in item.rules) for item in definitions()}


def direction_spread(report: GenderReport) -> float | None:
    summary = coverage(report)
    rates = summary["direction_pass_rates"]
    if not isinstance(rates, dict):
        raise TypeError("invalid direction-rate payload")
    measured = [float(value) for value in rates.values() if value is not None]
    if len(measured) < 2:
        return None
    return max(measured) - min(measured)


def release_candidate(report: GenderReport, minimum_cases: int = 1, maximum_direction_spread: float = 0.10) -> bool:
    if not 0 <= maximum_direction_spread <= 1:
        raise ValueError("maximum_direction_spread must be 0..1")
    if not all(item.ready for item in level_gates(report, minimum_cases)):
        return False
    summary = coverage(report)
    if parse_float(summary["max_cheek_delta_e_proxy"], field="max_cheek_delta_e_proxy") > 4.0:
        return False
    spread = direction_spread(report)
    return spread is not None and spread <= maximum_direction_spread

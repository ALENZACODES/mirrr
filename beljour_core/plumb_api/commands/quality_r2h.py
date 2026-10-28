"""Written acceptance definitions for cleanup and upscale, not release passes.

Definitions are consumed read-only from a committed path. The local hook
measures synthetic diagnostics and distinguishes missing reference evidence
from a true FAIL. Only the external frozen runner can authorize real faces.
Author: John Khan.
"""

from __future__ import annotations

import json
import math
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from .errors import CommandValidationError

GateResult = Literal["pass", "fail", "unproven"]


@dataclass(frozen=True, slots=True)
class MetricThreshold:
    name: str
    comparator: Literal["at_most", "at_least"]
    threshold: float
    unit: str

    def __post_init__(self) -> None:
        if not self.name or not self.unit:
            raise CommandValidationError("invalid_gate_definition", "Metrics must have names and units.")
        if self.comparator not in ("at_least", "at_most"):
            raise CommandValidationError("invalid_gate_definition", "Metric comparison must be supported.")
        if not math.isfinite(self.threshold):
            raise CommandValidationError("invalid_gate_definition", "Metric threshold must be finite.")

    def passes(self, observed: float) -> bool:
        if not math.isfinite(observed):
            return False
        if self.comparator == "at_least":
            return observed >= self.threshold
        return observed <= self.threshold


@dataclass(frozen=True, slots=True)
class CommandGateDefinition:
    key: Literal["cleanup", "upscale"]
    version: str
    minimum_faces: int
    metrics: tuple[MetricThreshold, ...]
    required_labels: tuple[str, ...]
    assumptions: bool

    def __post_init__(self) -> None:
        if self.version != "beljour-pro-realface/1":
            raise CommandValidationError("invalid_gate_definition", "Unrecognized written gate version.")
        if type(self.minimum_faces) is not int or self.minimum_faces < 100_000:
            raise CommandValidationError("invalid_gate_definition", "Real-face gate requires 100,000 cases.")
        if not self.metrics or len({metric.name for metric in self.metrics}) != len(self.metrics):
            raise CommandValidationError("invalid_gate_definition", "Metrics must be unique and nonempty.")
        if not self.required_labels or not self.assumptions:
            raise CommandValidationError("invalid_gate_definition", "Assumed gates require written labels.")


@dataclass(frozen=True, slots=True)
class GateObservation:
    outcome: GateResult
    checked: int
    incomplete: tuple[str, ...]
    failed: tuple[str, ...]
    realface_pass: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "outcome": self.outcome,
            "checked": self.checked,
            "incomplete": list(self.incomplete),
            "failed": list(self.failed),
            "realface_pass": False,
        }


def decode_definition(raw: object) -> CommandGateDefinition:
    if not isinstance(raw, dict):
        raise CommandValidationError("invalid_gate_definition", "Expected one written gate object.")
    fields = {"version", "command", "minimum_faces", "metrics", "required_labels", "assumptions"}
    if set(raw) != fields or raw["command"] not in ("cleanup", "upscale"):
        raise CommandValidationError("invalid_gate_definition", "Unexpected written gate fields.")
    values = raw["metrics"]
    labels = raw["required_labels"]
    if not isinstance(values, list) or not isinstance(labels, list):
        raise CommandValidationError("invalid_gate_definition", "Gate lists must be explicit.")
    metrics: list[MetricThreshold] = []
    for record in values:
        if not isinstance(record, dict) or set(record) != {"name", "comparison", "threshold", "unit"}:
            raise CommandValidationError("invalid_gate_definition", "Metric has invalid fields.")
        if type(record["threshold"]) not in (int, float):
            raise CommandValidationError("invalid_gate_definition", "Metric threshold is not numeric.")
        metrics.append(MetricThreshold(
            str(record["name"]), record["comparison"], float(record["threshold"]), str(record["unit"]),
        ))
    if not all(isinstance(label, str) and label for label in labels):
        raise CommandValidationError("invalid_gate_definition", "All gate labels must be named.")
    return CommandGateDefinition(
        raw["command"], raw["version"], raw["minimum_faces"],
        tuple(metrics), tuple(labels), raw["assumptions"],
    )


def load_definition(path: Path) -> CommandGateDefinition:
    if not isinstance(path, Path) or not path.is_file() or path.stat().st_size > 16384:
        raise CommandValidationError("invalid_gate_definition", "Written gate file is missing or too large.")
    try:
        content = json.loads(path.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        raise CommandValidationError("invalid_gate_definition", "Written gate JSON is invalid.") from None
    return decode_definition(content)


def evaluate_local_metrics(
    definition: CommandGateDefinition,
    measured: Mapping[str, float | int | None],
    *,
    external_verified: bool = False,
    sample_count: int = 0,
) -> GateObservation:
    """Test harness hook, never an independent release authorization."""
    if not isinstance(definition, CommandGateDefinition) or type(external_verified) is not bool:
        raise CommandValidationError("invalid_gate_input", "Gate requires a typed definition.")
    if type(sample_count) is not int or sample_count < 0:
        raise CommandValidationError("invalid_gate_input", "Gate sample count must be nonnegative.")
    incomplete: list[str] = []
    failed: list[str] = []
    checked = 0
    for metric in definition.metrics:
        value = measured.get(metric.name)
        if value is None or isinstance(value, bool) or not isinstance(value, (float, int)):
            incomplete.append(metric.name)
            continue
        checked += 1
        if not metric.passes(float(value)):
            failed.append(metric.name)
    if not external_verified or sample_count < definition.minimum_faces:
        incomplete.append("frozen_realface_run_not_verified")
    status: GateResult = "fail" if failed else "unproven"
    return GateObservation(status, checked, tuple(incomplete), tuple(failed))

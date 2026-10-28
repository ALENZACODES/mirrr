"""Versioned acceptance definitions for five Pro processing quality categories.

Only an external immutable 100,000-face runner can qualify a release. This
library reads definitions and emits structured, photo-free diagnostics. Missing
or incomplete evidence never turns into success.
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

GateKind = Literal["enhance", "denoise", "upscale", "studioquality", "poseonly"]
Outcome = Literal["fail", "unproven"]


@dataclass(frozen=True, slots=True)
class R3HMetricLimit:
    name: str
    comparator: Literal["at_least", "at_most"]
    threshold: float
    unit: str

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name or len(self.name) > 80:
            raise CommandValidationError("invalid_gate_definition", "Gate metric names must be bounded.")
        if self.comparator not in ("at_least", "at_most"):
            raise CommandValidationError("invalid_gate_definition", "Gate comparator is not recognized.")
        if not isinstance(self.unit, str) or not self.unit or len(self.unit) > 40:
            raise CommandValidationError("invalid_gate_definition", "Gate metric requires units.")
        if not math.isfinite(self.threshold):
            raise CommandValidationError("invalid_gate_definition", "Gate threshold must be finite.")

    def accepts(self, number: float) -> bool:
        if not math.isfinite(number):
            return False
        return (number >= self.threshold if self.comparator == "at_least"
                else number <= self.threshold)


@dataclass(frozen=True, slots=True)
class R3HDefinition:
    version: str
    command: GateKind
    minimum_faces: int
    required_labels: tuple[str, ...]
    metrics: tuple[R3HMetricLimit, ...]
    assumptions: bool

    def __post_init__(self) -> None:
        if self.version != "beljour-pro-quality-gate/1":
            raise CommandValidationError("invalid_gate_definition", "Unrecognized quality gate version.")
        if self.command not in ("enhance", "denoise", "upscale", "studioquality", "poseonly"):
            raise CommandValidationError("invalid_gate_definition", "Unknown Pro quality category.")
        if type(self.minimum_faces) is not int or self.minimum_faces < 100_000:
            raise CommandValidationError(
                "invalid_gate_definition", "Gate requires frozen 100,000 faces.",
            )
        if not self.required_labels or len(set(self.required_labels)) != len(self.required_labels):
            raise CommandValidationError("invalid_gate_definition", "Required label names are missing.")
        if not self.metrics or len({entry.name for entry in self.metrics}) != len(self.metrics):
            raise CommandValidationError("invalid_gate_definition", "Quality metrics must be unique.")
        if self.assumptions is not True:
            raise CommandValidationError(
                "invalid_gate_definition", "Calibration assumptions must be stated.",
            )


@dataclass(frozen=True, slots=True)
class R3HGateFinding:
    command: GateKind
    outcome: Outcome
    inspected: int
    missing: tuple[str, ...]
    failed: tuple[str, ...]
    frozen_faces: int
    realface_pass: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "command": self.command,
            "outcome": self.outcome,
            "inspected": self.inspected,
            "missing": list(self.missing),
            "failed": list(self.failed),
            "frozen_faces": self.frozen_faces,
            "realface_pass": False,
        }


def _metric(raw: object) -> R3HMetricLimit:
    if not isinstance(raw, dict) or set(raw) != {"name", "comparison", "threshold", "unit"}:
        raise CommandValidationError("invalid_gate_definition", "Metric schema fields are invalid.")
    if type(raw["threshold"]) not in (int, float):
        raise CommandValidationError("invalid_gate_definition", "Metric threshold must be numeric.")
    return R3HMetricLimit(
        raw["name"], raw["comparison"], float(raw["threshold"]), raw["unit"],
    )


def decode_r3h_definition(raw: object) -> R3HDefinition:
    keys = {"version", "command", "minimum_faces", "required_labels", "metrics", "assumptions"}
    if not isinstance(raw, dict) or set(raw) != keys:
        raise CommandValidationError("invalid_gate_definition", "Definition fields are incomplete.")
    metrics = raw["metrics"]
    labels = raw["required_labels"]
    if not isinstance(metrics, list) or not isinstance(labels, list):
        raise CommandValidationError("invalid_gate_definition", "Gate labels and metrics must be lists.")
    if not all(isinstance(label, str) and 1 <= len(label) <= 60 for label in labels):
        raise CommandValidationError("invalid_gate_definition", "Gate labels are malformed.")
    if len(metrics) > 24 or len(labels) > 24:
        raise CommandValidationError("invalid_gate_definition", "Gate list is too large.")
    return R3HDefinition(
        raw["version"], raw["command"], raw["minimum_faces"],
        tuple(labels), tuple(_metric(item) for item in metrics), raw["assumptions"],
    )


def load_r3h_definition(path: Path) -> R3HDefinition:
    if not isinstance(path, Path) or not path.is_file() or path.stat().st_size > 20_000:
        raise CommandValidationError(
            "invalid_gate_definition", "Quality definition is missing or oversized.",
        )
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        raise CommandValidationError("invalid_gate_definition", "Gate JSON cannot be read.") from None
    return decode_r3h_definition(raw)


def evaluate_r3h_gate(
    definition: R3HDefinition,
    measurements: Mapping[str, float | int | None],
    *,
    declared_labels: tuple[str, ...] = (),
    face_count: int = 0,
    locked_external_evidence: bool = False,
) -> R3HGateFinding:
    """Always report UNPROVEN or FAIL; an external gate owns the final PASS."""
    if not isinstance(definition, R3HDefinition) or type(face_count) is not int or face_count < 0:
        raise CommandValidationError("invalid_gate_input", "Gate inputs must be typed and nonnegative.")
    if type(locked_external_evidence) is not bool:
        raise CommandValidationError("invalid_gate_input", "External evidence flag must be boolean.")
    incomplete: list[str] = []
    failed: list[str] = []
    inspected = 0
    for limit in definition.metrics:
        value = measurements.get(limit.name)
        if value is None or type(value) not in (int, float) or not math.isfinite(float(value)):
            incomplete.append(limit.name)
            continue
        inspected += 1
        if not limit.accepts(float(value)):
            failed.append(limit.name)
    for label in definition.required_labels:
        if label not in declared_labels:
            incomplete.append(f"label:{label}")
    if not locked_external_evidence or face_count < definition.minimum_faces:
        incomplete.append("frozen_realface_evidence_unverified")
    else:
        # The external runner must still assess demographic slices and human review.
        incomplete.append("external_release_verdict_not_supplied")
    return R3HGateFinding(
        definition.command, "fail" if failed else "unproven",
        inspected, tuple(incomplete), tuple(failed), face_count,
    )

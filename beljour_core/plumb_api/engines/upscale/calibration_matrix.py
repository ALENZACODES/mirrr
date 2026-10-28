"""R18B cross-device calibration matrix for local classical upscale. Author: John Khan.

This module combines privacy-safe device profiles into a conservative planning
envelope. It intentionally stores only aggregate timings and memory estimates;
it does not contain browser fingerprints, hardware serials, user identifiers,
photos, masks, landmarks, filenames, or network telemetry.
"""
from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from typing import Literal

from .device_profile import DeviceProfile, Mode, confidence, conservative_rate
from .planner import DeviceBudget, Plan, choose

DeviceClass = Literal["entry", "mid", "high"]
DEVICE_CLASSES: tuple[DeviceClass, ...] = ("entry", "mid", "high")
SCHEMA = "beljour.r18b.upscale-calibration-matrix.v1"


@dataclass(frozen=True)
class ClassifiedProfile:
    device_class: DeviceClass
    profile: DeviceProfile

    def validate(self) -> None:
        if self.device_class not in DEVICE_CLASSES:
            raise ValueError("unsupported device class")
        self.profile.validate()


@dataclass(frozen=True)
class RateEnvelope:
    mode: Mode
    profile_count: int
    minimum_ms_per_mp: float
    median_ms_per_mp: float
    maximum_ms_per_mp: float
    conservative_ms_per_mp: float
    maximum_observed_peak_mb: float
    low_confidence_profiles: int

    def validate(self) -> None:
        if self.mode not in {"preview", "export"}:
            raise ValueError("unsupported mode")
        if self.profile_count < 1:
            raise ValueError("profile_count must be positive")
        values = (
            self.minimum_ms_per_mp,
            self.median_ms_per_mp,
            self.maximum_ms_per_mp,
            self.conservative_ms_per_mp,
            self.maximum_observed_peak_mb,
        )
        if any(not math.isfinite(value) or value <= 0 for value in values):
            raise ValueError("rate envelope values must be positive finite")
        if not self.minimum_ms_per_mp <= self.median_ms_per_mp <= self.maximum_ms_per_mp:
            raise ValueError("rate envelope ordering is invalid")
        if self.conservative_ms_per_mp < self.maximum_ms_per_mp:
            raise ValueError("conservative rate cannot be below maximum observed rate")
        if not 0 <= self.low_confidence_profiles <= self.profile_count:
            raise ValueError("invalid low-confidence count")


@dataclass(frozen=True)
class MatrixPlan:
    plan: Plan
    mode: Mode
    envelope: RateEnvelope
    memory_margin_mb: float
    time_margin_ms: float
    ready_for_target: bool
    blockers: tuple[str, ...]

    def validate(self) -> None:
        self.plan.validate()
        self.envelope.validate()
        if self.mode != self.envelope.mode:
            raise ValueError("plan mode and envelope mode differ")
        if not math.isfinite(self.memory_margin_mb) or not math.isfinite(self.time_margin_ms):
            raise ValueError("margins must be finite")
        expected_ready = not self.blockers and self.memory_margin_mb >= 0 and self.time_margin_ms >= 0
        if self.ready_for_target != expected_ready:
            raise ValueError("ready_for_target is inconsistent with blockers or margins")


@dataclass(frozen=True)
class CalibrationMatrix:
    profiles: tuple[ClassifiedProfile, ...]
    schema: str = SCHEMA

    def validate(self) -> None:
        if self.schema != SCHEMA:
            raise ValueError("unsupported calibration matrix schema")
        if not self.profiles:
            raise ValueError("calibration matrix requires profiles")
        for item in self.profiles:
            item.validate()
        classes = {item.device_class for item in self.profiles}
        if not classes:
            raise ValueError("calibration matrix has no device classes")

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()

    def canonical(self) -> str:
        self.validate()
        rows = []
        for item in sorted(self.profiles, key=lambda entry: (entry.device_class, entry.profile.profile_sha256)):
            rows.append(
                {
                    "device_class": item.device_class,
                    "profile_sha256": item.profile.profile_sha256,
                    "sample_count": item.profile.sample_count,
                    "observed_peak_mb": round(item.profile.observed_peak_mb, 6),
                }
            )
        payload = {"schema": self.schema, "profiles": rows}
        return json.dumps(payload, sort_keys=True, separators=(",", ":"), allow_nan=False)


def _median(values: tuple[float, ...]) -> float:
    ordered = sorted(values)
    midpoint = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[midpoint]
    return (ordered[midpoint - 1] + ordered[midpoint]) * 0.5


def envelope(matrix: CalibrationMatrix, mode: Mode) -> RateEnvelope:
    matrix.validate()
    rates: list[float] = []
    low_confidence = 0
    peaks: list[float] = []
    for item in matrix.profiles:
        rate, _ = conservative_rate(item.profile, mode)
        rates.append(rate)
        peaks.append(item.profile.observed_peak_mb)
        if confidence(item.profile, mode) == "low":
            low_confidence += 1
    values = tuple(rates)
    maximum = max(values)
    # A 5% scheduling margin covers small run-to-run noise without claiming a
    # device benchmark that was not measured.
    conservative = maximum * 1.05
    result = RateEnvelope(
        mode=mode,
        profile_count=len(values),
        minimum_ms_per_mp=min(values),
        median_ms_per_mp=_median(values),
        maximum_ms_per_mp=maximum,
        conservative_ms_per_mp=conservative,
        maximum_observed_peak_mb=max(peaks),
        low_confidence_profiles=low_confidence,
    )
    result.validate()
    return result


def coverage(matrix: CalibrationMatrix) -> dict[str, object]:
    matrix.validate()
    per_class = {name: 0 for name in DEVICE_CLASSES}
    for item in matrix.profiles:
        per_class[item.device_class] += 1
    return {
        "profile_count": len(matrix.profiles),
        "per_device_class": per_class,
        "covered_classes": sum(count > 0 for count in per_class.values()),
        "complete_class_coverage": all(count > 0 for count in per_class.values()),
        "matrix_sha256": matrix.sha256,
    }


def plan_for_matrix(
    matrix: CalibrationMatrix,
    *,
    width: int,
    height: int,
    scale: int,
    budget: DeviceBudget,
    mode: Mode,
) -> MatrixPlan:
    matrix.validate()
    budget.validate()
    rate_envelope = envelope(matrix, mode)
    selected = choose(
        width,
        height,
        scale,
        budget,
        milliseconds_per_output_mp=rate_envelope.conservative_ms_per_mp,
        preview=mode == "preview",
    )
    memory_margin = budget.maximum_peak_mb - selected.estimated_peak_mb
    deadline = budget.target_preview_ms if mode == "preview" else budget.target_export_ms
    time_margin = deadline - selected.estimated_ms
    blockers: list[str] = []
    class_coverage = coverage(matrix)
    if not bool(class_coverage["complete_class_coverage"]):
        blockers.append("DEVICE_CLASS_COVERAGE_INCOMPLETE")
    if rate_envelope.low_confidence_profiles:
        blockers.append("LOW_CONFIDENCE_PROFILE_PRESENT")
    if memory_margin < 0:
        blockers.append("MEMORY_BUDGET_EXCEEDED")
    if time_margin < 0:
        blockers.append("TIME_BUDGET_EXCEEDED")
    result = MatrixPlan(
        plan=selected,
        mode=mode,
        envelope=rate_envelope,
        memory_margin_mb=memory_margin,
        time_margin_ms=time_margin,
        ready_for_target=not blockers and memory_margin >= 0 and time_margin >= 0,
        blockers=tuple(blockers),
    )
    result.validate()
    return result


def compare_matrices(baseline: CalibrationMatrix, candidate: CalibrationMatrix, mode: Mode) -> dict[str, float | bool]:
    left = envelope(baseline, mode)
    right = envelope(candidate, mode)
    delta = right.conservative_ms_per_mp - left.conservative_ms_per_mp
    ratio = right.conservative_ms_per_mp / left.conservative_ms_per_mp
    memory_delta = right.maximum_observed_peak_mb - left.maximum_observed_peak_mb
    return {
        "baseline_ms_per_mp": left.conservative_ms_per_mp,
        "candidate_ms_per_mp": right.conservative_ms_per_mp,
        "delta_ms_per_mp": delta,
        "ratio": ratio,
        "improved": ratio < 1.0,
        "memory_delta_mb": memory_delta,
        "memory_not_worse": memory_delta <= 0.0,
    }


def privacy_safe_summary(matrix: CalibrationMatrix) -> dict[str, object]:
    matrix.validate()
    preview = envelope(matrix, "preview")
    export = envelope(matrix, "export")
    return {
        "schema": matrix.schema,
        "matrix_sha256": matrix.sha256,
        "coverage": coverage(matrix),
        "preview": {
            "profiles": preview.profile_count,
            "median_ms_per_mp": round(preview.median_ms_per_mp, 4),
            "conservative_ms_per_mp": round(preview.conservative_ms_per_mp, 4),
        },
        "export": {
            "profiles": export.profile_count,
            "median_ms_per_mp": round(export.median_ms_per_mp, 4),
            "conservative_ms_per_mp": round(export.conservative_ms_per_mp, 4),
        },
        "contains_pixels": False,
        "contains_masks": False,
        "contains_landmarks": False,
        "contains_device_identifier": False,
        "network_required": False,
    }

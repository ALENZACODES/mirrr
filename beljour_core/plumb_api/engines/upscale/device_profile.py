"""R18B local device calibration for classical upscale planning. Author: John Khan.

The profile is intentionally local and numerical. It stores no image, mask,
landmark, account identifier, or remote telemetry. Samples describe only image
geometry, scale, elapsed time and peak working-set estimates from the caller.
"""
from __future__ import annotations

import hashlib
import json
import math
import statistics
from dataclasses import dataclass
from typing import Literal

from .planner import DeviceBudget, Plan, choose, output_megapixels

Mode = Literal["preview", "export"]
SCHEMA = "beljour.r18b.upscale-device-profile.v1"


@dataclass(frozen=True)
class TimingSample:
    width: int
    height: int
    scale: int
    elapsed_ms: float
    peak_mb: float
    mode: Mode

    def validate(self) -> None:
        if self.width < 32 or self.height < 32:
            raise ValueError("sample dimensions must be at least 32 pixels")
        if self.scale not in (2, 4):
            raise ValueError("sample scale must be 2 or 4")
        if not math.isfinite(self.elapsed_ms) or self.elapsed_ms <= 0:
            raise ValueError("elapsed_ms must be positive finite")
        if not math.isfinite(self.peak_mb) or self.peak_mb <= 0:
            raise ValueError("peak_mb must be positive finite")
        if self.mode not in {"preview", "export"}:
            raise ValueError("unsupported sample mode")

    @property
    def output_mp(self) -> float:
        self.validate()
        return output_megapixels(self.width, self.height, self.scale)

    @property
    def milliseconds_per_output_mp(self) -> float:
        return self.elapsed_ms / self.output_mp


@dataclass(frozen=True)
class RobustRate:
    sample_count: int
    kept_count: int
    median_ms_per_mp: float
    mad_ms_per_mp: float
    p90_ms_per_mp: float
    minimum_ms_per_mp: float
    maximum_ms_per_mp: float

    def validate(self) -> None:
        if self.sample_count < 1 or self.kept_count < 1:
            raise ValueError("rate requires samples")
        if self.kept_count > self.sample_count:
            raise ValueError("kept_count cannot exceed sample_count")
        values = (
            self.median_ms_per_mp,
            self.mad_ms_per_mp,
            self.p90_ms_per_mp,
            self.minimum_ms_per_mp,
            self.maximum_ms_per_mp,
        )
        if any(not math.isfinite(value) or value < 0 for value in values):
            raise ValueError("rate fields must be finite and non-negative")
        if self.minimum_ms_per_mp > self.maximum_ms_per_mp:
            raise ValueError("minimum exceeds maximum")


@dataclass(frozen=True)
class DeviceProfile:
    schema: str
    preview_rate: RobustRate | None
    export_rate: RobustRate | None
    observed_peak_mb: float
    sample_count: int
    profile_sha256: str

    def validate(self) -> None:
        if self.schema != SCHEMA:
            raise ValueError("unsupported profile schema")
        if self.sample_count < 1:
            raise ValueError("profile requires samples")
        if not math.isfinite(self.observed_peak_mb) or self.observed_peak_mb <= 0:
            raise ValueError("observed_peak_mb must be positive finite")
        if self.preview_rate is None and self.export_rate is None:
            raise ValueError("profile needs preview or export samples")
        if self.preview_rate is not None:
            self.preview_rate.validate()
        if self.export_rate is not None:
            self.export_rate.validate()
        if len(self.profile_sha256) != 64:
            raise ValueError("profile_sha256 must be SHA-256 hex")


@dataclass(frozen=True)
class CalibrationDecision:
    plan: Plan
    source_mode: Mode
    rate_ms_per_mp: float
    confidence: Literal["high", "medium", "low"]
    reasons: tuple[str, ...]

    def validate(self) -> None:
        self.plan.validate()
        if self.source_mode not in {"preview", "export"}:
            raise ValueError("unsupported source mode")
        if not math.isfinite(self.rate_ms_per_mp) or self.rate_ms_per_mp <= 0:
            raise ValueError("rate must be positive finite")
        if self.confidence not in {"high", "medium", "low"}:
            raise ValueError("invalid confidence")
        if not self.reasons:
            raise ValueError("decision requires reasons")


def _percentile(values: tuple[float, ...], quantile: float) -> float:
    if not values:
        raise ValueError("percentile requires values")
    if not 0 <= quantile <= 1:
        raise ValueError("quantile must be 0..1")
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * quantile
    lower = int(math.floor(position))
    upper = int(math.ceil(position))
    if lower == upper:
        return ordered[lower]
    weight = position - lower
    return ordered[lower] * (1.0 - weight) + ordered[upper] * weight


def _robust_rate(samples: tuple[TimingSample, ...]) -> RobustRate | None:
    if not samples:
        return None
    rates = tuple(sample.milliseconds_per_output_mp for sample in samples)
    median = statistics.median(rates)
    deviations = tuple(abs(value - median) for value in rates)
    mad = statistics.median(deviations)
    if mad <= 1e-12:
        kept = rates
    else:
        threshold = 4.5 * mad
        kept = tuple(value for value in rates if abs(value - median) <= threshold)
        if not kept:
            kept = rates
    result = RobustRate(
        sample_count=len(rates),
        kept_count=len(kept),
        median_ms_per_mp=float(statistics.median(kept)),
        mad_ms_per_mp=float(statistics.median(abs(value - statistics.median(kept)) for value in kept)),
        p90_ms_per_mp=float(_percentile(kept, 0.90)),
        minimum_ms_per_mp=float(min(kept)),
        maximum_ms_per_mp=float(max(kept)),
    )
    result.validate()
    return result


def _canonical_payload(samples: tuple[TimingSample, ...]) -> bytes:
    rows = []
    for sample in sorted(
        samples,
        key=lambda item: (item.mode, item.scale, item.width, item.height, item.elapsed_ms, item.peak_mb),
    ):
        rows.append(
            {
                "width": sample.width,
                "height": sample.height,
                "scale": sample.scale,
                "elapsed_ms": round(sample.elapsed_ms, 6),
                "peak_mb": round(sample.peak_mb, 6),
                "mode": sample.mode,
            }
        )
    return json.dumps(rows, sort_keys=True, separators=(",", ":")).encode("utf-8")


def build_profile(samples: tuple[TimingSample, ...]) -> DeviceProfile:
    if not samples:
        raise ValueError("at least one timing sample is required")
    for sample in samples:
        sample.validate()
    preview = tuple(sample for sample in samples if sample.mode == "preview")
    export = tuple(sample for sample in samples if sample.mode == "export")
    profile = DeviceProfile(
        schema=SCHEMA,
        preview_rate=_robust_rate(preview),
        export_rate=_robust_rate(export),
        observed_peak_mb=float(max(sample.peak_mb for sample in samples)),
        sample_count=len(samples),
        profile_sha256=hashlib.sha256(_canonical_payload(samples)).hexdigest(),
    )
    profile.validate()
    return profile


def conservative_rate(profile: DeviceProfile, mode: Mode) -> tuple[float, str]:
    profile.validate()
    preferred = profile.preview_rate if mode == "preview" else profile.export_rate
    alternate = profile.export_rate if mode == "preview" else profile.preview_rate
    if preferred is not None:
        return (max(preferred.p90_ms_per_mp, preferred.median_ms_per_mp), "matching-mode p90")
    if alternate is None:
        raise ValueError("profile has no usable rate")
    penalty = 1.15 if mode == "preview" else 1.10
    return (max(alternate.p90_ms_per_mp, alternate.median_ms_per_mp) * penalty, "cross-mode p90 with safety penalty")


def confidence(profile: DeviceProfile, mode: Mode) -> Literal["high", "medium", "low"]:
    profile.validate()
    rate = profile.preview_rate if mode == "preview" else profile.export_rate
    if rate is None:
        return "low"
    if rate.kept_count >= 7 and rate.kept_count / rate.sample_count >= 0.8:
        spread = 0.0 if rate.median_ms_per_mp <= 1e-12 else rate.mad_ms_per_mp / rate.median_ms_per_mp
        return "high" if spread <= 0.12 else "medium"
    if rate.kept_count >= 3:
        return "medium"
    return "low"


def decide(
    width: int,
    height: int,
    scale: int,
    budget: DeviceBudget,
    profile: DeviceProfile,
    *,
    mode: Mode,
) -> CalibrationDecision:
    rate, source = conservative_rate(profile, mode)
    plan = choose(
        width,
        height,
        scale,
        budget,
        milliseconds_per_output_mp=rate,
        preview=mode == "preview",
    )
    level = confidence(profile, mode)
    reasons = [source, f"profile confidence {level}"]
    if profile.observed_peak_mb > budget.maximum_peak_mb:
        reasons.append("observed calibration peak exceeds requested memory budget")
    if "not met" in plan.reason:
        reasons.append(plan.reason)
    decision = CalibrationDecision(
        plan=plan,
        source_mode=mode,
        rate_ms_per_mp=rate,
        confidence=level,
        reasons=tuple(reasons),
    )
    decision.validate()
    return decision


def privacy_safe_summary(profile: DeviceProfile) -> dict[str, object]:
    profile.validate()

    def summarize_rate(rate: RobustRate | None) -> dict[str, float | int] | None:
        if rate is None:
            return None
        return {
            "sample_count": rate.sample_count,
            "kept_count": rate.kept_count,
            "median_ms_per_mp": round(rate.median_ms_per_mp, 4),
            "p90_ms_per_mp": round(rate.p90_ms_per_mp, 4),
            "mad_ms_per_mp": round(rate.mad_ms_per_mp, 4),
        }

    return {
        "schema": profile.schema,
        "sample_count": profile.sample_count,
        "observed_peak_mb": round(profile.observed_peak_mb, 3),
        "preview": summarize_rate(profile.preview_rate),
        "export": summarize_rate(profile.export_rate),
        "profile_sha256": profile.profile_sha256,
        "contains_pixels": False,
        "contains_masks": False,
        "contains_landmarks": False,
        "network_required": False,
    }

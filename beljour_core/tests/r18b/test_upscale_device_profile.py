"""R18B device-profile and calibration tests. Author: John Khan."""
from __future__ import annotations

import math
from typing import cast

import pytest

from plumb_api.engines.upscale.device_profile import (
    SCHEMA,
    DeviceProfile,
    Mode,
    TimingSample,
    build_profile,
    confidence,
    conservative_rate,
    decide,
    privacy_safe_summary,
)
from plumb_api.engines.upscale.planner import DeviceBudget


def sample(
    elapsed: float,
    *,
    mode: str = "export",
    width: int = 512,
    height: int = 512,
    scale: int = 2,
    peak: float = 64.0,
) -> TimingSample:
    return TimingSample(
        width=width,
        height=height,
        scale=scale,
        elapsed_ms=elapsed,
        peak_mb=peak,
        mode=cast(Mode, mode),
    )


def test_sample_rate_is_normalized_by_output_megapixels() -> None:
    item = sample(400.0, width=500, height=500, scale=2)
    assert item.output_mp == pytest.approx(1.0)
    assert item.milliseconds_per_output_mp == pytest.approx(400.0)


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        ({"width": 0}, "dimensions"),
        ({"height": 0}, "dimensions"),
        ({"scale": 3}, "scale"),
        ({"elapsed": 0.0}, "elapsed_ms"),
        ({"elapsed": float("nan")}, "elapsed_ms"),
        ({"peak": 0.0}, "peak_mb"),
        ({"peak": float("inf")}, "peak_mb"),
        ({"mode": "background"}, "mode"),
    ],
)
def test_sample_validation_rejects_bad_boundary_values(kwargs: dict[str, object], message: str) -> None:
    arguments: dict[str, object] = {
        "elapsed": 400.0,
        "width": 512,
        "height": 512,
        "scale": 2,
        "peak": 64.0,
        "mode": "export",
    }
    arguments.update(kwargs)
    item = sample(
        float(arguments["elapsed"]),
        mode=str(arguments["mode"]),
        width=int(arguments["width"]),
        height=int(arguments["height"]),
        scale=int(arguments["scale"]),
        peak=float(arguments["peak"]),
    )
    with pytest.raises(ValueError, match=message):
        item.validate()


def test_profile_is_deterministic_independent_of_sample_order() -> None:
    samples = (
        sample(420.0, mode="preview"),
        sample(450.0, mode="preview"),
        sample(700.0, mode="export", scale=4),
        sample(680.0, mode="export", scale=4),
    )
    forward = build_profile(samples)
    reverse = build_profile(tuple(reversed(samples)))
    assert forward.profile_sha256 == reverse.profile_sha256
    assert forward == reverse


def test_profile_hash_changes_when_timing_evidence_changes() -> None:
    baseline = build_profile((sample(400.0), sample(420.0)))
    changed = build_profile((sample(400.0), sample(421.0)))
    assert baseline.profile_sha256 != changed.profile_sha256


def test_robust_rate_rejects_extreme_outlier_without_hiding_sample_count() -> None:
    samples = tuple(sample(value) for value in (390.0, 395.0, 400.0, 405.0, 410.0, 4000.0))
    profile = build_profile(samples)
    assert profile.export_rate is not None
    assert profile.export_rate.sample_count == 6
    assert profile.export_rate.kept_count == 5
    assert profile.export_rate.median_ms_per_mp < 500.0
    assert profile.export_rate.maximum_ms_per_mp < 500.0


def test_identical_rates_keep_every_sample() -> None:
    profile = build_profile(tuple(sample(400.0) for _ in range(8)))
    assert profile.export_rate is not None
    assert profile.export_rate.kept_count == 8
    assert profile.export_rate.mad_ms_per_mp == 0.0


def test_mode_specific_rate_is_preferred() -> None:
    profile = build_profile(
        (
            sample(200.0, mode="preview"),
            sample(220.0, mode="preview"),
            sample(700.0, mode="export"),
            sample(760.0, mode="export"),
        )
    )
    preview_rate, preview_source = conservative_rate(profile, "preview")
    export_rate, export_source = conservative_rate(profile, "export")
    assert preview_source == "matching-mode p90"
    assert export_source == "matching-mode p90"
    assert preview_rate < export_rate


def test_cross_mode_fallback_adds_safety_penalty() -> None:
    profile = build_profile((sample(500.0, mode="export"), sample(520.0, mode="export")))
    rate, source = conservative_rate(profile, "preview")
    assert source == "cross-mode p90 with safety penalty"
    assert profile.export_rate is not None
    assert rate > profile.export_rate.p90_ms_per_mp


def test_confidence_is_high_for_stable_seven_sample_run() -> None:
    profile = build_profile(tuple(sample(value, mode="preview") for value in (400, 401, 399, 402, 398, 400, 401)))
    assert confidence(profile, "preview") == "high"


def test_confidence_is_medium_for_small_matching_set() -> None:
    profile = build_profile(tuple(sample(value, mode="preview") for value in (400, 405, 410)))
    assert confidence(profile, "preview") == "medium"


def test_confidence_is_low_when_requested_mode_has_no_samples() -> None:
    profile = build_profile((sample(500.0, mode="export"),))
    assert confidence(profile, "preview") == "low"


def test_decision_uses_profile_rate_and_declared_budget() -> None:
    profile = build_profile(tuple(sample(value, mode="export") for value in (500, 520, 510, 515)))
    budget = DeviceBudget(maximum_peak_mb=128.0, target_preview_ms=1500.0, target_export_ms=8000.0)
    decision = decide(1024, 768, 2, budget, profile, mode="export")
    decision.validate()
    assert decision.plan.scale == 2
    assert decision.rate_ms_per_mp > 0
    assert decision.reasons[0] == "matching-mode p90"


def test_decision_marks_cross_mode_low_confidence() -> None:
    profile = build_profile((sample(500.0, mode="export"), sample(510.0, mode="export")))
    budget = DeviceBudget(maximum_peak_mb=96.0, target_preview_ms=3000.0, target_export_ms=8000.0)
    decision = decide(640, 480, 2, budget, profile, mode="preview")
    assert decision.confidence == "low"
    assert "cross-mode" in decision.reasons[0]


def test_decision_reports_calibration_peak_above_requested_budget() -> None:
    profile = build_profile((sample(500.0, mode="export", peak=192.0),))
    budget = DeviceBudget(maximum_peak_mb=64.0, target_preview_ms=3000.0, target_export_ms=8000.0)
    decision = decide(800, 600, 2, budget, profile, mode="export")
    assert any("peak exceeds" in reason for reason in decision.reasons)


def test_privacy_summary_contains_only_safe_numeric_calibration_fields() -> None:
    profile = build_profile(
        (
            sample(300.0, mode="preview", peak=70.0),
            sample(700.0, mode="export", peak=90.0),
        )
    )
    summary = privacy_safe_summary(profile)
    assert summary["schema"] == SCHEMA
    assert summary["sample_count"] == 2
    assert summary["contains_pixels"] is False
    assert summary["contains_masks"] is False
    assert summary["contains_landmarks"] is False
    assert summary["network_required"] is False
    serialized = repr(summary).lower()
    for forbidden in ("image", "photo", "face_id", "email", "account"):
        assert forbidden not in serialized


def test_profile_validation_rejects_wrong_schema() -> None:
    good = build_profile((sample(500.0),))
    bad = DeviceProfile(
        schema="wrong",
        preview_rate=good.preview_rate,
        export_rate=good.export_rate,
        observed_peak_mb=good.observed_peak_mb,
        sample_count=good.sample_count,
        profile_sha256=good.profile_sha256,
    )
    with pytest.raises(ValueError, match="schema"):
        bad.validate()


def test_profile_rejects_empty_sample_set() -> None:
    with pytest.raises(ValueError, match="at least one"):
        build_profile(())


def test_rates_are_finite_for_large_but_valid_samples() -> None:
    profile = build_profile(
        (
            sample(30_000.0, width=4096, height=3072, scale=4, peak=512.0),
            sample(29_000.0, width=4096, height=3072, scale=4, peak=500.0),
        )
    )
    assert profile.export_rate is not None
    assert math.isfinite(profile.export_rate.p90_ms_per_mp)
    assert profile.export_rate.p90_ms_per_mp > 0

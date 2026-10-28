"""R18B cross-device upscale calibration matrix tests. Author: John Khan."""
from __future__ import annotations

from dataclasses import replace
from typing import cast

import pytest

from plumb_api.engines.upscale.calibration_matrix import (
    CalibrationMatrix,
    ClassifiedProfile,
    DeviceClass,
    compare_matrices,
    coverage,
    envelope,
    plan_for_matrix,
    privacy_safe_summary,
)
from plumb_api.engines.upscale.device_profile import Mode, TimingSample, build_profile
from plumb_api.engines.upscale.planner import DeviceBudget


def make_profile(base_ms: float, peak: float, *, samples: int = 7):
    rows = []
    for index in range(samples):
        jitter = (index % 3 - 1) * 2.0
        rows.append(TimingSample(512, 512, 2, base_ms + jitter, peak, "preview"))
        rows.append(TimingSample(1024, 768, 2, base_ms * 2.2 + jitter, peak + 10.0, "export"))
    return build_profile(tuple(rows))


def complete_matrix(multiplier: float = 1.0) -> CalibrationMatrix:
    return CalibrationMatrix(
        (
            ClassifiedProfile("entry", make_profile(520.0 * multiplier, 120.0)),
            ClassifiedProfile("mid", make_profile(380.0 * multiplier, 95.0)),
            ClassifiedProfile("high", make_profile(250.0 * multiplier, 80.0)),
        )
    )


def test_matrix_canonical_hash_is_independent_of_profile_order() -> None:
    matrix = complete_matrix()
    reverse = CalibrationMatrix(tuple(reversed(matrix.profiles)))
    assert matrix.sha256 == reverse.sha256
    assert matrix.canonical() == reverse.canonical()


def test_matrix_hash_changes_when_profile_evidence_changes() -> None:
    baseline = complete_matrix()
    changed_profiles = list(baseline.profiles)
    changed_profiles[0] = ClassifiedProfile("entry", make_profile(530.0, 120.0))
    changed = CalibrationMatrix(tuple(changed_profiles))
    assert baseline.sha256 != changed.sha256


def test_coverage_reports_each_declared_device_class() -> None:
    summary = coverage(complete_matrix())
    assert summary["profile_count"] == 3
    assert summary["covered_classes"] == 3
    assert summary["complete_class_coverage"] is True
    assert summary["per_device_class"] == {"entry": 1, "mid": 1, "high": 1}


def test_coverage_detects_missing_entry_class() -> None:
    matrix = complete_matrix()
    incomplete = CalibrationMatrix(tuple(item for item in matrix.profiles if item.device_class != "entry"))
    summary = coverage(incomplete)
    assert summary["covered_classes"] == 2
    assert summary["complete_class_coverage"] is False


def test_envelope_uses_slowest_profile_plus_safety_margin() -> None:
    result = envelope(complete_matrix(), "preview")
    assert result.minimum_ms_per_mp < result.median_ms_per_mp < result.maximum_ms_per_mp
    assert result.conservative_ms_per_mp == pytest.approx(result.maximum_ms_per_mp * 1.05)


def test_envelopes_normalize_each_mode_by_output_megapixels() -> None:
    matrix = complete_matrix()
    preview = envelope(matrix, "preview")
    export = envelope(matrix, "export")
    assert export.median_ms_per_mp != preview.median_ms_per_mp
    assert export.median_ms_per_mp > 0
    assert preview.median_ms_per_mp > 0


def test_envelope_has_no_low_confidence_profiles_for_stable_fixture() -> None:
    assert envelope(complete_matrix(), "preview").low_confidence_profiles == 0
    assert envelope(complete_matrix(), "export").low_confidence_profiles == 0


def test_low_sample_profile_is_counted_as_low_confidence() -> None:
    matrix = CalibrationMatrix(
        (
            ClassifiedProfile("entry", make_profile(500.0, 120.0, samples=1)),
            ClassifiedProfile("mid", make_profile(380.0, 95.0)),
            ClassifiedProfile("high", make_profile(250.0, 80.0)),
        )
    )
    assert envelope(matrix, "preview").low_confidence_profiles == 1


def test_plan_for_complete_matrix_can_be_release_ready() -> None:
    budget = DeviceBudget(256.0, 20_000.0, 40_000.0)
    result = plan_for_matrix(
        complete_matrix(),
        width=512,
        height=512,
        scale=2,
        budget=budget,
        mode="preview",
    )
    result.validate()
    assert result.ready_for_target is True
    assert result.blockers == ()
    assert result.memory_margin_mb >= 0
    assert result.time_margin_ms >= 0


def test_plan_blocks_incomplete_device_class_coverage() -> None:
    matrix = complete_matrix()
    incomplete = CalibrationMatrix(tuple(item for item in matrix.profiles if item.device_class != "entry"))
    budget = DeviceBudget(256.0, 20_000.0, 40_000.0)
    result = plan_for_matrix(incomplete, width=512, height=512, scale=2, budget=budget, mode="preview")
    assert result.ready_for_target is False
    assert "DEVICE_CLASS_COVERAGE_INCOMPLETE" in result.blockers


def test_plan_blocks_low_confidence_profile() -> None:
    matrix = CalibrationMatrix(
        (
            ClassifiedProfile("entry", make_profile(500.0, 120.0, samples=1)),
            ClassifiedProfile("mid", make_profile(380.0, 95.0)),
            ClassifiedProfile("high", make_profile(250.0, 80.0)),
        )
    )
    budget = DeviceBudget(256.0, 20_000.0, 40_000.0)
    result = plan_for_matrix(matrix, width=512, height=512, scale=2, budget=budget, mode="preview")
    assert result.ready_for_target is False
    assert "LOW_CONFIDENCE_PROFILE_PRESENT" in result.blockers


def test_plan_blocks_tight_time_budget_without_raising_threshold() -> None:
    budget = DeviceBudget(256.0, 20.0, 40.0)
    result = plan_for_matrix(
        complete_matrix(),
        width=1024,
        height=768,
        scale=4,
        budget=budget,
        mode="preview",
    )
    assert result.ready_for_target is False
    assert result.time_margin_ms < 0
    assert "TIME_BUDGET_EXCEEDED" in result.blockers


def test_plan_reports_selected_tile_and_conservative_rate() -> None:
    budget = DeviceBudget(128.0, 20_000.0, 40_000.0)
    matrix = complete_matrix()
    result = plan_for_matrix(matrix, width=1920, height=1080, scale=2, budget=budget, mode="export")
    assert result.plan.tile_side >= 128
    assert result.envelope.conservative_ms_per_mp >= result.envelope.maximum_ms_per_mp


def test_compare_matrices_detects_faster_candidate() -> None:
    result = compare_matrices(complete_matrix(1.0), complete_matrix(0.8), "preview")
    assert result["improved"] is True
    assert float(result["ratio"]) < 1.0
    assert float(result["delta_ms_per_mp"]) < 0.0


def test_compare_matrices_detects_slower_candidate() -> None:
    result = compare_matrices(complete_matrix(1.0), complete_matrix(1.2), "export")
    assert result["improved"] is False
    assert float(result["ratio"]) > 1.0
    assert float(result["delta_ms_per_mp"]) > 0.0


def test_compare_matrices_tracks_memory_regression_independently() -> None:
    baseline = complete_matrix()
    candidate = CalibrationMatrix(
        (
            ClassifiedProfile("entry", make_profile(450.0, 140.0)),
            ClassifiedProfile("mid", make_profile(330.0, 120.0)),
            ClassifiedProfile("high", make_profile(220.0, 100.0)),
        )
    )
    result = compare_matrices(baseline, candidate, "preview")
    assert result["improved"] is True
    assert result["memory_not_worse"] is False
    assert float(result["memory_delta_mb"]) > 0


def test_privacy_summary_excludes_device_identifiers_and_media() -> None:
    summary = privacy_safe_summary(complete_matrix())
    assert summary["contains_pixels"] is False
    assert summary["contains_masks"] is False
    assert summary["contains_landmarks"] is False
    assert summary["contains_device_identifier"] is False
    assert summary["network_required"] is False
    text = repr(summary).lower()
    for forbidden in ("serial", "user_agent", "email", "photo", "filename"):
        assert forbidden not in text


def test_matrix_rejects_empty_profiles() -> None:
    with pytest.raises(ValueError, match="requires profiles"):
        CalibrationMatrix(()).validate()


def test_matrix_rejects_wrong_schema() -> None:
    matrix = replace(complete_matrix(), schema="wrong")
    with pytest.raises(ValueError, match="schema"):
        matrix.validate()


def test_classified_profile_rejects_unknown_class() -> None:
    item = ClassifiedProfile(cast(DeviceClass, "desktop"), make_profile(300.0, 90.0))
    with pytest.raises(ValueError, match="device class"):
        item.validate()


def test_plan_result_validation_detects_inconsistent_ready_flag() -> None:
    budget = DeviceBudget(256.0, 20_000.0, 40_000.0)
    result = plan_for_matrix(complete_matrix(), width=512, height=512, scale=2, budget=budget, mode="preview")
    bad = replace(result, ready_for_target=False)
    with pytest.raises(ValueError, match="inconsistent"):
        bad.validate()


@pytest.mark.parametrize("mode", ["preview", "export"])
def test_envelope_is_deterministic_for_each_mode(mode: str) -> None:
    matrix = complete_matrix()
    selected = cast(Mode, mode)
    left = envelope(matrix, selected)
    right = envelope(matrix, selected)
    assert left == right


@pytest.mark.parametrize("scale", [2, 4])
def test_matrix_plans_both_supported_scales(scale: int) -> None:
    budget = DeviceBudget(256.0, 30_000.0, 60_000.0)
    result = plan_for_matrix(
        complete_matrix(),
        width=640,
        height=480,
        scale=scale,
        budget=budget,
        mode="export",
    )
    assert result.plan.scale == scale


def test_matrix_hash_does_not_encode_profile_order_or_raw_samples() -> None:
    matrix = complete_matrix()
    canonical = matrix.canonical()
    assert "elapsed_ms" not in canonical
    assert "width" not in canonical
    assert "height" not in canonical
    assert "profile_sha256" in canonical

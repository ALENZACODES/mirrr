"""R18B performance-baseline regression tests. Author: John Khan."""
from __future__ import annotations

import json

import pytest

from plumb_api.engines.upscale import perf_regression


def _sample(
    case_id: str,
    median: float,
    p90: float,
    *,
    psnr: float = 30.0,
    ssim: float = 0.94,
    ringing: float = 0.01,
) -> perf_regression.Sample:
    return perf_regression.Sample(case_id, 2, 256, 192, median, p90, psnr, ssim, ringing)


def _baseline(
    *samples: perf_regression.Sample,
    implementation: str = "base",
    environment: str = "cpu-16gb",
) -> perf_regression.Baseline:
    return perf_regression.Baseline(implementation, environment, tuple(samples))


def test_baseline_round_trip_is_canonical_and_hash_stable() -> None:
    baseline = _baseline(_sample("b", 20, 24), _sample("a", 10, 12))
    payload = json.loads(baseline.canonical())
    parsed = perf_regression.parse(payload)
    assert parsed.canonical() == baseline.canonical()
    assert parsed.sha256 == baseline.sha256
    assert len(parsed.sha256) == 64


def test_canonical_order_does_not_depend_on_sample_input_order() -> None:
    first = _baseline(_sample("b", 20, 24), _sample("a", 10, 12))
    second = _baseline(_sample("a", 10, 12), _sample("b", 20, 24))
    assert first.canonical() == second.canonical()
    assert first.sha256 == second.sha256


def test_compare_accepts_material_speedup_without_quality_change() -> None:
    before = _baseline(_sample("2x", 100, 120), _sample("detail", 80, 100))
    after = _baseline(
        _sample("2x", 60, 72),
        _sample("detail", 50, 64),
        implementation="vectorized",
    )
    result = perf_regression.compare(before, after)
    assert result["passed"] is True
    rows = result["rows"]
    assert isinstance(rows, tuple)
    assert all(row["median_ratio"] < 1 for row in rows)


def test_compare_rejects_runtime_regression() -> None:
    before = _baseline(_sample("x", 100, 110))
    after = _baseline(_sample("x", 120, 135), implementation="slow")
    result = perf_regression.compare(before, after, maximum_median_regression=0.10)
    assert result["passed"] is False


def test_compare_rejects_quality_regression_even_when_faster() -> None:
    before = _baseline(_sample("x", 100, 110, psnr=31, ssim=0.95, ringing=0.01))
    after = _baseline(
        _sample("x", 50, 55, psnr=30.0, ssim=0.90, ringing=0.03),
        implementation="fast-low-quality",
    )
    result = perf_regression.compare(before, after)
    assert result["passed"] is False
    row = result["rows"][0]
    assert row["median_ratio"] == pytest.approx(0.5)
    assert row["psnr_delta"] == pytest.approx(-1.0)


def test_compare_requires_same_environment() -> None:
    before = _baseline(_sample("x", 10, 12), environment="box-a")
    after = _baseline(_sample("x", 9, 11), environment="box-b")
    with pytest.raises(ValueError, match="same environment"):
        perf_regression.compare(before, after)


def test_compare_requires_same_cases() -> None:
    before = _baseline(_sample("x", 10, 12))
    after = _baseline(_sample("y", 10, 12))
    with pytest.raises(ValueError, match="case set"):
        perf_regression.compare(before, after)


def test_compare_rejects_geometry_drift() -> None:
    before = _baseline(_sample("x", 10, 12))
    changed = perf_regression.Sample("x", 4, 256, 192, 9, 11, 30, 0.94, 0.01)
    after = _baseline(changed)
    with pytest.raises(ValueError, match="geometry"):
        perf_regression.compare(before, after)


def test_sample_normalizes_runtime_by_output_megapixels() -> None:
    sample = _sample("x", 100, 120)
    assert sample.megapixels_out == pytest.approx(256 * 192 * 4 / 1_000_000)
    assert sample.milliseconds_per_output_megapixel > sample.median_ms


def test_throughput_summary_spans_all_samples() -> None:
    baseline = _baseline(_sample("a", 10, 12), _sample("b", 20, 24), _sample("c", 15, 18))
    summary = perf_regression.throughput_summary(baseline)
    assert summary["minimum_ms_per_output_mp"] < summary["mean_ms_per_output_mp"]
    assert summary["mean_ms_per_output_mp"] < summary["maximum_ms_per_output_mp"]


@pytest.mark.parametrize(
    "sample",
    (
        perf_regression.Sample("", 2, 10, 10, 1, 1, 30, 0.9, 0.01),
        perf_regression.Sample("x", 3, 10, 10, 1, 1, 30, 0.9, 0.01),
        perf_regression.Sample("x", 2, 0, 10, 1, 1, 30, 0.9, 0.01),
        perf_regression.Sample("x", 2, 10, 10, -1, 1, 30, 0.9, 0.01),
        perf_regression.Sample("x", 2, 10, 10, 2, 1, 30, 0.9, 0.01),
        perf_regression.Sample("x", 2, 10, 10, 1, 1, 30, 1.1, 0.01),
        perf_regression.Sample("x", 2, 10, 10, 1, 1, 30, 0.9, 1.1),
    ),
)
def test_sample_validation_rejects_invalid_records(sample: perf_regression.Sample) -> None:
    with pytest.raises(ValueError):
        sample.validate()


def test_baseline_rejects_duplicate_cases() -> None:
    baseline = _baseline(_sample("x", 10, 12), _sample("x", 11, 13))
    with pytest.raises(ValueError, match="duplicate"):
        baseline.validate()


def test_baseline_rejects_wrong_author() -> None:
    baseline = perf_regression.Baseline("x", "box", (_sample("x", 10, 12),), author="other")
    with pytest.raises(ValueError, match="John Khan"):
        baseline.validate()


def test_parse_rejects_unknown_format() -> None:
    with pytest.raises(ValueError, match="unsupported"):
        perf_regression.parse({"format": "other", "samples": []})


def test_compare_rejects_negative_runtime_regression_budget() -> None:
    baseline = _baseline(_sample("x", 10, 12))
    with pytest.raises(ValueError, match="nonnegative"):
        perf_regression.compare(baseline, baseline, maximum_median_regression=-0.01)

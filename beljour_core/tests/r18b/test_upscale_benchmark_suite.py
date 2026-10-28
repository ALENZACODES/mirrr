"""R18B classical-upscale benchmark-suite tests. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.upscale import benchmark_suite


def test_synthetic_target_is_deterministic() -> None:
    first = benchmark_suite.synthetic_target(64, 48)
    second = benchmark_suite.synthetic_target(64, 48)
    np.testing.assert_array_equal(first, second)
    assert first.dtype == np.uint8
    assert first.shape == (48, 64, 3)


@pytest.mark.parametrize("scale", (2, 4))
def test_quality_case_shapes(scale: int) -> None:
    case, target = benchmark_suite.quality_case(scale)
    case.validate()
    assert target.shape[0] == case.source.shape[0] * scale
    assert target.shape[1] == case.source.shape[1] * scale
    assert len(case.input_sha256) == 64


def test_downsample_box_rejects_nothing_but_is_exact_shape() -> None:
    source = benchmark_suite.synthetic_target(65, 67)
    small = benchmark_suite._downsample_box(source, 2)
    assert small.shape == (33, 32, 3)


def test_benchmark_result_validates_ranges() -> None:
    result = benchmark_suite.BenchmarkResult("x", "0" * 64, 2, 0.5, 10.0, 25.0, 0.9, 0.01, True)
    result.validate()
    with pytest.raises(ValueError):
        benchmark_suite.BenchmarkResult("x", "0" * 64, 3, 0.5, 10.0, 25.0, 0.9, 0.01, True).validate()


def test_vectorized_kernel_speed_has_material_speedup() -> None:
    rng = np.random.default_rng(8)
    channel = rng.integers(0, 256, size=(28, 31), dtype=np.uint8)
    fast, reference = benchmark_suite.vectorized_kernel_speed(channel, 2, repeats=5)
    comparison = benchmark_suite.compare_runtime(reference, fast, minimum_speedup=2.0)
    assert comparison["passes"] is True


def test_suite_report_is_hashable_and_canonical() -> None:
    cases = (benchmark_suite.quality_case(2), benchmark_suite.quality_case(4))
    report = benchmark_suite.run_suite(cases)
    assert len(report.sha256) == 64
    assert report.canonical() == report.canonical()
    assert len(report.results) == 2


def test_quality_gate_uses_all_metrics() -> None:
    timing = benchmark_suite.TimingSummary((10.0,), 10.0, 10.0, 10.0, 10.0)
    good = benchmark_suite.BenchmarkResult("x", "0" * 64, 2, 0.5, 10.0, 30.0, 0.95, 0.01, True)
    report = benchmark_suite.SuiteReport((good,), timing)
    assert benchmark_suite.quality_gate(report, minimum_psnr=20, minimum_ssim=0.8, maximum_ringing=0.03)
    bad = benchmark_suite.BenchmarkResult("x", "0" * 64, 2, 0.5, 10.0, 30.0, 0.95, 0.04, True)
    assert not benchmark_suite.quality_gate(benchmark_suite.SuiteReport((bad,), timing), maximum_ringing=0.03)


def test_compare_runtime_rejects_invalid_minimum() -> None:
    timing = benchmark_suite.TimingSummary((1.0,), 1.0, 1.0, 1.0, 1.0)
    with pytest.raises(ValueError):
        benchmark_suite.compare_runtime(timing, timing, minimum_speedup=0)

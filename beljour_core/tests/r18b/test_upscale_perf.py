"""R18B classical-upscale work-estimate and timing tests. Author: John Khan."""
from __future__ import annotations

import itertools
from typing import cast

import numpy as np
import pytest

from plumb_api.engines.upscale import perf


def test_work_estimate_output_pixels_are_exact() -> None:
    row = perf.estimate(1300, 900, 2, tile_side=512)
    assert row.output_pixels_written == 1300 * 900 * 4
    assert row.input_pixels_read >= 1300 * 900
    assert row.overlap_pixels_read == row.input_pixels_read - 1300 * 900
    assert row.tile_count == 6
    assert row.overlap_fraction > 0


def test_candidate_estimates_obey_memory_budget() -> None:
    rows = perf.candidate_estimates(2400, 1800, 4, max_peak_mb=64)
    assert rows
    assert all(row.peak_bytes_estimate <= 64 * 1024 * 1024 for row in rows)
    assert all(row.scale == 4 for row in rows)


def test_choose_lowest_work_minimizes_read_amplification() -> None:
    rows = perf.candidate_estimates(2200, 1600, 2, candidates=(768, 640, 512, 384), max_peak_mb=128)
    chosen = perf.choose_lowest_work(2200, 1600, 2, candidates=(768, 640, 512, 384), max_peak_mb=128)
    assert chosen.input_pixels_read == min(row.input_pixels_read for row in rows)


def test_estimate_rejects_invalid_inputs() -> None:
    with pytest.raises(ValueError):
        perf.estimate(0, 100, 2)
    with pytest.raises(ValueError):
        perf.estimate(100, 100, 3)
    with pytest.raises(ValueError):
        perf.candidate_estimates(100, 100, 2, max_peak_mb=float("nan"))


def test_percentile_interpolates() -> None:
    assert perf._percentile((0.0, 10.0), 0.5) == 5.0
    assert perf._percentile((0.0, 10.0, 20.0), 0.9) == pytest.approx(18.0)


def test_benchmark_uses_injected_monotone_clock() -> None:
    ticks = iter((0.0, 0.001, 0.010, 0.013, 0.020, 0.025))

    def clock() -> float:
        return next(ticks)

    def operation() -> np.ndarray:
        return np.zeros((1, 1, 3), dtype=np.uint8)

    summary = perf.benchmark(operation, warmups=0, repeats=3, clock=clock)
    assert summary.samples_ms == pytest.approx((1.0, 3.0, 5.0))
    assert summary.median_ms == pytest.approx(3.0)
    assert summary.p90_ms == pytest.approx(4.6)


def test_benchmark_rejects_non_array_operation() -> None:
    def wrong() -> np.ndarray:
        return cast(np.ndarray, 7)

    with pytest.raises(TypeError):
        perf.benchmark(wrong, warmups=1, repeats=1)


def test_speedup_and_budget_margin() -> None:
    reference = perf.TimingSummary((8.0, 10.0, 12.0), 10.0, 8.0, 12.0, 11.6)
    candidate = perf.TimingSummary((4.0, 5.0, 6.0), 5.0, 4.0, 6.0, 5.8)
    assert perf.speedup(reference, candidate) == 2.0
    margin = perf.budget_margin(candidate, 10.0)
    assert margin["passes"] is True
    assert margin["margin_ms"] == pytest.approx(4.2)


def test_invalid_timing_summary_is_rejected() -> None:
    bad = perf.TimingSummary((2.0, 1.0), 3.0, 1.0, 2.0, 2.0)
    with pytest.raises(ValueError):
        bad.validate()


def test_shaped_work_estimates_are_deterministic() -> None:
    pairs = list(itertools.product((320, 641, 1024), (2, 4)))
    first = [perf.estimate(width, 777, scale, tile_side=256) for width, scale in pairs]
    second = [perf.estimate(width, 777, scale, tile_side=256) for width, scale in pairs]
    assert first == second

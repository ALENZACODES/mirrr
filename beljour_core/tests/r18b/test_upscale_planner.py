"""R18B deterministic upscale planner tests. Author: John Khan."""
from __future__ import annotations

import pytest

from plumb_api.engines.upscale import planner


def test_output_megapixels_accounts_for_scale_squared() -> None:
    assert planner.output_megapixels(1000, 500, 2) == pytest.approx(2.0)
    assert planner.output_megapixels(1000, 500, 4) == pytest.approx(8.0)


def test_runtime_estimate_scales_with_output_area() -> None:
    two = planner.estimate_runtime_ms(1000, 500, 2, 25)
    four = planner.estimate_runtime_ms(1000, 500, 4, 25)
    assert four == pytest.approx(two * 4)


def test_candidate_memory_is_monotone_with_tile_size() -> None:
    budget = planner.DeviceBudget(512, 10_000, 10_000)
    options = planner.candidates(2048, 1536, 2, budget, milliseconds_per_output_mp=10, preview=False)
    peaks = [item.estimated_peak_mb for item in options]
    assert peaks == sorted(peaks, reverse=True)


def test_choose_prefers_largest_viable_tile() -> None:
    budget = planner.DeviceBudget(128, 5000, 5000)
    options = planner.candidates(2048, 1536, 2, budget, milliseconds_per_output_mp=10, preview=False)
    viable = [item for item in options if item.viable]
    selected = planner.choose(2048, 1536, 2, budget, milliseconds_per_output_mp=10)
    assert viable
    assert selected.tile_side == max(item.tile_side for item in viable)


def test_choose_falls_back_to_memory_safe_when_deadline_is_impossible() -> None:
    budget = planner.DeviceBudget(128, 1, 1)
    selected = planner.choose(2048, 1536, 4, budget, milliseconds_per_output_mp=100)
    assert selected.mode == "tiled"
    assert "time budget not met" in selected.reason
    assert selected.estimated_peak_mb <= budget.maximum_peak_mb


def test_minimum_valid_memory_budget_selects_smallest_safe_tile() -> None:
    budget = planner.DeviceBudget(16, 1, 1)
    selected = planner.choose(4096, 4096, 4, budget, milliseconds_per_output_mp=100)
    assert selected.mode == "tiled"
    assert "time budget not met" in selected.reason
    assert selected.tile_side == 128
    assert selected.estimated_peak_mb <= 16


def test_preview_uses_preview_deadline() -> None:
    budget = planner.DeviceBudget(256, 20, 5000)
    export = planner.choose(512, 512, 2, budget, milliseconds_per_output_mp=50, preview=False)
    preview = planner.choose(512, 512, 2, budget, milliseconds_per_output_mp=50, preview=True)
    assert export.estimated_ms == pytest.approx(preview.estimated_ms)
    assert "time budget not met" in preview.reason


@pytest.mark.parametrize(
    "width,height,scale,rate",
    ((0, 10, 2, 1), (10, 0, 2, 1), (10, 10, 3, 1), (10, 10, 2, 0)),
)
def test_invalid_geometry_or_rate_is_rejected(width: int, height: int, scale: int, rate: float) -> None:
    with pytest.raises(ValueError):
        planner.estimate_runtime_ms(width, height, scale, rate)


def test_device_budget_rejects_invalid_values() -> None:
    with pytest.raises(ValueError):
        planner.DeviceBudget(8, 100, 100).validate()
    with pytest.raises(ValueError):
        planner.DeviceBudget(64, 0, 100).validate()


def test_plan_validation_rejects_bad_mode() -> None:
    plan = planner.Plan(100, 100, 2, "other", 128, 12, 10, 5, "test")
    with pytest.raises(ValueError, match="mode"):
        plan.validate()

"""Allocation-plan mathematics and fallback behaviour. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.filters.artistic import EffectUnavailable
from plumb_api.filters.artistic.resources import DEFAULT_BUDGET, MIB, SCRATCH_BYTES_PER_PIXEL, export_allocation
from plumb_api.filters.artistic.tiling import render_tiled
from tests.artistic_helpers import drawn


@pytest.mark.parametrize("effect", SCRATCH_BYTES_PER_PIXEL)
@pytest.mark.parametrize("shape", [(2, 2), (512, 512), (4000, 3000), (4096, 4096)])
def test_allocation_stays_inside_declared_allowance(effect: str, shape: tuple[int, int]) -> None:
    plan = export_allocation(effect, *shape, 4, requested_tile=1024, halo=12)
    assert 32 <= plan.tile_size <= 1024
    assert plan.estimated_peak_bytes <= DEFAULT_BUDGET
    assert plan.frame_bytes == shape[0] * shape[1] * 8
    assert plan.estimated_peak_bytes == plan.frame_bytes + plan.scratch_bytes
    assert plan.planned_tiles >= 1


def test_12mp_rgba_uses_multiple_tiles_without_full_float_frame() -> None:
    plan = export_allocation("pigment-oil", 4000, 3000, 4, requested_tile=1024, halo=12)
    assert plan.frame_bytes == 96_000_000
    assert plan.tile_size < 1024
    assert plan.planned_tiles > 1
    assert plan.scratch_bytes < 200 * MIB


def test_lower_allowance_reduces_tile_side_before_rendering() -> None:
    generous = export_allocation("pigment-oil", 500, 600, 4, budget_bytes=256 * MIB)
    constrained = export_allocation("pigment-oil", 500, 600, 4, budget_bytes=8 * MIB)
    assert constrained.tile_size < generous.tile_size
    assert constrained.planned_tiles > generous.planned_tiles
    assert constrained.estimated_peak_bytes <= 8 * MIB


def test_budget_that_cannot_hold_output_fails_before_render_allocation() -> None:
    with pytest.raises(EffectUnavailable) as error:
        export_allocation("pigment-oil", 4000, 3000, 4, budget_bytes=8 * MIB)
    assert error.value.code == "memory_budget"


def test_constrained_tile_plan_keeps_exact_pixels() -> None:
    image, _, _, _ = drawn(200, 180, rgba=True)
    default = render_tiled("pigment-oil", image, tile_size=512)
    constrained = render_tiled("pigment-oil", image, tile_size=512, budget_bytes=8 * MIB)
    assert constrained.metrics["selected_tile_size"] < default.metrics["selected_tile_size"]
    np.testing.assert_array_equal(default.image, constrained.image)


@pytest.mark.parametrize("value", [0, -1, True, 8 * MIB - 1, float("inf"), "256"])
def test_invalid_allowance_never_coerces_to_an_unbounded_plan(value: object) -> None:
    with pytest.raises(ValueError):
        export_allocation("pigment-oil", 100, 100, 3, budget_bytes=value)


"""Guarded upscale admission against R18B device budgets. Author: John Khan."""

from __future__ import annotations

import pytest

from .planner import DeviceBudget
from .safe_tiles import AdmissionRefused, admit, admit_for_device


def _budget(peak_mb: float) -> DeviceBudget:
    return DeviceBudget(maximum_peak_mb=peak_mb, target_preview_ms=100.0, target_export_ms=2000.0)


def test_device_budget_maps_to_the_byte_budget() -> None:
    plan = admit_for_device(1200, 900, _budget(128.0), scale=2)
    assert plan.budget_bytes == 128 * 1024 * 1024
    assert plan == admit(1200, 900, scale=2, budget_bytes=128 * 1024 * 1024)
    assert plan.peak_bytes <= plan.budget_bytes


def test_smaller_devices_get_smaller_tiles() -> None:
    phone = admit_for_device(1200, 900, _budget(48.0), scale=2)
    laptop = admit_for_device(1200, 900, _budget(1024.0), scale=2)
    assert phone.tile_side < laptop.tile_side
    assert phone.peak_bytes <= 48 * 1024 * 1024


def test_a_device_too_small_for_the_output_is_refused() -> None:
    with pytest.raises(AdmissionRefused):
        admit_for_device(3000, 3000, _budget(32.0), scale=2)


@pytest.mark.parametrize("peak", [0.0, 8.0, float("nan"), float("inf")])
def test_invalid_device_budgets(peak: float) -> None:
    with pytest.raises(ValueError):
        admit_for_device(100, 100, _budget(peak))

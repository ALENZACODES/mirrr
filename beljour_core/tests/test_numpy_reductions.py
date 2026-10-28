"""Numerical contracts for the NumPy reduction compatibility fix.

The checks use synthetic scalar fields and points. They protect spatial axes,
replicated borders, strict mask thresholds and zero-movement diagnostics while
the production reductions use the NumPy APIs supported by the tested stubs.
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.core import masks
from plumb_api.engines.fill.learned import hole_box
from plumb_api.engines.repair.restore import _neighbour_range
from plumb_api.engines.shape.turn_field import regularise_targets


@pytest.mark.parametrize(
    "plane",
    [
        np.array([[0.375]], dtype=np.float64),
        np.array([[0.8, 0.2, 0.7, 0.1, 0.6]], dtype=np.float64),
        np.array([[0.8], [0.2], [0.7], [0.1], [0.6]], dtype=np.float64),
        np.array([[0.4, 0.9, 0.2, 0.6], [0.7, 0.1, 0.8, 0.3], [0.5, 0.0, 1.0, 0.25]]),
        (np.arange(48, dtype=np.float64) / 47.0).reshape(6, 8)[::-2, 1::2].T,
    ],
    ids=["single-pixel", "single-row", "single-column", "rectangle", "strided-transpose"],
)
def test_neighbour_extrema_reduce_samples_not_spatial_axes(plane: np.ndarray) -> None:
    before = plane.copy()
    height, width = plane.shape
    low, high = _neighbour_range(plane)

    assert low.shape == high.shape == plane.shape
    assert low.dtype == high.dtype == np.dtype(np.float64)
    # Scalar neighbourhoods give an independent reference for the 3 x 3 halo
    # limiter. Clamping coordinates is the replicated-edge border contract.
    for y in range(height):
        for x in range(width):
            samples = [
                float(plane[min(height - 1, max(0, row)), min(width - 1, max(0, column))])
                for row in range(y - 1, y + 2)
                for column in range(x - 1, x + 2)
            ]
            assert low[y, x] == min(samples)
            assert high[y, x] == max(samples)

    np.testing.assert_array_equal(plane, before)
    assert not np.shares_memory(low, plane)
    assert not np.shares_memory(high, plane)
    assert not np.shares_memory(low, high)


def test_mask_extrema_preserve_threshold_and_half_open_bounds_on_views() -> None:
    storage = np.zeros((8, 10), dtype=np.float32)
    mask = storage[::2, ::2]
    mask[0, 4] = 0.5
    mask[2, 1] = 0.75
    mask[3, 3] = 1.0
    before = storage.copy()

    # Coverage boxes use strictly greater than; a hole includes exactly 0.5.
    assert masks.bounding_box(mask, minimum=0.5) == (1, 2, 4, 4)
    box = hole_box(mask)
    assert box is not None
    assert box.to_json() == {"left": 1, "top": 0, "width": 4, "height": 4}
    assert masks.bounding_box(mask.T, minimum=0.5) == (2, 1, 4, 4)
    np.testing.assert_array_equal(storage, before)


@pytest.mark.parametrize("shape", [(0, 0), (0, 4), (3, 0), (3, 4)])
def test_empty_mask_support_has_no_bounding_reduction(shape: tuple[int, int]) -> None:
    mask = np.zeros(shape, dtype=np.float32)
    assert masks.bounding_box(mask) is None
    assert hole_box(mask) is None


@pytest.mark.parametrize("shift", [(0.0, 0.0), (3.0, -4.0)])
def test_pinned_turn_diagnostics_keep_requested_and_zero_applied_maxima(
    shift: tuple[float, float],
) -> None:
    source = np.array([[0.0, 0.0], [10.0, 0.0], [0.0, 10.0], [10.0, 10.0]])
    proposed = source + np.asarray(shift)
    before = proposed.copy()
    report = regularise_targets(source, proposed, 10.0, pinned=(0, 1, 2, 3))

    assert report.requested_max == math.hypot(*shift)
    assert report.applied_max == 0.0
    assert report.max_strain == 0.0
    assert report.to_json()["requested_max"] == math.hypot(*shift)
    assert report.to_json()["applied_max"] == 0.0
    np.testing.assert_array_equal(report.points, source)
    np.testing.assert_array_equal(proposed, before)


def test_empty_turn_geometry_is_rejected_before_reporting_zero_maxima() -> None:
    empty = np.empty((0, 2), dtype=np.float64)
    with pytest.raises(ValueError, match="3.*4096 points"):
        regularise_targets(empty, empty, 10.0)

"""Twenty identical runs; no timer thresholds or scheduling assumptions."""

from __future__ import annotations

import pytest

from plumb_api.engines.upscale.op_counts import tile_operation_plan, verify_operation_counts


def test_tile_work_count_same_in_twenty_runs() -> None:
    for _ in range(20):
        planned = tile_operation_plan(3000, 4000, 512)
        assert (planned.columns, planned.rows, planned.tile_calls) == (6, 8, 48)
        verify_operation_counts(planned, 48, 48)
        with pytest.raises(ValueError):
            verify_operation_counts(planned, 47, 48)


def test_edge_cases_zero_and_partial_tiles() -> None:
    assert tile_operation_plan(1, 1, 512).tile_calls == 1
    assert tile_operation_plan(513, 513, 512).tile_calls == 4
    for width, height, tile in ((0, 100, 32), (10, -1, 32), (20, 20, 0)):
        with pytest.raises(ValueError):
            tile_operation_plan(width, height, tile)

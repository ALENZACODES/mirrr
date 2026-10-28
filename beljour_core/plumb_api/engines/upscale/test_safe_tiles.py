"""Shape-only memory admission for the guarded upscale. Author: John Khan."""

from __future__ import annotations

import pytest

from .safe_tiles import (
    MAX_OUTPUT_PIXELS,
    OVERLAP,
    AdmissionRefused,
    admit,
    tile_scratch_bytes,
)


def test_counts_output_source_mask_and_tile_scratch() -> None:
    plan = admit(400, 300, channels=4, scale=2, budget_bytes=512 * 1024 * 1024)
    assert plan.source_bytes == 400 * 300 * 4
    assert plan.output_bytes == 800 * 600 * 4
    assert plan.mask_bytes == 800 * 600
    assert plan.tile_scratch_bytes == tile_scratch_bytes(400, OVERLAP, 2, 4)
    assert plan.peak_bytes == (plan.source_bytes + plan.output_bytes + plan.mask_bytes
                               + plan.tile_scratch_bytes)
    assert plan.tiles == 1


def test_scratch_formula_by_hand() -> None:
    read = 128 + 24
    rendered = read * 2 * read * 2
    assert tile_scratch_bytes(128, 12, 2, 3) == (
        read * read * 3 + 2 * rendered * 3 + 2 * rendered * 8 * 8 + 256 * 256 * 3
    )
    # The browser mirror (safe-tile-policy.test.mjs) asserts the same literal.
    assert tile_scratch_bytes(128, 12, 2, 3) == 12_649_664


def test_tighter_budgets_choose_smaller_tiles_deterministically() -> None:
    roomy = admit(2000, 1500, scale=2, budget_bytes=2 * 1024 ** 3)
    tight = admit(2000, 1500, scale=2, budget_bytes=96 * 1024 * 1024)
    assert tight.tile_side < roomy.tile_side
    assert tight.tiles > roomy.tiles
    assert tight == admit(2000, 1500, scale=2, budget_bytes=96 * 1024 * 1024)
    assert tight.peak_bytes <= tight.budget_bytes


def test_output_that_cannot_fit_is_refused_before_allocation() -> None:
    with pytest.raises(AdmissionRefused, match="no tile size"):
        admit(1500, 1500, scale=2, budget_bytes=40 * 1024 * 1024)


def test_pixel_limits() -> None:
    with pytest.raises(AdmissionRefused, match="output exceeds"):
        admit(2000, 2000, scale=4)
    with pytest.raises(AdmissionRefused, match="source exceeds"):
        admit(4000, 3500, scale=2)
    assert MAX_OUTPUT_PIXELS == 12_000_000
    admit(1000, 750, scale=4)
    with pytest.raises(AdmissionRefused, match="output exceeds"):
        admit(1000, 751, scale=4)


def test_public_report_is_counts_only() -> None:
    public = admit(64, 48, scale=4).public()
    assert public["output_width"] == 256 and public["output_height"] == 192
    assert public["basis"] == "SHAPE_ESTIMATE_NOT_MEASURED"
    assert all(isinstance(value, (int, str)) for value in public.values())


def test_tile_plan_covers_the_source_once() -> None:
    plan = admit(700, 300, scale=2, budget_bytes=64 * 1024 * 1024)
    covered = sum(tile.width * tile.height for tile in plan.tile_plan())
    assert covered == 700 * 300
    assert len(plan.tile_plan()) == plan.tiles

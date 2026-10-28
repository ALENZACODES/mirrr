"""Full-frame equivalence is an independent acceptance condition. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.filters.artistic import EffectUnavailable, render
from plumb_api.filters.artistic.oil import paint_texture
from plumb_api.filters.artistic.tiling import RenderCancelled, render_tiled, required_halo, tiles
from tests.artistic_helpers import drawn


@pytest.mark.parametrize("effect", ["ink-study", "pigment-oil"])
@pytest.mark.parametrize("side", [32, 47, 64, 512])
@pytest.mark.parametrize("rgba", [False, True])
def test_tiled_equals_whole_at_all_internal_edges(effect: str, side: int, rgba: bool) -> None:
    image, _, hair, eyes = drawn(111, 137, rgba=rgba)
    params = {"radius": 5, "texture": 0.8, "seed": 818} if effect == "pigment-oil" else {"ink": 0.9}
    whole = render(effect, image, hair_mask=hair, eye_mask=eyes, params=params)
    tiled = render_tiled(effect, image, hair_mask=hair, eye_mask=eyes, params=params, tile_size=side)
    np.testing.assert_array_equal(tiled.image, whole.image)
    assert tiled.metrics["maximum_working_pixels"] <= (side + 2 * required_halo(effect, params)) ** 2
    assert tiled.metrics["changed_pixels"] == whole.metrics["changed_pixels"]
    assert tiled.metrics["outside_max_error"] == 0
    assert tiled.metrics["alpha_unchanged"]


@pytest.mark.parametrize("radius", [1, 3, 12])
def test_large_paint_radius_halo_keeps_a_diagonal_edge(radius: int) -> None:
    image, _, _, _ = drawn(93, 107)
    yy, xx = np.mgrid[:107, :93]
    image[xx > yy] = (243, 18, 91)
    params = {"amount": 1, "radius": radius, "texture": 1, "brush_angle": 1.2}
    whole = render("pigment-oil", image, params=params)
    tiled = render_tiled("pigment-oil", image, params=params, tile_size=32)
    np.testing.assert_array_equal(whole.image, tiled.image)


def test_tile_interiors_partition_every_pixel_once_and_crops_cover_halo() -> None:
    coverage = np.zeros((103, 197), dtype=int)
    plan = list(tiles(197, 103, 64, 12))
    for tile in plan:
        coverage[tile.top:tile.bottom, tile.left:tile.right] += 1
        assert tile.crop_left <= tile.left < tile.right <= tile.crop_right
        assert tile.crop_top <= tile.top < tile.bottom <= tile.crop_bottom
        assert tile.crop_left == max(0, tile.left - 12)
        assert tile.crop_bottom == min(103, tile.bottom + 12)
    np.testing.assert_array_equal(coverage, 1)
    assert len(plan) == 8


def test_global_canvas_texture_crop_matches_uncropped_texture() -> None:
    full = paint_texture((150, 130), seed=212, brush_angle=0.3, canvas_scale=1.8)
    patch = paint_texture((40, 30), seed=212, brush_angle=0.3, canvas_scale=1.8, offset=(71, 38))
    np.testing.assert_array_equal(patch, full[38:78, 71:101])


def test_cancellation_never_returns_a_partial_output_or_mutates_source() -> None:
    image, _, _, _ = drawn(128, 100)
    original = image.copy()
    counts: list[tuple[int, int]] = []
    with pytest.raises(RenderCancelled):
        render_tiled("pigment-oil", image, tile_size=32,
                     cancelled=lambda: len(counts) >= 2,
                     progress=lambda done, total: counts.append((done, total)))
    assert counts == [(1, 16), (2, 16)]
    np.testing.assert_array_equal(image, original)


def test_cancellation_after_final_tile_also_discards_result() -> None:
    image, _, _, _ = drawn(64, 64)
    finished = []
    with pytest.raises(RenderCancelled):
        render_tiled("pigment-oil", image, tile_size=512,
                     cancelled=lambda: bool(finished), progress=lambda *_: finished.append(True))


def test_progress_counts_only_completed_tiles_and_finishes_at_total() -> None:
    image, _, _, _ = drawn(80, 96)
    counts: list[tuple[int, int]] = []
    render_tiled("pigment-oil", image, tile_size=32,
                 progress=lambda done, total: counts.append((done, total)))
    assert counts == [(i, 9) for i in range(1, 10)]


@pytest.mark.parametrize("shape", [(1, 100), (9000, 100), (8192, 8192)])
def test_invalid_export_plan_is_rejected_before_allocation(shape: tuple[int, int]) -> None:
    with pytest.raises(ValueError):
        list(tiles(*shape, 512, 1))


@pytest.mark.parametrize("side", [0, 31, 32.5, 1025, True])
def test_tile_side_is_explicitly_bounded(side: object) -> None:
    with pytest.raises(ValueError):
        list(tiles(80, 90, side, 1))


def test_contextual_effects_do_not_silently_use_unsafe_tiles() -> None:
    image, _, _, _ = drawn()
    for effect in ("rain-expression",):
        with pytest.raises(EffectUnavailable) as error:
            render_tiled(effect, image)
        assert error.value.code == "not_tileable"


@pytest.mark.parametrize("side", [32, 45, 64])
@pytest.mark.parametrize("palette", ["rose", "ivory", "violet"])
def test_crown_tiled_export_keeps_full_frame_scale_and_occlusion(side: int, palette: str) -> None:
    image, mesh, hair, _ = drawn(97, 113, rgba=True)
    params = {"palette": palette, "flowers": 9, "size": 1.3, "height": -0.07}
    full = render("meadow-crown", image, landmarks=mesh, hair_mask=hair, params=params)
    tiled = render_tiled("meadow-crown", image, mesh=mesh, hair_mask=hair, params=params, tile_size=side)
    np.testing.assert_array_equal(tiled.image, full.image)
    assert abs(tiled.metrics["visible_alpha_sum"] - full.metrics["visible_alpha_sum"]) < 1e-8
    np.testing.assert_array_equal(tiled.image[hair == 1], image[hair == 1])
    assert tiled.warnings == full.warnings


def test_crown_hidden_tile_does_not_mark_a_visible_whole_crown_hidden() -> None:
    image, mesh, _, _ = drawn(96, 128)
    hair = np.zeros(image.shape[:2])
    visible = render_tiled("meadow-crown", image, mesh=mesh, hair_mask=hair, tile_size=32)
    assert not any("hidden" in text for text in visible.warnings)
    hidden = render_tiled("meadow-crown", image, mesh=mesh, hair_mask=np.ones(hair.shape), tile_size=32)
    assert any("hidden" in text for text in hidden.warnings)
    np.testing.assert_array_equal(hidden.image, image)


def test_bad_or_missing_export_masks_are_not_assumed_empty() -> None:
    image, _, hair, eyes = drawn()
    with pytest.raises(EffectUnavailable):
        render_tiled("ink-study", image, eye_mask=eyes)
    invalid = hair.copy()
    invalid[-1, -1] = float("nan")
    with pytest.raises(ValueError):
        render_tiled("ink-study", image, hair_mask=invalid, eye_mask=eyes)
    with pytest.raises(ValueError):
        render_tiled("ink-study", image, hair_mask=hair[:-1], eye_mask=eyes)


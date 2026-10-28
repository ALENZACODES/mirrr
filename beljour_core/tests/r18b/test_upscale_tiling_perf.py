"""R18B cached tile planning and vectorized seam tests. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.upscale import tiling


def _outputs(height: int = 256, width: int = 320) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(1802)
    full = rng.integers(0, 256, size=(height, width, 4), dtype=np.uint8)
    tiled = full.copy()
    tiled[70:73, :, :3] = np.clip(tiled[70:73, :, :3].astype(np.int16) + 3, 0, 255)
    tiled[:, 130:132, :3] = np.clip(tiled[:, 130:132, :3].astype(np.int16) - 2, 0, 255)
    return full, tiled


def test_plan_is_cached_and_identity_stable() -> None:
    tiling.plan.cache_clear()
    first = tiling.plan(1300, 900, 256, 12)
    second = tiling.plan(1300, 900, 256, 12)
    assert first is second
    info = tiling.plan.cache_info()
    assert info.misses == 1
    assert info.hits == 1


@pytest.mark.parametrize(
    "width,height,tile_side,overlap",
    ((640, 480, 128, 8), (1024, 768, 256, 12), (301, 199, 96, 10)),
)
def test_cached_plan_covers_image_without_core_overlap(
    width: int,
    height: int,
    tile_side: int,
    overlap: int,
) -> None:
    tiles = tiling.plan(width, height, tile_side, overlap)
    coverage = np.zeros((height, width), dtype=np.uint8)
    for tile in tiles:
        coverage[tile.y0 : tile.y1, tile.x0 : tile.x1] += 1
        assert tile.read_x0 <= tile.x0 <= tile.x1 <= tile.read_x1
        assert tile.read_y0 <= tile.y0 <= tile.y1 <= tile.read_y1
    assert int(np.min(coverage)) == 1
    assert int(np.max(coverage)) == 1


def test_plan_cache_key_includes_overlap_and_tile_side() -> None:
    tiling.plan.cache_clear()
    first = tiling.plan(512, 512, 128, 8)
    second = tiling.plan(512, 512, 128, 12)
    third = tiling.plan(512, 512, 256, 12)
    assert first != second
    assert second != third
    assert tiling.plan.cache_info().misses == 3


@pytest.mark.parametrize("scale", (2, 4))
def test_vectorized_seam_error_matches_reference(scale: int) -> None:
    full, tiled = _outputs()
    tiles = tiling.plan(full.shape[1] // scale, full.shape[0] // scale, 64, 8)
    fast = tiling.seam_error(full, tiled, tiles, scale)
    reference = tiling.seam_error_reference(full, tiled, tiles, scale)
    assert fast == pytest.approx(reference, abs=1e-12)


def test_seam_error_zero_when_no_internal_boundaries() -> None:
    full = np.zeros((64, 64, 4), dtype=np.uint8)
    tile = tiling.Tile(0, 0, 32, 32, 0, 0, 32, 32)
    assert tiling.seam_error(full, full.copy(), (tile,), 2) == {
        "mean": 0.0,
        "max": 0.0,
        "p99": 0.0,
    }


def test_seam_error_rejects_shape_mismatch() -> None:
    full = np.zeros((64, 64, 4), dtype=np.uint8)
    tiled = np.zeros((64, 65, 4), dtype=np.uint8)
    with pytest.raises(ValueError, match="matching shapes"):
        tiling.seam_error(full, tiled, (), 2)


def test_seam_error_rejects_invalid_scale() -> None:
    full = np.zeros((64, 64, 4), dtype=np.uint8)
    with pytest.raises(ValueError, match="scale"):
        tiling.seam_error(full, full.copy(), (), 3)


def test_vectorized_seam_path_uses_single_array_concatenation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    full, tiled = _outputs(640, 768)
    tiles = tiling.plan(384, 320, 64, 8)
    reference = tiling.seam_error_reference(full, tiled, tiles, 2)
    views = tiling._seam_views(full, tiled, tiles, 2)
    seam_concatenations = 0
    concatenate = tiling.np.concatenate

    def fixed_views(*args: object, **kwargs: object) -> tuple[np.ndarray, ...]:
        return views

    def tracked_concatenate(values: object, *args: object, **kwargs: object) -> np.ndarray:
        nonlocal seam_concatenations
        if values is views:
            seam_concatenations += 1
        return concatenate(values, *args, **kwargs)

    monkeypatch.setattr(tiling, "_seam_views", fixed_views)
    monkeypatch.setattr(tiling.np, "concatenate", tracked_concatenate)
    fast = tiling.seam_error(full, tiled, tiles, 2)
    assert seam_concatenations == 1, "vectorized seam views must be concatenated exactly once"
    assert fast == pytest.approx(reference, abs=1e-12)


def test_memory_budget_is_monotone_in_scale_and_tile_size() -> None:
    small = tiling.memory_budget(256, 12, 2)
    large_scale = tiling.memory_budget(256, 12, 4)
    large_tile = tiling.memory_budget(512, 12, 2)
    assert large_scale["peak_bytes_estimate"] > small["peak_bytes_estimate"]
    assert large_tile["peak_bytes_estimate"] > small["peak_bytes_estimate"]


def test_recommended_tile_side_obeys_memory_limit() -> None:
    side = tiling.recommended_tile_side(4096, 3072, 4, max_peak_mb=64)
    budget = tiling.memory_budget(side, 12, 4)["peak_bytes_estimate"]
    assert budget <= 64 * 1024 * 1024


def test_recommended_tile_side_rejects_too_small_budget() -> None:
    with pytest.raises(ValueError, match=">=16"):
        tiling.recommended_tile_side(1000, 1000, 2, max_peak_mb=8)

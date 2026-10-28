"""Bounded-memory tile planning and stitch validation for classical upscale. Author: John Khan."""
from __future__ import annotations

import math
from dataclasses import dataclass
from functools import lru_cache

import numpy as np

from .engine import upscale


@dataclass(frozen=True)
class Tile:
    x0: int
    y0: int
    x1: int
    y1: int
    read_x0: int
    read_y0: int
    read_x1: int
    read_y1: int

    @property
    def width(self) -> int:
        return self.x1 - self.x0

    @property
    def height(self) -> int:
        return self.y1 - self.y0


@lru_cache(maxsize=128)
def plan(width: int, height: int, tile_side: int = 512, overlap: int = 12) -> tuple[Tile, ...]:
    """Return an immutable tile plan and cache repeated dimension/budget requests."""
    if width < 1 or height < 1:
        raise ValueError("image dimensions must be positive")
    if tile_side < 64 or tile_side > 4096:
        raise ValueError("tile_side outside supported range")
    if overlap < 2 or overlap * 2 >= tile_side:
        raise ValueError("overlap outside supported range")
    rows: list[Tile] = []
    for y0 in range(0, height, tile_side):
        y1 = min(height, y0 + tile_side)
        for x0 in range(0, width, tile_side):
            x1 = min(width, x0 + tile_side)
            rows.append(
                Tile(
                    x0=x0,
                    y0=y0,
                    x1=x1,
                    y1=y1,
                    read_x0=max(0, x0 - overlap),
                    read_y0=max(0, y0 - overlap),
                    read_x1=min(width, x1 + overlap),
                    read_y1=min(height, y1 + overlap),
                )
            )
    return tuple(rows)


def memory_budget(tile_side: int, overlap: int, scale: int, channels: int = 4) -> dict[str, int]:
    if scale not in (2, 4):
        raise ValueError("scale must be 2 or 4")
    if channels not in (3, 4):
        raise ValueError("channels must be 3 or 4")
    side = tile_side + 2 * overlap
    input_bytes = side * side * channels
    output_bytes = side * scale * side * scale * channels
    float_working = side * scale * side * scale * 8 * 4
    return {
        "input_bytes": input_bytes,
        "output_bytes": output_bytes,
        "working_bytes_estimate": float_working,
        "peak_bytes_estimate": input_bytes + output_bytes + float_working,
    }


def _paste_core(destination: np.ndarray, rendered: np.ndarray, tile: Tile, scale: int) -> None:
    top = (tile.y0 - tile.read_y0) * scale
    left = (tile.x0 - tile.read_x0) * scale
    bottom = top + tile.height * scale
    right = left + tile.width * scale
    destination[
        tile.y0 * scale : tile.y1 * scale,
        tile.x0 * scale : tile.x1 * scale,
    ] = rendered[top:bottom, left:right]


def upscale_tiled(
    image: np.ndarray,
    scale: int = 2,
    detail: float = 0.55,
    tile_side: int = 512,
    overlap: int = 12,
) -> np.ndarray:
    if image.ndim != 3 or image.dtype != np.uint8 or image.shape[2] not in (3, 4):
        raise ValueError("image must be RGB/RGBA uint8")
    height, width = image.shape[:2]
    output = np.empty((height * scale, width * scale, image.shape[2]), dtype=np.uint8)
    for tile in plan(width, height, tile_side, overlap):
        source = image[tile.read_y0 : tile.read_y1, tile.read_x0 : tile.read_x1]
        rendered = upscale(source, scale=scale, detail=detail)
        _paste_core(output, rendered, tile, scale)
    return output


def _seam_views(
    full: np.ndarray,
    tiled: np.ndarray,
    tiles: tuple[Tile, ...],
    scale: int,
) -> tuple[np.ndarray, ...]:
    """Return vectorizable absolute-difference views around unique tile boundaries."""
    height, width = full.shape[:2]
    vertical = sorted(
        {
            coordinate
            for tile in tiles
            for coordinate in (tile.x0 * scale, tile.x1 * scale)
            if 0 < coordinate < width
        }
    )
    horizontal = sorted(
        {
            coordinate
            for tile in tiles
            for coordinate in (tile.y0 * scale, tile.y1 * scale)
            if 0 < coordinate < height
        }
    )
    views: list[np.ndarray] = []
    for x in vertical:
        left = max(0, x - 1)
        right = min(width, x + 1)
        views.append(
            np.abs(
                full[:, left:right, :3].astype(np.int16)
                - tiled[:, left:right, :3].astype(np.int16)
            ).reshape(-1)
        )
    for y in horizontal:
        top = max(0, y - 1)
        bottom = min(height, y + 1)
        views.append(
            np.abs(
                full[top:bottom, :, :3].astype(np.int16)
                - tiled[top:bottom, :, :3].astype(np.int16)
            ).reshape(-1)
        )
    return tuple(views)


def seam_error(full: np.ndarray, tiled: np.ndarray, tiles: tuple[Tile, ...], scale: int) -> dict[str, float]:
    """Measure stitching error without extending a Python list one scalar at a time."""
    if full.shape != tiled.shape:
        raise ValueError("full and tiled outputs must have matching shapes")
    if scale not in (2, 4):
        raise ValueError("scale must be 2 or 4")
    views = _seam_views(full, tiled, tiles, scale)
    if not views:
        return {"mean": 0.0, "max": 0.0, "p99": 0.0}
    values = np.concatenate(views).astype(np.float64, copy=False)
    return {
        "mean": float(np.mean(values)),
        "max": float(np.max(values)),
        "p99": float(np.quantile(values, 0.99)),
    }


def seam_error_reference(
    full: np.ndarray,
    tiled: np.ndarray,
    tiles: tuple[Tile, ...],
    scale: int,
) -> dict[str, float]:
    """Readable scalar-list reference retained for regression comparison."""
    if full.shape != tiled.shape:
        raise ValueError("full and tiled outputs must have matching shapes")
    errors: list[float] = []
    height, width = full.shape[:2]
    seen_vertical: set[int] = set()
    seen_horizontal: set[int] = set()
    for tile in tiles:
        for x in (tile.x0 * scale, tile.x1 * scale):
            if x <= 0 or x >= width or x in seen_vertical:
                continue
            seen_vertical.add(x)
            left = max(0, x - 1)
            right = min(width, x + 1)
            errors.extend(
                np.abs(
                    full[:, left:right, :3].astype(np.float64)
                    - tiled[:, left:right, :3].astype(np.float64)
                )
                .reshape(-1)
                .tolist()
            )
        for y in (tile.y0 * scale, tile.y1 * scale):
            if y <= 0 or y >= height or y in seen_horizontal:
                continue
            seen_horizontal.add(y)
            top = max(0, y - 1)
            bottom = min(height, y + 1)
            errors.extend(
                np.abs(
                    full[top:bottom, :, :3].astype(np.float64)
                    - tiled[top:bottom, :, :3].astype(np.float64)
                )
                .reshape(-1)
                .tolist()
            )
    if not errors:
        return {"mean": 0.0, "max": 0.0, "p99": 0.0}
    values = np.asarray(errors, dtype=np.float64)
    return {
        "mean": float(np.mean(values)),
        "max": float(np.max(values)),
        "p99": float(np.quantile(values, 0.99)),
    }


def recommended_tile_side(
    width: int,
    height: int,
    scale: int,
    max_peak_mb: float = 96.0,
) -> int:
    if not math.isfinite(max_peak_mb) or max_peak_mb < 16:
        raise ValueError("max_peak_mb must be finite and >=16")
    candidates = (1024, 768, 640, 512, 384, 256, 192, 128)
    limit = int(max_peak_mb * 1024 * 1024)
    for candidate in candidates:
        if candidate > max(width, height) and candidate != candidates[-1]:
            continue
        if memory_budget(candidate, 12, scale)["peak_bytes_estimate"] <= limit:
            return candidate
    return 128

"""E06 warp fields: backward maps, coarse-grid evaluation, strength, weights and composition.

A warp field is a pair of backward maps (CONTRACTS.md §19): output pixel (col, row) reads
the source at (map_x[row, col], map_y[row, col]), with pixel centres at integer
coordinates, exactly as `engines/core/resample.remap` samples them.

Smooth warps (thin plate spline, moving least squares) are evaluated on a coarse grid of
nodes at (i * step, j * step) for i = 0..ceil(W / step), j = 0..ceil(H / step), and every
pixel reads the grid bilinearly (node coordinates clamped to the grid). `step = 1` is an
exact per-pixel evaluation. The last row and column of nodes may sit just past the image
edge; the warp functions handle that and the sampler clamps.

Mirrored in `web/src/engines/warp/field.ts` (parity vectors in parity/warp-fill-r5.json).
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core.resample import jacobian_determinant, remap

Floats = NDArray[np.float64]
PointFunction = Callable[[Floats, Floats], tuple[Floats, Floats]]
MAX_GRID_STEP = 64


@dataclass(frozen=True)
class Field:
    """Backward maps of one warp; both are H x W float64 arrays."""
    map_x: Floats
    map_y: Floats

    def __post_init__(self) -> None:
        mx = np.asarray(self.map_x, dtype=np.float64)
        my = np.asarray(self.map_y, dtype=np.float64)
        if mx.ndim != 2 or mx.shape != my.shape or 0 in mx.shape:
            raise ValueError("a warp field needs two matching, non-empty H x W maps")
        if not (np.all(np.isfinite(mx)) and np.all(np.isfinite(my))):
            raise ValueError("warp maps must be finite")
        object.__setattr__(self, "map_x", mx)
        object.__setattr__(self, "map_y", my)

    @property
    def height(self) -> int:
        return int(self.map_x.shape[0])

    @property
    def width(self) -> int:
        return int(self.map_x.shape[1])

    def displacement(self) -> tuple[Floats, Floats]:
        """(dx, dy): where each output pixel reads, relative to itself."""
        xx, yy = _identity(self.height, self.width)
        return self.map_x - xx, self.map_y - yy

    def move(self) -> Floats:
        dx, dy = self.displacement()
        return np.hypot(dx, dy)

    def jacobian(self) -> Floats:
        return jacobian_determinant(self.map_x, self.map_y)


def _identity(height: int, width: int) -> tuple[Floats, Floats]:
    if height < 1 or width < 1:
        raise ValueError("field size must be positive")
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    return xx, yy


def identity(height: int, width: int) -> Field:
    xx, yy = _identity(height, width)
    return Field(xx, yy)


def _check_step(step: int) -> int:
    if not isinstance(step, (int, np.integer)) or isinstance(step, bool) or not 1 <= step <= MAX_GRID_STEP:
        raise ValueError(f"grid step must be a whole number from 1 to {MAX_GRID_STEP}")
    return int(step)


def grid_nodes(height: int, width: int, step: int) -> tuple[Floats, Floats]:
    """Node coordinates along x and along y for a coarse evaluation grid."""
    step = _check_step(step)
    if height < 1 or width < 1:
        raise ValueError("field size must be positive")
    gx = np.arange(0, -(-width // step) * step + 1, step, dtype=np.float64)
    gy = np.arange(0, -(-height // step) * step + 1, step, dtype=np.float64)
    if step == 1:
        gx, gy = gx[:width], gy[:height]
    return gx, gy


def sample_plane(plane: np.ndarray, x: np.ndarray, y: np.ndarray) -> Floats:
    """Bilinear read of a 2-D float plane at float coordinates, clamped to its edges."""
    arr = np.asarray(plane, dtype=np.float64)
    h, w = arr.shape
    x = np.clip(np.asarray(x, dtype=np.float64), 0, w - 1)
    y = np.clip(np.asarray(y, dtype=np.float64), 0, h - 1)
    x0 = np.floor(x).astype(np.int64)
    y0 = np.floor(y).astype(np.int64)
    x1 = np.minimum(x0 + 1, w - 1)
    y1 = np.minimum(y0 + 1, h - 1)
    fx = x - x0
    fy = y - y0
    top = arr[y0, x0] * (1 - fx) + arr[y0, x1] * fx
    bottom = arr[y1, x0] * (1 - fx) + arr[y1, x1] * fx
    return top * (1 - fy) + bottom * fy


def upsample_grid(grid_x: np.ndarray, grid_y: np.ndarray, height: int, width: int, step: int) -> Field:
    """Turn values on the coarse nodes into per-pixel maps (bilinear, clamped)."""
    step = _check_step(step)
    gx_nodes, gy_nodes = grid_nodes(height, width, step)
    if grid_x.shape != (len(gy_nodes), len(gx_nodes)) or grid_y.shape != grid_x.shape:
        raise ValueError("grid values do not match the node layout")
    if step == 1:
        return Field(np.array(grid_x, dtype=np.float64), np.array(grid_y, dtype=np.float64))
    xx, yy = _identity(height, width)
    cx, cy = xx / step, yy / step
    return Field(sample_plane(grid_x, cx, cy), sample_plane(grid_y, cx, cy))


def from_function(height: int, width: int, fn: PointFunction, step: int = 4) -> Field:
    """Evaluate a vectorised backward point function on the grid and upsample it."""
    gx, gy = grid_nodes(height, width, step)
    mx, my = np.meshgrid(gx, gy)
    sx, sy = fn(mx.ravel(), my.ravel())
    shape = (len(gy), len(gx))
    return upsample_grid(np.asarray(sx, dtype=np.float64).reshape(shape),
                         np.asarray(sy, dtype=np.float64).reshape(shape), height, width, step)


def scale(field: Field, strength: float) -> Field:
    """Same warp at a fraction (or multiple) of its displacement."""
    if not np.isfinite(strength):
        raise ValueError("strength must be finite")
    xx, yy = _identity(field.height, field.width)
    return Field(xx + strength * (field.map_x - xx), yy + strength * (field.map_y - yy))


def weighted(field: Field, weights: np.ndarray) -> Field:
    """Displacement times a per-pixel weight; weight 0 leaves a pixel exactly in place."""
    w = np.asarray(weights, dtype=np.float64)
    if w.shape != field.map_x.shape:
        raise ValueError("weights must match the field size")
    if not np.all(np.isfinite(w)) or np.any(w < 0) or np.any(w > 1):
        raise ValueError("weights must be finite and in [0, 1]")
    xx, yy = _identity(field.height, field.width)
    out_x = np.where(w > 0, xx + w * (field.map_x - xx), xx)
    out_y = np.where(w > 0, yy + w * (field.map_y - yy), yy)
    return Field(out_x, out_y)


def compose(outer: Field, inner: Field) -> Field:
    """One field equal to warping by `inner` first and then by `outer`.

    Output pixel p reads the inner result at outer(p), and the inner result there reads
    the source at inner(outer(p)), sampled bilinearly from inner's maps."""
    if outer.map_x.shape != inner.map_x.shape:
        raise ValueError("fields must be the same size to compose")
    return Field(sample_plane(inner.map_x, outer.map_x, outer.map_y),
                 sample_plane(inner.map_y, outer.map_x, outer.map_y))


def apply(image: np.ndarray, field: Field, *, border: str = "edge", linear_light: bool = True) -> np.ndarray:
    """Resample an RGB or RGBA uint8 image through the field (linear light by default)."""
    if image.shape[:2] != field.map_x.shape:
        raise ValueError("image and field must be the same size")
    return remap(image, field.map_x, field.map_y, border=border, linear_light=linear_light)


@dataclass(frozen=True)
class MoveStats:
    max_move: float
    mean_move: float
    moved_share: float          # share of pixels reading more than `threshold` px away

    def to_json(self) -> dict[str, float]:
        return {"max_move": self.max_move, "mean_move": self.mean_move, "moved_share": self.moved_share}


def move_stats(field: Field, threshold: float = 0.5) -> MoveStats:
    move = field.move()
    return MoveStats(float(np.max(move)), float(move.mean()), float((move > threshold).mean()))

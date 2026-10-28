"""Tile-stable, halo-safe interpolation kernels for local CPU upscaling.

Global destination coordinates determine each sample. No tile-edge padding
or independently normalized tile can introduce a seam. Alpha has a separate
pixel-centre bilinear contract consistent with the existing undo/guard path.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError

FloatArray = npt.NDArray[np.float32]


@dataclass(frozen=True, slots=True)
class TileRegion:
    x0: int
    x1: int
    y0: int
    y1: int

    @property
    def pixel_count(self) -> int:
        return (self.x1 - self.x0) * (self.y1 - self.y0)


def tile_regions(width: int, height: int, *, tile_size: int = 192) -> tuple[TileRegion, ...]:
    if type(width) is not int or type(height) is not int or width < 1 or height < 1:
        raise CommandValidationError("invalid_tiles", "Tile dimensions must be positive.")
    if type(tile_size) is not int or not 16 <= tile_size <= 1024:
        raise CommandValidationError("invalid_tiles", "Tile size must be 16 to 1024 pixels.")
    if width * height > 24_000_000:
        raise CommandValidationError("invalid_tiles", "Destination exceeds 24 MP.")
    return tuple(
        TileRegion(x, min(x + tile_size, width), y, min(y + tile_size, height))
        for y in range(0, height, tile_size)
        for x in range(0, width, tile_size)
    )


def cubic_kernel(distance: npt.NDArray[np.float64]) -> npt.NDArray[np.float64]:
    """Keys cubic with a=-0.5; global 4-tap sampling, no learned weights."""
    x = np.abs(distance)
    near = 1.5 * x**3 - 2.5 * x**2 + 1.0
    far = -0.5 * x**3 + 2.5 * x**2 - 4.0 * x + 2.0
    return np.where(x < 1.0, near, np.where(x < 2.0, far, 0.0))


def coordinates(
    first: int, last: int, scale: int, length: int,
) -> tuple[npt.NDArray[np.intp], npt.NDArray[np.float64]]:
    if scale not in (2, 4) or first < 0 or last <= first or last > length * scale:
        raise CommandValidationError("invalid_scale", "Cubic sample coordinates are invalid.")
    position = (np.arange(first, last, dtype=np.float64) + 0.5) / scale - 0.5
    base = np.floor(position).astype(np.intp)
    indices = np.stack(tuple(np.clip(base + shift, 0, length - 1) for shift in (-1, 0, 1, 2)), axis=1)
    sample = np.stack(
        tuple(cubic_kernel(position - (base + shift)) for shift in (-1, 0, 1, 2)), axis=1,
    )
    sample /= np.sum(sample, axis=1, keepdims=True)
    return indices, sample


def sample_cubic_tile(source: FloatArray, region: TileRegion, scale: int) -> FloatArray:
    if source.ndim != 3 or source.shape[2] not in (3, 4):
        raise CommandValidationError("invalid_array", "Cubic source must be RGB or RGBA.")
    y_indices, y_weights = coordinates(region.y0, region.y1, scale, source.shape[0])
    x_indices, x_weights = coordinates(region.x0, region.x1, scale, source.shape[1])
    minimum = int(np.min(y_indices))
    maximum = int(np.max(y_indices))
    rows = source[minimum:maximum + 1, :, :]
    x_result = np.zeros((rows.shape[0], region.x1 - region.x0, source.shape[2]), dtype=np.float32)
    for tap in range(4):
        x_result += rows[:, x_indices[:, tap], :] * x_weights[None, :, tap, None]
    output = np.zeros((region.y1 - region.y0, region.x1 - region.x0, source.shape[2]), dtype=np.float32)
    for tap in range(4):
        source_rows = y_indices[:, tap] - minimum
        output += x_result[source_rows, :, :] * y_weights[:, tap, None, None]
    return output


def sample_alpha_tile(alpha: FloatArray, region: TileRegion, scale: int) -> FloatArray:
    """Four-neighbour bilinear, with the same rounding as resize_reference."""
    height, width = alpha.shape
    yy = np.clip((np.arange(region.y0, region.y1, dtype=np.float64) + 0.5) / scale - 0.5, 0.0, height - 1.0)
    xx = np.clip((np.arange(region.x0, region.x1, dtype=np.float64) + 0.5) / scale - 0.5, 0.0, width - 1.0)
    y0 = np.floor(yy).astype(np.intp)
    x0 = np.floor(xx).astype(np.intp)
    y1 = np.minimum(height - 1, y0 + 1)
    x1 = np.minimum(width - 1, x0 + 1)
    wy = yy - y0
    wx = xx - x0
    upper = alpha[y0[:, None], x0[None, :]] * (1.0 - wx[None, :])
    upper += alpha[y0[:, None], x1[None, :]] * wx[None, :]
    lower = alpha[y1[:, None], x0[None, :]] * (1.0 - wx[None, :])
    lower += alpha[y1[:, None], x1[None, :]] * wx[None, :]
    return np.asarray((1.0 - wy[:, None]) * upper + wy[:, None] * lower, dtype=np.float32)


def clip_ringing(rgb: FloatArray, source: FloatArray, region: TileRegion, scale: int) -> FloatArray:
    """Limit cubic overshoot against the four real nearest source samples."""
    y = np.clip((np.arange(region.y0, region.y1, dtype=np.float64) + 0.5) / scale - 0.5, 0, source.shape[0] - 1)
    x = np.clip((np.arange(region.x0, region.x1, dtype=np.float64) + 0.5) / scale - 0.5, 0, source.shape[1] - 1)
    y0 = np.floor(y).astype(np.intp)
    x0 = np.floor(x).astype(np.intp)
    y1 = np.minimum(source.shape[0] - 1, y0 + 1)
    x1 = np.minimum(source.shape[1] - 1, x0 + 1)
    neighbours = (
        source[y0[:, None], x0[None, :], :],
        source[y0[:, None], x1[None, :], :],
        source[y1[:, None], x0[None, :], :],
        source[y1[:, None], x1[None, :], :],
    )
    samples = np.stack(neighbours, axis=0)
    lower = np.min(samples, axis=0) - 0.012
    upper = np.max(samples, axis=0) + 0.012
    return np.clip(rgb, lower, upper)

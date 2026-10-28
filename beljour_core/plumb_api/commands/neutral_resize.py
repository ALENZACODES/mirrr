"""Byte-exact tiled bilinear baseline for a neutral 2x/4x upscale.

At level 1.0 the image changes size, not its photographic treatment.
This reproduces the checked original-image resize contract independently of
production cubic/detail passes. No model, private photo or remote service.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .frames import MAX_IMAGE_PIXELS, ImageFrame
from .upscale_kernel import TileRegion, tile_regions


class NeutralResizeResult:
    """Immutable output with bounded per-tile workspace accounting."""

    def __init__(
        self, image: ImageFrame, tiles: int, estimated_peak_tile_bytes: int,
        fast_path_used: bool = False,
    ) -> None:
        self.image = image
        self.tiles = tiles
        self.estimated_peak_tile_bytes = estimated_peak_tile_bytes
        self.fast_path_used = fast_path_used


def _axis_coordinates(
    first: int,
    last: int,
    source_size: int,
    target_size: int,
) -> tuple[npt.NDArray[np.intp], npt.NDArray[np.intp], npt.NDArray[np.float64]]:
    """Match resize_reference's clamped pixel-center coordinates."""
    positions = np.arange(first, last, dtype=np.float64)
    mapped = np.asarray((positions + 0.5) * source_size / target_size - 0.5, dtype=np.float64)
    mapped = np.asarray(np.clip(mapped, 0.0, float(source_size - 1)), dtype=np.float64)
    near = np.asarray(np.floor(mapped), dtype=np.intp)
    far = np.asarray(np.minimum(source_size - 1, near + 1), dtype=np.intp)
    return near, far, np.asarray(mapped - near, dtype=np.float64)


def _bilinear_tile(
    original: npt.NDArray[np.uint8],
    tile: TileRegion,
    target_width: int,
    target_height: int,
) -> npt.NDArray[np.uint8]:
    """Float64 arithmetic/rounding match the Python reference byte by byte."""
    source_height, source_width, _channels = original.shape
    x0, x1, wx = _axis_coordinates(tile.x0, tile.x1, source_width, target_width)
    y0, y1, wy = _axis_coordinates(tile.y0, tile.y1, source_height, target_height)
    left_weight = (1.0 - wx)[None, :, None]
    right_weight = wx[None, :, None]
    top_left = np.asarray(original[y0[:, None], x0[None, :], :], dtype=np.float64)
    top_right = np.asarray(original[y0[:, None], x1[None, :], :], dtype=np.float64)
    bottom_left = np.asarray(original[y1[:, None], x0[None, :], :], dtype=np.float64)
    bottom_right = np.asarray(original[y1[:, None], x1[None, :], :], dtype=np.float64)
    upper = left_weight * top_left + right_weight * top_right
    lower = left_weight * bottom_left + right_weight * bottom_right
    values = (1.0 - wy)[:, None, None] * upper + wy[:, None, None] * lower
    return np.asarray(np.floor(np.clip(values, 0.0, 255.0) + 0.5), dtype=np.uint8)


def resize_neutral_tiled(
    original: ImageFrame,
    *,
    scale: int,
    tile_size: int,
) -> NeutralResizeResult:
    """Resample without enhancement, honoring the existing neutral contract.

    Intermediate colour planes are allocated for one destination tile at a
    time. A full destination buffer is unavoidable, but each per-tile plane is
    bounded regardless of the photograph's total dimensions.
    """
    if not isinstance(original, ImageFrame):
        raise CommandValidationError("invalid_frame", "Neutral resize requires a checked frame.")
    if type(scale) is not int or scale not in (2, 4):
        raise CommandValidationError("invalid_scale", "Neutral resize supports 2x and 4x only.")
    if type(tile_size) is not int or not 16 <= tile_size <= 1024:
        raise CommandValidationError("invalid_tiles", "Neutral resize tile size is invalid.")
    width = original.width * scale
    height = original.height * scale
    if width * height > MAX_IMAGE_PIXELS:
        raise CommandValidationError("invalid_dimensions", "Neutral resize exceeds 24 MP.")
    source = np.frombuffer(original.pixels, dtype=np.uint8).reshape(
        original.height, original.width, original.channels)
    output = np.empty((height, width, original.channels), dtype=np.uint8)
    plan = tile_regions(width, height, tile_size=tile_size)
    maximum_bytes = 0
    # Probe cheaply before a full constant-image check. Common photographs exit
    # immediately; uniformly coloured backdrops avoid all tile intermediates.
    sample = source[0, 0, :]
    probes = (
        source[0, -1, :], source[-1, 0, :],
        source[-1, -1, :], source[original.height // 2, original.width // 2, :],
    )
    constant = all(bool(np.array_equal(sample, pixel)) for pixel in probes)
    constant = constant and bool(np.all(source == sample))
    if constant:
        output[:] = sample
        return NeutralResizeResult(
            ImageFrame(width, height, original.channels, output.tobytes()),
            len(plan), 0, fast_path_used=True,
        )
    for tile in plan:
        values = _bilinear_tile(source, tile, width, height)
        output[tile.y0:tile.y1, tile.x0:tile.x1, :] = values
        tile_pixels = tile.pixel_count * original.channels
        maximum_bytes = max(maximum_bytes, tile_pixels * (7 * 8 + 1))
    return NeutralResizeResult(
        ImageFrame(width, height, original.channels, output.tobytes()),
        len(plan),
        maximum_bytes,
    )

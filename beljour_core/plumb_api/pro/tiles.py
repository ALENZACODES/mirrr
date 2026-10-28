"""Bounded-memory Python reference for local projected masked tone curves.

This is a correctness oracle for synthetic fixtures, not a production video
engine, browser encoder, or a promise of 12 MP throughput. Sampling is nearest
neighbour; browser Canvas2D uses high-quality reconstruction at other scales.
"""

from __future__ import annotations

import math
from collections.abc import Iterator, Sequence
from dataclasses import dataclass

from .geometry import Geometry, image_size
from .masks import Mask, coverage_at, validate_masks

MAX_TILE_EDGE = 512
MAX_TILE_BYTES = 5 * MAX_TILE_EDGE * MAX_TILE_EDGE


@dataclass(frozen=True)
class TilePlan:
    """Output dimensions, grid and upper bound on one tile's RGBA scratch."""

    width: int
    height: int
    edge: int
    columns: int
    rows: int
    scratch_limit: int

    @property
    def count(self) -> int:
        return self.columns * self.rows


@dataclass(frozen=True)
class TileResult:
    x: int
    y: int
    width: int
    height: int
    rgba: bytes


@dataclass(frozen=True)
class AffineSampler:
    """Source pixel coordinates of the centre of each output pixel."""

    xx: float
    xy: float
    xo: float
    yx: float
    yy: float
    yo: float

    def at(self, x: int, y: int) -> tuple[float, float]:
        return (self.xx * (x + 0.5) + self.xy * (y + 0.5) + self.xo,
                self.yx * (x + 0.5) + self.yy * (y + 0.5) + self.yo)


def tile_plan(width: int, height: int, edge: int = 256) -> TilePlan:
    image_size(width, height)
    if isinstance(edge, bool) or not isinstance(edge, int) or not 1 <= edge <= MAX_TILE_EDGE:
        raise ValueError("tile edge must be an integer from 1 to 512")
    cols = (width + edge - 1) // edge
    rows = (height + edge - 1) // edge
    return TilePlan(width, height, edge, cols, rows, min(width, edge) * min(height, edge) * 5)


def affine_sampler(geometry: Geometry) -> AffineSampler:
    """Keep the crop and rotation convention shared with inverse_point."""
    image_size(geometry.out_width, geometry.out_height)
    theta = math.radians(geometry.rotation)
    cosine = math.cos(theta)
    sine = math.sin(theta)
    projected_w = abs(geometry.crop_width * cosine) + abs(geometry.crop_height * sine)
    projected_h = abs(geometry.crop_width * sine) + abs(geometry.crop_height * cosine)
    dx = projected_w / geometry.out_width
    dy = projected_h / geometry.out_height
    xx = dx * cosine
    xy = dy * sine
    yx = -dx * sine
    yy = dy * cosine
    cx = geometry.x + geometry.crop_width / 2
    cy = geometry.y + geometry.crop_height / 2
    xo = cx - xx * geometry.out_width / 2 - xy * geometry.out_height / 2
    yo = cy - yx * geometry.out_width / 2 - yy * geometry.out_height / 2
    return AffineSampler(xx, xy, xo, yx, yy, yo)


def _lut_check(luts: tuple[Sequence[int], Sequence[int], Sequence[int]]) -> None:
    for channel in luts:
        if len(channel) != 256:
            raise ValueError("tone curve LUT must contain 256 entries")
        if any(isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 255
               for value in channel):
            raise ValueError("tone LUT entries must be bytes")


def render_tiles(source: bytes, source_width: int, source_height: int,
                 geometry: Geometry, masks: tuple[Mask, ...],
                 luts: tuple[Sequence[int], Sequence[int], Sequence[int]], *,
                 edge: int = 256, matte: bool = False) -> Iterator[TileResult]:
    """Yield one RGBA tile at a time; do not materialize the full output frame.

    Source is caller-owned. Mask evaluation is performed in original normalized
    source space, after output coordinates are projected through the crop.
    """
    image_size(source_width, source_height)
    if len(source) != source_width * source_height * 4:
        raise ValueError("source dimensions and RGBA byte count disagree")
    plan = tile_plan(geometry.out_width, geometry.out_height, edge)
    validate_masks(masks)
    _lut_check(luts)
    affine = affine_sampler(geometry)
    red, green, blue = luts
    crop_right = geometry.x + geometry.crop_width
    crop_bottom = geometry.y + geometry.crop_height
    blank = (255, 255, 255, 255) if matte else (0, 0, 0, 0)
    for row in range(plan.rows):
        y0 = row * edge
        tile_height = min(edge, plan.height - y0)
        for col in range(plan.columns):
            x0 = col * edge
            tile_width = min(edge, plan.width - x0)
            buffer = bytearray(tile_width * tile_height * 4)
            for local_y in range(tile_height):
                pixel_y = y0 + local_y
                source_x, source_y = affine.at(x0, pixel_y)
                for local_x in range(tile_width):
                    offset = (local_y * tile_width + local_x) * 4
                    valid = (geometry.x <= source_x < crop_right
                             and geometry.y <= source_y < crop_bottom
                             and 0 <= source_x < source_width
                             and 0 <= source_y < source_height)
                    if not valid:
                        buffer[offset:offset + 4] = bytes(blank)
                    else:
                        pixel_x = min(source_width - 1, int(source_x))
                        pixel_row = min(source_height - 1, int(source_y))
                        original = (pixel_row * source_width + pixel_x) * 4
                        r, g, b, a = source[original:original + 4]
                        if a != 0:
                            strength = coverage_at(masks, source_x / source_width,
                                                   source_y / source_height,
                                                   source_width, source_height)
                            r = round(r + (red[r] - r) * strength / 255)
                            g = round(g + (green[g] - g) * strength / 255)
                            b = round(b + (blue[b] - b) * strength / 255)
                        buffer[offset:offset + 4] = bytes((r, g, b, a))
                    source_x += affine.xx
                    source_y += affine.yx
            yield TileResult(x0, y0, tile_width, tile_height, bytes(buffer))


def assemble_tiles(tiles: Iterator[TileResult], width: int, height: int) -> bytes:
    """Small fixture convenience, not used for production-sized exports."""
    image_size(width, height)
    if width * height > 1_000_000:
        raise ValueError("reference assembly is restricted to one megapixel")
    frame = bytearray(width * height * 4)
    seen = bytearray(width * height)
    for tile in tiles:
        if (tile.width < 1 or tile.height < 1 or tile.x < 0 or tile.y < 0
                or tile.x + tile.width > width or tile.y + tile.height > height
                or len(tile.rgba) != tile.width * tile.height * 4):
            raise ValueError("tile is invalid or lies outside the output")
        for y in range(tile.height):
            for x in range(tile.width):
                index = (tile.y + y) * width + tile.x + x
                if seen[index]:
                    raise ValueError("overlapping tiles are not allowed")
                seen[index] = 1
                source_offset = (y * tile.width + x) * 4
                frame[index * 4:index * 4 + 4] = tile.rgba[source_offset:source_offset + 4]
    if 0 in seen:
        raise ValueError("incomplete tile coverage")
    return bytes(frame)

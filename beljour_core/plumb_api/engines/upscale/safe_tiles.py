"""Deterministic memory admission for the guarded (safe) upscale path.

Before any pixel is enlarged, the request is priced from its geometry alone: the
full output buffer, the source read, the upscaled face-coverage mask, and the
per-tile scratch for one tile plus its halo (two renders, the detailed engine
output and the low-detail reference, with their float working arrays). The
largest tile side whose total fits the budget is chosen; if none fits, or the
output is larger than the local limit, the request is refused while nothing has
been allocated. These are shape-derived estimates, not measured process peaks.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from .planner import DeviceBudget
from .tiling import Tile, plan

TILE_SIDES = (1024, 768, 640, 512, 384, 256, 192, 128)
OVERLAP = 12
# Two renders per tile, each with the engine's float64 working arrays: the
# existing tiling budget counts 8 float32-sized planes per output pixel; ASSUMED
# here as 8 float64 planes per render to stay conservative for NumPy.
FLOAT_PLANES = 8
FLOAT_BYTES = 8
MAX_SOURCE_PIXELS = 12_000_000
# The 12 MP identity edit limit (plumb_api.pro.identity); the guarded path never
# renders a face edit larger than the identity guard accepts.
MAX_OUTPUT_PIXELS = 12_000_000
DEFAULT_BUDGET_BYTES = 512 * 1024 * 1024
MIN_BUDGET_BYTES = 16 * 1024 * 1024
MAX_BUDGET_BYTES = 64 * 1024 * 1024 * 1024


class AdmissionRefused(ValueError):
    """The request cannot run inside the stated memory budget or local limits."""


@dataclass(frozen=True)
class AllocationPlan:
    width: int
    height: int
    channels: int
    scale: int
    tile_side: int
    overlap: int
    tiles: int
    source_bytes: int
    output_bytes: int
    mask_bytes: int
    tile_scratch_bytes: int
    budget_bytes: int

    @property
    def peak_bytes(self) -> int:
        return self.source_bytes + self.output_bytes + self.mask_bytes + self.tile_scratch_bytes

    def tile_plan(self) -> tuple[Tile, ...]:
        return plan(self.width, self.height, self.tile_side, self.overlap)

    def public(self) -> dict[str, Any]:
        """Geometry and byte counts only; never pixels or masks."""
        return {
            "schema": "beljour-safe-upscale-allocation/1",
            "output_width": self.width * self.scale,
            "output_height": self.height * self.scale,
            "scale": self.scale,
            "tile_side": self.tile_side,
            "overlap": self.overlap,
            "tiles": self.tiles,
            "source_bytes": self.source_bytes,
            "output_bytes": self.output_bytes,
            "mask_bytes": self.mask_bytes,
            "tile_scratch_bytes": self.tile_scratch_bytes,
            "peak_bytes": self.peak_bytes,
            "budget_bytes": self.budget_bytes,
            "basis": "SHAPE_ESTIMATE_NOT_MEASURED",
        }


def tile_scratch_bytes(tile_side: int, overlap: int, scale: int, channels: int) -> int:
    """Scratch for one tile with its halo: the source crop, two rendered layers,
    their float working planes, and the blended core."""
    read = tile_side + 2 * overlap
    rendered = read * scale * read * scale
    crop = read * read * channels
    layers = 2 * rendered * channels
    working = 2 * rendered * FLOAT_PLANES * FLOAT_BYTES
    core = tile_side * scale * tile_side * scale * channels
    return crop + layers + working + core


def _checked_int(value: object, low: int, high: int, message: str) -> int:
    if type(value) is not int or not low <= value <= high:
        raise AdmissionRefused(message)
    return value


def admit(
    width: int, height: int, *, channels: int = 4, scale: int = 2,
    budget_bytes: int = DEFAULT_BUDGET_BYTES,
) -> AllocationPlan:
    """Choose the largest tile that fits, or refuse before allocating anything."""
    _checked_int(width, 8, 16_384, "source width outside local limits")
    _checked_int(height, 8, 16_384, "source height outside local limits")
    if channels not in (3, 4) or type(channels) is not int:
        raise AdmissionRefused("source must be RGB or RGBA")
    if scale not in (2, 4) or type(scale) is not int:
        raise AdmissionRefused("scale must be 2 or 4")
    _checked_int(budget_bytes, MIN_BUDGET_BYTES, MAX_BUDGET_BYTES, "invalid memory budget")
    if width * height > MAX_SOURCE_PIXELS:
        raise AdmissionRefused("source exceeds the local pixel limit")
    if width * height * scale * scale > MAX_OUTPUT_PIXELS:
        raise AdmissionRefused("output exceeds the local pixel limit")
    source = width * height * channels
    output = width * height * scale * scale * channels
    mask = width * height * scale * scale
    fixed = source + output + mask
    longest = max(width, height)
    # Largest first; any side at or above the longest edge is one whole-image tile.
    for side in TILE_SIDES:
        scratch = tile_scratch_bytes(min(side, longest), OVERLAP, scale, channels)
        if fixed + scratch <= budget_bytes:
            return AllocationPlan(
                width, height, channels, scale, side, OVERLAP,
                len(plan(width, height, side, OVERLAP)), source, output, mask, scratch,
                budget_bytes,
            )
    raise AdmissionRefused("no tile size fits the memory budget")


def admit_for_device(
    width: int, height: int, budget: DeviceBudget, *, channels: int = 4, scale: int = 2,
) -> AllocationPlan:
    """Admission against a device budget from the existing R18B planner."""
    budget.validate()
    limit = math.floor(budget.maximum_peak_mb * 1024 * 1024)
    return admit(width, height, channels=channels, scale=scale,
                 budget_bytes=min(MAX_BUDGET_BYTES, limit))

"""Conservative allocation planning for single-tile artistic export.

These are explicit planning allowances, not measurements of operating-system
RSS or browser heap limits. They include a full input and output buffer plus
one bounded tile's numerical work. The caller may impose a smaller allowance.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from .types import EffectUnavailable, integer

MIB = 1024 * 1024
DEFAULT_BUDGET = 256 * MIB
MIN_BUDGET = 8 * MIB
MAX_BUDGET = 2048 * MIB
SCRATCH_BYTES_PER_PIXEL = {"ink-study": 192, "pigment-oil": 640, "meadow-crown": 160}


@dataclass(frozen=True)
class ExportAllocation:
    tile_size: int
    budget_bytes: int
    frame_bytes: int
    scratch_bytes: int
    estimated_peak_bytes: int
    planned_tiles: int
    halo: int


def export_allocation(effect_id: str, width: int, height: int, channels: int, *,
                      requested_tile: int = 512, halo: int = 1,
                      budget_bytes: int = DEFAULT_BUDGET) -> ExportAllocation:
    if effect_id not in SCRATCH_BYTES_PER_PIXEL:
        raise EffectUnavailable("not_tileable", "this effect has no bounded export allocation plan")
    w, h = integer(width, "width", 2, 8192), integer(height, "height", 2, 8192)
    c = integer(channels, "channels", 3, 4)
    requested = integer(requested_tile, "tile_size", 32, 1024)
    pad = integer(halo, "halo", 0, 12)
    budget = integer(budget_bytes, "budget_bytes", MIN_BUDGET, MAX_BUDGET)
    if w * h > 16_777_216:
        raise ValueError("artistic export exceeds the 16 MP working limit")
    frames = w * h * c * 2
    per_pixel = SCRATCH_BYTES_PER_PIXEL[effect_id]
    remaining = budget - frames
    if remaining <= 0:
        raise EffectUnavailable("memory_budget", "export buffers exceed the chosen local memory allowance")
    bound = math.floor(math.sqrt(remaining / per_pixel)) - 2 * pad
    side = min(requested, bound)
    if side < 32:
        raise EffectUnavailable("memory_budget", "no minimum tile fits the chosen local memory allowance")
    working_width, working_height = min(w, side + 2 * pad), min(h, side + 2 * pad)
    scratch = working_width * working_height * per_pixel
    return ExportAllocation(side, budget, frames, scratch, frames + scratch,
                            math.ceil(w / side) * math.ceil(h / side), pad)

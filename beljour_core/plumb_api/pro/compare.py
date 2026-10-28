"""A pure, size-validated before/after split calculation; no image retention."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

Axis = Literal["vertical", "horizontal"]


@dataclass(frozen=True)
class Split:
    axis: Axis
    fraction: float
    width: int
    height: int
    divider: float
    before_rect: tuple[float, float, float, float]


def split_plan(width: int, height: int, fraction: float = 0.5, axis: Axis = "vertical") -> Split:
    if not isinstance(width, int) or isinstance(width, bool) or width < 1 or width > 16384:
        raise ValueError("split width must be a positive integer")
    if not isinstance(height, int) or isinstance(height, bool) or height < 1 or height > 16384:
        raise ValueError("split height must be a positive integer")
    if width * height > 12_000_000:
        raise ValueError("split image exceeds twelve megapixels")
    if not isinstance(fraction, (int, float)) or isinstance(fraction, bool):
        raise ValueError("split fraction must be finite")
    if not math.isfinite(fraction) or not 0 <= fraction <= 1 or axis not in ("vertical", "horizontal"):
        raise ValueError("split fraction or axis invalid")
    divider = (width if axis == "vertical" else height) * fraction
    rect = (0.0, 0.0, divider, float(height)) if axis == "vertical" else (0.0, 0.0, float(width), divider)
    return Split(axis, float(fraction), width, height, divider, rect)

"""E06 falloff: weights that fade a warp to exactly zero at a band edge or a radius.

Plan §8.5: "Displacement = TPS on the moved control points x a falloff that reaches
exactly zero at the band edge, so nothing outside the band moves (Q1, Q12)." A band is a
mask (for example the person mask dilated by 3% of the image width). Inside it the weight
rises with the distance to the nearest pixel outside, over `ramp` pixels, through a curve
whose value is 0 at 0 and 1 at 1:

  linear        t
  smoothstep    3t^2 - 2t^3
  smootherstep  6t^5 - 15t^4 + 10t^3   (zero slope at both ends, the default)
  cosine        (1 - cos(pi t)) / 2

Pixels outside the band get weight 0, so `field.weighted` leaves them exactly where they
are. Mirrored in `web/src/engines/warp/falloff.ts`.
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

from ..core.distance import distance_inside
from ..core.masks import as_mask
from . import field as fields

Floats = NDArray[np.float64]
CURVES = ("linear", "smoothstep", "smootherstep", "cosine")


def curve(t: np.ndarray | float, kind: str = "smootherstep") -> Floats:
    """The falloff curve on t clipped to [0, 1]."""
    if kind not in CURVES:
        raise ValueError(f"curve must be one of {', '.join(CURVES)}")
    x = np.clip(np.asarray(t, dtype=np.float64), 0.0, 1.0)
    if kind == "linear":
        out = x
    elif kind == "smoothstep":
        out = x * x * (3.0 - 2.0 * x)
    elif kind == "smootherstep":
        out = x * x * x * (x * (x * 6.0 - 15.0) + 10.0)
    else:
        out = (1.0 - np.cos(math.pi * x)) / 2.0
    result: Floats = np.asarray(out, dtype=np.float64)
    return result


def band_weights(band: np.ndarray, ramp: float, kind: str = "smootherstep", threshold: float = 0.5) -> Floats:
    """Weight 1 deep inside the band, fading to exactly 0 at its edge over `ramp` px."""
    mask = as_mask(band)
    if not (np.isfinite(ramp) and ramp >= 0):
        raise ValueError("ramp must be finite and non-negative")
    inside = mask >= threshold
    if ramp == 0:
        return inside.astype(np.float64)
    depth = distance_inside(mask, threshold)
    out: Floats = np.where(inside, curve(depth / ramp, kind), 0.0)
    return out


def radial_weights(height: int, width: int, cx: float, cy: float, radius: float,
                   kind: str = "smootherstep") -> Floats:
    """Weight 1 at (cx, cy), fading to exactly 0 at `radius` px and beyond."""
    if not (np.isfinite(radius) and radius > 0):
        raise ValueError("radius must be positive")
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    r = np.hypot(xx - cx, yy - cy)
    out: Floats = np.where(r < radius, curve(1.0 - r / radius, kind), 0.0)
    return out


def within_band(field: fields.Field, band: np.ndarray, ramp: float, kind: str = "smootherstep") -> fields.Field:
    """The field faded to the band: identity outside it, full strength deep inside."""
    return fields.weighted(field, band_weights(band, ramp, kind))


def band_from_points(height: int, width: int, pts: np.ndarray, radius: float) -> NDArray[np.float32]:
    """A band of all pixels within `radius` of any of the points (a simple body band)."""
    if not (np.isfinite(radius) and radius > 0):
        raise ValueError("radius must be positive")
    p = np.asarray(pts, dtype=np.float64).reshape(-1, 2)
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    near = np.zeros((height, width), dtype=bool)
    for x, y in p:
        near |= (xx - x) ** 2 + (yy - y) ** 2 <= radius * radius
    out: NDArray[np.float32] = near.astype(np.float32)
    return out

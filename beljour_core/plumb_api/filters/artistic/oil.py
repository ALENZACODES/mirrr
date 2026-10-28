"""Pigment Oil: deterministic quadrant-variance paint with original canvas texture.

At each pixel, four overlapping squares meet at that pixel. Select the square
with minimum summed RGB variance, then use its mean colour. Integral sums make
the work O(pixels), independent of the bounded radius. Ties choose NW, NE, SW,
SE in that order. No resampling or facial-coordinate movement occurs.
The texture is an original coordinate hash and two thread waves; no photograph,
LUT, preset, asset, or model is bundled. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from .types import ArtisticResult, Plane, blend, hash_noise, integer, number, parameters, photo, result

DEFAULTS = {"amount": 0.75, "radius": 3, "texture": 0.18, "seed": 17,
            "brush_angle": -0.4, "canvas_scale": 1.0}
LABEL = "Pigment Oil simulation. Face proportions are kept; paint texture is procedural."


def integral(values: np.ndarray) -> Plane:
    out = np.zeros((values.shape[0] + 1, values.shape[1] + 1, values.shape[2]), dtype=np.float64)
    out[1:, 1:] = np.cumsum(np.cumsum(values, axis=0), axis=1)
    return out


def rectangle_sums(table: Plane, y0: np.ndarray, x0: np.ndarray,
                   y1: np.ndarray, x1: np.ndarray) -> Plane:
    return table[y1, x1] - table[y0, x1] - table[y1, x0] + table[y0, x0]


def kuwahara(rgb: np.ndarray, radius: int) -> tuple[Plane, Plane]:
    h, w = rgb.shape[:2]
    table, squares = integral(rgb), integral(rgb * rgb)
    yy, xx = np.mgrid[:h, :w]
    best = np.full((h, w), np.inf)
    chosen = np.zeros((h, w), dtype=np.float64)
    painted = np.zeros_like(rgb, dtype=np.float64)
    for index, (dy, dx) in enumerate(((-1, -1), (-1, 1), (1, -1), (1, 1))):
        y0 = np.maximum(0, yy - radius) if dy < 0 else yy
        y1 = yy + 1 if dy < 0 else np.minimum(h, yy + radius + 1)
        x0 = np.maximum(0, xx - radius) if dx < 0 else xx
        x1 = xx + 1 if dx < 0 else np.minimum(w, xx + radius + 1)
        count = ((y1 - y0) * (x1 - x0))[..., None]
        mean = rectangle_sums(table, y0, x0, y1, x1) / count
        variance = np.maximum(0, rectangle_sums(squares, y0, x0, y1, x1) / count - mean * mean)
        score = np.sum(variance, axis=2)
        use = score < best - 1e-8
        best[use], chosen[use], painted[use] = score[use], index, mean[use]
    return painted, chosen


def paint_texture(shape: tuple[int, int], *, seed: int, brush_angle: float,
                  canvas_scale: float, offset: tuple[int, int] = (0, 0)) -> Plane:
    yy, xx = np.mgrid[:shape[0], :shape[1]]
    xx += offset[0]
    yy += offset[1]
    direction = (xx * np.cos(brush_angle) + yy * np.sin(brush_angle)) / canvas_scale
    cross = (-xx * np.sin(brush_angle) + yy * np.cos(brush_angle)) / canvas_scale
    weave = 0.48 * np.sin(direction * 2.4) + 0.28 * np.sin(cross * 2.0)
    pigment = (hash_noise(xx, yy, seed) - 0.5) * 0.48
    return (weave + pigment) * 7.5


def pigment_oil(image: np.ndarray, params: Mapping[str, Any] | None = None, *,
                offset: tuple[int, int] = (0, 0)) -> ArtisticResult:
    src = photo(image)
    p = parameters(params, DEFAULTS)
    amount = number(p["amount"], "amount", 0, 1)
    radius = integer(p["radius"], "radius", 1, 12)
    texture = number(p["texture"], "texture", 0, 1)
    seed = integer(p["seed"], "seed", 0, 2**31 - 1)
    angle = number(p["brush_angle"], "brush_angle", -np.pi, np.pi)
    scale = number(p["canvas_scale"], "canvas_scale", 0.5, 8)
    painted, chosen = kuwahara(src[..., :3].astype(np.float64), radius)
    canvas = paint_texture(src.shape[:2], seed=seed, brush_angle=angle, canvas_scale=scale, offset=offset)
    # Pigment texture is zero at pure black/white so flat extremes never clip into a halo.
    headroom = np.minimum(painted, 255 - painted) / 127.5
    pigment = np.clip(painted + texture * canvas[..., None] * headroom, 0, 255)
    support = np.full(src.shape[:2], amount, dtype=np.float64)
    out = blend(src, pigment, support)
    metrics: dict[str, float | bool | str] = {
        "geometry_displacement": 0.0,
        "texture_rms": float(np.sqrt(np.mean((pigment - painted) ** 2))),
        "radius": float(radius),
    }
    for index, name in enumerate(("north_west", "north_east", "south_west", "south_east")):
        metrics[f"quadrant_{name}_share"] = float(np.mean(chosen == index))
    return result("pigment-oil", src, out, support, LABEL, metrics,
                  ("Paint treatment only; clothing, body shape and facial proportions are not generated.",))

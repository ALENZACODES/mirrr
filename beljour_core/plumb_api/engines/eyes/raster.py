"""Deterministic antialiased paint kernels, shared by the eye feature implementations.

Pixel centres and half-up byte rounding are explicit for Python/browser parity.
No downloaded brush, texture or raster asset is used. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence

import numpy as np

from ..core.regions import polygon


def smoothstep(low: float, high: float, value: np.ndarray | float) -> np.ndarray:
    v = np.clip((np.asarray(value) - low) / max(high - low, 1e-12), 0, 1)
    return np.asarray(v * v * (3 - 2 * v))


def segment_distance(x: np.ndarray, y: np.ndarray, a: Sequence[float] | np.ndarray, b: Sequence[float] | np.ndarray) -> np.ndarray:
    dx, dy = b[0] - a[0], b[1] - a[1]
    den = dx * dx + dy * dy
    t = np.clip(((x - a[0]) * dx + (y - a[1]) * dy) / max(den, 1e-20), 0, 1)
    return np.sqrt((x - a[0] - t * dx) ** 2 + (y - a[1] - t * dy) ** 2)


def stroke(height: int, width: int, points: Sequence[Sequence[float]], radius: float,
           *, taper: bool = False, softness: float = .75) -> np.ndarray:
    if len(points) < 2 or not math.isfinite(radius) or radius <= 0:
        raise ValueError("stroke needs two points and a positive radius")
    if not math.isfinite(softness) or not 0 <= softness <= 16:
        raise ValueError("stroke softness must be in 0..16")
    verts = np.asarray(points, dtype=np.float64)
    if verts.ndim != 2 or verts.shape[1] != 2 or not np.all(np.isfinite(verts)):
        raise ValueError("stroke points must be finite pairs")
    margin = radius + softness + 1
    x0 = max(0, math.floor(float(np.min(verts[:, 0])) - margin))
    x1 = min(width, math.ceil(float(np.max(verts[:, 0])) + margin))
    y0 = max(0, math.floor(float(np.min(verts[:, 1])) - margin))
    y1 = min(height, math.ceil(float(np.max(verts[:, 1])) + margin))
    result = np.zeros((height, width), dtype=np.float64)
    if x0 >= x1 or y0 >= y1:
        return result
    yy, xx = np.mgrid[y0:y1, x0:x1]
    xx, yy = xx + .5, yy + .5
    local = np.zeros(xx.shape, dtype=np.float64)
    for i, (a, b) in enumerate(zip(verts, verts[1:], strict=False)):
        rad = radius * (1 - .85 * (i + .5) / (len(verts) - 1)) if taper else radius
        distance = segment_distance(xx, yy, a, b)
        opacity = 1 - smoothstep(max(0, rad - softness / 2), rad + softness / 2 + 1e-8, distance)
        local = np.maximum(local, opacity)
    result[y0:y1, x0:x1] = local
    return result


def filled(height: int, width: int, points: Sequence[Sequence[float]]) -> np.ndarray:
    return polygon(height, width, points, supersample=2).astype(np.float64)


def bezier(a: Sequence[float], control: Sequence[float], b: Sequence[float], steps: int = 16) -> list[tuple[float, float]]:
    if not 2 <= steps <= 64:
        raise ValueError("curve steps must be 2..64")
    output = []
    for i in range(steps + 1):
        t = i / steps
        output.append(((1 - t) ** 2 * a[0] + 2 * t * (1 - t) * control[0] + t * t * b[0],
                       (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * control[1] + t * t * b[1]))
    return output


def paint(image: np.ndarray, mask: np.ndarray, colour: Sequence[float] | np.ndarray,
          strength: float = 1.0) -> np.ndarray:
    if mask.shape != image.shape[:2] or not np.all(np.isfinite(mask)):
        raise ValueError("paint mask must match image")
    if not np.all((mask >= 0) & (mask <= 1)):
        raise ValueError("paint mask is outside 0..1")
    target = np.asarray(colour, dtype=np.float64)
    if target.shape not in ((3,), (*image.shape[:2], 3)) or not np.all(np.isfinite(target)):
        raise ValueError("paint colour must contain three finite channels")
    alpha = mask * strength
    if image.shape[2] == 4:
        alpha = alpha * (image[:, :, 3] > 0)
    result = image.copy()
    rgb = image[:, :, :3].astype(np.float64) * (1 - alpha[:, :, None]) + target * alpha[:, :, None]
    result[:, :, :3] = np.clip(np.floor(rgb + .5), 0, 255).astype(np.uint8)
    return result


def combine(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return 1 - (1 - a) * (1 - b)


def random_values(seed: int, count: int) -> list[float]:
    state = seed & 0xFFFFFFFF
    result = []
    for _ in range(count):
        state = (1664525 * state + 1013904223) & 0xFFFFFFFF
        result.append(state / 4294967296)
    return result


def restore_trace_background(image: np.ndarray, mask: np.ndarray, protected: np.ndarray) -> tuple[np.ndarray, int]:
    """Locally fill only observed lash support from unpainted nearby samples.

    Never searches outside a three-pixel ring or changes eyeball pixels. If no
    trustworthy background sample exists that pixel is retained and reported.
    This conservative fallback can leave remnants; it never fabricates skin detail.
    """
    h, w = mask.shape
    output = image.copy()
    unreliable = 0
    for y, x in zip(*np.nonzero((mask > .02) & (protected < .01)), strict=False):
        values = []
        for dy, dx in ((-3, 0), (3, 0), (0, -3), (0, 3), (-2, -2), (-2, 2), (2, -2), (2, 2)):
            xx, yy = x + dx, y + dy
            if 0 <= xx < w and 0 <= yy < h and mask[yy, xx] < .01 and protected[yy, xx] < .01:
                values.append(image[yy, xx, :3])
        if not values:
            unreliable += 1
            continue
        median = np.median(np.stack(values), axis=0)
        alpha = float(mask[y, x])
        output[y, x, :3] = np.floor(image[y, x, :3] * (1 - alpha) + median * alpha + .5).astype(np.uint8)
    return output, unreliable

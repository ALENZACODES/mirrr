'Procedural hair strand geometry and raster helpers. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Strand:
    points: tuple[tuple[float, float], ...]
    width: float
    opacity: float
    colour_mix: float

def tangent_field(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    source = np.asarray(mask, dtype=np.float64)
    gy = np.zeros_like(source)
    gx = np.zeros_like(source)
    gy[1:-1] = (source[2:] - source[:-2]) * 0.5
    gx[:, 1:-1] = (source[:, 2:] - source[:, :-2]) * 0.5
    tx = -gy
    ty = gx
    norm = np.hypot(tx, ty)
    safe = np.maximum(norm, 1e-09)
    return (tx / safe, ty / safe)

def seed_points(mask: np.ndarray, spacing: int, seed: int) -> tuple[tuple[int, int], ...]:
    if spacing < 1:
        raise ValueError('spacing must be positive')
    active = np.argwhere(mask > 0.45)
    if active.size == 0:
        return ()
    rng = np.random.default_rng(seed)
    order = rng.permutation(len(active))
    chosen: list[tuple[int, int]] = []
    radius2 = float(spacing * spacing)
    for index in order:
        y, x = (int(v) for v in active[index])
        if all((x - px) ** 2 + (y - py) ** 2 >= radius2 for py, px in chosen):
            chosen.append((y, x))
        if len(chosen) >= max(12, mask.size // max(spacing * spacing * 6, 1)):
            break
    return tuple(chosen)

def trace_strand(mask: np.ndarray, start: tuple[int, int], length: int, curvature: float=0.0) -> Strand:
    h, w = mask.shape
    tx, ty = tangent_field(mask)
    y = float(start[0])
    x = float(start[1])
    points: list[tuple[float, float]] = []
    vx, vy = (0.0, 1.0)
    for step in range(max(2, length)):
        iy = min(max(int(round(y)), 0), h - 1)
        ix = min(max(int(round(x)), 0), w - 1)
        if mask[iy, ix] <= 0.05 and step > 1:
            break
        local_x = float(tx[iy, ix])
        local_y = float(ty[iy, ix])
        if abs(local_x) + abs(local_y) < 0.05:
            local_x, local_y = (vx, vy)
        blend = 0.7
        vx = vx * (1 - blend) + local_x * blend + curvature * 0.02 * np.sin(step * 0.3)
        vy = vy * (1 - blend) + local_y * blend
        norm = max(float(np.hypot(vx, vy)), 1e-08)
        vx /= norm
        vy /= norm
        points.append((x / max(w - 1, 1), y / max(h - 1, 1)))
        x += vx
        y += vy
        if x < 0 or x >= w or y < 0 or (y >= h):
            break
    return Strand(tuple(points), 1.0, 0.65, 0.5)

def generate_strands(mask: np.ndarray, seed: int, density: float, curvature: float) -> tuple[Strand, ...]:
    spacing = max(3, int(round(11 - 7 * max(0.0, min(density, 1.0)))))
    starts = seed_points(mask, spacing, seed)
    return tuple(trace_strand(mask, start, 12 + int(density * 18), curvature) for start in starts)

def rasterize_strands(shape: tuple[int, int], strands: tuple[Strand, ...]) -> np.ndarray:
    h, w = shape
    out = np.zeros(shape, dtype=np.float64)
    for strand in strands:
        pts = strand.points
        for a, b in zip(pts, pts[1:], strict=False):
            x0, y0 = (a[0] * (w - 1), a[1] * (h - 1))
            x1, y1 = (b[0] * (w - 1), b[1] * (h - 1))
            steps = max(1, int(np.ceil(max(abs(x1 - x0), abs(y1 - y0)))))
            for t in np.linspace(0, 1, steps + 1):
                x = int(round(x0 * (1 - t) + x1 * t))
                y = int(round(y0 * (1 - t) + y1 * t))
                if 0 <= x < w and 0 <= y < h:
                    out[y, x] = max(out[y, x], strand.opacity)
    return out

def direction_similarity(before: np.ndarray, after: np.ndarray, mask: np.ndarray) -> float:
    btx, bty = tangent_field(before * mask)
    atx, aty = tangent_field(after * mask)
    active = mask > 0.25
    if not np.any(active):
        return 1.0
    dot = btx[active] * atx[active] + bty[active] * aty[active]
    return float(np.clip(np.mean(np.abs(dot)), 0, 1))

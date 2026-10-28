"""Freckles: drawn, seeded freckles across the nose bridge and upper cheeks.

The marks are placed in the face's own frame (engines/skin/common.Frame), so they land in
the same places on any photo size and follow a tilted head. Placement is rejection
sampling with the repo's 32-bit generator and plain arithmetic, so the browser port
draws the same freckles. Freckles only darken and warm the skin under them; the
person's own freckles and moles are never touched. Strength sets how visible they are,
density how many. web/src/engines/skin/freckles.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from plumb_api.engines.shade.colourspace import srgb_to_lab

from .common import NOTE, Floats, Frame, SkinResult, check_strength, encode, lcg, no_lighten, rgb_of

MAX_FRECKLES = 90                    # at density 100; ASSUMED
ATTEMPTS_PER_FRECKLE = 12
BOX = (-1.15, 1.15, 0.05, 0.95)      # sampling box in IOD units (a0, a1, b0, b1)
# Freckle zone: nose bridge plus both upper cheeks, as (a, b, radius) bumps; ASSUMED.
ZONE = ((0.0, 0.50, 0.42), (-0.62, 0.50, 0.48), (0.62, 0.50, 0.48))
RADIUS_IOD = (0.014, 0.016)          # base and random spread of the freckle radius; ASSUMED
DEPTH_L = (5.0, 7.0)                 # L* darkening at strength 100: base and spread; ASSUMED
WARM = (0.15, 0.35)                  # a* and b* added per unit of darkening (warm brown); ASSUMED
LABEL = "Freckle simulation: drawn freckles added, your own marks kept. " + NOTE


@dataclass(frozen=True)
class Freckle:
    x: float
    y: float
    radius: float
    depth: float


def zone_weight(a: float, b: float) -> float:
    best = 0.0
    for ca, cb, r in ZONE:
        d2 = ((a - ca) * (a - ca) + (b - cb) * (b - cb)) / (r * r)
        if d2 < 1:
            best = max(best, (1 - d2) * (1 - d2))
    return best


def place(face: Frame, skin: Floats, density: float, seed: int) -> list[Freckle]:
    if not isinstance(density, (int, float)) or not math.isfinite(density) or not 0 <= density <= 100:
        raise ValueError("density must be 0..100")
    if not isinstance(seed, int) or not 0 <= seed <= 0xFFFFFFFF:
        raise ValueError("seed must be an unsigned 32-bit integer")
    h, w = skin.shape
    wanted = int(math.floor(density / 100 * MAX_FRECKLES + 0.5))
    state = seed
    out: list[Freckle] = []
    a0, a1, b0, b1 = BOX
    for _ in range(wanted * ATTEMPTS_PER_FRECKLE):
        if len(out) == wanted:
            break
        state = lcg(state)
        a = a0 + (a1 - a0) * (state / 4294967296)
        state = lcg(state)
        b = b0 + (b1 - b0) * (state / 4294967296)
        state = lcg(state)
        keep = state / 4294967296
        state = lcg(state)
        size = state / 4294967296
        state = lcg(state)
        depth = state / 4294967296
        if zone_weight(a, b) <= keep:
            continue
        x, y = face.point(a, b)
        col, row = int(math.floor(x)), int(math.floor(y))
        if not (0 <= col < w and 0 <= row < h) or skin[row, col] < 0.5:
            continue
        r = max(0.6, face.iod * (RADIUS_IOD[0] + RADIUS_IOD[1] * size))
        out.append(Freckle(x, y, r, DEPTH_L[0] + DEPTH_L[1] * depth))
    return out


def darkening(freckles: list[Freckle], shape: tuple[int, int], amount: float) -> Floats:
    """Per-pixel L* drop: the deepest freckle wins where two overlap (order-free)."""
    h, w = shape
    dark = np.zeros((h, w), dtype=np.float64)
    for f in freckles:
        x0, x1 = max(0, int(math.floor(f.x - 3 * f.radius))), min(w, int(math.floor(f.x + 3 * f.radius)) + 1)
        y0, y1 = max(0, int(math.floor(f.y - 3 * f.radius))), min(h, int(math.floor(f.y + 3 * f.radius)) + 1)
        if x0 >= x1 or y0 >= y1:
            continue
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float64)
        d2 = (xx + 0.5 - f.x) * (xx + 0.5 - f.x) + (yy + 0.5 - f.y) * (yy + 0.5 - f.y)
        spot = amount * f.depth * np.exp(-d2 / (2 * f.radius * f.radius))
        dark[y0:y1, x0:x1] = np.maximum(dark[y0:y1, x0:x1], spot)
    return dark


def freckles(image: np.ndarray, skin: Floats, face: Frame, *, strength: float = 30.0,
             density: float = 50.0, seed: int = 7) -> SkinResult:
    rgb = rgb_of(image)
    amount = check_strength(strength)
    placed = place(face, skin, density, seed)
    if amount == 0 or not placed:
        return SkinResult(image.copy(), np.zeros(skin.shape), LABEL, {"freckles": 0, "unchanged": True})
    dark = darkening(placed, skin.shape, amount) * skin
    weight = np.where(dark > 1e-3, skin, 0.0)
    lab = srgb_to_lab(rgb)
    lab[..., 0] -= dark
    lab[..., 1] += WARM[0] * dark
    lab[..., 2] += WARM[1] * dark
    out, guarded = no_lighten(image, encode(image, lab, weight), weight)
    return SkinResult(out, weight, LABEL, {"freckles": len(placed), "seed": seed, "density": float(density),
                                            "guarded_pixels": guarded})

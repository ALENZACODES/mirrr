"""Procedural sparkle for the evening portrait look (browser: web/src/filters/portrait/sparkle.ts).

No image assets: every glint is drawn from an integer hash. The photo is cut into square cells
(a tenth of the inter-ocular distance); a cell holds a glint when its hash falls under the
density, at a hashed spot inside the cell, with a hashed size, brightness and colour from the
look's palette. A glint is a soft round core plus a thin four-point star, so it reads as a
catch of light, not a dot of paint.

Glints sit only where the sparkle region is: the upper lids (an ellipse above each eye, from
the eye corners and upper lid) and the tops of the cheekbones, both limited to pixels that are
mostly skin, so the eye opening, iris, brows, lips and background never get one. Glints are added in
linear light (a highlight), which shows on every skin tone. They are small specular accents:
the tone of the skin around them is not changed. Landmarks follow MediaPipe Face Mesh
numbering (468 points plus irises).
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..colour import space as S
from .looks import Sparkle

U8 = NDArray[np.uint8]
Floats = NDArray[np.float64]
MASK32 = 0xFFFFFFFF
CELL_IOD = 0.1            # cell side as a share of the IOD; ASSUMED
GLINT_IOD = 0.022         # core radius as a share of the IOD; ASSUMED
STAR_REACH = 2.5          # star arm length in core radii; ASSUMED
STAR_SHARE = 0.45         # star arms' brightness against the core; ASSUMED
RIGHT_EYE = (33, 133, 159)    # outer corner, inner corner, upper lid
LEFT_EYE = (263, 362, 386)
RIGHT_CHEEK = (50, 116)
LEFT_CHEEK = (280, 345)
EDGE = 0.3                # soft edge of the region ellipses, in ellipse radii; ASSUMED


def hash32(a: int, b: int, seed: int) -> int:
    v = (a * 73856093 + b * 19349663 + seed * 83492791) & MASK32
    v ^= v >> 13
    v = (v * 1274126177) & MASK32
    v ^= v >> 16
    return v


def ellipse(h: int, w: int, cx: float, cy: float, rx: float, ry: float) -> Floats:
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    dx = (xx + 0.5 - cx) / rx
    dy = (yy + 0.5 - cy) / ry
    d = np.sqrt(dx * dx + dy * dy)
    return np.clip((1.0 - d) / EDGE, 0.0, 1.0)


def region(points: np.ndarray, skin: Floats, iod: float) -> Floats:
    """Upper lids and cheekbone tops, on pixels that are mostly skin (a mask edge shared with an
    eye, brow or lip gets nothing)."""
    h, w = skin.shape
    pts = np.asarray(points, dtype=np.float64)
    out = np.zeros((h, w))
    for outer, inner, lid in (RIGHT_EYE, LEFT_EYE):
        width = math.sqrt(float((pts[inner, 0] - pts[outer, 0]) ** 2 + (pts[inner, 1] - pts[outer, 1]) ** 2))
        cx = (pts[outer, 0] + pts[inner, 0]) / 2
        out = np.maximum(out, ellipse(h, w, cx, pts[lid, 1] - 0.35 * width, 0.62 * width, 0.45 * width))
    for a, b in (RIGHT_CHEEK, LEFT_CHEEK):
        cx, cy = (pts[a, 0] + pts[b, 0]) / 2, (pts[a, 1] + pts[b, 1]) / 2
        out = np.maximum(out, ellipse(h, w, cx, cy, 0.30 * iod, 0.17 * iod))
    return out * np.clip(2.0 * skin - 1.0, 0.0, 1.0)


@dataclass(frozen=True)
class Glints:
    level: Floats          # 0-1 brightness of the strongest glint at each pixel
    colour: NDArray[np.int64]   # palette index of that glint
    count: int


def glints(area: Floats, iod: float, spec: Sparkle) -> Glints:
    h, w = area.shape
    cell = max(2, int(round(iod * CELL_IOD)))
    level = np.zeros((h, w))
    colour = np.zeros((h, w), dtype=np.int64)
    count = 0
    threshold = spec.density * 65536.0
    for j in range(-(-h // cell)):
        for i in range(-(-w // cell)):
            hv = hash32(i, j, spec.seed)
            if (hv & 0xFFFF) >= threshold:
                continue
            px = (i + ((hv >> 16) & 0xFF) / 255.0) * cell
            py = (j + ((hv >> 24) & 0xFF) / 255.0) * cell
            xi, yi = int(math.floor(px)), int(math.floor(py))
            if not (0 <= xi < w and 0 <= yi < h) or area[yi, xi] < 0.5:
                continue
            h2 = hash32(i, j, spec.seed + 1)
            radius = max(0.8, iod * GLINT_IOD) * (0.6 + 0.8 * (h2 & 0xFF) / 255.0)
            bright = 0.55 + 0.45 * ((h2 >> 16) & 0xFF) / 255.0
            pick = (h2 >> 8) % len(spec.palette)
            reach = int(math.ceil(STAR_REACH * radius))
            y0, y1 = max(0, yi - reach), min(h, yi + reach + 1)
            x0, x1 = max(0, xi - reach), min(w, xi + reach + 1)
            yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float64)
            dx, dy = xx + 0.5 - px, yy + 0.5 - py
            core = np.maximum(0.0, 1.0 - np.sqrt(dx * dx + dy * dy) / radius)
            core = core * core
            thin = 0.35 * radius + 0.5
            arm_x = np.maximum(0.0, 1.0 - np.abs(dx) / (STAR_REACH * radius)) * np.maximum(0.0, 1.0 - np.abs(dy) / thin)
            arm_y = np.maximum(0.0, 1.0 - np.abs(dy) / (STAR_REACH * radius)) * np.maximum(0.0, 1.0 - np.abs(dx) / thin)
            value = np.minimum(1.0, core + STAR_SHARE * np.maximum(arm_x, arm_y)) * bright * area[y0:y1, x0:x1]
            window = level[y0:y1, x0:x1]
            stronger = value > window
            window[stronger] = value[stronger]
            colour[y0:y1, x0:x1][stronger] = pick
            count += 1
    return Glints(level, colour, count)


def render(rgb: U8, area: Floats, iod: float, spec: Sparkle, scale: float) -> tuple[U8, Glints]:
    """Add the glints to an RGB photo at `scale` (the slider, 0-1) of the look's amount."""
    g = glints(area, iod, spec)
    if scale == 0.0 or g.count == 0:
        return rgb.copy(), g
    palette = S.decode(np.asarray(spec.palette, dtype=np.float64) / 255.0)
    lin = S.decode(S.bytes_to_unit(rgb))
    lin = lin + (spec.amount * scale * g.level)[..., None] * palette[g.colour]
    return S.unit_to_bytes(S.encode(np.clip(lin, 0.0, 1.0))), g

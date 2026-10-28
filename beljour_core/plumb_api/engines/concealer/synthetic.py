"""LS5 synthetic crown: drawn hair strands over a scalp, thinning around a whorl, with truth.

Not a person and not a photo. Hair is value noise stretched along a log-spiral flow field
(strands run around the whorl), kept where the noise is under a density that falls
towards a thin spot. Because the image is drawn, the true scalp mask and the true flow
angle are known, which is what the LS5 checks need ("scalp share cut within +/-7 points
of target, measured on synthetic scalps with known ground truth", plan §8.4).

Integer hashing (the same mixing as quality/harness.hash_noise) makes the drawing
identical in web/src/engines/local/fibre.ts. Released crown photos replace it for the human check.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

HAIR = (58.0, 42.0, 33.0)
SCALP = (214.0, 170.0, 146.0)
OFFSET = 1 << 16
U8 = NDArray[np.uint8]


def lattice(ix: np.ndarray, iy: np.ndarray, seed: int) -> NDArray[np.float64]:
    """Hash value in [0, 1) at integer lattice points (non-negative after the offset)."""
    x = np.asarray(ix, dtype=np.int64) + OFFSET
    y = np.asarray(iy, dtype=np.int64) + OFFSET
    h = (x * 374761393 + y * 668265263 + seed * 2246822519) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h = h ^ (h >> 16)
    out: NDArray[np.float64] = (h % 10007) / 10007.0
    return out


def value_noise(u: np.ndarray, v: np.ndarray, seed: int, period: int = 0) -> NDArray[np.float64]:
    """Smooth noise in [0, 1): lattice values blended with smoothstep weights. With
    `period` > 0 the v lattice wraps every `period` cells (no seam on a closed loop)."""
    u0, v0 = np.floor(u), np.floor(v)
    fu, fv = u - u0, v - v0
    su, sv = fu * fu * (3 - 2 * fu), fv * fv * (3 - 2 * fv)
    v1 = v0 + 1
    if period > 0:
        v0, v1 = np.mod(v0, period), np.mod(v1, period)
    a = lattice(u0, v0, seed)
    b = lattice(u0 + 1, v0, seed)
    c = lattice(u0, v1, seed)
    d = lattice(u0 + 1, v1, seed)
    out: NDArray[np.float64] = (a * (1 - su) + b * su) * (1 - sv) + (c * (1 - su) + d * su) * sv
    return out


@dataclass(frozen=True)
class Crown:
    image: U8
    scalp: NDArray[np.bool_]
    hair: NDArray[np.bool_]
    flow: NDArray[np.float64]          # true strand direction, radians
    region: NDArray[np.float32]        # the "brushed" crown area
    thin: tuple[float, float, float, float]


SPIRAL = 3.6            # log-spiral rate: strands turn atan(3.6) ~ 74 degrees from radial
TURNS = 480             # lattice cells around one turn (wraps, so no seam)
ALONG = 2.5             # px per lattice cell along a strand (radially)


def flow_angle(height: int, width: int, whorl: tuple[float, float], spiral: float = SPIRAL) -> NDArray[np.float64]:
    """True strand direction: a log spiral around the whorl, phi + atan(spiral)."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    out: NDArray[np.float64] = np.arctan2(yy + 0.5 - whorl[1], xx + 0.5 - whorl[0]) + math.atan(spiral)
    return out


def spiral_coordinates(height: int, width: int, whorl: tuple[float, float]) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """(along, across) lattice coordinates: strands are the curves phi - k ln r = constant."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    dx, dy = xx + 0.5 - whorl[0], yy + 0.5 - whorl[1]
    r = np.sqrt(dx * dx + dy * dy)
    phi = np.arctan2(dy, dx)
    across = (phi - SPIRAL * np.log(r)) * (TURNS / (2 * math.pi))
    return r / ALONG, across


def crown(width: int = 384, height: int = 384, *, seed: int = 3, hair: tuple[float, float, float] = HAIR,
          scalp: tuple[float, float, float] = SCALP, thin: tuple[float, float, float, float] = (0.5, 0.52, 0.24, 0.22),
          density: tuple[float, float] = (0.35, 0.95)) -> Crown:
    """A drawn crown; `thin` = (cx, cy, rx, ry) of the thin spot as shares of the size,
    `density` = (hair share at its centre, hair share far away)."""
    if not (32 <= width <= 4096 and 32 <= height <= 4096):
        raise ValueError("synthetic crown size must be 32..4096")
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    whorl = (0.5 * width, 0.55 * height)
    theta = flow_angle(height, width, whorl)
    along, across = spiral_coordinates(height, width, whorl)
    strands = value_noise(along, across, seed, TURNS)
    cx, cy, rx, ry = thin
    r = ((xx + 0.5) / width - cx) ** 2 / rx ** 2 + ((yy + 0.5) / height - cy) ** 2 / ry ** 2
    share = np.clip(density[0] + (density[1] - density[0]) * np.sqrt(r), density[0], density[1])
    is_hair = strands < share
    shade = value_noise(xx / 3.0, yy / 3.0, seed + 11) - 0.5
    light = 1.0 + 0.06 * (0.5 - (yy + 0.5) / height)
    hair_rgb = np.array(hair)[None, None, :] * (1.0 + 0.25 * shade[..., None])
    scalp_rgb = np.array(scalp)[None, None, :] + 6.0 * shade[..., None]
    img = np.where(is_hair[..., None], hair_rgb, scalp_rgb) * light[..., None]
    image = np.clip(np.rint(img), 0, 255).astype(np.uint8)
    region_r = ((xx + 0.5) / width - 0.5) ** 2 / 0.42 ** 2 + ((yy + 0.5) / height - 0.52) ** 2 / 0.4 ** 2
    region = (region_r <= 1.0).astype(np.float32)
    return Crown(image, ~is_hair, is_hair, theta, region, thin)

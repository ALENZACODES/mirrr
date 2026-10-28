"""Shared pieces of the local skin tools: the landmark skin mask, the face frame,
masked low-pass planes, the Lab round trip and the no-lightening guard.

Every tool works on the visible-skin region built from the 478-point mesh (the face
oval minus eyes, brows and lips, engines/core/regions.py). Edits are smooth
low-frequency changes or drawn marks, so the photo's own fine texture, freckles and
moles stay as they were. web/src/engines/skin/common.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray

from plumb_api.engines.core import regions
from plumb_api.engines.core.filters import box_mean
from plumb_api.engines.shade.colourspace import lab_to_srgb, srgb_to_lab, to_bytes

Floats = NDArray[np.float64]
SKIN_SUPERSAMPLE = 2
MIN_SKIN_PIXELS = 900         # about 30 x 30 px of visible skin; a smaller face is refused; ASSUMED
NOTE = "Simulation, not medical advice."


@dataclass(frozen=True)
class SkinResult:
    image: np.ndarray                     # same shape and dtype as the input; alpha copied
    weight: Floats                        # 0..1 per pixel: where the tool was allowed to act
    label: str
    metrics: dict[str, float | int | str | bool] = field(default_factory=dict)


@dataclass(frozen=True)
class Frame:
    """The face's own axes: origin between the pupils, unit = inter-pupil distance (IOD),
    u along the eye line toward the subject's left eye, v perpendicular toward the chin."""
    ox: float
    oy: float
    ux: float
    uy: float
    iod: float

    def point(self, a: float, b: float) -> tuple[float, float]:
        """Image coordinates of face coordinates (a, b) in IOD units."""
        return (self.ox + self.iod * (a * self.ux - b * self.uy),
                self.oy + self.iod * (a * self.uy + b * self.ux))

    def local(self, x: float, y: float) -> tuple[float, float]:
        """Face coordinates (IOD units) of an image point."""
        dx, dy = (x - self.ox) / self.iod, (y - self.oy) / self.iod
        return (dx * self.ux + dy * self.uy, -dx * self.uy + dy * self.ux)


def frame(points: np.ndarray) -> Frame:
    pts = np.asarray(points, dtype=np.float64)
    rx, ry = float(pts[468, 0]), float(pts[468, 1])
    lx, ly = float(pts[473, 0]), float(pts[473, 1])
    dx, dy = lx - rx, ly - ry
    iod = math.sqrt(dx * dx + dy * dy)
    return Frame((rx + lx) / 2, (ry + ly) / 2, dx / iod, dy / iod, iod)


def skin_mask(points: np.ndarray, height: int, width: int) -> Floats:
    mask = regions.region_mask("skin", np.asarray(points, dtype=np.float64)[:, :2], height, width,
                               normalized=False, supersample=SKIN_SUPERSAMPLE)
    return np.asarray(mask, dtype=np.float64)


def radius(iod: float, share: float, minimum: int = 1) -> int:
    """A box radius as a share of the IOD, so the edit scales with the face, not the photo."""
    return max(minimum, int(math.floor(iod * share + 0.5)))


def masked_lowpass(plane: Floats, mask: Floats, r: int) -> Floats:
    """Mean of `plane` over skin only, so the background never bleeds into the skin."""
    num = box_mean(plane * mask, r)
    den = box_mean(mask, r)
    return np.asarray(num / np.maximum(den, 1e-6), dtype=np.float64)


def rgb_of(image: np.ndarray) -> np.ndarray:
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4) or min(image.shape[:2]) < 8:
        raise ValueError("skin tools need an RGB or RGBA uint8 photo of at least 8 x 8 pixels")
    return image[..., :3]


def check_strength(strength: float) -> float:
    if not isinstance(strength, (int, float)) or not math.isfinite(strength) or not 0 <= strength <= 100:
        raise ValueError("strength must be 0..100")
    return float(strength) / 100.0


def encode(image: np.ndarray, lab: Floats, weight: Floats) -> np.ndarray:
    """Write revised Lab back to bytes inside `weight > 0`; every other byte, and alpha, is copied."""
    out = image.copy()
    encoded = to_bytes(lab_to_srgb(lab))
    inside = weight > 0
    out[..., :3][inside] = encoded[inside]
    return out


def no_lighten(image: np.ndarray, out: np.ndarray, weight: Floats) -> tuple[np.ndarray, int]:
    """Rounding to bytes can raise L* by a fraction of a step. Any edited pixel whose L*
    rose is first moved one byte darker on every channel; if it still rose, it is
    restored. Returns the image and the number of pixels touched."""
    inside = weight > 0
    before = srgb_to_lab(image[..., :3])[..., 0]
    after = srgb_to_lab(out[..., :3])[..., 0]
    rose = inside & (after > before)
    if not rose.any():
        return out, 0
    fixed = out.copy()
    stepped = out[..., :3].astype(np.int16)
    stepped = np.where(stepped > 0, stepped - 1, stepped).astype(np.uint8)
    fixed[..., :3][rose] = stepped[rose]
    again = srgb_to_lab(fixed[..., :3])[..., 0]
    still = rose & (again > before)
    fixed[..., :3][still] = image[..., :3][still]
    return fixed, int(rose.sum())


def lcg(state: int) -> int:
    """The repo's 32-bit linear congruential step (engines/skin/glow_tan.py); exact in both ports."""
    return (1664525 * state + 1013904223) & 0xFFFFFFFF


def blob(frame_: Frame, shape: tuple[int, int], a: float, b: float, r: float) -> Floats:
    """Smooth bump (1 - d^2/r^2)^2 centred at face coordinates (a, b), r in IOD units, sampled
    at pixel centres. Plain arithmetic only, so both ports agree bit for bit."""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    la, lb = frame_.local(xx + 0.5, yy + 0.5)
    d2 = ((la - a) * (la - a) + (lb - b) * (lb - b)) / (r * r)
    return np.where(d2 >= 1, 0.0, (1 - d2) * (1 - d2))

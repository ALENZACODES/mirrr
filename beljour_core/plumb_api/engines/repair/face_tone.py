"""Measured face-mask exposure and rounded-output lightness protection.

The caller supplies geometry or a reviewed mask; this module never infers skin
from RGB. Weights meter linear luminance. Every covered pixel must stay within
the existing 2.5 CIE L* rise budget, including low-weight antialiased edges.
A mask is not a neutral white-balance reference. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.composite import decode
from ..core.refusal import inspect_mesh
from ..core.regions import region_mask

MAX_SKIN_LIGHTNESS_RISE = 2.5
Floats = NDArray[np.float64]


def mask_from_face(points: object, height: int, width: int) -> Floats | None:
    """Use a usable measured mesh; absence/degeneracy supplies no skin evidence."""
    if inspect_mesh(points, height, width):
        return None
    mask = region_mask("skin", points, height, width, normalized=False, supersample=2)
    return face_weights(mask, (height, width)) if np.any(mask > 0) else None


def face_weights(mask: object, shape: tuple[int, int]) -> Floats:
    """Copy an explicit, nonempty finite mask; invalid evidence is refused."""
    try:
        weights = np.array(mask, dtype=np.float64, copy=True)
    except (TypeError, ValueError) as exc:
        raise ValueError("face mask must be a finite H x W array in [0,1]") from exc
    if (weights.shape != shape or not np.all(np.isfinite(weights))
            or np.any(weights < 0) or np.any(weights > 1) or not np.any(weights > 0)):
        raise ValueError("face mask must match the photo, be finite in [0,1] and contain covered pixels")
    weights.setflags(write=False)
    return weights


def metered_luminance(linear: np.ndarray, weights: Floats | None) -> float:
    """Keep the historical scene mean exactly when no mask was supplied."""
    lum = 0.2126 * linear[..., 0] + 0.7152 * linear[..., 1] + 0.0722 * linear[..., 2]
    if weights is None:
        return float(lum.mean())
    return float(np.sum(lum * weights) / np.sum(weights))


def _lightness(pixels: np.ndarray) -> Floats:
    lin = decode(pixels.reshape(1, -1, 3))[0]
    # The same D65 Y row and CIE piecewise transform as core/colour.py.
    y = 0.2126729 * lin[:, 0] + 0.7151522 * lin[:, 1] + 0.0721750 * lin[:, 2]
    delta = 6 / 29
    fy = np.where(y > delta ** 3, np.power(y, 1 / 3), y / (3 * delta * delta) + 4 / 29)
    return np.asarray(116 * fy - 16, dtype=np.float64)


@dataclass(frozen=True)
class FaceToneMetrics:
    pixels: int
    weight: float
    before_lstar: float
    after_lstar: float
    max_rise: float

    @property
    def within_limit(self) -> bool:
        return self.max_rise <= MAX_SKIN_LIGHTNESS_RISE

    def to_json(self) -> dict[str, Any]:
        return {"evidence": "supplied_face_mask", "pixels": self.pixels,
                "weight": round(self.weight, 8), "before_lstar": round(self.before_lstar, 8),
                "after_lstar": round(self.after_lstar, 8),
                "mean_rise": round(self.after_lstar - self.before_lstar, 8),
                "max_rise": round(self.max_rise, 8), "limit": MAX_SKIN_LIGHTNESS_RISE}


class FaceToneMeter:
    """Invocation-owned samples. No image, mask or identity is stored globally."""

    def __init__(self, original: np.ndarray, mask: object):
        self.shape = original.shape[:2]
        weights = face_weights(mask, self.shape)
        self.indices = np.flatnonzero(weights.ravel() > 0)
        self.weights = weights.ravel()[self.indices].copy()
        self.total = float(self.weights.sum())
        self.before = _lightness(original.reshape(-1, original.shape[2])[self.indices, :3])
        self.mean_before = float(np.sum(self.before * self.weights) / self.total)

    def measure(self, image: np.ndarray) -> FaceToneMetrics:
        if image.shape[:2] != self.shape:
            raise ValueError("face measurement must use the original photo dimensions")
        after = _lightness(image.reshape(-1, image.shape[2])[self.indices, :3])
        return FaceToneMetrics(len(self.indices), self.total, self.mean_before,
                               float(np.sum(after * self.weights) / self.total),
                               max(0.0, float(np.max(after - self.before))))

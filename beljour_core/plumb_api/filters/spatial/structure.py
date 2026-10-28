"""Noise-floor-aware micro-structure for editorial portrait filters.

Only local luminance detail above a threshold is strengthened. The source RGB
channels receive an equal additive offset, preserving colour direction as far
as the output gamut permits. Pixel headroom tapers the effect to zero on pure
white or black so neutral reference cards never acquire coloured fringes.
A whole-photo radius is used for tiled parity; no face landmarks are moved.

This is a conservative contrast treatment, not skin smoothing. Real-face
release still requires the independent texture and identity gates.
Created by John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ...engines.core.filters import box_mean
from ..colour import ops as O
from ..colour import space as S
from ..frame import Frame

Floats = NDArray[np.float64]
DEFAULT_RADIUS = 0.012
MAX_RADIUS = 0.036
DETAIL_GAIN = 0.42
MAX_DELTA = 0.045
HEADROOM_SCALE = 10.0


def radius_pixels(radius_share: float, frame: Frame) -> int:
    """Blur radius is a whole-photo proportion rather than a tile fraction."""
    return max(1, int(round(radius_share * frame.short_side / 2.0)))


def halo(params: Mapping[str, Any], frame: Frame) -> int:
    """The single box mean needs exactly this many neighbouring pixels."""
    return radius_pixels(float(params["radius"]), frame)


def structure(rgb: Floats, params: Mapping[str, Any], frame: Frame) -> Floats:
    """Raise genuine fine detail without sharpening a uniform skin field."""
    amount = float(params["amount"])
    if amount <= 0:
        return rgb.copy()
    radius = radius_pixels(float(params["radius"]), frame)
    lum = (rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152
           + rgb[..., 2] * 0.0722)
    local = box_mean(lum, radius)
    raw = lum - local
    threshold = float(params["threshold"])
    signed = np.sign(raw) * np.maximum(np.abs(raw) - threshold, 0.0)
    room = np.minimum(rgb.min(axis=2), 1 - rgb.max(axis=2))
    headroom = np.clip(room * HEADROOM_SCALE, 0.0, 1.0)
    delta = np.clip(signed * (amount * DETAIL_GAIN), -MAX_DELTA, MAX_DELTA)
    return S.clamp01(rgb + (delta * headroom)[..., None])


O.register(O.Op(
    "spatial.structure", "spatial",
    {
        "amount": O.num(0, 0, 1, "micro-contrast gain above the noise floor"),
        "radius": O.fixed(DEFAULT_RADIUS, 0.002, MAX_RADIUS, "full-photo detail scale"),
        "threshold": O.fixed(0.015, 0, 0.06, "ignore weak random pixel noise"),
    },
    structure,
    help="Restrained local luminance structure without face reshaping",
))

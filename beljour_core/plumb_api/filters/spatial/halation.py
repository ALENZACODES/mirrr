"""Controlled highlight-edge halation without blurring the original image.

A bright source produces a warm fringe around its perimeter. The unblurred
highlight is subtracted from the diffuse light, so neutral highlight cores
remain neutral and freckles do not get averaged into nearby skin.
All computations use a full-image Frame for tiled-halo parity.
Created by John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..colour import ops as O
from ..colour import space as S
from ..frame import Frame
from .glow import PASSES, blur_radius, soft_blur

Floats = NDArray[np.float64]


def halo(params: Mapping[str, Any], frame: Frame) -> int:
    """A fringe needs three box-blur radii of neighboring pixels."""
    return PASSES * blur_radius(float(params["radius"]), frame)


def highlight_fringe(rgb: Floats, params: Mapping[str, Any], frame: Frame) -> Floats:
    """Generate only the light extending outside the unblurred highlight."""
    amount = float(params["amount"])
    if amount <= 0:
        return rgb.copy()
    linear = S.decode(rgb)
    bright = S.smoothstep(float(params["threshold"]), 1.0, S.luminance(linear))
    source = linear * bright[..., None]
    blurred = soft_blur(source, blur_radius(float(params["radius"]), frame))
    fringe = np.clip(blurred - source, 0.0, 1.0)
    tint = float(params["warmth"])
    gains = np.array([1.0, 1.0 - 0.65 * tint, 1.0 - 0.85 * tint])
    fringe *= gains
    return S.encode(1 - (1 - linear) * (1 - amount * fringe))


O.register(O.Op(
    "spatial.halation", "spatial",
    {
        "amount": O.num(0, 0, 1, "strength of the halo outside a highlight"),
        "threshold": O.fixed(0.72, 0.2, 0.98, "minimum source luminance"),
        "radius": O.fixed(0.025, 0.002, 0.08, "blur radius share of photo"),
        "warmth": O.fixed(0.85, 0, 1, "warm red-orange tint of the fringe"),
    },
    highlight_fringe,
    help="Highlight-edge halation preserving sharp highlight cores",
))

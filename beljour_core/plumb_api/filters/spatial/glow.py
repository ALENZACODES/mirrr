"""Highlight glow and diffusion for the FX1 looks (spatial.glow), with its blur radius.

The glow takes the photo's highlights only (a smooth weight from `threshold` to white on
linear luminance), blurs them with three passes of the core box mean (close to a Gaussian),
tints them warm or cool, and screens them back over the photo in linear light:

    out = 1 - (1 - photo) * (1 - amount * blurred_highlights)

Screening adds light; it never averages skin pixels together, so skin texture, freckles and
moles stay (women-first rule 2). Glow is the only FX1 op that reads neighbours: the radius
is a share of the whole photo's short side, so a thumbnail and the full photo glow alike,
and `halo` tells the tiler how many pixels around a tile it needs (three box passes reach
3 x radius). FX2 builds bloom, halation and soft focus on this module, not beside it.

The Orton soft-focus technique (a blurred copy laid over the sharp one) is the idea behind
it; concept only, no code copied. Mirror: web/src/filters/spatial/glow.ts.
Author: John Khan.
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
PASSES = 3
MAX_RADIUS_SHARE = 0.08


def blur_radius(radius_share: float, frame: Frame) -> int:
    """Box radius in pixels for one pass: half the requested share of the short side, at least 1."""
    return max(1, int(round(radius_share * frame.short_side / 2)))


def halo(params: Mapping[str, Any], frame: Frame) -> int:
    return PASSES * blur_radius(float(params["radius"]), frame)


def soft_blur(plane: np.ndarray, radius: int) -> Floats:
    out = np.asarray(plane, dtype=np.float64)
    for _ in range(PASSES):
        out = box_mean(out, radius)
    return out


def glow(rgb: Floats, params: Mapping[str, Any], frame: Frame) -> Floats:
    """rgb is an H x W x 3 block of sRGB-encoded values in [0, 1]."""
    amount = float(params["amount"])
    if amount <= 0:
        return rgb.copy()
    lin = S.decode(rgb)
    weight = S.smoothstep(float(params["threshold"]), 1.0, S.luminance(lin))
    highlights = lin * weight[..., None]
    blurred = soft_blur(highlights, blur_radius(float(params["radius"]), frame))
    warmth = float(params["warmth"])
    gains = np.array([1 + 0.2 * warmth, 1.0, 1 - 0.2 * warmth])
    blurred = np.clip(blurred * gains, 0.0, 1.0)
    return S.encode(1 - (1 - lin) * (1 - amount * blurred))


O.register(O.Op("spatial.glow", "spatial",
                {"amount": O.num(0, 0, 1, "how much light the glow adds"),
                 "threshold": O.fixed(0.7, 0.2, 0.98, "luminance where highlights start"),
                 "radius": O.fixed(0.02, 0.002, MAX_RADIUS_SHARE, "blur as a share of the short side"),
                 "warmth": O.num(0, -1, 1, "warm +, cool -")},
                glow, help="Highlight glow screened over the photo; never blurs skin"))

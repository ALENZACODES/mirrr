"""Skin polish and feature definition for the portrait looks (browser: web/src/filters/portrait/polish.ts).

Polish is feature #25's texture-preserving smooth. Inside the skin mask, each pixel moves
`amount` of the way toward a skin-only box mean (normalised by the mask, so eyes, brows, lips
and background never bleed in), with marks held out of the move; then the arena's Texture
Graft (arena/weapons.py) puts the original's finest band back wherever the smoothing lost it
and restores each mark's darkness. What softens is the mid-scale tone variation (blotches,
shadows of fine lines); pores, grain, freckles and moles stay. The box mean keeps the local
mean, so the skin's overall lightness does not rise.

Definition is the filter engine's spatial.structure op (micro-contrast above a noise floor,
equal offsets on R, G and B so colour direction holds), taken at full amount once and mixed in
by a feature mask: eyes and lashes, brows and lips, each with its own weight. Irises are cut
out of the mask, so eye colour is never touched. Nothing moves; no colour is added.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...arena.weapons import texture_graft
from ...engines.core.filters import box_mean
from ..colour import space as S
from ..frame import Frame
from ..spatial.structure import structure

U8 = NDArray[np.uint8]
Floats = NDArray[np.float64]
BLUR_IOD = 1 / 6          # smoothing radius as a share of the inter-ocular distance; ASSUMED
LASH_IOD = 0.06           # eye mask grown by this share of the IOD to take in the lash line; ASSUMED
DEFINITION = {"amount": 1.0, "radius": 0.012, "threshold": 0.015}  # structure op settings; ASSUMED


def blur_radius(iod: float) -> int:
    return max(1, int(round(iod * BLUR_IOD)))


def skin_mean(rgb: Floats, skin: Floats, radius: int) -> Floats:
    """Box mean of the skin pixels only; pixels with no skin around them keep their value."""
    den = box_mean(skin, radius)
    num = box_mean(rgb * skin[..., None], radius)
    safe = den > 1e-6
    return np.where(safe[..., None], num / np.where(safe, den, 1.0)[..., None], rgb)


def polish(rgb: U8, skin: Floats, protect: Floats, iod: float, amount: float) -> U8:
    """Texture-preserving smooth of `amount` (0-1) inside the skin; `protect` holds marks."""
    if not 0.0 <= amount <= 1.0:
        raise ValueError("polish amount is 0..1")
    if amount == 0.0:
        return rgb.copy()
    s = np.clip(skin, 0.0, 1.0)
    keep = np.clip(protect, 0.0, 1.0)
    x = rgb.astype(np.float64)
    target = skin_mean(x, s, blur_radius(iod))
    weight = amount * s * (1.0 - keep)
    smooth = np.rint(np.clip(x + weight[..., None] * (target - x), 0, 255)).astype(np.uint8)
    out, _ = texture_graft(smooth, rgb, s, amount=1.0, protect=keep)
    return out


@dataclass(frozen=True)
class Features:
    eyes: Floats
    brows: Floats
    lips: Floats
    irises: Floats


def feature_mask(f: Features, iod: float, eyes: float, brows: float, lips: float) -> Floats:
    """Where definition applies and how much: the strongest feature weight, irises cut out."""
    grow = max(1, int(round(iod * LASH_IOD)))
    lash = np.minimum(1.0, 2.0 * box_mean(f.eyes, grow))
    mask = np.maximum(np.maximum(eyes * lash, brows * f.brows), lips * f.lips)
    return np.clip(mask * (1.0 - np.clip(f.irises, 0.0, 1.0)), 0.0, 1.0)


def define(rgb: U8, mask: Floats, scale: float) -> U8:
    """Mix the structure op into the photo by `mask * scale` (scale is the slider, 0-1)."""
    if scale == 0.0 or not np.any(mask > 0):
        return rgb.copy()
    unit = S.bytes_to_unit(rgb)
    h, w = unit.shape[:2]
    detailed = structure(unit, DEFINITION, Frame(w, h))
    return S.unit_to_bytes(unit + (mask * scale)[..., None] * (detailed - unit))

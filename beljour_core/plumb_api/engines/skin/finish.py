"""Skin finish: Matte (shine control) and Glow (named skin glows).

Both split the skin's lightness into a fine band (pores, grain, freckles, moles) that is
left alone, and two smooth bands found with skin-only box means
(engines/skin/common.masked_lowpass):

* Matte takes down the smooth bright bump a shine spot makes on top of the skin's broad
  shading, and gives back the colour the shine washed out. It only ever darkens.
* Glow brings up the light the face already catches, with a sheen on the high points
  (cheekbones, nose bridge, centre forehead, chin). The lift is balanced by a matching
  fall over the rest of the skin, so the average skin lightness does not rise: a glow
  never lightens the complexion. Each glow is a named look in Beljour's voice.

web/src/engines/skin/finish.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from plumb_api.engines.shade.colourspace import srgb_to_lab

from .common import (
    NOTE,
    Floats,
    Frame,
    SkinResult,
    blob,
    check_strength,
    encode,
    masked_lowpass,
    no_lighten,
    radius,
    rgb_of,
)

MATTE_FINE, MATTE_BROAD = 1 / 16, 1 / 4   # box radii as IOD shares; ASSUMED
MATTE_FLOOR = 1.0       # L* of bump left in place as the face's own modelling; ASSUMED
MATTE_TAKE = 0.8        # share of the shine bump removed at strength 100; ASSUMED
MATTE_COLOUR = 0.6      # share of washed-out colour given back at strength 100; ASSUMED
MATTE_FULL_BUMP = 4.0   # L* bump at which the colour give-back is complete; ASSUMED
GLOW_FINE, GLOW_BROAD = 1 / 12, 1 / 3
GLOW_CAP = 6.0          # largest L* change at any pixel; ASSUMED
# High points as (a, b, radius) in IOD units from the eye midpoint; ASSUMED.
HIGH_POINTS = ((-0.62, 0.42, 0.38), (0.62, 0.42, 0.38), (0.0, 0.30, 0.16), (0.0, -0.75, 0.40), (0.0, 1.95, 0.22))
MATTE_LABEL = "Matte finish simulation: shine softened, texture kept. " + NOTE


@dataclass(frozen=True)
class GlowStyle:
    name: str
    sheen: float      # L* added at the centre of a high point at strength 100
    contrast: float   # share of the face's own light-and-shade band added
    warm: float       # b* added over the skin
    rose: float       # a* added on the high points


# Named glows (ASSUMED values): Cassis is soft and warm, Collioure a brighter dewy sheen.
GLOWS = {
    "cassis": GlowStyle("Cassis", 4.0, 0.35, 1.0, 0.4),
    "collioure": GlowStyle("Collioure", 6.0, 0.6, 0.4, 0.2),
}


def _fine_and_broad(plane: Floats, skin: Floats, iod: float, fine: float, broad: float) -> tuple[Floats, Floats]:
    return (masked_lowpass(plane, skin, radius(iod, fine)), masked_lowpass(plane, skin, radius(iod, broad, 2)))


def matte(image: np.ndarray, skin: Floats, face: Frame, *, strength: float = 30.0) -> SkinResult:
    rgb = rgb_of(image)
    amount = check_strength(strength)
    if amount == 0:
        return SkinResult(image.copy(), np.zeros(skin.shape), MATTE_LABEL, {"unchanged": True})
    lab = srgb_to_lab(rgb)
    fine_l, broad_l = _fine_and_broad(lab[..., 0], skin, face.iod, MATTE_FINE, MATTE_BROAD)
    bump = np.maximum(fine_l - broad_l - MATTE_FLOOR, 0.0)
    weight = np.where(bump > 0, skin, 0.0)
    give = amount * MATTE_COLOUR * np.minimum(bump / MATTE_FULL_BUMP, 1.0) * weight
    for c in (1, 2):
        fine_c, broad_c = _fine_and_broad(lab[..., c], skin, face.iod, MATTE_FINE, MATTE_BROAD)
        lab[..., c] += give * (broad_c - fine_c)
    lab[..., 0] -= amount * MATTE_TAKE * bump * weight
    out, guarded = no_lighten(image, encode(image, lab, weight), weight)
    shiny = weight > 0
    return SkinResult(out, weight, MATTE_LABEL, {
        "shine_share": float(shiny.sum() / max(float((skin >= 0.5).sum()), 1.0)),
        "peak_bump": float(bump.max()), "guarded_pixels": guarded})


def high_points(face: Frame, shape: tuple[int, int]) -> Floats:
    out = np.zeros(shape, dtype=np.float64)
    for a, b, r in HIGH_POINTS:
        out = np.maximum(out, blob(face, shape, a, b, r))
    return out


def glow(image: np.ndarray, skin: Floats, face: Frame, *, strength: float = 30.0, style: str = "cassis") -> SkinResult:
    rgb = rgb_of(image)
    amount = check_strength(strength)
    if style not in GLOWS:
        raise ValueError(f"glow must be one of {', '.join(GLOWS)}")
    look = GLOWS[style]
    label = f"Glow simulation ({look.name}): average skin lightness kept. " + NOTE
    if amount == 0:
        return SkinResult(image.copy(), np.zeros(skin.shape), label, {"style": style, "unchanged": True})
    lab = srgb_to_lab(rgb)
    fine_l, broad_l = _fine_and_broad(lab[..., 0], skin, face.iod, GLOW_FINE, GLOW_BROAD)
    peaks = high_points(face, skin.shape)
    lift = np.clip(amount * (look.sheen * peaks + look.contrast * (fine_l - broad_l)), -GLOW_CAP, GLOW_CAP) * skin
    # Balance: remove the skin-weighted mean so sum(skin * change) is zero.
    total = float(np.sum(skin * skin))
    balance = float(np.sum(skin * lift)) / total if total > 0 else 0.0
    change = lift - balance * skin
    lab[..., 0] += change
    lab[..., 1] += amount * look.rose * peaks * skin
    lab[..., 2] += amount * look.warm * skin
    weight = np.where(skin > 0, skin, 0.0)
    return SkinResult(encode(image, lab, weight), weight, label, {
        "style": style, "balance_l": round(balance, 4), "peak_lift": float(change.max())})

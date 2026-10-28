"""Tan add and tan remove on the landmark skin region.

Adding a tan is the existing undertone-aware optical tan (engines/skin/glow_tan.py), which
never raises L*. Removing a tan runs the same undertone shift backwards and does raise L*:
it lightens skin, so it is opt-in only (women-first rule 8). Without `allow_lightening`
it is refused with a reason code, and no default preset may call it.
web/src/engines/skin/tan.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np

from plumb_api.engines.shade.colourspace import srgb_to_lab

from .common import NOTE, Floats, SkinResult, check_strength, encode, rgb_of
from .glow_tan import SHIFTS, glow_tan

DIRECTIONS = ("add", "remove")
REMOVE_L = 3.0          # L* raised at strength 100, a little under the 4 that adding takes away; ASSUMED
ADD_LABEL = "Tan simulation; not a UV exposure guide. " + NOTE
REMOVE_LABEL = "Tan removal simulation, chosen by you: this lightens skin. " + NOTE


class LighteningNotChosen(ValueError):
    """Tan removal was asked for without the person turning lightening on."""

    code = "lightening_needs_opt_in"


def tan(image: np.ndarray, skin: Floats, *, direction: str = "add", strength: float = 30.0,
        undertone: str = "neutral", allow_lightening: bool = False) -> SkinResult:
    rgb = rgb_of(image)
    amount = check_strength(strength)
    if direction not in DIRECTIONS:
        raise ValueError("direction must be add or remove")
    if undertone not in SHIFTS:
        raise ValueError("undertone must be olive, cool, warm or neutral")
    if direction == "remove" and allow_lightening is not True:
        raise LighteningNotChosen("Tan removal lightens skin, so it runs only when you turn it on.")
    if amount == 0:
        return SkinResult(image.copy(), np.zeros(skin.shape), ADD_LABEL if direction == "add" else REMOVE_LABEL,
                          {"direction": direction, "unchanged": True})
    if direction == "add":
        added = glow_tan(np.ascontiguousarray(rgb), skin, undertone=undertone, strength=strength)
        out = image.copy()
        out[..., :3] = added.image
        return SkinResult(out, np.asarray(added.alpha, dtype=np.float64), ADD_LABEL,
                          {"direction": "add", "undertone": undertone})
    weight = skin * amount
    lab = srgb_to_lab(rgb)
    lab[..., 0] += REMOVE_L * weight
    lab[..., 1] -= SHIFTS[undertone][0] * weight
    lab[..., 2] -= SHIFTS[undertone][1] * weight
    return SkinResult(encode(image, lab, weight), weight, REMOVE_LABEL,
                      {"direction": "remove", "undertone": undertone, "lightens": True})

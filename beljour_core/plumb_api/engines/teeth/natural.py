"""#31 Teeth whitening with a natural cap, local, from the face mesh. Author: John Khan.

This is the local route that replaces the retired YouCam teeth task (providers/youcam.py
lists "teeth-whiten" as legacy, never called). It never calls a provider.

1. Mesh: a mesh no face tool should edit is refused with the core codes; the mouth must be
   measured open (mouth_state.observe: inner-lip gap over mouth width), else "mouth_closed".
2. Teeth: the mouth opening from the mesh (core/regions "mouth_opening"), then the adaptive
   enamel finder (enamel.find_enamel) on this photo's own mouth: bright, low-chroma pixels
   in the upper part of the opening. Gaps between teeth, the tongue, gums and lips are not
   enamel and are never touched. No enamel found is refused as "no_teeth_visible".
3. Natural cap: L* rises by at most MAX_LIFT and never above NATURAL_L_CAP, so teeth go a
   few shades lighter, never paper white; yellowness (b*) falls toward WARM_B and never
   below it, so enamel keeps its ivory warmth and never turns blue. A tooth already at or
   past the cap keeps its lightness. Lift and warmth scale with strength 0-100; 0 is an
   exact copy. Each tooth keeps its own variation, because every pixel moves by its own
   capped amount from where it was.
4. Byte check: 8-bit rounding can push a pixel a fraction past the cap or the floor. Such a
   pixel's target is nudged back by half a unit, up to four times; one that still ends
   above the cap (or above its own L* when it started above it) or below the warm floor
   (or below its own b* when it started below it) is restored to its original bytes.
   Alpha is copied.

The cap, lift and warm floor are ASSUMED (drawn mouths; real-mouth tuning not done). An
optical colour simulation, not dental treatment or a whitening prediction.
web/src/engines/teeth/natural.ts mirrors this file.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from ..core import regions
from ..core.refusal import Refusal, refusal_for
from ..shade.colourspace import lab_to_srgb, srgb_to_lab, to_bytes
from ..skin.common import SkinResult
from . import enamel
from .mouth_state import observe

MODULE = "teeth.natural"
LABEL = "Teeth colour simulation with a natural cap, not dental treatment or a whitening prediction."
NATURAL_L_CAP = 86.0   # lightest L* any tooth pixel is taken to (ASSUMED)
MAX_LIFT = 10.0        # largest L* rise at strength 100 (ASSUMED)
WARM_B = 9.0           # b* floor: yellowness is reduced toward this, never past it (ASSUMED)
MAX_B_DROP = 8.0       # largest b* fall at strength 100 (ASSUMED)
MIN_OPENING_PIXELS = 8
ROUNDING_PASSES, ROUNDING_STEP = 4, 0.5   # nudges that absorb 8-bit rounding before a restore
MESSAGES: dict[str, str] = {
    "mouth_closed": "The mouth is closed in this photo, so there are no teeth to whiten.",
    "opening_too_small": "The open part of the mouth is too small in this photo.",
    "no_teeth_visible": "No teeth are visible inside the open mouth, so nothing was changed.",
}


def _check(image: Any, strength: Any) -> np.ndarray:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4) or min(img.shape[:2]) < 8:
        raise ValueError("teeth whitening needs an RGB or RGBA uint8 photo of at least 8 x 8")
    if isinstance(strength, bool) or not isinstance(strength, (int, float)) or not math.isfinite(strength) \
            or not 0 <= strength <= 100:
        raise ValueError("strength must be 0..100")
    return img


def natural_target(lab: np.ndarray, amount: float) -> np.ndarray:
    """Capped Lab for tooth pixels (n, 3); `amount` is strength / 100."""
    out = lab.copy()
    out[:, 0] = lab[:, 0] + amount * np.minimum(MAX_LIFT, np.maximum(0.0, NATURAL_L_CAP - lab[:, 0]))
    out[:, 2] = lab[:, 2] - amount * np.minimum(MAX_B_DROP, np.maximum(0.0, lab[:, 2] - WARM_B))
    return out


def whiten_teeth(image: Any, points: Any, *, strength: float = 30.0) -> SkinResult | Refusal:
    img = _check(image, strength)
    h, w = img.shape[:2]
    early = refusal_for(MODULE, points, h, w)
    if early is not None:
        return early
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    seen = observe(pts)
    if seen.not_applicable:
        return Refusal(MODULE, "mouth_closed", MESSAGES["mouth_closed"])
    opening = regions.region_mask("mouth_opening", pts, h, w, normalized=False)
    if int(np.count_nonzero(opening >= 0.5)) < MIN_OPENING_PIXELS:
        return Refusal(MODULE, "opening_too_small", MESSAGES["opening_too_small"])
    rgb = img[..., :3]
    lab = srgb_to_lab(rgb)
    selected, _ = enamel.find_enamel(rgb, lab, opening)
    if not selected.any():
        return Refusal(MODULE, "no_teeth_visible", MESSAGES["no_teeth_visible"])
    metrics: dict[str, float | int | str | bool] = {"teeth_pixels": int(selected.sum()),
                                                    "gap_ratio": round(seen.gap_ratio, 4),
                                                    "natural_l_cap": NATURAL_L_CAP, "warm_b_floor": WARM_B}
    if strength == 0:
        return SkinResult(img.copy(), np.zeros((h, w)), LABEL, {**metrics, "unchanged": True})
    amount = float(strength) / 100.0
    before = lab[selected]
    target = natural_target(before, amount)
    ceiling = np.maximum(before[:, 0], NATURAL_L_CAP)
    floor = np.minimum(before[:, 2], WARM_B)
    rounded = to_bytes(lab_to_srgb(target))
    for _ in range(ROUNDING_PASSES):
        after = srgb_to_lab(rounded)
        high, cold = after[:, 0] > ceiling, after[:, 2] < floor
        if not (high.any() or cold.any()):
            break
        target[high, 0] -= ROUNDING_STEP
        target[cold, 2] += ROUNDING_STEP
        redo = high | cold
        rounded[redo] = to_bytes(lab_to_srgb(target[redo]))
    after = srgb_to_lab(rounded)
    safe = (after[:, 0] <= ceiling) & (after[:, 2] >= floor)
    rounded[~safe] = rgb[selected][~safe]
    out = img.copy()
    out[..., :3][selected] = rounded
    weight = np.zeros((h, w))
    weight[selected] = amount
    lifted = srgb_to_lab(rounded)[:, 0] - before[:, 0]
    metrics.update({"restored_pixels": int((~safe).sum()), "mean_lift": round(float(lifted.mean()), 3),
                    "max_l_after": round(float(srgb_to_lab(rounded)[:, 0].max()), 3)})
    return SkinResult(out, weight, LABEL, metrics)

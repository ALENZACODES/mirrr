"""Local Foundation step: her matched shade (feature #101, finder.py) applied to her own skin,
never lighter.

Inputs are the photo, its 478 landmarks in pixels, and two CIELAB colours from the shade
finder: the shade she picked and her measured skin reading. The reading and the shade sit in
the same white-balanced space, so their difference is what the foundation changes; it is
applied on top of her skin as it looks in this photo, which keeps the photo's own light.

1. Skin: the landmark skin mask (engines/skin/common.py: face oval minus eyes, brows and lips).
2. Low frequencies only: a skin-only box mean (a quarter of the eye distance wide) is the
   smooth skin; its median is her base level in this photo. The target is base + (shade -
   reading). Each pixel moves by coverage x (target - smooth), so pores, grain, freckles and
   moles keep their contrast against the skin around them (women-first rule 2).
3. Never lighter: the L* move is clipped to zero or below, so a darker patch is never lifted
   and the shade can only deepen or even out the skin; a* and b* move toward the shade's
   undertone, capped. The shared byte guard (skin/common.no_lighten) catches rounding, so no
   pixel's L* rises (women-first rule 8).
4. Refusals, coded: a mesh no face tool should edit (core/refusal.py), too little visible
   skin, a shade lighter than her reading by more than the finder's allowance, a shade
   farther from her reading than the finder would ever match, a finder result that refused,
   or a result whose mean colour change over the skin exceeds the guard.

Coverage, radius and caps are ASSUMED (drawn faces; real-face tuning not done). The shades are
our own references, not tested against real products. Local simulation, not a product
result; the try-on screen's YouCam route stays separate and optional.
web/src/engines/shade/foundation.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np

from ..core.colour import ciede2000
from ..core.refusal import Refusal, refusal_for
from ..skin.common import (
    MIN_SKIN_PIXELS,
    SkinResult,
    check_strength,
    encode,
    frame,
    masked_lowpass,
    no_lighten,
    radius,
    rgb_of,
    skin_mask,
)
from .colourspace import srgb_to_lab
from .finder import ShadeResult, thresholds

MODULE = "shade.foundation"
LABEL = "Foundation simulation in your matched shade, never lighter than your skin. Not tested against real products."
COVERAGE_MAX = 0.75     # share of the gap to the shade closed at strength 100 (ASSUMED)
SMOOTH_SHARE = 0.25     # skin-only box radius, share of the eye distance (ASSUMED)
MAX_DARKEN = 12.0       # largest L* drop at any pixel (ASSUMED)
MAX_SHIFT = 10.0        # largest a* or b* change at any pixel (ASSUMED)
GUARD_MEAN_DELTA_E = 8.0  # mean CIE76 change over the skin above which the edit is refused (ASSUMED)
MESSAGES: dict[str, str] = {
    "no_visible_skin": "Too little skin is visible in this photo for a foundation preview; try a closer photo.",
    "no_shade_match": "There is no matched shade to apply. Find your shade first.",
    "shade_lighter_than_skin": "This shade is lighter than your skin reading, so it is not applied. We never lighten skin.",
    "shade_too_far": "This shade is too far from your skin reading to be your match, so it is not applied.",
    "identity_guard": "This change would alter the skin too much, so it was not applied.",
}


def _lab(value: Any, name: str) -> tuple[float, float, float]:
    if not isinstance(value, (list, tuple, np.ndarray)) or len(value) != 3:
        raise ValueError(f"{name} must be three CIELAB numbers")
    out = []
    for v in value:
        if isinstance(v, bool) or not isinstance(v, (int, float, np.floating, np.integer)) or not math.isfinite(float(v)):
            raise ValueError(f"{name} must be three finite CIELAB numbers")
        out.append(float(v))
    if not 0 <= out[0] <= 100:
        raise ValueError(f"{name} L* must be in 0..100")
    return out[0], out[1], out[2]


def apply_foundation(image: np.ndarray, points: Any, shade_lab: Sequence[float], measured_lab: Sequence[float], *,
                     strength: float = 60.0) -> SkinResult | Refusal:
    rgb = rgb_of(image)
    amount = check_strength(strength)
    shade = _lab(shade_lab, "shade_lab")
    measured = _lab(measured_lab, "measured_lab")
    h, w = image.shape[:2]
    early = refusal_for(MODULE, points, h, w)
    if early is not None:
        return early
    lighter_by = shade[0] - measured[0]
    if lighter_by > float(thresholds()["never_lighter_allowance"]):
        return Refusal(MODULE, "shade_lighter_than_skin", MESSAGES["shade_lighter_than_skin"])
    distance = ciede2000(measured, shade)
    if distance > float(thresholds()["confidence"]["refuse_delta_e_above"]):
        return Refusal(MODULE, "shade_too_far", MESSAGES["shade_too_far"])
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    skin = skin_mask(pts, h, w)
    inside = skin >= 0.5
    if int(inside.sum()) < MIN_SKIN_PIXELS:
        return Refusal(MODULE, "no_visible_skin", MESSAGES["no_visible_skin"])
    metrics: dict[str, float | int | str | bool] = {"shade_delta_e": round(distance, 3),
                                                    "shade_lighter_by": round(lighter_by, 3), "strength": float(strength)}
    if amount == 0:
        return SkinResult(image.copy(), np.zeros(skin.shape), LABEL, {**metrics, "unchanged": True})
    lab = srgb_to_lab(rgb)
    before = lab.copy()
    r = radius(frame(pts).iod, SMOOTH_SHARE, 2)
    weight = np.where(skin > 0, skin, 0.0)
    pull = amount * COVERAGE_MAX
    for c in range(3):
        smooth = masked_lowpass(lab[..., c], skin, r)
        base = float(np.median(smooth[inside]))
        target = base + (shade[c] - measured[c])
        move = pull * (target - smooth)
        move = np.clip(move, -MAX_DARKEN, 0.0) if c == 0 else np.clip(move, -MAX_SHIFT, MAX_SHIFT)
        lab[..., c] += move * weight
        metrics[("base_l", "base_a", "base_b")[c]] = round(base, 3)
    out, guarded = no_lighten(image, encode(image, lab, weight), weight)
    after = srgb_to_lab(out[..., :3])
    change = float(np.sqrt(((after - before) ** 2).sum(axis=-1))[inside].mean())
    metrics.update({"guarded_pixels": guarded, "mean_delta_e": round(change, 3), "never_lighter": True})
    if change > GUARD_MEAN_DELTA_E:
        return Refusal(MODULE, "identity_guard", MESSAGES["identity_guard"])
    return SkinResult(out, weight, LABEL, metrics)


def foundation_from_match(image: np.ndarray, points: Any, match: ShadeResult | Mapping[str, Any], *,
                          strength: float = 60.0, choice: str = "best") -> SkinResult | Refusal:
    """Apply the finder's best shade (or its alternative) from a ShadeResult or its JSON."""
    if choice not in ("best", "alternative"):
        raise ValueError("choice must be best or alternative")
    data = match.to_json() if isinstance(match, ShadeResult) else match
    if not isinstance(data, Mapping):
        raise ValueError("match must be a shade finder result")
    picked = data.get(choice)
    if data.get("refused") or not isinstance(picked, Mapping) or data.get("measured_lab") is None:
        rgb_of(image)
        check_strength(strength)
        return Refusal(MODULE, "no_shade_match", MESSAGES["no_shade_match"])
    return apply_foundation(image, points, picked["lab"], data["measured_lab"], strength=strength)

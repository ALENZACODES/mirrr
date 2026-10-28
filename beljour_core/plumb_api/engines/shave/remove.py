"""#24 Beard removal for stubble and short beards, local, from the face mesh. Author: John Khan.

1. Zones. The beard area from the mesh (engines/beard/regions.area: jaw, cheeks below the
   cheek line, chin and upper lip, faded edge; the lips are cut out), kept to the visible
   face skin, so the neck under the jaw line is not edited, and,
   as the colour reference, her own cheek skin above it: visible skin (skin/common.skin_mask)
   at least REF_BELOW IOD below the eye line and outside the beard area grown by REF_MARGIN.
2. Scope, measured, never assumed, relative to this photo's own contrast. The hair level
   is the darkest HAIR_PERCENTILE of the beard area; the contrast C is cheek L* minus that.
   A pixel is skin-like when it is within SKIN_SHARE x C of the cheek. With at least
   STUBBLE_VISIBLE of the area skin-like it is stubble; with at least SKIN_VISIBLE_MIN it
   is a short beard; below that the hair hides the skin and the jaw line, which only a
   generative fill could invent, so it is refused as "full_beard". A contrast under
   MIN_RELATIVE_CONTRAST of the cheek's L*, or under NO_BEARD_SHARE of hair-like pixels,
   is "no_beard_found". Fixed L* gaps would misjudge dark hair on deep skin, so none are
   used; on drawn faces the margin between a clean face and the lightest stubble is
   narrowest on very dark skin (0.13 against 0.19), which real-face checks must confirm.
3. Removal, low frequencies only. Each pixel gets a hair weight from how far it sits
   below the skin-like level, over HAIR_SHARE x C. A mole or mark inside the beard area
   cannot be told from stubble automatically, so she taps the ones to keep: a disc of
   KEEP_RADIUS IOD round each tap is left exactly as it was. The skin under the hair is the local mean of the less hairy pixels
   nearby; the shaving shadow (the area's broad cast against her cheek) is taken out by
   SHADOW_SHARE. Hair pixels take that skin colour; skin-like pixels keep their own fine
   texture on top of it. The step is capped per scope (shave/assessment.amount_cap: 0.9
   stubble, 0.72 short beard) and scaled by strength 0-100; 0 is an exact copy.
4. Never past her cheek: no pixel's L* ends above both its own value and her cheek's L*
   (rounding included; a pixel that would is restored). Nothing outside the beard area
   changes, geometry never moves, alpha is copied. Fine skin texture under dense hair is
   not invented, and the label says so.

Shares and radii are ASSUMED (drawn beards; real-face tuning not done). A visual estimate,
not a grooming or medical prediction. web/src/engines/shave/remove.ts mirrors this file.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from ..beard.regions import area
from ..core.distance import dilate
from ..core.refusal import Refusal, refusal_for
from ..shade.colourspace import srgb_to_lab
from ..skin.common import SkinResult, encode, frame, masked_lowpass, radius, skin_mask
from .assessment import amount_cap

MODULE = "shave.remove"
LABEL = ("Clean-shave visual estimate for stubble and short beards. Skin under the hair is estimated "
         "from your nearby skin; fine texture under dense hair is not invented.")
HAIR_PERCENTILE = 5.0    # darkest share of the beard area taken as the hair level (ASSUMED)
SKIN_SHARE = 0.3         # share of the contrast below the cheek still counted as skin (ASSUMED)
HAIR_SHARE = 0.4         # further share of the contrast over which a pixel becomes hair (ASSUMED)
MIN_RELATIVE_CONTRAST = 0.16  # contrast over cheek L* below which no hair is distinguishable (ASSUMED)
KEEP_RADIUS = 0.05       # disc kept round each keep tap, IOD (ASSUMED)
ROUNDING_MARGIN = 0.5    # L* margin under the ceiling that absorbs 8-bit rounding
STUBBLE_VISIBLE = 0.5    # skin-like share of the area for stubble (ASSUMED)
SKIN_VISIBLE_MIN = 0.2   # below this the beard hides the skin: refused (ASSUMED)
NO_BEARD_SHARE = 0.03    # hair-like share under which there is nothing to remove (ASSUMED)
REF_BELOW = 0.35         # cheek reference starts this far below the eye line, IOD (ASSUMED)
REF_MARGIN = 0.08        # gap kept between the reference and the beard area, IOD (ASSUMED)
BASE_RADIUS = 0.06       # skin-under-hair box radius, IOD (ASSUMED)
CAST_RADIUS = 0.3        # shaving-shadow box radius, IOD (ASSUMED)
SHADOW_SHARE = 0.6       # share of the shaving shadow taken out (ASSUMED)
MIN_REF_PIXELS = 40
MESSAGES: dict[str, str] = {
    "zone_not_visible": "The beard area or the cheek beside it is not visible enough in this photo.",
    "no_beard_found": "No stubble or short beard was found, so nothing was changed.",
    "full_beard": "This beard hides the skin and the jaw line. The clean-shave estimate covers stubble and short beards only.",
}


def _check(image: Any, strength: Any) -> np.ndarray:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4) or min(img.shape[:2]) < 8:
        raise ValueError("beard removal needs an RGB or RGBA uint8 photo of at least 8 x 8")
    if isinstance(strength, bool) or not isinstance(strength, (int, float)) or not math.isfinite(strength) \
            or not 0 <= strength <= 100:
        raise ValueError("strength must be 0..100")
    return img


def _taps(value: Any, h: int, w: int) -> list[tuple[float, float]]:
    if not isinstance(value, (list, tuple)):
        raise ValueError("keep must be a list of [x, y] points")
    out = []
    for item in value:
        if not isinstance(item, (list, tuple)) or len(item) != 2 or not all(
                isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in item):
            raise ValueError("keep must be a list of [x, y] points")
        if not (0 <= item[0] < w and 0 <= item[1] < h):
            raise ValueError("keep points must lie inside the photo")
        out.append((float(item[0]), float(item[1])))
    return out


def remove_beard(image: Any, points: Any, *, strength: float = 30.0,
                 keep: Any = ()) -> SkinResult | Refusal:
    img = _check(image, strength)
    h, w = img.shape[:2]
    kept_at = _taps(keep, h, w)
    early = refusal_for(MODULE, points, h, w)
    if early is not None:
        return early
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    try:
        beard = area(pts, h, w)
    except ValueError:
        return Refusal(MODULE, "zone_not_visible", MESSAGES["zone_not_visible"])
    face = frame(pts)
    skin = skin_mask(pts, h, w) >= 0.5
    inside = (beard.hard >= 0.5) & skin
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    _, below = face.local(xx + 0.5, yy + 0.5)
    grown = dilate(beard.hard, REF_MARGIN * face.iod) >= 0.5
    reference = skin & ~grown & (below >= REF_BELOW)
    if int(inside.sum()) < MIN_REF_PIXELS or int(reference.sum()) < MIN_REF_PIXELS:
        return Refusal(MODULE, "zone_not_visible", MESSAGES["zone_not_visible"])
    lab = srgb_to_lab(img[..., :3])
    ref = np.array([float(np.median(lab[..., c][reference])) for c in range(3)])
    contrast = ref[0] - float(np.percentile(lab[..., 0][inside], HAIR_PERCENTILE))
    skin_level = ref[0] - SKIN_SHARE * contrast
    hair = np.clip((skin_level - lab[..., 0]) / max(HAIR_SHARE * contrast, 1e-6), 0.0, 1.0) * inside
    spared = np.zeros((h, w), dtype=bool)
    for x, y in kept_at:
        spared |= (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= (KEEP_RADIUS * face.iod) ** 2
    hair[spared] = 0.0
    visible = float((lab[..., 0][inside] >= skin_level).mean())
    hairy = float((hair[inside] > 0).mean())
    metrics: dict[str, float | int | str | bool] = {"skin_visible_share": round(visible, 4), "hair_share": round(hairy, 4),
                                                    "contrast_l": round(contrast, 3), "cheek_l": round(ref[0], 3),
                                                    "kept_taps": len(kept_at)}
    if contrast < MIN_RELATIVE_CONTRAST * ref[0]:
        return Refusal(MODULE, "no_beard_found", MESSAGES["no_beard_found"])
    if visible < SKIN_VISIBLE_MIN:
        return Refusal(MODULE, "full_beard", MESSAGES["full_beard"])
    if hairy < NO_BEARD_SHARE:
        return Refusal(MODULE, "no_beard_found", MESSAGES["no_beard_found"])
    scope = "stubble" if visible >= STUBBLE_VISIBLE else "short_beard"
    metrics["scope"] = scope
    if strength == 0:
        return SkinResult(img.copy(), np.zeros((h, w)), LABEL, {**metrics, "unchanged": True})
    zone = inside.astype(np.float64)
    clean = zone * (1.0 - hair) ** 2
    r_base, r_cast = radius(face.iod, BASE_RADIUS, 2), radius(face.iod, CAST_RADIUS, 3)
    revised = lab.copy()
    weight = beard.weight.astype(np.float64) * zone * ~spared * amount_cap(scope) * (float(strength) / 100.0)
    for c in range(3):
        base = masked_lowpass(lab[..., c], clean, r_base)
        cast = masked_lowpass(base, zone, r_cast) - ref[c]
        corrected = base - SHADOW_SHARE * cast
        target = corrected + (lab[..., c] - base) * (1.0 - hair)
        revised[..., c] = lab[..., c] + weight * (target - lab[..., c])
    ceiling = np.maximum(lab[..., 0], ref[0])
    revised[..., 0] = np.minimum(revised[..., 0], np.maximum(lab[..., 0], ref[0] - ROUNDING_MARGIN))
    out = encode(img, revised, weight)
    after = srgb_to_lab(out[..., :3])[..., 0]
    over = (weight > 0) & (after > ceiling + 1e-9)
    out[..., :3][over] = img[..., :3][over]
    metrics.update({"restored_pixels": int(over.sum()), "amount_cap": amount_cap(scope)})
    return SkinResult(out, weight, LABEL, metrics)

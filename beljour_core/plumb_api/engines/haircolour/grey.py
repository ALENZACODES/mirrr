"""#20 Grey removal and #102 Grey Transition decision previews, local, on her marked hair.

Grey Transition is a named mode for women weighing what to do about greys (40-60 is the
audience it was designed for); no age is asked, read or inferred. Like the curl-preserving
recolour (recolour.py), it works only inside a hair mask she marks; hair is never inferred
from the face or from skin colour, and nothing outside the mask changes.

1. Read her hair. Grey strands are low-chroma pixels clearly lighter than her pigmented
   hair: a weight from chroma (full below GREY_CHROMA - CHROMA_RAMP/2, none above
   GREY_CHROMA + CHROMA_RAMP/2) times a weight from lightness above her natural level
   (none below LIGHT_GAP, full at LIGHT_GAP + LIGHT_RAMP). Her natural shade is the median
   Lab of her hair that is not grey, found in two passes: a first reading from the darker
   NATURAL_SHARE of her hair by L*, then the median of all hair that grey weights taken
   from a level STRICT_SHARE x LIGHT_GAP below that reading leave at zero is her shade, so
   strands partly mixed with grey do not lighten it (chroma alone is not used, so black hair, which is
   itself low in chroma, reads correctly). Light blonde and silver sit close together, so
   detection is weakest there. Or a shade she gives (for example from
   her roots or an old photo). Too little grey is "no_grey_found"; hair so grey that no
   coloured strand shows (fewer than MIN_COLOURED_PIXELS above the grey chroma band) and
   whose darker part reads as silver (in the grey band, L* above GREY_MIN_L), with no shade
   given, is "natural_shade_unknown".
2. Stages, each with a plain decision label:
   * cover (#20): her greys taken to her natural shade;
   * blend (#102): BLEND_SHARE of that, so part of the silver stays as soft highlights;
   * silver (#102): her pigmented strands taken to her own measured grey, as after a full
     grow-out (needs measured grey; it is never invented).
   Every move keeps the strand structure: lightness is an increasing affine map of the old
   lightness (recolour.recolour_lab, gain from recolour.texture_gain), so each highlight,
   shadow and curl keeps its place and order. The gain is bounded (0.6 at least), so very
   light greys over very dark hair come out a little lighter than her strands, as their
   highlights are kept. Strength 0-100 scales the move; 0 is an exact copy. Alpha is copied.

Shares and ramps are ASSUMED (drawn hair; real-hair tuning not done). A colour simulation
and salon-decision aid, not a salon result or a promise of how dye will take.
web/src/engines/haircolour/grey.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from typing import Any

import numpy as np

from ..core.refusal import Refusal
from ..shade import colourspace as cs
from ..skin.common import SkinResult
from .recolour import recolour_lab, texture_gain

MODULE = "haircolour.grey"
MODE = "Grey Transition"
STAGES = ("cover", "blend", "silver")
GREY_CHROMA = 8.0       # chroma separating grey from pigmented strands (ASSUMED)
CHROMA_RAMP = 8.0       # chroma band over which a strand turns from grey to pigmented (ASSUMED)
LIGHT_GAP = 15.0        # L* above her natural shade before a strand counts as grey (ASSUMED)
LIGHT_RAMP = 15.0       # further L* over which it becomes fully grey (ASSUMED)
BLEND_SHARE = 0.55      # share of the cover move the blend stage makes (ASSUMED)
NO_GREY_SHARE = 0.01    # grey share of the hair under which there is nothing to do (ASSUMED)
NATURAL_SHARE = 0.25    # darker share of the hair, by L*, for the first natural reading (ASSUMED)
STRICT_SHARE = 0.5      # the second pass leaves out pixels this share of LIGHT_GAP closer to grey (ASSUMED)
GREY_MIN_L = 45.0       # a natural reading lighter than this and in the grey band is silver (ASSUMED)
MIN_HAIR_PIXELS = 64
MIN_COLOURED_PIXELS = 32
LABELS: dict[str, str] = {
    "cover": "Full colour: your greys in your natural shade. Regrowth shows at the roots, so this look needs regular touch-ups.",
    "blend": "Grey blending: part of your silver kept as soft highlights, so regrowth shows less between visits.",
    "silver": "Going silver: your hair shown in your own grey, as after a full grow-out. No colour upkeep; the grow-out itself takes months.",
}
NOTE = "Colour simulation and salon-decision aid, not a salon result."
MESSAGES: dict[str, str] = {
    "no_hair_marked": "Mark your hair first; it is never guessed from the photo.",
    "no_grey_found": "No grey strands were found in the hair you marked, so nothing was changed.",
    "natural_shade_unknown": "Too little of your natural colour is visible to read it. Choose your natural shade, for example from your roots.",
}


def _check(image: Any, mask: Any, strength: Any, stage: Any) -> tuple[np.ndarray, np.ndarray]:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4) or min(img.shape[:2]) < 2:
        raise ValueError("grey preview needs a uint8 RGB or RGBA photo")
    m = np.asarray(mask, dtype=np.float64)
    if m.shape != img.shape[:2] or not np.all(np.isfinite(m)) or np.min(m) < 0 or np.max(m) > 1:
        raise ValueError("hair mask must match the photo and hold values in 0..1")
    if isinstance(strength, bool) or not isinstance(strength, (int, float)) or not math.isfinite(strength) \
            or not 0 <= strength <= 100:
        raise ValueError("strength must be 0..100")
    if stage not in STAGES:
        raise ValueError(f"stage must be one of {', '.join(STAGES)}")
    return img, m


def _natural(value: Sequence[float] | None) -> np.ndarray | None:
    if value is None:
        return None
    lab = np.asarray(value, dtype=np.float64)
    if lab.shape != (3,) or not np.all(np.isfinite(lab)) or not 0 <= lab[0] <= 100:
        raise ValueError("natural shade must be one finite Lab triple with L* in 0..100")
    return lab


def grey_weights(lab: np.ndarray, hair: np.ndarray, natural_l: float) -> np.ndarray:
    """0..1 grey weight per pixel inside the hair."""
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    low = np.clip((GREY_CHROMA + CHROMA_RAMP / 2 - chroma) / CHROMA_RAMP, 0.0, 1.0)
    light = np.clip((lab[..., 0] - natural_l - LIGHT_GAP) / LIGHT_RAMP, 0.0, 1.0)
    return low * light * hair


def grey_preview(image: Any, hair_mask: Any, *, stage: str = "cover", strength: float = 30.0,
                 natural_lab: Sequence[float] | None = None) -> SkinResult | Refusal:
    img, mask = _check(image, hair_mask, strength, stage)
    given = _natural(natural_lab)
    hair = mask >= 0.5
    if int(hair.sum()) < MIN_HAIR_PIXELS:
        return Refusal(MODULE, "no_hair_marked", MESSAGES["no_hair_marked"])
    lab = cs.srgb_to_lab(img[..., :3])
    if given is not None:
        natural = given
    else:
        darker = hair & (lab[..., 0] <= float(np.percentile(lab[..., 0][hair], 100 * NATURAL_SHARE)))
        first = np.array([float(np.median(lab[..., c][darker])) for c in range(3)])
        coloured = int(np.count_nonzero(hair & (np.hypot(lab[..., 1], lab[..., 2]) > GREY_CHROMA + CHROMA_RAMP / 2)))
        if (coloured < MIN_COLOURED_PIXELS and math.hypot(first[1], first[2]) <= GREY_CHROMA + CHROMA_RAMP / 2
                and first[0] > GREY_MIN_L):
            return Refusal(MODULE, "natural_shade_unknown", MESSAGES["natural_shade_unknown"])
        strict = float(first[0]) - STRICT_SHARE * LIGHT_GAP
        plain = hair & (grey_weights(lab, hair.astype(np.float64), strict) == 0)
        natural = np.array([float(np.median(lab[..., c][plain])) for c in range(3)])
    grey = grey_weights(lab, hair.astype(np.float64), float(natural[0]))
    greyish = hair & (grey >= 0.5)
    share = float(greyish.sum()) / float(hair.sum())
    metrics: dict[str, float | int | str | bool] = {"mode": MODE, "stage": stage, "grey_share": round(share, 4),
                                                    "natural_l": round(float(natural[0]), 3),
                                                    "natural_from": "given" if given is not None else "measured"}
    if share < NO_GREY_SHARE:
        return Refusal(MODULE, "no_grey_found", MESSAGES["no_grey_found"])
    label = f"{MODE}. {LABELS[stage]} {NOTE}"
    if strength == 0:
        return SkinResult(img.copy(), np.zeros(hair.shape), label, {**metrics, "unchanged": True})
    amount = float(strength) / 100.0
    hair_weight = np.where(hair, mask, 0.0)
    if stage == "silver":
        silver = np.array([float(np.median(lab[..., c][greyish])) for c in range(3)])
        source = hair & ~greyish
        if not source.any():
            return SkinResult(img.copy(), np.zeros(hair.shape), label, {**metrics, "unchanged": True})
        target, group = silver, source
        weight = hair_weight * (1.0 - grey) * amount
    else:
        target, group = natural, greyish
        weight = hair_weight * grey * amount * (BLEND_SHARE if stage == "blend" else 1.0)
    mean_l = float(lab[..., 0][group].mean())
    new = recolour_lab(lab, weight, target, mean_l=mean_l, gain=texture_gain(mean_l, float(target[0])))
    blended = lab + (new - lab) * weight[..., None]
    out = img.copy()
    moved = weight > 0
    out[..., :3][moved] = cs.to_bytes(cs.lab_to_srgb(blended[moved]))
    metrics.update({"target_l": round(float(target[0]), 3), "moved_pixels": int(moved.sum())})
    return SkinResult(out, weight, label, metrics)

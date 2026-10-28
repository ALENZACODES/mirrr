"""Authenticity mode for dating photos (women-first rule 11): light, contrast and crop only,
then a Still Her check before anything is shown.

Enhance is a gentle contrast lift pivoted on her face's own average brightness, so her face
gets clearer without getting lighter; relight is a soft key light (relight.py) that keeps
that average; the crop is a 4:5 portrait from her face points (headshot.crops). Nothing
reshapes, smooths or adds pixels; generated variants stay blocked.

Still Her check, on her face (face points box inside her person area), before against after:
her average lightness may not rise by more than MAX_LIGHTER L*, her average colour may not
move by more than MAX_SHIFT (CIE76 Delta E), and her fine texture must stay within TEXTURE
of what it was (no smoothing). Any failure returns a coded refusal, not a picture.
web/src/engines/studio/authentic.ts mirrors this file. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from plumb_api.engines.core.filters import box_mean
from plumb_api.engines.shade.colourspace import srgb_to_lab

from .common import (
    Floats,
    StudioRefusal,
    StudioResult,
    face_box,
    face_rows_cols,
    finish,
    grey,
    person_mask,
    photo,
    strength,
)
from .headshot import crops
from .relight import apply_light

CONTRAST = 0.12      # contrast lift at full strength (ASSUMED)
LIGHT = 0.25         # key light share at full strength (ASSUMED)
MAX_LIGHTER = 1.0    # L* (ASSUMED)
MAX_SHIFT = 3.0      # Delta E (ASSUMED)
TEXTURE = (0.9, 1.25)
LABEL = "Authenticity mode: light, contrast and crop of your own photo. No reshaping, smoothing or generated pixels."


def _face_region(person: Floats, box: tuple[float, float, float, float]) -> Floats:
    rows, cols = face_rows_cols(box, *person.shape)
    region = np.zeros_like(person)
    region[rows, cols] = person[rows, cols] >= 0.5
    if region.sum() < 16:
        raise StudioRefusal("face_outside_person", "Her face points are outside the person area.")
    return region


def texture(rgb: Floats, region: Floats) -> float:
    g = grey(rgb)
    fine = g - box_mean(g, 2)
    w = region.sum()
    return float(np.sqrt((fine * fine * region).sum() / w))


def still_her(before: Floats, after: Floats, region: Floats) -> dict[str, float | bool]:
    sel = region > 0
    lab0 = srgb_to_lab(before[sel]).mean(axis=0)
    lab1 = srgb_to_lab(np.clip(np.rint(after[sel]), 0, 255)).mean(axis=0)
    ratio = texture(np.clip(np.rint(after), 0, 255), region) / max(texture(before, region), 1e-9)
    lighter = float(lab1[0] - lab0[0])
    shift = float(np.sqrt(((lab1 - lab0) ** 2).sum()))
    ok = lighter <= MAX_LIGHTER and shift <= MAX_SHIFT and TEXTURE[0] <= ratio <= TEXTURE[1]
    return {"still_her": ok, "lightness_change": lighter, "colour_shift": shift, "texture_ratio": ratio}


def authenticity(image: Any, coarse: Any, points: Any, amount: float = 60) -> StudioResult:
    rgb, alpha = photo(image)
    h, w = rgb.shape[:2]
    share = strength(amount)
    person = person_mask(coarse, h, w)
    box = face_box(points)
    region = _face_region(person, box)
    pivot = (rgb * region[..., None]).sum(axis=(0, 1)) / region.sum()   # her face's own mean colour
    enhanced = pivot + (rgb - pivot) * (1 + CONTRAST * share)
    lit, raw = apply_light(np.clip(enhanced, 0, 255), person, box, "upper-left", LIGHT * share)
    check = still_her(rgb, lit, region)
    if not check["still_her"]:
        raise StudioRefusal("still_her_failed", "The result moved too far from her own colour, lightness or texture.")
    return StudioResult(finish(lit, alpha), LABEL, {"tool": "authentic", **check, "gain_before_balance": raw},
                        tuple(c for c in crops(box, w, h) if c[0] == "portrait-4x5"))

"""Studio relight: a soft key light from one side across her, as a lighting simulation.

The light is a smooth gain across her face's own width, brighter on the key side and
softer on the other, applied only inside her person area. The gain is normalised so the
average brightness of her face stays where it was: the light shapes her face, it never
lightens her skin (women-first rule 8). The largest change at full strength is MAX_GAIN.
Needs her face points for the light's geometry and her person area for where it falls.
web/src/engines/studio/relight.ts mirrors this file. Author: John Khan.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from .common import (
    Floats,
    StudioRefusal,
    StudioResult,
    face_box,
    face_rows_cols,
    finish,
    person_mask,
    photo,
    radius_for,
    soft_blur,
    strength,
)

MAX_GAIN = 0.15        # +-15% at full strength (ASSUMED: visible shaping without blowing highlights)
SIDES = {"left": 180.0, "right": 0.0, "upper-left": 215.0, "upper-right": 325.0}
LABEL = "Lighting simulation. The average brightness of your face is kept."


def light_field(width: int, height: int, box: tuple[float, float, float, float], side: str, share: float) -> Floats:
    if side not in SIDES:
        raise ValueError(f"side must be one of {', '.join(SIDES)}")
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    span = max(1.0, (x1 - x0) / 2)
    angle = math.radians(SIDES[side])
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    d = np.clip(((xx - cx) * math.cos(angle) + (yy - cy) * math.sin(angle)) / (2 * span), -1, 1)
    return 1 + MAX_GAIN * share * d * (1.5 - 0.5 * d * d)


def apply_light(rgb: Floats, person: Floats, box: tuple[float, float, float, float], side: str, share: float) -> tuple[Floats, float]:
    """Relit RGB and the gain's mean over her face before normalising (1 means balanced)."""
    h, w = person.shape
    field = light_field(w, h, box, side, share)
    rows, cols = face_rows_cols(box, h, w)
    face = person[rows, cols]
    if float(face.sum()) < 16:
        raise StudioRefusal("face_outside_person", "Her face points are outside the person area.")
    region = field[rows, cols]
    lum = rgb[rows, cols].mean(axis=2)
    weight = face * lum
    raw = float((region * weight).sum() / max(float(weight.sum()), 1e-9))
    gain = field / raw
    where = soft_blur(person, radius_for(w, h, 1 / 200))
    return rgb * (1 + (gain - 1) * where)[..., None], raw


def relight(image: Any, coarse: Any, points: Any, *, side: str = "upper-left", amount: float = 50) -> StudioResult:
    rgb, alpha = photo(image)
    h, w = rgb.shape[:2]
    share = strength(amount)
    person = person_mask(coarse, h, w)
    box = face_box(points)
    if share == 0:
        return StudioResult(image.copy(), LABEL, {"tool": "relight", "no_op": True})
    out, raw = apply_light(rgb, person, box, side, share)
    return StudioResult(finish(out, alpha), LABEL, {"tool": "relight", "side": side, "gain_before_balance": raw,
                                                    "max_gain": MAX_GAIN * share})

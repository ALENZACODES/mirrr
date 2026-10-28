"""Headshot studio: her own photo with a conservative backdrop, a soft key light, a light
even-tone retouch and head-and-shoulders crops, per industry. Non-generative: no new face,
clothes, body or background photo is made; generated headshots stay blocked.

Order: retouch (the skin tools' Even tone at a low strength, which never lightens skin and
keeps marks), then relight inside her person area, then the refined matte places her on the
industry's backdrop. Crops are rectangles only (nothing is resampled): a square and a 4:5
portrait, with her face at about FACE_SHARE of the crop height and her eye line at EYE_LINE
from the top. Needs her face points and her person area.
web/src/engines/studio/headshot.ts mirrors this file. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.skin.studio import render as skin_render

from .backdrops import render_backdrop
from .common import StudioResult, face_box, finish, half_up, person_mask, photo
from .matte import foreground, refine
from .relight import apply_light

FACE_SHARE = 0.42      # face height / crop height (ASSUMED: head-and-shoulders)
EYE_LINE = 0.40        # eye line from the crop top, share of crop height (ASSUMED)
EYE_IN_FACE = 0.45     # eye line within her face box, share of its height (ASSUMED)
CROPS = (("square", 1.0), ("portrait-4x5", 0.8))
LABEL = "Headshot studio: drawn backdrop, lighting simulation and a light even-tone retouch of your own photo."


@dataclass(frozen=True)
class Industry:
    id: str
    name: str
    backdrop: str
    light: float
    retouch: float
    side: str = "upper-left"


INDUSTRIES: dict[str, Industry] = {i.id: i for i in (
    Industry("finance-law", "Finance and law", "chinon", 35, 20),
    Industry("technology", "Technology", "blois", 30, 15),
    Industry("healthcare", "Healthcare", "dinan", 25, 15),
    Industry("academic", "Academic and public sector", "saumur", 30, 15),
    Industry("creative", "Creative work", "cahors", 45, 10, "upper-right"),
)}


def crops(box: tuple[float, float, float, float], width: int, height: int) -> tuple[tuple[str, int, int, int, int], ...]:
    x0, y0, x1, y1 = box
    face_h = y1 - y0
    eye_y = y0 + EYE_IN_FACE * face_h
    cx = (x0 + x1) / 2
    out = []
    for name, aspect in CROPS:
        ch = face_h / FACE_SHARE
        cw = ch * aspect
        scale = min(1.0, width / cw, height / ch)
        cw, ch = cw * scale, ch * scale
        left = min(max(0.0, cx - cw / 2), width - cw)
        top = min(max(0.0, eye_y - EYE_LINE * ch), height - ch)
        out.append((name, half_up(left), half_up(top), half_up(cw), half_up(ch)))
    return tuple(out)


def headshot(image: Any, coarse: Any, points: Any, industry: str = "technology") -> StudioResult:
    if industry not in INDUSTRIES:
        raise ValueError(f"industry must be one of {', '.join(INDUSTRIES)}")
    style = INDUSTRIES[industry]
    rgb, alpha_in = photo(image)
    h, w = rgb.shape[:2]
    person = person_mask(coarse, h, w)
    box = face_box(points)
    metrics: dict[str, float | int | str | bool] = {"tool": "headshot", "industry": industry, "backdrop": style.backdrop}
    retouched = skin_render("tone", image, points, strength=style.retouch, redness=50)
    if isinstance(retouched, Refusal):
        metrics.update(retouch="skipped", retouch_reason=retouched.code)
        base = rgb
    else:
        metrics["retouch"] = "even tone"
        base = retouched.image[..., :3].astype(np.float64)
    lit, raw = apply_light(base, person, box, style.side, style.light / 100)
    alpha, matte_metrics = refine(rgb, person)
    back = render_backdrop(style.backdrop, w, h)
    out = alpha[..., None] * foreground(lit, alpha) + (1 - alpha[..., None]) * back
    metrics.update(matte_metrics, gain_before_balance=raw)
    return StudioResult(finish(out, alpha_in), LABEL, metrics, crops(box, w, h))

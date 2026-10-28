"""One entry for the five skin tools: Freckles, Tan, Matte, Glow and Even tone.

`render` checks the photo and the 478-point mesh, builds the visible-skin mask from the
mesh, and runs one tool. A face the tools cannot edit safely comes back as a coded
`Refusal` (engines/core/refusal.py) instead of an exception: a degenerate mesh, too little
visible skin, or tan removal without the person turning lightening on. Wrong arguments
(unknown tool, strength outside 0..100) still raise ValueError. Alpha is copied untouched.
web/src/engines/skin/studio.ts mirrors this file.
Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from plumb_api.engines.core.refusal import Refusal, refusal_for

from .common import MIN_SKIN_PIXELS, SkinResult, check_strength, frame, rgb_of, skin_mask
from .finish import glow, matte
from .freckles import freckles
from .tan import LighteningNotChosen, tan
from .tone import even_tone

TOOLS = ("freckles", "tan", "matte", "glow", "tone")
NO_SKIN = "no_visible_skin"
NO_SKIN_MESSAGE = "Too little skin is visible in this photo for the skin tools; try a closer photo."


def render(tool: str, image: np.ndarray, points: Any, *, strength: float = 30.0,
           **params: Any) -> SkinResult | Refusal:
    if tool not in TOOLS:
        raise ValueError(f"tool must be one of {', '.join(TOOLS)}")
    rgb_of(image)
    check_strength(strength)
    module = f"skin.{tool}"
    h, w = image.shape[:2]
    early = refusal_for(module, points, h, w)
    if early is not None:
        return early
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    skin = skin_mask(pts, h, w)
    if int((skin >= 0.5).sum()) < MIN_SKIN_PIXELS:
        return Refusal(module, NO_SKIN, NO_SKIN_MESSAGE)
    face = frame(pts)
    try:
        if tool == "freckles":
            return freckles(image, skin, face, strength=strength, density=params.get("density", 50.0),
                            seed=params.get("seed", 7))
        if tool == "tan":
            return tan(image, skin, direction=params.get("direction", "add"), strength=strength,
                       undertone=params.get("undertone", "neutral"),
                       allow_lightening=params.get("allow_lightening", False))
        if tool == "matte":
            return matte(image, skin, face, strength=strength)
        if tool == "glow":
            return glow(image, skin, face, strength=strength, style=params.get("style", "cassis"))
        return even_tone(image, skin, face, strength=strength, redness=params.get("redness", 50.0))
    except LighteningNotChosen as exc:
        return Refusal(module, exc.code, str(exc))

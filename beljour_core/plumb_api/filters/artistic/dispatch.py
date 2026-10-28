"""Validated public entry point for four local original filters. Author: John Khan."""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from ...engines.core import regions
from . import crown, ink, oil, rain
from .types import ArtisticResult, EffectUnavailable, photo
from .types import landmarks as require_mesh

EFFECTS = {
    "ink-study": {"name": "Ink Study", "row": 18, "needs": ("hair_mask", "eye_mask"), "defaults": ink.DEFAULTS},
    "pigment-oil": {"name": "Pigment Oil", "row": 21, "needs": (), "defaults": oil.DEFAULTS},
    "rain-expression": {"name": "Rain Expression", "row": 16, "needs": ("landmarks",), "defaults": rain.DEFAULTS},
    "meadow-crown": {"name": "Meadow Crown", "row": 15, "needs": ("landmarks", "hair_mask"), "defaults": crown.DEFAULTS},
}


def render(effect_id: str, image: np.ndarray, *, landmarks: Any = None,
           hair_mask: Any = None, eye_mask: Any = None,
           params: Mapping[str, Any] | None = None) -> ArtisticResult:
    """Render without I/O. A supplied zero mask means the user confirmed absence.

    Cel protection can use the complete eyes region derived from a confirmed
    478-point mesh. It never guesses hair from skin colour or brightness.
    """
    src = photo(image)
    if not isinstance(effect_id, str) or effect_id not in EFFECTS:
        raise ValueError("unknown original artistic effect")
    if effect_id == "ink-study":
        eyes = eye_mask
        if eyes is None and landmarks is not None:
            points = require_mesh(landmarks, src.shape[:2])
            eyes = regions.region_mask("eyes", points, *src.shape[:2], normalized=False, supersample=2)
            # A degenerate eye contour must not silently remove the colour lock.
            if float(np.sum(eyes)) < 1:
                raise EffectUnavailable("eyes_not_visible", "confirm an eye protection mask before the cel simulation")
        return ink.ink_study(src, hair_mask, eyes, params)
    if effect_id == "pigment-oil":
        return oil.pigment_oil(src, params)
    if effect_id == "rain-expression":
        return rain.rain_expression(src, landmarks, params)
    return crown.meadow_crown(src, landmarks, hair_mask, params)

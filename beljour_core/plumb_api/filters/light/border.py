"""Original photo-border grade with continuous and tile-stable edges.

The border is measured in full-photo coordinates rather than crop coordinates.
An amount of zero is an identity; centre pixels never change. Positive tone
approaches clean white while negative tone approaches near black.
Created by John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..colour import ops as O
from ..colour import space as S
from ..frame import Frame

Floats = NDArray[np.float64]


def border_weight(params: Mapping[str, Any], frame: Frame, h: int, w: int) -> Floats:
    x, y = frame.grid(h, w)
    nearest = np.minimum(np.minimum(x, frame.width - x),
                         np.minimum(y, frame.height - y))
    distance = nearest / (float(params["width"]) * frame.short_side)
    return 1.0 - S.smoothstep(0.0, 1.0, distance)


def border(rgb: Floats, params: Mapping[str, Any], frame: Frame) -> Floats:
    amount = float(params["amount"])
    if amount <= 0:
        return rgb.copy()
    h, w = rgb.shape[:2]
    weight = np.clip(amount * border_weight(params, frame, h, w), 0.0, 1.0)
    tone = float(params["tone"])
    destination = (tone + 1.0) / 2.0
    linear = S.decode(rgb)
    return S.encode(linear * (1.0 - weight[..., None])
                    + destination * weight[..., None])


O.register(O.Op(
    "light.border", "light",
    {
        "amount": O.num(0, 0, 1, "border strength"),
        "width": O.fixed(0.07, 0.015, 0.25, "width as a share of short side"),
        "tone": O.fixed(-1, -1, 1, "white at +1, dark at -1"),
    },
    border,
    help="Photographic white or dark border, full-frame coordinates",
))

"""Position light for the FX1 looks: vignette, centre light and a top-to-bottom graded tint.

These change each pixel by where it sits in the whole photo (a Frame), not by its
neighbours, so they tile without a halo. Light is multiplied in linear light; the graded
tint pushes OKLab a, b. The face-aware centre light follows the face centre when landmarks
exist (`follow` = 1), else the photo point (cx, cy).

  light.vignette  factor = 1 - 0.6 * amount * smoothstep(inner, outer, d), with d the
                  distance from the centre over the half diagonal (0 centre, 1 corner)
  light.centre    factor = 1 + 0.5 * amount * g, with g = 1 - smoothstep(0, 1, r) and r the
                  distance to the centre over radius x short side; warmth tints the pool
  light.grade     OKLab a, b push of top colour (1 - t) + bottom colour t, t = y / height

FX2 owns the vignette and centre-light add-ons and widens this module (shapes, colours); it
does not start a second one. Mirror: web/src/filters/light/position.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..colour import ops as O
from ..colour import space as S
from ..frame import Frame

Floats = NDArray[np.float64]


def vignette_factor(params: Mapping[str, Any], frame: Frame, h: int, w: int) -> Floats:
    x, y = frame.grid(h, w)
    u = x / frame.width - 0.5
    v = y / frame.height - 0.5
    d = np.hypot(u, v) / math.hypot(0.5, 0.5)
    k = S.smoothstep(float(params["inner"]), float(params["outer"]), d)
    return np.maximum(0.0, 1 - 0.6 * float(params["amount"]) * k)


def vignette(rgb: Floats, params: Mapping[str, Any], frame: Frame) -> Floats:
    h, w = rgb.shape[:2]
    return S.encode(S.decode(rgb) * vignette_factor(params, frame, h, w)[..., None])


def centre_point(params: Mapping[str, Any], frame: Frame) -> tuple[float, float]:
    if float(params["follow"]) >= 0.5 and frame.face_centre is not None:
        return float(frame.face_centre[0]), float(frame.face_centre[1])
    return float(params["cx"]) * frame.width, float(params["cy"]) * frame.height


def centre_pool(params: Mapping[str, Any], frame: Frame, h: int, w: int) -> Floats:
    x, y = frame.grid(h, w)
    cx, cy = centre_point(params, frame)
    r = np.hypot(x - cx, y - cy) / (float(params["radius"]) * frame.short_side)
    return 1 - S.smoothstep(0.0, 1.0, r)


def centre(rgb: Floats, params: Mapping[str, Any], frame: Frame) -> Floats:
    h, w = rgb.shape[:2]
    g = centre_pool(params, frame, h, w)
    amount, warmth = float(params["amount"]), float(params["warmth"])
    factor = 1 + 0.5 * amount * g
    lin = S.decode(rgb)
    lin[..., 0] *= factor * (1 + 0.25 * warmth * g)
    lin[..., 1] *= factor
    lin[..., 2] *= factor * (1 - 0.25 * warmth * g)
    return S.encode(lin)


def grade(rgb: Floats, params: Mapping[str, Any], frame: Frame) -> Floats:
    h, w = rgb.shape[:2]
    _, y = frame.grid(h, w)
    t = y / frame.height
    lab = S.srgb_to_oklab(rgb)
    for hue_key, amount_key, weight in (("topHue", "topAmount", 1 - t), ("bottomHue", "bottomAmount", t)):
        rad = math.radians(float(params[hue_key]))
        push = float(params[amount_key]) * weight
        lab[..., 1] += push * math.cos(rad)
        lab[..., 2] += push * math.sin(rad)
    return S.oklab_to_srgb(lab)


O.register(O.Op("light.vignette", "light",
                {"amount": O.num(0, -1, 1, "darker edges +, lighter edges -"),
                 "inner": O.fixed(0.35, 0.0, 0.95), "outer": O.fixed(1.0, 0.3, 1.5)},
                vignette, help="Edge darkening by distance from the centre"))
O.register(O.Op("light.centre", "light",
                {"amount": O.num(0, 0, 1), "warmth": O.num(0, -1, 1),
                 "radius": O.fixed(0.45, 0.1, 1.5), "cx": O.fixed(0.5, 0, 1), "cy": O.fixed(0.45, 0, 1),
                 "follow": O.fixed(0, 0, 1, "1 = follow the face centre when known")},
                centre, help="A pool of light around the face or a point"))
O.register(O.Op("light.grade", "light",
                {"topHue": O.angle(), "topAmount": O.num(0, 0, 0.1),
                 "bottomHue": O.angle(), "bottomAmount": O.num(0, 0, 0.1)},
                grade, skin_hue=True, help="A tint graded from the top of the photo to the bottom"))

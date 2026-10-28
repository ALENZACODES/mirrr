"""W64/W65/W75/W76 eye-shape-specific liner placement.

Native lid canvases keep the real eye geometry, and every side receives its own
solution. No colour-dependent thickness or hidden eye-size adjustment is applied.
Author: John Khan.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from .contracts import EyeRequest
from .geometry import EyeFrame, interpolate, lid_bounds, native_placement, visible_canvas
from .raster import combine, filled, stroke

COLOURED = {"navy": (30, 46, 92), "burgundy": (109, 38, 60), "forest": (36, 82, 57)}
WING_STYLES = ("wing", "batwing", "tightline", "soft_wing")
GRAPHIC_STYLES = ("floating", "double_wing", "smoked_pencil", "gel", "shadow")


def wing_geometry(frame: EyeFrame, anatomy: str, length: float, thickness: float) -> dict[str, Any]:
    span = length * (.67 if frame.downturned else 1)
    rise = span * (.75 if anatomy in ("hooded", "deep_set") else .55)
    upper = interpolate(frame.upper, .86)
    start = frame.point(.86, upper + thickness)
    outer = frame.point(1.0, .008)
    tip = frame.point(1 + span, rise)
    if anatomy == "hooded":
        # A stepped connector is the batwing. The gap is an explicit fold estimate,
        # not a claim that a still-photo mesh observes the invisible crease.
        fold = min(frame.brow_space * .42, .12)
        polygon = [outer, tip, frame.point(.96 + span * .20, rise * .72),
                   frame.point(.96 + span * .20, fold), frame.point(.90, fold), start]
    elif anatomy == "monolid":
        polygon = [outer, tip, frame.point(.91, max(.03, upper + thickness * 1.5)), start]
    elif anatomy == "deep_set":
        polygon = [outer, tip, frame.point(.98, min(frame.brow_space * .30, rise * .6)), start]
    else:
        polygon = [outer, tip, start]
    return {"polygon": [list(p) for p in polygon], "tip": list(tip), "tail_length_eye_width": span,
            "fold_estimate": anatomy == "hooded", "asymmetry_preserved": True}


def liner_mask(height: int, width: int, frame: EyeFrame, request: EyeRequest) -> tuple[np.ndarray, dict[str, Any]]:
    anatomy = request.anatomy[frame.side]
    style = request.style or "wing"
    if request.feature == "W75":
        style = "batwing" if anatomy == "hooded" else "soft_wing"
    elif request.feature == "W76":
        style = "wing"
    if style not in WING_STYLES:
        raise ValueError("unsupported wing technique")
    report = native_placement(frame, anatomy)
    if not frame.visible:
        return np.zeros((height, width), dtype=np.float64), report
    thickness = request.thickness * (.60 if anatomy == "hooded" else 1)
    points = []
    for i in range(33):
        u = .04 + .92 * i / 32
        v = interpolate(frame.upper, u)
        points.append(frame.point(u, v + thickness * (.45 if style == "tightline" else 1.1)))
    softness = .8 + request.blend * (2 if style == "soft_wing" else .4)
    mask = stroke(height, width, points, max(.3, thickness * frame.width), softness=softness)
    if style != "tightline":
        wing = wing_geometry(frame, "hooded" if style == "batwing" else anatomy, request.length, thickness)
        mask = combine(mask, filled(height, width, wing["polygon"]))
        report["wing"] = wing
    report["thickness_eye_width"] = thickness
    report["style"] = style
    return mask, report


def graphic_mask(height: int, width: int, frame: EyeFrame, request: EyeRequest) -> tuple[np.ndarray, dict[str, Any]]:
    anatomy = request.anatomy[frame.side]
    style = request.style or "floating"
    if style not in GRAPHIC_STYLES:
        raise ValueError("unsupported graphic liner technique")
    report = native_placement(frame, anatomy)
    report["style"] = style
    if not frame.visible:
        return np.zeros((height, width), dtype=np.float64), report
    canvas = filled(height, width, visible_canvas(frame, anatomy))
    if style in ("floating", "double_wing"):
        path = []
        for i in range(29):
            u = .10 + .78 * i / 28
            low, high = lid_bounds(frame, anatomy, u)
            path.append(frame.point(u, low + .68 * (high - low)))
        mask = stroke(height, width, path, max(.3, request.thickness * frame.width), softness=.75)
        if style == "double_wing":
            secondary = [frame.point(.60 + .31 * i / 15, lid_bounds(frame, anatomy, .60 + .31 * i / 15)[0] + .025) for i in range(16)]
            mask = combine(mask, stroke(height, width, secondary, max(.25, request.thickness * frame.width * .65)))
    else:
        path = [frame.point(.05 + .9 * i / 24, interpolate(frame.upper, .05 + .9 * i / 24) + .012) for i in range(25)]
        softness = {"smoked_pencil": 1.8 + 4 * request.blend, "gel": .75, "shadow": 2.2 + 5 * request.blend}[style]
        mask = stroke(height, width, path, max(.4, request.thickness * frame.width), softness=softness)
    mask *= (canvas > 0).astype(np.float64)
    # A contrast disclosure never changes the computed line width.
    report["contrast_note"] = "On deep lids black may have low contrast. Bronze or brown is another option; the line has not been thickened."
    report["mobile_lid_only"] = True
    return mask, report


def colour_recommendations(iris_rgb: tuple[int, int, int]) -> list[dict[str, Any]]:
    """Relative display contrast for all original colours, with brown eyes first-class.

    This is a colour-wheel preview aid. It does not infer identity, promise cosmetic
    suitability, or change the eye colour supplied by the user.
    """
    r, g, b = iris_rgb
    brown = r >= b and r >= g * .9
    options = []
    for name, colour in COLOURED.items():
        distance = math.sqrt(sum((a - c) ** 2 for a, c in zip(iris_rgb, colour, strict=True)))
        options.append({"name": name, "colour": list(colour), "display_distance": distance,
                        "why": ("A visible colour alternative for brown eyes." if brown else "Compare against your unchanged iris colour.")})
    return options

"""W66/W67 eyeshadow pigments and light-shift simulation.

The shading model is a transparent display pigment approximation, not measured
product optics. Opaque base choices can remain visible on deep lids. No glitter is
invented; foil and duochrome use smooth angle-dependent colour only. Author: John Khan.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from .contracts import EyeRequest
from .geometry import EyeFrame, lid_bounds, native_placement
from .raster import smoothstep

TECHNIQUES = ("cut_crease", "halo", "smokey")
FINISHES = ("foil", "duochrome")


def pigment_payoff(skin_depth: float, colour: tuple[int, int, int], transparency: float) -> dict[str, Any]:
    brightness = (.2126 * colour[0] + .7152 * colour[1] + .0722 * colour[2]) / 255
    pastel = brightness > .65
    base = (1 - transparency) * (1 + (.35 * skin_depth if pastel else .10 * skin_depth))
    opacity = min(.95, max(.05, base))
    warnings = []
    if pastel and skin_depth > .6 and transparency > .65:
        warnings.append("This sheer pastel may not show on a deep lid. Try a more opaque base; product payoff is unverified.")
    return {"opacity": opacity, "pastel": pastel, "warnings": warnings,
            "assumption": "Display pigment approximation; not a measured product-opacity value."}


def flip_colour(primary: tuple[int, int, int], secondary: tuple[int, int, int], angle: float,
                finish: str, u: float = .5) -> tuple[float, float, float]:
    if finish not in FINISHES:
        raise ValueError("shadow finish must be foil or duochrome")
    phase = math.sin(math.radians(angle) + (u - .5) * .25)
    flip = .5 + .5 * phase if finish == "duochrome" else .16 + .22 * max(0, phase)
    light = 1 + .10 * max(0, math.cos(math.radians(angle))) if finish == "foil" else 1
    return tuple(min(255.0, max(0.0, ((1 - flip) * a + flip * b) * light)) for a, b in zip(primary, secondary, strict=True))  # type: ignore[return-value]


def shadow_fields(image: np.ndarray, frame: EyeFrame, request: EyeRequest) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
    height, width = image.shape[:2]
    anatomy = request.anatomy[frame.side]
    technique = request.style or ("duochrome" if request.feature == "W67" else "halo")
    if request.feature == "W67":
        if technique not in FINISHES:
            raise ValueError("unsupported light-shift finish")
    elif technique not in TECHNIQUES:
        raise ValueError("unsupported shadow technique")
    report = native_placement(frame, anatomy)
    report["style"] = technique
    mask = np.zeros((height, width), dtype=np.float64)
    pigment = np.zeros((height, width, 3), dtype=np.float64)
    if not frame.visible:
        return mask, pigment, report
    # Bound loops to a local eye canvas. Coordinates stay in the independently
    # measured eye frame, so rolling/scaling a photo does not alter placement.
    corners = [frame.point(u, v) for u in (-.1, 1.1) for v in (-.05, frame.brow_space)]
    xs, ys = [p[0] for p in corners], [p[1] for p in corners]
    x0, x1 = max(0, math.floor(min(xs))), min(width, math.ceil(max(xs)))
    y0, y1 = max(0, math.floor(min(ys))), min(height, math.ceil(max(ys)))
    depths = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            u, v = frame.local(x + .5, y + .5)
            if not .03 <= u <= .97:
                continue
            low, high = lid_bounds(frame, anatomy, u)
            if not low <= v <= high or high - low < 1e-8:
                continue
            s = (v - low) / (high - low)
            edge = float(smoothstep(.03, .13, u) * (1 - smoothstep(.87, .97, u)))
            edge *= float(smoothstep(0, .08, s) * (1 - smoothstep(.82, 1, s)))
            if technique == "cut_crease":
                weight = .90 if s < .72 else .22
            elif technique == "halo":
                weight = .35 + .6 * abs(2 * u - 1)
            elif technique == "smokey":
                weight = .25 + .7 * (1 - s) ** (.65 + request.blend)
            else:
                weight = .85
            srgb = image[y, x, :3]
            depth = request.skin_depth if request.skin_depth is not None else 1 - float(np.dot(srgb, (.2126, .7152, .0722))) / 255
            depths.append(depth)
            payoff = pigment_payoff(depth, request.colour, request.transparency)
            mask[y, x] = edge * weight * payoff["opacity"]
            colour: tuple[float, ...] = flip_colour(request.colour, request.secondary_colour, request.angle, technique, u) if request.feature == "W67" else request.colour
            # A halo centre is the same chosen pigment with a restrained lightness
            # lift, not a skin-tone normalisation or eye whitening operation.
            if technique == "halo" and .36 < u < .64:
                colour = tuple(min(255, c + 24) for c in colour)
            pigment[y, x] = colour
    depth_summary = float(np.mean(depths)) if depths else 0
    report["payoff"] = pigment_payoff(depth_summary, request.colour, request.transparency)
    report["angle_degrees"] = request.angle
    report["base_transparency"] = request.transparency
    report["glitter_particles"] = 0
    report["motion_parameter"] = "angle" if request.feature == "W67" else None
    return mask, pigment, report

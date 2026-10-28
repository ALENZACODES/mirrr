"""Rain Expression: bounded expression warp and procedural tear streaks.

Inner brow rise, asymmetric lip-corner drop and a phase-controlled lower-lip
tremble are compact displacements, limited to the existing face oval. A measured
Jacobian cap prevents this new warp from folding. Water is an original specular
drawing, not a claim of photorealistic emotion synthesis. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from ...engines.core import regions
from .geometry import bound_field, face_frame, jacobian, path_distance, quadratic
from .types import (
    ArtisticResult,
    EffectUnavailable,
    Plane,
    bilinear,
    blend,
    grid,
    landmarks,
    number,
    parameters,
    photo,
    result,
    smooth01,
)

DEFAULTS = {"amount": 0.65, "expression": 0.65, "tears": 0.7,
            "asymmetry": 0.25, "phase": 0.0, "tear_length": 0.45, "adult_confirmed": False}
LABEL = "Rain Expression simulation. Expression and tears are drawn locally."


def expression_field(points: Plane, shape: tuple[int, int], *, amount: float,
                     expression: float, asymmetry: float, phase: float) -> tuple[Plane, Plane, dict[str, float]]:
    frame = face_frame(points)
    x, y = grid(shape)
    dx, dy = np.zeros(shape), np.zeros(shape)
    a, b = 1 + asymmetry * 0.35, 1 - asymmetry * 0.35
    controls = (
        (55, -frame.down * frame.iod * 0.045 * a, 0.34),
        (285, -frame.down * frame.iod * 0.045 * b, 0.34),
        (61, frame.down * frame.iod * 0.04 * a, 0.42),
        (291, frame.down * frame.iod * 0.04 * b, 0.42),
        (17, frame.across * frame.iod * 0.009 * np.sin(phase * 2 * np.pi), 0.28),
    )
    for index, vector, radius_share in controls:
        radius = frame.iod * radius_share
        q = ((x - points[index, 0]) ** 2 + (y - points[index, 1]) ** 2) / (radius * radius)
        weight = np.maximum(0, 1 - q) ** 3 * amount * expression
        dx += vector[0] * weight
        dy += vector[1] * weight
    oval = regions.region_mask("face_oval", points, *shape, normalized=False, supersample=2)
    dx *= oval
    dy *= oval
    dx, dy, cap = bound_field(dx, dy, frame.iod * 0.07)
    return dx, dy, {"min_jacobian": float(np.min(jacobian(dx, dy))),
                   "maximum_displacement": float(np.max(np.hypot(dx, dy), initial=0)),
                   "displacement_iod": float(np.max(np.hypot(dx, dy), initial=0)) / frame.iod,
                   "field_scale": cap}


def tear_layers(points: Plane, shape: tuple[int, int], *, amount: float, tears: float,
                length: float, asymmetry: float, phase: float) -> tuple[Plane, Plane, Plane]:
    frame = face_frame(points)
    x, y = grid(shape)
    water, highlight, rim = np.zeros(shape), np.zeros(shape), np.zeros(shape)
    for side, index in enumerate((145, 374)):
        sign = -1 if side == 0 else 1
        visible_length = length * (1 + sign * asymmetry * 0.18)
        start = points[index] + frame.down * frame.iod * 0.025
        end = start + frame.down * frame.iod * visible_length
        end += frame.across * frame.iod * sign * 0.04
        control = (start + end) * 0.5 + frame.across * frame.iod * (sign * 0.028 + 0.008 * np.sin(phase * 2 * np.pi))
        path = quadratic(start, control, end)
        maximum_width = max(0.8, frame.iod * 0.016)
        distance, t = path_distance(x, y, path, max_distance=maximum_width + 0.7)
        width = max(0.8, frame.iod * 0.016) * (0.65 + 0.35 * np.sin(t * np.pi))
        taper = smooth01(t / 0.035) * smooth01((1 - t) / 0.07)
        alpha = smooth01((width + 0.7 - distance) / 1.0) * taper * tears * amount
        # Reflection is bounded and uses a narrower displaced path, retaining skin texture.
        glint_path = path - frame.across * max(0.4, frame.iod * 0.007)
        bright_distance, _ = path_distance(x, y, glint_path,
                                           max_distance=maximum_width + 0.7 + max(0.4, frame.iod * 0.007))
        bright = np.exp(-((bright_distance / np.maximum(0.55, width * 0.34)) ** 2)) * alpha
        dark = np.clip(distance / np.maximum(width, 0.1), 0, 1) ** 2 * alpha
        water = 1 - (1 - water) * (1 - alpha)
        highlight = np.maximum(highlight, bright)
        rim = np.maximum(rim, dark)
    face = regions.region_mask("face_oval", points, *shape, normalized=False, supersample=2)
    eyes = regions.region_mask("eyes", points, *shape, normalized=False, supersample=2)
    allowed = face * (eyes <= 0)
    return water * allowed, highlight * allowed, rim * allowed


def rain_expression(image: np.ndarray, mesh: Any, params: Mapping[str, Any] | None = None) -> ArtisticResult:
    src = photo(image)
    p = parameters(params, DEFAULTS)
    if not isinstance(p["adult_confirmed"], bool):
        raise ValueError("adult_confirmed must be an explicit boolean")
    if p["adult_confirmed"] is not True:
        raise EffectUnavailable("adult_confirmation_required", "Confirm you are 18 or older before an expression simulation.")
    amount = number(p["amount"], "amount", 0, 1)
    expression = number(p["expression"], "expression", 0, 1)
    tears = number(p["tears"], "tears", 0, 1)
    asymmetry = number(p["asymmetry"], "asymmetry", -1, 1)
    phase = number(p["phase"], "phase", 0, 1)
    length = number(p["tear_length"], "tear_length", 0.15, 0.75)
    points = landmarks(mesh, src.shape[:2])
    dx, dy, checks = expression_field(points, src.shape[:2], amount=amount,
                                      expression=expression, asymmetry=asymmetry, phase=phase)
    x, y = grid(src.shape[:2])
    warped = bilinear(src, x - 0.5 - dx, y - 0.5 - dy)
    water, light, rim = tear_layers(points, src.shape[:2], amount=amount, tears=tears,
                                   length=length, asymmetry=asymmetry, phase=phase)
    painted = warped * (1 - 0.16 * rim[..., None])
    painted += (255 - painted) * (0.62 * light[..., None] + 0.06 * water[..., None])
    # The footprint is measured from this field, not an oversized rectangle.
    support = ((np.hypot(dx, dy) > 0) | (water > 0)).astype(np.float64)
    out = blend(src, painted, support)
    return result("rain-expression", src, out, support, LABEL,
                  {**checks, "tear_pixels": float(np.count_nonzero(water > 0.02)),
                   "tear_alpha_max": float(np.max(water, initial=0))},
                  ("Procedural expression; it does not infer how you feel.",),
                  {"displacement_x": dx, "displacement_y": dy, "tear_alpha": water})

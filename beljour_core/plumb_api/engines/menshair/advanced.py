"""Original spatial tonal fields for extended local hairstyle references.

This is *not* a hair generator. The caller supplies independently cleared masks;
no strand, silhouette or hairline is created outside that input support. Each
family defines a distinct bounded field so concept cards are more than labels.
Only positive finite normalized geometry is accepted by the renderer upstream.
The formulas are mirrored in web/src/engines/menshair/advanced.ts.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np

EXTENDED_FAMILIES = frozenset({
    "quiff", "pompadour", "mohawk", "mullet", "curtain", "slick", "afro", "coils",
    "bob", "lob", "pixie", "shag", "layers", "fringe", "waves", "curls", "braid",
    "ponytail", "bun", "updo", "locs", "shoulder",
    # R18 short-sided concept families with distinct mask-limited tonal maps.
    "ivy", "twists", "curly-fade", "high-top", "caesar", "fauxhawk", "flattop",
})
PATTERNS = frozenset({"plain", "soft", "wave", "curl", "grain", "braid", "strand"})
PRESENTATIONS = frozenset({"masculine", "feminine", "unisex"})


def smooth(lo: float, hi: float, value: np.ndarray) -> np.ndarray:
    """Cubic interpolation with exact zero/one end points."""
    t = np.clip((value - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _pattern(width: int, height: int, flow: int, pattern: str) -> np.ndarray:
    if pattern == "plain":
        return np.ones((height, width), dtype=np.float64)
    yy, xx = np.mgrid[0:height, 0:width]
    if pattern in ("soft", "wave"):
        ridge = (xx * 11 + yy * 3 + (flow + 100) * 7) % 47
        triangle = 1.0 - np.abs(ridge - 23) / 23.0
        return (0.85 + 0.15 * triangle) if pattern == "soft" else (0.68 + 0.32 * triangle)
    if pattern == "curl":
        curly = (xx * 13 + yy * 17 + ((xx * yy) % 19) * 3 + flow + 100) % 101
        return 0.53 + 0.47 * curly / 100.0
    if pattern == "grain":
        grain = (xx * 19 + yy * 23 + ((xx * yy) % 29) * 5) % 127
        return 0.70 + 0.30 * grain / 126.0
    if pattern == "braid":
        braid = (xx * 5 + yy * 13 + (flow + 100) * 3) % 37
        return 0.60 + 0.40 * (1.0 - np.abs(braid - 18) / 18.0)
    strand = (xx * 7 + yy * 2 + flow + 100) % 23
    return 0.54 + 0.46 * (1.0 - np.abs(strand - 11) / 11.0)


def spatial_field(u: np.ndarray, v: np.ndarray, width: int, height: int, *, family: str,
                  pattern: str, top_bias: int, side_bias: int, fringe: int,
                  flow: int, length: int, definition: int) -> np.ndarray:
    """Return a bounded, mask-independent compositing response (0..1).

    The coefficients make qualitative *tonal* differences (e.g. where a cut is
    emphasized); they never represent growth, hair length in mm or actual cut
    predictions. Geometry is normalized to the caller's landmarks.
    """
    side = smooth(0.26, 0.94, np.abs(u))
    middle = 1.0 - smooth(0.12, 0.95, np.abs(u))
    top = 1.0 - smooth(0.05, 0.63, v)
    crown = 1.0 - smooth(0.01, 0.37, np.sqrt(u * u * 0.50 + (v - 0.13) ** 2))
    lower = smooth(0.43, 1.05, v)
    nape = smooth(0.64, 1.19, v)
    edge = smooth(0.48, 0.98, np.abs(u))
    sweep = np.clip(0.50 + (flow / 100.0) * u * 0.45, 0.0, 1.0)
    length_fraction = length / 100.0
    top_fraction = top_bias / 100.0
    side_fraction = side_bias / 100.0
    fringe_fraction = fringe / 100.0
    response = np.zeros_like(u)

    if family == "quiff":
        response = top * (0.14 + 0.48 * middle + 0.16 * sweep) + 0.30 * side * lower
    elif family == "pompadour":
        response = 0.64 * crown + 0.28 * middle * top + 0.34 * side * lower
    elif family == "mohawk":
        response = 0.77 * side * smooth(0.15, 0.49, v) + 0.18 * middle * top
    elif family == "mullet":
        response = 0.42 * side * lower + 0.48 * middle * nape + 0.13 * top
    elif family == "curtain":
        response = 0.35 * top + 0.34 * (1.0 - middle) * top + 0.22 * lower * side
    elif family == "slick":
        response = 0.26 * top + 0.40 * side * lower + 0.18 * sweep
    elif family == "afro":
        response = 0.46 * crown + 0.34 * side * (1.0 - smooth(0.49, 1.0, v))
    elif family == "coils":
        response = 0.32 * crown + 0.26 * side * top + 0.16 * middle * lower
    elif family == "bob":
        response = 0.21 * top + 0.58 * side * lower * (1.0 - smooth(0.85, 1.28, v))
    elif family == "lob":
        response = 0.18 * top + 0.55 * side * lower + 0.18 * edge * nape
    elif family == "pixie":
        response = 0.55 * side * smooth(0.15, 0.58, v) + 0.25 * crown
    elif family == "shag":
        response = 0.23 * crown + 0.26 * side * lower + 0.26 * middle * nape
    elif family == "layers":
        response = 0.16 * top + 0.33 * side * lower + 0.33 * nape * middle
    elif family == "fringe":
        response = 0.61 * middle * top + 0.25 * side * lower
    elif family == "waves":
        response = 0.17 * top + 0.40 * side * lower + 0.21 * middle * crown
    elif family == "curls":
        response = 0.26 * crown + 0.40 * side * lower + 0.16 * middle * top
    elif family == "braid":
        response = 0.24 * side * lower + 0.54 * middle * nape + 0.12 * crown
    elif family == "ponytail":
        response = 0.35 * crown + 0.56 * middle * nape + 0.16 * lower * edge
    elif family == "bun":
        response = 0.67 * crown + 0.23 * side * top
    elif family == "updo":
        response = 0.48 * crown + 0.20 * middle * top + 0.18 * side * lower
    elif family == "locs":
        response = 0.20 * top + 0.33 * side * lower + 0.25 * middle * nape
    elif family == "shoulder":
        response = 0.15 * top + 0.43 * side * lower + 0.28 * edge * nape
    elif family == "ivy":
        response = 0.18 * top + 0.42 * side * lower + 0.27 * crown * sweep
    elif family == "twists":
        response = 0.41 * crown + 0.24 * middle * top + 0.27 * side * lower
    elif family == "curly-fade":
        response = 0.53 * crown + 0.21 * top * middle + 0.34 * side * lower
    elif family == "high-top":
        plateau = 1.0 - smooth(0.38, 0.68, np.abs(u))
        response = 0.48 * top * plateau + 0.52 * side * lower
    elif family == "caesar":
        response = 0.37 * middle * top + 0.19 * top + 0.39 * side * lower
    elif family == "fauxhawk":
        ridge = 1.0 - smooth(0.16, 0.61, np.abs(u))
        response = 0.51 * ridge * top + 0.35 * side * lower
    elif family == "flattop":
        rim = 1.0 - smooth(0.24, 0.86, np.abs(u))
        response = 0.56 * top * rim + 0.29 * side * lower
    else:
        response = 0.19 * side * lower + 0.12 * top * middle

    response += 0.26 * top_fraction * crown
    response += 0.24 * side_fraction * side * lower
    response += 0.23 * fringe_fraction * middle * top
    response += 0.18 * length_fraction * nape * (0.6 * side + 0.4 * middle)
    # Sharper definition places more weight on outer hair edges while keeping
    # overall bounds and mask support unchanged.
    response *= 0.78 + 0.22 * definition / 100.0
    modulation = _pattern(width, height, flow, pattern)
    return np.clip(response * modulation, 0.0, 1.0)


def family_ratio(family: str) -> float:
    """Fixed original colour mixing coefficient for extended families."""
    if family in {"pixie", "mohawk", "quiff", "pompadour"}:
        return 0.67
    if family in {"braid", "locs", "ponytail", "bun", "updo"}:
        return 0.52
    if family in {"curls", "waves", "afro", "coils", "twists", "curly-fade"}:
        return 0.57
    if family in {"bob", "lob", "shoulder", "layers"}:
        return 0.55
    return 0.62

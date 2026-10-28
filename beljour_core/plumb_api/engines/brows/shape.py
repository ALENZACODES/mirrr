"""W73 independently editable geometry guides; no automatic thinning or lifting.

The photo and facial geometry stay intact. Guides let the user compare a proposed
arch and outline before choosing tint or PMU. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from .contracts import BrowResult, byte, finish, number, options
from .geometry import BrowFrame, curve_points, draw_path, frame_summary


def design_shape(frames: tuple[BrowFrame, BrowFrame], settings: dict[str, Any] | None = None) -> dict[str, Any]:
    opts = options(settings, {"amount", "arch", "peak", "tail", "thickness", "leftArch", "rightArch"})
    arch = number(opts.get("arch", 0.06), "arch", -0.05, 0.15)
    peak = number(opts.get("peak", 0.62), "peak", 0.35, 0.8)
    tail = number(opts.get("tail", 0), "tail", -0.05, 0.2)
    thickness = number(opts.get("thickness", 1), "thickness", 1, 1.6)
    result: dict[str, Any] = {"thickness_scale": thickness, "automatic_thinning": False,
                              "geometry_preserved": True, "brows": [],
                              "warning": "Guide only. Individual asymmetry stays visible; an arch guide makes no lifting promise."}
    for frame in frames:
        local_arch = number(opts.get(f"{frame.side}Arch", arch), f"{frame.side}Arch", -0.05, 0.15)
        points = curve_points(frame, arch=local_arch, peak=peak, tail=tail)
        half = frame.height * thickness / 2
        upper = [(x + frame.up[0] * half, y + frame.up[1] * half) for x, y in points]
        lower = [(x - frame.up[0] * half, y - frame.up[1] * half) for x, y in points]
        result["brows"].append({**frame_summary(frame), "arch": local_arch, "peak": peak,
                                "tail_scale": 1 + tail, "centreline": points,
                                "upper": upper, "lower": lower,
                                "proposed_thickness_px": frame.height * thickness})
    return result


def render_shape(image: np.ndarray, frames: tuple[BrowFrame, BrowFrame],
                 settings: dict[str, Any] | None = None) -> BrowResult:
    opts = options(settings, {"amount", "arch", "peak", "tail", "thickness", "leftArch", "rightArch"})
    amount = number(opts.get("amount", 0.5), "amount", 0, 1)
    design = design_shape(frames, opts)
    alpha = np.zeros(image.shape[:2], dtype=np.float64)
    for brow in design["brows"]:
        for name in ("upper", "lower"):
            draw_path(alpha, brow[name], 0.7, amount * 0.7)
    output = image.copy()
    for y, x in zip(*np.nonzero(alpha > 0), strict=True):
        for c, target in enumerate((0, 145, 145)):
            output[y, x, c] = byte(image[y, x, c] * (1 - alpha[y, x]) + target * alpha[y, x])
    metrics = {"automatic_thinning": False, "geometry_preserved": True,
               "left_width_px": frames[1].width, "right_width_px": frames[0].width,
               "thickness_scale": design["thickness_scale"], "guide_only": True}
    return finish(image, output, alpha, metrics, warnings=(design["warning"],), details=design)

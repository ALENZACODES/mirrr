"""E06 warp as a contract-13 local engine.

Params (all JSON):
  method     "tps" | "mls-affine" | "mls-similarity" | "mls-rigid" | "piecewise"
  from, to   flat [x0, y0, x1, y1, ...] control points in pixels (same length)
  strength   0..1 share of the move (default 1)
  band       optional mask name: the warp fades to zero at its edge over `ramp` px
  ramp       falloff width in px (default 12), curve: a falloff.CURVES name
  step       grid step for smooth warps (default 4), alpha: MLS weight power (default 1)
  guard      true (default): lower the strength until Q3 passes, and report it

The edit mask is every pixel whose backward map moved, so contract 13's "no edits
outside editMask" rule holds by construction. Metrics: min_det, max_move, strength_used.
Mirrored in `web/src/engines/warp/engine.ts`.
Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.engine import EngineResult
from . import falloff, fold
from . import field as fields
from .mls import mls_field
from .piecewise import piecewise_affine
from .tps import border_pins, tps_field
from .triangulate import delaunay

METHODS = ("tps", "mls-affine", "mls-similarity", "mls-rigid", "piecewise")
VERSION = "warp-1.0.0"


def pairs(value: Any, name: str) -> NDArray[np.float64]:
    arr = np.asarray(value, dtype=np.float64).ravel()
    if arr.size == 0 or arr.size % 2 or not np.all(np.isfinite(arr)):
        raise ValueError(f"{name} must be a non-empty flat list of x, y pairs")
    return arr.reshape(-1, 2)


def build_field(height: int, width: int, method: str, src: NDArray[np.float64], dst: NDArray[np.float64], *,
                step: int = 4, alpha: float = 1.0) -> fields.Field:
    """The full-strength backward field for one method (border held still)."""
    if method == "tps":
        return tps_field(height, width, src, dst, step=step)
    if method.startswith("mls-"):
        return mls_field(height, width, src, dst, mode=method[4:], alpha=alpha, step=step, pin_border=True)
    if method == "piecewise":
        pins = border_pins(width, height)
        all_src = np.vstack([src, pins])
        all_dst = np.vstack([dst, pins])
        return piecewise_affine(height, width, all_src, all_dst, delaunay(all_src)).field
    raise ValueError(f"method must be one of {', '.join(METHODS)}")


class WarpEngine:
    version = VERSION

    def run(self, image: NDArray[np.uint8], landmarks: Any, masks: dict[str, NDArray[np.float32]],
            params: dict[str, Any], seed: int) -> EngineResult:
        h, w = image.shape[:2]
        method = str(params.get("method", "tps"))
        if method not in METHODS:
            raise ValueError(f"method must be one of {', '.join(METHODS)}")
        src = pairs(params.get("from"), "from")
        dst = pairs(params.get("to"), "to")
        if src.shape != dst.shape:
            raise ValueError("from and to need the same number of points")
        strength = float(params.get("strength", 1.0))
        if not 0 <= strength <= 1:
            raise ValueError("strength must be in [0, 1]")
        step = int(params.get("step", 4))
        alpha = float(params.get("alpha", 1.0))
        full = build_field(h, w, method, src, dst, step=step, alpha=alpha)
        band_name = params.get("band")
        weights = None
        if band_name is not None:
            if band_name not in masks:
                raise ValueError(f"mask {band_name!r} was not given")
            weights = falloff.band_weights(masks[band_name], float(params.get("ramp", 12.0)),
                                           str(params.get("curve", "smootherstep")))

        def build(s: float) -> fields.Field:
            scaled = fields.scale(full, s)
            return fields.weighted(scaled, weights) if weights is not None else scaled

        if params.get("guard", True):
            safe = fold.safe_strength(build, requested=strength)
            used, warp, report = safe.strength, safe.field, safe.report
        else:
            used = strength
            warp = build(strength)
            report = fold.fold_report(warp)
        out = fields.apply(image, warp)
        moved = warp.move() > 0
        stats = fields.move_stats(warp)
        return EngineResult(out, moved.astype(np.float32),
                            {"min_det": report.min_det, "max_move": stats.max_move, "strength_used": used},
                            "local", VERSION)

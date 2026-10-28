"""E07 fill wrapper: one call for every fill method, on 8-bit photos, plus its engine.

  fill(image, mask, method="biharmonic" | "fast-marching" | "patchmatch", grow=0, ...)

* The hole is mask >= 0.5, optionally grown by `grow` px (to take an object's soft halo).
* "fast-marching" and "biharmonic" work in linear light on RGB floats and encode back to
  sRGB bytes; "patchmatch" copies whole bytes. Only hole pixels change, and alpha is kept.
* The biharmonic route is the smooth default for blemishes and thin strips (posture's
  uncovered band, face turning's disocclusion strip); PatchMatch suits textured
  backgrounds; fast marching is the quick one.

`FillEngine` exposes this through contract 13: the hole comes from the mask named by
`params["mask"]` (default "hole"), and the edit mask is the (grown) hole.
Mirrored in `web/src/engines/fill/fill.ts`.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.composite import decode, encode
from ..core.distance import dilate
from ..core.engine import EngineResult
from ..core.masks import as_mask
from .biharmonic import biharmonic
from .fmm import fast_marching
from .patchmatch import patchmatch

METHODS = ("biharmonic", "fast-marching", "patchmatch")
VERSION = "fill-1.0.0"
MAX_GROW = 64


@dataclass(frozen=True)
class FillOutcome:
    image: NDArray[np.uint8]
    hole: NDArray[np.float32]
    method: str
    hole_pixels: int
    details: dict[str, float] = field(default_factory=dict)


def grown_hole(mask: np.ndarray, shape: tuple[int, int], grow: float) -> NDArray[np.float32]:
    if not (np.isfinite(grow) and 0 <= grow <= MAX_GROW):
        raise ValueError(f"grow must be 0..{MAX_GROW} px")
    hole = (as_mask(mask, shape) >= 0.5).astype(np.float32)
    if grow > 0 and hole.any():
        hole = dilate(hole, grow)
    return hole


def fill(image: np.ndarray, mask: np.ndarray, method: str = "biharmonic", *, grow: float = 0.0,
         radius: int = 5, gradient: bool = True, patch_radius: int = 3, iterations: int = 5,
         seed: int = 1) -> FillOutcome:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("fill needs an RGB or RGBA uint8 image")
    if method not in METHODS:
        raise ValueError(f"method must be one of {', '.join(METHODS)}")
    h, w = img.shape[:2]
    hole = grown_hole(mask, (h, w), grow)
    count = int(hole.sum())
    if count == 0:
        return FillOutcome(img.copy(), hole, method, 0)
    if method == "patchmatch":
        pm = patchmatch(img, hole, patch_radius=patch_radius, iterations=iterations, seed=seed)
        details = {"mean_distance": pm.mean_distance[-1] if pm.mean_distance else 0.0,
                   "targets": float(len(pm.targets))}
        return FillOutcome(pm.image, hole, method, count, details)
    linear = decode(img)
    if method == "fast-marching":
        filled = fast_marching(linear, hole, radius=radius, gradient=gradient).image
        details = {"radius": float(radius)}
    else:
        bh = biharmonic(linear, hole)
        filled = bh.image
        details = {"iterations": float(max(bh.iterations)), "residual": max(bh.residual)}
    rgb = encode(filled)
    out = img.copy()
    inside = hole > 0
    out[inside, :3] = rgb[inside]
    return FillOutcome(out, hole, method, count, details)


class FillEngine:
    version = VERSION

    def run(self, image: NDArray[np.uint8], landmarks: Any, masks: dict[str, NDArray[np.float32]],
            params: dict[str, Any], seed: int) -> EngineResult:
        name = str(params.get("mask", "hole"))
        if name not in masks:
            raise ValueError(f"mask {name!r} was not given")
        outcome = fill(image, masks[name], str(params.get("method", "biharmonic")),
                       grow=float(params.get("grow", 0.0)), radius=int(params.get("radius", 5)),
                       gradient=bool(params.get("gradient", True)),
                       patch_radius=int(params.get("patch_radius", 3)),
                       iterations=int(params.get("iterations", 5)), seed=int(seed % 2**32))
        metrics = {"hole_pixels": float(outcome.hole_pixels), **outcome.details}
        return EngineResult(outcome.image, outcome.hole, metrics, "local", VERSION)

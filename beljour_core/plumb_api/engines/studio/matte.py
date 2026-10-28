"""Background remove and replace: refine her person area into a soft matte, then cut her out
(transparent background) or place her on a procedural backdrop.

The coarse person area comes from the person segmenter or her own marking (never guessed
here). Refinement: inside a band around the coarse edge, a guided filter steered by the
photo's own brightness turns the hard edge into a soft alpha that follows hair and shoulder
edges; well inside she is opaque and well outside fully clear, so the matte can't wander.
Edge colours are decontaminated: where alpha is partial, the old background's colour
(a mask-weighted blur of the clear area) is taken out before compositing, so no halo of the
old wall remains. web/src/engines/studio/matte.ts mirrors this file. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from plumb_api.engines.core.filters import box_mean

from .backdrops import BACKDROPS, render_backdrop
from .common import (
    Floats,
    StudioResult,
    changed_share,
    finish,
    grey,
    guided,
    person_mask,
    photo,
    radius_for,
    weighted_blur,
)

BAND_SHARE = 1 / 100     # half-width of the refined edge band, share of the short side (ASSUMED)
EPS = 1e-2               # guided filter regulariser on 0..1 brightness (ASSUMED)
LABEL_REPLACE = "Background replaced with a drawn backdrop. Your photo itself is unchanged."
LABEL_REMOVE = "Background removed. Your photo itself is unchanged."


def refine(rgb: Floats, coarse: Floats) -> tuple[Floats, dict[str, float]]:
    """Soft alpha 0..1 from the coarse person area."""
    h, w = coarse.shape
    band = radius_for(w, h, BAND_SHARE)
    near = box_mean(coarse, band)
    sure_in, sure_out = near >= 0.999, near <= 0.001
    soft = np.clip(guided(grey(rgb), coarse, band, EPS), 0, 1)
    alpha = np.where(sure_in, 1.0, np.where(sure_out, 0.0, soft))
    return alpha, {"edge_band_px": float(band), "edge_pixels": float(np.count_nonzero(~sure_in & ~sure_out)),
                   "alpha_mean": float(alpha.mean())}


def foreground(rgb: Floats, alpha: Floats) -> Floats:
    """Her colours with the old background taken out of partly clear edge pixels."""
    h, w = alpha.shape
    old = weighted_blur(rgb, (alpha <= 0.02).astype(np.float64), radius_for(w, h, BAND_SHARE * 2))
    a = alpha[..., None]
    fg = (rgb - (1 - a) * old) / np.maximum(a, 0.05)
    return np.where(a >= 0.98, rgb, np.clip(fg, 0, 255))


def replace(image: np.ndarray, coarse: Any, backdrop_id: str) -> StudioResult:
    rgb, alpha_in = photo(image)
    h, w = rgb.shape[:2]
    if backdrop_id not in BACKDROPS:
        raise ValueError(f"unknown backdrop {backdrop_id}")
    alpha, metrics = refine(rgb, person_mask(coarse, h, w))
    back = render_backdrop(backdrop_id, w, h)
    out = alpha[..., None] * foreground(rgb, alpha) + (1 - alpha[..., None]) * back
    image_out = finish(out, alpha_in)
    inside = (alpha >= 0.999).astype(np.float64)
    return StudioResult(image_out, LABEL_REPLACE, {
        **metrics, "backdrop": backdrop_id, "tool": "replace",
        "person_changed_share": changed_share(rgb, image_out, inside)})


def remove(image: np.ndarray, coarse: Any) -> StudioResult:
    """RGBA: her colours and the refined matte as alpha (any input alpha is multiplied in)."""
    rgb, alpha_in = photo(image)
    h, w = rgb.shape[:2]
    alpha, metrics = refine(rgb, person_mask(coarse, h, w))
    if alpha_in is not None:
        alpha = alpha * (alpha_in.astype(np.float64) / 255)
    out = finish(foreground(rgb, alpha), None)
    matte = np.clip(np.rint(alpha * 255), 0, 255).astype(np.uint8)
    return StudioResult(np.dstack([out, matte]), LABEL_REMOVE, {**metrics, "tool": "remove"})

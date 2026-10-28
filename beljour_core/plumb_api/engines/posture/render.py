"""LS4 posture render: a thin-plate warp of the person, faded to zero at the body band.

Plan §8.5, built from the R5 engines (no new warp code):
  1. Body band = the person mask dilated by 3% of the image width.
  2. Backward thin-plate spline (engines/warp/tps.py) moving the fix's points, with the
     other control points and the image border pinned.
  3. Weighted by `falloff.band_weights` (smootherstep over the band width), so nothing
     outside the band moves (Q1, Q12), and run through `fold.safe_strength` so the
     Jacobian stays above 0.2 (Q3); `strength_used` says if it had to back off.
  4. Layers: the warped person (its mask warped by the same field) goes over the
     unwarped background, so background lines inside the band stay straight too.
  5. Only the strip the person moved off is filled: PatchMatch-lite copying from the
     background only (default), or biharmonic / fast marching (E07 part 1).

Result label: "Photo edit. Not a posture assessment and not medical advice."
Mirrored in web/src/engines/local/posture.ts. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.composite import blend
from ..core.distance import dilate
from ..core.masks import as_mask
from ..core.regions import polygon
from ..fill import fill as fills
from ..fill.patchmatch import patchmatch
from ..warp import falloff, fold
from ..warp import field as fields
from ..warp.tps import tps_field
from .fixes import PosturePlan
from .points import LABEL, Controls
from .synthetic import capsule, oval

BAND_SHARE = 0.03
MIN_BAND_PX = 3.0
FILL_METHODS = ("patchmatch", "biharmonic", "fast-marching", "none")
VERSION = "posture-spike-r7/1"
U8 = NDArray[np.uint8]


@dataclass(frozen=True)
class PostureOutcome:
    image: U8
    band: NDArray[np.float32]
    strip: NDArray[np.float32]
    field: fields.Field
    strength_used: float
    metrics: dict[str, Any]
    label: str = LABEL


def band_px(width: int, share: float = BAND_SHARE) -> float:
    if not (0 < share <= 0.2):
        raise ValueError("band share must be in (0, 0.2]")
    return max(MIN_BAND_PX, float(round(share * width)))


def body_band(person: np.ndarray, width_share: float = BAND_SHARE) -> tuple[NDArray[np.float32], float]:
    """(band, its width in px): the person mask (alpha >= 0.5) dilated by 3% of the width."""
    mask = as_mask(person)
    radius = band_px(mask.shape[1], width_share)
    on = (mask >= 0.5).astype(np.float32)
    if not on.any():
        raise ValueError("the person mask is empty")
    return dilate(on, radius), radius


def strip_fill(image: U8, strip: NDArray[np.float32], person: NDArray[np.float32], method: str,
               seed: int = 1) -> U8:
    """Fill the uncovered strip. PatchMatch copies only from background patches."""
    if method == "none" or not strip.any():
        return image.copy()
    if method == "patchmatch":
        radius = 3
        background = 1.0 - dilate((person >= 0.5).astype(np.float32), radius + 2)
        return patchmatch(image, strip, patch_radius=radius, iterations=4, seed=seed,
                          source_mask=background).image
    return fills.fill(image, strip, method, radius=4).image


def render(image: np.ndarray, person: np.ndarray, p: PosturePlan, *, band_share: float = BAND_SHARE,
           fill: str = "patchmatch", grid_step: int = 4, seed: int = 1) -> PostureOutcome:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("posture needs an RGB or RGBA uint8 photo")
    if fill not in FILL_METHODS:
        raise ValueError(f"fill must be one of {', '.join(FILL_METHODS)}")
    h, w = img.shape[:2]
    if (p.before.width, p.before.height) != (w, h):
        raise ValueError("control points were placed on a photo of another size")
    mask = as_mask(person, (h, w))
    band, radius = body_band(mask, band_share)
    src, dst, pins = p.source_target()
    moves = np.hypot(*(dst - src).T)
    if not np.any(moves > 1e-9):
        ident = fields.identity(h, w)
        empty = np.zeros((h, w), np.float32)
        return PostureOutcome(img.copy(), band, empty, ident, 1.0,
                              {"strength_used": 1.0, "reduced": False, "band_px": radius, "strip_pixels": 0,
                               "largest_move_px": 0.0, "min_det": 1.0, "version": VERSION})
    full = tps_field(h, w, src, dst, pins=pins, step=grid_step)
    weights = falloff.band_weights(band, radius)
    safe = fold.safe_strength(lambda s: fields.weighted(fields.scale(full, s), weights), requested=1.0)
    warped = fields.apply(img, safe.field)
    alpha = np.clip(fields.sample_plane(mask, safe.field.map_x, safe.field.map_y), 0.0, 1.0).astype(np.float32)
    # The strip: pixels the person covered (even partly) that the moved person no longer covers.
    strip = ((mask > 0.02) & (alpha < 0.5) & (alpha < mask - 0.05)).astype(np.float32)
    background = strip_fill(img, strip, mask, fill, seed)
    out = blend(background, warped, alpha)
    stats = fields.move_stats(safe.field)
    return PostureOutcome(out, band, strip, safe.field, float(safe.strength), {
        "strength_used": round(float(safe.strength), 6), "reduced": bool(safe.reduced), "band_px": radius,
        "strip_pixels": int(strip.sum()), "largest_move_px": round(float(moves.max()), 4),
        "max_field_move_px": round(stats.max_move, 4), "min_det": round(safe.report.min_det, 6),
        "fill": fill, "version": VERSION})


def achieved_points(p: PosturePlan, strength_used: float) -> dict[str, list[float]]:
    """Where the moved points end up once the fold guard's strength is applied."""
    out: dict[str, list[float]] = {}
    for name in p.moves:
        a, b = p.before.xy(name), p.after.xy(name)
        q = a + strength_used * (b - a)
        out[name] = [round(float(q[0]), 4), round(float(q[1]), 4)]
    return out


def approximate_person(controls: Controls) -> np.ndarray:
    """Body area from the control points alone, until the person segmenter is cleared: thick
    capsules along the skeleton plus a head ellipse. Reports label it approximate.
    Mirrored by approximatePerson in web/src/engines/local/figures.ts."""
    h, w = controls.height, controls.width
    t = controls.torso_height
    layers = []
    if controls.view == "front":
        rs_, ls_ = controls.xy("right_shoulder"), controls.xy("left_shoulder")
        rh, lh = controls.xy("right_hip"), controls.xy("left_hip")
        layers.append(polygon(h, w, np.array([rs_, ls_, lh, rh]), 2))
        r = 0.12 * t
        for a, b in ((rs_, ls_), (rs_, rh), (ls_, lh), (rh, lh)):
            layers.append(capsule(h, w, tuple(a), tuple(b), r))
        top = (rs_ + ls_) / 2 + np.array([0.0, -0.45 * t])
        layers.append(oval(h, w, float(top[0]), float(top[1]), 0.22 * t, 0.28 * t))
    else:
        chain = ["ear", "neck_base", "shoulder", "mid_back", "hip", "knee"] + (["ankle"] if "ankle" in controls.points else [])
        for first, second in zip(chain, chain[1:], strict=False):
            layers.append(capsule(h, w, controls.points[first], controls.points[second], 0.16 * t))
        ear = controls.xy("ear")
        layers.append(oval(h, w, float(ear[0]), float(ear[1]), 0.24 * t, 0.28 * t))
    out = np.zeros((h, w), np.float32)
    for m in layers:
        out = np.maximum(out, m)
    return out

"""Thin plate spline warps in NumPy only, with the safety numbers the face shape stops need.

Plumb's warp.py uses OpenCV for remapping; OpenCV's wheels bundle FFmpeg under the LGPL,
which licences.json marks for review. This module needs NumPy alone (BSD-3): backward
mapping with bilinear sampling, plus two checks a warp must pass before it is shown:

  * fold check: the smallest Jacobian determinant of the mapping. At or below zero the
    picture folds over itself (the "ghost" look); well above zero it stays smooth.
  * reach: the largest move, as a share of a reference length (face width).

Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..engines.core.resample import remap
from ..engines.warp import falloff, fold
from ..engines.warp import field as fields
from ..engines.warp.tps import ThinPlateSpline, points
from ..engines.warp.tps import border_pins as _border_pins


class Spline(ThinPlateSpline):
    """Maps 2D points `src` exactly onto `dst` and smoothly everywhere else.

    The canonical E06 spline (`engines/warp/tps.py`, mirrored in TypeScript). Plumb's
    callers relied on least squares for repeated control points, so a singular system
    falls back to the minimum-norm least-squares solution here instead of raising."""

    @property
    def src(self) -> np.ndarray:
        return self.centres

    @classmethod
    def fit(cls, src: object, dst: object, smooth: float = 0.0) -> Spline:
        try:
            canonical = ThinPlateSpline.fit(src, dst, smooth)
            return cls(canonical.centres, canonical.weights)
        except ValueError:
            s, d = points(src, "src"), points(dst, "dst")
            if s.shape != d.shape or len(s) < 3:
                raise
            rhs = np.zeros((len(s) + 3, 2))
            rhs[:len(s)] = d
            weights = np.asarray(np.linalg.lstsq(ThinPlateSpline.system(s, smooth), rhs, rcond=None)[0], dtype=np.float64)
            return cls(s, weights)


def border_pins(width: int, height: int, per_side: int = 4) -> np.ndarray:
    """Points along the image border that must not move, so the edges stay put."""
    return _border_pins(width, height, per_side)


def sample_bilinear(image: np.ndarray, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Read `image` (h, w, c) at float coordinates, clamped to the edges."""
    h, w = image.shape[:2]
    x = np.clip(x, 0, w - 1)
    y = np.clip(y, 0, h - 1)
    x0 = np.floor(x).astype(int)
    y0 = np.floor(y).astype(int)
    x1 = np.minimum(x0 + 1, w - 1)
    y1 = np.minimum(y0 + 1, h - 1)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]
    img = image.astype(float)
    top = img[y0, x0] * (1 - fx) + img[y0, x1] * fx
    bottom = img[y1, x0] * (1 - fx) + img[y1, x1] * fx
    return top * (1 - fy) + bottom * fy


@dataclass(frozen=True)
class WarpCheck:
    min_jacobian: float       # smallest local area scale of the forward map; <= 0 means a fold
    max_move_px: float
    max_move_share: float     # max move / reference length
    moved_share: float        # share of pixels that moved more than one pixel

    def to_json(self) -> dict:
        return {k: round(v, 4) for k, v in self.__dict__.items()}


def _render(image: np.ndarray, warp_field: fields.Field, linear_light: bool) -> np.ndarray:
    colour = image.ndim == 3 and image.dtype == np.uint8 and image.shape[2] in (3, 4)
    if colour and linear_light:
        return remap(image, warp_field.map_x, warp_field.map_y, border="edge", linear_light=True)
    out = sample_bilinear(image if image.ndim == 3 else image[..., None], warp_field.map_x, warp_field.map_y)
    if image.ndim == 2:
        out = out[..., 0]
    return np.clip(out, 0, 255).astype(np.uint8)


def _check(warp_field: fields.Field, forward: ThinPlateSpline, grid_step: int,
           reference_length: float) -> WarpCheck:
    """Safety numbers: the forward map's smallest area scale on the grid, and the reach."""
    gx, gy = fields.grid_nodes(warp_field.height, warp_field.width, grid_step)
    mx, my = np.meshgrid(gx, gy)
    dst = forward(np.stack([mx.ravel(), my.ravel()], 1)).reshape(len(gy), len(gx), 2)
    spacing = float(grid_step)
    dxdx = np.gradient(dst[..., 0], spacing, axis=1) if len(gx) > 1 else np.ones_like(dst[..., 0])
    dxdy = np.gradient(dst[..., 0], spacing, axis=0) if len(gy) > 1 else np.zeros_like(dst[..., 0])
    dydx = np.gradient(dst[..., 1], spacing, axis=1) if len(gx) > 1 else np.zeros_like(dst[..., 0])
    dydy = np.gradient(dst[..., 1], spacing, axis=0) if len(gy) > 1 else np.ones_like(dst[..., 0])
    jac = dxdx * dydy - dxdy * dydx
    move = warp_field.move()
    return WarpCheck(
        min_jacobian=float(np.min(jac)),
        max_move_px=float(np.max(move)),
        max_move_share=float(np.max(move) / reference_length) if reference_length else 0.0,
        moved_share=float((move > 1.0).mean()),
    )


def warp(image: np.ndarray, moved_from: np.ndarray, moved_to: np.ndarray, *,
         pins: np.ndarray | None = None, reference_length: float | None = None,
         grid_step: int = 4, linear_light: bool = True) -> tuple[np.ndarray, WarpCheck]:
    """Move the points `moved_from` to `moved_to`, keep `pins` (default: the border) still.

    Uses a backward map (output pixel -> input pixel) evaluated on a coarse grid and
    interpolated (`engines/warp/field.py`), which keeps a 1 megapixel warp well under a
    second. Colour images (uint8 RGB or RGBA) are sampled in linear light by the core
    resampler, so moved edges keep their brightness; `linear_light=False` keeps Plumb's
    sRGB sampling."""
    image = np.asarray(image)
    h, w = image.shape[:2]
    pins = border_pins(w, h) if pins is None else np.asarray(pins, dtype=float)
    moved_from = np.asarray(moved_from, dtype=float)
    moved_to = np.asarray(moved_to, dtype=float)
    # backward: from where each control point ends up, to where it came from
    back = Spline.fit(np.vstack([moved_to, pins]), np.vstack([moved_from, pins]))
    fwd = Spline.fit(np.vstack([moved_from, pins]), np.vstack([moved_to, pins]))
    warp_field = fields.from_function(h, w, back.map_xy, grid_step)
    out = _render(image, warp_field, linear_light)
    return out, _check(warp_field, fwd, grid_step, reference_length or float(w))


@dataclass(frozen=True)
class BandWarp:
    image: np.ndarray
    check: WarpCheck
    fold: fold.FoldReport
    strength_used: float


def warp_in_band(image: np.ndarray, moved_from: np.ndarray, moved_to: np.ndarray, band: np.ndarray, *,
                 ramp: float = 12.0, curve: str = "smootherstep", pins: np.ndarray | None = None,
                 strength: float = 1.0, grid_step: int = 4, reference_length: float | None = None,
                 linear_light: bool = True) -> BandWarp:
    """A spline warp that fades to exactly zero at the edge of `band` (plan §8.5).

    Nothing outside the band moves (Q1, Q12). If the full strength would fold (Q3), the
    strength is lowered by bisection until the field's Jacobian stays above 0.2, and the
    strength actually used is returned so the caller can say so."""
    image = np.asarray(image)
    h, w = image.shape[:2]
    pins = border_pins(w, h) if pins is None else np.asarray(pins, dtype=float)
    a = np.asarray(moved_from, dtype=float)
    b = np.asarray(moved_to, dtype=float)
    back = Spline.fit(np.vstack([b, pins]), np.vstack([a, pins]))
    full = fields.from_function(h, w, back.map_xy, grid_step)
    weights = falloff.band_weights(band, ramp, curve)
    safe = fold.safe_strength(lambda s: fields.weighted(fields.scale(full, s), weights), requested=strength)
    fwd = Spline.fit(np.vstack([a, pins]), np.vstack([a + safe.strength * (b - a), pins]))
    out = _render(image, safe.field, linear_light)
    return BandWarp(out, _check(safe.field, fwd, grid_step, reference_length or float(w)), safe.report, safe.strength)

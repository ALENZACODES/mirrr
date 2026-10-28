"""Edge-aware mask feathering with the guided filter (He, Sun and Tang, 2010).

A selection drawn from landmarks or a coarse segmenter is a polygon with soft
corners; hair and skin edges in the photo are not. The guided filter moves the
mask's soft edge onto the photo's own edges: where the photo is flat the mask is
smoothed like a box blur, where it has an edge the mask follows the edge.

Guides are sRGB-encoded values in [0, 1] (a uint8 photo is divided by 255), so
"edge" means what a viewer sees. Grey guides use the scalar filter; colour guides
use the full 3x3 covariance per window, solved in closed form.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .distance import distance_inside, distance_to
from .filters import box_mean
from .masks import Mask, as_mask

Floats = NDArray[np.float64]


def as_guide(image: np.ndarray) -> Floats:
    """uint8 RGB(A) or float guide -> float in [0, 1], H x W or H x W x 3."""
    arr = np.asarray(image)
    if arr.dtype == np.uint8:
        arr = arr.astype(np.float64) / 255.0
    else:
        arr = arr.astype(np.float64)
    if arr.ndim == 3:
        if arr.shape[2] not in (1, 3, 4):
            raise ValueError("guide must have 1, 3 or 4 channels")
        arr = arr[..., 0] if arr.shape[2] == 1 else arr[..., :3]
    if arr.ndim not in (2, 3) or 0 in arr.shape or not np.all(np.isfinite(arr)):
        raise ValueError("guide must be a finite, non-empty image")
    return arr


def _check(radius: int, eps: float) -> None:
    if not 1 <= radius <= 256:
        raise ValueError("radius must be between 1 and 256")
    if not np.isfinite(eps) or eps <= 0:
        raise ValueError("eps must be positive")


def guided_filter(guide: np.ndarray, source: np.ndarray, radius: int, eps: float) -> Floats:
    """Filter `source` (H x W floats) with `guide` (grey or RGB). Not clipped."""
    _check(radius, eps)
    g = as_guide(guide)
    p = np.asarray(source, dtype=np.float64)
    if p.shape != g.shape[:2] or not np.all(np.isfinite(p)):
        raise ValueError("source must be finite and match the guide size")
    mean_p = box_mean(p, radius)
    if g.ndim == 2:
        mean_i = box_mean(g, radius)
        cov = box_mean(g * p, radius) - mean_i * mean_p
        var = box_mean(g * g, radius) - mean_i * mean_i
        a = cov / (var + eps)
        b = mean_p - a * mean_i
        return box_mean(a, radius) * g + box_mean(b, radius)
    return _colour(g, p, mean_p, radius, eps)


def _colour(g: Floats, p: Floats, mean_p: Floats, radius: int, eps: float) -> Floats:
    mean_i = box_mean(g, radius)                                   # H x W x 3
    cov = box_mean(g * p[..., None], radius) - mean_i * mean_p[..., None]
    # Symmetric covariance entries, regularised on the diagonal.
    pairs = {}
    for i, j in ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2)):
        pairs[i, j] = box_mean(g[..., i] * g[..., j], radius) - mean_i[..., i] * mean_i[..., j]
    s_rr, s_rg, s_rb = pairs[0, 0] + eps, pairs[0, 1], pairs[0, 2]
    s_gg, s_gb, s_bb = pairs[1, 1] + eps, pairs[1, 2], pairs[2, 2] + eps
    inv_rr = s_gg * s_bb - s_gb * s_gb
    inv_rg = s_gb * s_rb - s_rg * s_bb
    inv_rb = s_rg * s_gb - s_gg * s_rb
    inv_gg = s_rr * s_bb - s_rb * s_rb
    inv_gb = s_rb * s_rg - s_rr * s_gb
    inv_bb = s_rr * s_gg - s_rg * s_rg
    det = s_rr * inv_rr + s_rg * inv_rg + s_rb * inv_rb
    c_r, c_g, c_b = cov[..., 0], cov[..., 1], cov[..., 2]
    a_r = (inv_rr * c_r + inv_rg * c_g + inv_rb * c_b) / det
    a_g = (inv_rg * c_r + inv_gg * c_g + inv_gb * c_b) / det
    a_b = (inv_rb * c_r + inv_gb * c_g + inv_bb * c_b) / det
    b = mean_p - a_r * mean_i[..., 0] - a_g * mean_i[..., 1] - a_b * mean_i[..., 2]
    return (box_mean(a_r, radius) * g[..., 0] + box_mean(a_g, radius) * g[..., 1]
            + box_mean(a_b, radius) * g[..., 2] + box_mean(b, radius))


def edge_band(mask: np.ndarray, band: float, threshold: float = 0.5) -> NDArray[np.bool_]:
    """Pixels within `band` pixels of the mask's edge, on either side."""
    if not np.isfinite(band) or band < 0:
        raise ValueError("band must be finite and non-negative")
    on = as_mask(mask) >= threshold
    if not on.any() or on.all():
        return np.zeros(on.shape, dtype=bool)
    return np.where(on, distance_inside(mask, threshold) <= band, distance_to(mask, threshold) <= band)


def edge_aware_feather(mask: np.ndarray, guide: np.ndarray, radius: int = 8,
                       eps: float = 1e-3, band: float | None = None) -> Mask:
    """Refine `mask` against the photo's edges.

    `band` (pixels) limits the change to a strip around the original edge; outside it
    the result is the original mask thresholded at 0.5, so no halo appears far away.
    """
    source = as_mask(mask)
    refined = np.clip(guided_filter(guide, source, radius, eps), 0.0, 1.0)
    if band is not None:
        strip = edge_band(source, band)
        refined = np.where(strip, refined, (source >= 0.5).astype(np.float64))
    return refined.astype(np.float32)

"""LS6 step 2, denoise (plan §8.3): luminance and colour noise separately, method by noise level.

Work happens on encoded sRGB in [0, 1], split into luma Y (BT.601) and two colour
differences (Cb = B - Y, Cr = R - Y), which is exactly invertible.
* guided: He, Sun and Tang's guided filter (engines/core/guided.py) on Y with itself as
  guide; colour differences filtered with Y as guide and a wider window.
* bilateral: Tomasi and Manduchi's bilateral filter on Y (spatial and range Gaussians);
  colour differences get the spatial Gaussian only.
* nlm: Buades, Coll and Morel's non-local means on Y (3 x 3 patches, 11 x 11 search), and
  the same weights average the colour differences (joint weights keep colour edges).
Auto choice by the measured sigma (0..255): under 3 none, under 8 guided, under 16
bilateral, otherwise non-local means. These cut points and every strength factor are
ASSUMED until the LS6 runs on released low-light photos.
Mirrored in web/src/engines/local/enhance.ts. Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

from ..core.filters import box_mean
from ..core.guided import guided_filter

Floats = NDArray[np.float64]
METHODS = ("none", "guided", "bilateral", "nlm")
AUTO_LIMITS = (3.0, 8.0, 16.0)
GUIDED_K, CHROMA_K = 2.5, 3.5
BILATERAL_RADIUS, BILATERAL_SPACE, BILATERAL_RANGE = 3, 2.0, 2.5
NLM_PATCH, NLM_SEARCH, NLM_H = 1, 5, 0.6


def choose(sigma: float) -> str:
    if not (math.isfinite(sigma) and sigma >= 0):
        raise ValueError("sigma must be finite and non-negative")
    # Three upper boundaries select the first three methods; NLM is open-ended.
    for name, limit in zip(METHODS[:-1], AUTO_LIMITS, strict=True):
        if sigma < limit:
            return name
    return METHODS[-1]


def to_ycc(image: np.ndarray) -> tuple[Floats, Floats, Floats]:
    rgb = np.asarray(image)[..., :3].astype(np.float64) / 255.0
    y = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    return y, rgb[..., 2] - y, rgb[..., 0] - y


def from_ycc(y: np.ndarray, cb: np.ndarray, cr: np.ndarray) -> NDArray[np.uint8]:
    r = y + cr
    b = y + cb
    g = (y - 0.299 * r - 0.114 * b) / 0.587
    rgb = np.stack([r, g, b], axis=-1)
    return np.clip(np.rint(rgb * 255.0), 0, 255).astype(np.uint8)


def _shift(plane: Floats, dy: int, dx: int) -> Floats:
    """plane[y + dy, x + dx] with edge clamping."""
    h, w = plane.shape
    ys = np.clip(np.arange(h) + dy, 0, h - 1)
    xs = np.clip(np.arange(w) + dx, 0, w - 1)
    out: Floats = plane[ys][:, xs]
    return out


def guided(y: Floats, cb: Floats, cr: Floats, sigma: float, strength: float) -> tuple[Floats, Floats, Floats]:
    s = max(sigma, 0.5) / 255.0 * strength
    eps_y, eps_c = (GUIDED_K * s) ** 2, (CHROMA_K * s) ** 2
    return (guided_filter(y, y, 2, eps_y), guided_filter(y, cb, 3, eps_c), guided_filter(y, cr, 3, eps_c))


def bilateral(y: Floats, cb: Floats, cr: Floats, sigma: float, strength: float) -> tuple[Floats, Floats, Floats]:
    r = BILATERAL_RADIUS
    range_sigma = max(sigma, 0.5) / 255.0 * BILATERAL_RANGE * strength
    acc_y, acc_cb, acc_cr = np.zeros_like(y), np.zeros_like(y), np.zeros_like(y)
    weight_y, weight_c = np.zeros_like(y), 0.0
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            space = math.exp(-(dx * dx + dy * dy) / (2 * BILATERAL_SPACE ** 2))
            sy = _shift(y, dy, dx)
            diff = sy - y
            wgt = space * np.exp(-(diff * diff) / (2 * range_sigma * range_sigma))
            acc_y += wgt * sy
            weight_y += wgt
            acc_cb += space * _shift(cb, dy, dx)
            acc_cr += space * _shift(cr, dy, dx)
            weight_c += space
    out_y = acc_y / weight_y
    a = min(1.0, strength)
    return (out_y, cb + a * (acc_cb / weight_c - cb), cr + a * (acc_cr / weight_c - cr))


def nlm(y: Floats, cb: Floats, cr: Floats, sigma: float, strength: float) -> tuple[Floats, Floats, Floats]:
    s = max(sigma, 0.5) / 255.0
    h = NLM_H * s * strength
    two_var = 2 * s * s
    acc_y, acc_cb, acc_cr, total = np.zeros_like(y), np.zeros_like(y), np.zeros_like(y), np.zeros_like(y)
    for dy in range(-NLM_SEARCH, NLM_SEARCH + 1):
        for dx in range(-NLM_SEARCH, NLM_SEARCH + 1):
            sy = _shift(y, dy, dx)
            diff = y - sy
            dist = box_mean(diff * diff, NLM_PATCH)
            wgt = np.exp(-np.maximum(dist - two_var, 0.0) / (h * h))
            acc_y += wgt * sy
            acc_cb += wgt * _shift(cb, dy, dx)
            acc_cr += wgt * _shift(cr, dy, dx)
            total += wgt
    return acc_y / total, acc_cb / total, acc_cr / total


def denoise(image: np.ndarray, sigma: float, *, method: str = "auto", strength: float = 1.0) -> tuple[NDArray[np.uint8], str]:
    """Denoised RGB (alpha dropped) and the method used; strength scales the smoothing."""
    if not (math.isfinite(strength) and 0 <= strength <= 2):
        raise ValueError("strength must be 0..2")
    chosen = choose(sigma) if method == "auto" else method
    if chosen not in METHODS:
        raise ValueError(f"method must be auto or one of {', '.join(METHODS)}")
    img = np.asarray(image)
    if chosen == "none" or strength == 0:
        return img[..., :3].copy(), "none"
    y, cb, cr = to_ycc(img)
    fn = {"guided": guided, "bilateral": bilateral, "nlm": nlm}[chosen]
    ny, ncb, ncr = fn(y, cb, cr, sigma, strength)
    return from_ycc(ny, ncb, ncr), chosen

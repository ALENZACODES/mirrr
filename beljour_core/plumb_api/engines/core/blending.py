"""Blend modes (W3C Compositing and Blending Level 1) and multiband blending.

Mode formulas follow the W3C spec exactly, including its colour-dodge/burn edge rules
and the non-separable hue, saturation, color and luminosity modes (Lum, ClipColor,
SetLum, SetSat). `color` is the mode for recolouring: it keeps the base's luminance
and takes hue and chroma from the top layer.

`space="srgb"` blends encoded values (what photo editors do); `space="linear"` decodes
to linear light first. Multiband blending (Burt and Adelson) always runs in linear
light: each Laplacian band is mixed with the matching Gaussian level of the mask, so
wide transitions in flat areas and tight transitions at fine detail come out together.
Mirrored in `web/src/engines/core/blend.ts`.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from . import pyramid
from .composite import _image, decode, encode
from .masks import as_mask

Floats = NDArray[np.float64]

SEPARABLE = ("normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge",
             "color-burn", "hard-light", "soft-light", "difference", "exclusion")
NON_SEPARABLE = ("hue", "saturation", "color", "luminosity")
MODES = SEPARABLE + NON_SEPARABLE
SPACES = ("srgb", "linear")


def _hard_light(cb: Floats, cs: Floats) -> Floats:
    return np.where(cs <= 0.5, cb * (2 * cs), cb + (2 * cs - 1) - cb * (2 * cs - 1))


def _soft_light(cb: Floats, cs: Floats) -> Floats:
    d = np.where(cb <= 0.25, ((16 * cb - 12) * cb + 4) * cb, np.sqrt(cb))
    return np.where(cs <= 0.5, cb - (1 - 2 * cs) * cb * (1 - cb), cb + (2 * cs - 1) * (d - cb))


def _dodge(cb: Floats, cs: Floats) -> Floats:
    with np.errstate(divide="ignore", invalid="ignore"):
        ratio = np.minimum(1.0, cb / (1 - cs))
    return np.where(cb == 0, 0.0, np.where(cs == 1, 1.0, ratio))


def _burn(cb: Floats, cs: Floats) -> Floats:
    with np.errstate(divide="ignore", invalid="ignore"):
        ratio = 1 - np.minimum(1.0, (1 - cb) / cs)
    return np.where(cb == 1, 1.0, np.where(cs == 0, 0.0, ratio))


def lum(c: Floats) -> Floats:
    return 0.3 * c[..., 0] + 0.59 * c[..., 1] + 0.11 * c[..., 2]


def clip_colour(c: Floats) -> Floats:
    light = lum(c)[..., None]
    low = c.min(axis=-1, keepdims=True)
    high = c.max(axis=-1, keepdims=True)
    with np.errstate(divide="ignore", invalid="ignore"):
        c = np.where(low < 0, light + (c - light) * light / (light - low), c)
        c = np.where(high > 1, light + (c - light) * (1 - light) / (high - light), c)
    return c


def set_lum(c: Floats, light: Floats) -> Floats:
    return clip_colour(c + (light - lum(c))[..., None])


def sat(c: Floats) -> Floats:
    return c.max(axis=-1) - c.min(axis=-1)


def set_sat(c: Floats, s: Floats) -> Floats:
    low = c.min(axis=-1, keepdims=True)
    span = c.max(axis=-1, keepdims=True) - low
    with np.errstate(divide="ignore", invalid="ignore"):
        scaled = (c - low) * s[..., None] / span
    return np.where(span > 0, scaled, 0.0)


def mode_float(cb: np.ndarray, cs: np.ndarray, mode: str) -> Floats:
    """B(cb, cs) for float RGB arrays (..., 3) in [0, 1]."""
    b = np.asarray(cb, dtype=np.float64)
    s = np.asarray(cs, dtype=np.float64)
    if b.shape != s.shape or b.shape[-1] != 3:
        raise ValueError("base and top must be matching (..., 3) arrays")
    if mode not in MODES:
        raise ValueError(f"unknown blend mode {mode!r}")
    table = {
        "normal": lambda: s,
        "multiply": lambda: b * s,
        "screen": lambda: b + s - b * s,
        "overlay": lambda: _hard_light(s, b),
        "darken": lambda: np.minimum(b, s),
        "lighten": lambda: np.maximum(b, s),
        "color-dodge": lambda: _dodge(b, s),
        "color-burn": lambda: _burn(b, s),
        "hard-light": lambda: _hard_light(b, s),
        "soft-light": lambda: _soft_light(b, s),
        "difference": lambda: np.abs(b - s),
        "exclusion": lambda: b + s - 2 * b * s,
        "hue": lambda: set_lum(set_sat(s, sat(b)), lum(b)),
        "saturation": lambda: set_lum(set_sat(b, sat(s)), lum(b)),
        "color": lambda: set_lum(s, lum(b)),
        "luminosity": lambda: set_lum(b, lum(s)),
    }
    return table[mode]()


def composite_float(cb: np.ndarray, cs: np.ndarray, mode: str, alpha: np.ndarray) -> Floats:
    """(1 - alpha) * cb + alpha * B(cb, cs); alpha is (...,) in [0, 1]."""
    a = np.asarray(alpha, dtype=np.float64)[..., None]
    b = np.asarray(cb, dtype=np.float64)
    return b * (1 - a) + mode_float(b, cs, mode) * a


def _srgb_float(image: np.ndarray) -> Floats:
    return _image(image)[..., :3].astype(np.float64) / 255.0


def _to_u8(values: Floats) -> np.ndarray:
    return np.rint(np.clip(values, 0, 1) * 255).astype(np.uint8)


def apply_mode(base: np.ndarray, top: np.ndarray, mode: str, *, opacity: float = 1.0,
               mask: np.ndarray | None = None, space: str = "srgb") -> np.ndarray:
    """Blend two same-size uint8 RGB(A) images; the base's alpha channel is kept."""
    a, b = _image(base), _image(top)
    if a.shape[:2] != b.shape[:2]:
        raise ValueError("base and top must be the same size")
    if not np.isfinite(opacity) or not 0 <= opacity <= 1:
        raise ValueError("opacity must be in [0, 1]")
    if space not in SPACES:
        raise ValueError("space must be 'srgb' or 'linear'")
    weight = np.full(a.shape[:2], opacity) if mask is None else as_mask(mask, a.shape[:2]) * opacity
    if b.shape[2] == 4:
        weight = weight * (b[..., 3] / 255.0)
    if space == "linear":
        rgb = encode(np.clip(composite_float(decode(a), decode(b), mode, weight), 0, 1))
    else:
        rgb = _to_u8(composite_float(_srgb_float(a), _srgb_float(b), mode, weight))
    return rgb if a.shape[2] == 3 else np.concatenate([rgb, a[..., 3:4]], axis=2)


def multiband_float(a: np.ndarray, b: np.ndarray, mask: np.ndarray, levels: int) -> Floats:
    """Blend float images a (where mask = 0) and b (where mask = 1) band by band."""
    fa = np.asarray(a, dtype=np.float64)
    fb = np.asarray(b, dtype=np.float64)
    if fa.shape != fb.shape or fa.ndim != 3:
        raise ValueError("images must be matching H x W x C arrays")
    weights = pyramid.gaussian(as_mask(mask, fa.shape[:2]).astype(np.float64), levels)
    bands_a = pyramid.laplacian(fa, levels)
    bands_b = pyramid.laplacian(fb, levels)
    mixed = [la * (1 - w[..., None]) + lb * w[..., None]
             for la, lb, w in zip(bands_a, bands_b, weights, strict=True)]
    return pyramid.collapse(mixed)


def multiband_blend(base: np.ndarray, overlay: np.ndarray, mask: np.ndarray,
                    levels: int | None = None) -> np.ndarray:
    """uint8 RGB(A) multiband blend in linear light; alpha is blended plainly."""
    a, b = _image(base), _image(overlay)
    if a.shape != b.shape:
        raise ValueError("base and overlay dimensions must match")
    n = levels if levels is not None else pyramid.max_levels(*a.shape[:2])
    rgb = encode(np.clip(multiband_float(decode(a), decode(b), mask, n), 0, 1))
    if a.shape[2] == 3:
        return rgb
    alpha = as_mask(mask, a.shape[:2])[..., None]
    fourth = np.rint(a[..., 3:4] * (1 - alpha) + b[..., 3:4] * alpha).astype(np.uint8)
    return np.concatenate([rgb, fourth], axis=2)

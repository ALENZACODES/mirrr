"""Vectorised colour spaces for the filter kernels: sRGB, linear light, OKLab/OKLCh and CIELAB.

Every function takes and returns float64 arrays shaped (..., 3). sRGB values are encoded and
in [0, 1]; decode clamps to [0, 1] first so every kernel starts from a valid colour. The
constants are the ones in engines/core/colour.py (sRGB D65 primaries, Ottosson's OKLab
matrices), so a single pixel here equals the scalar core functions to rounding. The same
formulas, in the same order, are in web/src/filters/colour/space.ts (parity, CONTRACTS §31).

OKLab: Ottosson (2020), "A perceptual color space for image processing"; concept only, no code copied.
CIEDE2000: Sharma, Wu and Dalal (2005), as in engines/core/colour.py, here for whole arrays.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from ...engines.core.colour import WHITE_D65

Floats = NDArray[np.float64]

LUMA = (0.2126, 0.7152, 0.0722)  # Rec. 709 / sRGB luminance weights on linear light
MID_GREY_BYTE = 119               # sRGB 119/255 sits at CIELAB L* 50.0 (the guard's mid-grey)
_D = 6 / 29


def as_rgb(values: np.ndarray) -> Floats:
    arr = np.asarray(values, dtype=np.float64)
    if arr.shape[-1] != 3:
        raise ValueError("expected (..., 3) colour values")
    if not np.all(np.isfinite(arr)):
        raise ValueError("colour values must be finite")
    return arr


def clamp01(values: np.ndarray) -> Floats:
    return np.clip(np.asarray(values, dtype=np.float64), 0.0, 1.0)


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> Floats:
    if edge1 == edge0:
        raise ValueError("smoothstep edges must differ")
    t = np.clip((np.asarray(x, dtype=np.float64) - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def decode(srgb: np.ndarray) -> Floats:
    """sRGB-encoded (clamped to [0, 1]) to linear light."""
    c = clamp01(srgb)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def encode(linear: np.ndarray) -> Floats:
    """Linear light (clamped to [0, 1]) to sRGB-encoded values."""
    c = clamp01(linear)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)


def luminance(linear: np.ndarray) -> Floats:
    lin = np.asarray(linear, dtype=np.float64)
    return LUMA[0] * lin[..., 0] + LUMA[1] * lin[..., 1] + LUMA[2] * lin[..., 2]


def linear_to_oklab(linear: np.ndarray) -> Floats:
    """Linear sRGB to OKLab. Greys (r = g = b) map to exactly a = b = 0, L = cbrt(r), so a look
    that doesn't tint keeps black and white exactly neutral through every OKLab op."""
    lin = np.asarray(linear, dtype=np.float64)
    r, g, b = lin[..., 0], lin[..., 1], lin[..., 2]
    l_ = np.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m_ = np.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s_ = np.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    out = np.stack([0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
                    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
                    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_], axis=-1)
    grey = (r == g) & (g == b)
    if np.any(grey):
        out[grey] = np.stack([np.cbrt(r[grey]), np.zeros(int(grey.sum())), np.zeros(int(grey.sum()))], axis=-1)
    return out


def oklab_to_linear(lab: np.ndarray) -> Floats:
    """OKLab to linear sRGB; a = b = 0 gives the exact grey L^3 in all three channels."""
    arr = np.asarray(lab, dtype=np.float64)
    light, a, b = arr[..., 0], arr[..., 1], arr[..., 2]
    l_ = light + 0.3963377774 * a + 0.2158037573 * b
    m_ = light - 0.1055613458 * a - 0.0638541728 * b
    s_ = light - 0.0894841775 * a - 1.2914855480 * b
    cl, cm, cs = l_ ** 3, m_ ** 3, s_ ** 3
    out = np.stack([4.0767416621 * cl - 3.3077115913 * cm + 0.2309699292 * cs,
                    -1.2684380046 * cl + 2.6097574011 * cm - 0.3413193965 * cs,
                    -0.0041960863 * cl - 0.7034186147 * cm + 1.7076147010 * cs], axis=-1)
    grey = (a == 0) & (b == 0)
    if np.any(grey):
        out[grey] = (light[grey] ** 3)[:, None]
    return out


def srgb_to_oklab(srgb: np.ndarray) -> Floats:
    return linear_to_oklab(decode(srgb))


def oklab_to_srgb(lab: np.ndarray) -> Floats:
    """OKLab to sRGB-encoded values; out-of-gamut colours are clipped in linear light."""
    return encode(oklab_to_linear(lab))


def oklab_to_oklch(lab: np.ndarray) -> Floats:
    arr = np.asarray(lab, dtype=np.float64)
    chroma = np.hypot(arr[..., 1], arr[..., 2])
    hue = np.mod(np.degrees(np.arctan2(arr[..., 2], arr[..., 1])), 360.0)
    return np.stack([arr[..., 0], chroma, hue], axis=-1)


def oklch_to_oklab(lch: np.ndarray) -> Floats:
    arr = np.asarray(lch, dtype=np.float64)
    rad = np.radians(arr[..., 2])
    chroma = np.maximum(arr[..., 1], 0.0)
    return np.stack([arr[..., 0], chroma * np.cos(rad), chroma * np.sin(rad)], axis=-1)


def wrap_degrees(delta: np.ndarray) -> Floats:
    """Signed angle difference folded into (-180, 180]."""
    d = np.mod(np.asarray(delta, dtype=np.float64) + 180.0, 360.0) - 180.0
    return np.where(d == -180.0, 180.0, d)


# CIELAB (D65) ---------------------------------------------------------------------------

def _f(t: np.ndarray) -> Floats:
    return np.where(t > _D ** 3, np.cbrt(t), t / (3 * _D * _D) + 4 / 29)


def _f_inv(t: np.ndarray) -> Floats:
    return np.where(t > _D, t ** 3, 3 * _D * _D * (t - 4 / 29))


def srgb_to_lab(srgb: np.ndarray) -> Floats:
    """sRGB-encoded [0, 1] values to CIELAB (D65), same as core srgb_to_lab_array on bytes."""
    lin = decode(srgb)
    r, g, b = lin[..., 0], lin[..., 1], lin[..., 2]
    x = 100 * (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / WHITE_D65[0]
    y = 100 * (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / WHITE_D65[1]
    z = 100 * (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / WHITE_D65[2]
    fx, fy, fz = _f(x), _f(y), _f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], axis=-1)


def lab_to_srgb(lab: np.ndarray) -> Floats:
    """CIELAB (D65) to sRGB-encoded values, clipped in linear light."""
    arr = np.asarray(lab, dtype=np.float64)
    fy = (arr[..., 0] + 16) / 116
    fx = fy + arr[..., 1] / 500
    fz = fy - arr[..., 2] / 200
    x = _f_inv(fx) * WHITE_D65[0] / 100
    y = _f_inv(fy) * WHITE_D65[1] / 100
    z = _f_inv(fz) * WHITE_D65[2] / 100
    lin = np.stack([3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
                    -0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
                    0.0556434 * x - 0.2040259 * y + 1.0572252 * z], axis=-1)
    return encode(lin)


def bytes_to_unit(image: np.ndarray) -> Floats:
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[-1] not in (3, 4):
        raise ValueError("expected an H x W x 3 (or 4) uint8 image")
    return arr[..., :3].astype(np.float64) / 255.0


def unit_to_bytes(unit: np.ndarray) -> NDArray[np.uint8]:
    """Round half to even (NumPy rint), the rule every byte output in this repo uses."""
    return np.rint(np.clip(np.asarray(unit, dtype=np.float64), 0.0, 1.0) * 255.0).astype(np.uint8)


def ciede2000(lab1: np.ndarray, lab2: np.ndarray) -> Floats:
    """Per-pixel CIEDE2000 (kL = kC = kH = 1) of two (..., 3) CIELAB arrays."""
    a = np.asarray(lab1, dtype=np.float64)
    b = np.asarray(lab2, dtype=np.float64)
    L1, a1, b1 = a[..., 0], a[..., 1], a[..., 2]
    L2, a2, b2 = b[..., 0], b[..., 1], b[..., 2]
    c1, c2 = np.hypot(a1, b1), np.hypot(a2, b2)
    mean_c = (c1 + c2) / 2
    g = 0.5 * (1 - np.sqrt(mean_c ** 7 / (mean_c ** 7 + 25.0 ** 7)))
    ap1, ap2 = (1 + g) * a1, (1 + g) * a2
    cp1, cp2 = np.hypot(ap1, b1), np.hypot(ap2, b2)
    h1 = np.mod(np.degrees(np.arctan2(b1, ap1)), 360)
    h2 = np.mod(np.degrees(np.arctan2(b2, ap2)), 360)
    zero = cp1 * cp2 == 0
    dh = h2 - h1
    dh = np.where(dh > 180, dh - 360, np.where(dh < -180, dh + 360, dh))
    dh = np.where(zero, 0.0, dh)
    d_h = 2 * np.sqrt(cp1 * cp2) * np.sin(np.radians(dh / 2))
    lmean, cmean = (L1 + L2) / 2, (cp1 + cp2) / 2
    hsum = h1 + h2
    hmean = np.where(np.abs(h1 - h2) <= 180, hsum / 2, np.where(hsum < 360, (hsum + 360) / 2, (hsum - 360) / 2))
    hmean = np.where(zero, hsum, hmean)
    t = (1 - 0.17 * np.cos(np.radians(hmean - 30)) + 0.24 * np.cos(np.radians(2 * hmean))
         + 0.32 * np.cos(np.radians(3 * hmean + 6)) - 0.20 * np.cos(np.radians(4 * hmean - 63)))
    theta = 30 * np.exp(-((hmean - 275) / 25) ** 2)
    rc = 2 * np.sqrt(cmean ** 7 / (cmean ** 7 + 25.0 ** 7))
    sl = 1 + 0.015 * (lmean - 50) ** 2 / np.sqrt(20 + (lmean - 50) ** 2)
    sc = 1 + 0.045 * cmean
    sh = 1 + 0.015 * cmean * t
    rt = -np.sin(np.radians(2 * theta)) * rc
    dl, dc, dhh = (L2 - L1) / sl, (cp2 - cp1) / sc, d_h / sh
    return np.sqrt(np.maximum(0.0, dl * dl + dc * dc + dhh * dhh + rt * dc * dhh))

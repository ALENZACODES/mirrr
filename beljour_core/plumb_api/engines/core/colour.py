"""Colour management for sRGB and D65 CIELAB, including CIEDE2000.

CIEDE2000 follows Sharma, Wu and Dalal (2005), validated against their published
supplementary pairs. Values are in the sRGB colour space, not camera-native RGB.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence

import numpy as np

WHITE_D65 = (95.047, 100.0, 108.883)


def _triplet(values: Sequence[float]) -> tuple[float, float, float]:
    if len(values) != 3 or not all(math.isfinite(float(x)) for x in values):
        raise ValueError("expected three finite colour coordinates")
    return float(values[0]), float(values[1]), float(values[2])


def hex_to_rgb(color: str) -> tuple[int, int, int]:
    value = color.removeprefix("#")
    if len(value) != 6:
        raise ValueError("expected six hexadecimal digits")
    try:
        return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]
    except ValueError as exc:
        raise ValueError("invalid hexadecimal colour") from exc


def rgb_to_hex(rgb: Sequence[float]) -> str:
    return "#" + "".join(f"{min(255, max(0, round(v))):02X}" for v in _triplet(rgb))


def srgb_decode(channel: float) -> float:
    if not math.isfinite(channel) or not 0 <= channel <= 1:
        raise ValueError("sRGB channel must lie in [0,1]")
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def srgb_encode(channel: float) -> float:
    if not math.isfinite(channel):
        raise ValueError("linear RGB channel must be finite")
    return 12.92 * channel if channel <= 0.0031308 else 1.055 * channel ** (1 / 2.4) - 0.055


def rgb_to_xyz(rgb: Sequence[float]) -> tuple[float, float, float]:
    r, g, b = (srgb_decode(v / 255) for v in _triplet(rgb))
    return (
        100 * (0.4124564 * r + 0.3575761 * g + 0.1804375 * b),
        100 * (0.2126729 * r + 0.7151522 * g + 0.0721750 * b),
        100 * (0.0193339 * r + 0.1191920 * g + 0.9503041 * b),
    )


def xyz_to_rgb(xyz: Sequence[float], *, clip: bool = False) -> tuple[float, float, float]:
    x, y, z = (v / 100 for v in _triplet(xyz))
    rgb = (
        3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
        -0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
        0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
    )
    r, g, b = (srgb_encode(v) * 255 for v in rgb)
    return (min(255, max(0, r)), min(255, max(0, g)), min(255, max(0, b))) if clip else (r, g, b)


def xyz_to_lab(xyz: Sequence[float]) -> tuple[float, float, float]:
    x, y, z = (v / w for v, w in zip(_triplet(xyz), WHITE_D65, strict=True))
    d = 6 / 29
    def f(t: float) -> float:
        return t ** (1 / 3) if t > d ** 3 else t / (3 * d * d) + 4 / 29
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def lab_to_xyz(lab: Sequence[float]) -> tuple[float, float, float]:
    light, a, b = _triplet(lab)
    fy = (light + 16) / 116
    fx, fz = fy + a / 500, fy - b / 200
    d = 6 / 29
    def inv(t: float) -> float:
        return t ** 3 if t > d else 3 * d * d * (t - 4 / 29)
    return inv(fx) * WHITE_D65[0], inv(fy) * WHITE_D65[1], inv(fz) * WHITE_D65[2]


def rgb_to_lab(rgb: Sequence[float]) -> tuple[float, float, float]:
    return xyz_to_lab(rgb_to_xyz(rgb))


def lab_to_rgb(lab: Sequence[float]) -> tuple[float, float, float]:
    return xyz_to_rgb(lab_to_xyz(lab))


def hex_to_lab(color: str) -> tuple[float, float, float]:
    return rgb_to_lab(hex_to_rgb(color))


def ciede2000(lab1: Sequence[float], lab2: Sequence[float],
              kL: float = 1, kC: float = 1, kH: float = 1) -> float:
    """Delta E 2000; kL/kC/kH are positive parametric correction factors."""
    if any(not math.isfinite(k) or k <= 0 for k in (kL, kC, kH)):
        raise ValueError("parametric factors must be positive and finite")
    L1, a1, b1 = _triplet(lab1)
    L2, a2, b2 = _triplet(lab2)
    c1, c2 = math.hypot(a1, b1), math.hypot(a2, b2)
    mean_c = (c1 + c2) / 2
    g = 0.5 * (1 - math.sqrt(mean_c ** 7 / (mean_c ** 7 + 25 ** 7)))
    ap1, ap2 = (1 + g) * a1, (1 + g) * a2
    cp1, cp2 = math.hypot(ap1, b1), math.hypot(ap2, b2)
    h1, h2 = math.degrees(math.atan2(b1, ap1)) % 360, math.degrees(math.atan2(b2, ap2)) % 360
    dl = L2 - L1
    dc = cp2 - cp1
    dh = h2 - h1
    if cp1 * cp2 == 0:
        dh = 0
    elif dh > 180:
        dh -= 360
    elif dh < -180:
        dh += 360
    d_h = 2 * math.sqrt(cp1 * cp2) * math.sin(math.radians(dh / 2))
    lmean, cmean = (L1 + L2) / 2, (cp1 + cp2) / 2
    if cp1 * cp2 == 0:
        hmean = h1 + h2
    elif abs(h1 - h2) <= 180:
        hmean = (h1 + h2) / 2
    elif h1 + h2 < 360:
        hmean = (h1 + h2 + 360) / 2
    else:
        hmean = (h1 + h2 - 360) / 2
    t = (1 - 0.17 * math.cos(math.radians(hmean - 30))
         + 0.24 * math.cos(math.radians(2 * hmean))
         + 0.32 * math.cos(math.radians(3 * hmean + 6))
         - 0.20 * math.cos(math.radians(4 * hmean - 63)))
    theta = 30 * math.exp(-((hmean - 275) / 25) ** 2)
    rc = 2 * math.sqrt(cmean ** 7 / (cmean ** 7 + 25 ** 7))
    sl = 1 + 0.015 * (lmean - 50) ** 2 / math.sqrt(20 + (lmean - 50) ** 2)
    sc = 1 + 0.045 * cmean
    sh = 1 + 0.015 * cmean * t
    rt = -math.sin(math.radians(2 * theta)) * rc
    dl, dc, d_h = dl / (kL * sl), dc / (kC * sc), d_h / (kH * sh)
    return math.sqrt(max(0.0, dl * dl + dc * dc + d_h * d_h + rt * dc * d_h))


# OKLab (Ottosson, 2020) ---------------------------------------------------------
# A perceptual space on linear sRGB, used for gradients and ombre steps: equal
# steps in OKLab look like equal steps, without the purple cast CIELAB gives blues.

def linear_to_oklab(rgb: Sequence[float]) -> tuple[float, float, float]:
    r, g, b = _triplet(rgb)
    l_ = math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m_ = math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s_ = math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return (0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_)


def oklab_to_linear(lab: Sequence[float]) -> tuple[float, float, float]:
    light, a, b = _triplet(lab)
    l_ = light + 0.3963377774 * a + 0.2158037573 * b
    m_ = light - 0.1055613458 * a - 0.0638541728 * b
    s_ = light - 0.0894841775 * a - 1.2914855480 * b
    long_cone, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    return (4.0767416621 * long_cone - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * long_cone + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * long_cone - 0.7034186147 * m + 1.7076147010 * s)


def rgb_to_oklab(rgb: Sequence[float]) -> tuple[float, float, float]:
    """8-bit sRGB (0..255, floats allowed) to OKLab."""
    return linear_to_oklab([srgb_decode(v / 255) for v in _triplet(rgb)])


def oklab_to_rgb(lab: Sequence[float]) -> tuple[float, float, float]:
    """OKLab to 8-bit sRGB floats, not clipped (out-of-gamut values fall outside 0..255)."""
    return tuple(srgb_encode(v) * 255 for v in oklab_to_linear(lab))  # type: ignore[return-value]


def mix_oklab(rgb1: Sequence[float], rgb2: Sequence[float], t: float) -> tuple[float, float, float]:
    """Colour t of the way from rgb1 to rgb2 (0..1), interpolated in OKLab, clipped to 0..255."""
    if not math.isfinite(t) or not 0 <= t <= 1:
        raise ValueError("t must be in [0, 1]")
    a, b = rgb_to_oklab(rgb1), rgb_to_oklab(rgb2)
    mixed = tuple(x + (y - x) * t for x, y in zip(a, b, strict=True))
    return tuple(min(255.0, max(0.0, v)) for v in oklab_to_rgb(mixed))  # type: ignore[return-value]


# Cylindrical forms ------------------------------------------------------------
# LCh of CIELAB or of OKLab: lightness, chroma and hue angle in degrees [0, 360).
# Hue edits (hair colour, lip tint) rotate h and keep L and C.

def lab_to_lch(lab: Sequence[float]) -> tuple[float, float, float]:
    light, a, b = _triplet(lab)
    hue = math.degrees(math.atan2(b, a)) % 360 if (a or b) else 0.0
    return light, math.hypot(a, b), hue


def lch_to_lab(lch: Sequence[float]) -> tuple[float, float, float]:
    light, chroma, hue = _triplet(lch)
    if chroma < 0:
        raise ValueError("chroma must not be negative")
    rad = math.radians(hue)
    return light, chroma * math.cos(rad), chroma * math.sin(rad)


def rotate_hue(rgb: Sequence[float], degrees: float) -> tuple[float, float, float]:
    """Turn an 8-bit sRGB colour's OKLCh hue by `degrees`, keeping lightness and chroma.

    Results outside the sRGB gamut are clipped to 0..255."""
    light, chroma, hue = lab_to_lch(rgb_to_oklab(rgb))
    turned = oklab_to_rgb(lch_to_lab((light, chroma, (hue + float(degrees)) % 360)))
    return tuple(min(255.0, max(0.0, v)) for v in turned)  # type: ignore[return-value]


# Whole images -------------------------------------------------------------------

def srgb_to_lab_array(values: np.ndarray) -> np.ndarray:
    """Vectorised rgb_to_lab for (..., 3) arrays of 0..255 sRGB values (uint8 or float)."""
    arr = np.asarray(values, dtype=np.float64)
    if arr.shape[-1] != 3 or not np.all(np.isfinite(arr)):
        raise ValueError("expected finite (..., 3) sRGB values")
    c = np.clip(arr / 255, 0, 1)
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    x = 100 * (0.4124564 * lin[..., 0] + 0.3575761 * lin[..., 1] + 0.1804375 * lin[..., 2]) / WHITE_D65[0]
    y = 100 * (0.2126729 * lin[..., 0] + 0.7151522 * lin[..., 1] + 0.0721750 * lin[..., 2]) / WHITE_D65[1]
    z = 100 * (0.0193339 * lin[..., 0] + 0.1191920 * lin[..., 1] + 0.9503041 * lin[..., 2]) / WHITE_D65[2]
    d = 6 / 29

    def f(t: np.ndarray) -> np.ndarray:
        return np.where(t > d ** 3, np.cbrt(t), t / (3 * d * d) + 4 / 29)

    fx, fy, fz = f(x), f(y), f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], axis=-1)

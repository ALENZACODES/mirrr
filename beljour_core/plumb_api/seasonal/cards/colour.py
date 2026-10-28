"""Colour maths for cards: parsing, WCAG contrast, CIELAB distance and colour-vision simulation.

Contrast follows WCAG 2.2 (relative luminance, ratio (L1 + 0.05) / (L2 + 0.05), AA body text
needs 4.5:1). Colour-vision simulation uses the severity 1.0 matrices published in
Machado, Oliveira and Fernandes, "A Physiologically-based Model for Simulation of Color Vision
Deficiency", IEEE TVCG 15(6), 2009, applied to linear sRGB.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass

RGB = tuple[int, int, int]

WCAG_AA_TEXT = 4.5
WCAG_AA_LARGE = 3.0

_HEX = re.compile(r"^#([0-9a-fA-F]{6})$")

MACHADO_2009: dict[str, tuple[tuple[float, float, float], ...]] = {
    "protanopia": (
        (0.152286, 1.052583, -0.204868),
        (0.114503, 0.786281, 0.099216),
        (-0.003882, -0.048116, 1.051998),
    ),
    "deuteranopia": (
        (0.367322, 0.860646, -0.227968),
        (0.280085, 0.672501, 0.047413),
        (-0.011820, 0.042940, 0.968881),
    ),
    "tritanopia": (
        (1.255528, -0.076749, -0.178779),
        (-0.078411, 0.930809, 0.147602),
        (0.004733, 0.691367, 0.303900),
    ),
}


def parse_hex(value: str) -> RGB:
    """Parse '#rrggbb' into an RGB tuple; raise ValueError on any other form."""
    match = _HEX.match(value)
    if match is None:
        raise ValueError(f"not a #rrggbb colour: {value!r}")
    digits = match.group(1)
    return (int(digits[0:2], 16), int(digits[2:4], 16), int(digits[4:6], 16))


def to_hex(rgb: RGB) -> str:
    """Format an RGB tuple as lower-case '#rrggbb'."""
    return "#{:02x}{:02x}{:02x}".format(*(_clamp_byte(c) for c in rgb))


def _clamp_byte(value: float) -> int:
    return max(0, min(255, int(round(value))))


def srgb_to_linear(channel: int) -> float:
    """Convert one 8-bit sRGB channel to linear light in [0, 1]."""
    c = channel / 255.0
    if c <= 0.04045:
        return c / 12.92
    return float(((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(value: float) -> int:
    """Convert linear light in [0, 1] back to an 8-bit sRGB channel."""
    v = min(1.0, max(0.0, value))
    if v <= 0.0031308:
        return _clamp_byte(v * 12.92 * 255.0)
    return _clamp_byte((1.055 * v ** (1.0 / 2.4) - 0.055) * 255.0)


def relative_luminance(rgb: RGB) -> float:
    """WCAG 2.2 relative luminance of an sRGB colour."""
    r, g, b = (srgb_to_linear(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(a: RGB, b: RGB) -> float:
    """WCAG 2.2 contrast ratio between two colours, from 1.0 to 21.0."""
    la = relative_luminance(a)
    lb = relative_luminance(b)
    hi, lo = (la, lb) if la >= lb else (lb, la)
    return (hi + 0.05) / (lo + 0.05)


def best_ink(background: RGB, dark: RGB = (20, 18, 24), light: RGB = (250, 248, 244)) -> RGB:
    """Return whichever of the dark or light ink reads better on the background."""
    if contrast_ratio(dark, background) >= contrast_ratio(light, background):
        return dark
    return light


def mix(a: RGB, b: RGB, t: float) -> RGB:
    """Linear blend in sRGB space; t=0 gives a, t=1 gives b."""
    return (
        _clamp_byte(a[0] + (b[0] - a[0]) * t),
        _clamp_byte(a[1] + (b[1] - a[1]) * t),
        _clamp_byte(a[2] + (b[2] - a[2]) * t),
    )


def simulate_cvd(rgb: RGB, kind: str) -> RGB:
    """Simulate how a colour appears with full protanopia, deuteranopia or tritanopia."""
    matrix = MACHADO_2009.get(kind)
    if matrix is None:
        raise ValueError(f"unknown colour-vision deficiency: {kind!r}")
    lin = [srgb_to_linear(c) for c in rgb]
    out = [sum(row[i] * lin[i] for i in range(3)) for row in matrix]
    return (linear_to_srgb(out[0]), linear_to_srgb(out[1]), linear_to_srgb(out[2]))


def to_lab(rgb: RGB) -> tuple[float, float, float]:
    """Convert sRGB (D65) to CIELAB."""
    r, g, b = (srgb_to_linear(c) for c in rgb)
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883

    def f(t: float) -> float:
        if t > 216.0 / 24389.0:
            return float(t ** (1.0 / 3.0))
        return (24389.0 / 27.0 * t + 16.0) / 116.0

    fx, fy, fz = f(x), f(y), f(z)
    return (116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz))


def delta_e(a: RGB, b: RGB) -> float:
    """CIE76 colour difference; about 2.3 is a just noticeable difference."""
    la, lb = to_lab(a), to_lab(b)
    return math.sqrt(sum((p - q) ** 2 for p, q in zip(la, lb, strict=True)))


@dataclass(frozen=True)
class CvdPairResult:
    """Contrast and colour difference of one colour pair under one vision type."""

    vision: str
    contrast: float
    delta_e: float


def cvd_pair_report(fg: RGB, bg: RGB) -> tuple[CvdPairResult, ...]:
    """Contrast and Delta E of a pair for typical vision and the three dichromacies."""
    rows = [CvdPairResult("typical", contrast_ratio(fg, bg), delta_e(fg, bg))]
    for kind in MACHADO_2009:
        sf = simulate_cvd(fg, kind)
        sb = simulate_cvd(bg, kind)
        rows.append(CvdPairResult(kind, contrast_ratio(sf, sb), delta_e(sf, sb)))
    return tuple(rows)


def from_lab(lab: tuple[float, float, float]) -> RGB:
    """Convert CIELAB (D65) back to sRGB, clipping to the displayable range."""
    lightness, a, b = lab
    fy = (lightness + 16.0) / 116.0
    fx = fy + a / 500.0
    fz = fy - b / 200.0

    def finv(t: float) -> float:
        if t ** 3 > 216.0 / 24389.0:
            return t ** 3
        return (116.0 * t - 16.0) * 27.0 / 24389.0

    x, y, z = finv(fx) * 0.95047, finv(fy), finv(fz) * 1.08883
    r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
    g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z
    bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z
    return (linear_to_srgb(r), linear_to_srgb(g), linear_to_srgb(bl))


def total_ink(rgb: RGB) -> float:
    """Naive CMYK total area coverage of an sRGB colour, 0.0 to 3.0 (300 percent)."""
    r, g, b = (c / 255.0 for c in rgb)
    k = 1.0 - max(r, g, b)
    if k >= 1.0:
        return 1.0
    c = (1.0 - r - k) / (1.0 - k)
    m = (1.0 - g - k) / (1.0 - k)
    y = (1.0 - b - k) / (1.0 - k)
    return c + m + y + k

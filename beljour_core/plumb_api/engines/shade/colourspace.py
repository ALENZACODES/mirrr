"""Array colour conversions for the shade, lighting and hair-colour engines (W6, W98, W39, W28).

sRGB (IEC 61966-2-1) <-> linear light <-> CIE XYZ (D65) <-> CIELAB, vectorised on (..., 3)
arrays. The forward Lab path reuses engines/core/colour.py so all engines agree; this module
adds the inverse and the linear-light helpers they need. Matrices are the sRGB/D65 ones
already used by engines/core/colour.py. Mirrored in web/src/engines/shade/colourspace.ts.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np

from ..core.colour import WHITE_D65, ciede2000, srgb_to_lab_array

RGB_TO_XYZ = np.array([[0.4124564, 0.3575761, 0.1804375],
                       [0.2126729, 0.7151522, 0.0721750],
                       [0.0193339, 0.1191920, 0.9503041]], dtype=np.float64)
XYZ_TO_RGB = np.linalg.inv(RGB_TO_XYZ)
WHITE = np.asarray(WHITE_D65, dtype=np.float64) / 100.0
_D = 6.0 / 29.0


def check_rgb(values: object) -> np.ndarray:
    arr = np.asarray(values, dtype=np.float64)
    if arr.ndim < 1 or arr.shape[-1] != 3 or not np.all(np.isfinite(arr)):
        raise ValueError("expected finite (..., 3) sRGB values")
    return arr


def decode(values: object) -> np.ndarray:
    """0..255 sRGB to linear light in 0..1."""
    c = np.clip(check_rgb(values) / 255.0, 0.0, 1.0)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def encode(linear: object) -> np.ndarray:
    """Linear light (clipped to 0..1) to 0..255 sRGB floats."""
    c = np.clip(np.asarray(linear, dtype=np.float64), 0.0, 1.0)
    return 255.0 * np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def to_bytes(values: object) -> np.ndarray:
    """Round half to even, as NumPy's rint and the web buffers do."""
    return np.clip(np.rint(np.asarray(values, dtype=np.float64)), 0, 255).astype(np.uint8)


def srgb_to_lab(values: object) -> np.ndarray:
    return srgb_to_lab_array(check_rgb(values))


def linear_to_xyz(linear: object) -> np.ndarray:
    return np.asarray(linear, dtype=np.float64) @ RGB_TO_XYZ.T


def xyz_to_linear(xyz: object) -> np.ndarray:
    return np.asarray(xyz, dtype=np.float64) @ XYZ_TO_RGB.T


def xyz_to_lab(xyz: object, white: object = WHITE) -> np.ndarray:
    """XYZ with Y in 0..1 to CIELAB relative to `white` (default D65)."""
    w = np.asarray(white, dtype=np.float64)
    t = np.asarray(xyz, dtype=np.float64) / w

    def f(v: np.ndarray) -> np.ndarray:
        return np.where(v > _D ** 3, np.cbrt(v), v / (3 * _D * _D) + 4.0 / 29.0)

    fx, fy, fz = f(t[..., 0]), f(t[..., 1]), f(t[..., 2])
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], axis=-1)


def lab_to_xyz(lab: object, white: object = WHITE) -> np.ndarray:
    arr = np.asarray(lab, dtype=np.float64)
    if arr.ndim < 1 or arr.shape[-1] != 3 or not np.all(np.isfinite(arr)):
        raise ValueError("expected finite (..., 3) Lab values")
    fy = (arr[..., 0] + 16) / 116
    fx = fy + arr[..., 1] / 500
    fz = fy - arr[..., 2] / 200

    def finv(v: np.ndarray) -> np.ndarray:
        return np.where(v > _D, v ** 3, 3 * _D * _D * (v - 4.0 / 29.0))

    return np.stack([finv(fx), finv(fy), finv(fz)], axis=-1) * np.asarray(white, dtype=np.float64)


def lab_to_srgb(lab: object) -> np.ndarray:
    """CIELAB (D65) to 0..255 sRGB floats; out-of-gamut values are clipped in linear light."""
    return encode(xyz_to_linear(lab_to_xyz(lab)))


def lab_to_lch(lab: object) -> np.ndarray:
    arr = np.asarray(lab, dtype=np.float64)
    hue = np.degrees(np.arctan2(arr[..., 2], arr[..., 1])) % 360.0
    return np.stack([arr[..., 0], np.hypot(arr[..., 1], arr[..., 2]), hue], axis=-1)


def lch_to_lab(lch: object) -> np.ndarray:
    arr = np.asarray(lch, dtype=np.float64)
    rad = np.radians(arr[..., 2])
    return np.stack([arr[..., 0], arr[..., 1] * np.cos(rad), arr[..., 1] * np.sin(rad)], axis=-1)


def luminance(linear: object) -> np.ndarray:
    return np.asarray(linear, dtype=np.float64) @ RGB_TO_XYZ[1]


def delta_e(lab1: object, lab2: object) -> float:
    """CIEDE2000 (engines/core/colour.py, checked against Sharma 2005) for arrays or sequences."""
    a = np.asarray(lab1, dtype=np.float64).reshape(3)
    b = np.asarray(lab2, dtype=np.float64).reshape(3)
    return ciede2000((float(a[0]), float(a[1]), float(a[2])), (float(b[0]), float(b[1]), float(b[2])))

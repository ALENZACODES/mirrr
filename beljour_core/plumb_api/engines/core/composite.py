"""Local pixel compositing with explicit alpha and colour-domain semantics.

Compositing is in linear-light RGB by default so edge transitions do not darken.
Raw image arrays are 8-bit sRGB RGB or RGBA; masks are independent H x W float.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np

from .masks import as_mask


def _image(image: np.ndarray) -> np.ndarray:
    img = np.asarray(image)
    if img.ndim != 3 or img.shape[2] not in (3, 4) or img.dtype != np.uint8:
        raise ValueError("image must be H x W x 3/4 uint8")
    if not img.shape[0] or not img.shape[1]:
        raise ValueError("image must not be empty")
    return img


def decode(image: np.ndarray) -> np.ndarray:
    """Decode an sRGB array to floating linear RGB in [0,1]."""
    value = _image(image)[..., :3].astype(np.float64) / 255
    return np.where(value <= 0.04045, value / 12.92, ((value + 0.055) / 1.055) ** 2.4)


def encode(linear: np.ndarray) -> np.ndarray:
    """Encode floating linear RGB, clip out-of-gamut before quantization."""
    arr = np.asarray(linear, np.float64)
    if arr.ndim != 3 or arr.shape[2] != 3 or not np.all(np.isfinite(arr)):
        raise ValueError("expected finite H x W x 3 linear pixels")
    value = np.clip(arr, 0, 1)
    encoded = np.where(value <= 0.0031308, value * 12.92,
                       1.055 * np.power(value, 1 / 2.4) - 0.055)
    return np.rint(encoded * 255).astype(np.uint8)


def blend(base: np.ndarray, overlay: np.ndarray, mask: np.ndarray,
          *, linear_light: bool = True) -> np.ndarray:
    """Non-destructive weighted blend. Both inputs must have identical dimensions."""
    a, b = _image(base), _image(overlay)
    if a.shape != b.shape:
        raise ValueError("base and overlay dimensions must match")
    alpha = as_mask(mask, a.shape[:2])[..., None]
    if linear_light:
        rgb = encode(decode(a) * (1 - alpha) + decode(b) * alpha)
    else:
        rgb = np.rint(a[..., :3] * (1 - alpha) + b[..., :3] * alpha).astype(np.uint8)
    if a.shape[2] == 3:
        return rgb
    fourth = np.rint(a[..., 3:4] * (1 - alpha) + b[..., 3:4] * alpha).astype(np.uint8)
    return np.concatenate([rgb, fourth], axis=2)


def solid(base: np.ndarray, color: tuple[int, int, int], mask: np.ndarray,
          strength: float = 1) -> np.ndarray:
    if not 0 <= strength <= 1 or len(color) != 3 or any(not 0 <= c <= 255 for c in color):
        raise ValueError("invalid colour or strength")
    image = _image(base)
    overlay = image.copy()
    overlay[..., :3] = np.array(color, dtype=np.uint8)
    return blend(image, overlay, as_mask(mask, image.shape[:2]) * strength)


def difference_mask(before: np.ndarray, after: np.ndarray, tolerance: int = 0) -> np.ndarray:
    a, b = _image(before), _image(after)
    if a.shape != b.shape or tolerance < 0 or tolerance > 255:
        raise ValueError("incompatible images or invalid tolerance")
    return (np.max(np.abs(a.astype(np.int16) - b.astype(np.int16)), axis=2) > tolerance).astype(np.float32)


def luminance(image: np.ndarray) -> np.ndarray:
    return np.sum(decode(image) * [0.2126, 0.7152, 0.0722], axis=2)


def exposure(image: np.ndarray, stops: float, mask: np.ndarray | None = None) -> np.ndarray:
    if not np.isfinite(stops) or abs(stops) > 8:
        raise ValueError("exposure must be finite and within +/-8 stops")
    base = _image(image)
    target = encode(decode(base) * (2 ** stops))
    if base.shape[2] == 4:
        target = np.concatenate([target, base[..., 3:4]], axis=2)
    if mask is None:
        return target
    return blend(base, target, mask)

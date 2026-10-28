"""Masks are floating point alpha fields, with zero meaning untouched.

Functions never mutate their inputs; image and mask dimensions are validated before
arithmetic. Soft masks can be used for skin retouch and separate local face controls.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .filters import box_mean

Mask = NDArray[np.float32]


def as_mask(data: np.ndarray, shape: tuple[int, int] | None = None) -> Mask:
    arr = np.asarray(data, dtype=np.float32)
    if arr.ndim != 2 or (shape is not None and arr.shape != shape):
        raise ValueError("mask must be H x W, matching image size")
    if not np.all(np.isfinite(arr)) or np.any((arr < 0) | (arr > 1)):
        raise ValueError("mask alpha must be finite and in [0, 1]")
    return arr.copy()


def empty(height: int, width: int) -> Mask:
    if min(height, width) <= 0:
        raise ValueError("positive mask dimensions required")
    return np.zeros((height, width), np.float32)


def full(height: int, width: int) -> Mask:
    if min(height, width) <= 0:
        raise ValueError("positive mask dimensions required")
    return np.ones((height, width), np.float32)


def rectangle(height: int, width: int, left: int, top: int, right: int, bottom: int) -> Mask:
    """Half-open rectangle, clipped to image bounds."""
    out = empty(height, width)
    if right < left or bottom < top:
        raise ValueError("reversed rectangle")
    out[max(0, top):min(height, bottom), max(0, left):min(width, right)] = 1
    return out


def ellipse(height: int, width: int, cx: float, cy: float,
            rx: float, ry: float, feather: float = 0) -> Mask:
    if rx <= 0 or ry <= 0 or feather < 0 or feather >= 1:
        raise ValueError("ellipse radii must be positive and feather in [0,1)")
    y, x = np.ogrid[:height, :width]
    radius = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    if feather == 0:
        return (radius <= 1).astype(np.float32)
    return np.clip((1 - radius) / feather, 0, 1).astype(np.float32)


def union(*layers: np.ndarray) -> Mask:
    if not layers:
        raise ValueError("at least one mask is required")
    first = as_mask(layers[0])
    for layer in layers[1:]:
        item = as_mask(layer, first.shape)
        first = 1 - (1 - first) * (1 - item)
    return first.astype(np.float32)


def intersection(*layers: np.ndarray) -> Mask:
    if not layers:
        raise ValueError("at least one mask is required")
    first = as_mask(layers[0])
    for layer in layers[1:]:
        first *= as_mask(layer, first.shape)
    return first


def subtract(source: np.ndarray, removal: np.ndarray) -> Mask:
    first = as_mask(source)
    return first * (1 - as_mask(removal, first.shape))


def invert(mask: np.ndarray) -> Mask:
    return 1 - as_mask(mask)


def threshold(mask: np.ndarray, minimum: float = 0.5) -> Mask:
    if not 0 <= minimum <= 1:
        raise ValueError("threshold must be [0,1]")
    return (as_mask(mask) >= minimum).astype(np.float32)


def blur(mask: np.ndarray, radius: int) -> Mask:
    """Separable box blur with replicated edges (see filters.box_mean)."""
    source = as_mask(mask)
    if radius < 0 or radius > 512:
        raise ValueError("radius must be between 0 and 512")
    if radius == 0:
        return source
    return np.clip(box_mean(source, radius), 0, 1).astype(np.float32)


def coverage(mask: np.ndarray) -> float:
    return float(as_mask(mask).mean())


def bounding_box(mask: np.ndarray, minimum: float = 0.0) -> tuple[int, int, int, int] | None:
    if not 0 <= minimum < 1:
        raise ValueError("minimum must be in [0,1)")
    y, x = np.nonzero(as_mask(mask) > minimum)
    if not len(x):
        return None
    return int(np.min(x)), int(np.min(y)), int(np.max(x)) + 1, int(np.max(y)) + 1

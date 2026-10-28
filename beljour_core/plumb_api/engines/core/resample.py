"""Backward-mapped resampling in linear light, and the Jacobian of a mapping.

A warp is a pair of maps: output pixel (col, row) reads the source at
(map_x[row, col], map_y[row, col]), with pixel centres at integer coordinates.
Bilinear taps are decoded from sRGB to linear light before they are mixed, so a
warped edge between a dark and a light area does not pick up a dark fringe. RGBA
sources are premultiplied by alpha first, so transparent pixels do not bleed colour.

Borders: "edge" clamps coordinates into the image; "constant" treats every tap
outside the image as transparent black (an opaque RGB source fades to black there).
Mirrored in `web/src/engines/core/buffer.ts` (`remap`).
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .composite import _image
from .filters import gradient

Floats = NDArray[np.float64]
BORDERS = ("edge", "constant")

_LINEAR = np.where(np.arange(256) / 255.0 <= 0.04045, np.arange(256) / 255.0 / 12.92,
                   ((np.arange(256) / 255.0 + 0.055) / 1.055) ** 2.4)


def _maps(map_x: np.ndarray, map_y: np.ndarray) -> tuple[Floats, Floats]:
    mx = np.asarray(map_x, dtype=np.float64)
    my = np.asarray(map_y, dtype=np.float64)
    if mx.shape != my.shape or mx.ndim != 2 or 0 in mx.shape:
        raise ValueError("map_x and map_y must be matching, non-empty H x W arrays")
    if not (np.all(np.isfinite(mx)) and np.all(np.isfinite(my))):
        raise ValueError("maps must be finite")
    return mx, my


def identity(height: int, width: int) -> tuple[Floats, Floats]:
    if height < 1 or width < 1:
        raise ValueError("size must be positive")
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    return xx, yy


def _encode(linear: Floats) -> np.ndarray:
    v = np.clip(linear, 0.0, 1.0)
    out = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
    return np.rint(out * 255).astype(np.uint8)


def remap(image: np.ndarray, map_x: np.ndarray, map_y: np.ndarray, *,
          border: str = "edge", linear_light: bool = True) -> np.ndarray:
    """Sample `image` (uint8 RGB or RGBA) through the maps; output has the maps' size."""
    src = _image(image)
    mx, my = _maps(map_x, map_y)
    if border not in BORDERS:
        raise ValueError("border must be 'edge' or 'constant'")
    h, w, channels = src.shape
    values = _LINEAR[src[..., :3]] if linear_light else src[..., :3] / 255.0
    has_alpha = channels == 4
    alpha = src[..., 3] / 255.0 if has_alpha else np.ones((h, w))
    work = np.concatenate([values * alpha[..., None], alpha[..., None]], axis=2)
    if border == "edge":
        mx = np.clip(mx, 0, w - 1)
        my = np.clip(my, 0, h - 1)
    x0 = np.floor(mx).astype(np.int64)
    y0 = np.floor(my).astype(np.int64)
    fx = (mx - x0)[..., None]
    fy = (my - y0)[..., None]
    acc = np.zeros(mx.shape + (4,))
    for dy, wy in ((0, 1 - fy), (1, fy)):
        for dx, wx in ((0, 1 - fx), (1, fx)):
            xi, yi = x0 + dx, y0 + dy
            if border == "edge":
                xi, yi = np.minimum(xi, w - 1), np.minimum(yi, h - 1)
                acc = acc + work[yi, xi] * (wx * wy)
            else:
                ok = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)
                tap = work[np.clip(yi, 0, h - 1), np.clip(xi, 0, w - 1)]
                acc = acc + np.where(ok[..., None], tap, 0.0) * (wx * wy)
    out_alpha = acc[..., 3]
    if has_alpha:
        with np.errstate(divide="ignore", invalid="ignore"):
            colour = np.where(out_alpha[..., None] > 0, acc[..., :3] / out_alpha[..., None], 0.0)
    else:
        colour = acc[..., :3]       # opaque source: missing taps fade to black
    rgb = _encode(colour) if linear_light else np.rint(np.clip(colour, 0, 1) * 255).astype(np.uint8)
    if has_alpha:
        return np.concatenate([rgb, np.rint(np.clip(out_alpha, 0, 1) * 255).astype(np.uint8)[..., None]], axis=2)
    return rgb


def jacobian_determinant(map_x: np.ndarray, map_y: np.ndarray) -> Floats:
    """Local area scale of the mapping; <= 0 where it folds over itself."""
    mx, my = _maps(map_x, map_y)
    xx, xy = gradient(mx)
    yx, yy = gradient(my)
    return xx * yy - xy * yx


# Resizing ------------------------------------------------------------------------

def _area_weights(source: int, target: int) -> Floats:
    """target x source matrix: each output sample averages the source span it covers."""
    scale = source / target
    out = np.zeros((target, source))
    for i in range(target):
        start, stop = i * scale, (i + 1) * scale
        first, last = int(np.floor(start)), min(source, int(np.ceil(stop)))
        for j in range(first, last):
            out[i, j] = (min(stop, j + 1) - max(start, j)) / scale
    return out


def resize_area(image: np.ndarray, width: int, height: int) -> np.ndarray:
    """Shrink by exact area averaging in linear light (premultiplied for RGBA).

    For enlarging use `resize_bilinear`; area averaging only ever shrinks or keeps size."""
    src = _image(image)
    h, w, channels = src.shape
    if not (1 <= width <= w and 1 <= height <= h):
        raise ValueError("area resize only shrinks; the target must be 1..source size")
    alpha = src[..., 3] / 255.0 if channels == 4 else np.ones((h, w))
    work = np.concatenate([_LINEAR[src[..., :3]] * alpha[..., None], alpha[..., None]], axis=2)
    wy, wx = _area_weights(h, height), _area_weights(w, width)
    small = np.einsum("ij,jkc->ikc", wy, work)
    small = np.einsum("lk,ikc->ilc", wx, small)
    out_alpha = small[..., 3]
    if channels == 4:
        with np.errstate(divide="ignore", invalid="ignore"):
            colour = np.where(out_alpha[..., None] > 0, small[..., :3] / out_alpha[..., None], 0.0)
        a8 = np.rint(np.clip(out_alpha, 0, 1) * 255).astype(np.uint8)[..., None]
        return np.concatenate([_encode(colour), a8], axis=2)
    return _encode(small[..., :3])


def resize_bilinear(image: np.ndarray, width: int, height: int) -> np.ndarray:
    """Resize with pixel-centre aligned bilinear sampling in linear light (edges clamped)."""
    src = _image(image)
    h, w = src.shape[:2]
    if width < 1 or height < 1:
        raise ValueError("target size must be positive")
    xs = (np.arange(width) + 0.5) * (w / width) - 0.5
    ys = (np.arange(height) + 0.5) * (h / height) - 0.5
    mx, my = np.meshgrid(xs, ys)
    return remap(src, mx, my, border="edge", linear_light=True)


def resize(image: np.ndarray, width: int, height: int) -> np.ndarray:
    """Area averaging when both sides shrink or stay, bilinear otherwise."""
    h, w = _image(image).shape[:2]
    if width <= w and height <= h:
        return resize_area(image, width, height)
    return resize_bilinear(image, width, height)

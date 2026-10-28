"""Shared local primitives for Lane B easy filters. Author: John Khan."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

Image = NDArray[np.uint8]
Mask = NDArray[np.uint8]
RGB = tuple[int, int, int]


@dataclass(frozen=True)
class Point:
    x: float
    y: float


def validate_image(image: Image) -> tuple[int, int]:
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[2] not in (3, 4):
        raise ValueError("image must be uint8 RGB or RGBA")
    return int(arr.shape[0]), int(arr.shape[1])


def validate_mask(mask: Mask, height: int, width: int, name: str) -> Mask:
    arr = np.asarray(mask)
    if arr.dtype != np.uint8 or arr.shape != (height, width):
        raise ValueError(f"{name} must be uint8 HxW")
    return arr


def blank_mask(height: int, width: int) -> Mask:
    return np.zeros((height, width), dtype=np.uint8)


def solid_mask(height: int, width: int, value: int = 255) -> Mask:
    if not 0 <= value <= 255:
        raise ValueError("mask value must be 0..255")
    return np.full((height, width), value, dtype=np.uint8)


def mask_union(*masks: Mask) -> Mask:
    if not masks:
        raise ValueError("at least one mask required")
    stacked = np.stack(tuple(np.asarray(mask, dtype=np.uint8) for mask in masks), axis=0)
    return np.max(stacked, axis=0).astype(np.uint8, copy=False)


def mask_subtract(mask: Mask, remove: Mask) -> Mask:
    a = np.asarray(mask, dtype=np.int16)
    b = np.asarray(remove, dtype=np.int16)
    return np.clip(a - b, 0, 255).astype(np.uint8)


def alpha_blend(image: Image, colour: RGB, mask: Mask, amount: int = 255) -> Image:
    """Integer alpha blend with deterministic round-half-up semantics."""
    if not 0 <= amount <= 255:
        raise ValueError("amount must be 0..255")
    height, width = validate_image(image)
    m = validate_mask(mask, height, width, "mask").astype(np.int32)
    alpha = (m * amount + 127) // 255
    out = np.asarray(image).copy()
    rgb = out[..., :3].astype(np.int32)
    target = np.array(colour, dtype=np.int32).reshape(1, 1, 3)
    mixed = (rgb * (255 - alpha[..., None]) + target * alpha[..., None] + 127) // 255
    out[..., :3] = np.clip(mixed, 0, 255).astype(np.uint8)
    return out


def restore(image: Image, original: Image, protected: Mask | None) -> Image:
    if protected is None:
        return image
    height, width = validate_image(image)
    p = validate_mask(protected, height, width, "protected") > 0
    out = image.copy()
    out[p] = original[p]
    return out


def ellipse_mask(
    height: int,
    width: int,
    centre: Point,
    radius_x: float,
    radius_y: float,
) -> Mask:
    if radius_x <= 0 or radius_y <= 0:
        raise ValueError("ellipse radii must be positive")
    yy, xx = np.mgrid[0:height, 0:width]
    d = ((xx + 0.5 - centre.x) / radius_x) ** 2 + ((yy + 0.5 - centre.y) / radius_y) ** 2
    return np.where(d <= 1.0, 255, 0).astype(np.uint8)


def ring_mask(
    height: int,
    width: int,
    centre: Point,
    outer_x: float,
    outer_y: float,
    inner_fraction: float,
) -> Mask:
    if not 0.0 <= inner_fraction < 1.0:
        raise ValueError("inner_fraction must be in [0,1)")
    outer = ellipse_mask(height, width, centre, outer_x, outer_y)
    inner = ellipse_mask(height, width, centre, outer_x * inner_fraction, outer_y * inner_fraction)
    return mask_subtract(outer, inner)


def line_mask(
    height: int,
    width: int,
    start: Point,
    end: Point,
    thickness: float,
) -> Mask:
    if thickness <= 0:
        raise ValueError("thickness must be positive")
    yy, xx = np.mgrid[0:height, 0:width]
    px = xx + 0.5
    py = yy + 0.5
    vx = end.x - start.x
    vy = end.y - start.y
    denom = vx * vx + vy * vy
    if denom <= 1e-12:
        return ellipse_mask(height, width, start, thickness, thickness)
    t = np.clip(((px - start.x) * vx + (py - start.y) * vy) / denom, 0.0, 1.0)
    dx = px - (start.x + t * vx)
    dy = py - (start.y + t * vy)
    return np.where(dx * dx + dy * dy <= thickness * thickness, 255, 0).astype(np.uint8)


def triangle_mask(height: int, width: int, a: Point, b: Point, c: Point) -> Mask:
    yy, xx = np.mgrid[0:height, 0:width]
    px = xx + 0.5
    py = yy + 0.5

    def edge(p1: Point, p2: Point) -> NDArray[np.float64]:
        return (px - p1.x) * (p2.y - p1.y) - (py - p1.y) * (p2.x - p1.x)

    e1 = edge(a, b)
    e2 = edge(b, c)
    e3 = edge(c, a)
    positive = (e1 >= 0) & (e2 >= 0) & (e3 >= 0)
    negative = (e1 <= 0) & (e2 <= 0) & (e3 <= 0)
    return np.where(positive | negative, 255, 0).astype(np.uint8)


def deterministic_noise(height: int, width: int, seed: int) -> NDArray[np.int16]:
    yy, xx = np.mgrid[0:height, 0:width].astype(np.int64)
    value = (xx * 73856093 + yy * 19349663 + int(seed) * 83492791) & 0xFFFFFFFF
    value ^= value >> 13
    value = (value * 1274126177) & 0xFFFFFFFF
    return ((value & 255).astype(np.int16) - 128)


def image_sha256(image: Image) -> str:
    return hashlib.sha256(np.asarray(image, dtype=np.uint8).tobytes()).hexdigest()


def unchanged_fraction(before: Image, after: Image, mask: Mask) -> float:
    height, width = validate_image(before)
    validate_image(after)
    keep = validate_mask(mask, height, width, "mask") > 0
    count = int(np.count_nonzero(keep))
    if count == 0:
        return 1.0
    same = np.all(before[keep] == after[keep], axis=1)
    return float(np.count_nonzero(same)) / float(count)

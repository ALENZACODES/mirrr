"""Source-anchored brush and feathered gradient masks for small CPU oracles.

Coordinates are fractions of the unrotated image; a caller can sample at any
source position after using ``inverse_point`` to undo crop and rotation.
The production browser implementation evaluates its own bounded byte raster.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal, TypeAlias

Mode = Literal["add", "subtract"]


def _fraction(value: float, name: str, low: float = 0, high: float = 1) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        raise ValueError(f"mask {name} must be a finite number")
    if not math.isfinite(value) or not low <= value <= high:
        raise ValueError(f"mask {name} out of bounds")
    return float(value)


@dataclass(frozen=True)
class Point:
    x: float
    y: float

    def __post_init__(self) -> None:
        _fraction(self.x, "x")
        _fraction(self.y, "y")


@dataclass(frozen=True)
class Brush:
    points: tuple[Point, ...]
    radius: float
    hardness: float = 0.6
    opacity: float = 1
    mode: Mode = "add"
    kind: Literal["brush"] = "brush"

    def __post_init__(self) -> None:
        if not 1 <= len(self.points) <= 48 or not all(isinstance(point, Point) for point in self.points):
            raise ValueError("brush must contain 1 to 48 points")
        _fraction(self.radius, "radius", 0.0005, 0.5)
        _fraction(self.hardness, "hardness")
        _base(self.mode, self.opacity)


@dataclass(frozen=True)
class Linear:
    start: Point
    end: Point
    feather: float = 1
    opacity: float = 1
    mode: Mode = "add"
    kind: Literal["linear"] = "linear"

    def __post_init__(self) -> None:
        if not isinstance(self.start, Point) or not isinstance(self.end, Point):
            raise ValueError("linear gradient endpoints must be points")
        if (self.start.x - self.end.x) ** 2 + (self.start.y - self.end.y) ** 2 < 1e-10:
            raise ValueError("linear gradient endpoints must differ")
        _fraction(self.feather, "feather")
        _base(self.mode, self.opacity)


@dataclass(frozen=True)
class Radial:
    center: Point
    radius_x: float
    radius_y: float
    feather: float = 0.5
    opacity: float = 1
    mode: Mode = "add"
    kind: Literal["radial"] = "radial"

    def __post_init__(self) -> None:
        if not isinstance(self.center, Point):
            raise ValueError("radial center must be a point")
        _fraction(self.radius_x, "radius x", 0.0005)
        _fraction(self.radius_y, "radius y", 0.0005)
        _fraction(self.feather, "feather")
        _base(self.mode, self.opacity)


Mask: TypeAlias = Brush | Linear | Radial


def _base(mode: Mode, opacity: float) -> None:
    if mode not in ("add", "subtract"):
        raise ValueError("unknown mask operation")
    _fraction(opacity, "opacity")


def validate_masks(masks: tuple[Mask, ...]) -> None:
    if not isinstance(masks, tuple) or len(masks) > 16:
        raise ValueError("masks must be a tuple of at most sixteen shapes")
    if not all(isinstance(shape, (Brush, Linear, Radial)) for shape in masks):
        raise ValueError("invalid mask type")


def _smooth(value: float) -> float:
    t = min(1.0, max(0.0, value))
    return t * t * (3 - 2 * t)


def sample_mask(mask: Mask, x: float, y: float, width: int, height: int) -> float:
    """Return opacity in [0,1] before applying add/subtract operations."""
    if width <= 0 or height <= 0 or not math.isfinite(x) or not math.isfinite(y):
        raise ValueError("invalid mask sample dimensions or coordinate")
    if isinstance(mask, Linear):
        dx = mask.end.x - mask.start.x
        dy = mask.end.y - mask.start.y
        t = ((x - mask.start.x) * dx + (y - mask.start.y) * dy) / (dx * dx + dy * dy)
        return float(t >= 0.5) if mask.feather == 0 else _smooth((t - 0.5) / mask.feather + 0.5)
    if isinstance(mask, Radial):
        dx = (x - mask.center.x) / mask.radius_x
        dy = (y - mask.center.y) / mask.radius_y
        distance = math.hypot(dx, dy)
        if mask.feather == 0:
            return float(distance <= 1)
        return 1 - _smooth((distance - (1 - mask.feather)) / mask.feather)
    radius = mask.radius * min(width, height)
    px = x * width
    py = y * height
    distance_sq = math.inf
    for index, point in enumerate(mask.points):
        xx, yy = point.x * width, point.y * height
        nearest_x, nearest_y = xx, yy
        if index > 0:
            previous = mask.points[index - 1]
            dx, dy = xx - previous.x * width, yy - previous.y * height
            length = dx * dx + dy * dy
            if length > 0:
                t = max(0.0, min(1.0, ((px - previous.x * width) * dx
                                        + (py - previous.y * height) * dy) / length))
                nearest_x = previous.x * width + t * dx
                nearest_y = previous.y * height + t * dy
        distance_sq = min(distance_sq, (px - nearest_x) ** 2 + (py - nearest_y) ** 2)
    if distance_sq >= radius * radius:
        return 0.0
    inner = max(0.0, radius * mask.hardness - 0.5)
    if distance_sq <= inner * inner:
        return 1.0
    return 1 - _smooth((math.sqrt(distance_sq) - inner) / (radius - inner))


def coverage_at(masks: tuple[Mask, ...], x: float, y: float, width: int, height: int) -> int:
    """Stable 8-bit union, with ordered subtract operations."""
    validate_masks(masks)
    if not masks:
        return 255
    coverage = 0
    for mask in masks:
        alpha = round(255 * mask.opacity * sample_mask(mask, x, y, width, height))
        if mask.mode == "add":
            coverage = max(coverage, alpha)
        else:
            coverage = round(coverage * (255 - alpha) / 255)
    return coverage


def masked_rgba(
    pixels: bytes, width: int, height: int, masks: tuple[Mask, ...],
    luts: tuple[tuple[int, ...], tuple[int, ...], tuple[int, ...]],
) -> bytes:
    """Small-image oracle. The source alpha remains byte-identical."""
    if not 1 <= width <= 512 or not 1 <= height <= 512 or len(pixels) != width * height * 4:
        raise ValueError("reference image must be at most 512 by 512 RGBA")
    validate_masks(masks)
    result = bytearray(pixels)
    for y in range(height):
        for x in range(width):
            offset = (y * width + x) * 4
            if result[offset + 3] == 0:
                continue
            coverage = coverage_at(masks, (x + 0.5) / width, (y + 0.5) / height, width, height)
            for channel in range(3):
                original = result[offset + channel]
                result[offset + channel] = round(original + (luts[channel][original] - original) * coverage / 255)
    return bytes(result)

"""Axis-aligned boxes used for card layout, safe areas and collision checks.

Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class Box:
    """A rectangle in card units: top-left corner plus width and height."""

    x: float
    y: float
    w: float
    h: float

    @property
    def right(self) -> float:
        return self.x + self.w

    @property
    def bottom(self) -> float:
        return self.y + self.h

    @property
    def centre(self) -> tuple[float, float]:
        return (self.x + self.w / 2, self.y + self.h / 2)

    @property
    def area(self) -> float:
        return max(0.0, self.w) * max(0.0, self.h)

    def inset(self, amount: float) -> Box:
        """Shrink on all four sides (negative grows)."""
        return Box(self.x + amount, self.y + amount, self.w - 2 * amount, self.h - 2 * amount)

    def intersects(self, other: Box) -> bool:
        return (self.x < other.right and other.x < self.right
                and self.y < other.bottom and other.y < self.bottom)

    def contains(self, other: Box) -> bool:
        return (other.x >= self.x - 1e-6 and other.y >= self.y - 1e-6
                and other.right <= self.right + 1e-6 and other.bottom <= self.bottom + 1e-6)

    def contains_point(self, px: float, py: float) -> bool:
        return self.x <= px <= self.right and self.y <= py <= self.bottom

    def scaled(self, factor: float) -> Box:
        return Box(self.x * factor, self.y * factor, self.w * factor, self.h * factor)

    def rounded(self, digits: int = 2) -> Box:
        return Box(round(self.x, digits), round(self.y, digits), round(self.w, digits),
                   round(self.h, digits))

    def as_tuple(self) -> tuple[float, float, float, float]:
        return (self.x, self.y, self.w, self.h)


def circle_box(cx: float, cy: float, radius: float) -> Box:
    """The bounding box of a circle."""
    return Box(cx - radius, cy - radius, 2 * radius, 2 * radius)


def circle_hits_box(cx: float, cy: float, radius: float, box: Box) -> bool:
    """True when a circle overlaps a box (closest-point test)."""
    nx = min(max(cx, box.x), box.right)
    ny = min(max(cy, box.y), box.bottom)
    return math.hypot(cx - nx, cy - ny) < radius


def circles_overlap(a: tuple[float, float, float], b: tuple[float, float, float],
                    gap: float = 0.0) -> bool:
    """True when two (cx, cy, r) circles are closer than gap."""
    return math.hypot(a[0] - b[0], a[1] - b[1]) < a[2] + b[2] + gap

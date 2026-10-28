"""The chosen face, as passed in by the caller, and the regions derived from it.

This package never detects faces. The multi-face picker hands over one
FaceTarget: a face box, a roll angle and optional 2D landmarks. From that the
module builds a face-local frame, the effect region that accessories and light
effects may touch, and the eye and mouth regions that are never painted.

Face-local coordinates: u runs to the right of the image-facing face and v runs
down, both measured in box units, so the box spans u and v in [-0.5, 0.5].
Roll is in degrees; positive roll turns the face clockwise on screen.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from functools import lru_cache

import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageDraw

Point = tuple[float, float]
Mask = NDArray[np.bool_]

# Effect region bounds in face-local box units. Tall hats reach v = -1.3.
REGION_U = 0.95
REGION_TOP = -1.35
REGION_BOTTOM = 0.8
# Estimated feature placement when landmarks are missing (box units).
EYE_U = 0.2
EYE_V = -0.07
EYE_RADII = (0.13, 0.085)
MOUTH_V = 0.3
MOUTH_RADII = (0.22, 0.11)
# Padding around landmark hulls, as a share of the box size.
LANDMARK_PAD = 0.03
# Landmark contours trace a feature's outline; the hull grows them a little.
LANDMARK_GROW = 1.15


class TargetError(ValueError):
    """The face target does not describe a usable face on this image."""


@dataclass(frozen=True)
class FaceBox:
    """Axis-aligned face box in image pixels."""

    x: float
    y: float
    width: float
    height: float

    def __post_init__(self) -> None:
        values = (self.x, self.y, self.width, self.height)
        if any(isinstance(v, bool) or not isinstance(v, (int, float)) for v in values):
            raise TargetError("face box values must be numbers")
        if not all(math.isfinite(float(v)) for v in values):
            raise TargetError("face box values must be finite")
        if self.width < 4 or self.height < 4:
            raise TargetError("face box must be at least 4 x 4 pixels")

    @property
    def centre(self) -> Point:
        """Centre of the box."""
        return (self.x + self.width / 2.0, self.y + self.height / 2.0)


def _check_points(name: str, points: Sequence[Point]) -> tuple[Point, ...]:
    checked: list[Point] = []
    for point in points:
        if len(point) != 2:
            raise TargetError(f"landmark group {name} needs (x, y) pairs")
        x, y = float(point[0]), float(point[1])
        if not (math.isfinite(x) and math.isfinite(y)):
            raise TargetError(f"landmark group {name} has a non-finite point")
        checked.append((x, y))
    return tuple(checked)


@dataclass(frozen=True)
class FaceLandmarks:
    """Optional 2D landmark groups in image pixels. Any group may be empty."""

    left_eye: tuple[Point, ...] = ()
    right_eye: tuple[Point, ...] = ()
    left_brow: tuple[Point, ...] = ()
    right_brow: tuple[Point, ...] = ()
    nose: tuple[Point, ...] = ()
    mouth: tuple[Point, ...] = ()
    jaw: tuple[Point, ...] = ()

    def __post_init__(self) -> None:
        for name in ("left_eye", "right_eye", "left_brow", "right_brow", "nose", "mouth", "jaw"):
            object.__setattr__(self, name, _check_points(name, getattr(self, name)))


@dataclass(frozen=True)
class Ellipse:
    """A rotated ellipse in image pixels."""

    cx: float
    cy: float
    rx: float
    ry: float
    angle: float

    def polygon(self, steps: int = 48) -> list[Point]:
        """Polygon approximation of the ellipse outline."""
        cos_a = math.cos(math.radians(self.angle))
        sin_a = math.sin(math.radians(self.angle))
        points: list[Point] = []
        for index in range(steps):
            theta = 2.0 * math.pi * index / steps
            ex = self.rx * math.cos(theta)
            ey = self.ry * math.sin(theta)
            points.append((self.cx + ex * cos_a - ey * sin_a, self.cy + ex * sin_a + ey * cos_a))
        return points

    def contains(self, x: float, y: float, pad: float = 0.0) -> bool:
        """True when the point lies inside the ellipse grown by pad pixels."""
        cos_a = math.cos(math.radians(self.angle))
        sin_a = math.sin(math.radians(self.angle))
        dx, dy = x - self.cx, y - self.cy
        local_x = dx * cos_a + dy * sin_a
        local_y = -dx * sin_a + dy * cos_a
        rx, ry = self.rx + pad, self.ry + pad
        return (local_x / rx) ** 2 + (local_y / ry) ** 2 <= 1.0


def _centroid(points: Sequence[Point]) -> Point:
    return (
        sum(p[0] for p in points) / len(points),
        sum(p[1] for p in points) / len(points),
    )


@dataclass(frozen=True)
class FaceTarget:
    """The one face a look is applied to."""

    box: FaceBox
    roll: float = 0.0
    landmarks: FaceLandmarks | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.box, FaceBox):
            raise TargetError("target box must be a FaceBox")
        if isinstance(self.roll, bool) or not isinstance(self.roll, (int, float)):
            raise TargetError("roll must be a number of degrees")
        if not math.isfinite(float(self.roll)) or abs(self.roll) > 90.0:
            raise TargetError("roll must be finite and within -90 to 90 degrees")
        if self.landmarks is not None and not isinstance(self.landmarks, FaceLandmarks):
            raise TargetError("landmarks must be FaceLandmarks or None")

    @classmethod
    def from_landmarks(cls, landmarks: FaceLandmarks, roll: float | None = None) -> FaceTarget:
        """Build a target when the picker gives landmarks but no box.

        Needs both eyes and the mouth. Roll comes from the eye line unless given.
        The box follows the placement this module assumes for faces (eyes at
        u = +/-0.2, v = -0.07; mouth at v = 0.3), so looks sit where they would
        on a box from a detector that frames the face the same way (ASSUMED).
        """
        groups = (landmarks.left_eye, landmarks.right_eye, landmarks.mouth)
        if any(not group for group in groups):
            raise TargetError("from_landmarks needs both eyes and the mouth")
        (lx, ly), (rx, ry), (mx, my) = (_centroid(group) for group in groups)
        if roll is None:
            roll = math.degrees(math.atan2(ry - ly, rx - lx))
        cos_r, sin_r = math.cos(math.radians(roll)), math.sin(math.radians(roll))
        eye_mid = ((lx + rx) / 2.0, (ly + ry) / 2.0)
        eye_gap = (rx - lx) * cos_r + (ry - ly) * sin_r
        drop = -(mx - eye_mid[0]) * sin_r + (my - eye_mid[1]) * cos_r
        if eye_gap <= 0 or drop <= 0:
            raise TargetError("landmarks must have the eyes apart and above the mouth")
        width = eye_gap / (2.0 * EYE_U)
        height = drop / (MOUTH_V - EYE_V)
        # Centre of the box: from the eye midpoint, -EYE_V box heights down the face axis.
        shift = -EYE_V * height
        cx, cy = eye_mid[0] - shift * sin_r, eye_mid[1] + shift * cos_r
        box = FaceBox(cx - width / 2.0, cy - height / 2.0, width, height)
        return cls(box, roll, landmarks)

    @property
    def scale(self) -> float:
        """Typical face size in pixels, used to size motifs."""
        return math.sqrt(self.box.width * self.box.height)

    def to_image(self, u: float, v: float) -> Point:
        """Map a face-local point (box units) to image pixels."""
        cx, cy = self.box.centre
        px, py = u * self.box.width, v * self.box.height
        cos_r = math.cos(math.radians(self.roll))
        sin_r = math.sin(math.radians(self.roll))
        return (cx + px * cos_r - py * sin_r, cy + px * sin_r + py * cos_r)

    def to_local(self, x: float, y: float) -> Point:
        """Map image pixels back to face-local box units."""
        cx, cy = self.box.centre
        dx, dy = x - cx, y - cy
        cos_r = math.cos(math.radians(self.roll))
        sin_r = math.sin(math.radians(self.roll))
        px = dx * cos_r + dy * sin_r
        py = -dx * sin_r + dy * cos_r
        return (px / self.box.width, py / self.box.height)

    def local_polygon(self, points: Sequence[Point]) -> list[Point]:
        """Map a face-local polygon to image pixels."""
        return [self.to_image(u, v) for u, v in points]

    def region_polygon(self) -> list[Point]:
        """The rotated rectangle accessories and light effects may touch."""
        return self.local_polygon(
            [
                (-REGION_U, REGION_TOP),
                (REGION_U, REGION_TOP),
                (REGION_U, REGION_BOTTOM),
                (-REGION_U, REGION_BOTTOM),
            ]
        )

    def region_bounds(self, width: int, height: int) -> tuple[int, int, int, int]:
        """Integer bounds (x0, y0, x1, y1) of the effect region, clipped to the image."""
        xs = [p[0] for p in self.region_polygon()]
        ys = [p[1] for p in self.region_polygon()]
        x0 = max(0, int(math.floor(min(xs))))
        y0 = max(0, int(math.floor(min(ys))))
        x1 = min(width, int(math.ceil(max(xs))) + 1)
        y1 = min(height, int(math.ceil(max(ys))) + 1)
        return (x0, y0, x1, y1)

    def _hull_ellipse(self, points: Sequence[Point], fallback: Ellipse) -> Ellipse:
        if len(points) < 2:
            return fallback
        local = [self.to_local(x, y) for x, y in points]
        us = [p[0] for p in local]
        vs = [p[1] for p in local]
        cu, cv = (min(us) + max(us)) / 2.0, (min(vs) + max(vs)) / 2.0
        half_u = (max(us) - min(us)) / 2.0 * LANDMARK_GROW + LANDMARK_PAD
        half_v = (max(vs) - min(vs)) / 2.0 * LANDMARK_GROW + LANDMARK_PAD
        cx, cy = self.to_image(cu, cv)
        return Ellipse(cx, cy, half_u * self.box.width, half_v * self.box.height, float(self.roll))

    def _estimated(self, u: float, v: float, radii: Point) -> Ellipse:
        cx, cy = self.to_image(u, v)
        return Ellipse(
            cx, cy, radii[0] * self.box.width, radii[1] * self.box.height, float(self.roll)
        )

    def eye_regions(self) -> tuple[Ellipse, Ellipse]:
        """Left and right (on screen) eye regions that must never be painted."""
        left = self._estimated(-EYE_U, EYE_V, EYE_RADII)
        right = self._estimated(EYE_U, EYE_V, EYE_RADII)
        marks = self.landmarks
        if marks is None:
            return (left, right)
        return (
            self._hull_ellipse(marks.left_eye, left),
            self._hull_ellipse(marks.right_eye, right),
        )

    def mouth_region(self) -> Ellipse:
        """Mouth region that must never be painted."""
        estimate = self._estimated(0.0, MOUTH_V, MOUTH_RADII)
        if self.landmarks is None:
            return estimate
        return self._hull_ellipse(self.landmarks.mouth, estimate)

    def protected_regions(self) -> tuple[Ellipse, ...]:
        """Eyes and mouth together."""
        return (*self.eye_regions(), self.mouth_region())

    def cheek_anchor(self, side: int) -> Point:
        """Cheek centre in face-local units; side -1 is screen left, +1 screen right."""
        eyes = self.eye_regions()
        eye = eyes[0] if side < 0 else eyes[1]
        eye_u, eye_v = self.to_local(eye.cx, eye.cy)
        mouth_u, mouth_v = self.to_local(self.mouth_region().cx, self.mouth_region().cy)
        return (eye_u * 1.25 + side * 0.04, (eye_v + mouth_v) / 2.0 + 0.04)

    def check_on_image(self, width: int, height: int) -> None:
        """Reject a target whose box misses the image entirely."""
        x0, y0, x1, y1 = self.region_bounds(width, height)
        box = self.box
        if box.x >= width or box.y >= height or box.x + box.width <= 0 or box.y + box.height <= 0:
            raise TargetError("face box lies outside the image")
        if x1 <= x0 or y1 <= y0:
            raise TargetError("effect region lies outside the image")


def polygon_mask(width: int, height: int, polygons: Sequence[Sequence[Point]]) -> Mask:
    """Boolean mask of the union of polygons, at pixel resolution."""
    canvas = Image.new("L", (max(1, width), max(1, height)), 0)
    draw = ImageDraw.Draw(canvas)
    for polygon in polygons:
        if len(polygon) >= 3:
            draw.polygon([(float(x), float(y)) for x, y in polygon], fill=255)
    return np.asarray(canvas, dtype=np.uint8) > 0


def _centres(x0: int, y0: int, x1: int, y1: int) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """Pixel-centre coordinates (x + 0.5, y + 0.5) of a window, as a row and a column
    that broadcast against each other."""
    xs = np.arange(x0, x1, dtype=np.float64)[None, :] + 0.5
    ys = np.arange(y0, y1, dtype=np.float64)[:, None] + 0.5
    return xs, ys


def region_mask(target: FaceTarget, width: int, height: int) -> Mask:
    """Pixels accessories and light effects may change, as a full-image mask.

    A pixel belongs to the region when its centre lies inside the rotated
    rectangle; the test is exact, with no polygon rasterising error.
    """
    mask = np.zeros((height, width), dtype=np.bool_)
    x0, y0, x1, y1 = target.region_bounds(width, height)
    if x1 <= x0 or y1 <= y0:
        return mask
    xs, ys = _centres(x0, y0, x1, y1)
    cx, cy = target.box.centre
    cos_r = math.cos(math.radians(target.roll))
    sin_r = math.sin(math.radians(target.roll))
    dx, dy = xs - cx, ys - cy
    u = (dx * cos_r + dy * sin_r) / target.box.width
    v = (-dx * sin_r + dy * cos_r) / target.box.height
    inside = (np.abs(u) <= REGION_U) & (v >= REGION_TOP) & (v <= REGION_BOTTOM)
    mask[y0:y1, x0:x1] = inside
    return mask


def ellipse_mask(ellipse: Ellipse, width: int, height: int, pad: float = 0.0) -> Mask:
    """Pixels whose centre lies inside an ellipse grown by pad pixels (exact test)."""
    mask = np.zeros((height, width), dtype=np.bool_)
    rx, ry = ellipse.rx + pad, ellipse.ry + pad
    reach = max(rx, ry)
    x0, y0 = (
        max(0, int(math.floor(ellipse.cx - reach))),
        max(0, int(math.floor(ellipse.cy - reach))),
    )
    x1 = min(width, int(math.ceil(ellipse.cx + reach)) + 1)
    y1 = min(height, int(math.ceil(ellipse.cy + reach)) + 1)
    if x1 <= x0 or y1 <= y0 or rx <= 0 or ry <= 0:
        return mask
    xs, ys = _centres(x0, y0, x1, y1)
    cos_a = math.cos(math.radians(ellipse.angle))
    sin_a = math.sin(math.radians(ellipse.angle))
    dx, dy = xs - ellipse.cx, ys - ellipse.cy
    local_x = dx * cos_a + dy * sin_a
    local_y = -dx * sin_a + dy * cos_a
    mask[y0:y1, x0:x1] = (local_x / rx) ** 2 + (local_y / ry) ** 2 <= 1.0
    return mask


def protected_mask(target: FaceTarget, width: int, height: int) -> Mask:
    """Eye and mouth pixels, as a full-image mask, grown by one pixel."""
    mask = np.zeros((height, width), dtype=np.bool_)
    for ellipse in target.protected_regions():
        mask |= ellipse_mask(ellipse, width, height, pad=1.0)
    return mask


def allowed_mask(target: FaceTarget, width: int, height: int) -> Mask:
    """Where a face-anchored look may paint: inside the region, off eyes and mouth.

    Cached per target and size (renderer and guard both ask); the array is read-only.
    """
    return _allowed_cached(target, width, height)


@lru_cache(maxsize=8)
def _allowed_cached(target: FaceTarget, width: int, height: int) -> Mask:
    mask = region_mask(target, width, height) & ~protected_mask(target, width, height)
    mask.setflags(write=False)
    return mask

"""Validated, side-effect-free contracts for local professional edits.

All crop coordinates are in the *unrotated* source image. No faces, recipes or
pixels are transmitted by this package. These objects are also useful to a
future API integration, but the web release processes photographs locally.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal

from .masks import Mask, validate_masks

Aspect = Literal["free", "original", "square", "portrait", "story", "landscape", "photo"]
ExportName = Literal["original", "web", "portrait", "story", "lossless"]
Channel = Literal["master", "red", "green", "blue"]

ASPECTS: dict[Aspect, float | None] = {
    "free": None,
    "original": None,
    "square": 1.0,
    "portrait": 4 / 5,
    "story": 9 / 16,
    "landscape": 16 / 9,
    "photo": 3 / 2,
}
MAX_PIXELS = 12_000_000
MAX_EDGE = 16_384


def finite(value: float, name: str) -> float:
    """Reject NaN/Inf, including values outside normal numeric bounds."""
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value):
        raise ValueError(f"{name} must be finite")
    return float(value)


@dataclass(frozen=True)
class CurvePoint:
    x: float
    y: float

    def __post_init__(self) -> None:
        for name, value in (("x", self.x), ("y", self.y)):
            if not 0 <= finite(value, name) <= 1:
                raise ValueError(f"{name} must be in [0, 1]")


IDENTITY = (CurvePoint(0, 0), CurvePoint(1, 1))


def validate_points(points: tuple[CurvePoint, ...]) -> None:
    if not 2 <= len(points) <= 16:
        raise ValueError("a curve needs 2 to 16 control points")
    if points[0].x != 0 or points[-1].x != 1:
        raise ValueError("curves must cover the full input range")
    for before, after in zip(points, points[1:], strict=False):
        if after.x <= before.x:
            raise ValueError("curve x values must increase")
        if after.y < before.y:
            raise ValueError("curve y values must not decrease")


@dataclass(frozen=True)
class ToneCurves:
    master: tuple[CurvePoint, ...] = IDENTITY
    red: tuple[CurvePoint, ...] = IDENTITY
    green: tuple[CurvePoint, ...] = IDENTITY
    blue: tuple[CurvePoint, ...] = IDENTITY

    def __post_init__(self) -> None:
        for channel in ("master", "red", "green", "blue"):
            validate_points(getattr(self, channel))


@dataclass(frozen=True)
class Crop:
    x: float = 0
    y: float = 0
    width: float = 1
    height: float = 1
    aspect: Aspect = "original"
    rotation: float = 0

    def __post_init__(self) -> None:
        x = finite(self.x, "x")
        y = finite(self.y, "y")
        w = finite(self.width, "width")
        h = finite(self.height, "height")
        degrees = finite(self.rotation, "rotation")
        if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > 1.000000001 or y + h > 1.000000001:
            raise ValueError("crop must have positive area and fit in the image")
        if self.aspect not in ASPECTS:
            raise ValueError("unknown aspect preset")
        if abs(degrees) > 180:
            raise ValueError("rotation must be between -180 and 180 degrees")


@dataclass(frozen=True)
class ExportPreset:
    name: ExportName
    mime: Literal["image/jpeg", "image/png"]
    max_edge: int
    quality: float

    def __post_init__(self) -> None:
        if not 1 <= self.max_edge <= MAX_EDGE or not isinstance(self.max_edge, int):
            raise ValueError("invalid export edge")
        if not 0 < finite(self.quality, "quality") <= 1:
            raise ValueError("invalid export quality")
        if self.mime not in ("image/jpeg", "image/png"):
            raise ValueError("invalid export mime")


PRESETS: dict[ExportName, ExportPreset] = {
    "original": ExportPreset("original", "image/jpeg", 4800, 0.92),
    "web": ExportPreset("web", "image/jpeg", 1600, 0.86),
    "portrait": ExportPreset("portrait", "image/jpeg", 1350, 0.9),
    "story": ExportPreset("story", "image/jpeg", 1920, 0.9),
    "lossless": ExportPreset("lossless", "image/png", 4800, 1),
}


@dataclass(frozen=True)
class Recipe:
    curves: ToneCurves = field(default_factory=ToneCurves)
    masks: tuple[Mask, ...] = ()
    crop: Crop = field(default_factory=Crop)
    export: ExportName = "original"
    simulation: bool = True
    simulation_label: bool = True

    def __post_init__(self) -> None:
        validate_masks(self.masks)
        if self.export not in PRESETS:
            raise ValueError("unknown export preset")
        if not isinstance(self.simulation, bool) or not isinstance(self.simulation_label, bool):
            raise ValueError("simulation flags must be booleans")

"""Pixel-space crop, exact aspect fitting and rotated bounding-box plans.

The output rectangle expands for a free-angle rotation. Blank corners remain
transparent, so the exporter can place a matte behind JPEG output explicitly.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from .contracts import ASPECTS, MAX_EDGE, MAX_PIXELS, Crop, ExportPreset


@dataclass(frozen=True)
class Geometry:
    x: float
    y: float
    crop_width: float
    crop_height: float
    rotation: float
    out_width: int
    out_height: int


def image_size(width: int, height: int) -> None:
    if isinstance(width, bool) or isinstance(height, bool):
        raise ValueError("image dimensions must be integers")
    if not isinstance(width, int) or not isinstance(height, int):
        raise ValueError("image dimensions must be integers")
    if not (1 <= width <= MAX_EDGE and 1 <= height <= MAX_EDGE):
        raise ValueError("image dimensions out of range")
    if width * height > MAX_PIXELS:
        raise ValueError("source exceeds the 12 megapixel limit")


def fit_aspect(
    x: float, y: float, width: float, height: float, ratio: float | None
) -> tuple[float, float, float, float]:
    if ratio is None:
        return x, y, width, height
    cx = x + width / 2
    cy = y + height / 2
    if width / height > ratio:
        width = height * ratio
    else:
        height = width / ratio
    return cx - width / 2, cy - height / 2, width, height


def plan(width: int, height: int, crop: Crop, preset: ExportPreset | None = None) -> Geometry:
    image_size(width, height)
    x, y, w, h = crop.x * width, crop.y * height, crop.width * width, crop.height * height
    ratio = ASPECTS[crop.aspect]
    if crop.aspect == "original":
        ratio = w / h
    x, y, w, h = fit_aspect(x, y, w, h, ratio)
    angle = math.radians(crop.rotation)
    cos = abs(math.cos(angle))
    sin = abs(math.sin(angle))
    bounding_width = max(1, math.ceil(w * cos + h * sin - 1e-9))
    bounding_height = max(1, math.ceil(w * sin + h * cos - 1e-9))
    factor = 1.0
    if preset:
        factor = min(factor, preset.max_edge / max(bounding_width, bounding_height))
    factor = min(factor, math.sqrt(MAX_PIXELS / (bounding_width * bounding_height)))
    out_w = max(1, math.floor(bounding_width * factor))
    out_h = max(1, math.floor(bounding_height * factor))
    return Geometry(x, y, w, h, crop.rotation, out_w, out_h)


def inverse_point(geom: Geometry, output_x: float, output_y: float) -> tuple[float, float]:
    """Map the centre of an output pixel back to a source pixel centre."""
    angle = math.radians(geom.rotation)
    cosine = math.cos(angle)
    sine = math.sin(angle)
    projected_w = abs(geom.crop_width * cosine) + abs(geom.crop_height * sine)
    projected_h = abs(geom.crop_width * sine) + abs(geom.crop_height * cosine)
    dx = (output_x + 0.5 - geom.out_width / 2) * projected_w / geom.out_width
    dy = (output_y + 0.5 - geom.out_height / 2) * projected_h / geom.out_height
    source_x = geom.x + geom.crop_width / 2 + dx * cosine + dy * sine
    source_y = geom.y + geom.crop_height / 2 - dx * sine + dy * cosine
    return source_x, source_y


def within_crop(geom: Geometry, source_x: float, source_y: float) -> bool:
    return (geom.x <= source_x < geom.x + geom.crop_width
            and geom.y <= source_y < geom.y + geom.crop_height)

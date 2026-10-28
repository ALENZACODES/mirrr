"""Original front-view frame drawings sized from eye geometry. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

from .common import (
    RGB,
    Image,
    Mask,
    Point,
    alpha_blend,
    line_mask,
    mask_union,
    restore,
    ring_mask,
    validate_image,
)

LABEL = "Atelier Frames — original front-view frame geometry; no brand shapes or logos."
FrameStyle = Literal["round", "soft_square", "wing", "wire"]


@dataclass(frozen=True)
class GlassesOptions:
    style: FrameStyle = "round"
    colour: RGB = (42, 39, 38)
    scale: float = 1.0
    thickness: float = 0.055

    def __post_init__(self) -> None:
        if not 0.75 <= self.scale <= 1.25:
            raise ValueError("scale must be 0.75..1.25")
        if not 0.02 <= self.thickness <= 0.12:
            raise ValueError("thickness must be 0.02..0.12")


def _lens_rings(height: int, width: int, left: Point, right: Point, options: GlassesOptions) -> tuple[Mask, float]:
    iod = max(abs(right.x - left.x), 1.0)
    rx = iod * 0.35 * options.scale
    ry = rx * (0.76 if options.style in ("soft_square", "wing") else 0.90)
    inner = max(0.55, 1.0 - options.thickness * 2.4)
    left_ring = ring_mask(height, width, left, rx, ry, inner)
    right_ring = ring_mask(height, width, right, rx, ry, inner)
    if options.style == "wing":
        lift = max(1.0, ry * 0.12)
        left_ring = np.roll(left_ring, -int(lift), axis=0)
        right_ring = np.roll(right_ring, -int(lift), axis=0)
    return mask_union(left_ring, right_ring), iod


def render(
    image: Image,
    left_eye: Point,
    right_eye: Point,
    options: GlassesOptions | None = None,
    *,
    iris: Mask | None = None,
    protected: Mask | None = None,
) -> Image:
    options = GlassesOptions() if options is None else options
    height, width = validate_image(image)
    frames, iod = _lens_rings(height, width, left_eye, right_eye, options)
    midpoint = Point((left_eye.x + right_eye.x) * 0.5, (left_eye.y + right_eye.y) * 0.5)
    bridge_half = iod * 0.08
    bridge = line_mask(
        height,
        width,
        Point(midpoint.x - bridge_half, midpoint.y),
        Point(midpoint.x + bridge_half, midpoint.y),
        max(1.0, iod * options.thickness * 0.35),
    )
    temples = mask_union(
        line_mask(height, width, Point(left_eye.x - iod * 0.34, left_eye.y), Point(left_eye.x - iod * 0.58, left_eye.y - iod * 0.04), max(1.0, iod * 0.018)),
        line_mask(height, width, Point(right_eye.x + iod * 0.34, right_eye.y), Point(right_eye.x + iod * 0.58, right_eye.y - iod * 0.04), max(1.0, iod * 0.018)),
    )
    frame_mask = mask_union(frames, bridge, temples)
    if options.style == "wire":
        frame_mask = np.minimum(frame_mask, 190).astype(np.uint8)
    out = alpha_blend(image, options.colour, frame_mask, 245)
    if iris is not None:
        out = restore(out, image, iris)
    return restore(out, image, protected)

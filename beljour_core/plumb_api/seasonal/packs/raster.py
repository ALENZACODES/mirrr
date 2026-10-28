"""Small anti-aliased drawing layer and compositing on RGB uint8 arrays.

A Layer covers a window of the image and draws at a supersampled resolution
with Pillow, then shrinks to pixel size so edges are smooth. Compositing works
in float32 on that window only, so a small accessory never costs a full-image
pass. Three blend modes cover the packs: normal over, multiply (face paint
that can only darken) and screen (glow for light effects).
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from enum import StrEnum

import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageDraw

from .target import Mask, Point

RGB = tuple[int, int, int]
RGBA = tuple[int, int, int, int]
ImageArray = NDArray[np.uint8]
FloatArray = NDArray[np.float32]

SUPERSAMPLE = 2


class BlendMode(StrEnum):
    """How a layer is mixed into the photo."""

    OVER = "over"
    MULTIPLY = "multiply"
    SCREEN = "screen"


class RasterError(ValueError):
    """The image or layer is not usable."""


def check_image(image: object) -> ImageArray:
    """Require an H x W x 3 uint8 array and return it typed."""
    if not isinstance(image, np.ndarray):
        raise RasterError("image must be a NumPy array")
    if image.dtype != np.uint8:
        raise RasterError(f"image must be uint8, got {image.dtype}")
    if image.ndim != 3 or image.shape[2] != 3:
        raise RasterError(f"image must be H x W x 3 RGB, got shape {image.shape}")
    if image.shape[0] < 8 or image.shape[1] < 8:
        raise RasterError("image must be at least 8 x 8 pixels")
    return image


def with_alpha(colour: RGB, alpha: float) -> RGBA:
    """Attach an alpha in 0..1 to an RGB colour."""
    level = int(round(max(0.0, min(1.0, alpha)) * 255.0))
    return (colour[0], colour[1], colour[2], level)


def mix(colour_a: RGB, colour_b: RGB, t: float) -> RGB:
    """Linear mix of two colours, t = 0 gives colour_a."""
    return (
        int(round(colour_a[0] + (colour_b[0] - colour_a[0]) * t)),
        int(round(colour_a[1] + (colour_b[1] - colour_a[1]) * t)),
        int(round(colour_a[2] + (colour_b[2] - colour_a[2]) * t)),
    )


class Layer:
    """A transparent RGBA drawing surface over the window (x0, y0, x1, y1)."""

    def __init__(self, x0: int, y0: int, x1: int, y1: int, supersample: int = SUPERSAMPLE):
        if x1 <= x0 or y1 <= y0:
            raise RasterError("layer window is empty")
        self.x0 = x0
        self.y0 = y0
        self.width = x1 - x0
        self.height = y1 - y0
        self.ss = max(1, supersample)
        self._canvas = Image.new(
            "RGBA", (self.width * self.ss, self.height * self.ss), (0, 0, 0, 0)
        )
        self._draw = ImageDraw.Draw(self._canvas, "RGBA")
        self.marks = 0

    def _map(self, points: Sequence[Point]) -> list[tuple[float, float]]:
        ss = self.ss
        return [((x - self.x0) * ss, (y - self.y0) * ss) for x, y in points]

    def polygon(self, points: Sequence[Point], fill: RGBA) -> None:
        """Fill a polygon given in image pixels."""
        if len(points) < 3 or fill[3] == 0:
            return
        self._draw.polygon(self._map(points), fill=fill)
        self.marks += 1

    def line(self, points: Sequence[Point], colour: RGBA, width: float) -> None:
        """Stroke an open polyline given in image pixels."""
        if len(points) < 2 or colour[3] == 0:
            return
        stroke = max(1, int(round(width * self.ss)))
        self._draw.line(self._map(points), fill=colour, width=stroke, joint="curve")
        self.marks += 1

    def ellipse(
        self, cx: float, cy: float, rx: float, ry: float, fill: RGBA, angle: float = 0.0
    ) -> None:
        """Fill a rotated ellipse given in image pixels."""
        if rx <= 0 or ry <= 0 or fill[3] == 0:
            return
        if abs(angle) < 1e-6:
            ss = self.ss
            box = (
                (cx - rx - self.x0) * ss,
                (cy - ry - self.y0) * ss,
                (cx + rx - self.x0) * ss,
                (cy + ry - self.y0) * ss,
            )
            self._draw.ellipse(box, fill=fill)
            self.marks += 1
            return
        steps = max(16, min(72, int(math.sqrt(rx * ry) * 1.5)))
        cos_a = math.cos(math.radians(angle))
        sin_a = math.sin(math.radians(angle))
        points: list[Point] = []
        for index in range(steps):
            theta = 2.0 * math.pi * index / steps
            ex, ey = rx * math.cos(theta), ry * math.sin(theta)
            points.append((cx + ex * cos_a - ey * sin_a, cy + ex * sin_a + ey * cos_a))
        self.polygon(points, fill)

    def pixels(self) -> ImageArray:
        """Layer pixels at image resolution, uint8 RGBA, straight alpha."""
        canvas = self._canvas
        if self.ss > 1:
            canvas = canvas.reduce(self.ss)
        data: ImageArray = np.asarray(canvas, dtype=np.uint8)
        return data

    def rgba(self) -> FloatArray:
        """Layer pixels at image resolution, float32 in 0..1, straight alpha."""
        data: FloatArray = self.pixels().astype(np.float32) / np.float32(255.0)
        return data


def _window(image: ImageArray, x0: int, y0: int, w: int, h: int) -> tuple[int, int, int, int]:
    height, width = image.shape[:2]
    return (max(0, x0), max(0, y0), min(width, x0 + w), min(height, y0 + h))


def composite(
    image: ImageArray,
    layer: Layer,
    opacity: float = 1.0,
    mode: BlendMode = BlendMode.OVER,
    allowed: Mask | None = None,
) -> ImageArray:
    """Blend a layer into a copy of the image; pixels outside the layer stay exact.

    When an allowed mask (full-image, boolean) is given, only those pixels may
    change, which is how eyes, mouths and bystanders are kept untouched. Only
    pixels the layer actually covers are converted to float, so sparse layers
    (snow, bats, paint) stay cheap on large pictures.
    """
    out = image.copy()
    if layer.marks == 0 or opacity <= 0:
        return out
    ix0, iy0, ix1, iy1 = _window(image, layer.x0, layer.y0, layer.width, layer.height)
    if ix1 <= ix0 or iy1 <= iy0:
        return out
    lx0, ly0 = ix0 - layer.x0, iy0 - layer.y0
    part = layer.pixels()[ly0 : ly0 + (iy1 - iy0), lx0 : lx0 + (ix1 - ix0)]
    touched = part[..., 3] > 0
    if allowed is not None:
        touched &= allowed[iy0:iy1, ix0:ix1]
    if not touched.any():
        return out
    window = out[iy0:iy1, ix0:ix1]
    scale = np.float32(1.0 / 255.0)
    paint = part[touched]
    alpha = paint[:, 3:4].astype(np.float32) * (scale * np.float32(max(0.0, min(1.0, opacity))))
    colour = paint[:, :3].astype(np.float32) * scale
    base = window[touched].astype(np.float32) * scale
    if mode is BlendMode.MULTIPLY:
        target = base * colour
    elif mode is BlendMode.SCREEN:
        target = 1.0 - (1.0 - base) * (1.0 - colour)
    else:
        target = colour
    blended = base + (target - base) * alpha
    window[touched] = np.clip(np.rint(blended * 255.0), 0, 255).astype(np.uint8)
    return out


def keep_only(original: ImageArray, edited: ImageArray, allowed: Mask) -> ImageArray:
    """Original pixels everywhere except where allowed, which come from edited."""
    out = original.copy()
    rows = np.flatnonzero(allowed.any(axis=1))
    cols = np.flatnonzero(allowed.any(axis=0))
    if rows.size == 0:
        return out
    window = (slice(int(rows[0]), int(rows[-1]) + 1), slice(int(cols[0]), int(cols[-1]) + 1))
    mask = allowed[window]
    out[window][mask] = edited[window][mask]
    return out


def luminance(image: ImageArray | FloatArray) -> FloatArray:
    """Rec. 709 relative luminance in the array's own scale, float32."""
    data = image.astype(np.float32)
    weights = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    lum: FloatArray = data @ weights
    return lum

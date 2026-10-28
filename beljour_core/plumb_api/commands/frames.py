"""Immutable bounded RGB/RGBA frames and original-source alignment for undo/lock.

The reference resize is a deterministic fallback, NOT /upscale's production
resampling algorithm. It never invents geometry, identity or hidden regions.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError

MAX_IMAGE_PIXELS = 24_000_000
ChannelCount = Literal[3, 4]


def _byte(value: float) -> int:
    return min(255, max(0, int(math.floor(value + 0.5))))


def _to_linear(byte: int) -> float:
    encoded = byte / 255.0
    if encoded <= 0.04045:
        return encoded / 12.92
    return ((encoded + 0.055) / 1.055) ** 2.4


def _from_linear(value: float) -> int:
    bounded = min(1.0, max(0.0, value))
    if bounded <= 0.0031308:
        encoded = 12.92 * bounded
    else:
        encoded = 1.055 * bounded ** (1.0 / 2.4) - 0.055
    return _byte(encoded * 255.0)


# A bounded table is shared across individual pixel operations.
_LINEAR_LUT = tuple(_to_linear(index) for index in range(256))


@dataclass(frozen=True, slots=True, repr=False)
class ImageFrame:
    width: int
    height: int
    channels: ChannelCount
    pixels: bytes

    def __post_init__(self) -> None:
        if type(self.width) is not int or type(self.height) is not int:
            raise CommandValidationError("invalid_dimensions", "Image dimensions must be integers.")
        if self.width <= 0 or self.height <= 0 or self.width * self.height > MAX_IMAGE_PIXELS:
            raise CommandValidationError(
                "invalid_dimensions",
                "Image dimensions exceed the 24 MP limit.",
            )
        if type(self.channels) is not int or self.channels not in (3, 4):
            raise CommandValidationError("invalid_channels", "Only RGB and RGBA frames are supported.")
        if (
            not isinstance(self.pixels, bytes)
            or len(self.pixels) != self.width * self.height * self.channels
        ):
            raise CommandValidationError(
                "invalid_pixels",
                "Pixel buffer does not match image dimensions.",
            )

    def __repr__(self) -> str:
        return f"ImageFrame(width={self.width}, height={self.height}, channels={self.channels})"

    @property
    def byte_size(self) -> int:
        return len(self.pixels)

    def same_layout(self, other: ImageFrame) -> bool:
        return (self.width, self.height, self.channels) == (other.width, other.height, other.channels)

    def identical(self, other: ImageFrame) -> bool:
        return self.same_layout(other) and self.pixels == other.pixels


def _same_alpha(original: ImageFrame, changed: ImageFrame) -> bool:
    if original.channels != 4:
        return True
    return original.pixels[3::4] == changed.pixels[3::4]


def blend_toward_original(original: ImageFrame, changed: ImageFrame, fraction: float) -> ImageFrame:
    """Fraction 0=original, 1=edit. Alpha is original and never resampled.

    Linear-light blending avoids false halos from interpolating encoded sRGB.
    Strict matching alpha prevents edits from silently erasing transparency.
    """
    if not original.same_layout(changed):
        raise CommandValidationError("incompatible_frames", "Image layouts must agree before blending.")
    if not _same_alpha(original, changed):
        raise CommandValidationError("alpha_changed", "Identity softening requires unchanged alpha.")
    if not math.isfinite(fraction) or not 0.0 <= fraction <= 1.0:
        raise CommandValidationError(
            "invalid_fraction",
            "Blend fraction must be finite and within 0 to 1.",
        )
    if fraction == 0.0:
        return original
    if fraction == 1.0:
        return changed
    target = bytearray(original.byte_size)
    for position in range(0, original.byte_size, original.channels):
        for channel in range(3):
            before = _LINEAR_LUT[original.pixels[position + channel]]
            after = _LINEAR_LUT[changed.pixels[position + channel]]
            target[position + channel] = _from_linear(before + (after - before) * fraction)
        if original.channels == 4:
            target[position + 3] = original.pixels[position + 3]
    return ImageFrame(original.width, original.height, original.channels, bytes(target))


def resize_reference(original: ImageFrame, width: int, height: int) -> ImageFrame:
    """Deterministic original-to-output alignment when the pipeline changed size.

    Bilinear pixel-center mapping with clamped edges and straight RGBA data.
    A supplied production aligner may replace it with the app's upscale base.
    This is a fallback for identity *softening*, never an upscaling effect.
    """
    if type(width) is not int or type(height) is not int or width < 1 or height < 1:
        raise CommandValidationError(
            "invalid_dimensions",
            "Aligned output dimensions must be positive integers.",
        )
    if width * height > MAX_IMAGE_PIXELS:
        raise CommandValidationError("invalid_dimensions", "Aligned image exceeds the 24 MP limit.")
    if (width, height) == (original.width, original.height):
        return original
    target = bytearray(width * height * original.channels)
    for row in range(height):
        fy = max(0.0, min(original.height - 1.0, (row + 0.5) * original.height / height - 0.5))
        y0 = int(math.floor(fy))
        y1 = min(original.height - 1, y0 + 1)
        wy = fy - y0
        for col in range(width):
            fx = max(0.0, min(original.width - 1.0, (col + 0.5) * original.width / width - 0.5))
            x0 = int(math.floor(fx))
            x1 = min(original.width - 1, x0 + 1)
            wx = fx - x0
            offsets = (
                (y0 * original.width + x0) * original.channels,
                (y0 * original.width + x1) * original.channels,
                (y1 * original.width + x0) * original.channels,
                (y1 * original.width + x1) * original.channels,
            )
            out = (row * width + col) * original.channels
            for channel in range(original.channels):
                samples = [original.pixels[offset + channel] for offset in offsets]
                top = (1.0 - wx) * samples[0] + wx * samples[1]
                bottom = (1.0 - wx) * samples[2] + wx * samples[3]
                target[out + channel] = _byte((1.0 - wy) * top + wy * bottom)
    return ImageFrame(width, height, original.channels, bytes(target))

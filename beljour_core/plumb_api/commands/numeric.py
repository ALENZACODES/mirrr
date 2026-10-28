"""Small, bounded NumPy kernels shared by local cleanup and scale operations.

This is an original CPU reference: no downloaded model, image data or weights.
All readback and blending use explicitly checked array dimensions.
Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .frames import ImageFrame

FloatImage = npt.NDArray[np.float64]


def float_image(frame: ImageFrame) -> FloatImage:
    if not isinstance(frame, ImageFrame):
        raise CommandValidationError("invalid_frame", "Expected an immutable RGB/RGBA frame.")
    raw = np.frombuffer(frame.pixels, dtype=np.uint8).reshape(frame.height, frame.width, frame.channels)
    return np.asarray(raw[:, :, :3], dtype=np.float64) / 255.0


def image_from_float(source: ImageFrame, rgb: FloatImage) -> ImageFrame:
    if rgb.shape != (source.height, source.width, 3) or not np.all(np.isfinite(rgb)):
        raise CommandValidationError("invalid_frame", "Renderer produced nonfinite or invalid RGB.")
    rounded = np.floor(np.clip(rgb, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)
    if source.channels == 3:
        result = rounded.tobytes()
    else:
        rgba = np.frombuffer(source.pixels, dtype=np.uint8).reshape(source.height, source.width, 4).copy()
        rgba[:, :, :3] = rounded
        result = rgba.tobytes()
    return ImageFrame(source.width, source.height, source.channels, result)


def shifted(data: FloatImage, dy: int, dx: int) -> FloatImage:
    if data.ndim not in (2, 3):
        raise CommandValidationError("invalid_array", "Shifted array must be two or three dimensional.")
    y = np.clip(np.arange(data.shape[0]) + dy, 0, data.shape[0] - 1)
    x = np.clip(np.arange(data.shape[1]) + dx, 0, data.shape[1] - 1)
    return np.take(np.take(data, y, axis=0), x, axis=1)


def smooth5(data: FloatImage) -> FloatImage:
    """Reflect-neighbour separable [1,4,6,4,1]/16 low-pass."""
    if data.ndim not in (2, 3) or not all(size > 0 for size in data.shape[:2]):
        raise CommandValidationError("invalid_array", "Gaussian input must be nonempty.")
    weights = (1.0, 4.0, 6.0, 4.0, 1.0)
    horizontal = np.zeros_like(data)
    for index, weight in enumerate(weights):
        horizontal = horizontal + weight * shifted(data, 0, index - 2)
    horizontal = horizontal / 16.0
    vertical = np.zeros_like(data)
    for index, weight in enumerate(weights):
        vertical = vertical + weight * shifted(horizontal, index - 2, 0)
    return vertical / 16.0


def median3(data: FloatImage) -> FloatImage:
    neighbours = [shifted(data, dy, dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)]
    return np.median(np.stack(neighbours, axis=0), axis=0)


def edge_difference(data: FloatImage) -> FloatImage:
    """Local edge magnitude, normalized per displayed channel."""
    dx = np.max(np.abs(data - shifted(data, 0, 1)), axis=-1)
    dy = np.max(np.abs(data - shifted(data, 1, 0)), axis=-1)
    return np.maximum(dx, dy)


def weighted_mix(original: FloatImage, edited: FloatImage, weight: FloatImage) -> FloatImage:
    if original.shape != edited.shape or original.shape[:2] != weight.shape:
        raise CommandValidationError("invalid_array", "Compositing arrays have inconsistent dimensions.")
    if np.any(~np.isfinite(weight)) or np.any((weight < 0.0) | (weight > 1.0)):
        raise CommandValidationError("invalid_mask", "Compositing mask is outside 0 to 1.")
    return original + (edited - original) * weight[:, :, None]


def resample_plane(source: FloatImage, width: int, height: int) -> FloatImage:
    """Bilinear pixel-center mapping for non-biometric checked masks."""
    if source.ndim != 2 or source.shape[0] < 1 or source.shape[1] < 1:
        raise CommandValidationError("invalid_mask", "Source mask must be a nonempty plane.")
    if type(width) is not int or type(height) is not int or width < 1 or height < 1:
        raise CommandValidationError("invalid_mask", "Mask target dimensions are invalid.")
    if width * height > 24_000_000:
        raise CommandValidationError("invalid_mask", "Mask exceeds 24 MP.")
    sx = np.clip((np.arange(width) + 0.5) * source.shape[1] / width - 0.5, 0.0, source.shape[1] - 1.0)
    sy = np.clip((np.arange(height) + 0.5) * source.shape[0] / height - 0.5, 0.0, source.shape[0] - 1.0)
    x0 = np.floor(sx).astype(np.intp)
    y0 = np.floor(sy).astype(np.intp)
    x1 = np.minimum(source.shape[1] - 1, x0 + 1)
    y1 = np.minimum(source.shape[0] - 1, y0 + 1)
    wx = sx - x0
    wy = sy - y0
    top = source[y0[:, None], x0[None, :]] * (1.0 - wx[None, :])
    top += source[y0[:, None], x1[None, :]] * wx[None, :]
    bottom = source[y1[:, None], x0[None, :]] * (1.0 - wx[None, :])
    bottom += source[y1[:, None], x1[None, :]] * wx[None, :]
    return top * (1.0 - wy[:, None]) + bottom * wy[:, None]


def capped_skin_rise(original: FloatImage, changed: FloatImage, skin: FloatImage | None) -> FloatImage:
    """Keep measured skin luminance rise below a conservative 2.5 L* envelope."""
    if skin is None:
        return changed
    if original.shape != changed.shape or skin.shape != original.shape[:2]:
        raise CommandValidationError("invalid_mask", "Skin tone evidence has inconsistent dimensions.")

    def lab_light(rgb: FloatImage) -> FloatImage:
        linear = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
        y = linear[:, :, 0] * 0.2126729
        y += linear[:, :, 1] * 0.7151522
        y += linear[:, :, 2] * 0.0721750
        return np.where(y > 216 / 24389, 116 * np.cbrt(y) - 16, (24389 / 27) * y)

    original_light = lab_light(original)
    requested_light = lab_light(np.clip(changed, 0.0, 1.0))
    rise = np.maximum(0.0, requested_light - original_light)
    blend = np.where(rise > 2.4, 2.4 / np.maximum(rise, 1e-8), 1.0)
    blend = np.where(skin > 0.0, blend, 1.0)
    return original + (changed - original) * blend[:, :, None]


def validate_dose(value: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        raise CommandValidationError("invalid_level", "Effect dose must be numeric.")
    dose = float(value)
    if not math.isfinite(dose) or dose < 0.2 or dose > 1.0:
        raise CommandValidationError("invalid_level", "Effect dose must be between 0.2 and 1.0.")
    if abs(dose * 50.0 - round(dose * 50.0)) > 1e-8:
        raise CommandValidationError("invalid_level", "Effect dose must use editor steps of 0.1.")
    return dose

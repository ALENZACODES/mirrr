"""Bounded, deterministic local studio processing for original image pixels.

Scene-wide exposure is applied in linear light with a shoulder curve. Protected
features are used only when a caller supplies commercially cleared masks.
No automatic demographic inference, model downloads, or external calls occur.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .levels import DecimalLevel

FloatArray = npt.NDArray[np.float32]


@dataclass(frozen=True, slots=True)
class StudioSettings:
    exposure_ev: float = 0.48
    contrast: float = 0.18
    warmth: float = 0.025
    clarity: float = 0.12
    highlight_recovery: float = 0.30

    def __post_init__(self) -> None:
        values = (self.exposure_ev, self.contrast, self.warmth, self.clarity, self.highlight_recovery)
        if not all(isinstance(value, (int, float)) and not isinstance(value, bool) for value in values):
            raise CommandValidationError("invalid_studio", "Studio settings must be numeric.")
        if not all(math.isfinite(value) for value in values):
            raise CommandValidationError("invalid_studio", "Studio settings must be finite.")
        if abs(self.exposure_ev) > 1.0 or abs(self.contrast) > 0.4 or abs(self.warmth) > 0.06:
            raise CommandValidationError(
                "invalid_studio", "Studio colour correction exceeds safe limits.",
            )
        if not 0.0 <= self.clarity <= 0.3 or not 0.0 <= self.highlight_recovery <= 0.5:
            raise CommandValidationError(
                "invalid_studio", "Studio spatial correction exceeds safe limits.",
            )


def studio_dose(level: DecimalLevel) -> float:
    """1.0 is an actual unchanged image; level 5.0 requests the full safe correction."""
    if not isinstance(level, DecimalLevel):
        raise CommandValidationError("invalid_level", "Studio level must be an exact editor decimal.")
    return (level.tenths - 10) / 40.0


def to_linear(rgb: FloatArray) -> FloatArray:
    return np.asarray(
        np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4),
        dtype=np.float32,
    )


def to_srgb(linear: FloatArray) -> FloatArray:
    safe = np.clip(linear, 0.0, 1.0)
    return np.asarray(
        np.where(safe <= 0.0031308, 12.92 * safe, 1.055 * safe ** (1.0 / 2.4) - 0.055),
        dtype=np.float32,
    )


def luminance(linear: FloatArray) -> FloatArray:
    if linear.ndim != 3 or linear.shape[2] != 3:
        raise CommandValidationError("invalid_studio", "Studio luminance needs three colour channels.")
    return np.asarray(
        linear[:, :, 0] * 0.2126729
        + linear[:, :, 1] * 0.7151522
        + linear[:, :, 2] * 0.0721750,
        dtype=np.float32,
    )


def blur5_luma(rgb: FloatArray, y0: int, y1: int) -> FloatArray:
    """Five-tap separable luminance low pass with global-image clamped borders.

    Supplying absolute row indices ensures that tiles have no false boundaries.
    """
    if rgb.ndim != 3 or not 0 <= y0 < y1 <= rgb.shape[0]:
        raise CommandValidationError("invalid_studio", "Studio tile coordinates are invalid.")
    weights = (1.0, 4.0, 6.0, 4.0, 1.0)
    indices = np.clip(np.arange(y0 - 2, y1 + 2), 0, rgb.shape[0] - 1)
    source = rgb[indices]
    light = luminance(to_linear(source))
    padded = np.pad(light, ((0, 0), (2, 2)), mode="edge")
    rows = np.zeros_like(light, dtype=np.float32)
    for offset, weight in enumerate(weights):
        rows += np.asarray(weight * padded[:, offset:offset + light.shape[1]], dtype=np.float32)
    rows = rows / 16.0
    smoothed = np.zeros((y1 - y0, light.shape[1]), dtype=np.float32)
    for offset, weight in enumerate(weights):
        smoothed += np.asarray(weight * rows[offset:offset + y1 - y0], dtype=np.float32)
    return np.asarray(smoothed / 16.0, dtype=np.float32)


def studio_tile(
    rgb: FloatArray,
    blurred_luma: FloatArray,
    dose: float,
    settings: StudioSettings,
) -> FloatArray:
    """Original scene-referred transform, without skin-tone normalization."""
    if rgb.ndim != 3 or rgb.shape[2] != 3 or blurred_luma.shape != rgb.shape[:2]:
        raise CommandValidationError("invalid_studio", "Studio tile buffers are incompatible.")
    if not math.isfinite(dose) or not 0.0 <= dose <= 1.0:
        raise CommandValidationError("invalid_level", "Studio strength must be within zero and one.")
    if dose == 0.0:
        return rgb.copy()
    linear = to_linear(rgb)
    exposure = float(2.0 ** (settings.exposure_ev * dose))
    gained = np.asarray(linear * exposure, dtype=np.float32)
    shoulder = settings.highlight_recovery * dose
    gained = gained / (1.0 + shoulder * np.maximum(gained - 0.35, 0.0))
    # A bounded gamma adjustment avoids crushing dark pixels at high strength.
    # A global contrast pivot would otherwise clamp near-black scenes to zero.
    gamma = 1.0 - 0.20 * settings.contrast * dose
    gained = np.asarray(np.clip(gained, 0.0, 1.0) ** gamma, dtype=np.float32)
    warmth = settings.warmth * dose
    warm_balance = np.array((1.0 + warmth, 1.0, 1.0 - warmth), dtype=np.float32)
    gained = np.clip(gained * warm_balance[None, None, :], 0.0, 1.0)
    light = luminance(linear)
    texture = light - blurred_luma
    detail = np.asarray(settings.clarity * dose * texture, dtype=np.float32)
    detail = np.clip(detail, -0.025, 0.025)
    gained = np.clip(gained + detail[:, :, None], 0.0, 1.0)
    return to_srgb(np.asarray(gained, dtype=np.float32))


def reduce_skin_lightness(original: FloatArray, edited: FloatArray, skin: FloatArray) -> FloatArray:
    """Use a conservative local L* limit; no classification from pixel colour."""
    if original.shape != edited.shape or skin.shape != original.shape[:2]:
        raise CommandValidationError("invalid_regions", "Skin protection mask shape is incorrect.")
    old_y = luminance(to_linear(original))
    new_y = luminance(to_linear(edited))
    limit = np.float32(2.3)
    lab_old = np.where(old_y > 216 / 24389, 116 * np.cbrt(old_y) - 16, (24389 / 27) * old_y)
    lab_new = np.where(new_y > 216 / 24389, 116 * np.cbrt(new_y) - 16, (24389 / 27) * new_y)
    delta = np.maximum(lab_new - lab_old, 0.0)
    ratio = np.where(delta > limit, limit / np.maximum(delta, 1e-6), 1.0)
    weights = np.where(skin > 0.0, ratio, 1.0)
    return np.asarray(original + (edited - original) * weights[:, :, None], dtype=np.float32)

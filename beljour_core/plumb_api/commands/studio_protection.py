"""Final-byte Studio skin protection against unintended lightness changes.

This only applies where the caller supplies a checked positive skin mask.
It uses D65 lightness after byte rounding and does not estimate complexion.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError

BytesImage = npt.NDArray[np.uint8]
SkinImage = npt.NDArray[np.float32]
LabArray = npt.NDArray[np.float64]
MAX_SKIN_LIFT_L = 2.5


@dataclass(frozen=True, slots=True)
class SkinByteProtection:
    covered_pixels: int
    adjusted_pixels: int
    maximum_lift_l: float
    measured: bool

    def public_metadata(self) -> dict[str, int | float | bool]:
        return {
            "covered_pixels": self.covered_pixels,
            "adjusted_pixels": self.adjusted_pixels,
            "maximum_lift_l": round(self.maximum_lift_l, 5),
            "measured": self.measured,
            "realface_verified": False,
        }


def byte_lightness(rgb: BytesImage) -> LabArray:
    """D65 L* from encoded RGB uint8, with no statistical skin assumptions."""
    if rgb.ndim != 3 or rgb.shape[2] != 3 or rgb.dtype != np.dtype(np.uint8):
        raise CommandValidationError("invalid_studio", "Studio lightness needs uint8 RGB.")
    encoded = np.asarray(rgb, dtype=np.float64) / 255.0
    linear = np.where(
        encoded <= 0.04045,
        encoded / 12.92,
        np.power((encoded + 0.055) / 1.055, 2.4),
    )
    y = (
        linear[:, :, 0] * 0.2126729
        + linear[:, :, 1] * 0.7151522
        + linear[:, :, 2] * 0.0721750
    )
    lightness = np.where(y > 216.0 / 24389.0,
                         116.0 * np.cbrt(y) - 16.0, 24389.0 / 27.0 * y)
    return np.asarray(lightness, dtype=np.float64)


def protect_rounded_skin(
    original: BytesImage,
    candidate: BytesImage,
    mask: SkinImage,
    *,
    lift_limit: float = MAX_SKIN_LIFT_L,
) -> tuple[BytesImage, SkinByteProtection]:
    """Back off only skin pixels whose final rounded lightness exceeds a cap.

    A pixel on a fractional mask edge still counts as covered. The quantized
    result is checked again; a numerical anomaly restores its exact original.
    """
    if (
        original.ndim != 3
        or original.shape[2] != 3
        or original.shape != candidate.shape
        or mask.shape != original.shape[:2]
        or original.dtype != np.dtype(np.uint8)
        or candidate.dtype != np.dtype(np.uint8)
        or not bool(np.all(np.isfinite(mask)))
        or not math.isfinite(lift_limit)
        or not 0.0 < lift_limit <= 5.0
    ):
        raise CommandValidationError("invalid_studio", "Skin protection inputs are invalid.")
    covered = mask > 0.0
    count = int(np.count_nonzero(covered))
    if count == 0:
        return candidate.copy(), SkinByteProtection(0, 0, 0.0, False)
    before = byte_lightness(original)
    after = byte_lightness(candidate)
    delta = np.asarray(after - before, dtype=np.float64)
    violating = np.logical_and(covered, delta > lift_limit + 1e-8)
    violations = int(np.count_nonzero(violating))
    if violations == 0:
        return candidate.copy(), SkinByteProtection(
            count, 0, max(0.0, float(np.max(delta[covered]))), True,
        )
    output = candidate.copy()
    low = np.zeros(before.shape, dtype=np.float64)
    high = np.ones(before.shape, dtype=np.float64)
    old = np.asarray(original, dtype=np.float64)
    goal = np.asarray(candidate, dtype=np.float64)
    for _ in range(10):
        mid = (low + high) * 0.5
        trial = np.floor(np.clip(old + (goal - old) * mid[:, :, None], 0.0, 255.0) + 0.5)
        checked = byte_lightness(np.asarray(trial, dtype=np.uint8))
        safe = checked - before <= lift_limit
        low = np.where(np.logical_and(violating, safe), mid, low)
        high = np.where(np.logical_and(violating, ~safe), mid, high)
    bounded = np.floor(np.clip(old + (goal - old) * low[:, :, None], 0.0, 255.0) + 0.5)
    output[violating] = np.asarray(bounded, dtype=np.uint8)[violating]
    final_delta = byte_lightness(output) - before
    unsafe = np.logical_and(covered, final_delta > lift_limit + 1e-8)
    if np.any(unsafe):
        output[unsafe] = original[unsafe]
        final_delta = byte_lightness(output) - before
    maximum = max(0.0, float(np.max(final_delta[covered])))
    return output, SkinByteProtection(count, violations, maximum, True)

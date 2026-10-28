"""Final-byte diagnostics for BELJOUR's STUDIO light reference.

Cover lighting means soft key, gentle sculpting, preserved texture and true
colour. These are measured descriptors on supplied pixels and masks, not a
new gate or an inferred assessment of attractiveness. Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .frames import ImageFrame
from .studio import STUDIO_LIGHT_REFERENCE
from .studio_protection import byte_lightness

FloatImage = npt.NDArray[np.float64]


@dataclass(frozen=True, slots=True)
class StudioLightAudit:
    reference: str
    mean_lift_l: float
    peak_lift_l: float
    mean_chromaticity_drift: float
    texture_energy_ratio: float | None
    sculpting_gradient_change: float
    protected_changed_pixels: int | None
    protected_evidence_present: bool
    alpha_unchanged: bool
    neutral_bytes_unchanged: bool
    realface_approved: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-studio-light-diagnostics/1",
            "reference": self.reference,
            "mean_lift_l": self.mean_lift_l,
            "peak_lift_l": self.peak_lift_l,
            "mean_chromaticity_drift": self.mean_chromaticity_drift,
            "texture_energy_ratio": self.texture_energy_ratio,
            "sculpting_gradient_change": self.sculpting_gradient_change,
            "protected_changed_pixels": self.protected_changed_pixels,
            "protected_evidence_present": self.protected_evidence_present,
            "alpha_unchanged": self.alpha_unchanged,
            "neutral_bytes_unchanged": self.neutral_bytes_unchanged,
            "realface_approved": False,
        }


def _chromaticity(rgb: FloatImage) -> FloatImage:
    sums = np.sum(rgb, axis=2, keepdims=True)
    # Black is neutral by definition in this diagnostic. It is not classified
    # as any complexion or assigned a guessed undertone.
    return np.asarray(np.divide(rgb, np.maximum(sums, 1.0)), dtype=np.float64)


def _edge_energy(values: FloatImage) -> float:
    total = 0.0
    count = 0
    if values.shape[1] > 1:
        dx = np.abs(np.diff(values, axis=1))
        total += float(np.sum(dx, dtype=np.float64))
        count += int(dx.size)
    if values.shape[0] > 1:
        dy = np.abs(np.diff(values, axis=0))
        total += float(np.sum(dy, dtype=np.float64))
        count += int(dy.size)
    return total / count if count else 0.0


def measure_studio_light(
    original: ImageFrame,
    edited: ImageFrame,
    *,
    protected_mask: bytes | None = None,
) -> StudioLightAudit:
    """Measure final rounded bytes, including alpha and mask-edge coverage."""
    if not isinstance(original, ImageFrame) or not isinstance(edited, ImageFrame):
        raise CommandValidationError("invalid_studio_audit", "Two checked frames are required.")
    if not original.same_layout(edited):
        raise CommandValidationError("invalid_studio_audit", "Studio must preserve photo geometry.")
    if protected_mask is not None and (
        not isinstance(protected_mask, bytes)
        or len(protected_mask) != original.width * original.height
    ):
        raise CommandValidationError("invalid_studio_audit", "Protected mask must match the image.")
    before = np.frombuffer(original.pixels, dtype=np.uint8).reshape(
        original.height, original.width, original.channels,
    )
    after = np.frombuffer(edited.pixels, dtype=np.uint8).reshape(
        edited.height, edited.width, edited.channels,
    )
    l_before = byte_lightness(np.asarray(before[:, :, :3], dtype=np.uint8))
    l_after = byte_lightness(np.asarray(after[:, :, :3], dtype=np.uint8))
    lift = l_after - l_before
    a = np.asarray(before[:, :, :3], dtype=np.float64)
    b = np.asarray(after[:, :, :3], dtype=np.float64)
    color_error = np.mean(np.abs(_chromaticity(a) - _chromaticity(b)), axis=2)
    before_energy = _edge_energy(l_before)
    after_energy = _edge_energy(l_after)
    ratio = after_energy / before_energy if before_energy > 0.0 else None
    changed: int | None = None
    if protected_mask is not None:
        mask = np.frombuffer(protected_mask, dtype=np.uint8).reshape(
            original.height, original.width,
        )
        changed = int(np.count_nonzero(
            np.logical_and(mask > 0, np.any(before != after, axis=2)),
        ))
    alpha_ok = original.channels == 3 or bool(np.array_equal(before[:, :, 3], after[:, :, 3]))
    return StudioLightAudit(
        reference=STUDIO_LIGHT_REFERENCE,
        mean_lift_l=float(np.mean(lift)),
        peak_lift_l=float(np.max(lift)),
        mean_chromaticity_drift=float(np.mean(color_error)),
        texture_energy_ratio=ratio,
        sculpting_gradient_change=after_energy - before_energy,
        protected_changed_pixels=changed,
        protected_evidence_present=protected_mask is not None,
        alpha_unchanged=alpha_ok,
        neutral_bytes_unchanged=original.identical(edited),
    )

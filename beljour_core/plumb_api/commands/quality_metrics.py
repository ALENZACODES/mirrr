"""Local measurable quality probes for Pro cleanup and upscale acceptance.

Each metric discloses the required external reference. Missing truth returns
None, not a substituted estimate or a pass. Real-face evidence and identity
verification remain the responsibility of the locked external runner.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .cleanup_detail import boundary_excess, luminance, noise_mad
from .errors import CommandValidationError
from .frames import ImageFrame, resize_reference
from .numeric import float_image, smooth5


@dataclass(frozen=True, slots=True)
class EditQuality:
    """Small no-photo summary accepted by written gate hooks."""

    name: str
    measurements: dict[str, float | None]
    synthetic_only: bool = True

    def public_metadata(self) -> dict[str, object]:
        return {
            "name": self.name,
            "measurements": {
                key: round(value, 6) if value is not None else None
                for key, value in self.measurements.items()
            },
            "realface_pass": False,
            "synthetic_only": self.synthetic_only,
        }


def _share(value: float, denominator: float) -> float | None:
    return value / denominator if denominator > 1e-9 else None


def _edge_energy(rgb: npt.NDArray[np.float64]) -> float:
    if rgb.shape[0] < 2 or rgb.shape[1] < 2:
        return 0.0
    gray = luminance(rgb)
    horizontal = np.mean(np.abs(gray[:, 1:] - gray[:, :-1]))
    vertical = np.mean(np.abs(gray[1:, :] - gray[:-1, :]))
    return float((horizontal + vertical) / 2)


def _texture_fraction(original: npt.NDArray[np.float64], edited: npt.NDArray[np.float64]) -> float | None:
    signal = original - smooth5(original)
    residual = edited - smooth5(edited)
    source_energy = float(np.mean(signal * signal))
    if source_energy <= 1e-12:
        return None
    correlation = float(np.mean(signal * residual))
    return max(0.0, correlation / source_energy)


def _lstar(rgb: npt.NDArray[np.float64]) -> npt.NDArray[np.float64]:
    linear = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    y = linear[:, :, 0] * 0.2126729
    y += linear[:, :, 1] * 0.7151522
    y += linear[:, :, 2] * 0.0721750
    return np.where(y > 216 / 24389, 116 * np.cbrt(y) - 16, (24389 / 27) * y)


def cleanup_quality(
    original: ImageFrame,
    edited: ImageFrame,
    *,
    checked_skin: bytes | None = None,
    checked_protected: bytes | None = None,
    ground_truth: ImageFrame | None = None,
    identity_cosine: float | None = None,
) -> EditQuality:
    if not isinstance(original, ImageFrame) or not original.same_layout(edited):
        raise CommandValidationError("invalid_quality_frame", "Cleanup quality inputs must share layout.")
    before = float_image(original)
    after = float_image(edited)
    ground = float_image(ground_truth) if ground_truth is not None else None
    if ground_truth is not None and not ground_truth.same_layout(original):
        raise CommandValidationError("invalid_quality_frame", "Ground truth must match source dimensions.")
    noise_before = noise_mad(before)
    noise_after = noise_mad(after)
    texture = _texture_fraction(ground, after) if ground is not None else None
    rise: float | None = None
    if checked_skin is not None:
        if len(checked_skin) != original.width * original.height:
            raise CommandValidationError("invalid_quality_mask", "Skin mask dimensions are invalid.")
        skin = np.frombuffer(checked_skin, dtype=np.uint8).reshape(original.height, original.width)
        if np.any(skin > 0):
            rise = float(np.max((_lstar(after) - _lstar(before))[skin > 0]))
    change: float | None = None
    if checked_protected is not None:
        if len(checked_protected) != original.width * original.height:
            raise CommandValidationError("invalid_quality_mask", "Protected mask dimensions are invalid.")
        protected = np.frombuffer(checked_protected, dtype=np.uint8).reshape(original.height, original.width)
        if np.any(protected > 0):
            changed = np.any(before[protected > 0] != after[protected > 0], axis=-1)
            change = float(np.mean(changed))
    if identity_cosine is not None and (not math.isfinite(identity_cosine) or not -1.0 <= identity_cosine <= 1.0):
        raise CommandValidationError("invalid_quality_identity", "Identity evidence cosine is invalid.")
    boundary_before = boundary_excess(before)
    boundary_after = boundary_excess(after)
    edge_before = _edge_energy(before)
    edge_after = _edge_energy(after)
    return EditQuality("cleanup", {
        "noise_reduction_fraction": _share(noise_before - noise_after, noise_before),
        "texture_retention_fraction": texture,
        "edge_contrast_loss_fraction": _share(max(0.0, edge_before - edge_after), edge_before),
        "block_boundary_reduction_fraction": _share(boundary_before - boundary_after, boundary_before),
        "protected_pixel_change_fraction": change,
        "skin_max_lstar_increase": rise,
        "identity_cosine": identity_cosine,
    })


def upscale_quality(
    original: ImageFrame,
    output: ImageFrame,
    *,
    high_resolution_truth: ImageFrame | None = None,
    independent_tiled: ImageFrame | None = None,
    identity_cosine: float | None = None,
) -> EditQuality:
    if not isinstance(original, ImageFrame) or not isinstance(output, ImageFrame):
        raise CommandValidationError("invalid_quality_frame", "Upscale probe requires checked frames.")
    factor = output.width // original.width
    if factor not in (2, 4) or (output.width, output.height) != (
        original.width * factor, original.height * factor,
    ):
        raise CommandValidationError("invalid_quality_frame", "Upscale output has invalid dimensions.")
    baseline = resize_reference(original, output.width, output.height)
    reference = float_image(baseline)
    rendered = float_image(output)
    if high_resolution_truth is not None and not high_resolution_truth.same_layout(output):
        raise CommandValidationError("invalid_quality_frame", "High-resolution truth must fit upscale output.")
    sharpness: float | None = None
    if high_resolution_truth is not None:
        truth = float_image(high_resolution_truth)
        energy = _edge_energy(truth)
        sharpness = _share(_edge_energy(rendered) - _edge_energy(reference), energy)
    if independent_tiled is not None and not independent_tiled.same_layout(output):
        raise CommandValidationError("invalid_quality_frame", "Independent tiles must match output geometry.")
    seam: float | None = None
    if independent_tiled is not None:
        differences = np.abs(rendered - float_image(independent_tiled)) * 255.0
        seam = float(np.max(differences))
    alpha_error = 0.0
    if original.channels == 4:
        source = np.frombuffer(baseline.pixels, dtype=np.uint8)[3::4]
        target = np.frombuffer(output.pixels, dtype=np.uint8)[3::4]
        alpha_error = float(np.max(np.abs(source.astype(np.int16) - target.astype(np.int16))))
    ringing = np.maximum(0.0, np.abs(rendered - reference) - 0.12)
    ringing_fraction = float(np.mean(np.any(ringing > 0.0, axis=-1)))
    return EditQuality("upscale", {
        "sharpness_change_fraction": sharpness,
        "edge_ringing_fraction": ringing_fraction,
        "tile_seam_max_byte_error": seam,
        "alpha_max_byte_error": alpha_error,
        "protected_region_change_fraction": None,
        "identity_cosine": identity_cosine,
    })

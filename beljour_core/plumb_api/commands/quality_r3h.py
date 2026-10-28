"""Measured reference quality and strength-sweep evidence for all Pro effects.

PSNR/SSIM require an actual reference; no missing evidence becomes a score.
Original photographs, body masks and face embeddings stay outside reports.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .frames import ImageFrame
from .levels import DecimalLevel
from .numeric import float_image

FloatImage = npt.NDArray[np.float64]
QualityKind = Literal["enhance", "denoise", "upscale", "studioquality", "poseonly"]


@dataclass(frozen=True, slots=True)
class QualitySample:
    name: QualityKind
    level: str
    psnr_db: float | None
    ssim: float | None
    reference_rmse: float | None
    modified_fraction: float
    alpha_max_error: int
    peak_edge_change: float
    synthetic_only: bool = True

    def public_metadata(self) -> dict[str, object]:
        return {
            "name": self.name,
            "level": self.level,
            "psnr_db": self.psnr_db,
            "ssim": self.ssim,
            "reference_rmse": self.reference_rmse,
            "modified_fraction": self.modified_fraction,
            "alpha_max_error": self.alpha_max_error,
            "peak_edge_change": self.peak_edge_change,
            "synthetic_only": self.synthetic_only,
            "realface_pass": False,
        }


@dataclass(frozen=True, slots=True)
class QualitySweep:
    name: QualityKind
    levels: tuple[str, ...]
    samples: tuple[QualitySample, ...]
    neutral_unchanged: bool
    modification_monotone: bool
    psnr_monotone: bool | None
    ssim_monotone: bool | None
    reference_present: bool

    def public_metadata(self) -> dict[str, object]:
        return {
            "name": self.name,
            "levels": list(self.levels),
            "neutral_unchanged": self.neutral_unchanged,
            "modification_monotone": self.modification_monotone,
            "psnr_monotone": self.psnr_monotone,
            "ssim_monotone": self.ssim_monotone,
            "reference_present": self.reference_present,
            "realface_pass": False,
        }


def _ensure_layout(left: ImageFrame, right: ImageFrame, message: str) -> None:
    if (
        not isinstance(left, ImageFrame)
        or not isinstance(right, ImageFrame)
        or not left.same_layout(right)
    ):
        raise CommandValidationError("invalid_quality_frame", message)


def psnr(reference: ImageFrame, candidate: ImageFrame) -> float:
    _ensure_layout(reference, candidate, "PSNR inputs require identical size and channels.")
    target = float_image(reference)
    produced = float_image(candidate)
    mse = float(np.mean((target - produced) ** 2))
    if mse <= 1e-16:
        return math.inf
    return 10.0 * math.log10(1.0 / mse)


def ssim(reference: ImageFrame, candidate: ImageFrame) -> float:
    """Global SSIM reference; not a replacement for regional perceptual scoring."""
    _ensure_layout(reference, candidate, "SSIM inputs require identical size and channels.")
    before = float_image(reference)
    after = float_image(candidate)
    c1 = 0.01 ** 2
    c2 = 0.03 ** 2
    values: list[float] = []
    for channel in range(3):
        a = before[:, :, channel]
        b = after[:, :, channel]
        mean_a = float(np.mean(a))
        mean_b = float(np.mean(b))
        var_a = float(np.mean((a - mean_a) ** 2))
        var_b = float(np.mean((b - mean_b) ** 2))
        covariance = float(np.mean((a - mean_a) * (b - mean_b)))
        numerator = (2 * mean_a * mean_b + c1) * (2 * covariance + c2)
        denominator = (mean_a * mean_a + mean_b * mean_b + c1) * (var_a + var_b + c2)
        values.append(numerator / max(denominator, 1e-12))
    return float(np.mean(values))


def _edge_energy(rgb: FloatImage) -> float:
    if rgb.shape[0] <= 1 or rgb.shape[1] <= 1:
        return 0.0
    x = np.abs(rgb[:, 1:, :] - rgb[:, :-1, :])
    y = np.abs(rgb[1:, :, :] - rgb[:-1, :, :])
    return float(max(float(np.max(x)), float(np.max(y))))


def assess_pair(
    name: QualityKind,
    level: DecimalLevel,
    source: ImageFrame,
    output: ImageFrame,
    *,
    reference: ImageFrame | None = None,
    resize_baseline: ImageFrame | None = None,
) -> QualitySample:
    if name not in ("enhance", "denoise", "upscale", "studioquality", "poseonly"):
        raise CommandValidationError("invalid_quality_name", "Unknown Pro quality category.")
    if not isinstance(level, DecimalLevel):
        raise CommandValidationError("invalid_level", "Quality step requires a checked decimal level.")
    comparison = resize_baseline if resize_baseline is not None else source
    _ensure_layout(comparison, output, "Output and geometry-matched reference need equal layout.")
    if reference is not None:
        _ensure_layout(reference, output, "External reference and output do not share geometry.")
    base = float_image(comparison)
    result = float_image(output)
    change = np.any(base != result, axis=2)
    modified_fraction = float(np.mean(change))
    alpha_max_error = 0
    if comparison.channels == 4:
        alpha_before = np.frombuffer(comparison.pixels, dtype=np.uint8)[3::4].astype(np.int16)
        alpha_after = np.frombuffer(output.pixels, dtype=np.uint8)[3::4].astype(np.int16)
        alpha_max_error = int(np.max(np.abs(alpha_before - alpha_after)))
    peak = abs(_edge_energy(base) - _edge_energy(result))
    measured_psnr: float | None = None
    measured_ssim: float | None = None
    rmse: float | None = None
    if reference is not None:
        actual = float_image(reference)
        rmse = float(np.sqrt(np.mean((result - actual) ** 2)))
        measured_psnr = psnr(reference, output)
        measured_ssim = ssim(reference, output)
    return QualitySample(
        name, level.label, measured_psnr, measured_ssim, rmse,
        modified_fraction, alpha_max_error, peak,
    )


def assess_levels(
    name: QualityKind,
    source: ImageFrame,
    steps: tuple[tuple[DecimalLevel, ImageFrame], ...],
    *,
    reference: ImageFrame | None = None,
    resize_baseline: ImageFrame | None = None,
) -> QualitySweep:
    if not isinstance(steps, tuple) or not 2 <= len(steps) <= 41:
        raise CommandValidationError("invalid_quality_sweep", "Strength sweep needs two to 41 outputs.")
    if steps[0][0].tenths != 10:
        raise CommandValidationError("invalid_quality_sweep", "Sweep begins with the 1.0 neutral level.")
    levels = [point.tenths for point, _ in steps]
    if len(set(levels)) != len(levels) or levels != sorted(levels):
        raise CommandValidationError(
            "invalid_quality_sweep", "Sweep levels must increase without duplication.",
        )
    samples = tuple(
        assess_pair(name, level, source, frame, reference=reference, resize_baseline=resize_baseline)
        for level, frame in steps
    )
    source_aligned = resize_baseline if resize_baseline is not None else source
    neutral_unchanged = source_aligned.pixels == steps[0][1].pixels
    modifications = [sample.modified_fraction for sample in samples]
    modification_monotone = all(
        latter + 1e-12 >= earlier
        for earlier, latter in zip(modifications, modifications[1:], strict=False)
    )
    psnr_monotone: bool | None = None
    ssim_monotone: bool | None = None
    if reference is not None:
        psnr_values = [sample.psnr_db for sample in samples]
        ssim_values = [sample.ssim for sample in samples]
        if any(value is None for value in psnr_values + ssim_values):
            raise CommandValidationError("invalid_quality_sweep", "Reference metrics are incomplete.")
        psnr_numbers = [float(value) for value in psnr_values if value is not None]
        ssim_numbers = [float(value) for value in ssim_values if value is not None]
        psnr_monotone = all(
            latter + 1e-9 >= earlier
            for earlier, latter in zip(psnr_numbers, psnr_numbers[1:], strict=False)
        )
        ssim_monotone = all(
            latter + 1e-9 >= earlier
            for earlier, latter in zip(ssim_numbers, ssim_numbers[1:], strict=False)
        )
    return QualitySweep(
        name, tuple(sample.level for sample in samples), samples, neutral_unchanged,
        modification_monotone, psnr_monotone, ssim_monotone, reference is not None,
    )

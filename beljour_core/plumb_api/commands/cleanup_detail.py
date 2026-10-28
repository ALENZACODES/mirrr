"""Conservative local-frequency reconstruction and artefact rejection kernels.

Automatic dust decisions are deliberately narrow. Natural skin marks should
be explicitly protected and broader blemishes require checked user hints.
Original colour, alpha, and protected pixels are retained by the caller.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from .errors import CommandValidationError
from .numeric import FloatImage, edge_difference, median3, shifted, smooth5


@dataclass(frozen=True, slots=True)
class SpotHint:
    """User-confirmed target in normalized photo coordinates, never detection."""

    x: float
    y: float
    radius: float

    def __post_init__(self) -> None:
        if not all(
            isinstance(value, (float, int)) and math.isfinite(value)
            for value in (self.x, self.y, self.radius)
        ):
            raise CommandValidationError("invalid_spot", "Spot coordinates must be finite numbers.")
        if not 0.0 <= self.x <= 1.0 or not 0.0 <= self.y <= 1.0:
            raise CommandValidationError("invalid_spot", "Spot position must be on the photo.")
        if not 0.0 < self.radius <= 0.1:
            raise CommandValidationError("invalid_spot", "A spot radius must be positive and at most 10%.")


@dataclass(frozen=True, slots=True)
class CleanupSignals:
    noise_mad: float
    edge_energy: float
    block_boundary_excess: float
    isolated_pixels: int

    def public_metadata(self) -> dict[str, float | int]:
        return {
            "noise_mad": round(self.noise_mad, 6),
            "edge_energy": round(self.edge_energy, 6),
            "block_boundary_excess": round(self.block_boundary_excess, 6),
            "isolated_pixels": self.isolated_pixels,
        }


def luminance(image: FloatImage) -> FloatImage:
    if image.ndim != 3 or image.shape[2] != 3:
        raise CommandValidationError("invalid_array", "Luminance needs a three-channel image.")
    return image[:, :, 0] * 0.2126 + image[:, :, 1] * 0.7152 + image[:, :, 2] * 0.0722


def isolated_noise_mask(rgb: FloatImage) -> FloatImage:
    """Only single-pixel extrema far outside all four axial neighbours."""
    gray = luminance(rgb)
    neighbours = (
        shifted(gray, 1, 0), shifted(gray, -1, 0),
        shifted(gray, 0, 1), shifted(gray, 0, -1),
    )
    is_peak = np.all(np.stack(tuple(gray - neighbour > 0.31 for neighbour in neighbours)), axis=0)
    is_trough = np.all(np.stack(tuple(neighbour - gray > 0.31 for neighbour in neighbours)), axis=0)
    found = np.asarray(is_peak | is_trough, dtype=np.float64)
    found[0, :] = 0.0
    found[-1, :] = 0.0
    found[:, 0] = 0.0
    found[:, -1] = 0.0
    return found


def noise_mad(rgb: FloatImage) -> float:
    """Conservative high-pass MAD; edges do not set the noise floor."""
    gray = luminance(rgb)
    detail = gray - smooth5(gray)
    strong_edges = edge_difference(rgb) >= 0.08
    samples = np.abs(detail[~strong_edges])
    if samples.size < 9:
        return 0.0
    return float(np.median(samples)) * 1.4826


def boundary_excess(rgb: FloatImage) -> float:
    """Mean 8-pixel seam excess over adjacent within-block variation."""
    gray = luminance(rgb)
    excesses: list[float] = []
    if gray.shape[1] >= 24:
        for col in range(8, gray.shape[1] - 1, 8):
            seam = np.abs(gray[:, col] - gray[:, col - 1])
            inside = 0.5 * (
                np.abs(gray[:, col - 1] - gray[:, col - 2])
                + np.abs(gray[:, col + 1] - gray[:, col])
            )
            excesses.append(float(np.mean(np.maximum(0.0, seam - inside))))
    if gray.shape[0] >= 24:
        for row in range(8, gray.shape[0] - 1, 8):
            seam = np.abs(gray[row, :] - gray[row - 1, :])
            inside = 0.5 * (
                np.abs(gray[row - 1, :] - gray[row - 2, :])
                + np.abs(gray[row + 1, :] - gray[row, :])
            )
            excesses.append(float(np.mean(np.maximum(0.0, seam - inside))))
    return float(np.mean(excesses)) if excesses else 0.0


def signals(rgb: FloatImage) -> CleanupSignals:
    return CleanupSignals(
        noise_mad(rgb),
        float(np.mean(edge_difference(rgb))),
        boundary_excess(rgb),
        int(np.count_nonzero(isolated_noise_mask(rgb))),
    )


def guided_frequency_denoise(rgb: FloatImage, dose: float, noise: float) -> FloatImage:
    """Spatial low pass with edge-dependent high-band retention.

    More texture survives at salient edges; gently suppress stochastic grain
    in near-uniform areas. The per-pixel control is continuous in strength.
    """
    low = smooth5(rgb)
    edge = edge_difference(rgb)
    edge_protection = np.clip(edge / 0.055, 0.0, 1.0)
    noise_signal = min(1.0, max(0.0, noise / 0.035))
    floor = 0.06 + 0.34 * noise_signal
    loss = floor * dose * (1.0 - 0.88 * edge_protection)
    return rgb + (low - rgb) * loss[:, :, None]


def deblock_8x8(rgb: FloatImage, dose: float) -> FloatImage:
    """Reduce measured 8x8 steps only when boundary evidence is repeated."""
    if rgb.shape[0] < 24 and rgb.shape[1] < 24:
        return rgb
    excess = boundary_excess(rgb)
    if excess < 0.006:
        return rgb
    correction = max(0.0, min(0.28, dose * 0.28))
    target = rgb.copy()
    for axis in (0, 1):
        length = rgb.shape[axis]
        if length < 24:
            continue
        for seam in range(8, length - 1, 8):
            if axis == 1:
                left = rgb[:, seam - 1, :]
                right = rgb[:, seam, :]
                background = 0.5 * (rgb[:, seam - 2, :] + rgb[:, seam + 1, :])
            else:
                left = rgb[seam - 1, :, :]
                right = rgb[seam, :, :]
                background = 0.5 * (rgb[seam - 2, :, :] + rgb[seam + 1, :, :])
            discontinuity = np.mean(np.abs(right - left), axis=-1)
            neighbour = np.mean(np.abs(left - background) + np.abs(right - background), axis=-1)
            accept = (discontinuity > 0.012) & (discontinuity > neighbour * 0.58)
            adjustment = np.where(accept, correction, 0.0)[:, None]
            midpoint = 0.5 * (left + right)
            if axis == 1:
                target[:, seam - 1, :] += (midpoint - left) * adjustment
                target[:, seam, :] += (midpoint - right) * adjustment
            else:
                target[seam - 1, :, :] += (midpoint - left) * adjustment
                target[seam, :, :] += (midpoint - right) * adjustment
    return np.clip(target, 0.0, 1.0)


def correct_isolated_dust(rgb: FloatImage, dose: float) -> tuple[FloatImage, int]:
    dust = isolated_noise_mask(rgb)
    count = int(np.count_nonzero(dust))
    if count == 0:
        return rgb, 0
    central = median3(rgb)
    amount = np.clip(dust * dose * 0.95, 0.0, 1.0)
    return rgb + (central - rgb) * amount[:, :, None], count


def hint_coverage(height: int, width: int, hints: tuple[SpotHint, ...]) -> FloatImage:
    if len(hints) > 24:
        raise CommandValidationError("invalid_spots", "A maximum of 24 checked marks may be removed.")
    coverage = np.zeros((height, width), dtype=np.float64)
    yy = (np.arange(height, dtype=np.float64) + 0.5) / height
    xx = (np.arange(width, dtype=np.float64) + 0.5) / width
    for hint in hints:
        distance = np.sqrt((yy[:, None] - hint.y) ** 2 + (xx[None, :] - hint.x) ** 2)
        core = max(1e-6, hint.radius * 0.55)
        soft = np.clip((hint.radius - distance) / (hint.radius - core), 0.0, 1.0)
        coverage = np.maximum(coverage, soft)
    return coverage


def remove_checked_spots(rgb: FloatImage, dose: float, hints: tuple[SpotHint, ...]) -> FloatImage:
    if not hints:
        return rgb
    coverage = hint_coverage(rgb.shape[0], rgb.shape[1], hints)
    background = median3(smooth5(rgb))
    return rgb + (background - rgb) * (coverage * dose * 0.9)[:, :, None]

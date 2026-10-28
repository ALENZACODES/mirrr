"""Training-free artifact probes on local RGB arrays.

Detects grid/checkerboard periodicity, anomalous directionality in high-frequency
Fourier magnitudes, and sharp cut/paste discontinuities along an explicit mask
boundary. A score is a diagnostic, NOT a probability that a photo is fake.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray


@dataclass(frozen=True)
class ArtifactMetrics:
    checkerboard: float
    spectral_peaks: float
    boundary_seam: float | None
    luminance_shift: float

    def json(self) -> dict[str, float | None]:
        return {"checkerboard": self.checkerboard, "spectral_peaks": self.spectral_peaks,
                "boundary_seam": self.boundary_seam, "luminance_shift": self.luminance_shift}


def _rgb(image: NDArray[np.uint8]) -> NDArray[np.float64]:
    arr = np.asarray(image)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[2] != 3 or min(arr.shape[:2]) < 8:
        raise ValueError("artifact probe needs an RGB uint8 image at least 8x8")
    return arr.astype(np.float64) / 255.0


def _luma(image: NDArray[np.float64]) -> NDArray[np.float64]:
    return np.tensordot(image, np.array([0.2126, 0.7152, 0.0722]), axes=([2], [0]))


def _checker_energy(luma: NDArray[np.float64]) -> float:
    # Signed response to an alternating grid after removing 1px-scale local
    # smoothness. Unlike flatness, it captures phase-stable 2px checkerboards.
    height, width = luma.shape
    gy, gx = np.indices((height, width))
    signed = 1 - 2 * ((gx + gy) % 2)
    component = abs(float(np.mean((luma - luma.mean()) * signed)))
    detail = float(np.mean(np.abs(luma[:, 1:] - luma[:, :-1])) +
                   np.mean(np.abs(luma[1:, :] - luma[:-1, :])))
    return float(np.clip(component / max(0.02, detail / 2), 0, 1))


def _spectral_anisotropy(luma: NDArray[np.float64]) -> float:
    height, width = luma.shape
    taper = np.hanning(height)[:, None] * np.hanning(width)[None, :]
    filtered = (luma - float(luma.mean())) * taper
    power = np.abs(np.fft.fftshift(np.fft.fft2(filtered))) ** 2
    y, x = np.ogrid[:height, :width]
    r = np.sqrt(((x - width // 2) / max(width, 1)) ** 2 + ((y - height // 2) / max(height, 1)) ** 2)
    band = (r > 0.18) & (r < 0.42)
    values = power[band]
    if len(values) < 4 or float(values.sum()) < 1e-12:
        return 0.0
    # Peaks higher than their neighbours, robust to high-detail natural photos.
    # A few isolated spectral spikes suggest grid or upsampling artifacts.
    median = float(np.median(values))
    ceiling = float(np.percentile(values, 99.5))
    return float(np.clip((ceiling / max(median, 1e-8) - 10) / 190, 0, 1))


def _boundary_mask(mask: NDArray[np.float64], h: int, w: int) -> NDArray[np.bool_]:
    if mask.shape != (h, w) or not np.isfinite(mask).all() or np.min(mask) < 0 or np.max(mask) > 1:
        raise ValueError("mask shape, finite range or alpha invalid")
    filled = mask > 0.5
    inside = filled & np.roll(filled, 1, 0) & np.roll(filled, -1, 0) & np.roll(filled, 1, 1) & np.roll(filled, -1, 1)
    result = filled & ~inside
    result[[0, -1], :] = False
    result[:, [0, -1]] = False
    return result


def seam_discontinuity(before: NDArray[np.uint8], after: NDArray[np.uint8],
                       mask: NDArray[np.float64]) -> float | None:
    """Extra edge strength where edit meets untouched background (not global sharpness)."""
    original, edited = _rgb(before), _rgb(after)
    if original.shape != edited.shape:
        raise ValueError("input and output dimensions differ")
    h, w = original.shape[:2]
    boundary = _boundary_mask(np.asarray(mask, dtype=np.float64), h, w)
    if int(boundary.sum()) < 4:
        return None
    before_l, after_l = _luma(original), _luma(edited)
    dx = np.abs(np.roll(after_l, 1, 1) - after_l) - np.abs(np.roll(before_l, 1, 1) - before_l)
    dy = np.abs(np.roll(after_l, 1, 0) - after_l) - np.abs(np.roll(before_l, 1, 0) - before_l)
    extra = np.maximum(0, dx) + np.maximum(0, dy)
    return float(np.clip(np.mean(extra[boundary]) / 0.25, 0, 1))


def probe_artifacts(before: NDArray[np.uint8], after: NDArray[np.uint8],
                    mask: NDArray[np.float64] | None = None) -> ArtifactMetrics:
    first, last = _rgb(before), _rgb(after)
    if first.shape != last.shape:
        raise ValueError("input and output dimensions differ")
    first_l, last_l = _luma(first), _luma(last)
    # Delta probes avoid marking natural freckles/stripes in the input as edits.
    anomaly = last_l - first_l
    checker = _checker_energy(anomaly)
    spectral = max(0.0, _spectral_anisotropy(anomaly) - _spectral_anisotropy(first_l) * 0.25)
    seam = seam_discontinuity(before, after, mask) if mask is not None else None
    return ArtifactMetrics(checker, spectral, seam, float(np.mean(last_l - first_l)))


def human_review_indices(rows: list[dict[str, Any]], *, each_group: int = 3) -> list[int]:
    """Deterministic per-group sample *indices* only; never exposes image bytes."""
    if not 1 <= each_group <= 30:
        raise ValueError("spot-check size must be 1..30")
    groups: dict[str, list[tuple[float, int]]] = {}
    for i, row in enumerate(rows):
        label = str(row.get("group") or "unknown")
        score = float(row.get("artifact_score", 0))
        if not np.isfinite(score) or not 0 <= score <= 3:
            raise ValueError("artifact score must be a finite diagnostic")
        groups.setdefault(label, []).append((score, i))
    chosen: list[int] = []
    for group in sorted(groups):
        ranked = sorted(groups[group], key=lambda x: (-x[0], x[1]))
        chosen.extend(i for _, i in ranked[:each_group])
    return chosen

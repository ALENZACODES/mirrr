'Observed-pigmentation-aware lip colour support for W46/W57. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class PigmentationStats:
    mean_rgb: tuple[float, float, float]
    left_rgb: tuple[float, float, float]
    right_rgb: tuple[float, float, float]
    upper_rgb: tuple[float, float, float]
    lower_rgb: tuple[float, float, float]
    side_delta: float
    vertical_delta: float
    two_tone_score: float

def _mean(image: np.ndarray, mask: np.ndarray) -> tuple[float, float, float]:
    active = mask > 0.1
    if not np.any(active):
        return (0.0, 0.0, 0.0)
    values = image[..., :3].astype(np.float64)[active]
    mean = values.mean(axis=0)
    return (float(mean[0]), float(mean[1]), float(mean[2]))

def analyse(image: np.ndarray, mask: np.ndarray) -> PigmentationStats:
    if image.shape[:2] != mask.shape:
        raise ValueError('pigmentation mask shape must match image')
    h, w = mask.shape
    yy, xx = np.mgrid[:h, :w]
    active = mask > 0.1
    if np.count_nonzero(active) < 8:
        raise ValueError('not enough observed lip pixels for pigmentation analysis')
    xs = xx[active]
    ys = yy[active]
    cx = float(np.median(xs))
    cy = float(np.median(ys))
    left = mask * (xx <= cx)
    right = mask * (xx > cx)
    upper = mask * (yy <= cy)
    lower = mask * (yy > cy)
    mean = _mean(image, mask)
    left_rgb = _mean(image, left)
    right_rgb = _mean(image, right)
    upper_rgb = _mean(image, upper)
    lower_rgb = _mean(image, lower)
    side_delta = float(np.linalg.norm(np.subtract(left_rgb, right_rgb)) / 441.673)
    vertical_delta = float(np.linalg.norm(np.subtract(upper_rgb, lower_rgb)) / 441.673)
    score = float(np.clip(max(side_delta, vertical_delta) / 0.25, 0.0, 1.0))
    return PigmentationStats(mean, left_rgb, right_rgb, upper_rgb, lower_rgb, side_delta, vertical_delta, score)

def opacity_map(mask: np.ndarray, stats: PigmentationStats, base_opacity: float) -> np.ndarray:
    """Preserve visible two-tone structure rather than flattening it."""
    h, w = mask.shape
    x = np.linspace(-1.0, 1.0, w)[None, :]
    side = np.where(x < 0, 1.0 - stats.side_delta * 0.22, 1.0 + stats.side_delta * 0.12)
    y = np.linspace(-1.0, 1.0, h)[:, None]
    vertical = np.where(y < 0, 1.0 - stats.vertical_delta * 0.18, 1.0 + stats.vertical_delta * 0.1)
    return np.clip(mask * base_opacity * side * vertical, 0.0, 1.0).astype(np.float32)

def liner_pairing(colour: tuple[int, int, int], stats: PigmentationStats) -> tuple[int, int, int]:
    """Suggest a nearby liner tone without forcing one or normalizing the base lip."""
    c = np.asarray(colour, dtype=np.float64)
    observed = np.asarray(stats.mean_rgb, dtype=np.float64)
    mix = c * 0.72 + observed * 0.28
    mix *= 0.88
    values = [int(np.clip(round(v), 0, 255)) for v in mix]
    return (values[0], values[1], values[2])

def disclosure(stats: PigmentationStats) -> list[str]:
    lines = ['Colour is composited over the observed lip pixels; the base lip is never normalized to pink.']
    if stats.two_tone_score >= 0.25:
        lines.append('Visible pigmentation differences are retained, so the same shade can read differently across the lip.')
    if stats.two_tone_score >= 0.55:
        lines.append('A liner pairing can improve edge consistency, but it is optional and no lighter base is applied.')
    return lines

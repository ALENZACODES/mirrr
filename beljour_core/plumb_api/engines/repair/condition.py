"""R12 photo-condition evidence before any Enhance rescue.

This is a deterministic image-quality heuristic, not a learned classifier. It does
not infer anybody's skin tone, age, gender, or ethnicity. Low illumination requires
agreement from the scene's bright tail and spatial tiles, rather than an 18%-grey
assumption about a face. A normally lit dark subject with a bright background must
not trigger exposure. ``old`` means a faded-scan appearance proxy; neither the date
of a photograph nor the age of its subject can be recovered from these features.

Mixed conditions retain separate flags. Denoising precedes deblurring, and only an
affirmative low-light flag permits exposure. These conservative thresholds are
declared engineering assumptions, to be assessed on the externally held face set.
Noise evidence uses the existing Donoho and Johnstone wavelet noise estimation
concept; the existing re-blur estimator supplies blur evidence. Both are concept
only, no code copied. No model, weights, training data, or face mapping.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Any

import numpy as np

from ..core.composite import decode
from ..core.filters import quantile
from .analyse import Analysis, analyse, gradient_energy, luma255

VERSION = "photo-condition-r12/1"
CLASSES = ("normal", "low_light", "blurry", "noisy", "old")
# Units are linear luminance except the explicitly named encoded/noise measures.
LOW_MEDIAN = 0.075
LOW_BRIGHT_TAIL = 0.18
LOW_TILE_MEDIAN = 0.12
LOW_TILE_SHARE = 0.75
NOISE_SIGMA = 3.0
BLUR_SIGMA = 0.8
MIN_EDGE_ENERGY = 0.2
FADED_BLACK_FLOOR = 0.14
FADED_RANGE = 0.29
FADED_SATURATION = 0.22
FADED_MIN_RANGE = 0.035
GRID = 4


@dataclass(frozen=True)
class ConditionEvidence:
    """Measurements with explicit units, suitable for a report without image bytes."""

    median_linear: float
    p05_linear: float
    p95_linear: float
    linear_range: float
    median_saturation: float
    dark_tile_share: float
    bright_tile_count: int
    tile_count: int
    noise_sigma_255: float
    blur_sigma_px: float
    edge_energy_255: float
    clipped_bright_share: float

    def to_json(self) -> dict[str, Any]:
        return {k: round(v, 8) if isinstance(v, float) else v for k, v in asdict(self).items()}


@dataclass(frozen=True)
class PhotoCondition:
    primary: str
    low_light: bool
    blurry: bool
    noisy: bool
    old: bool
    evidence: ConditionEvidence
    reasons: tuple[str, ...]
    version: str = VERSION
    method: str = "deterministic image-quality heuristic; not calibrated probability"
    old_note: str = "Old is a faded-scan appearance proxy, not photo dating or subject age."

    @property
    def needs_rescue(self) -> bool:
        return self.low_light or self.blurry or self.noisy or self.old

    def to_json(self) -> dict[str, Any]:
        result = asdict(self)
        result["evidence"] = self.evidence.to_json()
        result["reasons"] = list(self.reasons)
        return result


def _rgb(image: np.ndarray) -> np.ndarray:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("condition classifier expects RGB or RGBA uint8")
    if min(img.shape[:2]) < 4:
        raise ValueError("the photo is too small to classify")
    return img[..., :3]


def _tile_summary(luminance: np.ndarray) -> tuple[float, int, int]:
    h, w = luminance.shape
    dark, bright, count = 0, 0, 0
    for row in range(GRID):
        top, bottom = row * h // GRID, (row + 1) * h // GRID
        for column in range(GRID):
            left, right = column * w // GRID, (column + 1) * w // GRID
            tile = luminance[top:bottom, left:right]
            if tile.size:
                level = quantile(tile, 0.5)
                dark += int(level <= LOW_TILE_MEDIAN)
                bright += int(level >= LOW_BRIGHT_TAIL)
                count += 1
    return dark / count, bright, count


def measure_condition(image: np.ndarray, analysis: Analysis | None = None) -> ConditionEvidence:
    """Collect whole-scene evidence. Colour saturation is used only for fading."""
    img = _rgb(image)
    a = analysis if analysis is not None else analyse(img)
    lin = decode(img)
    luminance = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
    low, median, high = (quantile(luminance, q) for q in (0.05, 0.5, 0.95))
    rgb = img.astype(np.float64) / 255
    maximum, minimum = rgb.max(axis=2), rgb.min(axis=2)
    saturation = (maximum - minimum) / np.maximum(maximum, 1 / 255)
    dark, bright, count = _tile_summary(luminance)
    return ConditionEvidence(
        median_linear=median, p05_linear=low, p95_linear=high, linear_range=high - low,
        median_saturation=quantile(saturation, 0.5), dark_tile_share=dark,
        bright_tile_count=bright, tile_count=count, noise_sigma_255=float(a.noise_sigma),
        blur_sigma_px=float(a.blur_sigma), edge_energy_255=gradient_energy(luma255(img)),
        clipped_bright_share=float(a.clipped_bright),
    )


def classify_photo(image: np.ndarray, analysis: Analysis | None = None) -> PhotoCondition:
    """Classify observable defects. No RGB-to-skin threshold participates in exposure."""
    e = measure_condition(image, analysis)
    low = (e.median_linear <= LOW_MEDIAN and e.p95_linear <= LOW_BRIGHT_TAIL
           and e.dark_tile_share >= LOW_TILE_SHARE and e.bright_tile_count == 0)
    noisy = e.noise_sigma_255 >= NOISE_SIGMA
    # A flat image has no useful edge evidence; it is not proof of optical blur.
    blurry = e.blur_sigma_px >= BLUR_SIGMA and e.edge_energy_255 >= MIN_EDGE_ENERGY
    old = (not low and e.p05_linear >= FADED_BLACK_FLOOR
           and FADED_MIN_RANGE <= e.linear_range <= FADED_RANGE
           and e.median_saturation <= FADED_SATURATION)
    reasons: list[str] = []
    if low:
        reasons.append("Scene median, bright tail and spatial tiles agree on low illumination.")
    if noisy:
        reasons.append("Wavelet noise exceeds the declared luminance-noise threshold.")
    if blurry:
        reasons.append("Re-blur estimate exceeds the threshold and measurable edges exist.")
    if old:
        reasons.append("Raised blacks, compressed range and low saturation suggest a faded scan.")
    if not reasons:
        reasons.append("No measured rescue condition; preserve the original pixels.")
    primary = "low_light" if low else "old" if old else "noisy" if noisy else "blurry" if blurry else "normal"
    return PhotoCondition(primary, low, blurry, noisy, old, e, tuple(reasons))


@dataclass(frozen=True)
class RescuePlan:
    """A mode is a strength preference, never permission to run an unneeded rescue."""

    condition: str
    exposure: bool
    denoise: bool
    deblur: bool
    fade: bool
    requested_mode: str
    effective_mode: str
    skipped: tuple[str, ...]

    def to_json(self) -> dict[str, Any]:
        out = asdict(self)
        out["skipped"] = list(self.skipped)
        return out


def plan_rescue(condition: PhotoCondition, mode: str, strength: float,
                steps: dict[str, bool] | None = None) -> RescuePlan:
    """Evaluate independent defect flags; ``False`` can always switch a stage off."""
    if not isinstance(strength, (int, float)) or isinstance(strength, bool) or not math.isfinite(strength) or not 0 <= strength <= 1:
        raise ValueError("strength must be 0..1")
    allowed = {"white_balance", "exposure", "denoise", "deblur", "sharpen", "colour"}
    toggles = steps or {}
    unknown = set(toggles) - allowed
    if unknown:
        raise ValueError(f"unknown steps {sorted(unknown)}")
    if any(not isinstance(value, bool) for value in toggles.values()):
        raise ValueError("step switches must be booleans")
    enabled = strength > 0
    exposure = enabled and condition.low_light and toggles.get("exposure", True)
    denoise = enabled and condition.noisy and toggles.get("denoise", True)
    deblur = enabled and condition.blurry and toggles.get("deblur", True)
    fade = enabled and condition.old and toggles.get("colour", True)
    skipped = []
    if not exposure:
        skipped.append("exposure: no low-light evidence or switched off")
    if not denoise:
        skipped.append("denoise: no measured noise or switched off")
    if not deblur:
        skipped.append("deblur: no measured blur or switched off")
    if not fade:
        skipped.append("fade: no faded-scan evidence or switched off")
    skipped.append("white_balance: no trusted neutral reference")
    skipped.append("sharpen: no unconditional detail boost")
    effective = mode if condition.needs_rescue else "preserve"
    if mode == "low_light" and not condition.low_light and condition.needs_rescue:
        effective = "natural"
    return RescuePlan(condition.primary, exposure, denoise, deblur, fade, mode, effective, tuple(skipped))

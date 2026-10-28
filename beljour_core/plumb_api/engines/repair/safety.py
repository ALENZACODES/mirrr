"""R12 bounded exposure and output guards for Enhance, without a learned model.

Engineering bounds retain the real-face report's 25 encoded levels and 2 percentage
point clipping limits. No metric threshold is relaxed. Linear exposure never exceeds
1.65x, uses one scalar per RGB pixel (no hue or skin-tone targeting), and rolls off
before highlights. The final guard measures actual rounded output pixels. It reduces
the proposed edit when necessary and reports that reduction; it never declares a
real-face or perceptual PASS. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.composite import decode, encode
from ..core.filters import quantile
from .analyse import luma255
from .face_tone import FaceToneMeter, FaceToneMetrics, face_weights, metered_luminance

U8 = NDArray[np.uint8]
MAX_EXPOSURE_GAIN = 1.65
MAX_MEAN_CHANGE = 25.0
MAX_CLIP_INCREASE = 0.02
HIGHLIGHT_START = 0.60
HIGHLIGHT_CEILING = 0.97
GUARD_STEPS = 16
MAX_FADE_CONTRAST = 1.12


def _rgb(image: np.ndarray) -> U8:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4) or min(img.shape[:2]) < 1:
        raise ValueError("expected non-empty RGB or RGBA uint8")
    return img[..., :3]


def _unit(value: float, name: str) -> None:
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError(f"{name} must be 0..1")


@dataclass(frozen=True)
class ExposureResult:
    image: U8
    requested_gain: float
    applied_gain: float
    max_pixel_gain: float
    rolled_off_pixels: int

    def to_json(self) -> dict[str, Any]:
        return {"requested_gain": round(self.requested_gain, 8), "applied_gain": round(self.applied_gain, 8),
                "max_pixel_gain": round(self.max_pixel_gain, 8), "rolled_off_pixels": self.rolled_off_pixels}


def bounded_exposure(image: np.ndarray, *, target: float = 0.18, weight: float = 0.5,
                     face_mask: object | None = None) -> ExposureResult:
    """Lift a classified dark scene by at most 0.73 EV, with highlight preservation."""
    _unit(weight, "weight")
    if not math.isfinite(target) or not 0 < target <= 1:
        raise ValueError("target must be in (0,1]")
    img = _rgb(image)
    lin = decode(img)
    weights = face_weights(face_mask, img.shape[:2]) if face_mask is not None else None
    request = max(1.0, target / max(metered_luminance(lin, weights), 1e-6))
    gain = 1 + weight * (min(MAX_EXPOSURE_GAIN, request) - 1)
    maximum = lin.max(axis=2)
    t = np.clip((maximum - HIGHLIGHT_START) / (HIGHLIGHT_CEILING - HIGHLIGHT_START), 0, 1)
    shoulder = 1 - t * t * (3 - 2 * t)
    pixel_gain = 1 + (gain - 1) * shoulder
    ceiling_gain = HIGHLIGHT_CEILING / np.maximum(maximum, 1e-12)
    pixel_gain = np.where(maximum < HIGHLIGHT_CEILING, np.minimum(pixel_gain, ceiling_gain), 1.0)
    pixel_gain = np.maximum(pixel_gain, 1.0)
    out = encode(np.clip(lin * pixel_gain[..., None], 0, 1))
    return ExposureResult(out, request, gain, float(np.max(pixel_gain)), int((pixel_gain < gain - 1e-10).sum()))


def restore_faded_contrast(image: np.ndarray, strength: float) -> U8:
    """Small luminance-only expansion around the scene median; no recolouring."""
    _unit(strength, "strength")
    img = _rgb(image)
    if strength == 0:
        return img.copy()
    rgb = img.astype(np.float64)
    y = luma255(img)
    centre = quantile(y, 0.5)
    delta = (y - centre) * (MAX_FADE_CONTRAST - 1) * strength
    # Equal encoded increments preserve channel differences; gamut limits cannot clip.
    delta = np.maximum(delta, -rgb.min(axis=2))
    delta = np.minimum(delta, 255 - rgb.max(axis=2))
    return np.clip(np.rint(rgb + delta[..., None]), 0, 255).astype(np.uint8)


@dataclass(frozen=True)
class SafetyMetrics:
    mean_abs_change: float
    luma_clip_increase: float
    channel_clip_increase: float
    dark_clip_increase: float

    @property
    def within_limits(self) -> bool:
        return (self.mean_abs_change <= MAX_MEAN_CHANGE
                and self.luma_clip_increase <= MAX_CLIP_INCREASE + 1e-12
                and self.channel_clip_increase <= MAX_CLIP_INCREASE + 1e-12
                and self.dark_clip_increase <= MAX_CLIP_INCREASE + 1e-12)

    def to_json(self) -> dict[str, float]:
        return {k: round(v, 8) for k, v in asdict(self).items()}


def measure_safety(original: np.ndarray, proposed: np.ndarray) -> SafetyMetrics:
    a, b = _rgb(original), _rgb(proposed)
    if a.shape != b.shape:
        raise ValueError("before and after images must have the same shape")
    ay, by = luma255(a), luma255(b)
    return SafetyMetrics(
        float(np.abs(a.astype(np.float64) - b.astype(np.float64)).mean()),
        float((by >= 253).mean() - (ay >= 253).mean()),
        float((b.max(axis=2) >= 253).mean() - (a.max(axis=2) >= 253).mean()),
        float((by <= 2).mean() - (ay <= 2).mean()),
    )


@dataclass(frozen=True)
class GuardedResult:
    image: U8
    metrics: SafetyMetrics
    applied_mix: float
    reduced: bool
    proposals_checked: int
    face_tone: FaceToneMetrics | None = None

    def to_json(self) -> dict[str, Any]:
        report = {"metrics": self.metrics.to_json(), "applied_mix": round(self.applied_mix, 8),
                "reduced": self.reduced, "proposals_checked": self.proposals_checked,
                "limits": {"mean_abs_change": MAX_MEAN_CHANGE, "clip_increase": MAX_CLIP_INCREASE,
                           "exposure_gain": MAX_EXPOSURE_GAIN}}
        if self.face_tone is not None:
            report["face_tone"] = self.face_tone.to_json()
        return report


def guard_output(original: np.ndarray, proposed: np.ndarray, *, face_mask: object | None = None) -> GuardedResult:
    """Return measured-safe bytes or the original, with actual applied mix reported."""
    a, b = _rgb(original), _rgb(proposed)
    measured = measure_safety(a, b)
    meter = FaceToneMeter(a, face_mask) if face_mask is not None else None
    face = meter.measure(b) if meter is not None else None
    if measured.within_limits and (face is None or face.within_limit):
        return GuardedResult(b.copy(), measured, 1.0, False, 1, face)
    delta = b.astype(np.float64) - a.astype(np.float64)
    lo, hi = 0.0, 1.0
    kept = a.copy()
    kept_metrics = measure_safety(a, kept)
    kept_face = meter.measure(kept) if meter is not None else None
    for _ in range(GUARD_STEPS):
        mix = (lo + hi) / 2
        candidate = np.clip(np.rint(a.astype(np.float64) + delta * mix), 0, 255).astype(np.uint8)
        current = measure_safety(a, candidate)
        candidate_face = meter.measure(candidate) if meter is not None else None
        if current.within_limits and (candidate_face is None or candidate_face.within_limit):
            lo, kept, kept_metrics = mix, candidate, current
            kept_face = candidate_face
        else:
            hi = mix
    # Only a measured-safe candidate is retained. Quantisation discontinuities are
    # harmless because the returned bytes, not a floating-point prediction, were checked.
    return GuardedResult(kept, kept_metrics, lo, True, GUARD_STEPS + 1, kept_face)

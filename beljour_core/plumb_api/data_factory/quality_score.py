"""Image quality scoring: blur, exposure, noise, resolution and face-box size.

Each measure maps to a sub-score between 0 and 1 and may raise a hard reject.
The overall score is a weighted mean of sub-scores; an image passes when it
has no hard reject and its score reaches the minimum. Every threshold lives in
QualityConfig so a run's config hash pins them. Measures run on a grey copy
scaled to a fixed longest side, so blur and noise compare across resolutions.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import asdict, dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from .perceptual import to_grey
from .records import FaceBox

FloatArray = NDArray[np.float64]

NOISE_KERNEL = np.array([[1.0, -2.0, 1.0], [-2.0, 4.0, -2.0], [1.0, -2.0, 1.0]])


@dataclass(frozen=True)
class QualityConfig:
    """All quality thresholds in one place."""

    analysis_side: int = 512
    blur_reject: float = 15.0
    blur_good: float = 120.0
    highlight_level: int = 250
    shadow_level: int = 5
    clipped_reject: float = 0.25
    clipped_good: float = 0.02
    mean_low: float = 25.0
    mean_high: float = 235.0
    noise_good: float = 2.0
    noise_reject: float = 12.0
    min_side_reject: int = 128
    min_side_good: int = 512
    face_min_side_reject: int = 48
    face_min_side_good: int = 160
    face_min_fraction: float = 0.05
    min_score: float = 0.5
    weights: Mapping[str, float] = field(default_factory=lambda: {
        "blur": 0.3, "exposure": 0.25, "noise": 0.15, "resolution": 0.15, "face": 0.15,
    })

    def __post_init__(self) -> None:
        problems: list[str] = []
        if self.blur_good <= self.blur_reject:
            problems.append("blur_good must exceed blur_reject")
        if not 0 < self.clipped_good < self.clipped_reject <= 1:
            problems.append("need 0 < clipped_good < clipped_reject <= 1")
        if self.noise_reject <= self.noise_good:
            problems.append("noise_reject must exceed noise_good")
        if self.min_side_good <= self.min_side_reject:
            problems.append("min_side_good must exceed min_side_reject")
        if self.face_min_side_good <= self.face_min_side_reject:
            problems.append("face_min_side_good must exceed face_min_side_reject")
        if not 0 <= self.min_score <= 1:
            problems.append("min_score must be between 0 and 1")
        if self.analysis_side < 32:
            problems.append("analysis_side must be at least 32")
        unknown = set(self.weights) - {"blur", "exposure", "noise", "resolution", "face"}
        if unknown or any(value < 0 for value in self.weights.values()):
            problems.append("weights must be non-negative and name known measures")
        if problems:
            raise ValueError("invalid quality config: " + "; ".join(problems))

    def to_dict(self) -> dict[str, Any]:
        """Plain form for config hashing."""
        out = asdict(self)
        out["weights"] = dict(sorted(self.weights.items()))
        return out

    @classmethod
    def from_dict(cls, raw: Mapping[str, Any]) -> QualityConfig:
        """Build from JSON; unknown keys are an error."""
        allowed = set(cls.__dataclass_fields__)
        unknown = sorted(set(raw) - allowed)
        if unknown:
            raise ValueError("unknown quality config keys: " + ", ".join(unknown))
        values = dict(raw)
        if "weights" in values:
            values["weights"] = {str(k): float(v) for k, v in dict(values["weights"]).items()}
        return cls(**values)


@dataclass(frozen=True)
class QualityMeasures:
    """Raw measurements of one image."""

    blur_variance: float
    highlight_fraction: float
    shadow_fraction: float
    mean_level: float
    noise_sigma: float
    min_side: int
    face_min_side: int | None
    face_fraction: float | None

    def to_dict(self) -> dict[str, Any]:
        """Rounded values for manifests and reports."""
        return {key: (round(value, 4) if isinstance(value, float) else value)
                for key, value in asdict(self).items()}


@dataclass(frozen=True)
class QualityResult:
    """Score, pass flag, sub-scores and plain-language reasons."""

    score: float
    passed: bool
    subscores: dict[str, float]
    reasons: list[str]
    rejects: list[str]
    measures: QualityMeasures

    def to_dict(self) -> dict[str, Any]:
        """JSON form."""
        return {"score": round(self.score, 4), "passed": self.passed,
                "subscores": {k: round(v, 4) for k, v in self.subscores.items()},
                "reasons": self.reasons, "rejects": self.rejects,
                "measures": self.measures.to_dict()}


def analysis_grey(rgb: NDArray[np.uint8], side: int) -> FloatArray:
    """Grey copy scaled so its longest side is at most `side`."""
    grey = to_grey(rgb)
    height, width = grey.shape
    longest = max(height, width)
    if longest > side:
        scale = side / longest
        size = (max(1, round(width * scale)), max(1, round(height * scale)))
        grey = np.asarray(Image.fromarray(grey, mode="L").resize(size, Image.Resampling.BOX))
    return grey.astype(np.float64)


def laplacian_variance(grey: FloatArray) -> float:
    """Variance of the 4-neighbour Laplacian; low values mean blur."""
    if grey.shape[0] < 3 or grey.shape[1] < 3:
        return 0.0
    centre = grey[1:-1, 1:-1]
    lap = (grey[:-2, 1:-1] + grey[2:, 1:-1] + grey[1:-1, :-2] + grey[1:-1, 2:]) - 4.0 * centre
    return float(lap.var())


def noise_sigma(grey: FloatArray) -> float:
    """Fast noise estimate (Immerkaer 1996) from a Laplacian-difference kernel."""
    height, width = grey.shape
    if height < 3 or width < 3:
        return 0.0
    total = np.zeros((height - 2, width - 2))
    for dy in range(3):
        for dx in range(3):
            total += NOISE_KERNEL[dy, dx] * grey[dy:dy + height - 2, dx:dx + width - 2]
    factor = math.sqrt(math.pi / 2.0) / (6.0 * (width - 2) * (height - 2))
    return float(factor * np.abs(total).sum())


def measure(rgb: NDArray[np.uint8], config: QualityConfig,
            face_box: FaceBox | None = None) -> QualityMeasures:
    """Compute raw measures; the face box is only used when supplied."""
    grey = analysis_grey(rgb, config.analysis_side)
    full = to_grey(rgb)
    height, width = int(rgb.shape[0]), int(rgb.shape[1])
    face_side: int | None = None
    face_fraction: float | None = None
    if face_box is not None:
        face_side = min(face_box.width, face_box.height)
        face_fraction = (face_box.width * face_box.height) / float(width * height)
    return QualityMeasures(
        blur_variance=laplacian_variance(grey),
        highlight_fraction=float(np.mean(full >= config.highlight_level)),
        shadow_fraction=float(np.mean(full <= config.shadow_level)),
        mean_level=float(full.mean()),
        noise_sigma=noise_sigma(grey),
        min_side=min(width, height),
        face_min_side=face_side,
        face_fraction=face_fraction,
    )


def _ramp(value: float, bad: float, good: float) -> float:
    """0 at `bad`, 1 at `good`, linear between; works in either direction."""
    if good == bad:
        return 1.0 if value >= good else 0.0
    position = (value - bad) / (good - bad)
    return min(1.0, max(0.0, position))


def _exposure(m: QualityMeasures, c: QualityConfig, reasons: list[str],
              rejects: list[str]) -> float:
    clipped = max(m.highlight_fraction, m.shadow_fraction)
    score = _ramp(clipped, c.clipped_reject, c.clipped_good)
    if m.highlight_fraction >= c.clipped_reject:
        rejects.append(f"overexposed: {m.highlight_fraction:.0%} of pixels clipped bright")
    elif m.highlight_fraction > c.clipped_good:
        reasons.append(f"some clipped highlights ({m.highlight_fraction:.1%})")
    if m.shadow_fraction >= c.clipped_reject:
        rejects.append(f"underexposed: {m.shadow_fraction:.0%} of pixels clipped dark")
    elif m.shadow_fraction > c.clipped_good:
        reasons.append(f"some clipped shadows ({m.shadow_fraction:.1%})")
    if m.mean_level < c.mean_low:
        reasons.append(f"very dark overall (mean level {m.mean_level:.0f})")
        score = min(score, 0.3)
    elif m.mean_level > c.mean_high:
        reasons.append(f"very bright overall (mean level {m.mean_level:.0f})")
        score = min(score, 0.3)
    return score


def _face(m: QualityMeasures, c: QualityConfig, reasons: list[str],
          rejects: list[str]) -> float | None:
    if m.face_min_side is None or m.face_fraction is None:
        return None
    score = _ramp(float(m.face_min_side), c.face_min_side_reject, c.face_min_side_good)
    if m.face_min_side < c.face_min_side_reject:
        rejects.append(f"face box too small ({m.face_min_side} px)")
    elif score < 1.0:
        reasons.append(f"face box is small ({m.face_min_side} px)")
    if m.face_fraction < c.face_min_fraction:
        reasons.append(f"face covers only {m.face_fraction:.1%} of the image")
        score = min(score, 0.5)
    return score


def score_measures(m: QualityMeasures, c: QualityConfig) -> QualityResult:
    """Turn measures into sub-scores, reasons and a pass decision."""
    reasons: list[str] = []
    rejects: list[str] = []
    subscores: dict[str, float] = {}
    subscores["blur"] = _ramp(m.blur_variance, c.blur_reject, c.blur_good)
    if m.blur_variance < c.blur_reject:
        rejects.append(f"blurred (Laplacian variance {m.blur_variance:.1f})")
    elif subscores["blur"] < 1.0:
        reasons.append(f"slightly soft (Laplacian variance {m.blur_variance:.1f})")
    subscores["exposure"] = _exposure(m, c, reasons, rejects)
    subscores["noise"] = _ramp(m.noise_sigma, c.noise_reject, c.noise_good)
    if m.noise_sigma >= c.noise_reject:
        rejects.append(f"noisy (sigma {m.noise_sigma:.1f})")
    elif subscores["noise"] < 1.0:
        reasons.append(f"some noise (sigma {m.noise_sigma:.1f})")
    subscores["resolution"] = _ramp(float(m.min_side), c.min_side_reject, c.min_side_good)
    if m.min_side < c.min_side_reject:
        rejects.append(f"resolution too low ({m.min_side} px short side)")
    elif subscores["resolution"] < 1.0:
        reasons.append(f"modest resolution ({m.min_side} px short side)")
    face = _face(m, c, reasons, rejects)
    if face is not None:
        subscores["face"] = face
    total_weight = sum(c.weights.get(name, 0.0) for name in subscores)
    if total_weight <= 0:
        score = 0.0
    else:
        score = sum(c.weights.get(name, 0.0) * value
                    for name, value in subscores.items()) / total_weight
    if score < c.min_score and not rejects:
        rejects.append(f"overall score {score:.2f} is below {c.min_score:.2f}")
    if not reasons and not rejects:
        reasons.append("no quality issues found")
    return QualityResult(score, not rejects, subscores, reasons, rejects, m)


def score_image(rgb: NDArray[np.uint8], config: QualityConfig | None = None,
                face_box: FaceBox | None = None) -> QualityResult:
    """Measure and score one RGB image."""
    active = config or QualityConfig()
    return score_measures(measure(rgb, active, face_box), active)

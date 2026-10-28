"""Machine-readable acceptance metrics for Lane B easy filters. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

from .common import Image, Mask, unchanged_fraction, validate_image, validate_mask

FilterId = Literal[
    "playful_paws",
    "archive_flash",
    "iris_tint",
    "atelier_frames",
    "sunlit_skin",
    "ceremony_light_check",
]


@dataclass(frozen=True)
class PassDefinition:
    filter_id: FilterId
    label: str
    minimum_changed_fraction: float
    protected_unchanged: float
    iris_unchanged: float | None
    alpha_unchanged: float
    note: str


@dataclass(frozen=True)
class IdentityMetrics:
    changed_fraction: float
    protected_unchanged: float
    iris_unchanged: float | None
    alpha_unchanged: float


@dataclass(frozen=True)
class Evaluation:
    filter_id: FilterId
    metrics: IdentityMetrics
    passed: bool
    failures: tuple[str, ...]


PASS_DEFINITIONS: tuple[PassDefinition, ...] = (
    PassDefinition(
        "playful_paws",
        "Playful Paws",
        0.005,
        1.0,
        1.0,
        1.0,
        "Original overlays may cover face pixels but supplied identity marks and iris pixels remain exact.",
    ),
    PassDefinition(
        "archive_flash",
        "Archive Flash",
        0.20,
        1.0,
        1.0,
        1.0,
        "Photo treatment changes tone and grain while protected marks and iris colour remain exact.",
    ),
    PassDefinition(
        "iris_tint",
        "Iris Tint",
        0.001,
        1.0,
        None,
        1.0,
        "Iris colour is intentionally editable; pupil, highlights and supplied identity marks are protected separately.",
    ),
    PassDefinition(
        "atelier_frames",
        "Atelier Frames",
        0.002,
        1.0,
        1.0,
        1.0,
        "Frame art is local and must not recolour the iris or supplied identity marks.",
    ),
    PassDefinition(
        "sunlit_skin",
        "Sunlit Skin",
        0.02,
        1.0,
        1.0,
        1.0,
        "Skin-only additive warmth preserves iris colour and supplied natural marks.",
    ),
    PassDefinition(
        "ceremony_light_check",
        "Ceremony Light Check",
        0.02,
        1.0,
        1.0,
        1.0,
        "Local makeup may change allowed masks only; iris and supplied identity marks remain exact.",
    ),
)


def definition(filter_id: FilterId) -> PassDefinition:
    for item in PASS_DEFINITIONS:
        if item.filter_id == filter_id:
            return item
    raise ValueError(f"unknown filter id {filter_id}")


def changed_fraction(before: Image, after: Image) -> float:
    validate_image(before)
    validate_image(after)
    if before.shape != after.shape:
        raise ValueError("before and after shapes must match")
    changed = np.any(before != after, axis=2)
    return float(np.count_nonzero(changed)) / float(changed.size)


def alpha_unchanged_fraction(before: Image, after: Image) -> float:
    validate_image(before)
    validate_image(after)
    if before.shape[2] < 4 or after.shape[2] < 4:
        return 1.0
    same = before[..., 3] == after[..., 3]
    return float(np.count_nonzero(same)) / float(same.size)


def measure_identity(
    before: Image,
    after: Image,
    protected: Mask,
    *,
    iris: Mask | None = None,
) -> IdentityMetrics:
    height, width = validate_image(before)
    validate_image(after)
    if before.shape != after.shape:
        raise ValueError("before and after shapes must match")
    protected_mask = validate_mask(protected, height, width, "protected")
    iris_score: float | None = None
    if iris is not None:
        iris_score = unchanged_fraction(before, after, validate_mask(iris, height, width, "iris"))
    return IdentityMetrics(
        changed_fraction(before, after),
        unchanged_fraction(before, after, protected_mask),
        iris_score,
        alpha_unchanged_fraction(before, after),
    )


def evaluate(
    filter_id: FilterId,
    before: Image,
    after: Image,
    protected: Mask,
    *,
    iris: Mask | None = None,
) -> Evaluation:
    spec = definition(filter_id)
    metrics = measure_identity(before, after, protected, iris=iris)
    failures: list[str] = []
    if metrics.changed_fraction + 1e-12 < spec.minimum_changed_fraction:
        failures.append("effect below minimum changed-pixel fraction")
    if metrics.protected_unchanged + 1e-12 < spec.protected_unchanged:
        failures.append("protected identity pixels changed")
    if spec.iris_unchanged is not None:
        if metrics.iris_unchanged is None:
            failures.append("iris evidence missing")
        elif metrics.iris_unchanged + 1e-12 < spec.iris_unchanged:
            failures.append("iris colour pixels changed")
    if metrics.alpha_unchanged + 1e-12 < spec.alpha_unchanged:
        failures.append("alpha channel changed")
    return Evaluation(filter_id, metrics, not failures, tuple(failures))


def validate_definitions() -> tuple[str, ...]:
    expected: set[FilterId] = {
        "playful_paws",
        "archive_flash",
        "iris_tint",
        "atelier_frames",
        "sunlit_skin",
        "ceremony_light_check",
    }
    seen = {item.filter_id for item in PASS_DEFINITIONS}
    problems: list[str] = []
    if seen != expected:
        problems.append("pass-definition ids do not match the six R19B filters")
    if len(seen) != len(PASS_DEFINITIONS):
        problems.append("duplicate pass-definition id")
    for item in PASS_DEFINITIONS:
        if not 0.0 <= item.minimum_changed_fraction <= 1.0:
            problems.append(f"{item.filter_id}: changed fraction out of range")
        if item.protected_unchanged != 1.0 or item.alpha_unchanged != 1.0:
            problems.append(f"{item.filter_id}: identity and alpha thresholds must remain exact")
        if item.filter_id != "iris_tint" and item.iris_unchanged != 1.0:
            problems.append(f"{item.filter_id}: iris threshold must remain exact")
        if item.filter_id == "iris_tint" and item.iris_unchanged is not None:
            problems.append("iris_tint intentionally changes iris colour")
    return tuple(problems)

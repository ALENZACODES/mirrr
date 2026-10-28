"""Fail-closed identity guard for face-adjacent posture simulations.

This is a typed adapter boundary until Lane H's public identity guard lands.
The test double must be passed explicitly; production never silently skips it.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Protocol

import numpy as np
from numpy.typing import NDArray

from .catalogue import SIMULATION_LABEL, require_compatible
from .levels import DEFAULT_LEVEL, checked_level, level_plan
from .points import Controls
from .render import PostureOutcome, render

U8 = NDArray[np.uint8]
FACE_MOVING = frozenset({"lean", "rounded_shoulders", "forward_head"})
DEFAULT_LOCK_LEVEL = 5.0
DEFAULT_IDENTITY_FLOOR = 0.95
LOW_LOCK_FLOOR = 0.80


class IdentityLockUnavailable(ValueError):
    """No provider is present to defend the face region."""


@dataclass(frozen=True)
class GuardDecision:
    image: U8
    similarity: float


class FaceIdentityGuard(Protocol):
    def guard(self, before: U8, after: U8, lock_level: float) -> GuardDecision:
        """Return protected pixels and a measured similarity in [0, 1]."""
        ...


@dataclass(frozen=True)
class GuardedPostureResult:
    image: U8
    outcome: PostureOutcome
    similarity: float | None
    identity_recovered: bool
    lock_level: float
    label: str = SIMULATION_LABEL

    def export_metadata(self) -> dict[str, str | float | bool]:
        return {
            "simulation": True,
            "label": self.label,
            "identity_lock_on": True,
            "lock_level": self.lock_level,
            "identity_recovered": self.identity_recovered,
        }


def identity_floor(level: float) -> float:
    value = checked_level(level)
    return LOW_LOCK_FLOOR + (DEFAULT_IDENTITY_FLOOR - LOW_LOCK_FLOOR) * (value - 1.0) / 4.0


def guarded_render(
    source: U8,
    person_mask: NDArray[np.float32],
    controls: Controls,
    fix: str,
    level: float = DEFAULT_LEVEL,
    *,
    guard: FaceIdentityGuard | None = None,
    lock_level: float = DEFAULT_LOCK_LEVEL,
    fill: str = "none",
) -> GuardedPostureResult:
    """Always invoke the identity guard for face-touching edits, including zero effect.

    If a guard declines or reports poor similarity, restore the original photo.
    There is no hard-coded provider, cloud call, face model or mock in production.
    """
    require_compatible(controls, fix)
    checked_level(level)
    checked_lock = checked_level(lock_level)
    if fix in FACE_MOVING and guard is None:
        raise IdentityLockUnavailable("Identity lock is required for this face-adjacent edit.")
    p = level_plan(controls, fix, level)
    outcome = render(source, person_mask, p, fill=fill)
    if fix not in FACE_MOVING:
        return GuardedPostureResult(outcome.image.copy(), outcome, None, False, checked_lock)
    if guard is None:
        raise IdentityLockUnavailable("Identity lock is required for this face-adjacent edit.")
    decision = guard.guard(source.copy(), outcome.image.copy(), checked_lock)
    if decision.image.shape != source.shape or decision.image.dtype != np.uint8:
        raise IdentityLockUnavailable("Identity guard returned an incompatible image.")
    if not math.isfinite(decision.similarity) or not 0 <= decision.similarity <= 1:
        raise IdentityLockUnavailable("Identity guard returned invalid similarity.")
    restored = decision.similarity < identity_floor(checked_lock)
    image = source.copy() if restored else decision.image.copy()
    return GuardedPostureResult(image, outcome, decision.similarity, restored, checked_lock)

"""Final-pixel inspection of a protected posture simulation, counts only.

Checks the output that would be shown or exported, not the plan: exact protected
head pixels, untouched pixels outside the body band, the movement cap, the fold
guard's Jacobian floor, image shape/alpha and the simulation label. A passing
inspection means the code stayed inside its limits on this image; it is not a
quality or identity assessment. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import numpy as np

from ..warp.fold import Q3_MINIMUM
from .catalogue import SIMULATION_LABEL
from .protected import MASK_LEVEL, U8, ProtectedPostureResult, checked_head_mask, checked_source

MOVEMENT_TOLERANCE = 1e-6


@dataclass(frozen=True)
class BodyInspection:
    head_pixels: int
    head_changed: int
    outside_band_pixels: int
    outside_band_changed: int
    movement_px: float
    cap_px: float
    min_jacobian: float
    reasons: tuple[str, ...]

    @property
    def passed(self) -> bool:
        return not self.reasons

    def to_json(self) -> dict[str, Any]:
        """Scalar counts and reason codes only: no pixels, masks or landmarks."""
        return {
            "head_pixels": self.head_pixels,
            "head_changed": self.head_changed,
            "outside_band_pixels": self.outside_band_pixels,
            "outside_band_changed": self.outside_band_changed,
            "movement_px": round(self.movement_px, 6),
            "cap_px": round(self.cap_px, 6),
            "min_jacobian": round(self.min_jacobian, 6),
            "passed": self.passed,
            "reasons": list(self.reasons),
        }


def _changed(before: U8, after: U8, where: np.ndarray) -> int:
    return int(np.any(before[where] != after[where], axis=-1).sum())


def inspect_protected(source: object, result: ProtectedPostureResult, head_mask: object) -> BodyInspection:
    """Inspect a result against the untouched source and the user's head marking."""
    original = checked_source(source)
    head = checked_head_mask(head_mask, (original.shape[0], original.shape[1]))
    output = result.image
    reasons: list[str] = []
    if not isinstance(output, np.ndarray) or output.dtype != np.uint8 or output.shape != original.shape:
        return BodyInspection(int(head.sum()), -1, -1, -1, math.nan, math.nan, math.nan, ("output_shape_changed",))
    band = np.asarray(result.guarded.outcome.band, dtype=np.float32) >= MASK_LEVEL
    outside = ~band
    head_changed = _changed(original, output, head)
    outside_changed = _changed(original, output, outside)
    if head_changed:
        reasons.append("protected_head_changed")
    if outside_changed:
        reasons.append("outside_band_changed")
    if original.shape[2] == 4 and np.any(output[outside, 3] != original[outside, 3]):
        reasons.append("alpha_changed_outside_band")
    plan = result.plan
    movement = float(plan.largest_move_px)
    cap = float(plan.cap_px)
    if not (math.isfinite(movement) and math.isfinite(cap)) or movement > cap + MOVEMENT_TOLERANCE:
        reasons.append("movement_over_cap")
    min_det = float(result.guarded.outcome.metrics.get("min_det", math.nan))
    if not math.isfinite(min_det) or min_det < Q3_MINIMUM:
        reasons.append("fold_guard_below_floor")
    if result.label != SIMULATION_LABEL or result.guarded.label != SIMULATION_LABEL:
        reasons.append("simulation_label_missing")
    return BodyInspection(
        int(head.sum()), head_changed, int(outside.sum()), outside_changed,
        movement, cap, min_det, tuple(reasons),
    )

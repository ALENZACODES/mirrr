"""Conservative sampled inverse-warp checks for local pose edits.

The signed Jacobian is measured on the actual source sampling field, including
person-mask attenuation. This is a numerical preflight, not a real-face pass.
Every decision is local to the open photo and never records control points.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .errors import CommandUnavailable, CommandValidationError
from .pose_geometry import PoseEvidence, displacement

FloatArray = npt.NDArray[np.float64]


@dataclass(frozen=True, slots=True)
class PoseSafetyRules:
    minimum_determinant: float = 0.25
    maximum_determinant: float = 3.0
    minimum_retained_dose: float = 0.25
    sample_side: int = 49
    search_steps: int = 12

    def __post_init__(self) -> None:
        if (
            not math.isfinite(self.minimum_determinant)
            or not math.isfinite(self.maximum_determinant)
            or not 0.0 < self.minimum_determinant < 1.0
            or not self.maximum_determinant > 1.0
            or not math.isfinite(self.minimum_retained_dose)
            or not 0.0 < self.minimum_retained_dose <= 1.0
            or type(self.sample_side) is not int
            or not 9 <= self.sample_side <= 97
            or type(self.search_steps) is not int
            or not 4 <= self.search_steps <= 24
        ):
            raise CommandValidationError(
                "invalid_pose_guard", "Pose Jacobian rules are not bounded.",
            )


@dataclass(frozen=True, slots=True)
class PoseSafetyDecision:
    requested_dose: float
    used_dose: float
    smallest_determinant: float
    largest_determinant: float
    checked_cells: int
    backoff_count: int
    sample_side: int

    @property
    def retention(self) -> float:
        if self.requested_dose == 0.0:
            return 1.0
        return self.used_dose / self.requested_dose

    def public_metadata(self) -> dict[str, float | int | bool]:
        return {
            "smallest_determinant": round(self.smallest_determinant, 6),
            "largest_determinant": round(self.largest_determinant, 6),
            "retention": round(self.retention, 6),
            "checked_cells": self.checked_cells,
            "backoff_count": self.backoff_count,
            "sample_side": self.sample_side,
            "realface_verified": False,
        }


def _checked_mask(evidence: PoseEvidence) -> npt.NDArray[np.uint8]:
    return np.frombuffer(evidence.body_mask, dtype=np.uint8).reshape(
        evidence.height, evidence.width,
    )


def _sample_attenuation(evidence: PoseEvidence, xs: FloatArray, ys: FloatArray) -> FloatArray:
    """Sample the same nine-point erosion ramp used by the renderer."""
    mask = _checked_mask(evidence)
    ix = np.rint(xs).astype(np.intp)
    iy = np.rint(ys).astype(np.intp)
    ix = np.clip(ix, 0, evidence.width - 1)
    iy = np.clip(iy, 0, evidence.height - 1)
    centre = np.asarray(mask[iy, ix], dtype=np.float64) / 255.0
    lowest = centre.copy()
    for row_offset in (-1, 0, 1):
        ry = np.clip(iy + row_offset, 0, evidence.height - 1)
        for column_offset in (-1, 0, 1):
            rx = np.clip(ix + column_offset, 0, evidence.width - 1)
            sampled = np.asarray(mask[ry, rx], dtype=np.float64) / 255.0
            lowest = np.minimum(lowest, sampled)
    return 0.3 * centre + 0.7 * lowest


def _sample_field(evidence: PoseEvidence, dose: float, side: int) -> tuple[FloatArray, FloatArray, float, float]:
    horizontal = np.linspace(0.0, evidence.width - 1.0, side, dtype=np.float64)
    vertical = np.linspace(0.0, evidence.height - 1.0, side, dtype=np.float64)
    xx, yy = np.meshgrid(horizontal, vertical)
    offset_x, offset_y = displacement(evidence, xx, yy, dose)
    attenuation = _sample_attenuation(evidence, xx, yy)
    source_x = xx - offset_x * attenuation
    source_y = yy - offset_y * attenuation
    return source_x, source_y, float(horizontal[1] - horizontal[0]), float(vertical[1] - vertical[0])


def inverse_jacobians(source_x: FloatArray, source_y: FloatArray, step_x: float, step_y: float) -> FloatArray:
    """One determinant per checked field cell; positive means no local inversion."""
    if (
        source_x.ndim != 2
        or source_x.shape != source_y.shape
        or min(source_x.shape) < 2
        or not math.isfinite(step_x)
        or not math.isfinite(step_y)
        or step_x <= 0.0
        or step_y <= 0.0
        or not bool(np.all(np.isfinite(source_x)))
        or not bool(np.all(np.isfinite(source_y)))
    ):
        raise CommandValidationError(
            "invalid_pose_guard", "Inverse sampling field must be a finite 2D grid.",
        )
    xx_x = np.diff(source_x, axis=1)[:-1, :] / step_x
    yy_x = np.diff(source_y, axis=1)[:-1, :] / step_x
    xx_y = np.diff(source_x, axis=0)[:, :-1] / step_y
    yy_y = np.diff(source_y, axis=0)[:, :-1] / step_y
    return np.asarray(xx_x * yy_y - xx_y * yy_x, dtype=np.float64)


def _sample_determinants(evidence: PoseEvidence, dose: float, side: int) -> FloatArray:
    x, y, step_x, step_y = _sample_field(evidence, dose, side)
    return inverse_jacobians(x, y, step_x, step_y)


def choose_pose_dose(
    evidence: PoseEvidence,
    requested: float,
    rules: PoseSafetyRules | None = None,
) -> PoseSafetyDecision:
    """Back off unsafe deformation or refuse if the remaining effect is too weak.

    Sampling is an early rejection mechanism. The authoritative real-face fold
    and occlusion checks still run externally on the actual output.
    """
    selected_rules = rules if rules is not None else PoseSafetyRules()
    if not isinstance(evidence, PoseEvidence) or not isinstance(selected_rules, PoseSafetyRules):
        raise CommandValidationError("invalid_pose_guard", "Checked pose evidence is required.")
    if not isinstance(requested, (int, float)) or not math.isfinite(requested):
        raise CommandValidationError("invalid_pose_guard", "Pose dose must be finite.")
    if not 0.0 <= requested <= 1.0:
        raise CommandValidationError("invalid_pose_guard", "Pose dose must be in [0, 1].")
    if requested == 0.0:
        return PoseSafetyDecision(0.0, 0.0, 1.0, 1.0, 0, 0, selected_rules.sample_side)
    if evidence.width < 3 or evidence.height < 3:
        raise CommandUnavailable("pose_fold_unmeasured", "Image is too small to measure safe pose warping.")

    def check(dose: float) -> tuple[bool, float, float, int]:
        values = _sample_determinants(evidence, dose, selected_rules.sample_side)
        smallest = float(np.min(values))
        largest = float(np.max(values))
        okay = (
            math.isfinite(smallest)
            and math.isfinite(largest)
            and smallest >= selected_rules.minimum_determinant
            and largest <= selected_rules.maximum_determinant
        )
        return okay, smallest, largest, int(values.size)

    passed, minimum, maximum, cells = check(requested)
    if passed:
        return PoseSafetyDecision(requested, requested, minimum, maximum, cells, 0, selected_rules.sample_side)
    low = 0.0
    high = requested
    checked = 1
    for _ in range(selected_rules.search_steps):
        midpoint = (low + high) / 2.0
        safe, _, _, _ = check(midpoint)
        checked += 1
        if safe:
            low = midpoint
        else:
            high = midpoint
    if low < requested * selected_rules.minimum_retained_dose:
        raise CommandUnavailable("pose_fold_risk", "Pose deformation cannot pass its fold guard.")
    safe, minimum, maximum, cells = check(low)
    if not safe:
        raise CommandUnavailable("pose_fold_risk", "Pose deformation failed final verification.")
    return PoseSafetyDecision(requested, low, minimum, maximum, cells, checked, selected_rules.sample_side)

"""User-checked photo pose-control geometry with bounded local displacement.

Handles and person masks must be supplied; no pose detection or body-part
inference occurs here. Displacement uses a smooth normalized radial kernel.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .levels import DecimalLevel

FloatArray = npt.NDArray[np.float64]


@dataclass(frozen=True, slots=True)
class PoseHandle:
    label: str
    x: float
    y: float
    dx: float
    dy: float

    def __post_init__(self) -> None:
        if not isinstance(self.label, str) or not 1 <= len(self.label) <= 40:
            raise CommandValidationError("invalid_pose", "Pose handle needs a short label.")
        values = (self.x, self.y, self.dx, self.dy)
        if any(isinstance(value, bool) or not isinstance(value, (int, float)) for value in values):
            raise CommandValidationError("invalid_pose", "Pose handles must use finite numbers.")
        if not all(math.isfinite(value) for value in values):
            raise CommandValidationError("invalid_pose", "Pose handles must be finite.")
        if not 0.0 <= self.x <= 1.0 or not 0.0 <= self.y <= 1.0:
            raise CommandValidationError(
                "invalid_pose", "Pose handle position is outside the photograph.",
            )
        if abs(self.dx) > 0.045 or abs(self.dy) > 0.045:
            raise CommandValidationError(
                "unsafe_pose", "Pose handle request exceeds the safe displacement.",
            )
        if math.hypot(self.dx, self.dy) > 0.06:
            raise CommandValidationError("unsafe_pose", "Pose handle displacement is excessive.")


@dataclass(frozen=True, slots=True, repr=False)
class PoseEvidence:
    width: int
    height: int
    body_mask: bytes
    handles: tuple[PoseHandle, ...]
    evidence: str = "user_checked"

    def __post_init__(self) -> None:
        if type(self.width) is not int or type(self.height) is not int:
            raise CommandValidationError("invalid_pose", "Pose dimensions must be integers.")
        if self.width < 1 or self.height < 1 or self.width * self.height > 24_000_000:
            raise CommandValidationError("invalid_pose", "Pose dimensions exceed image limits.")
        if not isinstance(self.body_mask, bytes) or len(self.body_mask) != self.width * self.height:
            raise CommandValidationError("invalid_pose", "Pose person mask must match the photograph.")
        if not isinstance(self.handles, tuple) or not 2 <= len(self.handles) <= 12:
            raise CommandValidationError("invalid_pose", "Pose needs two to twelve checked handles.")
        if any(not isinstance(handle, PoseHandle) for handle in self.handles):
            raise CommandValidationError("invalid_pose", "Pose handles are invalid.")
        if len({handle.label for handle in self.handles}) != len(self.handles):
            raise CommandValidationError("invalid_pose", "Pose handle labels must be unique.")
        if self.evidence not in ("user_checked", "cleared_local", "synthetic_test"):
            raise CommandValidationError("invalid_pose", "Pose evidence provenance is invalid.")
        if not any(value >= 32 for value in self.body_mask):
            raise CommandValidationError("invalid_pose", "Person mask contains no measurable region.")

    def public_metadata(self) -> dict[str, object]:
        return {
            "evidence": self.evidence,
            "handle_count": len(self.handles),
            "body_mask_present": True,
            "requires_user_confirmation": self.evidence == "user_checked",
        }


def pose_dose(level: DecimalLevel) -> float:
    if not isinstance(level, DecimalLevel):
        raise CommandValidationError("invalid_level", "Pose level requires exact decimal steps.")
    return (level.tenths - 10) / 40.0


def displacement(
    evidence: PoseEvidence,
    xx: FloatArray,
    yy: FloatArray,
    dose: float,
) -> tuple[FloatArray, FloatArray]:
    """Inverse-warp displacement in source-pixel units at absolute output grid."""
    if xx.shape != yy.shape or xx.ndim != 2:
        raise CommandValidationError(
            "invalid_pose", "Pose coordinates must share a two-dimensional grid.",
        )
    if not math.isfinite(dose) or not 0.0 <= dose <= 1.0:
        raise CommandValidationError("invalid_level", "Pose amount is outside the safe range.")
    if dose == 0.0:
        return np.zeros_like(xx), np.zeros_like(yy)
    normal_x = xx / max(evidence.width - 1, 1)
    normal_y = yy / max(evidence.height - 1, 1)
    # A fixed radius, with a nonzero stabilizer, makes the deformation smooth.
    spread = 0.18
    weight_total = np.full_like(xx, 0.42)
    weighted_x = np.zeros_like(xx)
    weighted_y = np.zeros_like(yy)
    for handle in evidence.handles:
        distance = (normal_x - handle.x) ** 2 + (normal_y - handle.y) ** 2
        weight = np.exp(-distance / (2.0 * spread * spread))
        weighted_x += weight * handle.dx * evidence.width
        weighted_y += weight * handle.dy * evidence.height
        weight_total += weight
    dx = weighted_x / weight_total * dose
    dy = weighted_y / weight_total * dose
    max_dx = 0.045 * evidence.width * dose
    max_dy = 0.045 * evidence.height * dose
    return np.clip(dx, -max_dx, max_dx), np.clip(dy, -max_dy, max_dy)


def edge_weight(body: npt.NDArray[np.uint8], y0: int, y1: int, x0: int, x1: int) -> FloatArray:
    """Conservatively fade moves at checked person-mask boundaries."""
    if body.ndim != 2 or not 0 <= y0 < y1 <= body.shape[0] or not 0 <= x0 < x1 <= body.shape[1]:
        raise CommandValidationError("invalid_pose", "Pose tile lies outside the checked mask.")
    centre = np.asarray(body[y0:y1, x0:x1], dtype=np.float64) / 255.0
    mask_min = centre.copy()
    for offset_y in (-1, 0, 1):
        sy = np.clip(np.arange(y0, y1) + offset_y, 0, body.shape[0] - 1)
        for offset_x in (-1, 0, 1):
            sx = np.clip(np.arange(x0, x1) + offset_x, 0, body.shape[1] - 1)
            sample = np.asarray(body[np.ix_(sy, sx)], dtype=np.float64) / 255.0
            mask_min = np.minimum(mask_min, sample)
    return np.clip(0.3 * centre + 0.7 * mask_min, 0.0, 1.0)


def sample_rgb(
    raw: npt.NDArray[np.uint8],
    source_x: FloatArray,
    source_y: FloatArray,
) -> FloatArray:
    """Clamped bilinear resampling from the original photo, no filling."""
    if raw.ndim != 3 or raw.shape[2] not in (3, 4) or source_x.shape != source_y.shape:
        raise CommandValidationError("invalid_pose", "Pose sampling coordinates are incompatible.")
    clipped_x = np.clip(source_x, 0.0, raw.shape[1] - 1.0)
    clipped_y = np.clip(source_y, 0.0, raw.shape[0] - 1.0)
    x0 = np.floor(clipped_x).astype(np.intp)
    y0 = np.floor(clipped_y).astype(np.intp)
    x1 = np.minimum(x0 + 1, raw.shape[1] - 1)
    y1 = np.minimum(y0 + 1, raw.shape[0] - 1)
    fx = (clipped_x - x0)[:, :, None]
    fy = (clipped_y - y0)[:, :, None]
    a = raw[y0, x0, :3]
    b = raw[y0, x1, :3]
    c = raw[y1, x0, :3]
    d = raw[y1, x1, :3]
    return np.asarray(
        (1 - fy) * ((1 - fx) * a + fx * b) + fy * ((1 - fx) * c + fx * d),
        dtype=np.float64,
    )

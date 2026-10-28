"""User-level, face-isolated small turn backed by the guarded R13 renderer.

The 1.0--5.0 control changes a measured 2.5D projection, not hidden anatomy.
A geometric displacement cap is only a proxy; no identity match is claimed.
Masks must correspond to an already selected and measured person; detecting a
box does not grant permission to edit the person's hair or body.
Face-mapping inspirations: MediaPipe Face Landmarker and 3DDFA_V2;
concept only, no code copied.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...vision.face_picker import compose_selected, mask_array
from ..core.refusal import Refusal
from . import turn
from .geometry import frame

LOCKED_MOVE_IOD = 0.02
UNLOCKED_MOVE_IOD = 0.065
DIRECTIONS = ("left", "right")


@dataclass(frozen=True)
class TurnLevelResult:
    image: NDArray[np.uint8]
    level: float
    identity_lock: bool
    requested_yaw: float
    effective_yaw: float
    max_move_iod: float
    selected_pixels: int
    protected_pixels: int
    reason_code: str = ""

    def counts(self) -> dict[str, int | float | bool | str]:
        """An aggregate-only summary; never export the image or mesh."""
        return {
            "level": self.level,
            "identity_lock": self.identity_lock,
            "requested_yaw": self.requested_yaw,
            "effective_yaw": self.effective_yaw,
            "max_move_iod": self.max_move_iod,
            "selected_pixels": self.selected_pixels,
            "protected_pixels": self.protected_pixels,
            "reason_code": self.reason_code,
        }


def level_value(value: object) -> float:
    """Exactly one decimal step, 1.0 is a neutral, byte-identical output."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("turn level must be a decimal between 1.0 and 5.0")
    level = float(value)
    if not math.isfinite(level) or not 1 <= level <= 5 or abs(10 * level - round(10 * level)) > 1e-8:
        raise ValueError("turn level must be 1.0 to 5.0, in 0.1 steps")
    return round(level, 1)


def requested_yaw(level: float, direction: str) -> float:
    if direction not in DIRECTIONS:
        raise ValueError("turn direction must be left or right")
    return (-1 if direction == "left" else 1) * turn.YAW_LIMIT * (level - 1) / 4


def safe_yaw(mesh: NDArray[np.float64], requested: float, cap: float) -> float:
    """Bound observed 478-point movement before calling the expensive renderer."""
    before = mesh[:, :2]
    centre = frame(before)
    if not math.isfinite(centre.iod) or centre.iod <= 0:
        raise ValueError("invalid face interocular distance")
    limit = cap * centre.iod
    if abs(requested) < 1e-12:
        return 0.0
    low = 0.0
    high = 1.0
    for _ in range(17):
        fraction = (low + high) / 2
        candidate = turn.project(mesh, yaw=requested * fraction, pivot="silhouette").points
        move = float(np.max(np.linalg.norm(candidate - before, axis=1)))
        if move <= limit:
            low = fraction
        else:
            high = fraction
    return requested * low


def render_level(image: NDArray[np.uint8], mesh: object, level: object, selected_mask: object, *,
                 direction: str = "right", bystanders: tuple[object, ...] = (),
                 identity_lock: bool = True, occluder_mask: object | None = None) -> TurnLevelResult | Refusal:
    """Render once after geometric capping and refuse unsafe output after checks.

    Fail closed on corrupt masks, invalid geometry or unmet Q1/Q3/Q4 checks.
    No uncovered or bystander pixel changes; alpha is always the original.
    """
    try:
        amount = level_value(level)
        if type(identity_lock) is not bool:
            raise ValueError("identity lock must be a boolean")
        target_yaw = requested_yaw(amount, direction)
        photo = np.asarray(image)
        if photo.dtype != np.uint8 or photo.ndim != 3 or photo.shape[2] not in (3, 4):
            raise ValueError("source must be uint8 RGB(A)")
        height, width = photo.shape[:2]
        if min(height, width) < 2 or max(height, width) > 16384:
            raise ValueError("invalid image dimensions")
        xyz = turn.check_xyz(mesh)
        selected = mask_array(selected_mask, height, width)
        protected = tuple(mask_array(value, height, width) for value in bystanders)
        editable = selected > 0
        for item in protected:
            editable &= item <= 0
        if not np.any(editable):
            raise ValueError("no unprotected selected-person region")
        if occluder_mask is not None:
            occluder_mask = mask_array(occluder_mask, height, width)
        counts = (int(np.count_nonzero(selected)), sum(int(np.count_nonzero(m)) for m in protected))
        if amount == 1.0:
            return TurnLevelResult(photo.copy(), amount, identity_lock, target_yaw, 0.0, 0.0, *counts)
        cap = LOCKED_MOVE_IOD if identity_lock else UNLOCKED_MOVE_IOD
        capped_yaw = safe_yaw(xyz, target_yaw, cap)
        if abs(capped_yaw) < 0.00001:
            return Refusal("warp_turn", "identity_lock_restricts_turn", "no measurable safe turn")
        output = turn.render_turn_checked(photo, xyz, yaw=capped_yaw, protected_mask=occluder_mask)
        if isinstance(output, Refusal):
            return output
        checks = output.checks
        def measured_pass(name: str) -> bool:
            value = checks.get(name)
            return isinstance(value, dict) and value.get("passed") is True

        allowed = (measured_pass("q1") and measured_pass("q3") and measured_pass("q4")
                   and checks["triangle_guard_pass"] is True and checks["effect_pass"] is True)
        if not allowed:
            return Refusal("warp_turn", "quality_guard", "measured turn failed its existing safety checks")
        iod = frame(xyz[:, :2]).iod
        observed_move = float(output.metrics["max_move_px"]) / iod
        if not math.isfinite(observed_move) or observed_move > cap + 1e-8:
            return Refusal("warp_turn", "identity_lock_restricts_turn", "measured movement exceeds lock")
        rendered = compose_selected(photo, output.image, selected, protected)
        return TurnLevelResult(rendered, amount, identity_lock, target_yaw, capped_yaw,
                               observed_move, *counts)
    except (TypeError, ValueError, FloatingPointError) as exc:
        return Refusal("warp_turn", "invalid_turn_input", str(exc)[:120])

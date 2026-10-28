"""Numerical audit rows for seven posture photo-edit plans, synthetic or future holdouts.

CHECKS_OK is never a real-face PASS. Raw photo data and faces are not serialized.
Identity similarity must come from the actual external guard, never inferred here.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from .catalogue import require_compatible
from .fixes import PosturePlan
from .levels import checked_level, level_plan
from .synthetic import FLAT_COLOURS, front_figure, side_figure

MIN_REDUCTION_AT_FULL = 0.10
NEUTRAL_TOLERANCE = 1e-7
MOVEMENT_TOLERANCE = 1e-6


@dataclass(frozen=True)
class PostureAudit:
    fix: str
    id: str
    level: float
    original_deviation: float
    new_deviation: float
    reduction: float
    move_px: float
    cap_px: float
    checks_ok: bool
    reasons: tuple[str, ...]
    evidence_class: str = "synthetic_or_unrated"
    release_status: str = "NOT_RUN"

    def to_json(self) -> dict[str, Any]:
        """Only scalar metrics and reason codes. No biometric keypoint arrays."""
        return {
            "fix": self.fix,
            "id": self.id,
            "level": self.level,
            "original_deviation": round(self.original_deviation, 6),
            "new_deviation": round(self.new_deviation, 6),
            "reduction": round(self.reduction, 6),
            "move_px": round(self.move_px, 6),
            "cap_px": round(self.cap_px, 6),
            "checks_ok": self.checks_ok,
            "reasons": list(self.reasons),
            "evidence_class": self.evidence_class,
            "release_status": self.release_status,
        }


def audit_plan(p: PosturePlan, level: float) -> PostureAudit:
    """Validate result and geometry using unchanged LS4 caps; never guess identity."""
    entry = require_compatible(p.before, p.fix)
    value = checked_level(level)
    errors: list[str] = []
    original = p.measure_before
    current = p.measure_after
    reduction = p.reduction
    if not all(math.isfinite(x) for x in (original, current, reduction, p.largest_move_px, p.cap_px)):
        errors.append("non_finite")
    if p.largest_move_px > p.cap_px + MOVEMENT_TOLERANCE:
        errors.append("movement_over_cap")
    if p.cap_px > 0.06 * p.before.torso_height + MOVEMENT_TOLERANCE:
        errors.append("cap_raised")
    for name in p.pins:
        if p.before.points[name] != p.after.points[name]:
            errors.append("pinned_landmark_moved")
            break
    if value == 1.0:
        if p.largest_move_px > NEUTRAL_TOLERANCE:
            errors.append("neutral_level_changed")
    elif abs(original) > NEUTRAL_TOLERANCE:
        if original * current < -NEUTRAL_TOLERANCE:
            errors.append("overshot_neutral")
        if abs(current) > abs(original) + NEUTRAL_TOLERANCE:
            errors.append("deviation_increased")
        if value == 5.0 and reduction + NEUTRAL_TOLERANCE < MIN_REDUCTION_AT_FULL:
            errors.append("insufficient_full_level_reduction")
    return PostureAudit(
        p.fix, entry.id, value, original, current, reduction, p.largest_move_px,
        p.cap_px, not errors, tuple(errors),
    )


def synthetic_group_rows() -> list[dict[str, Any]]:
    """A row for every drawn size/colour/view/fix, never a demographic quality pass.

    This does no inference, faces, pose downloads or private image I/O.
    """
    rows: list[dict[str, Any]] = []
    sizes = ((128, 160), (160, 200), (192, 256))
    for width, height in sizes:
        for index, tone in enumerate(FLAT_COLOURS, 1):
            front = front_figure(width, height, lean=4, shoulder_drop=2, skin=tone, flat=True)
            side = side_figure(
                width, height, round_shoulder=12, head_forward=2, slouch=8,
                sway=4, skin=tone, flat=True,
            )
            for fix in ("lean", "uneven_shoulders"):
                report = audit_plan(level_plan(front.controls, fix, 5), 5)
                rows.append({
                    "group": f"drawn/front/{width}x{height}/palette_{index}",
                    **report.to_json(),
                })
            for fix in ("rounded_shoulders", "forward_head", "slouch", "swayback", "pelvic_tilt"):
                report = audit_plan(level_plan(side.controls, fix, 5), 5)
                rows.append({
                    "group": f"drawn/side/{width}x{height}/palette_{index}",
                    **report.to_json(),
                })
    return rows


def synthetic_summary() -> dict[str, Any]:
    rows = synthetic_group_rows()
    groups = sorted(set(str(row["group"]) for row in rows))
    failed = [row["group"] + "/" + row["fix"] for row in rows if not row["checks_ok"]]
    return {
        "format": "beljour-posture-synthetic-summary/1",
        "synthetic_only": True,
        "release_status": "NOT_RUN",
        "case_count": len(rows),
        "group_count": len(groups),
        "group_names": groups,
        "failure_reasons": failed,
    }

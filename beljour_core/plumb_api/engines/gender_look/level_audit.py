"""Pixel-based R25c gender-look evidence; not an identity or appearance score.

The frozen-set runner owns the actual image selection, labels, and final verdict.
This module consumes only already rendered pixels and caller-checked masks.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from .levels import Direction, GenderLevelResult, checked_direction, checked_level

ByteImage = NDArray[np.uint8]
FloatMask = NDArray[np.float64]
AuditStatus = Literal["UNPROVEN", "FAIL"]


@dataclass(frozen=True)
class LevelPixelAudit:
    direction: Direction
    level: float
    mask_pixel_count: int
    changed_pixel_count: int
    off_mask_changed_count: int
    alpha_changed_count: int
    mean_selected_delta: float
    maximum_selected_delta: int
    guard_called: bool
    status: AuditStatus


def checked_selection(mask: FloatMask, shape: tuple[int, int]) -> FloatMask:
    """Reject invalid masks; a missing region must never mean whole-frame editing."""
    if mask.shape != shape:
        raise ValueError("selection dimensions differ from image")
    if not np.issubdtype(mask.dtype, np.number):
        raise ValueError("selection must be numeric")
    selected = mask.astype(np.float64)
    if not np.all(np.isfinite(selected)):
        raise ValueError("selection contains nonfinite values")
    if np.any(selected < 0.0) or np.any(selected > 1.0):
        raise ValueError("selection coverage outside [0,1]")
    return selected


def pixel_audit(
    before: ByteImage,
    after: ByteImage,
    selected_region: FloatMask,
    direction: Direction,
    level: float,
    *,
    guard_called: bool,
) -> LevelPixelAudit:
    """Measure exact changed-pixel counts; never turn a synthetic check into PASS.

    The selected region is required, never inferred from hair/skin colour.
    A nonzero edit outside the region, changed alpha or skipped identity lock
    yields FAIL. UNPROVEN means these invariants alone have not failed.
    """
    checked = checked_direction(direction)
    strength = checked_level(level)
    if before.dtype != np.uint8 or after.dtype != np.uint8:
        raise ValueError("uint8 images required")
    if before.shape != after.shape or before.ndim != 3 or before.shape[2] not in (3, 4):
        raise ValueError("identically shaped RGB or RGBA images required")
    region = checked_selection(selected_region, before.shape[:2])
    included = region > 0.0
    outside = ~included
    rgb_difference = np.abs(after[..., :3].astype(np.int16) - before[..., :3].astype(np.int16))
    changed = np.any(rgb_difference != 0, axis=2)
    selected_changed = int(np.count_nonzero(changed & included))
    outside_changed = int(np.count_nonzero(changed & outside))
    alpha_changed = 0
    if before.shape[2] == 4:
        alpha_changed = int(np.count_nonzero(before[..., 3] != after[..., 3]))
    if np.any(included):
        selected_delta = rgb_difference[included]
        average_delta = float(np.mean(selected_delta))
        maximum_delta = int(np.max(selected_delta))
    else:
        average_delta = 0.0
        maximum_delta = 0
    failed = outside_changed > 0 or alpha_changed > 0 or not guard_called
    if strength == 1.0 and np.any(changed):
        failed = True
    return LevelPixelAudit(
        direction=checked,
        level=strength,
        mask_pixel_count=int(np.count_nonzero(included)),
        changed_pixel_count=selected_changed,
        off_mask_changed_count=outside_changed,
        alpha_changed_count=alpha_changed,
        mean_selected_delta=average_delta,
        maximum_selected_delta=maximum_delta,
        guard_called=guard_called,
        status="FAIL" if failed else "UNPROVEN",
    )


def audit_level_result(
    original: ByteImage,
    rendered: GenderLevelResult,
    primary_mask: FloatMask,
) -> LevelPixelAudit:
    """Refused/no-mesh results are unscored rather than silently successful."""
    if rendered.status != "rendered":
        raise ValueError("cannot audit a missing-mesh refusal as a rendered result")
    return pixel_audit(
        original,
        rendered.image,
        primary_mask,
        rendered.direction,
        rendered.level,
        guard_called=rendered.guard_called,
    )


def count_only(rows: tuple[LevelPixelAudit, ...]) -> dict[str, int]:
    """Aggregate safe counts without names, photos, paths or inferred group tags."""
    if len({(row.direction, row.level) for row in rows}) != len(rows):
        raise ValueError("duplicate direction and level")
    for row in rows:
        if not math.isfinite(row.mean_selected_delta):
            raise ValueError("nonfinite evidence")
    return {
        "observed": len(rows),
        "failed": sum(row.status == "FAIL" for row in rows),
        "unproven": sum(row.status == "UNPROVEN" for row in rows),
        "outside_mask_errors": sum(row.off_mask_changed_count for row in rows),
        "alpha_errors": sum(row.alpha_changed_count for row in rows),
    }

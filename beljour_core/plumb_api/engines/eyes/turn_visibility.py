"""Declare an eye hidden by strong measured head-turn geometry.

The width-ratio and depth-evidence limits are ASSUMED engineering guards.
A missing point, a frontal collapse, or a displaced feature is not excused.
The decision never depends on face colour, demographic labels, or a model.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

WIDTH_RATIO_LIMIT = 0.40
DEPTH_RATIO_MIN = 0.55
MIN_REFERENCE_WIDTH = 4.0


@dataclass(frozen=True)
class TurnEvidence:
    """One optional far-side declaration, with conservative measured support."""

    candidate: str | None
    width_ratio: float
    depth_ratio: float | None
    supported_by_depth: bool


def _depths(source: Any, count: int) -> NDArray[np.float64] | None:
    """Read supplied mesh depth, without guessing from projected skin or pixels."""
    try:
        points = np.asarray(source, dtype=np.float64)
    except (TypeError, ValueError):
        return None
    if points.ndim != 2 or points.shape[0] != count or points.shape[1] < 3:
        return None
    depth: NDArray[np.float64] = points[:, 2]
    if not np.all(np.isfinite(depth)):
        return None
    return depth


def turn_evidence(
    projected: NDArray[np.float64],
    original: Any,
    lids: Mapping[str, tuple[int, int, int, int]],
    contours: Mapping[str, tuple[int, ...]],
    *,
    depth_scale: float = 1.0,
) -> TurnEvidence:
    """Propose a narrow projected eye as hidden, only with corroboration.

    Eye corner distance is measured after projection, relative to the other
    eye. For supplied depth, the farther eye also needs a depth separation
    >= 0.55 of the 3D inter-eye-centre distance (ASSUMED). Depth units are
    converted by the caller's declared scale. With 2D-only landmarks, the
    caller must independently establish that the candidate's
    centre has moved outside the visible head contour.
    """
    if projected.ndim != 2 or projected.shape[1] != 2:
        return TurnEvidence(None, 1.0, None, False)
    sides = ("right", "left")
    required = [index for side in sides for index in lids[side]]
    required += [index for side in sides for index in contours[side + "_eye"]]
    if len(projected) <= max(required) or not np.all(np.isfinite(projected)):
        return TurnEvidence(None, 1.0, None, False)
    widths: dict[str, float] = {}
    centres: dict[str, NDArray[np.float64]] = {}
    for side in sides:
        _, _, a, b = lids[side]
        widths[side] = float(np.linalg.norm(projected[a] - projected[b]))
        centres[side] = np.mean(projected[list(contours[side + "_eye"])], axis=0)
    larger = max(widths.values())
    smaller = min(widths.values())
    ratio = smaller / larger if larger > 0 else 1.0
    if larger < MIN_REFERENCE_WIDTH or smaller <= 0 or ratio > WIDTH_RATIO_LIMIT:
        return TurnEvidence(None, ratio, None, False)
    candidate = min(sides, key=lambda side: widths[side])
    depth = _depths(original, len(projected))
    if depth is None:
        return TurnEvidence(candidate, ratio, None, False)
    z = {
        side: float(np.mean(depth[list(contours[side + "_eye"])])) * depth_scale
        for side in sides
    }
    displacement = centres["right"] - centres["left"]
    delta_z = z["right"] - z["left"]
    three_dimensional_span = float(np.hypot(np.linalg.norm(displacement), delta_z))
    depth_ratio = abs(delta_z) / three_dimensional_span if three_dimensional_span > 0 else 0.0
    farther_side = sides[1 - sides.index(candidate)]
    supported = depth_ratio >= DEPTH_RATIO_MIN and z[candidate] > z[farther_side]
    return TurnEvidence(candidate, ratio, depth_ratio, supported)

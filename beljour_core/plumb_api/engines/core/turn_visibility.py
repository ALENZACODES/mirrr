"""Geometric "hidden by head turn" declaration for one eye side, measured from the mesh.

On a strongly turned head the far eye, its brow and its iris fold behind the
nose and cheek. Their projected outlines collapse, and region masks clipped to
the visible face oval come out empty. Like a closed eye, this is a geometric
reason a mask may be empty, measured from landmark positions only (no pixels).

Measure: each eye's signed projected width along the line between the two eye
centres (outer corner to inner corner for the subject's right eye, inner to
outer for the left, so both are positive on a frontal face). An eye is hidden
by the turn when its signed width is at most TURN_HIDDEN_RATIO of the other
eye's width, the other eye being clearly open to the camera, and the nose tip
has moved towards the hidden side by at least 10% of the eye-centre distance.

ASSUMED ratio 0.38: on a cylinder model of the head the far/near ratio is 0.43
at 45 degrees yaw (both eyes kept), 0.36 at 50 degrees (the far iris starts to
vanish) and below 0 (folded) past about 70 degrees. A 1-degree sweep from 0 to
88 degrees then leaves no empty eye, brow or iris mask without a declaration.
When a side is hidden, the face oval used as the visible support falls back to
its convex hull (oval_folded), as a self-crossing oval already does.
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np

TURN_HIDDEN_RATIO = 0.38
# The nose tip must also have moved towards the hidden side by this share of the
# eye-centre distance, so an oddly drawn mesh is not read as a turn (ASSUMED).
NOSE_SHIFT = 0.10
NOSE_TIP = 1
# (outer corner, inner corner) of the subject's right and left eyes (MediaPipe topology).
EYE_CORNERS = {"right": (33, 133), "left": (263, 362)}
REASON = "turned_away"


def signed_widths(points: np.ndarray) -> dict[str, float] | None:
    """Signed projected eye widths along the eye axis and the nose-tip shift (share of
    the eye-centre distance, positive towards the subject's left eye), or None."""
    xy = np.asarray(points, dtype=np.float64)
    if xy.ndim != 2 or xy.shape[0] < 468 or xy.shape[1] < 2 or not np.isfinite(xy[:, :2]).all():
        return None
    right_outer, right_inner = xy[EYE_CORNERS["right"][0], :2], xy[EYE_CORNERS["right"][1], :2]
    left_outer, left_inner = xy[EYE_CORNERS["left"][0], :2], xy[EYE_CORNERS["left"][1], :2]
    axis = (left_outer + left_inner) / 2 - (right_outer + right_inner) / 2
    length = math.hypot(float(axis[0]), float(axis[1]))
    if length <= 1e-9:
        return None
    unit = axis / length
    middle = (left_outer + left_inner + right_outer + right_inner) / 4
    return {"right": float(np.dot(right_inner - right_outer, unit)),
            "left": float(np.dot(left_outer - left_inner, unit)),
            "nose_shift": float(np.dot(xy[NOSE_TIP, :2] - middle, unit)) / length}


def hidden_by_turn(points: np.ndarray, side: str) -> bool:
    if side not in EYE_CORNERS:
        raise ValueError("side must be right or left")
    widths = signed_widths(points)
    if widths is None:
        return False
    other = widths["left" if side == "right" else "right"]
    towards = widths["nose_shift"] if side == "left" else -widths["nose_shift"]
    return other > 1e-6 and widths[side] <= TURN_HIDDEN_RATIO * other and towards >= NOSE_SHIFT


def oval_folded(points: np.ndarray) -> bool:
    """On a turned head the far-side oval points project onto the visible face.

    The traced oval then cuts across the near eye and mouth, so the visible
    silhouette is taken as the convex hull of the oval instead (only when one
    eye side is declared hidden by the turn; frontal faces are unchanged).
    """
    return any(hidden_by_turn(points, side) for side in EYE_CORNERS)


def turn_reason(points: np.ndarray, name: str) -> str | None:
    """REASON for an eye, brow or iris region on the hidden side, else None."""
    for side in EYE_CORNERS:
        if name in (f"{side}_eye", f"{side}_brow", f"{side}_iris"):
            return REASON if hidden_by_turn(points, side) else None
    return None

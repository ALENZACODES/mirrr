"""Edge-shift offsets and crowd checks that focus a mesh retry on one detector box.

Detector boxes are clipped to the photograph, so a face cut by the frame edge
arrives as a box that is narrower (or shorter) than the head. ``crop_offsets``
moves the retry crop outward across the clipped edge, so the visible part of
the face sits where it would in a whole-face crop; the sampler fills the area
past the edge and ``Trial.restore`` keeps every coordinate exact. ``crowded``
reports whether another detector box reaches into the normal retry crop, the
case where a tighter isolation crop helps the model stay on the requested face.

Neither function runs inference, edits a box, or decides whether a mesh is
accepted: association, frame share, overlap and the 478-point validator remain
the only acceptance rules. Only box geometry is read; no pixels are touched.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from typing import TYPE_CHECKING

from .recovery_policy import MAX_DIMENSION, MAX_FACES, MIN_DIMENSION

if TYPE_CHECKING:
    from .box_first import FaceBox

# Margin of the ``normal_crop`` square in mesh_recovery; the shift cap and the
# crowd test are measured against that crop.
NORMAL_MARGIN = 1.6
# Box clipping in prepare_boxes lands exactly on 0 or the photo side; one pixel
# absorbs float rounding. ASSUMED tolerance.
EDGE_TOLERANCE = 1.0
# Height / width of an unclipped detector face box, used to estimate how much of
# a clipped face lies outside the photo. ASSUMED (drawn heads in the tests are
# 1.17 to 1.3); not measured on the frozen set.
FACE_ASPECT = 1.25
# A shift smaller than this share of the box side would repeat the normal crop
# and waste one bounded inference call. ASSUMED.
MIN_SHIFT_SHARE = 0.05
# Share of a peer box that must fall inside the normal crop before it counts as
# a competing face. ASSUMED.
CROWD_SHARE = 0.10

Geometry = tuple[float, float, float, float]


def box_geometry(box: FaceBox) -> Geometry:
    """Finite, positive XYWH, or ValueError; matches the recovery policy checks."""
    values = (float(box.x), float(box.y), float(box.width), float(box.height))
    if not all(math.isfinite(value) for value in values):
        raise ValueError("box geometry must be finite")
    if values[2] <= 0 or values[3] <= 0:
        raise ValueError("box dimensions must be positive")
    return values


def check_image_size(width: int, height: int) -> None:
    """Photo sides must be integers inside the recovery policy bounds."""
    if isinstance(width, bool) or isinstance(height, bool):
        raise ValueError("image dimensions must be integers")
    if not MIN_DIMENSION <= width <= MAX_DIMENSION or not MIN_DIMENSION <= height <= MAX_DIMENSION:
        raise ValueError("image dimensions are outside supported bounds")


def _clipped_sides(x: float, y: float, w: float, h: float,
                   width: int, height: int) -> tuple[bool, bool, bool, bool]:
    return (x <= EDGE_TOLERANCE, y <= EDGE_TOLERANCE,
            x + w >= width - EDGE_TOLERANCE, y + h >= height - EDGE_TOLERANCE)


def _axis_shift(visible: float, other: float, expected_ratio: float,
                near: bool, far: bool, cap: float) -> float:
    """Signed outward shift on one axis; zero unless exactly one side is clipped.

    ``expected_ratio`` converts the other (assumed whole) box side into this
    side's expected extent. A face clipped on both sides of one axis is wider
    than the photo, and no shift on that axis shows more of it.
    """
    if near == far:
        return 0.0
    missing = other * expected_ratio - visible
    shift = min(missing / 2, cap)
    if shift < MIN_SHIFT_SHARE * visible:
        return 0.0
    return -shift if near else shift


def crop_offsets(box: FaceBox, width: int, height: int) -> tuple[tuple[float, float], ...]:
    """Centre offsets, in photo pixels, for retry crops of a frame-clipped box.

    The first offset centres the crop on the estimated whole face; the second
    moves half as far, in case the face is narrower than ``FACE_ASPECT``
    suggests. A box that touches no frame edge, or whose clipped side already
    matches the expected face shape, gets no offsets. Shifts are capped so the
    visible box stays inside the shifted normal crop. When a box is clipped on
    both axes at a corner, each estimate uses a clipped side and therefore
    understates the missing part, so that shift is smaller or absent.
    """
    check_image_size(width, height)
    x, y, w, h = box_geometry(box)
    left, top, right, bottom = _clipped_sides(x, y, w, h, width, height)
    half_side = max(w, h) * NORMAL_MARGIN / 2
    dx = _axis_shift(w, h, 1 / FACE_ASPECT, left, right, half_side - w / 2)
    dy = _axis_shift(h, w, FACE_ASPECT, top, bottom, half_side - h / 2)
    if dx == 0.0 and dy == 0.0:
        return ()
    offsets = [(dx, dy)]
    half = (dx / 2, dy / 2)
    if max(abs(half[0]) / w, abs(half[1]) / h) >= MIN_SHIFT_SHARE:
        offsets.append(half)
    return tuple(offsets)


def intersection_area(a: Geometry, b: Geometry) -> float:
    """Overlap area of two XYWH rectangles, zero when they do not meet."""
    across = min(a[0] + a[2], b[0] + b[2]) - max(a[0], b[0])
    down = min(a[1] + a[3], b[1] + b[3]) - max(a[1], b[1])
    return max(0.0, across) * max(0.0, down)


def competing_peers(box: FaceBox, peers: Sequence[FaceBox]) -> list[Geometry]:
    """Geometry of every other usable detector box in the photo.

    The box itself (by identity or identical geometry) is never its own peer,
    and a peer with unusable geometry is skipped rather than guessed at.
    """
    if len(peers) > MAX_FACES:
        raise ValueError("too many peer boxes for one photo")
    own = box_geometry(box)
    others: list[Geometry] = []
    for peer in peers:
        if peer is box:
            continue
        try:
            other = box_geometry(peer)
        except (TypeError, ValueError):
            continue
        if other != own:
            others.append(other)
    return others


def crowded(box: FaceBox, peers: Sequence[FaceBox]) -> bool:
    """True when another detector box reaches into this box's normal retry crop.

    A peer counts once at least ``CROWD_SHARE`` of its area lies inside the
    square ``normal_crop`` region, which is what the mesh model would see.
    """
    others = competing_peers(box, peers)
    x, y, w, h = box_geometry(box)
    side = max(w, h) * NORMAL_MARGIN
    crop = (x + w / 2 - side / 2, y + h / 2 - side / 2, side, side)
    return any(intersection_area(crop, other) >= CROWD_SHARE * other[2] * other[3]
               for other in others)

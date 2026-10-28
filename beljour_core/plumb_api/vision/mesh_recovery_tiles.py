"""Overlapping tile windows that keep a missed face whole while avoiding its neighbours.

In a group photo the square crop around one detector box often includes part
of the next person, and the mesh model can lock onto that competing face. This
module proposes a few square windows that still contain the whole requested
box but slide away from the other boxes, ranked by how little competing face
area each one still contains. Windows may extend past the photo; the caller
samples them virtually with edge padding, so no image copy is enlarged.

Only box geometry is read. No inference runs here and no window decides that
a mesh is a face; every mesh found in a window passes the same association,
frame-share, overlap and validator checks as any other retry.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING

from .mesh_recovery_focus import (
    Geometry,
    box_geometry,
    check_image_size,
    competing_peers,
    intersection_area,
)

if TYPE_CHECKING:
    from .box_first import FaceBox

# Same margin the recovery policy schedules for RecoveryStage.OVERLAP_TILE.
TILE_MARGIN = 1.25
# At most this many windows per box, so the tight, upscaled, padded and
# rotated stages stay inside the 12-call per-box budget. ASSUMED.
MAX_WINDOWS = 2
# Every slide is half the free margin on that axis, so the requested box always
# stays fully inside the window.
_SLIDES = (-1, 0, 1)


@dataclass(frozen=True, slots=True)
class TileWindow:
    """A square sampling window in source-photo pixels."""

    left: int
    top: int
    side: int


def _competing_share(window: Geometry, others: Sequence[Geometry]) -> float:
    """Sum, over competing boxes, of the share of each box inside the window."""
    return sum(intersection_area(window, other) / (other[2] * other[3]) for other in others)


def candidate_windows(box: FaceBox, peers: Sequence[FaceBox], width: int,
                      height: int) -> tuple[TileWindow, ...]:
    """Ranked windows that show less of the other faces than the centred crop.

    A box with no competing box inside its centred window gets no windows, so
    single-face photos keep the historical retry sequence. Candidates slide
    the window by half its free margin along x, y or both. Only candidates
    that strictly reduce the competing share are kept, ordered by remaining
    competing share, then by how far they slide, then by a fixed slide order.
    """
    check_image_size(width, height)
    x, y, w, h = box_geometry(box)
    others = competing_peers(box, peers)
    if not others:
        return ()
    side = max(2, math.ceil(max(w, h) * TILE_MARGIN))
    cx, cy = x + w / 2, y + h / 2
    reach_x, reach_y = (side - w) / 2, (side - h) / 2
    centred = (cx - side / 2, cy - side / 2, float(side), float(side))
    baseline = _competing_share(centred, others)
    if baseline <= 0:
        return ()
    ranked: list[tuple[float, int, int, TileWindow]] = []
    order = 0
    for sy in _SLIDES:
        for sx in _SLIDES:
            if sx == 0 and sy == 0:
                continue
            # Integer pixels, clamped so rounding never cuts into the box.
            left = math.floor(cx + sx * reach_x - side / 2)
            left = max(min(left, math.floor(x)), math.ceil(x + w) - side)
            top = math.floor(cy + sy * reach_y - side / 2)
            top = max(min(top, math.floor(y)), math.ceil(y + h) - side)
            window = (float(left), float(top), float(side), float(side))
            share = _competing_share(window, others)
            if share < baseline:
                ranked.append((share, abs(sx) + abs(sy), order, TileWindow(left, top, side)))
            order += 1
    ranked.sort(key=lambda item: item[:3])
    return tuple(item[3] for item in ranked[:MAX_WINDOWS])

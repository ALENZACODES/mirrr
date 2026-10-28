"""A synthetic, mirror-symmetric 478-point face mesh with known proportions (tests only).

Every index the E10 analysis reads is placed on purpose: the contour loops on ellipses
built so each left point is the exact mirror of its right partner, the midline points on
the axis at chosen heights, and the hand-picked nose and cheek pairs mirrored. Unused
indices sit on a small symmetric spiral so the mesh is complete. Asymmetry can be added per
region as a pixel shift of the subject's left side, and the whole face can be rolled
about its centre, which is what the tests need to check the measurements.

No photo, no person: coordinates are made up. concept only, no code copied: Farkas
anthropometry (the thirds and fifths used to lay out the face), from the book; mesh index
layout from MediaPipe Face Landmarker (runtime data, Bucket A).
Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

from ..core import regions
from . import anatomy

Floats = NDArray[np.float64]

# Heights (as a share of face length from the mesh top) for the midline points, top down.
MIDLINE_HEIGHTS = {10: 0.0, 151: 0.08, 9: 0.30, 8: 0.33, 168: 0.37, 6: 0.42, 197: 0.47, 195: 0.52, 5: 0.56,
                   4: 0.59, 1: 0.61, 19: 0.63, 94: 0.645, 2: 0.66, 164: 0.69, 0: 0.72, 13: 0.765, 14: 0.775,
                   17: 0.82, 18: 0.86, 200: 0.9, 199: 0.93, 175: 0.97, 152: 1.0}


def _ellipse(cx: float, cy: float, rx: float, ry: float, angle: float) -> tuple[float, float]:
    return cx + rx * math.cos(angle), cy + ry * math.sin(angle)


def symmetric_face(width: float = 400.0, height: float = 500.0, *, face_width: float = 220.0,
                   face_length: float = 300.0) -> Floats:
    """(478, 2) pixel points of a symmetric face centred in a width x height image."""
    cx = width / 2
    top = (height - face_length) / 2
    pts = np.zeros((anatomy.MESH_POINTS, 2))
    filled = np.zeros(anatomy.MESH_POINTS, bool)

    def put(i: int, x: float, y: float) -> None:
        pts[i] = (x, y)
        filled[i] = True

    def mirror(right: int, left: int) -> None:
        put(left, 2 * cx - pts[right, 0], pts[right, 1])

    fy = lambda share: top + share * face_length  # noqa: E731
    # face outline: position 0 at the top, the chin at n/2, the subject's left on positions 1..n/2-1
    oval = regions.FACE_OVAL
    n = len(oval)
    for k, idx in enumerate(oval):
        put(idx, *_ellipse(cx, fy(0.5), face_width / 2, face_length / 2, -math.pi / 2 + 2 * math.pi * k / n))
    # eyes: outer corner at loop position 0, inner corner at n/2; eye width = face width / 5
    # the right eye fills the second fifth, so its centre is one eye width right of the axis
    eye_w = face_width / 5
    eye_cx = cx - eye_w
    m = len(regions.RIGHT_EYE)
    for k in range(m):
        put(regions.RIGHT_EYE[k], *_ellipse(eye_cx, fy(0.40), eye_w / 2, eye_w / 5, math.pi - 2 * math.pi * k / m))
        mirror(regions.RIGHT_EYE[k], regions.LEFT_EYE[k])
    put(468, eye_cx, fy(0.40))
    for k, idx in enumerate((469, 470, 471, 472)):
        put(idx, *_ellipse(eye_cx, fy(0.40), eye_w / 6, eye_w / 6, math.pi / 2 * k))
    mirror(468, 473)
    for r, left in zip((469, 470, 471, 472), (476, 475, 474, 477), strict=True):
        mirror(r, left)
    # brows: an arc above each eye, outer end first
    for k, (r, left) in enumerate(zip(regions.RIGHT_BROW, regions.LEFT_BROW, strict=True)):
        t = k / (len(regions.RIGHT_BROW) - 1)
        put(r, eye_cx - eye_w * 0.6 + 1.2 * eye_w * t, fy(0.31) - 6 * math.sin(math.pi * t))
        mirror(r, left)
    # lips: corners at loop positions 0 and n/2, lower midpoint at n/4
    mouth_w = 1.5 * (face_width / 5)
    for loop, ry in ((regions.LIPS_OUTER, None), (regions.LIPS_INNER, 0.0)):
        m = len(loop)
        for k, idx in enumerate(loop):
            angle = math.pi - 2 * math.pi * k / m
            rx = mouth_w / 2 if ry is None else mouth_w / 2 - 6
            if ry is None:
                up, down = fy(0.77) - fy(0.72), fy(0.82) - fy(0.77)
            else:
                up, down = fy(0.77) - fy(0.765), fy(0.775) - fy(0.77)
            x, y = _ellipse(cx, fy(0.77), rx, 1.0, angle)
            put(idx, x, fy(0.77) + (down if math.sin(angle) > 0 else up) * math.sin(angle))
    # midline points (some are already placed by the loops at the same height)
    for idx, share in MIDLINE_HEIGHTS.items():
        put(idx, cx, fy(share))
    # nose: alae 129/358 one eye width apart, the rest close by; cheeks below the eyes
    nose_half = eye_w / 2
    for (r, left), (dx, dy) in zip(anatomy.FEATURE_PAIRS["nose"], ((0.9, 0.64), (1.0, 0.62), (0.8, 0.60), (0.7, 0.55)), strict=True):
        put(r, cx - dx * nose_half, fy(dy))
        mirror(r, left)
    for (r, left), (dx, dy) in zip(anatomy.FEATURE_PAIRS["cheeks"], ((1.6, 0.52), (1.8, 0.62), (2.2, 0.47), (2.4, 0.42)), strict=True):
        put(r, cx - dx * eye_w, fy(dy))
        mirror(r, left)
    # everything else: a symmetric spiral inside the face (paired by order of index)
    rest = [i for i in range(anatomy.MESH_POINTS) if not filled[i]]
    for k in range(0, len(rest) - 1, 2):
        r, left = rest[k], rest[k + 1]
        put(r, cx - 10 - (k % 60), fy(0.15 + 0.6 * (k / len(rest))))
        mirror(r, left)
    if len(rest) % 2:
        put(rest[-1], cx, fy(0.5))
    return pts


def with_asymmetry(points: Floats, shifts: dict[str, tuple[float, float]]) -> Floats:
    """Shift the subject's left member of every pair in the named regions by (dx, dy) px."""
    out = np.array(points, dtype=np.float64)
    pairs = anatomy.region_pairs()
    for name, (dx, dy) in shifts.items():
        for _, left in pairs[name]:
            out[left] += (dx, dy)
    return out


def rolled(points: Floats, degrees: float, centre: tuple[float, float] | None = None) -> Floats:
    """Rotate the mesh about `centre` (default: the mean point) by `degrees` in the image plane."""
    p = np.asarray(points, dtype=np.float64)
    c = p.mean(0) if centre is None else np.asarray(centre, dtype=np.float64)
    a = math.radians(degrees)
    rot = np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]])
    out: Floats = (p - c) @ rot.T + c
    return out

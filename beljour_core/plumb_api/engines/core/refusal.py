"""Typed refusals for degenerate faces: a clear reason code instead of an exception.

The R12 real-face run raised eight exceptions on 983 faces (age "points must be
distinct", hair fibre "the zone is too small for its feather", proportions, turn,
gender and shape). Those inputs are not bugs to crash on and not edits to fake: the
mesh is degenerate for that tool. `inspect_mesh` finds the common cases up front
(duplicate landmarks, a face too small to edit, coincident eyes, a flat outline);
engines raise `DegenerateInput` (a ValueError subclass, so older callers keep
working) for the cases only they can see; `run_guarded` turns both into a
`Refusal` object with a reason code and a plain message.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, TypeVar

import numpy as np

T = TypeVar("T")

MIN_IOD_PX = 6.0
MIN_FACE_WIDTH_PX = 16.0
MIN_OVAL_AREA_PX = 64.0
MIN_IN_FRAME_SHARE = 0.5
DUPLICATE_TOLERANCE_PX = 1e-6

REASONS: dict[str, str] = {
    "wrong_shape": "The face mesh does not have the expected 478 points.",
    "not_finite": "The face mesh has missing or infinite coordinates.",
    "duplicate_points": "Two landmarks sit on the same spot, so the face cannot be triangulated.",
    "face_too_small": "The face is too small in this photo to edit safely.",
    "eyes_coincide": "The two eye centres coincide, so the face has no scale.",
    "no_face_width": "The face outline has no width.",
    "no_face_length": "The top of the face and the chin coincide.",
    "zero_area_face": "The face outline encloses almost no area.",
    "outside_frame": "Most of the face lies outside the photo.",
    "zone_too_small": "The area to edit is smaller than its soft edge.",
}

FACE_OVAL = (10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
             400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
             54, 103, 67, 109)


class DegenerateInput(ValueError):
    """Raised by an engine for a degenerate input; carries a reason code."""

    def __init__(self, code: str, message: str | None = None) -> None:
        if code not in REASONS:
            raise ValueError(f"unknown refusal code {code!r}")
        self.code = code
        super().__init__(message or REASONS[code])


@dataclass(frozen=True)
class Refusal:
    module: str
    code: str
    message: str
    refused: bool = True

    def to_json(self) -> dict[str, Any]:
        return {"module": self.module, "refused": True, "reason_code": self.code, "message": self.message}


def _polygon_area(points: np.ndarray) -> float:
    x, y = points[:, 0], points[:, 1]
    return float(abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))) / 2)


def inspect_mesh(points: object, height: int | None = None, width: int | None = None) -> list[str]:
    """Reason codes for a mesh no face tool should edit; empty when it is usable."""
    try:
        arr = np.asarray(points, dtype=np.float64)
    except (TypeError, ValueError):
        return ["wrong_shape"]
    if arr.ndim != 2 or arr.shape[0] != 478 or arr.shape[1] < 2:
        return ["wrong_shape"]
    pts = arr[:, :2]
    if not np.all(np.isfinite(pts)) or np.max(np.abs(pts)) > 1e6:
        return ["not_finite"]
    codes: list[str] = []
    diff = pts[:, None, :] - pts[None, :, :]
    dist2 = np.einsum("ijk,ijk->ij", diff, diff)
    np.fill_diagonal(dist2, np.inf)
    if float(dist2.min()) <= DUPLICATE_TOLERANCE_PX ** 2:
        codes.append("duplicate_points")
    iod = float(np.hypot(*(pts[473] - pts[468])))
    if iod <= 1e-9:
        codes.append("eyes_coincide")
    elif iod < MIN_IOD_PX:
        codes.append("face_too_small")
    if float(np.hypot(*(pts[152] - pts[10]))) < 1.0:
        codes.append("no_face_length")
    width_px = float(np.hypot(*(pts[454] - pts[234])))
    if width_px <= 1e-9:
        codes.append("no_face_width")
    elif width_px < MIN_FACE_WIDTH_PX and "face_too_small" not in codes:
        codes.append("face_too_small")
    if _polygon_area(pts[list(FACE_OVAL)]) < MIN_OVAL_AREA_PX:
        codes.append("zero_area_face")
    if height is not None and width is not None:
        inside = (pts[:, 0] >= 0) & (pts[:, 0] < width) & (pts[:, 1] >= 0) & (pts[:, 1] < height)
        if float(inside.mean()) < MIN_IN_FRAME_SHARE:
            codes.append("outside_frame")
    return codes


def refusal_for(module: str, points: object, height: int | None = None,
                width: int | None = None) -> Refusal | None:
    codes = inspect_mesh(points, height, width)
    if not codes:
        return None
    return Refusal(module, codes[0], REASONS[codes[0]])


def run_guarded(module: str, fn: Callable[..., T], *args: Any, points: object,
                height: int | None = None, width: int | None = None, **kwargs: Any) -> T | Refusal:
    """Call an engine only on a usable mesh; degenerate inputs become a Refusal.

    Any other exception still propagates: a refusal is for degenerate input, never
    a way to hide a bug.
    """
    early = refusal_for(module, points, height, width)
    if early is not None:
        return early
    try:
        return fn(*args, **kwargs)
    except DegenerateInput as exc:
        return Refusal(module, exc.code, str(exc))


def is_refusal(value: object) -> bool:
    return isinstance(value, Refusal)

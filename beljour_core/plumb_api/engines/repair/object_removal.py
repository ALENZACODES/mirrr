"""#59 Object and photobomber removal: fill an area she marks with PatchMatch-lite.

She marks what to remove (brush taps: discs of a chosen radius, tested at pixel centres).
The marked area, grown by GROW px for its soft edge, is filled by copying the best matching
patches from the rest of the photo (engines/fill PatchMatch-lite; fast marching and
biharmonic are offered too) and blended in by strength. Only the grown area changes and
alpha is kept.

Refusals, coded: nothing marked; a grown area over MAX_AREA_SHARE of the photo (too little
left to copy from); and, when face points are given, any overlap with the face oval, so the
person in the photo is never erased. MAX_AREA_SHARE is ASSUMED. A learned fill is not used
here (its model is not cleared). Mirrored in web/src/engines/local/object-removal.ts.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np

from ..core import regions
from ..fill.fill import METHODS, fill, grown_hole
from .photo_fix import FixResult, blend_bytes, check_photo, mesh_points, mesh_refusal, unchanged

MAX_AREA_SHARE = 0.25
GROW = 2.0
LABEL = "Marked area filled from the rest of this photo; nothing new is drawn in."


def brush_mask(height: int, width: int, taps: Sequence[Sequence[float]], radius: float) -> np.ndarray:
    """Union of discs of `radius` px around each tap, tested at pixel centres."""
    if not np.isfinite(radius) or radius <= 0:
        raise ValueError("brush radius must be positive")
    yy, xx = np.mgrid[:height, :width]
    mask = np.zeros((height, width), dtype=bool)
    for tap in taps:
        x, y = float(tap[0]), float(tap[1])
        mask |= (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= radius * radius
    out: np.ndarray = mask.astype(np.float32)
    return out


def remove_object(image: object, mask: object, *, landmarks: object | None = None,
                  strength: float = 100.0, method: str = "patchmatch", seed: int = 1) -> FixResult:
    img = check_photo(image, strength)
    if method not in METHODS:
        raise ValueError(f"method must be one of {', '.join(METHODS)}")
    h, w = img.shape[:2]
    marked = np.asarray(mask, dtype=np.float32)
    if marked.shape != (h, w) or not np.isfinite(marked).all():
        raise ValueError("the removal mask must be a finite plane matching the photo")
    if strength == 0:
        return unchanged(img, "not_applicable", "zero_strength", LABEL)
    hole = marked >= 0.5
    if not hole.any():
        return unchanged(img, "not_applicable", "nothing_marked", LABEL)
    grown = grown_hole(marked, (h, w), GROW) > 0
    report: dict[str, Any] = {"marked_pixels": int(hole.sum()), "area_share": round(float(grown.mean()), 6),
                              "method": method}
    if grown.mean() > MAX_AREA_SHARE:
        return unchanged(img, "refused", "area_too_large", LABEL, report)
    if landmarks is not None:
        points = mesh_points(landmarks)
        code = mesh_refusal(points, h, w)
        if code:
            return unchanged(img, "refused", code, LABEL, report)
        oval = [(float(points[i][0]), float(points[i][1])) for i in regions.CONTOURS["face_oval"]]
        if (grown & (regions.polygon(h, w, oval) >= 0.5)).any():
            return unchanged(img, "refused", "covers_face", LABEL, report)
    outcome = fill(img, hole.astype(np.float32), method, grow=GROW, seed=seed)
    weight = np.where(outcome.hole > 0, strength / 100.0, 0.0)
    report["filled_pixels"] = int(np.count_nonzero(weight))
    return FixResult(blend_bytes(img, outcome.image, weight), weight, "edited", "edited", LABEL, report)

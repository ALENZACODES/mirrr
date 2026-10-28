"""#55 Glasses glare removal: find bright lens reflections beside the eyes and fill them.

Where: a lens box around each eye from the mesh, centred between the eye corners,
LENS_HALF_WIDTH x eye width to each side and LENS_HALF_HEIGHT x eye width above and below.
The eye opening (any polygon coverage, so lashes and the lid edge too) is excluded: the
whites of the eyes and the catchlights in the iris are natural and are never changed, even
when glare crosses them.

What: a lens pixel is glare when it is near white (every channel at least GLARE_MIN and a
channel spread of at most GLARE_SPREAD) and its luma is at least GLARE_RISE above the
lens median. The glare, grown by GROW px for its soft halo, is filled from its surround with
the existing biharmonic fill (engines/fill), then blended in by strength. Only the grown
glare outside the eye opening changes; alpha is kept. Thresholds are ASSUMED, chosen on
drawn lenses; a lens that is bright all over (no local rise) is left alone.

Mirrored in web/src/engines/local/glare.ts. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from ..fill.fill import fill
from .eye_geometry import EYE_LIDS, SIDES, eye_coverage, eye_width
from .photo_fix import FixResult, blend_bytes, check_photo, mesh_points, mesh_refusal, unchanged

LENS_HALF_WIDTH = 0.85
LENS_HALF_HEIGHT = 0.6
GLARE_MIN = 215
GLARE_SPREAD = 40
GLARE_RISE = 35.0
GROW = 1.0
LABEL = "Glasses glare softened from the surrounding pixels; the eyes themselves are not changed."


def lens_box(points: np.ndarray, side: str, height: int, width: int) -> tuple[int, int, int, int]:
    _, _, a, b = EYE_LIDS[side]
    cx = (points[a][0] + points[b][0]) / 2
    cy = (points[a][1] + points[b][1]) / 2
    ew = eye_width(points, side)
    left = max(0, int(np.floor(cx - LENS_HALF_WIDTH * ew)))
    right = min(width, int(np.ceil(cx + LENS_HALF_WIDTH * ew)))
    top = max(0, int(np.floor(cy - LENS_HALF_HEIGHT * ew)))
    bottom = min(height, int(np.ceil(cy + LENS_HALF_HEIGHT * ew)))
    return left, top, right, bottom


def luma(rgb: np.ndarray) -> np.ndarray:
    v = rgb.astype(np.float64)
    out: np.ndarray = 0.299 * v[..., 0] + 0.587 * v[..., 1] + 0.114 * v[..., 2]
    return out


def find_glare(image: np.ndarray, points: np.ndarray) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
    """(glare mask, eye-opening exclusion, per-side counts)."""
    height, width = image.shape[:2]
    rgb = image[..., :3]
    y = luma(rgb)
    lo = rgb.min(axis=2).astype(np.int32)
    hi = rgb.max(axis=2).astype(np.int32)
    exclude = np.zeros((height, width), dtype=bool)
    for side in SIDES:
        exclude |= eye_coverage(points, side, height, width) > 0
    glare = np.zeros((height, width), dtype=bool)
    counts: dict[str, Any] = {}
    for side in SIDES:
        left, top, right, bottom = lens_box(points, side, height, width)
        lens = np.zeros((height, width), dtype=bool)
        lens[top:bottom, left:right] = True
        lens &= ~exclude
        if not lens.any():
            counts[side] = 0
            continue
        median = float(np.median(y[lens]))
        found = lens & (lo >= GLARE_MIN) & (hi - lo <= GLARE_SPREAD) & (y >= median + GLARE_RISE)
        counts[side] = int(found.sum())
        glare |= found
    return glare, exclude, counts


def remove_glare(image: object, landmarks: object, *, strength: float = 100.0) -> FixResult:
    img = check_photo(image, strength)
    points = mesh_points(landmarks)
    height, width = img.shape[:2]
    code = mesh_refusal(points, height, width)
    if code:
        return unchanged(img, "refused", code, LABEL)
    if strength == 0:
        return unchanged(img, "not_applicable", "zero_strength", LABEL)
    glare, exclude, counts = find_glare(img, points)
    report: dict[str, Any] = {"glare_pixels": counts}
    if not glare.any():
        return unchanged(img, "not_applicable", "no_glare", LABEL, report)
    outcome = fill(img, glare.astype(np.float32), "biharmonic", grow=GROW)
    weight = np.where((outcome.hole > 0) & ~exclude, strength / 100.0, 0.0)
    report["filled_pixels"] = int(np.count_nonzero(weight))
    return FixResult(blend_bytes(img, outcome.image, weight), weight, "edited", "edited", LABEL, report)

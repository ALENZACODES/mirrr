"""#42 Eye colour from the face mesh: recolour the visible iris, keep pupil and highlights.

The iris comes from the measured mesh (repair/eye_geometry.py: iris disk from the iris
points, inside the eye opening of an open eye); a closed eye is never edited. Each visible
iris goes through the existing local iris recolour (eyes/iris_colour.py: one of our eight
original shades, iris texture and the darker limbal ring kept), with the pupil protected
as a disk of PUPIL_SHARE of the iris radius on top of that engine's own centre and
highlight protection (L* above 85 is never changed). Alpha is kept and nothing outside
the irises changes. Local path only: no provider is called.

PUPIL_SHARE is ASSUMED (a mid-size pupil on drawn eyes; real pupils vary with light).
Mirrored in web/src/engines/local/eye-colour.ts. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from ..repair.eye_geometry import SIDES, eye_open, iris_disk, visible_iris
from ..repair.photo_fix import FixResult, check_photo, mesh_points, mesh_refusal, unchanged
from .iris_colour import LABEL, SHADES, iris_colour

PUPIL_SHARE = 0.45
MIN_IRIS_PIXELS = 12

__all__ = ["LABEL", "PUPIL_SHARE", "SHADES", "eye_colour"]


def eye_colour(image: object, landmarks: object, *, shade: str = "hazel",
               strength: float = 65.0) -> FixResult:
    img = check_photo(image, strength)
    if shade not in SHADES:
        raise ValueError("unknown original iris shade")
    points = mesh_points(landmarks)
    height, width = img.shape[:2]
    code = mesh_refusal(points, height, width)
    if code:
        return unchanged(img, "refused", code, LABEL)
    if strength == 0:
        return unchanged(img, "not_applicable", "zero_strength", LABEL)
    report: dict[str, Any] = {"shade": shade, "sides": {}}
    rgb = np.ascontiguousarray(img[..., :3])
    alpha = np.zeros((height, width), dtype=np.float64)
    for side in SIDES:
        if not eye_open(points, side):
            report["sides"][side] = "closed"
            continue
        iris = visible_iris(points, side, height, width)
        if int(iris.sum()) < MIN_IRIS_PIXELS:
            report["sides"][side] = "too_small"
            continue
        pupil = iris_disk(points, side, height, width, PUPIL_SHARE) & iris
        result = iris_colour(rgb, iris.astype(np.float64), shade=shade, strength=float(strength),
                             pupil=pupil.astype(np.float64))
        rgb = result.image
        alpha = np.maximum(alpha, result.alpha)
        report["sides"][side] = "recoloured" if result.changed else "no_change"
    if not np.any(alpha > 0):
        return unchanged(img, "not_applicable", "eyes_not_visible", LABEL, report)
    out = img.copy()
    out[..., :3] = rgb
    return FixResult(out, alpha, "edited", "edited", LABEL, report)

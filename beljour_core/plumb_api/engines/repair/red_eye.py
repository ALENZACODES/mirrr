"""#54 Red-eye removal: darken the red flash glow in the visible pupils only.

Where: the visible iris of each open eye (repair/eye_geometry.py: iris disk from the mesh
iris points, inside the eye opening). Nothing outside it changes, so lids, skin and lashes
keep every byte, and a closed eye is never edited.

What: a pixel is red-eye glow when its red channel is at least RED_RATIO times its
strongest other channel (plus one) and at least MIN_RED. The weight ramps from 0 at
RED_RATIO to 1 at RED_RATIO + RED_RAMP. Red is moved toward max(green, blue), which turns
the glow into a dark neutral pupil and leaves catchlights (bright, not red) and the iris
colour (not this red) as they were. Thresholds are ASSUMED, chosen on drawn eyes.

Mirrored in web/src/engines/local/red-eye.ts. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from .eye_geometry import SIDES, eye_open, visible_iris
from .photo_fix import FixResult, check_photo, half_up, mesh_points, mesh_refusal, unchanged

RED_RATIO = 1.5
RED_RAMP = 0.5
MIN_RED = 50.0
LABEL = "Red-eye fix on this photo: only the red flash glow in the pupils is darkened."


def red_weight(rgb: np.ndarray) -> np.ndarray:
    r = rgb[..., 0].astype(np.float64)
    other = np.maximum(rgb[..., 1], rgb[..., 2]).astype(np.float64)
    ratio = r / (other + 1.0)
    weight = np.clip((ratio - RED_RATIO) / RED_RAMP, 0.0, 1.0)
    out: np.ndarray = np.where(r >= MIN_RED, weight, 0.0)
    return out


def fix_red_eye(image: object, landmarks: object, *, strength: float = 100.0) -> FixResult:
    img = check_photo(image, strength)
    points = mesh_points(landmarks)
    height, width = img.shape[:2]
    code = mesh_refusal(points, height, width)
    if code:
        return unchanged(img, "refused", code, LABEL)
    if strength == 0:
        return unchanged(img, "not_applicable", "zero_strength", LABEL)
    open_sides = [side for side in SIDES if eye_open(points, side)]
    if not open_sides:
        return unchanged(img, "not_applicable", "eyes_not_visible", LABEL, {"open_eyes": []})
    red = red_weight(img[..., :3])
    weight = np.zeros((height, width), dtype=np.float64)
    report: dict[str, Any] = {"open_eyes": open_sides, "red_pixels": {}}
    for side in open_sides:
        region = visible_iris(points, side, height, width)
        side_weight = np.where(region, red, 0.0)
        report["red_pixels"][side] = int(np.count_nonzero(side_weight > 0))
        weight = np.maximum(weight, side_weight)
    weight *= strength / 100.0
    if not np.any(weight > 0):
        return unchanged(img, "not_applicable", "no_red_eye", LABEL, report)
    out = img.copy()
    r = img[..., 0].astype(np.float64)
    other = np.maximum(img[..., 1], img[..., 2]).astype(np.float64)
    out[..., 0] = np.clip(half_up(r - weight * (r - other)), 0, 255).astype(np.uint8)
    return FixResult(out, weight, "edited", "edited", LABEL, report)

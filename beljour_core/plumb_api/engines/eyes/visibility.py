"""Per-eye visibility and actual display-contrast diagnostics.

Occlusion is accepted only as a supplied local mask; no glasses or ethnicity are
inferred. Small/cropped/covered eyes are excluded explicitly, not counted as a
successful edit. Thresholds are preview assumptions awaiting real-face validation.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace
from typing import Any

import numpy as np

from .contracts import EyeRequest
from .geometry import EyeFrame, visible_canvas
from .raster import filled

MIN_EYE_WIDTH = 6.0
MIN_VISIBLE_CANVAS = .75
MAX_OCCLUDED_EYE = .35


def occlusion_field(value: Any, width: int, height: int) -> np.ndarray:
    if value is None:
        return np.zeros((height, width), dtype=np.float64)
    try:
        mask = np.asarray(value, dtype=np.float64)
    except (ValueError, TypeError) as exc:
        raise ValueError("occlusion mask must contain finite alpha values") from exc
    if mask.shape == (height * width,):
        mask = mask.reshape(height, width)
    if mask.shape != (height, width) or not np.all(np.isfinite(mask)):
        raise ValueError("occlusion mask must match the photo")
    if np.any(mask < 0) or np.any(mask > 1):
        raise ValueError("occlusion mask values must be in 0..1")
    return mask.copy()


def canvas_visible_fraction(frame: EyeFrame, anatomy: str, width: int, height: int) -> float:
    vertices = visible_canvas(frame, anatomy)
    # Sampling includes the middle of the strip as well as both edges, so a thin
    # sliver inside the frame cannot count as a fully visible mobile lid.
    samples = [*vertices]
    half = len(vertices) // 2
    for i in range(half):
        a, b = vertices[i], vertices[-i - 1]
        samples.append(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))
    return sum(0 <= x < width and 0 <= y < height for x, y in samples) / len(samples)


def visibility_report(frames: tuple[EyeFrame, EyeFrame], options: EyeRequest, width: int, height: int,
                      occlusion: np.ndarray, *, supplied: bool) -> tuple[tuple[EyeFrame, EyeFrame], dict[str, Any]]:
    selected, sides = [], []
    for frame in frames:
        eye = filled(height, width, [frame.point(u, v) for u, v in frame.contour])
        area = float(np.sum(eye))
        covered = float(np.sum(eye * occlusion)) / area if area > 0 else 1.0
        visible_canvas_share = canvas_visible_fraction(frame, options.anatomy[frame.side], width, height)
        reasons = []
        if not frame.visible:
            reasons.append("Eye is closed or the aperture is too small.")
        if frame.width < MIN_EYE_WIDTH:
            reasons.append("Eye width is below the six-pixel preview minimum.")
        if visible_canvas_share < MIN_VISIBLE_CANVAS:
            reasons.append("Too much of this eye's makeup area is outside the photo.")
        if supplied and covered > MAX_OCCLUDED_EYE:
            reasons.append("The supplied occlusion mask covers too much of this eye.")
        visible = not reasons
        selected.append(replace(frame, visible=visible))
        sides.append({"side": frame.side, "eligible": visible, "eye_width_px": frame.width,
                      "visible_canvas_fraction": visible_canvas_share, "occlusion_share": covered if supplied else None,
                      "warnings": reasons})
    return (selected[0], selected[1]), {"sides": sides, "mask_supplied": supplied,
                                      "occlusion_detection": "not_inferred", "thresholds_assumed": True}


def display_support(before: np.ndarray, after: np.ndarray, coverage: np.ndarray,
                    eye_frames: tuple[EyeFrame, EyeFrame]) -> list[dict[str, Any]]:
    """Measured output support split by eye; these are not cosmetic realism scores."""
    height, width = before.shape[:2]
    yy, xx = np.mgrid[:height, :width]
    centres = [frame.point(.5, .15) for frame in eye_frames]
    distances = [(xx + .5 - x) ** 2 + (yy + .5 - y) ** 2 for x, y in centres]
    right_nearest = distances[0] <= distances[1]
    delta = after[:, :, :3].astype(np.float64) - before[:, :, :3]
    luminance = before[:, :, :3] @ np.array((.2126, .7152, .0722))
    output = []
    for index, frame in enumerate(eye_frames):
        region = (coverage > .01) & (right_nearest if index == 0 else ~right_nearest)
        count = int(np.count_nonzero(region))
        rgb_delta = np.abs(delta[region])
        changed = int(np.count_nonzero(np.any(delta[region] != 0, axis=1))) if count else 0
        output.append({"side": frame.side, "covered_pixels": count, "changed_pixels": changed,
                       "mean_rgb_change": float(np.mean(rgb_delta)) if count else None,
                       "source_luminance": float(np.mean(luminance[region])) if count else None,
                       "near_black_share": float(np.mean(luminance[region] < 12)) if count else None,
                       "near_white_share": float(np.mean(luminance[region] > 243)) if count else None,
                       "metric_kind": "display_support_only", "realism_score": None})
    return output

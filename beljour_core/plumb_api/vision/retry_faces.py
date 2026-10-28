"""Second-pass face mesh recovery from bounded upscaled crops, without new models.

This operates only after the existing box-first detector's normal attempts.
The face proposals are supplied by the existing cleared runtime. This module
never invents a detection, a confidence score or demographic membership.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence

import numpy as np

from .box_first import (
    BoxFirstDetector,
    Crop,
    DetectionResult,
    FaceBox,
    associated,
    crop_plan,
    crop_rgb,
    image_rgb,
    mesh_box,
    overlap,
)

MIN_FACE_PIXELS = 12
MAX_RECOVERY_CROPS = 8


def ordered(boxes: Sequence[FaceBox], width: int, height: int) -> list[FaceBox]:
    """Try larger boxes before smaller, with centre distance as a tie-break."""
    return sorted(boxes, key=lambda b: (
        -b.area,
        (b.x + b.width / 2 - width / 2) ** 2
        + (b.y + b.height / 2 - height / 2) ** 2,
        b.x, b.y,
    ))


def center_crop(width: int, height: int) -> Crop:
    if min(width, height) < 2:
        raise ValueError("crop needs positive dimensions")
    side = max(32, math.ceil(min(width, height) * 0.65))
    return Crop((width - side) // 2, (height - side) // 2, side, 512)


def _matched(points: np.ndarray, boxes: Sequence[FaceBox], width: int, height: int) -> bool:
    if not boxes:
        return True
    return any(associated(points, box, width, height) >= 0.15 for box in boxes)


def recover(detector: BoxFirstDetector, image: np.ndarray, initial: DetectionResult,
            *, min_pixels: int = MIN_FACE_PIXELS) -> DetectionResult:
    """Retry on centre and individual boxes; return the same observation unit.

    Each crop is limited to a 512-square allocation. Pixel-space proposals are
    never serialized. A tiny proposal is recorded as unresolved rather than
    presented as a successful recovered subject.
    """
    if any(attempt.get("extra_call") is True for attempt in initial.attempts):
        return initial
    rgb = image_rgb(image)
    height, width = rgb.shape[:2]
    if type(min_pixels) is not int or not 2 <= min_pixels <= 256:
        raise ValueError("minimum face resolution out of range")
    result = initial
    unresolved = [
        box for box in result.boxes
        if not any(associated(face, box, width, height) >= 0.15 for face in result.faces)
    ]
    # A normal detection can find one person while missing another. Do not
    # short-circuit solely because one mesh exists or all proposals are large.
    if result.faces and not unresolved:
        return result
    candidates: list[tuple[str, Crop, FaceBox | None]] = []
    candidates.append(("upscaled_centre", center_crop(width, height), None))
    for box in ordered(unresolved, width, height):
        if len(candidates) >= MAX_RECOVERY_CROPS:
            break
        if min(box.width, box.height) < min_pixels:
            result.attempts.append({"stage": "small_face_refused", "code": "face_too_small"})
            continue
        candidates.append(("upscaled_box", crop_plan(box, margin=1.25, minimum=512), box))
    for stage, plan, candidate_box in candidates:
        if len(result.faces) >= detector.max_faces:
            break
        try:
            raw, shapes = detector.mesh_source(crop_rgb(rgb, plan))
        except (ValueError, TypeError):
            result.attempts.append({"stage": stage, "matched": False, "code": "invalid_crop"})
            continue
        recovered = 0
        for index, mesh in enumerate(raw):
            try:
                original = plan.restore(mesh, width, height)
                frame = mesh_box(original, width, height)
            except (TypeError, ValueError):
                continue
            if min(frame.width, frame.height) < min_pixels:
                continue
            if not _matched(original, result.boxes, width, height):
                continue
            if candidate_box is not None and associated(original, candidate_box, width, height) < 0.15:
                continue
            if any(overlap(frame, mesh_box(face, width, height)) > 0.6 for face in result.faces):
                continue
            result.faces.append(original)
            result.blendshapes.append(shapes[index] if index < len(shapes) else {})
            recovered += 1
            if len(result.faces) >= detector.max_faces:
                break
        result.attempts.append({"stage": stage, "matched": recovered > 0,
                                "recovered_faces": recovered})
        if recovered:
            result.used_fallback = True
    return result


def failure_code(result: DetectionResult) -> str:
    if result.faces:
        return "recovered" if result.used_fallback else "detected"
    if any(item.get("code") == "face_too_small" for item in result.attempts):
        return "face_too_small"
    if result.boxes:
        return "no_mesh_after_retry"
    return "no_face_found"

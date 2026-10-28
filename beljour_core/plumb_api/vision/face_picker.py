"""Ephemeral per-person selection and conservative region-isolated compositing.

The boxes are geometric detections, not identity or demographic classifications.
A caller must supply actual reviewed edit/protected masks for pixel compositing:
bounding rectangles are NEVER treated as semantic hair, clothing or skin masks.
No photo or landmark bytes are persisted in a selector or serialized by reports.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .box_first import FaceBox
from .subject import rank_main

Bytes = NDArray[np.uint8]
FloatMask = NDArray[np.float32]
MAX_FACES = 16


@dataclass(frozen=True)
class FaceChoice:
    index: int | None
    code: str
    visible_faces: int
    untouched_faces: int

    def counts(self) -> dict[str, int | str]:
        """No boxes, meshes, image names or identity-bearing bytes leave memory."""
        return {"code": self.code, "visible_faces": self.visible_faces,
                "untouched_faces": self.untouched_faces}


@dataclass(frozen=True)
class Pickable:
    """Short-lived view of proposals; never store this object in a receipt."""
    boxes: tuple[FaceBox, ...]
    primary: FaceChoice

    def tap(self, x: float, y: float) -> FaceChoice:
        """Choose a detected face by a normalized point in the source photo."""
        if not all(isinstance(v, (int, float)) and math.isfinite(v) and 0 <= v <= 1 for v in (x, y)):
            return FaceChoice(None, "invalid_tap", len(self.boxes), len(self.boxes))
        candidates: list[tuple[float, int]] = []
        for index, box in enumerate(self.boxes):
            if box.x <= x <= box.x + box.width and box.y <= y <= box.y + box.height:
                candidates.append((box.area, index))
        if not candidates:
            return FaceChoice(None, "no_face_at_point", len(self.boxes), len(self.boxes))
        index = min(candidates)[1]
        return FaceChoice(index, "selected_by_user", len(self.boxes), len(self.boxes) - 1)

    def select(self, index: int) -> FaceChoice:
        if type(index) is not int or index < 0 or index >= len(self.boxes):
            return FaceChoice(None, "invalid_selection", len(self.boxes), len(self.boxes))
        return FaceChoice(index, "selected_by_user", len(self.boxes), len(self.boxes) - 1)


def geometry(box: FaceBox, width: int, height: int) -> FaceBox:
    """Clip to normalized coordinates; reject zero area or non-finite boxes."""
    if any(type(v) is not int or v < 2 for v in (width, height)):
        raise ValueError("image dimensions must be positive integers")
    values = (box.x, box.y, box.width, box.height, box.score)
    if any(not math.isfinite(v) for v in values) or not 0 <= box.score <= 1:
        raise ValueError("face box must be finite with validated confidence")
    x0 = max(0.0, box.x / width)
    y0 = max(0.0, box.y / height)
    x1 = min(1.0, (box.x + box.width) / width)
    y1 = min(1.0, (box.y + box.height) / height)
    if x1 <= x0 or y1 <= y0:
        raise ValueError("face box must overlap the photo with positive area")
    return FaceBox(x0, y0, x1 - x0, y1 - y0, box.score)


def picker(boxes: Sequence[FaceBox], width: int, height: int, *, min_confidence: float = 0.7) -> Pickable:
    """Default to largest face, with center proximity breaking area ties.

    No duplicate or low-confidence candidate is silently selectable. The
    interactive policy differs intentionally from the older frozen gate's
    ambiguity refusal: the user can expressly choose any presented face.
    """
    if (not isinstance(min_confidence, (int, float))
            or not math.isfinite(min_confidence) or not 0 <= min_confidence <= 1):
        raise ValueError("confidence threshold must be a finite fraction")
    if len(boxes) > MAX_FACES:
        return Pickable((), FaceChoice(None, "too_many_faces", len(boxes), len(boxes)))
    visible: list[FaceBox] = []
    for box in boxes:
        try:
            normal = geometry(box, width, height)
        except (AttributeError, TypeError, ValueError):
            continue
        if normal.score >= min_confidence:
            visible.append(normal)
    if not visible:
        return Pickable((), FaceChoice(None, "no_face_found", 0, 0))
    # Both the live picker and frozen runner share the same near-equal area rule.
    primary_index, _ = rank_main(visible, 1, 1)
    primary = FaceChoice(primary_index, "selected_primary", len(visible), len(visible) - 1)
    return Pickable(tuple(visible), primary)


def mask_array(value: object, height: int, width: int) -> FloatMask:
    """Require an explicit, finite, single-channel verified local region."""
    arr = np.asarray(value)
    if arr.shape != (height, width) or arr.dtype.kind not in "fui":
        raise ValueError("one full-image numeric region mask is required")
    mask = np.asarray(arr, dtype=np.float32)
    if not np.isfinite(mask).all() or np.any(mask < 0) or np.any(mask > 1):
        raise ValueError("masks must have finite weights from zero to one")
    return mask


def compose_selected(original: Bytes, edited: Bytes, chosen: object,
                     bystanders: Sequence[object] = ()) -> Bytes:
    """Blend just the reviewed chosen region; bystander pixels are exact originals.

    A missing chosen semantic mask fails rather than falling back to a face box.
    Bystander masks *always* take priority over editable mask alpha. A caller
    must include matching hair/body protected regions in these masks when such
    pixels can be reached by the actual effect; this function does not guess.
    """
    before = np.asarray(original)
    after = np.asarray(edited)
    if (before.dtype != np.uint8 or after.dtype != np.uint8
            or before.ndim != 3 or before.shape != after.shape
            or before.shape[2] not in (3, 4)):
        raise ValueError("source and edit must be equal uint8 RGB(A) images")
    height, width = before.shape[:2]
    if not 2 <= min(height, width) or max(height, width) > 16384:
        raise ValueError("unsupported image dimensions")
    allowed = mask_array(chosen, height, width).copy()
    if not np.any(allowed > 0):
        raise ValueError("the selected person has no verified editable region")
    for candidate in bystanders:
        forbidden = mask_array(candidate, height, width)
        allowed[forbidden > 0] = 0
    alpha = allowed[..., None].astype(np.float64)
    pixels = np.rint(before.astype(np.float64) * (1 - alpha) + after.astype(np.float64) * alpha)
    out = np.clip(pixels, 0, 255).astype(np.uint8)
    out[allowed <= 0] = before[allowed <= 0]
    if before.shape[2] == 4:
        out[..., 3] = before[..., 3]
    return out


def summary(selection: FaceChoice, checks: Mapping[str, bool]) -> dict[str, int | str | bool]:
    """Explicit count-only readiness, no image/mesh/coordinate information."""
    if any(type(v) is not bool for v in checks.values()):
        raise ValueError("checks must be boolean")
    return {**selection.counts(), "processed": selection.index is not None,
            "bystanders_unchanged": bool(checks.get("bystanders_unchanged", False)),
            "verified_mask": bool(checks.get("verified_mask", False))}

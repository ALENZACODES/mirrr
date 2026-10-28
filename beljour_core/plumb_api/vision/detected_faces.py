"""Bind interactive face choices to validated detector meshes, never raw boxes.

The existing box-first runtime may return proposals that have no matching mesh.
Those proposals are not editable faces. No pixels or geometry leave this local
object's count-only report. Face-mapping concepts: OpenCV YuNet and MediaPipe
Face Landmarker; concept only, no code copied. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from .box_first import DetectionResult, FaceBox, associated, mesh_box, valid_mesh
from .face_picker import FaceChoice, Pickable, picker
from .mesh_recovery import MIN_FRAME_SHARE, frame_share


@dataclass(frozen=True)
class DetectedFaces:
    """A short-lived map from pickable faces to actual detected mesh indices."""

    choices: Pickable
    mesh_indices: tuple[int, ...]
    meshes: tuple[np.ndarray, ...]

    def select(self, index: int) -> FaceChoice:
        return self.choices.select(index)

    def tap(self, x: float, y: float) -> FaceChoice:
        return self.choices.tap(x, y)

    def mesh(self, selection: FaceChoice) -> np.ndarray | None:
        """Only explicitly chosen valid faces yield a detached mesh copy."""
        index = selection.index
        if (type(index) is not int or index < 0 or index >= len(self.mesh_indices)
                or selection.code not in {"selected_primary", "selected_by_user"}):
            return None
        return self.meshes[index].copy()

    def counts(self) -> dict[str, int | str]:
        return self.choices.primary.counts()


def from_detection(result: DetectionResult, width: int, height: int,
                   *, min_confidence: float = 0.7) -> DetectedFaces:
    """Require 478 finite measured points for each selectable face.

    A YuNet proposal can be edited only when one measured mesh overlaps it.
    If no proposals exist, an independently detected full-image mesh may be
    selected using its observed bounds. Matching is one-to-one; no face or
    confidence is fabricated. Historic frozen-set ambiguity policy is separate.
    """
    if not isinstance(result, DetectionResult):
        raise TypeError("a box-first detection result is required")
    if any(type(v) is not int or not 2 <= v <= 16384 for v in (width, height)):
        raise ValueError("image dimensions must be bounded positive integers")
    if (isinstance(min_confidence, bool) or not isinstance(min_confidence, (int, float))
            or not math.isfinite(min_confidence) or not 0 <= min_confidence <= 1):
        raise ValueError("confidence must be a finite fraction")
    boxes: list[FaceBox] = []
    observed: list[np.ndarray] = []
    original_indices: list[int] = []
    claimed_boxes: set[int] = set()
    for index, candidate in enumerate(result.faces):
        try:
            mesh = valid_mesh(candidate)
            if frame_share(mesh) < MIN_FRAME_SHARE:
                continue
            extent = mesh_box(mesh, width, height)
            if extent.width < 2 or extent.height < 2:
                continue
            # Restored points may extend slightly outside source dimensions.
            # Clip the box only inside the existing picker, never the mesh.
            if result.boxes:
                matches = [
                    (associated(mesh, box, width, height), j)
                    for j, box in enumerate(result.boxes)
                    if j not in claimed_boxes and box.score >= min_confidence
                ]
                if not matches:
                    continue
                score, best = max(matches, key=lambda pair: (pair[0], -pair[1]))
                if score < 0.15:
                    continue
                proposed = result.boxes[best]
                claimed_boxes.add(best)
                chosen_box = FaceBox(extent.x, extent.y, extent.width, extent.height, proposed.score)
            else:
                chosen_box = FaceBox(extent.x, extent.y, extent.width, extent.height, 1.0)
        except (ValueError, TypeError, IndexError):
            continue
        boxes.append(chosen_box)
        observed.append(mesh)
        original_indices.append(index)
    # Reject excessive crowds instead of silently selecting one of 17+ faces.
    choice = picker(boxes, width, height, min_confidence=min_confidence)
    return DetectedFaces(choice, tuple(original_indices), tuple(observed))

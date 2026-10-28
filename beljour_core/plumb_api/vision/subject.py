"""Select an editable person from validated, independently detected face meshes.

Default selection is largest-first with a bounded central-position tie band.
The caller may explicitly select a different detected index. Metadata is
geometric only and does not infer any demographic or identity attribute.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np

from .box_first import FaceBox, associated, mesh_box, valid_mesh

AREA_TIE_BAND = 0.10
MIN_FRAME_SHARE = 0.98
MIN_BOX_SCORE = 0.70


@dataclass(frozen=True)
class Subject:
    """A short-lived selection; only non-identifying scalar fields are reportable."""

    index: int | None
    reason_code: str
    candidates: int
    area: float | None
    score: float | None
    other_faces: int

    @property
    def accepted(self) -> bool:
        return self.index is not None


def _candidate(raw: object, width: int, height: int) -> tuple[np.ndarray, FaceBox] | None:
    try:
        mesh = valid_mesh(raw)
    except (ValueError, TypeError):
        return None
    if float(((mesh[:, 0] >= 0) & (mesh[:, 0] < 1)
              & (mesh[:, 1] >= 0) & (mesh[:, 1] < 1)).mean()) < MIN_FRAME_SHARE:
        return None
    return mesh, mesh_box(mesh, width, height)


def _centre_distance(box: FaceBox, width: int, height: int) -> float:
    x = (box.x + box.width / 2) / width - 0.5
    y = (box.y + box.height / 2) / height - 0.5
    return x * x + y * y


def _matched_score(mesh: np.ndarray, boxes: Sequence[FaceBox],
                   width: int, height: int) -> float | None:
    return max((box.score for box in boxes
                if associated(mesh, box, width, height) >= 0.10), default=None)


def rank_main(boxes: Sequence[FaceBox], width: int, height: int) -> tuple[int, bool]:
    """The shared largest/near-equal-centre ordering for the app and runner."""
    if not boxes:
        raise ValueError("no detected faces to rank")
    largest = max(box.area for box in boxes)
    comparable = [index for index, box in enumerate(boxes)
                  if box.area >= largest * (1 - AREA_TIE_BAND)]
    if len(comparable) == 1:
        return comparable[0], False
    index = min(comparable, key=lambda position: (
        round(_centre_distance(boxes[position], width, height), 12),
        -round(boxes[position].area, 12), position,
    ))
    return index, True


def choose_subject(meshes: Sequence[np.ndarray], boxes: Sequence[FaceBox],
                   width: int, height: int, chosen_index: int | None = None,
                   *, minimum_score: float = MIN_BOX_SCORE) -> Subject:
    """Choose the main person or exactly the user-selected detected mesh.

    A nonselected clipped face cannot veto a valid main subject. Confidence,
    clipping and mesh validity checks apply to the selected subject itself.
    Unmatched proposals are not fabricated into candidate meshes.
    """
    if type(width) is not int or type(height) is not int or min(width, height) < 2:
        raise ValueError("image dimensions must be positive integers")
    if not isinstance(minimum_score, (int, float)) or not math.isfinite(minimum_score):
        raise ValueError("minimum confidence must be finite")
    if not 0 <= minimum_score <= 1:
        raise ValueError("minimum confidence must be in [0, 1]")
    if chosen_index is not None and (type(chosen_index) is not int or chosen_index < 0
                                     or chosen_index >= len(meshes)):
        return Subject(None, "invalid_selection", len(meshes), None, None, len(meshes))
    if not meshes:
        return Subject(None, "no_face", 0, None, None, 0)
    eligible: list[tuple[int, np.ndarray, FaceBox, float | None]] = []
    clipped = False
    for index, raw in enumerate(meshes):
        try:
            valid_mesh(raw)
        except (ValueError, TypeError):
            continue
        candidate = _candidate(raw, width, height)
        if candidate is None:
            clipped = True
            continue
        mesh, face_box = candidate
        confidence = _matched_score(mesh, boxes, width, height)
        eligible.append((index, mesh, face_box, confidence))
    if not eligible:
        return Subject(None, "mesh_out_of_frame" if clipped else "invalid_mesh",
                       len(meshes), None, None, len(meshes))
    if chosen_index is not None:
        matching = [item for item in eligible if item[0] == chosen_index]
        if not matching:
            return Subject(None, "invalid_mesh", len(meshes), None, None, len(meshes))
        selected = matching[0]
        reason = "selected_by_index"
    else:
        ranked_index, tied = rank_main([item[2] for item in eligible], width, height)
        selected = eligible[ranked_index]
        reason = "selected_centre_tiebreak" if tied else "selected_largest"
    index, _, face_box, confidence = selected
    if confidence is not None and confidence < minimum_score:
        return Subject(None, "low_confidence", len(meshes), face_box.area,
                       confidence, len(meshes))
    return Subject(index, reason, len(meshes), face_box.area,
                   confidence, len(meshes) - 1)

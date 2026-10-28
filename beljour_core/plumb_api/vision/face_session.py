"""Revision-scoped face-selection session and safe multi-person editing boundary.

No persistent photo, landmark, segmentation or identifying face data. Source
changes invalidate selection and masks; a refused edit leaves pixels unchanged.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np

from .box_first import FaceBox
from .face_picker import FaceChoice, Pickable, compose_selected, mask_array, picker
from .face_region_audit import PersonAudit, audit


@dataclass(frozen=True)
class SelectionState:
    revision: int
    face_count: int
    chosen: int | None
    code: str
    verified_region: bool


class FaceSession:
    """Local-only revision boundary for choosing a subject from all proposals."""

    def __init__(self) -> None:
        self._revision = 0
        self._selection: Pickable | None = None
        self._chosen: FaceChoice | None = None
        self._mask: np.ndarray | None = None
        self._bystanders: tuple[np.ndarray, ...] = ()
        self._last_audit: PersonAudit | None = None
        self._height = 0
        self._width = 0

    def new_photo(self, boxes: Sequence[FaceBox], width: int, height: int) -> SelectionState:
        self._revision += 1
        self._selection = picker(boxes, width, height)
        self._height = height
        self._width = width
        self._chosen = self._selection.primary
        self._mask = None
        self._bystanders = ()
        self._last_audit = None
        return self.state()

    def state(self) -> SelectionState:
        chosen = self._chosen
        count = chosen.visible_faces if chosen is not None else 0
        return SelectionState(self._revision, count,
                              chosen.index if chosen is not None else None,
                              chosen.code if chosen is not None else "no_face_found",
                              self._mask is not None)

    def tap(self, x: float, y: float) -> SelectionState:
        if self._selection is None:
            return self.state()
        candidate = self._selection.tap(x, y)
        if candidate.index is not None:
            self._chosen = candidate
            self._mask = None
            self._bystanders = ()
            self._last_audit = None
        return self.state()

    def select(self, index: int) -> SelectionState:
        if self._selection is None:
            return self.state()
        candidate = self._selection.select(index)
        if candidate.index is not None:
            self._chosen = candidate
            self._mask = None
            self._bystanders = ()
            self._last_audit = None
        return self.state()

    def provide_masks(self, revision: int, selected: object,
                      bystanders: Sequence[object]) -> SelectionState:
        if revision != self._revision:
            raise ValueError("stale photo revision")
        if self._chosen is None or self._chosen.index is None:
            raise ValueError("select a detected face first")
        # Verify all semantic masks before saying the region is ready.
        checked = mask_array(selected, self._height, self._width)
        if not np.any(checked > 0):
            raise ValueError("selected person has no reviewed editable region")
        protected = tuple(mask_array(item, self._height, self._width).copy()
                          for item in bystanders)
        self._mask = checked.copy()
        self._bystanders = protected
        self._last_audit = None
        return self.state()

    def apply(self, revision: int, original: np.ndarray, edited: np.ndarray) -> np.ndarray:
        if revision != self._revision:
            raise ValueError("photo changed during edit")
        if self._chosen is None or self._chosen.index is None or self._mask is None:
            raise ValueError("no selected face with verified editable region")
        result = compose_selected(original, edited, self._mask, self._bystanders)
        observed = audit(original, result, self._mask, self._bystanders)
        if not observed.passed:
            raise ValueError(f"selected-person isolation refused: {observed.status}")
        self._last_audit = observed
        return result

    def audit_counts(self) -> dict[str, int | str | bool] | None:
        """Return safe edit-isolation evidence, never pixels or landmarks."""
        return self._last_audit.counts() if self._last_audit is not None else None

    def clear(self) -> None:
        self._revision += 1
        self._selection = None
        self._chosen = None
        self._mask = None
        self._bystanders = ()
        self._last_audit = None
        self._height = 0
        self._width = 0

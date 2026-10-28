"""Independent count-only audit for a selected-person image edit.

A bounding box never confers permission to change a person's hair or body.
Only verified semantic masks define the edit boundary. An audit uses actual
before/after byte changes, not an engine's own `passed` or `safe` flag.
No input pixels, coordinates, landmarks or demographic labels are serialized.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

Pixels = NDArray[np.uint8]
MAX_PIXELS = 16_777_216


@dataclass(frozen=True)
class PersonAudit:
    """Count-only evidence. PASS means isolation, not aesthetic quality."""
    status: str
    pixels: int
    selected_pixels: int
    protected_pixels: int
    changed_in_selection: int
    changed_outside_selection: int
    changed_bystanders: int
    changed_alpha: int

    @property
    def passed(self) -> bool:
        return self.status == "isolated"

    def counts(self) -> dict[str, int | str | bool]:
        """Do not reveal image bytes, face indices or identifying regions."""
        return {
            "status": self.status,
            "passed": self.passed,
            "pixels": self.pixels,
            "selected_pixels": self.selected_pixels,
            "protected_pixels": self.protected_pixels,
            "changed_in_selection": self.changed_in_selection,
            "changed_outside_selection": self.changed_outside_selection,
            "changed_bystanders": self.changed_bystanders,
            "changed_alpha": self.changed_alpha,
        }


def _pixels(value: object, expected: tuple[int, ...] | None = None) -> Pixels:
    array = np.asarray(value)
    if array.dtype != np.uint8 or array.ndim != 3 or array.shape[2] not in (3, 4):
        raise ValueError("RGB(A) uint8 image required for an independent audit")
    height, width, _ = array.shape
    if min(height, width) < 2 or height * width > MAX_PIXELS:
        raise ValueError("unsupported image dimensions or memory budget")
    if expected is not None and array.shape != expected:
        raise ValueError("images must have matching dimensions and channels")
    return array


def _mask(value: object, height: int, width: int) -> NDArray[np.bool_]:
    array = np.asarray(value)
    if array.shape != (height, width) or array.dtype.kind not in "fui":
        raise ValueError("verified full-size numeric person mask required")
    if not np.isfinite(array).all() or np.any(array < 0) or np.any(array > 1):
        raise ValueError("person mask values must be finite fractions from zero to one")
    return array > 0


def audit(original: object, edited: object, selected: object,
          bystanders: Sequence[object] = (), *, require_change: bool = False) -> PersonAudit:
    """Recompute which pixels changed, failing any unprotected change.

    The supplied masks must be externally validated as correctly following
    the selected subject and the other full people (including their hair and
    bodies). No automatic region inference is attempted from RGB values.
    """
    if type(require_change) is not bool:
        raise ValueError("require_change must be a boolean")
    before = _pixels(original)
    after = _pixels(edited, before.shape)
    height, width, channels = before.shape
    chosen = _mask(selected, height, width)
    if not np.any(chosen):
        raise ValueError("a nonempty verified selected-person mask is required")
    protected = np.zeros((height, width), dtype=np.bool_)
    for candidate in bystanders:
        protected |= _mask(candidate, height, width)
    editable = chosen & ~protected
    changed_rgb = np.any(before[..., :3] != after[..., :3], axis=2)
    changed_alpha = np.zeros((height, width), dtype=np.bool_)
    if channels == 4:
        changed_alpha = before[..., 3] != after[..., 3]
    outside_changes = int(np.count_nonzero(changed_rgb & ~editable))
    bystander_changes = int(np.count_nonzero(changed_rgb & protected))
    alpha_changes = int(np.count_nonzero(changed_alpha))
    inside_changes = int(np.count_nonzero(changed_rgb & editable))
    if outside_changes or alpha_changes:
        status = "isolation_failed"
    elif not np.any(editable):
        status = "selection_fully_protected"
    elif require_change and inside_changes == 0:
        status = "no_measured_effect"
    else:
        status = "isolated"
    return PersonAudit(
        status=status,
        pixels=height * width,
        selected_pixels=int(np.count_nonzero(editable)),
        protected_pixels=int(np.count_nonzero(protected)),
        changed_in_selection=inside_changes,
        changed_outside_selection=outside_changes,
        changed_bystanders=bystander_changes,
        changed_alpha=alpha_changes,
    )

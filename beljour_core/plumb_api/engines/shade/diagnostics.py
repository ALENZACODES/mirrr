"""Run both W6 paths on one photo and classify the outcome with shade.review.

The legacy path is finder.find_shade (all three zones, no background estimate); the
audited path is measurement.measure_shade_with_audit (cheek audit, background
estimate, extended references). Both use the same caller-supplied neutral reference
when there is one. A missing or invalid mesh is ``missing_geometry``; it is never
guessed. Nothing from the photo is kept beyond the review fields. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence

import numpy as np

from .finder import find_shade
from .measurement import measure_shade_with_audit
from .review import ShadeDiagnosis, ShadeReview, classify_paths, review_diagnoses

__all__ = ["diagnose_photo", "diagnose_photos"]


def diagnose_photo(image: object, points: object | None, *, neutral_mask: object | None = None) -> ShadeDiagnosis:
    """Both paths on one photo; ValueError only for a photo that is not an RGB(A) uint8 image."""
    photo = np.asarray(image)
    if photo.dtype != np.uint8 or photo.ndim != 3 or photo.shape[2] not in (3, 4):
        raise ValueError("Shade diagnostics need a uint8 RGB or RGBA photo")
    if points is None:
        return classify_paths(None, None, None, geometry=False)
    try:
        legacy = find_shade(photo, points, neutral_mask=neutral_mask)
        audited, audit, _ = measure_shade_with_audit(photo, points, neutral_mask=neutral_mask)
    except ValueError:
        return classify_paths(None, None, None, geometry=False)
    return classify_paths(legacy, audited, None if audit.usable else audit.reason, geometry=True)


def diagnose_photos(cases: Sequence[tuple[object, object | None]]) -> ShadeReview:
    """Review a set of (photo, mesh) cases; every case is counted."""
    return review_diagnoses(diagnose_photo(image, points) for image, points in cases)

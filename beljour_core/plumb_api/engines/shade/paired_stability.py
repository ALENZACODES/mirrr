"""Two independent W6 captures must agree before a shade is suggested.

Each capture is read on its own through the checked cheek-first entry
(``skin_accuracy.assess_skin_photo``). A shade is suggested only when:

* the second photo differs from the first (compared by a SHA-256 digest of the
  pixels and size, used here and then dropped);
* each reading independently clears the existing W6 limits: overall confidence
  at least ``refuse_below``, reference distance at most ``refuse_delta_e_above``
  and no more than ``never_lighter_allowance`` L* lighter than the reading;
* both readings name the same in-house reference.

The decision reports reference labels and bounded measurements only, never the
photo bytes, the digests, masks or landmarks. Repeatability on two photos is not
evidence of physical product accuracy. Mirrored in
web/src/engines/shade/paired-stability.ts. Author: John Khan.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any

import numpy as np

from . import colourspace as cs
from .finder import ShadeResult, thresholds
from .skin_accuracy import SkinPhotoAssessment, assess_skin_photo

_NOTES = {
    None: "Two different photos name the same in-house reference.",
    "same_photo": "The second capture is the same photo; take a new photo to compare.",
    "first_invalid": "The first capture has no usable face geometry.",
    "second_invalid": "The second capture has no usable face geometry.",
    "first_refused": "The first photo did not give a reliable reading.",
    "second_refused": "The second photo did not give a reliable reading.",
    "references_differ": "The two photos name different references; no shade is suggested.",
}


@dataclass(frozen=True)
class ShadeCapture:
    """One photo with its 478 landmarks in pixels and optional lighting masks."""

    image: object
    points: object
    neutral_mask: object | None = None
    background_mask: object | None = None


@dataclass(frozen=True)
class PairDecision:
    suggested: bool
    reason: str | None
    reference_id: str | None
    first_reference_id: str | None
    second_reference_id: str | None
    reading_distance: float | None
    confidences: tuple[float | None, float | None]
    note: str

    def public(self) -> dict[str, Any]:
        return {
            "suggested": self.suggested,
            "reason": self.reason,
            "reference_id": self.reference_id,
            "first_reference_id": self.first_reference_id,
            "second_reference_id": self.second_reference_id,
            "reading_distance": None if self.reading_distance is None else round(self.reading_distance, 4),
            "confidences": [None if c is None else round(c, 4) for c in self.confidences],
            "note": self.note,
            "tested_against_real_products": False,
        }


def _digest(image: object) -> str:
    arr = np.ascontiguousarray(np.asarray(image))
    return hashlib.sha256(repr(arr.shape).encode() + arr.tobytes()).hexdigest()


def _read(capture: ShadeCapture) -> SkinPhotoAssessment | None:
    try:
        return assess_skin_photo(capture.image, capture.points, neutral_mask=capture.neutral_mask,
                                 background_mask=capture.background_mask)
    except (TypeError, ValueError):
        return None


def clears_limits(reading: ShadeResult) -> bool:
    """The existing W6 confidence, reference-distance and no-lightening limits."""
    conf = thresholds()["confidence"]
    best = reading.best
    return (not reading.refused and best is not None
            and reading.confidence.get("overall", 0.0) >= float(conf["refuse_below"])
            and float(best["delta_e"]) <= float(conf["refuse_delta_e_above"])
            and float(best["lighter_by"]) <= float(thresholds()["never_lighter_allowance"]))


def _identity(found: SkinPhotoAssessment | None) -> str | None:
    if found is None or not found.accepted or not clears_limits(found.reading):
        return None
    return found.reference_id


def _decision(reason: str | None, first: SkinPhotoAssessment | None = None,
              second: SkinPhotoAssessment | None = None) -> PairDecision:
    ids = (_identity(first), _identity(second))
    labs = [None if f is None else f.reading.measured_lab for f in (first, second)]
    distance = (None if labs[0] is None or labs[1] is None
                else cs.delta_e(np.asarray(labs[0]), np.asarray(labs[1])))
    confidences = tuple(None if f is None else float(f.reading.confidence.get("overall", 0.0))
                        for f in (first, second))
    return PairDecision(reason is None, reason, ids[0] if reason is None else None, ids[0], ids[1],
                        distance, (confidences[0], confidences[1]), _NOTES[reason])


def compare_shade_captures(first: ShadeCapture, second: ShadeCapture) -> PairDecision:
    """Suggest a shade only when two different photos independently agree."""
    if _digest(first.image) == _digest(second.image):
        return _decision("same_photo")
    one = _read(first)
    if one is None:
        return _decision("first_invalid")
    two = _read(second)
    if two is None:
        return _decision("second_invalid", one)
    if _identity(one) is None:
        return _decision("first_refused", one, two)
    if _identity(two) is None:
        return _decision("second_refused", one, two)
    if _identity(one) != _identity(two):
        return _decision("references_differ", one, two)
    return _decision(None, one, two)

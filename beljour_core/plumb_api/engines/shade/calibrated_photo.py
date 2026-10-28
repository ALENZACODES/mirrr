"""Card-assisted W6 reading: checked neutral evidence, then the cheek-consensus photo path.

The visitor marks a neutral card and confirms it is neutral material. The card
is checked by ``neutral_calibration.inspect_neutral_card``; only a usable card is
passed to ``skin_accuracy.assess_skin_photo`` as the explicit neutral reference.
A missing mesh, an invalid mesh or a rejected card never yields a usable shade,
and a rejected card does not fall back to a background estimate in this entry.
No provider call, model or inferred demographic label is involved. Reference
shades are in-house estimates, not physical products. Mirrored in
web/src/engines/shade/calibrated-photo.ts. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .neutral_calibration import NeutralDecision, inspect_neutral_card, neutral_photo_options
from .skin_accuracy import SkinPhotoAssessment, assess_skin_photo

_NOTES = {
    None: "Shade read with a checked neutral card.",
    "no_mesh": "No face landmarks were supplied; no shade is read.",
    "invalid_mesh": "The face landmarks could not be used; no shade is read.",
    "card_rejected": "The neutral card was not usable; no shade is read with it.",
    "reading_refused": "The card-corrected reading did not pass the existing shade limits.",
}


@dataclass(frozen=True)
class CalibratedPhoto:
    usable: bool
    reason: str | None
    neutral: NeutralDecision | None
    assessment: SkinPhotoAssessment | None
    note: str

    @property
    def reference_id(self) -> str | None:
        return None if not self.usable or self.assessment is None else self.assessment.reference_id

    def public(self) -> dict[str, Any]:
        return {
            "format": "beljour-calibrated-photo/1",
            "usable": self.usable,
            "reason": self.reason,
            "reference_id": self.reference_id,
            "neutral": None if self.neutral is None else self.neutral.public(),
            "assessment": None if self.assessment is None else self.assessment.public(),
            "note": self.note,
            "provider_calls": 0,
            "tested_against_real_products": False,
        }


def assess_calibrated_photo(image: object, points: object | None, card_mask: object, *,
                            confirmed: bool) -> CalibratedPhoto:
    """W6 on one photo using a visitor-confirmed, checked neutral card."""
    if points is None:
        return CalibratedPhoto(False, "no_mesh", None, None, _NOTES["no_mesh"])
    neutral = inspect_neutral_card(image, card_mask, confirmed=confirmed)
    if not neutral.usable:
        return CalibratedPhoto(False, "card_rejected", neutral, None, _NOTES["card_rejected"])
    try:
        found = assess_skin_photo(image, points, **neutral_photo_options(neutral))
    except (TypeError, ValueError):
        return CalibratedPhoto(False, "invalid_mesh", neutral, None, _NOTES["invalid_mesh"])
    reason = None if found.accepted else "reading_refused"
    return CalibratedPhoto(found.accepted, reason, neutral, found, _NOTES[reason])

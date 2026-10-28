"""Photo-free BELJOUR shade-safety receipt combining a W6 reading with its two reviews.

Combines the W6 result, its illumination sensitivity audit and its nearby-reference
inspection into one record a person can read before swatching. The receipt always
states manual-only intent, zero provider calls, no real product match and an UNPROVEN
real-face gate (SKN-03 last reported at 93.9% against 95%). Its status is:

* ``refused``: the reading or either review refused (any refusal wins);
* ``review``: lighting changes the picture (``sensitive``) or nearby references exist
  (``ambiguous``), so compare by hand;
* ``consistent``: both reviews agree with the W6 selection.

The reviews must describe the same selection as the W6 result, or ValueError. No
pixels, photo digests or landmarks are stored. Mirrored in
web/src/engines/shade/shade-safety.ts. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from .finder import ShadeResult
from .illumination_sensitivity import SensitivityDecision
from .reference_ambiguity import AmbiguityDecision

SafetyStatus = Literal["consistent", "review", "refused"]
LABEL = "BELJOUR shade check. A digital estimate from your photo, not tested against real products."

__all__ = ["LABEL", "ShadeSafetyReport", "assess_shade_safety"]


@dataclass(frozen=True, slots=True)
class ShadeSafetyReport:
    status: SafetyStatus
    selected_id: str | None
    reasons: tuple[str, ...]
    sensitivity: SensitivityDecision
    ambiguity: AmbiguityDecision

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-shade-safety/1", "label": LABEL, "status": self.status,
                "selected": self.selected_id, "reasons": list(self.reasons),
                "sensitivity": self.sensitivity.public(), "ambiguity": self.ambiguity.public(),
                "intent": "manual_only", "provider_calls": 0, "real_product_match": False,
                "real_face_gate": "UNPROVEN", "release_pass": False}


def assess_shade_safety(result: ShadeResult, sensitivity: SensitivityDecision,
                        ambiguity: AmbiguityDecision) -> ShadeSafetyReport:
    """One receipt for one W6 reading; refusals are kept, never smoothed over."""
    if not isinstance(result, ShadeResult) or not isinstance(sensitivity, SensitivityDecision) \
            or not isinstance(ambiguity, AmbiguityDecision):
        raise ValueError("Expected a W6 result, a sensitivity decision and an ambiguity decision")
    selected = result.best.get("id") if isinstance(result.best, dict) and not result.refused else None
    for review in (sensitivity, ambiguity):
        if review.status != "refused" and review.selected_id != selected:
            raise ValueError("The reviews describe a different shade selection")
    reasons: list[str] = []
    if selected is None:
        reasons.append("reading_refused")
    if sensitivity.status == "refused":
        reasons.append(f"lighting:{sensitivity.code}")
    if ambiguity.status == "refused":
        reasons.append(f"references:{ambiguity.code}")
    if reasons:
        return ShadeSafetyReport("refused", None, tuple(reasons), sensitivity, ambiguity)
    if sensitivity.status == "sensitive":
        reasons.append("lighting_sensitive")
    if ambiguity.status == "ambiguous":
        reasons.append("nearby_references")
    return ShadeSafetyReport("review" if reasons else "consistent", selected, tuple(reasons), sensitivity, ambiguity)

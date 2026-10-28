"""Audit-friendly W6 output for consumers of the committed real-face rubric.

Only per-image scalar evidence is reported. Missing meshes, cards, labels, and
provider catalogues cannot become invented successes. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .finder import thresholds
from .measurement import measure_shade_with_audit


@dataclass(frozen=True)
class ShadeGateEvidence:
    measurable: bool
    accepted: bool
    reason: str | None
    white_mode: str
    background_reason: str
    confidence: float
    nearest_delta_e: float | None
    skin_lightness: float | None
    reference_lightness: float | None
    never_lighter: bool
    cheek_distance: float | None
    measured_zones: int
    simulated_reference: bool = True

    def public(self) -> dict[str, Any]:
        """Explicit types and reason strings, with no sensitive source values."""
        return {
            "measurable": self.measurable,
            "accepted": self.accepted,
            "reason": self.reason,
            "white_mode": self.white_mode,
            "background_reason": self.background_reason,
            "confidence": round(self.confidence, 6),
            "nearest_delta_e": (
                None if self.nearest_delta_e is None else round(self.nearest_delta_e, 6)
            ),
            "skin_lightness": (
                None if self.skin_lightness is None else round(self.skin_lightness, 6)
            ),
            "reference_lightness": (
                None if self.reference_lightness is None
                else round(self.reference_lightness, 6)
            ),
            "never_lighter": self.never_lighter,
            "cheek_distance": (
                None if self.cheek_distance is None else round(self.cheek_distance, 6)
            ),
            "measured_zones": self.measured_zones,
            "reference_type": "fictional_in_house_swatch",
            "physical_product_tested": False,
        }


def assess_shade(
    image: object,
    points: object,
    *,
    neutral_mask: object | None = None,
    background_mask: object | None = None,
) -> ShadeGateEvidence:
    """Use the public shade measurement; never reimplement thresholds in a gate.

    A bad geometry source returns a coded non-success. No substitute mesh or
    inferred lighting label is inserted into a missing-data measurement.
    """
    try:
        reading, audit, background = measure_shade_with_audit(
            image,
            points,
            neutral_mask=neutral_mask,
            background_mask=background_mask,
        )
    except (TypeError, ValueError):
        return ShadeGateEvidence(
            False, False, "no_mesh", "none", "unavailable", 0.0,
            None, None, None, True, None, 0,
        )
    best = reading.best
    lightness = reading.measured_lab[0] if reading.measured_lab is not None else None
    other_lightness = float(best["lab"][0]) if best is not None else None
    no_lightening = (
        other_lightness is None or lightness is None
        or other_lightness <= lightness + thresholds()["never_lighter_allowance"]
    )
    return ShadeGateEvidence(
        measurable=reading.measured_lab is not None,
        accepted=not reading.refused and audit.usable and no_lightening,
        reason=reading.reason or audit.reason,
        white_mode=reading.white.mode,
        background_reason=background.reason,
        confidence=reading.confidence.get("overall", 0.0),
        nearest_delta_e=None if best is None else float(best["delta_e"]),
        skin_lightness=lightness,
        reference_lightness=other_lightness,
        never_lighter=no_lightening,
        cheek_distance=audit.cheek_distance,
        measured_zones=sum(zone.get("lab") is not None for zone in reading.zones.values()),
    )

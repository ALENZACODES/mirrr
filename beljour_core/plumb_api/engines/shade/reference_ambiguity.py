"""Nearby in-house references for a W6 reading, for a manual side-by-side comparison.

Uses only the existing W6 tolerances: alternatives must pass the 1.0 L* no-lightening
allowance and lie within ``match_delta_e_ok`` (thresholds.json, 2.5 CIEDE2000) of the
reading, the distance W6 already treats as a full-confidence match. Rules:

* a refused W6 reading stays refused: no alternatives are offered for it;
* the W6 selection must be the nearest allowed reference of the inspected table,
  otherwise ``incompatible_baseline`` (the result came from another table or reading);
* alternatives never raise confidence: the decision carries the W6 overall
  confidence unchanged, and ``ambiguous`` only adds shades to compare by hand.

Digital comparisons of original swatches, not product recommendations. Mirrored in
web/src/engines/shade/reference-ambiguity.ts. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from .distance import ShadeMatch, rank_shades
from .finder import ShadeResult, thresholds
from .loaders import ShadeKind

AmbiguityStatus = Literal["clear", "ambiguous", "refused"]

__all__ = ["AmbiguityDecision", "inspect_reference_ambiguity", "nearby_limit"]


def nearby_limit() -> float:
    return float(thresholds()["confidence"]["match_delta_e_ok"])


@dataclass(frozen=True, slots=True)
class AmbiguityDecision:
    status: AmbiguityStatus
    code: str | None
    selected_id: str | None
    selected_delta_e: float | None
    alternatives: tuple[ShadeMatch, ...]
    confidence: float

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-reference-ambiguity/1", "status": self.status, "code": self.code,
                "selected": self.selected_id,
                "selected_delta_e": None if self.selected_delta_e is None else round(self.selected_delta_e, 4),
                "alternatives": [{"id": m.record.id, "name": m.record.name, "delta_e": round(m.delta_e, 4),
                                  "lighter_by": round(m.lighter_by, 4)} for m in self.alternatives],
                "limit_delta_e": nearby_limit(), "confidence": round(self.confidence, 4),
                "note": "Compare these in-house swatches by hand; not product recommendations."}


def inspect_reference_ambiguity(result: ShadeResult, kind: ShadeKind = "reference") -> AmbiguityDecision:
    """Alternatives within the existing match tolerance, or a refusal; never a new winner."""
    if not isinstance(result, ShadeResult):
        raise ValueError("Expected a W6 shade result")
    confidence = float(result.confidence.get("overall", 0.0))
    best = result.best if isinstance(result.best, dict) else None
    selected = best.get("id") if best is not None else None
    if result.refused or result.measured_lab is None or best is None:
        return AmbiguityDecision("refused", "reading_refused", None, None, (), confidence)
    ranked = rank_shades(result.measured_lab, kind)
    if not ranked or ranked[0].record.id != selected:
        return AmbiguityDecision("refused", "incompatible_baseline", selected if isinstance(selected, str) else None,
                                 None, (), confidence)
    limit = nearby_limit()
    alternatives = tuple(m for m in ranked[1:] if m.delta_e <= limit)
    return AmbiguityDecision("ambiguous" if alternatives else "clear", None, ranked[0].record.id,
                             ranked[0].delta_e, alternatives, confidence)

"""Explainable cosmetic candidate ordering; no invented clinical or dermatology claims.

The selector uses W6's undertone classification and depth bands and optional recorded
Skin AI cosmetic concern scores. A cosmetic score never purports to diagnose health.
Products with an unmatched depth are excluded rather than silently recommending an
incorrect complexion shade. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from ..engines.shade import finder
from ..services.skin_match import SkinProfile
from .catalogue import Product, products, source

MAX_MATCHES = 16
ALLOWED_CONCERNS = frozenset(source()["concerns"])


@dataclass(frozen=True)
class Profile:
    depth: int
    undertone: str
    confidence: str
    lightness: float | None = None
    evidence: str = "W6 local shade class estimate"

    def to_json(self) -> dict[str, Any]:
        return {"depth": self.depth, "undertone": self.undertone,
                "confidence": self.confidence, "lightness": self.lightness, "evidence": self.evidence,
                "note": "Lighting affects shade estimates. Check a real sample before buying."}


def from_skin_profile(measurement: SkinProfile) -> Profile:
    """Reuse the W6 class definition, not an independent threshold implementation.

    Central photo sampling is a lower-confidence fallback without the W6 478 landmarks;
    this label must remain visible and never claim a verified match.
    """
    lab = (measurement.lightness, measurement.a, measurement.b)
    tone = finder.undertone_of(lab)["undertone"]
    return Profile(depth=finder.depth_band(measurement.lightness), undertone=tone,
                   confidence="estimate", lightness=round(measurement.lightness, 2),
                   evidence="W6 colour-class rules on central photo; no landmark zones")


def verify_profile(profile: Profile) -> None:
    if type(profile.depth) is not int or not 1 <= profile.depth <= 10:
        raise ValueError("depth must be an integer 1..10")
    if profile.undertone not in source()["tones"]:
        raise ValueError("unknown undertone")
    if profile.confidence not in ("estimate", "manual", "measured"):
        raise ValueError("unknown confidence")
    if profile.lightness is not None and not (math.isfinite(profile.lightness) and 0 <= profile.lightness <= 100):
        raise ValueError("invalid L*")


def concerns_from_skin(scores: Sequence[Mapping[str, Any]]) -> dict[str, int]:
    """Accepted cosmetic concerns only; 0..100 (lower means more room to focus).

    Unknown keys, malformed scores and duplicates never become candidate labels.
    """
    result: dict[str, int] = {}
    for item in scores[:32]:
        concern, score = item.get("concern"), item.get("raw_score")
        if concern not in ALLOWED_CONCERNS or isinstance(score, bool):
            continue
        if isinstance(score, (float, int)) and math.isfinite(score) and 0 <= score <= 100:
            result[str(concern)] = max(0, min(100, round(float(score))))
    return result


def score_one(product: Product, profile: Profile, scores: Mapping[str, int], finish: str) -> dict[str, Any] | None:
    why: list[str] = []
    score = 0
    if product.depth is not None:
        # Hard shade gate: only the requested depth and W6 undertone are a shade match.
        if product.depth != profile.depth or product.undertone != profile.undertone:
            return None
        score += 110
        why.append(f"W6 local depth {profile.depth} and {profile.undertone} undertone")
    else:
        score += 10
        why.append("Universal sample colour (not a foundation shade)")
    if product.finish == finish:
        score += 22
        why.append(f"Your {finish} finish choice")
    relevant = sorted(((v, k) for k, v in scores.items() if k in product.concerns), key=lambda row: (row[0], row[1]))
    if relevant:
        # A lower cosmetic rating is a better *sorting signal*, not a medical need.
        low, concern = relevant[0]
        score += min(40, max(0, (100 - low) // 2))
        why.append(f"Cosmetic {concern.replace('_', ' ')} focus ({low}/100, optional)")
    if product.category == "complexion":
        score += 17
    if product.vto:
        score += 8
        why.append("A visual try-on is available")
    return {"product": product.to_json(), "score": score, "why": why,
            "label": "Fictional sample; cosmetic sorting, not product testing"}


def rank(profile: Profile, scores: Mapping[str, int] | None = None,
         *, finish: str = "natural", limit: int = MAX_MATCHES,
         catalogue: Iterable[Product] | None = None) -> list[dict[str, Any]]:
    verify_profile(profile)
    if finish not in source()["finishes"]:
        raise ValueError("unknown finish preference")
    if type(limit) is not int or not 1 <= limit <= MAX_MATCHES:
        raise ValueError("limit must be between 1 and 16")
    cosmetic = scores or {}
    if len(cosmetic) > 32 or any(k not in ALLOWED_CONCERNS or type(v) is not int or not 0 <= v <= 100
                                 for k, v in cosmetic.items()):
        raise ValueError("invalid cosmetic scores")
    rated = (score_one(p, profile, cosmetic, finish) for p in (catalogue if catalogue is not None else products()))
    result = [item for item in rated if item is not None]
    result.sort(key=lambda r: (-r["score"], r["product"]["id"]))
    # Quality of selection: keep a cross-category assortment among the top results.
    # Stable deterministic round-robin across categories, sorted on the same score.
    groups: dict[str, list[dict[str, Any]]] = {}
    for item in result:
        groups.setdefault(item["product"]["category"], []).append(item)
    out: list[dict[str, Any]] = []
    while len(out) < limit and any(groups.values()):
        for category in ("complexion", "cheek", "lip", "prep", "finish"):
            if groups.get(category) and len(out) < limit:
                out.append(groups[category].pop(0))
    return out


def alternatives(sku: str, profile: Profile, *, max_items: int = 8) -> list[dict[str, Any]]:
    """Adjacent shades on the same invented formula; no unsupported product names."""
    from .catalogue import require_product
    original = require_product(sku)
    if original.depth is None:
        return []
    items = [p for p in products() if p.formula_id == original.formula_id and p.sku != sku
             and abs((p.depth or 0) - profile.depth) <= 1]
    items.sort(key=lambda p: (abs((p.depth or 0) - profile.depth),
                              p.undertone != profile.undertone, p.sku))
    return [p.to_json() for p in items[:max_items]]

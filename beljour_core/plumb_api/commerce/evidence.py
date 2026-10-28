"""R19 commerce evidence contract: bounded cosmetic observations, no clinical claims.

Provider observations are untrusted even after transport validation.  A recorded
Skin AI score may affect *ordering* of fictional products; it can never establish
a diagnosis, consumer identity, or colour correctness.  This module is pure and
works without a provider, network, face model, database, or personal information.

The caller owns photos and raw provider payloads.  Neither is accepted here.  The
returned dictionaries deliberately contain aggregate colour classes and evidence
categories only, not pixels, photo hashes, session identifiers, or timestamps.
"""
from __future__ import annotations

import hashlib
import json
import math
from collections import Counter
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal

Concern = Literal["redness", "texture", "oiliness", "moisture", "spots", "wrinkles",
                  "dark_circle", "pore", "radiance"]
Origin = Literal["youcam", "manual", "local"]
Grade = Literal["manual", "estimate", "measured"]

COSMETIC_CONCERNS: frozenset[str] = frozenset({"redness", "texture", "oiliness", "moisture",
    "spots", "wrinkles", "dark_circle", "pore", "radiance"})
ALIASES: dict[str, str] = {
    "wrinkle": "wrinkles", "age_spot": "spots", "dark_circle_v2": "dark_circle",
    "large_pore": "pore", "pores": "pore", "glow": "radiance", "dullness": "radiance",
    "roughness": "texture", "sebum": "oiliness", "dryness": "moisture",
}
SHADES = frozenset({"cool", "neutral", "warm", "olive"})
FINISHES = frozenset({"natural", "dewy", "satin", "matte"})


@dataclass(frozen=True, slots=True)
class CosmeticSignal:
    """A category score, not a diagnosis or human-labelled accuracy claim."""

    name: str
    score: int
    source: Origin
    aliases_seen: int = 0

    def __post_init__(self) -> None:
        if self.name not in COSMETIC_CONCERNS:
            raise ValueError("unknown cosmetic category")
        if type(self.score) is not int or not 0 <= self.score <= 100:
            raise ValueError("cosmetic scores must be integral 0..100")
        if self.source not in ("youcam", "manual", "local"):
            raise ValueError("unsupported observation origin")
        if type(self.aliases_seen) is not int or self.aliases_seen < 0:
            raise ValueError("invalid duplicate count")

    def to_score(self) -> dict[str, int | str]:
        return {"concern": self.name, "raw_score": self.score}


@dataclass(frozen=True, slots=True)
class SignalRejections:
    missing: int = 0
    unknown: int = 0
    malformed: int = 0
    duplicate: int = 0
    overflow: int = 0

    @property
    def total(self) -> int:
        return self.missing + self.unknown + self.malformed + self.duplicate + self.overflow

    def public(self) -> dict[str, int]:
        return {"missing": self.missing, "unknown": self.unknown, "malformed": self.malformed,
                "duplicate": self.duplicate, "overflow": self.overflow}


@dataclass(frozen=True, slots=True)
class SignalBatch:
    observations: tuple[CosmeticSignal, ...]
    rejected: SignalRejections
    source: Origin

    def scores(self) -> dict[str, int]:
        return {signal.name: signal.score for signal in self.observations}

    def observations_for_rank(self) -> list[dict[str, int | str]]:
        return [item.to_score() for item in self.observations]

    def public(self) -> dict[str, Any]:
        return {"source": self.source, "scores": self.scores(), "rejected": self.rejected.public(),
                "notice": "Nonclinical cosmetic-sorting observations, not diagnostics."}


def _finite_score(value: object) -> int | None:
    # Reject booleans and nonnumeric provider fields before converting.  A very
    # large Python integer is numeric but cannot be represented as a float.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    try:
        number = float(value)
    except (OverflowError, ValueError):
        return None
    if not math.isfinite(number) or not 0 <= number <= 100:
        return None
    return round(number)


def parse_signals(values: object, *, source: Origin = "youcam", limit: int = 32) -> SignalBatch:
    """Normalize aliases, bound input count, and resolve duplicates deterministically.

    The minimum numeric score is kept for repeated observations of a category:
    smaller scores are defined by the current ranking contract as a stronger
    *cosmetic ordering* signal.  Callers must not silently interpret the number
    as a risk rating.  Rows after the cap cannot shadow a validated earlier row.
    """
    if source not in ("youcam", "manual", "local"):
        raise ValueError("invalid source")
    if type(limit) is not int or not 1 <= limit <= 32:
        raise ValueError("invalid observation cap")
    if not isinstance(values, (list, tuple)):
        return SignalBatch((), SignalRejections(malformed=1), source)
    rows = values[:limit]
    outcome: dict[str, int] = {}
    aliases: Counter[str] = Counter()
    missing = unknown = malformed = duplicate = 0
    for item in rows:
        if not isinstance(item, Mapping):
            malformed += 1
            continue
        name = item.get("concern")
        if not isinstance(name, str) or not name:
            missing += 1
            continue
        canonical = ALIASES.get(name, name)
        if canonical not in COSMETIC_CONCERNS:
            unknown += 1
            continue
        value = _finite_score(item.get("raw_score"))
        if value is None:
            malformed += 1
            continue
        if canonical in outcome:
            duplicate += 1
            aliases[canonical] += 1
            outcome[canonical] = min(outcome[canonical], value)
        else:
            outcome[canonical] = value
    observations = tuple(CosmeticSignal(name, score, source, aliases[name])
                         for name, score in sorted(outcome.items()))
    return SignalBatch(observations,
                       SignalRejections(missing, unknown, malformed, duplicate,
                                        max(0, len(values) - limit)), source)


@dataclass(frozen=True, slots=True)
class ShadeEvidence:
    depth: int
    undertone: str
    confidence: Grade
    source: Origin
    lightness: float | None
    observation_count: int
    check_at_counter: bool
    uncertainty: str

    @classmethod
    def from_profile(cls, profile: Mapping[str, Any], source: Origin,
                     observations: Sequence[CosmeticSignal]) -> ShadeEvidence:
        depth, tone, confidence = profile.get("depth"), profile.get("undertone"), profile.get("confidence")
        if type(depth) is not int or not 1 <= depth <= 10:
            raise ValueError("depth must be 1..10")
        if tone not in SHADES or confidence not in ("manual", "estimate", "measured"):
            raise ValueError("unrecognized shade provenance")
        if source not in ("youcam", "manual", "local"):
            raise ValueError("unrecognized service source")
        lstar = profile.get("lightness")
        if lstar is not None and (type(lstar) not in (float, int) or
                                  not math.isfinite(lstar) or not 0 <= lstar <= 100):
            raise ValueError("invalid optional L* estimate")
        # The skin API measures cosmetic concerns; this is not evidence of a
        # foundation shade or a calibrated physical product colour.
        caveat = "User-entered colour class; not a scan" if confidence == "manual" else (
            "Illumination-sensitive colour class; verify a physical sample")
        return cls(depth, tone, confidence, source, None if lstar is None else float(lstar),
                   len(observations), True, caveat)

    def public(self) -> dict[str, Any]:
        return {"depth": self.depth, "undertone": self.undertone,
                "confidence": self.confidence, "origin": self.source,
                "observation_count": self.observation_count,
                "physical_sample_required": self.check_at_counter,
                "uncertainty": self.uncertainty,
                "note": "Skin AI concern scores do not validate the colour of a physical product."}


@dataclass(frozen=True, slots=True)
class MatchExplanation:
    sku: str
    family: str
    rank: int
    score: int
    reason_codes: tuple[str, ...]
    tradeoffs: tuple[str, ...]
    confidence: str

    def public(self) -> dict[str, Any]:
        return {"sku": self.sku, "formula": self.family, "rank": self.rank,
                "score": self.score, "reason_codes": list(self.reason_codes),
                "tradeoffs": list(self.tradeoffs), "confidence": self.confidence}


def explain_ranking(items: object, shade: ShadeEvidence, signals: SignalBatch) -> tuple[MatchExplanation, ...]:
    """Audit the displayed product selection without trusting provider-written copy.

    `items` is the already rank-verified internal candidate list.  Only safe
    synthetic product IDs, categories and source-specific reason codes leave
    this function; no raw provider explanations may enter the UI.
    """
    if not isinstance(items, (list, tuple)) or len(items) > 16:
        raise ValueError("bounded internal recommendations required")
    result: list[MatchExplanation] = []
    seen: set[str] = set()
    for index, entry in enumerate(items, 1):
        if not isinstance(entry, Mapping):
            raise ValueError("invalid internal item")
        product = entry.get("product")
        if not isinstance(product, Mapping):
            raise ValueError("missing product")
        sku, family, category = product.get("id"), product.get("formula_id"), product.get("category")
        score = entry.get("score")
        if (not isinstance(sku, str) or not sku.isascii() or len(sku) > 80 or
                not isinstance(family, str) or len(family) > 80 or
                category not in ("complexion", "lip", "cheek", "prep", "finish") or
                type(score) is not int or not 0 <= score <= 300 or sku in seen):
            raise ValueError("unreviewed product recommendation")
        seen.add(sku)
        reasons = ["fictional_product"]
        tradeoffs = ["colour_not_validated", "physical_test_required"]
        if category == "complexion":
            if product.get("depth") != shade.depth or product.get("undertone") != shade.undertone:
                raise ValueError("unmatched complexion depth or undertone")
            reasons.append("user_or_local_shade_class")
            if shade.confidence == "estimate":
                tradeoffs.append("illumination_sensitive")
        else:
            reasons.append("non_foundation_item")
        if product.get("vto") in ("foundation", "lip", "blush"):
            reasons.append("simulated_vto_available")
        if product.get("finish") in FINISHES:
            reasons.append("sample_finish")
        if signals.observations and product.get("concerns"):
            if set(product["concerns"]) & set(signals.scores()):
                reasons.append("optional_cosmetic_sorting")
        result.append(MatchExplanation(sku, family, index, score, tuple(reasons),
                                       tuple(tradeoffs), shade.confidence))
    return tuple(result)


def stable_evidence_id(shade: ShadeEvidence, signals: SignalBatch, items: Sequence[MatchExplanation]) -> str:
    """Stable digest for fictional choice metadata, never a portrait fingerprint.

    It purposely omits image-derived lightness, date, device, IP, session ID,
    photo reference, and raw provider data.  Do not use this digest for tracking.
    """
    payload = {"depth": shade.depth, "tone": shade.undertone, "confidence": shade.confidence,
               "signals": signals.scores(), "items": [row.sku for row in items]}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


@dataclass(frozen=True, slots=True)
class CommerceEvidence:
    origin: Origin
    shade: ShadeEvidence
    signals: SignalBatch
    ranking: tuple[MatchExplanation, ...]
    locally_rendered: bool
    provider_calls: int
    units_spent: int
    cached: bool
    evidence_id: str

    def public(self) -> dict[str, Any]:
        return {"source": self.origin, "shade": self.shade.public(),
                "concerns": self.signals.public(),
                "ranking": [row.public() for row in self.ranking],
                "provider_calls": self.provider_calls, "units_spent": self.units_spent,
                "cached": self.cached, "local_fallback": self.locally_rendered,
                "evidence_id": self.evidence_id,
                "simulation": True, "clinical_claims": False,
                "product_tested": False,
                "disclaimer": "Sample products and VTO previews are simulations, not purchase advice."}


def build_evidence(source: Origin, profile: Mapping[str, Any],
                   raw_scores: object, items: object, *, units: int = 0,
                   cached: bool = False, local_fallback: bool = False) -> CommerceEvidence:
    if source not in ("youcam", "manual", "local"):
        raise ValueError("unknown provenance")
    if type(units) is not int or not 0 <= units <= 1000 or type(cached) is not bool:
        raise ValueError("invalid provider usage counters")
    if source != "youcam" and (units or cached):
        raise ValueError("nonprovider output cannot report paid provider units")
    if cached and units:
        raise ValueError("cached provider output must spend zero units")
    signals = parse_signals(raw_scores, source=source)
    if source != "youcam" and signals.observations:
        raise ValueError("local estimate cannot claim Skin AI observations")
    shade = ShadeEvidence.from_profile(profile, source, signals.observations)
    ranking = explain_ranking(items, shade, signals)
    return CommerceEvidence(source, shade, signals, ranking, local_fallback or source != "youcam",
                            int(source == "youcam" and units > 0), units, cached,
                            stable_evidence_id(shade, signals, ranking))


def validate_evidence(envelope: Mapping[str, Any]) -> bool:
    """Shallow public invariant checker for audit/export pipelines."""
    if envelope.get("simulation") is not True or envelope.get("product_tested") is not False:
        return False
    if envelope.get("clinical_claims") is not False:
        return False
    if envelope.get("source") not in ("youcam", "manual", "local"):
        return False
    digest = envelope.get("evidence_id")
    if not isinstance(digest, str) or len(digest) != 64:
        return False
    return all(c in "0123456789abcdef" for c in digest)

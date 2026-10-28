"""Explainable, budget-aware *fictional sample* shortlist and 3-step comparison.

It consumes the already validated deterministic recommendation ranking; it
NEVER calls the vendor, processes a photo, infers human traits, or changes the
one removable YouCam adapter. All metadata are reloaded from the owned catalogue
instead of accepted from an external provider response. Ranking describes a
cosmetic sample-selection demonstration, not verified product suitability.

TypeScript parity: web/src/commerce/shortlist.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal

from .catalogue import Product, by_id, source

Category = Literal["all", "complexion", "cheek", "lip", "prep", "finish"]
Goal = Literal["balanced", "lower-cost", "visual-try-on", "shade-first"]
CATEGORIES = ("complexion", "cheek", "lip", "prep", "finish")
GOALS: frozenset[str] = frozenset({"balanced", "lower-cost", "visual-try-on", "shade-first"})


@dataclass(frozen=True, slots=True)
class ShortlistOptions:
    """Bounded *fictional* catalogue choices. Budget includes no taxes or freight."""

    budget_cents: int = 6000
    category: Category = "all"
    goal: Goal = "balanced"
    max_items: int = 8
    visual_only: bool = False
    coverage: Literal["any", "none", "sheer", "medium"] = "any"
    preferred_concern: str | None = None

    def validate(self) -> None:
        if type(self.budget_cents) is not int or not 0 <= self.budget_cents <= 100_000:
            raise ValueError("Sample budget must be an integer 0..100000 cents")
        if self.category not in ("all", *CATEGORIES):
            raise ValueError("Unknown catalogue category")
        if self.goal not in GOALS:
            raise ValueError("Unknown shortlist goal")
        if type(self.max_items) is not int or not 1 <= self.max_items <= 16:
            raise ValueError("Choose 1..16 fictional items")
        if type(self.visual_only) is not bool:
            raise ValueError("Visual-only must be an explicit boolean")
        if self.coverage not in ("any", "none", "sheer", "medium"):
            raise ValueError("Unknown coverage preference")
        if self.preferred_concern is not None and self.preferred_concern not in source()["concerns"]:
            raise ValueError("Unknown cosmetic sorting category")


@dataclass(frozen=True, slots=True)
class Explanation:
    product: Product
    base_score: int
    price_bonus: int
    visualization_bonus: int
    concern_bonus: int
    total_score: int
    reason_codes: tuple[str, ...]
    sample_price_cents: int

    def public(self) -> dict[str, Any]:
        return {"product": self.product.to_json(), "base_score": self.base_score,
                "price_bonus": self.price_bonus, "visualization_bonus": self.visualization_bonus,
                "concern_bonus": self.concern_bonus, "score": self.total_score,
                "reason_codes": list(self.reason_codes), "sample_price_cents": self.sample_price_cents,
                "currency": "CAD", "sample": True,
                "notice": "Fictional sample comparison, not a verified real product recommendation."}


@dataclass(frozen=True, slots=True)
class SampleLook:
    """Three distinct cosmetic positions; no real order or provider request."""

    items: tuple[Explanation, Explanation, Explanation]
    subtotal_cents: int
    total_score: int
    currency: str = "CAD"

    def public(self) -> dict[str, Any]:
        return {"products": [entry.product.sku for entry in self.items],
                "subtotal_cents": self.subtotal_cents, "total_score": self.total_score,
                "currency": self.currency, "checkout_enabled": False,
                "tax_and_shipping_included": False, "simulated": True,
                "notice": "Not a purchase quote; these items and prices are fictional."}


@dataclass(frozen=True, slots=True)
class Shortlist:
    items: tuple[Explanation, ...]
    affordable_three_piece: SampleLook | None
    budget_cents: int
    options: ShortlistOptions
    rejected_budget: int
    rejected_scope: int
    invalid_rows: int
    source: Literal["owned-catalogue"] = "owned-catalogue"

    def public(self) -> dict[str, Any]:
        return {"version": "beljour-shopping-shortlist-r19c/1", "source": self.source,
                "budget_cents": self.budget_cents,
                "items": [entry.public() for entry in self.items],
                "three_piece": self.affordable_three_piece.public() if self.affordable_three_piece else None,
                "excluded_budget": self.rejected_budget, "excluded_preferences": self.rejected_scope,
                "discarded_untrusted_rows": self.invalid_rows,
                "provider_calls": 0, "simulated": True, "checkout_enabled": False,
                "notice": "Illustrative Canadian-dollar samples only; no inventory, taxes, shipping or verified shade match."}


def _canonical_row(entry: object) -> tuple[Product, int] | None:
    """Reject substituted product names or scores instead of echoing them."""
    if not isinstance(entry, Mapping):
        return None
    product = entry.get("product")
    if not isinstance(product, Mapping):
        return None
    sku = product.get("id")
    if not isinstance(sku, str) or sku not in by_id():
        return None
    original = by_id()[sku]
    # Only the original catalogue's product names and price can reach a user.
    if (product.get("name") != original.name or product.get("price_cents") != original.price_cents or
            product.get("category") != original.category or product.get("swatch") != original.swatch or
            product.get("depth") != original.depth or product.get("undertone") != original.undertone):
        return None
    base = entry.get("score")
    if type(base) is not int or not 0 <= base <= 1000:
        return None
    return original, base


def _explain(product: Product, base: int, options: ShortlistOptions) -> Explanation:
    """Small, bounded reranking adjustments on *existing* validated scores."""
    value = options.budget_cents - product.price_cents
    affordability = min(30, max(0, value // 300)) if options.goal == "lower-cost" else 0
    visualization = 17 if product.vto and options.goal == "visual-try-on" else 0
    concern = 14 if (options.preferred_concern is not None and
                     options.preferred_concern in product.concerns) else 0
    shade = 10 if options.goal == "shade-first" and product.category == "complexion" else 0
    reasons = ["owned_sample_product", "within_user_sample_budget", "base_rank_verified"]
    if affordability:
        reasons.append("sample_cost_preference")
    if visualization:
        reasons.append("optional_vto_available")
    if concern:
        reasons.append("cosmetic_sorting_focus")
    if shade:
        reasons.append("depth_undertone_hard_gate_in_base_rank")
    return Explanation(product, base, affordability, visualization, concern, base + affordability +
                       visualization + concern + shade, tuple(reasons), product.price_cents)


def _three_piece(candidates: Sequence[Explanation], budget: int) -> SampleLook | None:
    """Optimize across three compatible sample VTO categories, not same-type SKUs.

    There is no physical inventory; combinations are a proposal for an optional
    *visual simulation only*. Complexity is bounded by the twelve authored formula
    families, not by hundreds of generated shade-band variants.
    """
    groups: list[list[Explanation]] = []
    for category in ("complexion", "cheek", "lip"):
        groups.append([entry for entry in candidates if entry.product.category == category and entry.product.vto])
    if any(not group for group in groups):
        return None
    choice: SampleLook | None = None
    for face in groups[0]:
        for cheek in groups[1]:
            for lip in groups[2]:
                total = face.sample_price_cents + cheek.sample_price_cents + lip.sample_price_cents
                if total > budget:
                    continue
                score = face.total_score + cheek.total_score + lip.total_score
                candidate = SampleLook((face, cheek, lip), total, score)
                key = (-score, total, *(e.product.sku for e in candidate.items))
                if choice is None:
                    choice = candidate
                else:
                    old = (-choice.total_score, choice.subtotal_cents,
                           *(e.product.sku for e in choice.items))
                    if key < old:
                        choice = candidate
    return choice


def shortlist(ranked: Sequence[object], options: ShortlistOptions | None = None) -> Shortlist:
    """Transform already-ranked Skin AI/manual results to auditable shopping options.

    The caller independently obtains Skin AI from the one provider adapter or
    uses manual, local-only shade choices. No uploaded media is accepted here.
    """
    if options is None:
        options = ShortlistOptions()
    options.validate()
    if len(ranked) > 32:
        raise ValueError("Excessive ranked candidates; upstream ranking is capped")
    all_entries: list[Explanation] = []
    seen: set[str] = set()
    budget_rejected = scope_rejected = invalid = 0
    for raw in ranked:
        parsed = _canonical_row(raw)
        if parsed is None:
            invalid += 1
            continue
        product, base = parsed
        if product.sku in seen:
            invalid += 1
            continue
        seen.add(product.sku)
        if product.price_cents > options.budget_cents:
            budget_rejected += 1
            continue
        if (options.category != "all" and product.category != options.category or
                options.visual_only and product.vto is None or
                options.coverage != "any" and product.coverage != options.coverage):
            scope_rejected += 1
            continue
        all_entries.append(_explain(product, base, options))
    # Stable ties by *canonical* sample SKU. No inferred demographic value.
    all_entries.sort(key=lambda item: (-item.total_score, item.sample_price_cents, item.product.sku))
    picked: list[Explanation] = []
    if options.category == "all":
        groups = {cat: [x for x in all_entries if x.product.category == cat] for cat in CATEGORIES}
        while len(picked) < options.max_items and any(groups.values()):
            for cat in CATEGORIES:
                if len(picked) >= options.max_items:
                    break
                if groups[cat]:
                    picked.append(groups[cat].pop(0))
    else:
        picked = all_entries[:options.max_items]
    three_piece = _three_piece(all_entries, options.budget_cents)
    return Shortlist(tuple(picked), three_piece, options.budget_cents, options,
                     budget_rejected, scope_rejected, invalid)

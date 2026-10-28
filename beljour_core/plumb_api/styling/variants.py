"""Build a finite, cost-transparent Hair Studio variant board without provider calls.

A board is a *request plan*, not a result set: one rendered YouCam image cannot be
copied into several tiles and called different haircuts. All unrendered cells are
clearly pending, unavailable, or inspiration. The code never creates billed jobs.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

from .catalogue import HairStyle

GRID_SIZES = (4, 9)
MODIFIERS = ("bangs", "curl", "extension", "volume")
DEFAULT_STRENGTH = 30


@dataclass(frozen=True)
class Variant:
    slot: int
    style_id: str
    title: str
    template_id: str | None
    state: str
    intensity: int
    modifiers: tuple[str, ...]
    reason: str
    estimated_units: int | None

    def as_dict(self) -> dict[str, Any]:
        return {"slot": self.slot, "style_id": self.style_id, "title": self.title,
                "template_id": self.template_id, "state": self.state,
                "intensity": self.intensity, "modifiers": list(self.modifiers),
                "reason": self.reason, "estimated_units": self.estimated_units}


def strength(value: Any, *, field: str = "intensity") -> int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field} must be a number from 0 to 100")
    if not 0 <= value <= 100:
        raise ValueError(f"{field} must be between 0 and 100")
    if value != value or value in (float("inf"), float("-inf")):
        raise ValueError(f"{field} must be finite")
    return int(round(value))


def parse_modifiers(raw: dict[str, Any] | None) -> tuple[tuple[str, int], ...]:
    """Only positive adjuncts become extra provider operations; zero is a no-op."""
    raw = raw or {}
    if not isinstance(raw, dict):
        raise ValueError("Hair modifiers must be a map")
    if set(raw) - set(MODIFIERS):
        raise ValueError("Unknown hair modifier")
    return tuple((key, strength(raw[key], field=key)) for key in MODIFIERS if key in raw and strength(raw[key], field=key) > 0)


def build(styles: Iterable[HairStyle], *, size: int = 4, intensity: int = DEFAULT_STRENGTH,
          modifiers: dict[str, int] | None = None, permit_live: bool = False,
          unit_price: int = 2) -> tuple[Variant, ...]:
    """Rank and label cells; live readiness requires genuine independently verified IDs."""
    if size not in GRID_SIZES:
        raise ValueError("Use a 2x2 or 3x3 board")
    value = strength(intensity)
    mod = parse_modifiers(modifiers)
    if not isinstance(unit_price, int) or not 1 <= unit_price <= 100:
        raise ValueError("Unverified unit price")
    seq = list(styles)[:size]
    slots: list[Variant] = []
    for number in range(size):
        if number >= len(seq):
            slots.append(Variant(number, "", "Empty slot", None, "empty", value, (),
                                 "Choose more styles to fill the board.", None))
            continue
        item = seq[number]
        if item.is_idea:
            state, reason = "inspiration", "Style reference only. No provider template or image is verified."
        elif permit_live and item.verified_for_live:
            state, reason = "ready", "Price is an estimate until a live quote; apply each tile explicitly."
        else:
            state, reason = "synthetic-demo", "The S1 list is synthetic; no live haircut result is available."
        # A variant grid does not spend units, and showing a unit price on a synthetic
        # idea could falsely imply a runnable provider template.
        quote = unit_price + len(mod) if state == "ready" else None
        slots.append(Variant(number, item.id, item.name, item.template_id, state, value,
                             tuple(name for name, _ in mod), reason, quote))
    return tuple(slots)


def board_summary(slots: Iterable[Variant]) -> dict[str, int]:
    rows = list(slots)
    return {"cells": len(rows), "ready": sum(s.state == "ready" for s in rows),
            "ideas": sum(s.state == "inspiration" for s in rows),
            "synthetic_demo": sum(s.state == "synthetic-demo" for s in rows),
            "not_rendered": sum(s.state != "ready" for s in rows)}


def selected_plan(variant: Variant, *, rights: bool = False,
                  reference_photo_id: str | None = None) -> dict[str, Any]:
    """Return a request *description*, never an endpoint call or permission to spend."""
    if reference_photo_id is not None:
        if not rights:
            raise ValueError("Confirm you have the right to use this reference haircut photo")
        if not isinstance(reference_photo_id, str) or len(reference_photo_id) > 64:
            raise ValueError("Invalid reference image ID")
        return {"action": "hair-transfer", "reference_photo_id": reference_photo_id,
                "reference_rights": True, "intensity": variant.intensity, "needs_quote": True}
    if variant.state != "ready" or not variant.template_id:
        raise ValueError("This haircut has no independently verified live template")
    return {"action": "hair-style", "options": {"template_id": variant.template_id},
            "intensity": variant.intensity, "needs_quote": True}

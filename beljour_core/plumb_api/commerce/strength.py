"""Validated 1.0--5.0, one-tenth cosmetic strength with per-kind memory.

The 0--100 scalar remains a legacy wire input while existing clients migrate.
New engine hooks accept only this strict scale. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal

ProductKind = Literal["complexion", "cheek", "lip", "hair", "shade"]
KINDS: tuple[ProductKind, ...] = ("complexion", "cheek", "lip", "hair", "shade")
DEFAULT_LEVEL = 3.0
DEFAULT_LOCK = 5.0
MIN_LEVEL = 1.0
MAX_LEVEL = 5.0
TICKS = 10


def level_ticks(value: object) -> int:
    """Reject bools, non-finite values and levels not representable in tenths."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Try-on strength must be a number from 1.0 to 5.0")
    number = float(value)
    if not math.isfinite(number) or not MIN_LEVEL <= number <= MAX_LEVEL:
        raise ValueError("Try-on strength must be from 1.0 to 5.0")
    ticks = round(number * TICKS)
    if not 10 <= ticks <= 50 or abs(number * TICKS - ticks) > 1e-7:
        raise ValueError("Try-on strength must use increments of 0.1")
    return ticks


def validate_level(value: object) -> float:
    return level_ticks(value) / TICKS


def from_legacy(value: object) -> float:
    """Convert integer 0..100 to the nearest 0.1 level, with predictable ties."""
    if type(value) is not int or not 0 <= value <= 100:
        raise ValueError("Legacy intensity must be an integer 0..100")
    return (10 + math.floor(value * 0.4 + 0.5)) / 10


def to_legacy(value: object) -> int:
    """Quantize 1..5 to provider-compatible 0..100 with half-up rounding."""
    ticks = level_ticks(value)
    return math.floor((ticks - 10) * 2.5 + 0.5)


def nudge(value: object, direction: int) -> float:
    if type(direction) is not int or direction not in (-1, 1):
        raise ValueError("Choose a +0.1 or -0.1 nudge")
    return max(10, min(50, level_ticks(value) + direction)) / 10


def legacy_presets() -> dict[str, float]:
    """Documented mapping: None=1.0, Subtle=2.0, Natural=3.0, Strong=4.0, Full=5.0."""
    return {
        "none": from_legacy(0),
        "subtle": from_legacy(25),
        "natural": from_legacy(50),
        "strong": from_legacy(75),
        "full": from_legacy(100),
    }


@dataclass
class LevelHistory:
    """Memory-only by product type; no photographs, identifiers or persistence."""

    values: dict[ProductKind, float] = field(default_factory=dict)

    def get(self, kind: ProductKind) -> float:
        if kind not in KINDS:
            raise ValueError("Unknown cosmetic product type")
        return self.values.get(kind, DEFAULT_LEVEL)

    def remember(self, kind: ProductKind, value: object) -> float:
        if kind not in KINDS:
            raise ValueError("Unknown cosmetic product type")
        level = validate_level(value)
        self.values[kind] = level
        return level

    def step(self, kind: ProductKind, direction: int) -> float:
        return self.remember(kind, nudge(self.get(kind), direction))

    def clear(self) -> None:
        self.values.clear()

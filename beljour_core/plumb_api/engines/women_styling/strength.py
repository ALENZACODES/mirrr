"""W1-W100 strength decisions shared by local women previews.

The user-facing scale is 1.0 to 5.0 in steps of exactly 0.1. Existing
0–100 recipes may be imported with ``from_legacy_strength``; their old
Subtle/Normal/Extra/Hyper names map to 2.0/3.0/4.0/5.0. Strength 1.0
is an unedited comparison, not permission to skip the identity guard.

No chosen level, photo, biometric geometry or identity score is persisted.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Final

MIN_LEVEL: Final[float] = 1.0
MAX_LEVEL: Final[float] = 5.0
DEFAULT_LEVEL: Final[float] = 3.0
PRESET_LEVELS: Final[dict[str, float]] = {
    "subtle": 2.0,
    "light": 2.0,
    "normal": 3.0,
    "medium": 3.0,
    "extra": 4.0,
    "strong": 4.0,
    "full": 4.0,
    "hyper": 5.0,
}


def checked_level(value: object) -> float:
    """Reject NaN, bools, endpoint overflow and every off-step float."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Strength must be a number on the 1.0–5.0 scale")
    number = float(value)
    if not isfinite(number) or not MIN_LEVEL <= number <= MAX_LEVEL:
        raise ValueError("Strength must be within 1.0–5.0")
    tick = round(number * 10)
    if abs(number * 10 - tick) > 1e-9:
        raise ValueError("Strength must use 0.1 increments")
    return tick / 10.0


def preset_level(name: str) -> float:
    if name not in PRESET_LEVELS:
        raise ValueError("Unknown reviewed strength preset")
    return PRESET_LEVELS[name]


def from_legacy_strength(value: object) -> float:
    """Map an older integer 0–100 recipe to the closest reviewed tenth."""
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 100:
        raise ValueError("Legacy strength must be an integer 0..100")
    return checked_level(round((1.0 + 4.0 * value / 100.0) * 10) / 10.0)


def opacity_for_level(value: object) -> float:
    """Return a bounded preview amount, with an unchanged level-one view."""
    return (checked_level(value) - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL)


@dataclass(frozen=True, slots=True)
class LevelSelection:
    effect_id: str
    level: float
    opacity: float
    simulation: str = "Local screen simulation; not a physical treatment prediction."


class StrengthMemory:
    """Per-editor memory only; dispose when the photo or session closes."""

    def __init__(self) -> None:
        self._levels: dict[str, float] = {}

    def select(self, effect_id: str, level: object | None = None) -> LevelSelection:
        if not effect_id or len(effect_id) > 64 or not effect_id.isascii():
            raise ValueError("Effect id must be a short ASCII identifier")
        chosen = self._levels.get(effect_id, DEFAULT_LEVEL) if level is None else checked_level(level)
        self._levels[effect_id] = chosen
        return LevelSelection(effect_id, chosen, opacity_for_level(chosen))

    def current(self, effect_id: str) -> float:
        return self._levels.get(effect_id, DEFAULT_LEVEL)

    def clear(self) -> None:
        self._levels.clear()

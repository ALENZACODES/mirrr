"""Posture strength contract: user levels 1.0..5.0, legacy stops preserved.

Legacy 0 is neutral. ASSUMED public anchors: 1.0=0, 2.0=.33,
3.5=.66, 5.0=1.0. The engine's original 6% and 8-degree caps still apply.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import replace

from .catalogue import SIMULATION_LABEL, require_compatible
from .fixes import CAP_SHARE, FIXES, STOPS, PosturePlan, plan
from .points import Controls

MIN_LEVEL = 1.0
MAX_LEVEL = 5.0
DEFAULT_LEVEL = 3.5
ANCHORS: tuple[tuple[float, float], ...] = (
    (1.0, 0.0),
    (2.0, STOPS["subtle"]),
    (3.5, STOPS["normal"]),
    (5.0, STOPS["full"]),
)
STOP_LEVELS: dict[str, float] = {"subtle": 2.0, "normal": 3.5, "full": 5.0}


def checked_level(level: float) -> float:
    """Accept genuine decimal tenths; refuse implicit clamping and bools."""
    if isinstance(level, bool) or not isinstance(level, (int, float)):
        raise ValueError("level must be a number from 1.0 to 5.0 in tenths")
    if not math.isfinite(level) or level < MIN_LEVEL or level > MAX_LEVEL:
        raise ValueError("level must be from 1.0 to 5.0")
    tick = round(level * 10)
    if abs(level * 10 - tick) > 1e-8:
        raise ValueError("level must use 0.1 steps")
    return tick / 10.0


def level_to_strength(level: float) -> float:
    value = checked_level(level)
    for (low, low_strength), (high, high_strength) in zip(ANCHORS, ANCHORS[1:], strict=True):
        if low <= value <= high:
            ratio = (value - low) / (high - low)
            return low_strength + (high_strength - low_strength) * ratio
    raise ValueError("level outside known anchors")


def strength_to_level(strength: float | str) -> float:
    """Map an existing legacy value to a nearby 0.1 level without weakening caps."""
    if isinstance(strength, str):
        if strength not in STOP_LEVELS:
            raise ValueError("unknown legacy stop")
        return STOP_LEVELS[strength]
    if isinstance(strength, bool) or not isinstance(strength, (int, float)):
        raise ValueError("legacy strength must be finite")
    if not math.isfinite(strength) or not 0 <= strength <= 1:
        raise ValueError("legacy strength must be 0..1")
    for (low, low_strength), (high, high_strength) in zip(ANCHORS, ANCHORS[1:], strict=True):
        if low_strength <= strength <= high_strength:
            ratio = (strength - low_strength) / (high_strength - low_strength)
            return checked_level(round((low + ratio * (high - low)) * 10) / 10)
    return MAX_LEVEL


def level_plan(controls: Controls, fix: str, level: float = DEFAULT_LEVEL) -> PosturePlan:
    """New public plan, keeping every legacy geometric and fold-safety constraint."""
    require_compatible(controls, fix)
    mapped = level_to_strength(level)
    result = plan(controls, fix, mapped, cap_share=CAP_SHARE)
    return replace(result, label=SIMULATION_LABEL)


def nudge(level: float, direction: int) -> float:
    current = checked_level(level)
    if direction not in (-1, 1):
        raise ValueError("direction must be -1 or 1")
    return checked_level(min(MAX_LEVEL, max(MIN_LEVEL, round(current * 10 + direction) / 10)))


class LevelMemory:
    """Small preferences-only store; never stores images or landmarks."""

    def __init__(self) -> None:
        self._levels: dict[str, float] = {}

    def get(self, fix: str) -> float:
        if fix not in FIXES:
            raise ValueError("unknown posture fix")
        return self._levels.get(fix, DEFAULT_LEVEL)

    def set(self, fix: str, level: float) -> float:
        if fix not in FIXES:
            raise ValueError("unknown posture fix")
        current = checked_level(level)
        self._levels[fix] = current
        return current

    def adjust(self, fix: str, direction: int) -> float:
        return self.set(fix, nudge(self.get(fix), direction))

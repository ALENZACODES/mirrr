"""Single source of truth for the Lane B decimal 1.0..5.0 strength bridge.

The v1 recipe schema and shell use internal percentages. The public filter
control uses tenths of a level, and a future Lane H control may replace this
adapter without changing any colour kernel. Level one is a gentle 20% edit;
level five is the maximum 100% edit. Internal 0% remains the byte-identical
identity state needed by the legacy acceptance suite, not a public level.
Author: John Khan.
"""
from __future__ import annotations

import math

MIN_LEVEL = 1.0
MAX_LEVEL = 5.0
STEP = 0.1
LEVELS = 41
PERCENT_PER_LEVEL = 20.0
DEFAULT_LEVEL = 1.5


def checked_level(value: float) -> float:
    """Reject out-of-range, fractional-step and non-finite user input."""
    if isinstance(value, bool) or not isinstance(value, int | float) or not math.isfinite(value):
        raise ValueError("filter level must be a finite decimal 1.0-5.0")
    ten = value * 10
    if value < MIN_LEVEL or value > MAX_LEVEL or not math.isclose(ten, round(ten), rel_tol=0.0, abs_tol=1e-8):
        raise ValueError("filter level must be 1.0-5.0 in 0.1 steps")
    return round(ten) / 10.0


def to_percent(level: float) -> float:
    """Convert a validated user level to an internal rendering percentage."""
    return checked_level(level) * PERCENT_PER_LEVEL


def from_percent(percent: float) -> float:
    """Display the nearest supported public level for an old internal slider."""
    if isinstance(percent, bool) or not isinstance(percent, int | float):
        raise ValueError("internal filter strength must be 0..100")
    if not math.isfinite(percent) or percent < 0 or percent > 100:
        raise ValueError("internal filter strength must be 0..100")
    steps = round(max(MIN_LEVEL, percent / PERCENT_PER_LEVEL) * 10)
    return checked_level(steps / 10.0)


def level_values() -> tuple[float, ...]:
    """Stable values for a keyboard-accessible slider or an accessible select."""
    return tuple(round(MIN_LEVEL + index * STEP, 1) for index in range(LEVELS))

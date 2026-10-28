"""R24E shared 1.0-5.0 editor strength scale; local and photo-free.

Curve knots, geometric crop, gradient geometry and JPEG quality keep their
native units. Only effect *amounts* use this scale. 1.0 is the legacy neutral
amount, 3.0 is 50 percent, and 5.0 is the legacy 100 percent amount.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal, cast

Effect = Literal["mask_amount", "upscale_detail", "sharpen", "clarity", "reel_amount", "identity_lock"]
EFFECTS: tuple[Effect, ...] = (
    "mask_amount",
    "upscale_detail",
    "sharpen",
    "clarity",
    "reel_amount",
    "identity_lock",
)
MIN_LEVEL = 1.0
MAX_LEVEL = 5.0
DEFAULT_LEVEL = 3.0
DEFAULT_LOCK_LEVEL = 5.0


def validate_level(value: float) -> float:
    """Reject bool, NaN, infinity, off-step values and out-of-range values."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError("effect strength must be a finite number")
    scaled = float(value) * 10
    if value < MIN_LEVEL or value > MAX_LEVEL or abs(scaled - round(scaled)) > 1e-8:
        raise ValueError("effect strength must use 1.0-5.0 in 0.1 steps")
    return round(scaled) / 10


def legacy_amount(level: float) -> float:
    """Validated normalized 0..1 weight for existing 0-100 amount controls."""
    return (validate_level(level) - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL)


def from_legacy_amount(amount: float) -> float:
    """Map a legacy percentage onto the nearest legal tenth, half-up."""
    if isinstance(amount, bool) or not isinstance(amount, (int, float)) or not math.isfinite(amount):
        raise ValueError("legacy amount must be a finite percentage")
    if not 0 <= amount <= 100:
        raise ValueError("legacy amount must be between 0 and 100")
    return validate_level(math.floor(10 + float(amount) * 0.4 + 0.5) / 10)


def effect_name(value: str) -> Effect:
    if value not in EFFECTS:
        raise ValueError("unknown editable effect")
    return cast(Effect, value)


def nudge(level: float, direction: int) -> float:
    if type(direction) is not int or direction not in (-1, 1):
        raise ValueError("nudge must be -1 or +1")
    next_tenth = max(10, min(50, round(validate_level(level) * 10) + direction))
    return next_tenth / 10


@dataclass(frozen=True)
class StrengthSnapshot:
    mask_amount: float
    upscale_detail: float
    sharpen: float
    clarity: float
    reel_amount: float
    identity_lock: float


class StrengthLevels:
    """Last approved strength per effect, in this editing session only.

    No global storage, photo hashes or saved personal attributes are retained.
    The caller should discard this object when replacing the current photo.
    """

    def __init__(self) -> None:
        self._levels: dict[Effect, float] = {name: DEFAULT_LEVEL for name in EFFECTS}
        self._levels["identity_lock"] = DEFAULT_LOCK_LEVEL

    def get(self, effect: Effect) -> float:
        return self._levels[effect_name(effect)]

    def set(self, effect: Effect, level: float) -> float:
        checked = validate_level(level)
        self._levels[effect_name(effect)] = checked
        return checked

    def change(self, effect: Effect, direction: int) -> float:
        return self.set(effect, nudge(self.get(effect), direction))

    def snapshot(self) -> StrengthSnapshot:
        return StrengthSnapshot(
            mask_amount=self.get("mask_amount"),
            upscale_detail=self.get("upscale_detail"),
            sharpen=self.get("sharpen"),
            clarity=self.get("clarity"),
            reel_amount=self.get("reel_amount"),
            identity_lock=self.get("identity_lock"),
        )

    def clear(self) -> None:
        self._levels = {name: DEFAULT_LEVEL for name in EFFECTS}
        self._levels["identity_lock"] = DEFAULT_LOCK_LEVEL

"""Exact decimal editor strength levels shared by command and preview entry points.

Levels are stored in integer tenths, not IEEE floats. The old named stops are
read-only compatibility inputs for existing saved recipes, never new UI stops.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from .errors import CommandValidationError
from .types import Strength

_LEVEL = re.compile(r"^[1-5](?:\.[0-9])?$")


@dataclass(frozen=True, slots=True, order=True)
class DecimalLevel:
    tenths: int = 30

    def __post_init__(self) -> None:
        if type(self.tenths) is not int or not 10 <= self.tenths <= 50:
            raise CommandValidationError(
                "invalid_level",
                "Edit strength must be 1.0 to 5.0 in increments of 0.1.",
            )

    @classmethod
    def parse(cls, value: str | float | int | Decimal) -> DecimalLevel:
        if isinstance(value, bool):
            raise CommandValidationError("invalid_level", "Boolean values are not editor strengths.")
        if isinstance(value, str):
            if _LEVEL.fullmatch(value) is None:
                raise CommandValidationError(
                    "invalid_level", "Use a decimal level from 1.0 to 5.0 in 0.1 steps.",
                )
            candidate = value
        elif isinstance(value, (float, int, Decimal)):
            if isinstance(value, float) and not math.isfinite(value):
                raise CommandValidationError("invalid_level", "Editor level must be finite.")
            candidate = str(value)
        else:
            raise CommandValidationError("invalid_level", "Editor strength has an invalid type.")
        try:
            number = Decimal(candidate)
        except InvalidOperation:
            raise CommandValidationError("invalid_level", "Editor strength is not a number.") from None
        scaled = number * 10
        if not scaled.is_finite() or scaled != scaled.to_integral_value():
            raise CommandValidationError("invalid_level", "Editor level must be a multiple of 0.1.")
        return cls(int(scaled))

    @classmethod
    def from_legacy(cls, value: Strength) -> DecimalLevel:
        if not isinstance(value, Strength):
            raise CommandValidationError("invalid_level", "Legacy strength is invalid.")
        lookup = {
            Strength.SUBTLE: 20,
            Strength.NORMAL: 30,
            Strength.STRONG: 50,
        }
        return cls(lookup[value])

    @property
    def value(self) -> float:
        return self.tenths / 10.0

    @property
    def label(self) -> str:
        return f"{self.value:.1f}"

    @property
    def fractional_strength(self) -> float:
        """Smallest level maps to 20% dose; 5.0 maps to full effect."""
        return self.tenths / 50.0

    @property
    def legacy_percent(self) -> int:
        """Compatibility mapping for older 0..100 engines, exactly reversible at 0.2 levels."""
        return (self.tenths - 10) * 100 // 40

    def adjust(self, steps: int) -> DecimalLevel:
        if type(steps) is not int:
            raise CommandValidationError("invalid_level", "Level step count must be an integer.")
        return DecimalLevel(self.tenths + steps)

    def clamp_adjust(self, steps: int) -> DecimalLevel:
        if type(steps) is not int:
            raise CommandValidationError("invalid_level", "Level step count must be an integer.")
        return DecimalLevel(min(50, max(10, self.tenths + steps)))

    def as_dict(self) -> dict[str, str]:
        return {"level": self.label}


def level_ticks() -> tuple[str, ...]:
    return tuple(DecimalLevel(tenths).label for tenths in range(10, 51))


def validate_slider(minimum: object, maximum: object, step: object) -> bool:
    """Report-only form audit; false never changes a visible control."""
    try:
        low = DecimalLevel.parse(str(minimum))
        high = DecimalLevel.parse(str(maximum))
        increment = Decimal(str(step))
    except (CommandValidationError, InvalidOperation, ValueError):
        return False
    return low.tenths == 10 and high.tenths == 50 and increment == Decimal("0.1")

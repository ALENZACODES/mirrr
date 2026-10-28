"""Perceptual matching without automatic lightening or unverified brand names.

This is an optional consultation aid, not a predicted physical dye outcome.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass

from ..core.colour import ciede2000
from .catalogue import Family, HairShade, Lab, Undertone, catalogue


@dataclass(frozen=True, slots=True)
class ShadeSuggestion:
    shade: HairShade
    delta_e00: float
    measured_level: int
    no_lightening: bool

    def public(self) -> dict[str, object]:
        return {"shade": self.shade.public(), "delta_e00": round(self.delta_e00, 4),
                "measured_level": self.measured_level, "no_auto_lightening": self.no_lightening,
                "note": "In-house colour estimate. Not a physical product match."}


def checked_lab(values: Sequence[float]) -> Lab:
    if len(values) != 3 or any(isinstance(v, bool) or not isinstance(v, (int, float)) for v in values):
        raise ValueError("Lab needs three numeric coordinates")
    if not all(math.isfinite(v) for v in values):
        raise ValueError("Lab values must be finite")
    light, a, b = float(values[0]), float(values[1]), float(values[2])
    if not 0 <= light <= 100 or abs(a) > 128 or abs(b) > 128:
        raise ValueError("Lab outside supported range")
    return light, a, b


def measured_level(lab: Sequence[float]) -> int:
    sample = checked_lab(lab)
    natural = (shade for shade in catalogue() if shade.family == "natural" and shade.undertone == "neutral")
    return min(natural, key=lambda shade: (ciede2000(sample, shade.lab), shade.id)).level


def suggest(lab: Sequence[float], *, undertone: Undertone | None = None,
            family: Family | None = None, allow_lightening: bool = False,
            count: int = 3) -> tuple[ShadeSuggestion, ...]:
    measured = checked_lab(lab)
    depth = measured_level(measured)
    if undertone is not None and undertone not in ("warm", "neutral", "cool"):
        raise ValueError("Unknown undertone")
    if family is not None and family not in {row.family for row in catalogue()}:
        raise ValueError("Unknown colour family")
    if type(count) is not int or not 1 <= count <= 20:
        raise ValueError("Count must be between 1 and 20")
    candidates = [row for row in catalogue() if (undertone is None or row.undertone == undertone)
                  and (family is None or row.family == family) and (allow_lightening or row.level <= depth)]
    ranked = sorted(candidates, key=lambda row: (ciede2000(measured, row.lab), row.id))
    return tuple(ShadeSuggestion(row, ciede2000(measured, row.lab), depth, not allow_lightening)
                 for row in ranked[:count])

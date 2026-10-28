"""Checked CIEDE2000 distances and no-lightening shade ranking over the shared catalogues.

delta_e() is the canonical CIEDE2000 of engines/core/colour.py (Sharma, Wu and Dalal
2005, kL = kC = kH = 1) behind a strict Lab check: a wrong length, a non-number, a
nonfinite value, L* outside 0..100 or |a*|, |b*| above 128 raises ValueError instead
of being clipped or coerced.

rank_shades() keeps the existing never-lighter rules unchanged:

* skin swatches: at most ``never_lighter_allowance`` L* lighter than the reading
  (thresholds.json, 1.0 L*), the same rule as finder.match_shades();
* hair swatches: no level above the reading's measured hair level
  (hair_palette.measured_level), the same rule as hair_palette.suggest().

``allow_lighter=True`` lifts the rule and must be an explicit user choice. Ties are
broken by id so results are deterministic. Matches are in-house colour estimates,
not physical product matches. Mirrored in web/src/engines/shade/distance.ts.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Any

from ..core.colour import ciede2000
from ..hair_palette.matching import measured_level
from .finder import thresholds
from .loaders import Lab, LabLike, ShadeKind, ShadeRecord, checked_lab, load_shades

MATCH_NOTE = "In-house colour estimate. Not a physical product match."

__all__ = [
    "MATCH_NOTE", "ShadeMatch", "delta_e", "delta_e_pairs", "distance_to_shade",
    "nearest_shade", "rank_shades",
]


def delta_e(first: LabLike, second: LabLike) -> float:
    """CIEDE2000 between two checked Lab (D65) triples.

    Takes sequences of int/float (float64 NumPy arrays pass too); other NumPy dtypes are
    refused by the check, so convert them with ``.tolist()`` first.
    """
    return ciede2000(checked_lab(first), checked_lab(second))


def delta_e_pairs(pairs: Iterable[tuple[LabLike, LabLike]]) -> tuple[float, ...]:
    """delta_e() for each (first, second) pair, in order; any bad pair refuses the whole call."""
    out = []
    for pair in pairs:
        items = tuple(pair)
        if len(items) != 2:
            raise ValueError("Each pair needs exactly two Lab triples")
        out.append(delta_e(items[0], items[1]))
    return tuple(out)


def distance_to_shade(lab: LabLike, shade: ShadeRecord) -> float:
    """CIEDE2000 from a reading to one catalogue swatch."""
    if not isinstance(shade, ShadeRecord):
        raise ValueError("Expected a catalogue shade record")
    return delta_e(lab, shade.lab)


@dataclass(frozen=True, slots=True)
class ShadeMatch:
    """A ranked swatch. ``lighter_by`` is swatch L* minus reading L* (positive is lighter).

    ``measured_level`` is the reading's hair level for hair swatches and None for skin.
    """

    record: ShadeRecord
    delta_e: float
    lighter_by: float
    measured_level: int | None

    def public(self) -> dict[str, Any]:
        return {"shade": self.record.public(), "delta_e": round(self.delta_e, 4),
                "lighter_by": round(self.lighter_by, 4), "measured_level": self.measured_level,
                "note": MATCH_NOTE}


def _records(shades: ShadeKind | Sequence[ShadeRecord]) -> tuple[ShadeRecord, ...]:
    if isinstance(shades, str):
        return load_shades(shades)
    rows = tuple(shades)
    if not rows or not all(isinstance(row, ShadeRecord) for row in rows):
        raise ValueError("Expected a catalogue kind or a non-empty sequence of shade records")
    if len({row.id for row in rows}) != len(rows):
        raise ValueError("Shade records must have unique ids")
    return rows


def rank_shades(lab: LabLike, shades: ShadeKind | Sequence[ShadeRecord] = "reference", *,
                allow_lighter: bool = False, limit: int | None = None) -> tuple[ShadeMatch, ...]:
    """Swatches nearest first by CIEDE2000, never lighter than the rules above unless allowed.

    ``shades`` is a catalogue kind or an explicit sequence of records (which may mix skin and
    hair). An empty result means nothing is deep enough; callers should refuse, not lighten.
    """
    if type(allow_lighter) is not bool:
        raise ValueError("allow_lighter must be a boolean")
    if limit is not None and (type(limit) is not int or limit < 1):
        raise ValueError("limit must be a positive integer")
    reading: Lab = checked_lab(lab)
    rows = _records(shades)
    allowance = float(thresholds()["never_lighter_allowance"])
    hair_level = measured_level(reading) if any(row.surface == "hair" for row in rows) else None
    out = []
    for row in rows:
        lighter_by = row.lab[0] - reading[0]
        level = hair_level if row.surface == "hair" else None
        too_light = row.level > level if level is not None else lighter_by > allowance
        if too_light and not allow_lighter:
            continue
        out.append(ShadeMatch(row, ciede2000(reading, row.lab), lighter_by, level))
    out.sort(key=lambda match: (match.delta_e, match.record.id))
    return tuple(out if limit is None else out[:limit])


def nearest_shade(lab: LabLike, shades: ShadeKind | Sequence[ShadeRecord] = "reference", *,
                  allow_lighter: bool = False) -> ShadeMatch | None:
    """The first rank_shades() match, or None when no swatch passes the never-lighter rule."""
    ranked = rank_shades(lab, shades, allow_lighter=allow_lighter, limit=1)
    return ranked[0] if ranked else None

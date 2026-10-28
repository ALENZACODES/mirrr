"""Editorial Shade Book data audit over the 90 original hair swatches.

Checks, all against the authored catalogue.json and nothing else:

* every id and every name is unique;
* Lab is reconstructed from the authored sRGB (engines/core/colour.py) and LCh from
  Lab; the largest coordinate error of each is reported;
* folio numbers are 1..N in source order (the book numbers shades in JSON order; it
  never assigns a manufacturer code);
* the smallest CIEDE2000 separation between any two swatches, with that pair.

The audit reports; it does not repair. Original digital swatches, not dye products.
Mirrored in web/src/engines/hair_palette/book-audit.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from ..core.colour import ciede2000, rgb_to_lab
from .catalogue import HairShade, catalogue

# The catalogue loader's own tolerance for Lab/RGB and Lab/LCh agreement.
RECONSTRUCTION_LIMIT = 0.006
# The catalogue loader's own "too close to tell apart" rule.
SEPARATION_LIMIT = 1.0

__all__ = ["BookAudit", "audit_book", "folio_numbers"]


def folio_numbers(shades: Sequence[HairShade] | None = None) -> tuple[tuple[int, str], ...]:
    """(folio, id) in source order, numbered from 1."""
    rows = catalogue() if shades is None else tuple(shades)
    return tuple((index + 1, shade.id) for index, shade in enumerate(rows))


@dataclass(frozen=True, slots=True)
class BookAudit:
    count: int
    duplicate_ids: tuple[str, ...]
    duplicate_names: tuple[str, ...]
    max_lab_error: float
    max_lch_error: float
    folios_contiguous: bool
    min_separation: float
    closest_pair: tuple[str, str]

    @property
    def ok(self) -> bool:
        return (not self.duplicate_ids and not self.duplicate_names and self.folios_contiguous
                and self.max_lab_error <= RECONSTRUCTION_LIMIT and self.max_lch_error <= RECONSTRUCTION_LIMIT
                and self.min_separation >= SEPARATION_LIMIT)

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-shade-book-audit/1", "count": self.count, "ok": self.ok,
                "duplicate_ids": list(self.duplicate_ids), "duplicate_names": list(self.duplicate_names),
                "max_lab_error": round(self.max_lab_error, 6), "max_lch_error": round(self.max_lch_error, 6),
                "folios_contiguous": self.folios_contiguous, "min_separation": round(self.min_separation, 4),
                "closest_pair": list(self.closest_pair),
                "note": "Original in-house digital swatches; not physical dye products."}


def _duplicates(values: Sequence[str]) -> tuple[str, ...]:
    seen: set[str] = set()
    repeated: set[str] = set()
    for value in values:
        (repeated if value in seen else seen).add(value)
    return tuple(sorted(repeated))


def _lch_error(shade: HairShade) -> float:
    light, a, b = shade.lab
    hue = math.degrees(math.atan2(b, a)) % 360
    gap = abs(hue - shade.lch[2])
    return max(abs(light - shade.lch[0]), abs(math.hypot(a, b) - shade.lch[1]), min(gap, 360 - gap))


def audit_book(shades: Sequence[HairShade] | None = None,
               folios: Sequence[tuple[int, str]] | None = None) -> BookAudit:
    """Audit the catalogue (or a supplied list) and a book's (folio, id) numbering.

    ``folios`` defaults to folio_numbers(); a supplied numbering must be exactly 1..N
    against the swatches in source order.
    """
    rows = catalogue() if shades is None else tuple(shades)
    if len(rows) < 2 or not all(isinstance(r, HairShade) for r in rows):
        raise ValueError("The shade book audit needs at least two hair swatches")
    lab_error = max(max(abs(x - y) for x, y in zip(rgb_to_lab(r.rgb), r.lab, strict=True)) for r in rows)
    folios = folio_numbers(rows) if folios is None else tuple((n, i) for n, i in folios)
    best: tuple[float, str, str] = (math.inf, "", "")
    for i, first in enumerate(rows):
        for second in rows[i + 1:]:
            low, high = sorted((first.id, second.id))
            best = min(best, (ciede2000(first.lab, second.lab), low, high))
    return BookAudit(
        len(rows), _duplicates([r.id for r in rows]), _duplicates([r.name for r in rows]), lab_error,
        max(_lch_error(r) for r in rows),
        [n for n, _ in folios] == list(range(1, len(rows) + 1)) and [i for _, i in folios] == [r.id for r in rows],
        best[0], (best[1], best[2]),
    )

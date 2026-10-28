"""Read-only shade catalogues shared by the shade, concealer and readiness modules.

Three catalogues, all original in-house data with no brand names:

* ``"base"``: the 80 historical W6 skin references (reference_shades.json).
* ``"reference"``: the 80 base references plus the 16 very deep anchors
  (deep_reference_shades.json), 96 in all. This is the table the cheek-first
  W6 reader matches against.
* ``"hair"``: the 90 hair-colour swatches of engines/hair_palette/catalogue.json.

The JSON files stay the single source: skin rows are read and checked through
finder.reference_table() and finder.extended_reference_table(), hair rows
through hair_palette.catalogue(). Every value is an ASSUMED engineering
estimate, not tested against real products. Records are frozen and catalogues
are cached, so callers share one immutable copy. Mirrored in
web/src/engines/shade/loaders.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Literal, get_args

import numpy as np
from numpy.typing import NDArray

from ..hair_palette.catalogue import Lab, catalogue
from ..hair_palette.matching import checked_lab as _palette_checked_lab
from .finder import extended_reference_table, reference_table

ShadeKind = Literal["reference", "base", "hair"]
LabLike = Sequence[float] | NDArray[np.float64]
ShadeSurface = Literal["skin", "hair"]
KINDS: tuple[ShadeKind, ...] = get_args(ShadeKind)
NOTE = "ASSUMED in-house estimate. Not tested against real products."
SOURCES: dict[ShadeKind, str] = {
    "base": "engines/shade/reference_shades.json",
    "reference": "engines/shade/reference_shades.json+engines/shade/deep_reference_shades.json",
    "hair": "engines/hair_palette/catalogue.json",
}

__all__ = [
    "KINDS", "Lab", "LabLike", "NOTE", "ShadeCatalogue", "ShadeKind", "ShadeRecord", "ShadeSurface",
    "checked_lab", "load_base_shades", "load_hair_shades", "load_reference_shades",
    "load_shade_catalogue", "load_shades", "shade_by_id",
]


def checked_lab(values: LabLike) -> Lab:
    """The hair palette's Lab check (three finite numbers, L* 0..100, |a*|, |b*| <= 128).

    Anything without a length (None, a bare number) is refused with ValueError as well.
    """
    try:
        return _palette_checked_lab(values)  # type: ignore[arg-type]
    except TypeError as exc:
        raise ValueError("Lab needs three numeric coordinates") from exc


@dataclass(frozen=True, slots=True)
class ShadeRecord:
    """One swatch. ``level`` is the 1-10 depth band for skin and the 1-10 hair level for hair.

    ``step`` (skin reference step) is None for hair; ``family`` (hair colour family) is None
    for skin. Undertones are cool/neutral/warm/olive for skin and cool/neutral/warm for hair.
    """

    id: str
    name: str
    surface: ShadeSurface
    lab: Lab
    undertone: str
    level: int
    step: int | None = None
    family: str | None = None

    def public(self) -> dict[str, Any]:
        return {"id": self.id, "name": self.name, "surface": self.surface, "lab": list(self.lab),
                "undertone": self.undertone, "level": self.level, "step": self.step,
                "family": self.family, "assumed": True}


@dataclass(frozen=True, slots=True)
class ShadeCatalogue:
    """An ordered, read-only catalogue in source-file order."""

    kind: ShadeKind
    records: tuple[ShadeRecord, ...]
    source: str
    note: str = NOTE

    @property
    def count(self) -> int:
        return len(self.records)

    def by_id(self, shade_id: str) -> ShadeRecord:
        for record in self.records:
            if record.id == shade_id:
                return record
        raise ValueError(f"Unknown {self.kind} shade id")

    def public(self) -> dict[str, Any]:
        return {"kind": self.kind, "count": self.count, "source": self.source, "note": self.note,
                "assumed": True, "tested_against_real_products": False,
                "records": [record.public() for record in self.records]}


def _skin(row: dict[str, Any]) -> ShadeRecord:
    level, step = row.get("depth"), row.get("step")
    if type(level) is not int or not 1 <= level <= 10 or type(step) is not int or step < 1:
        raise ValueError(f"shade {row['id']}: depth must be 1..10 and step a positive integer")
    if row.get("undertone") not in ("cool", "neutral", "warm", "olive"):
        raise ValueError(f"shade {row['id']}: unknown undertone")
    return ShadeRecord(str(row["id"]), str(row["name"]), "skin", checked_lab(row["lab"]),
                       str(row["undertone"]), level, step=step)


@lru_cache(maxsize=1)
def _skin_records() -> tuple[ShadeRecord, ...]:
    # extended_reference_table() is the base table followed by the deep anchors, already checked.
    return tuple(_skin(row) for row in extended_reference_table())


def _build(kind: ShadeKind) -> tuple[ShadeRecord, ...]:
    if kind == "hair":
        return tuple(ShadeRecord(row.id, row.name, "hair", row.lab, row.undertone, row.level, family=row.family)
                     for row in catalogue())
    skin = _skin_records()
    return skin[:len(reference_table())] if kind == "base" else skin


@lru_cache(maxsize=len(KINDS))
def _catalogue(kind: ShadeKind) -> ShadeCatalogue:
    return ShadeCatalogue(kind, _build(kind), SOURCES[kind])


def load_shade_catalogue(kind: ShadeKind = "reference") -> ShadeCatalogue:
    """The named catalogue; raises ValueError for an unknown kind."""
    if not isinstance(kind, str) or kind not in KINDS:
        raise ValueError("Unknown shade catalogue kind")
    return _catalogue(kind)


def load_shades(kind: ShadeKind = "reference") -> tuple[ShadeRecord, ...]:
    return load_shade_catalogue(kind).records


def load_reference_shades() -> tuple[ShadeRecord, ...]:
    """The 96 skin references the W6 reader matches against."""
    return load_shades("reference")


def load_base_shades() -> tuple[ShadeRecord, ...]:
    """The 80 historical skin references (parity/shade-w6.json was built on these)."""
    return load_shades("base")


def load_hair_shades() -> tuple[ShadeRecord, ...]:
    """The 90 in-house hair-colour swatches."""
    return load_shades("hair")


def shade_by_id(shade_id: str, kind: ShadeKind | None = None) -> ShadeRecord:
    """Look a swatch up by id in one catalogue, or in skin references then hair when kind is None."""
    if not isinstance(shade_id, str) or not shade_id:
        raise ValueError("Shade id must be a non-empty string")
    kinds: tuple[ShadeKind, ...] = ("reference", "hair") if kind is None else (kind,)
    for name in kinds:
        for record in load_shades(name):
            if record.id == shade_id:
                return record
    raise ValueError("Unknown shade id")

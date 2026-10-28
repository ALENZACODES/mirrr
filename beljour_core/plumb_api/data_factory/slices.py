"""Slice balancing by declared attributes only.

A slice spec names declared attributes (age band, skin-tone group, lighting,
pose bucket) and a quota per cell. Selection inside a cell is deterministic:
by quality score, then by a seeded hash of the content hash. Records missing a
declared value are counted as undeclared and never assigned a guessed value.
The shortfall report lists every cell that could not meet its quota.
Author: John Khan.
"""

from __future__ import annotations

import itertools
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

from .hashing import seeded_key
from .records import DECLARED_ATTRIBUTES, ImageRecord

UNDECLARED = "undeclared"
PREFER_QUALITY = "quality"
PREFER_SEEDED = "seeded"


class SliceSpecError(ValueError):
    """The slice spec is inconsistent."""


def cell_name(dimensions: Sequence[str], values: Sequence[str]) -> str:
    """Readable cell key such as age_band=20-29|lighting=studio."""
    return "|".join(f"{dim}={value}" for dim, value in zip(dimensions, values, strict=True))


def parse_cell(dimensions: Sequence[str], name: str) -> tuple[str, ...]:
    """Inverse of cell_name; checks the dimensions and their order."""
    parts = name.split("|")
    if len(parts) != len(dimensions):
        raise SliceSpecError(f"cell {name!r} does not name {len(dimensions)} dimensions")
    values: list[str] = []
    for dim, part in zip(dimensions, parts, strict=True):
        key, sep, value = part.partition("=")
        if not sep or key != dim:
            raise SliceSpecError(f"cell {name!r} must list dimensions in order {dimensions}")
        if value != UNDECLARED and value not in DECLARED_ATTRIBUTES[dim]:
            raise SliceSpecError(f"cell {name!r}: {value!r} is not a known {dim}")
        values.append(value)
    return tuple(values)


@dataclass(frozen=True)
class SliceSpec:
    """Quotas over declared attributes."""

    dimensions: tuple[str, ...]
    per_cell: int | None = None
    targets: Mapping[str, int] = field(default_factory=dict)
    include_undeclared: bool = False
    seed: str = "beljour-data"
    prefer: str = PREFER_QUALITY

    def __post_init__(self) -> None:
        if not self.dimensions:
            raise SliceSpecError("a slice spec needs at least one dimension")
        unknown = [dim for dim in self.dimensions if dim not in DECLARED_ATTRIBUTES]
        if unknown:
            raise SliceSpecError("unknown dimensions: " + ", ".join(unknown))
        if len(set(self.dimensions)) != len(self.dimensions):
            raise SliceSpecError("dimensions must not repeat")
        if (self.per_cell is None) == (not self.targets):
            raise SliceSpecError("give exactly one of per_cell or targets")
        if self.per_cell is not None and self.per_cell < 0:
            raise SliceSpecError("per_cell must be zero or more")
        for name, quota in self.targets.items():
            parse_cell(self.dimensions, name)
            if quota < 0:
                raise SliceSpecError(f"quota for {name} must be zero or more")
        if self.prefer not in {PREFER_QUALITY, PREFER_SEEDED}:
            raise SliceSpecError("prefer must be quality or seeded")

    def quotas(self) -> dict[tuple[str, ...], int]:
        """Quota per cell; per_cell expands to every declared combination."""
        if self.targets:
            return {parse_cell(self.dimensions, name): quota
                    for name, quota in sorted(self.targets.items())}
        assert self.per_cell is not None
        vocab = [DECLARED_ATTRIBUTES[dim] for dim in self.dimensions]
        cells = {values: self.per_cell for values in itertools.product(*vocab)}
        if self.include_undeclared:
            for values in itertools.product(*[v + (UNDECLARED,) for v in vocab]):
                if UNDECLARED in values:
                    cells[values] = self.per_cell
        return cells

    def cell_of(self, record: ImageRecord) -> tuple[str, ...]:
        """Declared values of the record; missing values read as undeclared."""
        return tuple(record.declared(dim) or UNDECLARED for dim in self.dimensions)

    def to_dict(self) -> dict[str, Any]:
        """Plain form for config hashing."""
        return {"dimensions": list(self.dimensions), "per_cell": self.per_cell,
                "targets": dict(sorted(self.targets.items())),
                "include_undeclared": self.include_undeclared, "seed": self.seed,
                "prefer": self.prefer}

    @classmethod
    def from_dict(cls, raw: Mapping[str, Any]) -> SliceSpec:
        """Build from JSON; unknown keys are an error."""
        allowed = {"dimensions", "per_cell", "targets", "include_undeclared", "seed", "prefer"}
        unknown = sorted(set(raw) - allowed)
        if unknown:
            raise SliceSpecError("unknown slice keys: " + ", ".join(unknown))
        dims = raw.get("dimensions")
        if not isinstance(dims, list) or not all(isinstance(d, str) for d in dims):
            raise SliceSpecError("dimensions must be a list of attribute names")
        per_cell = raw.get("per_cell")
        targets = raw.get("targets") or {}
        if not isinstance(targets, dict):
            raise SliceSpecError("targets must map cell names to quotas")
        return cls(
            dimensions=tuple(dims),
            per_cell=None if per_cell is None else int(per_cell),
            targets={str(k): int(v) for k, v in targets.items()},
            include_undeclared=bool(raw.get("include_undeclared", False)),
            seed=str(raw.get("seed", "beljour-data")),
            prefer=str(raw.get("prefer", PREFER_QUALITY)),
        )


@dataclass(frozen=True)
class CellReport:
    """Quota outcome for one cell."""

    cell: str
    target: int
    available: int
    selected: int

    @property
    def shortfall(self) -> int:
        """How many records the cell is short of its quota."""
        return max(0, self.target - self.selected)

    def to_dict(self) -> dict[str, Any]:
        """JSON form."""
        return {"cell": self.cell, "target": self.target, "available": self.available,
                "selected": self.selected, "shortfall": self.shortfall}


@dataclass(frozen=True)
class BalanceResult:
    """Selected records (sorted by content hash) and the per-cell report."""

    selected: list[ImageRecord]
    cells: list[CellReport]
    undeclared: int
    outside_targets: int

    @property
    def shortfall_total(self) -> int:
        """Sum of all cell shortfalls."""
        return sum(cell.shortfall for cell in self.cells)

    def shortfalls(self) -> list[CellReport]:
        """Only the cells that missed their quota."""
        return [cell for cell in self.cells if cell.shortfall > 0]

    def to_dict(self) -> dict[str, Any]:
        """JSON form for reports."""
        return {"selected": len(self.selected), "undeclared": self.undeclared,
                "outside_targets": self.outside_targets,
                "shortfall_total": self.shortfall_total,
                "cells": [cell.to_dict() for cell in self.cells]}


def balance(records: Iterable[ImageRecord], spec: SliceSpec,
            scores: Mapping[str, float] | None = None) -> BalanceResult:
    """Fill each cell's quota deterministically from its records.

    `scores` maps content hash to quality score; missing scores count as 0.
    The input order never changes the outcome.
    """
    quotas = spec.quotas()
    pools: dict[tuple[str, ...], list[ImageRecord]] = {}
    undeclared = 0
    outside = 0
    for record in records:
        cell = spec.cell_of(record)
        if UNDECLARED in cell:
            undeclared += 1
        if cell not in quotas:
            outside += 1
            continue
        pools.setdefault(cell, []).append(record)
    score_of = scores or {}
    selected: list[ImageRecord] = []
    reports: list[CellReport] = []
    for cell, quota in sorted(quotas.items()):
        pool = pools.get(cell, [])
        if spec.prefer == PREFER_QUALITY:
            pool.sort(key=lambda r: (-round(score_of.get(r.content_sha256, 0.0), 6),
                                     seeded_key(spec.seed, r.content_sha256)))
        else:
            pool.sort(key=lambda r: seeded_key(spec.seed, r.content_sha256))
        chosen = pool[:quota]
        selected.extend(chosen)
        reports.append(CellReport(cell_name(spec.dimensions, cell), quota, len(pool),
                                  len(chosen)))
    selected.sort(key=lambda r: r.content_sha256)
    return BalanceResult(selected, reports, undeclared, outside)


def slice_counts(records: Iterable[ImageRecord], dimension: str) -> dict[str, int]:
    """Count of records per declared value of one dimension (for data cards)."""
    if dimension not in DECLARED_ATTRIBUTES:
        raise SliceSpecError(f"unknown dimension: {dimension}")
    counts: dict[str, int] = {}
    for record in records:
        value = record.declared(dimension) or UNDECLARED
        counts[value] = counts.get(value, 0) + 1
    return dict(sorted(counts.items()))

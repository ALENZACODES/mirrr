"""Photo-free SKN-03 accounting and skin-reference inventory coverage.

SKN-03 (lab/bqa_core/data/checks.csv): repeat-capture stability, same session and
same light, same tone and undertone, at least 95% stable. A case is one person or
drawn cell captured two or more times; it is stable only when every repeat was
measured and all repeats agree on the W6 depth band and undertone.

Accounting rules:

* Refused and unmeasured repeats keep their case in the denominator, as unstable.
* The target is the exact integer ``ceil(95 * N / 100)``; a rate is never rounded up.
* Meeting the number is not evidence on its own: without independent labels, a
  compatible baseline and human review the status stays UNPROVEN. With all three it
  is BOX_REVIEW_REQUIRED, never a pass. ``release_pass`` is always false here.
* Group labels come only from the caller (for example an expert's band label).
  Nothing is inferred from colour; a missing label is reported as "unknown".

No Lab values, pixels or identifiers beyond the caller's opaque case key are kept.
Mirrored in web/src/engines/shade/readiness.ts. Author: John Khan.
"""
from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal

from .distance import delta_e
from .finder import UNDERTONES, ShadeResult
from .loaders import ShadeKind, load_shade_catalogue

SKN03_TARGET = 0.95
TARGET_NUMERATOR = 95
TARGET_DENOMINATOR = 100
MAX_CASES = 100_000
MAX_REPEATS = 50
UNKNOWN_GROUP = "unknown"
# Same "too close to tell apart" rule as hair_palette/catalogue.py (CIEDE2000 below 1.0).
DISTINGUISHABLE_DELTA_E = 1.0
SKNStatus = Literal["BELOW_TARGET", "UNPROVEN", "BOX_REVIEW_REQUIRED"]
Reading = tuple[int, str] | None
_CASE_ID = re.compile(r"[A-Za-z0-9_.:-]{1,64}")
_GROUP = re.compile(r"[A-Za-z0-9][A-Za-z0-9 _.+-]{0,31}")

__all__ = [
    "SKN03_TARGET", "ReferenceCoverage", "SKN03Report", "SKNStatus", "SkinCheckCase",
    "case_from_shade", "check_reference_coverage", "measure_skn03",
]


def _reading(value: object) -> Reading:
    if value is None:
        return None
    if not isinstance(value, (tuple, list)) or len(value) != 2:
        raise ValueError("A repeat is (depth band, undertone) or None")
    band, undertone = value
    if type(band) is not int or not 1 <= band <= 10 or undertone not in UNDERTONES:
        raise ValueError("A repeat needs a 1..10 depth band and a known undertone")
    return band, str(undertone)


@dataclass(frozen=True, slots=True)
class SkinCheckCase:
    """Repeated readings of one case. ``None`` marks a refused or unmeasured repeat."""

    case_id: str
    readings: tuple[Reading, ...]
    group: str = UNKNOWN_GROUP

    def __post_init__(self) -> None:
        if not isinstance(self.case_id, str) or _CASE_ID.fullmatch(self.case_id) is None:
            raise ValueError("Case id must be 1-64 letters, digits or _ . : -")
        if not isinstance(self.group, str) or _GROUP.fullmatch(self.group) is None:
            raise ValueError("Group label must be 1-32 plain characters")
        if not isinstance(self.readings, tuple) or not 2 <= len(self.readings) <= MAX_REPEATS:
            raise ValueError(f"A repeat-capture case needs 2..{MAX_REPEATS} readings")
        object.__setattr__(self, "readings", tuple(_reading(r) for r in self.readings))

    @property
    def measured(self) -> bool:
        return all(r is not None for r in self.readings)

    @property
    def stable(self) -> bool:
        return self.measured and len(set(self.readings)) == 1

    def public(self) -> dict[str, Any]:
        return {"case": self.case_id, "group": self.group, "repeats": len(self.readings),
                "measured": self.measured, "stable": self.stable}


def _from_result(result: ShadeResult | Mapping[str, Any]) -> Reading:
    """A W6 result (object or its to_json() form) as one repeat; any refusal is None.

    ASSUMED: a refused reading counts as not measured even when it carries a Lab
    estimate, because no shade was named. This can only lower the stable count.
    """
    refused: object
    band: object
    tone: object
    if isinstance(result, ShadeResult):
        refused, band, tone = result.refused, result.depth_band, result.undertone
    elif isinstance(result, Mapping):
        refused, band, tone = result.get("refused"), result.get("depth_band"), result.get("undertone")
    else:
        raise ValueError("Expected a W6 shade result")
    if refused is not False or band is None or not isinstance(tone, Mapping):
        return None
    return _reading((band, tone.get("undertone")))


def case_from_shade(case_id: str, results: Sequence[ShadeResult | Mapping[str, Any]], *,
                    group: str | None = None) -> SkinCheckCase:
    """Build one SKN-03 case from the repeated W6 results of a single capture session."""
    if isinstance(results, (str, bytes)) or not isinstance(results, Sequence):
        raise ValueError("Expected a sequence of W6 shade results")
    return SkinCheckCase(case_id, tuple(_from_result(r) for r in results),
                         UNKNOWN_GROUP if group is None else group)


@dataclass(frozen=True, slots=True)
class SKN03Report:
    total: int
    stable: int
    unmeasured: int
    groups: tuple[tuple[str, int, int], ...]
    independent_labels: bool
    compatible_baseline: bool
    human_review: bool

    @property
    def unstable(self) -> int:
        return self.total - self.stable

    @property
    def rate(self) -> float:
        return self.stable / self.total

    @property
    def minimum_stable(self) -> int:
        return (TARGET_NUMERATOR * self.total + TARGET_DENOMINATOR - 1) // TARGET_DENOMINATOR

    @property
    def additional_required(self) -> int:
        return max(0, self.minimum_stable - self.stable)

    @property
    def status(self) -> SKNStatus:
        if self.additional_required:
            return "BELOW_TARGET"
        if not (self.independent_labels and self.compatible_baseline and self.human_review):
            return "UNPROVEN"
        return "BOX_REVIEW_REQUIRED"

    def public(self) -> dict[str, Any]:
        return {
            "format": "beljour-skn03-readiness/1", "check": "SKN-03",
            "definition": "Repeat-capture stability: same session, same light - same tone and undertone",
            "total": self.total, "stable": self.stable, "unstable": self.unstable,
            "unmeasured": self.unmeasured, "rate": round(self.rate, 6), "target": SKN03_TARGET,
            "minimum_stable": self.minimum_stable, "additional_required": self.additional_required,
            "groups": {name: {"total": total, "stable": stable} for name, total, stable in self.groups},
            "independent_labels": self.independent_labels,
            "compatible_baseline": self.compatible_baseline, "human_review": self.human_review,
            "status": self.status, "release_pass": False,
        }


def measure_skn03(cases: Sequence[SkinCheckCase], *, independent_labels: bool = False,
                  compatible_baseline: bool = False, human_review: bool = False) -> SKN03Report:
    """Count stable cases against the frozen 95% target; every case stays in the total."""
    if isinstance(cases, (str, bytes)) or not isinstance(cases, Sequence):
        raise ValueError("Expected a sequence of SKN-03 cases")
    rows = tuple(cases)
    if not 1 <= len(rows) <= MAX_CASES or not all(isinstance(c, SkinCheckCase) for c in rows):
        raise ValueError(f"SKN-03 needs 1..{MAX_CASES} checked cases")
    if len({c.case_id for c in rows}) != len(rows):
        raise ValueError("Each SKN-03 case may be counted once")
    for flag in (independent_labels, compatible_baseline, human_review):
        if type(flag) is not bool:
            raise ValueError("Evidence flags must be booleans")
    groups: dict[str, list[int]] = {}
    for case in rows:
        tally = groups.setdefault(case.group, [0, 0])
        tally[0] += 1
        tally[1] += case.stable
    return SKN03Report(
        len(rows), sum(c.stable for c in rows), sum(not c.measured for c in rows),
        tuple((name, t[0], t[1]) for name, t in sorted(groups.items())),
        independent_labels, compatible_baseline, human_review,
    )


@dataclass(frozen=True, slots=True)
class ReferenceCoverage:
    """Which depth band x undertone cells the skin inventory fills, and how far apart it is."""

    kind: ShadeKind
    total: int
    cells: tuple[tuple[int, str, int], ...]
    min_separation: float
    close_pairs: tuple[tuple[str, str, float], ...]
    cross_undertone_neighbours: int

    @property
    def missing(self) -> tuple[tuple[int, str], ...]:
        return tuple((band, tone) for band, tone, count in self.cells if count == 0)

    def public(self) -> dict[str, Any]:
        return {
            "format": "beljour-reference-inventory/1", "kind": self.kind, "total": self.total,
            "cells": [{"depth_band": b, "undertone": u, "count": n} for b, u, n in self.cells],
            "missing": [{"depth_band": b, "undertone": u} for b, u in self.missing],
            "min_separation": round(self.min_separation, 4),
            "close_pairs": [{"first": a, "second": b, "delta_e": round(d, 4)} for a, b, d in self.close_pairs],
            "cross_undertone_neighbours": self.cross_undertone_neighbours,
            "note": "In-house cosmetic references; not a physical product catalogue.",
        }


def check_reference_coverage(kind: ShadeKind = "reference") -> ReferenceCoverage:
    """Audit a skin catalogue: cell counts, nearest-neighbour separation and undertone borders.

    ``cross_undertone_neighbours`` counts references whose nearest other reference has a
    different undertone; those borders are where repeat readings can flip undertone.
    """
    catalogue = load_shade_catalogue(kind)
    records = catalogue.records
    if any(r.surface != "skin" for r in records):
        raise ValueError("Reference coverage is defined for skin catalogues only")
    cells = tuple((band, tone, sum(1 for r in records if r.level == band and r.undertone == tone))
                  for band in range(1, 11) for tone in UNDERTONES)
    nearest: list[float] = []
    close: list[tuple[str, str, float]] = []
    crossing = 0
    for i, first in enumerate(records):
        distances = [(delta_e(first.lab, other.lab), other.id, other.undertone)
                     for j, other in enumerate(records) if j != i]
        best = min(distances)
        nearest.append(best[0])
        crossing += best[2] != first.undertone
        close.extend((first.id, other_id, d) for d, other_id, _ in distances
                     if d < DISTINGUISHABLE_DELTA_E and first.id < other_id)
    return ReferenceCoverage(kind, len(records), cells, min(nearest),
                             tuple(sorted(close, key=lambda p: (p[2], p[0], p[1]))), crossing)

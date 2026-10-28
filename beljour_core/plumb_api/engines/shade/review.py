"""Non-identifying review of the legacy W6 path against the audited cheek-first path.

Each reading is put in exactly one category, so a disagreement is never blamed on the
wrong cause. In order of precedence:

* ``missing_geometry``: no usable face mesh, so neither path can measure;
* ``inconsistent_light``: the audited path's cheek audit refused (mixed lighting or too
  few cheek pixels);
* ``coverage_gap``: neither path names a shade and the audited reading has no in-house
  reference deep enough or close enough (shade.coverage.compare_point). When the legacy
  path did name one, the paths disagree on the measurement instead;
* ``agree``: both paths name the same reference, or both refuse;
* ``measurement_mismatch``: the two paths measured the same photo differently.

Thresholds are the unchanged W6 ones (0.45 confidence, 6.0 distance, 1.0 L*
never-lighter). review_diagnoses() keeps every reading in the denominator. Stored
fields are reference labels and category names only: no pixels, mesh or digests.
The last supplied real-face measurement (65/983) is quoted, not re-measured.
Mirrored in web/src/engines/shade/review.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any, Literal

from .coverage import compare_point
from .finder import ShadeResult

Category = Literal["agree", "measurement_mismatch", "missing_geometry", "inconsistent_light", "coverage_gap"]
CATEGORIES: tuple[Category, ...] = ("agree", "measurement_mismatch", "missing_geometry", "inconsistent_light",
                                    "coverage_gap")
LAST_REPORTED_REAL_FACE = "65/983"

__all__ = ["CATEGORIES", "ShadeDiagnosis", "ShadeReview", "classify_paths", "review_diagnoses"]


@dataclass(frozen=True, slots=True)
class ShadeDiagnosis:
    category: Category
    legacy_id: str | None
    audited_id: str | None
    audit_reason: str | None
    coverage_status: str | None

    def public(self) -> dict[str, Any]:
        return {"category": self.category, "legacy": self.legacy_id, "audited": self.audited_id,
                "audit_reason": self.audit_reason, "coverage": self.coverage_status}


def _named(result: ShadeResult | None) -> str | None:
    if result is None or result.refused or not isinstance(result.best, dict):
        return None
    value = result.best.get("id")
    return value if isinstance(value, str) else None


def classify_paths(legacy: ShadeResult | None, audited: ShadeResult | None, audit_reason: str | None, *,
                   geometry: bool) -> ShadeDiagnosis:
    """One category for one photo's two W6 readings."""
    if type(geometry) is not bool:
        raise ValueError("geometry must be a boolean")
    if not geometry or legacy is None or audited is None:
        return ShadeDiagnosis("missing_geometry", None, None, None, None)
    first, second = _named(legacy), _named(audited)
    if audit_reason is not None:
        return ShadeDiagnosis("inconsistent_light", first, second, audit_reason, None)
    status = None
    if audited.measured_lab is not None:
        status = compare_point(list(audited.measured_lab)).status
    if first is None and second is None and status not in (None, "within_reference_limit"):
        return ShadeDiagnosis("coverage_gap", first, second, None, status)
    category: Category = "agree" if first == second else "measurement_mismatch"
    return ShadeDiagnosis(category, first, second, None, status)


@dataclass(frozen=True, slots=True)
class ShadeReview:
    total: int
    counts: tuple[tuple[str, int], ...]

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-shade-review/1", "total": self.total, "categories": dict(self.counts),
                "thresholds_changed": False, "last_reported_real_face": LAST_REPORTED_REAL_FACE,
                "new_real_face_score": None, "kind": "diagnostic_counts_not_accuracy"}


def review_diagnoses(diagnoses: Iterable[ShadeDiagnosis]) -> ShadeReview:
    rows = list(diagnoses)
    if not rows or not all(isinstance(r, ShadeDiagnosis) for r in rows):
        raise ValueError("A review needs at least one diagnosis")
    return ShadeReview(len(rows), tuple((c, sum(r.category == c for r in rows)) for c in CATEGORIES))

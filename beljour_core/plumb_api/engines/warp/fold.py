"""E06 fold and flip checks, and a strength guard that keeps a warp fold-free.

* `fold_report`: the Jacobian determinant of the backward maps (central differences,
  one-sided at the border, as `resample.jacobian_determinant`). Q3 passes when it stays
  above 0.2 everywhere; at or below 0 the picture folds over itself.
* `triangle_flips`: for piecewise warps, triangles whose signed area changes sign
  (a flip) or shrinks below `min_ratio` of its source area.
* `safe_strength`: the largest strength in [0, 1] whose field passes the fold rule,
  found by bisection. Strength 0 is the identity (determinant 1), so the search always
  has a passing end.

Mirrored in `web/src/engines/warp/fold.ts`.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass

import numpy as np

from . import field as fields
from .piecewise import check_triangles
from .tps import points
from .triangulate import signed_area

Q3_MINIMUM = 0.2


@dataclass(frozen=True)
class FoldReport:
    min_det: float
    max_det: float
    folded_share: float          # determinant <= 0
    below_share: float           # determinant <= minimum
    worst_x: int
    worst_y: int
    minimum: float

    @property
    def passed(self) -> bool:
        return self.min_det > self.minimum

    def to_json(self) -> dict[str, float | int | bool]:
        return {"min_det": self.min_det, "max_det": self.max_det, "folded_share": self.folded_share,
                "below_share": self.below_share, "worst_x": self.worst_x, "worst_y": self.worst_y,
                "minimum": self.minimum, "passed": self.passed}


def fold_report(field: fields.Field, minimum: float = Q3_MINIMUM) -> FoldReport:
    det = field.jacobian()
    flat = int(np.argmin(det))
    return FoldReport(float(np.min(det)), float(np.max(det)), float((det <= 0).mean()),
                      float((det <= minimum).mean()), flat % field.width, flat // field.width, minimum)


@dataclass(frozen=True)
class FlipReport:
    flipped: tuple[int, ...]
    squashed: tuple[int, ...]
    min_area_ratio: float

    @property
    def passed(self) -> bool:
        return not self.flipped and not self.squashed

    def to_json(self) -> dict[str, object]:
        return {"flipped": list(self.flipped), "squashed": list(self.squashed),
                "min_area_ratio": self.min_area_ratio, "passed": self.passed}


def triangle_flips(src: object, dst: object, triangles: Iterable[Sequence[int]],
                   min_ratio: float = Q3_MINIMUM) -> FlipReport:
    """Triangles that flip orientation or keep less than `min_ratio` of their area."""
    s = points(src, "src")
    d = points(dst, "dst")
    if s.shape != d.shape:
        raise ValueError("src and dst must have the same number of points")
    tris = check_triangles(triangles, len(s))
    flipped, squashed = [], []
    worst = np.inf
    for index, (a, b, c) in enumerate(tris):
        before = signed_area(s[a], s[b], s[c])
        after = signed_area(d[a], d[b], d[c])
        if before == 0:
            continue
        ratio = after / before
        worst = min(worst, ratio)
        if ratio <= 0:
            flipped.append(index)
        elif ratio < min_ratio:
            squashed.append(index)
    return FlipReport(tuple(flipped), tuple(squashed), float(worst) if np.isfinite(worst) else 1.0)


@dataclass(frozen=True)
class SafeStrength:
    strength: float
    field: fields.Field
    report: FoldReport
    reduced: bool


def safe_strength(build: Callable[[float], fields.Field], *, minimum: float = Q3_MINIMUM,
                  iterations: int = 12, requested: float = 1.0) -> SafeStrength:
    """Largest strength s <= `requested` whose field keeps the determinant above `minimum`."""
    if not (0 <= requested <= 1):
        raise ValueError("requested strength must be in [0, 1]")
    if not 1 <= iterations <= 40:
        raise ValueError("iterations must be 1..40")
    top = build(requested)
    report = fold_report(top, minimum)
    if report.passed:
        return SafeStrength(requested, top, report, False)
    lo, hi = 0.0, requested
    best_field = build(0.0)
    best_report = fold_report(best_field, minimum)
    for _ in range(iterations):
        mid = (lo + hi) / 2
        candidate = build(mid)
        rep = fold_report(candidate, minimum)
        if rep.passed:
            lo, best_field, best_report = mid, candidate, rep
        else:
            hi = mid
    return SafeStrength(lo, best_field, best_report, True)


def scaled_builder(field: fields.Field) -> Callable[[float], fields.Field]:
    """A builder for `safe_strength` that scales one field's displacement."""
    return lambda s: fields.scale(field, s)

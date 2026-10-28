"""Frozen-set-facing level evidence fields; synthetic rows are never a release PASS.

Only group counts and coarse statuses may leave the authorized evaluation box.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Literal

from .levels import Direction, signal_at


@dataclass(frozen=True)
class LevelEvidence:
    direction: Direction
    level: float
    feature_shift: float
    similarity: float
    fold_count: int
    nan_count: int
    geometry_shift: float
    status: Literal["UNPROVEN", "FAIL"]


def evidence(
    direction: Direction,
    level: float,
    similarity: float,
    *,
    fold_count: int = 0,
    nan_count: int = 0,
) -> LevelEvidence:
    """Measure local signal scale; no human/frozen verdict is inferred."""
    if not math.isfinite(similarity) or not 0 <= similarity <= 1:
        raise ValueError("similarity outside [0,1]")
    if fold_count < 0 or nan_count < 0:
        raise ValueError("negative quality count")
    measured = signal_at(level)
    shift = measured.brow_tint
    failed = fold_count > 0 or nan_count > 0
    return LevelEvidence(direction, level, shift, similarity, fold_count, nan_count,
                         measured.geometry_change, "FAIL" if failed else "UNPROVEN")


def expected_rows() -> tuple[LevelEvidence, ...]:
    """Six unscored synthetic checks; real-face acceptance uses frozen evidence."""
    return tuple(
        evidence(direction, level, 1.0)
        for direction in ("feminine", "masculine")
        for level in (2.0, 3.5, 5.0)
    )


def aggregate_count_only(rows: Iterable[LevelEvidence]) -> dict[str, int]:
    collected = tuple(rows)
    if len({(r.direction, r.level) for r in collected}) != len(collected):
        raise ValueError("duplicate level/direction row")
    return {
        "observed": len(collected),
        "failed": sum(r.status == "FAIL" for r in collected),
        "unproven": sum(r.status == "UNPROVEN" for r in collected),
    }

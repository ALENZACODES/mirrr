"""Fibre colour from two to six corrected readings of the same hair (several lights or captures).

A single reading can be thrown off by one lamp. This module accepts a swatch only
when the readings agree:

1. 2..6 readings, each a shade_support.FibreReading.
2. Any uncorrected reading refuses with ``uncorrected_lighting``.
3. The largest pairwise CIEDE2000 above the committed W6 zone-consistency bound
   (thresholds.json zone_delta_e_ok + zone_delta_e_span, the same bound the W6 cheek
   audit uses) refuses with ``mixed_lighting``.
4. The consensus is the per-channel median Lab; it is planned with
   shade_support.plan_fibre_colour (never above the measured hair level unless the
   user approves a lighter swatch).
5. Every reading on its own must choose the consensus's best swatch, otherwise the
   result refuses with ``unstable_swatch`` rather than pick one of several answers.

Only Lab values and counts are kept, never images. Mirrored in
web/src/commerce/colour-stability.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

import numpy as np

from ..core.filters import quantile
from ..shade.distance import delta_e, rank_shades
from ..shade.finder import thresholds
from .shade_support import FibrePlan, FibreReading, RefusalCode, plan_fibre_colour

MIN_READINGS = 2
MAX_READINGS = 6

__all__ = ["ColourStability", "MAX_READINGS", "MIN_READINGS", "assess_colour_stability", "mixed_light_limit"]


def mixed_light_limit() -> float:
    conf = thresholds()["confidence"]
    return float(conf["zone_delta_e_ok"]) + float(conf["zone_delta_e_span"])


@dataclass(frozen=True, slots=True)
class ColourStability:
    """The agreement check and, when it holds, the consensus fibre plan."""

    readings: tuple[FibreReading, ...]
    spread: float
    code: RefusalCode | None
    picks: tuple[str | None, ...]
    plan: FibrePlan | None

    @property
    def refused(self) -> bool:
        return self.code is not None

    @property
    def stable(self) -> bool:
        return self.code is None

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-fibre-colour-stability/1", "readings": len(self.readings),
                "spread_delta_e": round(self.spread, 4), "limit_delta_e": mixed_light_limit(),
                "refused": self.refused, "code": self.code, "stable": self.stable,
                "picks": list(self.picks), "plan": None if self.plan is None else self.plan.public()}


def _consensus(readings: Sequence[FibreReading]) -> FibreReading:
    lab = tuple(quantile(np.asarray([r.lab[c] for r in readings]), 0.5) for c in range(3))
    mode = "neutral" if all(r.white_mode == "neutral" for r in readings) else "grey_world"
    return FibreReading((lab[0], lab[1], lab[2]), mode, any(r.clamped for r in readings),
                        sum(r.pixels for r in readings))


def assess_colour_stability(readings: Sequence[FibreReading], *, approve_lighter: bool = False,
                            count: int = 3) -> ColourStability:
    """Plan one fibre colour from 2..6 readings, or refuse with a code."""
    if isinstance(readings, (str, bytes)) or not isinstance(readings, Sequence):
        raise ValueError("Expected a sequence of fibre colour readings")
    rows = tuple(readings)
    if not MIN_READINGS <= len(rows) <= MAX_READINGS or not all(isinstance(r, FibreReading) for r in rows):
        raise ValueError(f"Colour stability needs {MIN_READINGS}..{MAX_READINGS} fibre colour readings")
    spread = max(delta_e(a.lab, b.lab) for i, a in enumerate(rows) for b in rows[i + 1:])
    if any(r.white_mode == "none" for r in rows):
        return ColourStability(rows, spread, "uncorrected_lighting", (), None)
    if spread > mixed_light_limit():
        return ColourStability(rows, spread, "mixed_lighting", (), None)
    plan = plan_fibre_colour(_consensus(rows), approve_lighter=approve_lighter, count=count)
    if plan.best is None:
        return ColourStability(rows, spread, plan.code, (), plan)
    picks = tuple(
        ranked[0].record.id if (ranked := rank_shades(r.lab, "hair", allow_lighter=approve_lighter, limit=1))
        else None
        for r in rows
    )
    code: RefusalCode | None = None if all(p == plan.best.record.id for p in picks) else "unstable_swatch"
    return ColourStability(rows, spread, code, picks, plan if code is None else None)

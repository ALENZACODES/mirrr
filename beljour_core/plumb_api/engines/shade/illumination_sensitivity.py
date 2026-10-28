"""How an already selected W6 shade holds up under other lighting estimates of the same sample.

Inputs: a W6 result that named a shade, the exact sRGB skin sample it was measured
from, and one to three independently supplied lighting estimates (a neutral card,
a grey-world background, or no correction). Each estimate is applied to that same
sample with the W6 measurement (gains in linear light, trimmed median Lab). For
each one the audit reports the CIEDE2000 distance to the selected shade, how much
lighter the shade is than that reading, and which reference would be nearest.

It never picks a different winner: the selected id is always the W6 one, and the
audit only says ``stable`` or ``sensitive``. It refuses instead of extrapolating:

* ``incompatible_baseline``: the W6 result refused, named no shade, or named a shade
  that is not one of the 96 in-house references;
* ``stale_sample``: the sample re-measured with the W6 result's own gains is more
  than STALE_DELTA_E (ASSUMED 0.01 CIEDE2000, rounding headroom) from its reading.

Invalid estimates (unknown mode, repeated mode, non-finite gains, gains outside the
committed W6 gain limits, or "none" with gains other than 1) raise ValueError.
Photo-free output: no pixels, only Lab values and reference labels. Mirrored in
web/src/engines/shade/illumination-sensitivity.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from .distance import delta_e, nearest_shade
from .finder import ShadeResult, WhiteBalance, pixels_to_lab, thresholds, trimmed_stats
from .loaders import Lab, ShadeRecord, load_reference_shades

STALE_DELTA_E = 0.01
MODES = ("neutral", "grey_world", "none")
SensitivityStatus = Literal["stable", "sensitive", "refused"]

__all__ = ["LightingEstimate", "LightingOutcome", "SensitivityDecision", "audit_illumination_sensitivity",
           "measure_sample"]


@dataclass(frozen=True, slots=True)
class LightingEstimate:
    mode: str
    gains: tuple[float, float, float]

    def __post_init__(self) -> None:
        if self.mode not in MODES:
            raise ValueError("Lighting estimate mode must be neutral, grey_world or none")
        gains = tuple(self.gains)
        if len(gains) != 3 or any(isinstance(g, bool) or not isinstance(g, (int, float)) or not math.isfinite(g)
                                  for g in gains):
            raise ValueError("Lighting gains must be three finite numbers")
        lo, hi = (float(v) for v in thresholds()["gain_limits"])
        if any(not lo <= g <= hi for g in gains):
            raise ValueError("Lighting gains lie outside the committed W6 gain limits")
        if self.mode == "none" and gains != (1, 1, 1):
            raise ValueError("An uncorrected estimate must have unit gains")
        object.__setattr__(self, "gains", (float(gains[0]), float(gains[1]), float(gains[2])))

    @classmethod
    def from_white(cls, white: WhiteBalance) -> LightingEstimate:
        return cls(white.mode, white.gains)


@dataclass(frozen=True, slots=True)
class LightingOutcome:
    mode: str
    lab: Lab
    delta_e: float
    lighter_by: float
    nearest_id: str | None
    within_limits: bool

    def public(self) -> dict[str, Any]:
        return {"mode": self.mode, "lab": [round(v, 4) for v in self.lab], "delta_e": round(self.delta_e, 4),
                "lighter_by": round(self.lighter_by, 4), "nearest": self.nearest_id,
                "within_limits": self.within_limits}


@dataclass(frozen=True, slots=True)
class SensitivityDecision:
    status: SensitivityStatus
    code: str | None
    selected_id: str | None
    outcomes: tuple[LightingOutcome, ...]

    @property
    def max_delta_e(self) -> float | None:
        return max((o.delta_e for o in self.outcomes), default=None)

    def public(self) -> dict[str, Any]:
        top = self.max_delta_e
        return {"format": "beljour-illumination-sensitivity/1", "status": self.status, "code": self.code,
                "selected": self.selected_id, "max_delta_e": None if top is None else round(top, 4),
                "outcomes": [o.public() for o in self.outcomes], "changes_selection": False,
                "note": "Lighting comparison on one sample; not a new shade choice or a product match."}


def measure_sample(sample: object, gains: Sequence[float]) -> Lab:
    """The W6 trimmed median Lab of an (n, 3) sRGB sample under the given gains."""
    pixels = np.asarray(sample, dtype=np.float64)
    if pixels.ndim != 2 or pixels.shape[1] != 3 or len(pixels) == 0 or not np.all(np.isfinite(pixels)):
        raise ValueError("The colour sample must be a non-empty (n, 3) array of finite sRGB values")
    white = WhiteBalance((float(gains[0]), float(gains[1]), float(gains[2])), "neutral", False)
    median, _, _ = trimmed_stats(pixels_to_lab(pixels, white))
    return float(median[0]), float(median[1]), float(median[2])


def _refuse(code: str, selected: str | None) -> SensitivityDecision:
    return SensitivityDecision("refused", code, selected, ())


def audit_illumination_sensitivity(result: ShadeResult, sample: object,
                                   estimates: Sequence[LightingEstimate]) -> SensitivityDecision:
    """Compare the selected shade under each estimate; never select a different shade."""
    if not isinstance(result, ShadeResult):
        raise ValueError("Expected a W6 shade result")
    rows = tuple(estimates)
    if not 1 <= len(rows) <= len(MODES) or not all(isinstance(e, LightingEstimate) for e in rows):
        raise ValueError("Give one to three lighting estimates")
    if len({e.mode for e in rows}) != len(rows):
        raise ValueError("Each lighting mode may be supplied once")
    references: dict[str, ShadeRecord] = {r.id: r for r in load_reference_shades()}
    best = result.best
    selected = best.get("id") if isinstance(best, dict) else None
    if result.refused or result.measured_lab is None or selected not in references:
        return _refuse("incompatible_baseline", selected if isinstance(selected, str) else None)
    shade = references[selected]
    if delta_e(measure_sample(sample, result.white.gains), result.measured_lab) > STALE_DELTA_E:
        return _refuse("stale_sample", selected)
    limit = float(thresholds()["confidence"]["refuse_delta_e_above"])
    allowance = float(thresholds()["never_lighter_allowance"])
    outcomes = []
    for estimate in rows:
        lab = measure_sample(sample, estimate.gains)
        distance = delta_e(lab, shade.lab)
        lighter_by = shade.lab[0] - lab[0]
        nearest = nearest_shade(lab, "reference")
        outcomes.append(LightingOutcome(estimate.mode, lab, distance, lighter_by,
                                        None if nearest is None else nearest.record.id,
                                        distance <= limit and lighter_by <= allowance))
    stable = all(o.within_limits and o.nearest_id == selected for o in outcomes)
    return SensitivityDecision("stable" if stable else "sensitive", None, selected, tuple(outcomes))

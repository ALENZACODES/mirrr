"""SKN-03 source calibration: reference probes, synthetic boundary vectors and the open gap.

Everything here is derived from the 96 C18 skin references; nothing is a face result.

* probe_reference(): the nearest reference by CIEDE2000 under the unchanged W6 rules
  (at most 1.0 L* lighter, refuse beyond the committed 6.0 distance), with the
  runner-up and its margin. An exact tie (margin 0 within float rounding) is reported
  as ``tie`` and names no shade, because the identity is not determined.
* synthetic_boundary_vectors(): 288 vectors, three per reference, moved 10%, 25% and
  40% of the way in Lab toward the reference's nearest neighbour of a different
  undertone. Most neighbours share the step; four are 2 L* darker, so their 40% vector
  is 0.8 L* darker than the source, still inside the 1.0 allowance. Each should map
  back to its source reference.
* negative_controls(): one no-lightening control per reference (the reading is 1.5 L*
  darker, so that reference is too light and must not be named) and one tie control
  (a duplicate of the reference under a second id must give ``tie``).
* audit_probes(): exact, wrong-accepted and refused counts with the exact integer
  SKN-03 target ceil(95 * N / 100). assess_calibration_gap() sets that synthetic audit
  beside the last box-reported released-person rate (93.9% against 95%); synthetic
  vectors never close a real-face gap.

Mirrored in web/src/engines/shade/calibration.ts (parity/skn03-calibration-r35f.json).
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass, replace
from functools import lru_cache
from typing import Any, Literal

from .c18 import load_c18_shades
from .distance import delta_e, rank_shades
from .finder import thresholds
from .loaders import Lab, LabLike, ShadeRecord, checked_lab

BOUNDARY_FRACTIONS = (0.1, 0.25, 0.4)
LIGHTENING_STEP = 1.5
TIE_EPSILON = 1e-9
TARGET_NUMERATOR, TARGET_DENOMINATOR = 95, 100
REPORTED_PERCENT = 93.9
ProbeStatus = Literal["matched", "tie", "too_far", "too_deep"]

__all__ = [
    "BoundaryVector", "CalibrationGap", "NegativeControl", "ProbeAudit", "ReferenceProbe",
    "assess_calibration_gap", "audit_probes", "audit_synthetic_boundary_vectors",
    "committed_distance_limit", "negative_controls", "probe_reference", "synthetic_boundary_vectors",
]


def committed_distance_limit() -> float:
    """The W6 refusal distance (thresholds.json ``refuse_delta_e_above``), unchanged."""
    return float(thresholds()["confidence"]["refuse_delta_e_above"])


@dataclass(frozen=True, slots=True)
class ReferenceProbe:
    lab: Lab
    status: ProbeStatus
    best_id: str | None
    best_delta_e: float | None
    runner_up_id: str | None
    margin: float | None

    @property
    def named(self) -> str | None:
        """The reference this probe names, or None when it refuses or ties."""
        return self.best_id if self.status == "matched" else None

    def public(self) -> dict[str, Any]:
        def rounded(v: float | None) -> float | None:
            return None if v is None else round(v, 6)
        return {"lab": [round(v, 6) for v in self.lab], "status": self.status, "best": self.best_id,
                "best_delta_e": rounded(self.best_delta_e), "runner_up": self.runner_up_id,
                "margin": rounded(self.margin)}


def probe_reference(lab: LabLike, records: Sequence[ShadeRecord] | None = None) -> ReferenceProbe:
    """Nearest C18 skin reference (or of ``records``) with its runner-up margin."""
    reading = checked_lab(lab)
    rows = load_c18_shades("skin").records if records is None else tuple(records)
    ranked = rank_shades(reading, rows, limit=2)
    if not ranked:
        return ReferenceProbe(reading, "too_deep", None, None, None, None)
    best = ranked[0]
    runner = ranked[1] if len(ranked) > 1 else None
    margin = None if runner is None else runner.delta_e - best.delta_e
    status: ProbeStatus = "matched"
    if best.delta_e > committed_distance_limit():
        status = "too_far"
    elif margin is not None and margin <= TIE_EPSILON:
        status = "tie"
    return ReferenceProbe(reading, status, best.record.id, best.delta_e,
                          None if runner is None else runner.record.id, margin)


@dataclass(frozen=True, slots=True)
class ProbeAudit:
    total: int
    exact: int
    wrong_accepted: int
    refused: int

    @property
    def minimum_exact(self) -> int:
        return (TARGET_NUMERATOR * self.total + TARGET_DENOMINATOR - 1) // TARGET_DENOMINATOR

    @property
    def additional_required(self) -> int:
        return max(0, self.minimum_exact - self.exact)

    @property
    def rate(self) -> float:
        return self.exact / self.total

    def public(self) -> dict[str, Any]:
        return {"total": self.total, "exact": self.exact, "wrong_accepted": self.wrong_accepted,
                "refused": self.refused, "rate": round(self.rate, 6), "minimum_exact": self.minimum_exact,
                "additional_required": self.additional_required, "kind": "synthetic_source_vectors"}


def audit_probes(cases: Sequence[tuple[LabLike, str]], records: Sequence[ShadeRecord] | None = None) -> ProbeAudit:
    """Probe each (Lab, expected reference id); every case stays in the denominator."""
    if isinstance(cases, (str, bytes)) or not isinstance(cases, Sequence) or not cases:
        raise ValueError("Expected a non-empty sequence of (Lab, expected id) cases")
    exact = wrong = refused = 0
    for case in cases:
        if not isinstance(case, (tuple, list)) or len(case) != 2 or not isinstance(case[1], str):
            raise ValueError("Each case is (Lab, expected reference id)")
        named = probe_reference(case[0], records).named
        if named is None:
            refused += 1
        elif named == case[1]:
            exact += 1
        else:
            wrong += 1
    return ProbeAudit(len(cases), exact, wrong, refused)


@dataclass(frozen=True, slots=True)
class BoundaryVector:
    source_id: str
    toward_id: str
    fraction: float
    lab: Lab

    def public(self) -> dict[str, Any]:
        return {"source": self.source_id, "toward": self.toward_id, "fraction": self.fraction,
                "lab": list(self.lab)}


def _toward(first: Lab, second: Lab, fraction: float) -> Lab:
    return (first[0] + fraction * (second[0] - first[0]), first[1] + fraction * (second[1] - first[1]),
            first[2] + fraction * (second[2] - first[2]))


def _neighbour(record: ShadeRecord, records: Sequence[ShadeRecord]) -> ShadeRecord:
    """Nearest reference of a different undertone, ties broken by id."""
    others = [r for r in records if r.undertone != record.undertone]
    return min(others, key=lambda r: (delta_e(record.lab, r.lab), r.id))


@lru_cache(maxsize=1)
def synthetic_boundary_vectors() -> tuple[BoundaryVector, ...]:
    records = load_c18_shades("skin").records
    out: list[BoundaryVector] = []
    for record in records:
        toward = _neighbour(record, records)
        out.extend(BoundaryVector(record.id, toward.id, f, _toward(record.lab, toward.lab, f))
                   for f in BOUNDARY_FRACTIONS)
    return tuple(out)


def audit_synthetic_boundary_vectors() -> ProbeAudit:
    return audit_probes([(v.lab, v.source_id) for v in synthetic_boundary_vectors()])


@dataclass(frozen=True, slots=True)
class NegativeControl:
    kind: Literal["no_lightening", "tie"]
    reference_id: str
    probe: ReferenceProbe

    @property
    def passed(self) -> bool:
        if self.kind == "tie":
            return self.probe.status == "tie" and self.probe.named is None
        return self.probe.best_id != self.reference_id

    def public(self) -> dict[str, Any]:
        return {"kind": self.kind, "reference": self.reference_id, "passed": self.passed,
                "probe": self.probe.public()}


@lru_cache(maxsize=1)
def negative_controls() -> tuple[NegativeControl, ...]:
    records = load_c18_shades("skin").records
    out = []
    for record in records:
        darker = (record.lab[0] - LIGHTENING_STEP, record.lab[1], record.lab[2])
        out.append(NegativeControl("no_lightening", record.id, probe_reference(darker)))
    for record in records:
        twin = replace(record, id=f"{record.id}-TWIN")
        out.append(NegativeControl("tie", record.id, probe_reference(record.lab, (*records, twin))))
    return tuple(out)


@dataclass(frozen=True, slots=True)
class CalibrationGap:
    synthetic: ProbeAudit
    controls_passed: int
    controls_total: int
    reported_percent: float

    @property
    def gap_percentage_points(self) -> float:
        return round(max(0.0, 100.0 * TARGET_NUMERATOR / TARGET_DENOMINATOR - self.reported_percent), 4)

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-skn03-calibration/1", "synthetic": self.synthetic.public(),
                "negative_controls": {"passed": self.controls_passed, "total": self.controls_total},
                "reported_percent": self.reported_percent, "target_percent": 95.0,
                "percentage_point_gap": self.gap_percentage_points,
                "status": "UNPROVEN", "synthetic_closes_real_gap": False, "release_pass": False}


def assess_calibration_gap(reported_percent: float = REPORTED_PERCENT) -> CalibrationGap:
    """The synthetic audit and controls beside the last box-reported released-person rate."""
    if type(reported_percent) not in (int, float) or not math.isfinite(reported_percent) \
            or not 0 <= reported_percent <= 100:
        raise ValueError("Reported percentage must be a finite number in 0..100")
    controls = negative_controls()
    return CalibrationGap(audit_synthetic_boundary_vectors(), sum(c.passed for c in controls), len(controls),
                          float(reported_percent))

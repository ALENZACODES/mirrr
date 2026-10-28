"""Deterministic audit of the original cosmetic reference table's missing areas.

Reports gaps, never fills them with invented products or loosens matching
thresholds. There are no photographs, names or personal readings here.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Any

from .finder import (
    depth_band,
    extended_reference_table,
    match_shades,
    thresholds,
    undertone_of,
)

Lab = tuple[float, float, float]
STATUS_COVERED = "within_reference_limit"
STATUS_TOO_DEEP = "no_reference_deep_enough"
STATUS_TOO_FAR = "reference_too_far"


@dataclass(frozen=True)
class ReferencePoint:
    lab: Lab
    depth_band: int
    undertone: str
    closest_id: str | None
    closest_delta_e: float | None
    reference_lightness: float | None
    status: str

    @property
    def covered(self) -> bool:
        return self.status == STATUS_COVERED

    def public(self) -> dict[str, Any]:
        return {
            "lab": [round(value, 4) for value in self.lab],
            "depth_band": self.depth_band,
            "undertone": self.undertone,
            "closest_reference": self.closest_id,
            "closest_delta_e": (
                None if self.closest_delta_e is None else round(self.closest_delta_e, 4)
            ),
            "reference_lightness": self.reference_lightness,
            "status": self.status,
        }


@dataclass(frozen=True)
class CoverageReport:
    total: int
    covered: int
    too_deep: int
    too_far: int
    max_distance: float
    depth_counts: dict[int, tuple[int, int]]
    undertone_counts: dict[str, tuple[int, int]]
    samples: tuple[ReferencePoint, ...]

    @property
    def covered_fraction(self) -> float:
        return self.covered / self.total if self.total else 0.0

    def public(self, *, include_cases: bool = False) -> dict[str, Any]:
        body: dict[str, Any] = {
            "format": "beljour-reference-coverage/1",
            "kind": "synthetic_lab_grid_not_real_face_results",
            "total": self.total,
            "covered": self.covered,
            "covered_fraction": round(self.covered_fraction, 6),
            "no_reference_deep_enough": self.too_deep,
            "reference_too_far": self.too_far,
            "maximum_allowed_delta_e": self.max_distance,
            "depths": {
                str(key): {"covered": value[0], "total": value[1]}
                for key, value in sorted(self.depth_counts.items())
            },
            "undertones": {
                key: {"covered": value[0], "total": value[1]}
                for key, value in sorted(self.undertone_counts.items())
            },
            "note": "In-house cosmetic reference grid; not a physical product catalogue.",
        }
        if include_cases:
            body["cases"] = [sample.public() for sample in self.samples]
        return body


def _lab(value: object) -> Lab:
    if not isinstance(value, (list, tuple)) or len(value) != 3:
        raise ValueError("Reference grid points must be three-number Lab tuples")
    if any(type(v) not in (float, int) or not math.isfinite(v) for v in value):
        raise ValueError("Reference grid values must be finite numeric components")
    lightness, a, b = (float(v) for v in value)
    if not 0 <= lightness <= 100 or not -128 <= a <= 127 or not -128 <= b <= 127:
        raise ValueError("Lab grid point lies outside the declared colour-space envelope")
    return (lightness, a, b)


def compare_point(lab: object) -> ReferencePoint:
    """A candidate must be within both the existing no-lightening and delta-E rules."""
    measured = _lab(lab)
    rows = match_shades(measured, extended_reference_table())
    closest = rows[0] if rows else None
    max_distance = float(thresholds()["confidence"]["refuse_delta_e_above"])
    if closest is None:
        status = STATUS_TOO_DEEP
    elif closest["delta_e"] > max_distance:
        status = STATUS_TOO_FAR
    else:
        status = STATUS_COVERED
    if closest is not None:
        lighter_by = float(closest["lab"][0]) - measured[0]
        if lighter_by > float(thresholds()["never_lighter_allowance"]):
            raise AssertionError("Reference matching offered a lighter shade")
    return ReferencePoint(
        lab=measured,
        depth_band=depth_band(measured[0]),
        undertone=str(undertone_of(measured)["undertone"]),
        closest_id=None if closest is None else str(closest["id"]),
        closest_delta_e=None if closest is None else float(closest["delta_e"]),
        reference_lightness=None if closest is None else float(closest["lab"][0]),
        status=status,
    )


def audit_reference_grid(points: Iterable[Lab]) -> CoverageReport:
    samples: list[ReferencePoint] = []
    for point in points:
        if len(samples) >= 2_048:
            raise ValueError("Reference audit is limited to 2048 synthetic points")
        samples.append(compare_point(point))
    if not samples:
        raise ValueError("Reference audit requires at least one point")
    by_depth: dict[int, tuple[int, int]] = {}
    by_undertone: dict[str, tuple[int, int]] = {}
    for sample in samples:
        prior = by_depth.get(sample.depth_band, (0, 0))
        by_depth[sample.depth_band] = (
            prior[0] + int(sample.covered), prior[1] + 1,
        )
        prev_tone = by_undertone.get(sample.undertone, (0, 0))
        by_undertone[sample.undertone] = (
            prev_tone[0] + int(sample.covered), prev_tone[1] + 1,
        )
    return CoverageReport(
        total=len(samples),
        covered=sum(sample.status == STATUS_COVERED for sample in samples),
        too_deep=sum(sample.status == STATUS_TOO_DEEP for sample in samples),
        too_far=sum(sample.status == STATUS_TOO_FAR for sample in samples),
        max_distance=float(thresholds()["confidence"]["refuse_delta_e_above"]),
        depth_counts=by_depth,
        undertone_counts=by_undertone,
        samples=tuple(samples),
    )


def study_levels(
    levels: Sequence[float],
    hues: Sequence[float],
    chromas: Sequence[float],
) -> tuple[Lab, ...]:
    """Make a deterministic Lab grid without photos or demographic assumptions."""
    if (not levels or not hues or not chromas
            or len(levels) * len(hues) * len(chromas) > 2_048):
        raise ValueError("Reference study grid must contain 1 to 2048 points")
    points: list[Lab] = []
    for level in levels:
        for chroma in chromas:
            for hue in hues:
                if (not math.isfinite(level) or not math.isfinite(chroma)
                        or not math.isfinite(hue) or chroma < 0):
                    raise ValueError("Reference grid requires finite, nonnegative chroma")
                radians = math.radians(hue)
                points.append(_lab((
                    float(level),
                    chroma * math.cos(radians),
                    chroma * math.sin(radians),
                )))
    return tuple(points)

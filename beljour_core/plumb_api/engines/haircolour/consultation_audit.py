"""Independent, photo-free measurement contracts for observed hair-colour trials.

The evaluator measures actual source and result pixels. An absent hair mask is
not a colour-engine failure and never a quality pass. Group summaries contain
only aggregate counts; actual-face quality requires a separate frozen run.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from .recolour import box_blur

ByteFrame = NDArray[np.uint8]
FloatPlane = NDArray[np.float64]
Group = Literal["monk", "gender", "age", "hair_texture", "yaw", "intersection"]
STATUS_NOT_TESTED = "not_tested"
MIN_SAMPLES = 16


def _validate(
    before: object, after: object, hair_mask: object
) -> tuple[ByteFrame, ByteFrame, FloatPlane]:
    source = np.asarray(before)
    result = np.asarray(after)
    if source.dtype != np.uint8 or result.dtype != np.uint8:
        raise ValueError("audit requires two byte frames")
    if source.ndim != 3 or source.shape != result.shape or source.shape[-1] not in (3, 4):
        raise ValueError("audit frames must have matching RGB/RGBA shapes")
    support = np.asarray(hair_mask, dtype=np.float64)
    if support.shape != source.shape[:2] or not np.all(np.isfinite(support)):
        raise ValueError("audit requires one measured hair support plane")
    if np.any((support < 0) | (support > 1)):
        raise ValueError("audit mask must contain alpha in 0..1")
    return source, result, support


def structure_correlation(
    before: ByteFrame,
    after: ByteFrame,
    hair_mask: FloatPlane,
    *,
    radius: int = 3,
) -> tuple[float | None, int]:
    """Assess retained high-frequency luminance only in fully supported hair."""
    if not 1 <= radius <= 8:
        raise ValueError("structure radius must be 1..8")
    interior = (hair_mask >= 0.5) & (
        box_blur((hair_mask >= 0.5).astype(float), radius + 1) >= 1 - 1e-9
    )
    light0 = (
        0.2126 * before[..., 0].astype(float)
        + 0.7152 * before[..., 1].astype(float)
        + 0.0722 * before[..., 2].astype(float)
    )
    light1 = (
        0.2126 * after[..., 0].astype(float)
        + 0.7152 * after[..., 1].astype(float)
        + 0.0722 * after[..., 2].astype(float)
    )
    high0 = light0 - box_blur(light0, radius)
    high1 = light1 - box_blur(light1, radius)
    valid = interior & (np.abs(high0) > 2.0)
    count = int(np.count_nonzero(valid))
    if count < 3:
        return None, count
    a = high0[valid]
    b = high1[valid]
    am, bm = float(np.mean(a)), float(np.mean(b))
    ad, bd = a - am, b - bm
    divisor = math.sqrt(float(np.sum(ad * ad) * np.sum(bd * bd)))
    if divisor < 1e-9:
        return None, count
    return float(np.clip(float(np.sum(ad * bd)) / divisor, -1.0, 1.0)), count


@dataclass(frozen=True)
class PixelEvidence:
    observed_pixels: int
    changed_pixels: int
    outside_changed_pixels: int
    alpha_changed_pixels: int
    mean_rgb_delta: float
    max_outside_delta: int
    structure_correlation: float | None
    structure_samples: int
    guard_invoked: bool
    simulation_disclosed: bool
    realface_status: str = STATUS_NOT_TESTED

    @property
    def leakage_free(self) -> bool:
        return self.outside_changed_pixels == 0 and self.alpha_changed_pixels == 0

    def count_only(self) -> dict[str, int | float | str | bool | None]:
        return {
            "observed_pixels": self.observed_pixels,
            "changed_pixels": self.changed_pixels,
            "outside_changed_pixels": self.outside_changed_pixels,
            "alpha_changed_pixels": self.alpha_changed_pixels,
            "mean_rgb_delta": round(self.mean_rgb_delta, 6),
            "max_outside_delta": self.max_outside_delta,
            "structure_correlation": (
                None if self.structure_correlation is None else round(self.structure_correlation, 6)
            ),
            "structure_samples": self.structure_samples,
            "guard_invoked": self.guard_invoked,
            "simulation_disclosed": self.simulation_disclosed,
            "realface_status": self.realface_status,
        }


def audit_pixels(
    before: object,
    after: object,
    observed_mask: object,
    *,
    guard_invoked: bool,
    simulation_disclosed: bool,
) -> PixelEvidence:
    """Measure output independent of the renderer's own reported checks."""
    source, rendered, mask = _validate(before, after, observed_mask)
    hair = mask >= 0.5
    if int(np.count_nonzero(hair)) < MIN_SAMPLES:
        raise ValueError("not enough observed hair for an output measurement")
    outside = ~hair
    difference = np.abs(rendered[..., :3].astype(np.int16) - source[..., :3].astype(np.int16))
    changed = np.any(difference > 0, axis=-1)
    outside_diff = difference[outside]
    max_outside = int(np.max(outside_diff)) if outside_diff.size else 0
    alpha_changed = 0
    if source.shape[-1] == 4:
        alpha_changed = int(np.count_nonzero(source[..., 3] != rendered[..., 3]))
    corr, count = structure_correlation(source, rendered, mask)
    return PixelEvidence(
        observed_pixels=int(np.count_nonzero(hair)),
        changed_pixels=int(np.count_nonzero(changed & hair)),
        outside_changed_pixels=int(np.count_nonzero(changed & outside)),
        alpha_changed_pixels=alpha_changed,
        mean_rgb_delta=float(np.mean(difference[hair])),
        max_outside_delta=max_outside,
        structure_correlation=corr,
        structure_samples=count,
        guard_invoked=bool(guard_invoked),
        simulation_disclosed=bool(simulation_disclosed),
    )


@dataclass(frozen=True)
class GroupCount:
    group: Group
    label: str
    observed: int
    evaluated: int
    refusals: int
    leakage_failures: int
    unmeasured: int


def merge_group_counts(rows: list[GroupCount]) -> list[dict[str, str | int]]:
    """Shard-safe reporting without face IDs, images or speculative pass rates."""
    totals: dict[tuple[str, str], list[int]] = {}
    for row in rows:
        if row.group not in ("monk", "gender", "age", "hair_texture", "yaw", "intersection"):
            raise ValueError("group type is not approved")
        if not row.label or len(row.label) > 64 or any(c in row.label for c in "\r\n/\\@"):
            raise ValueError("invalid aggregate group name")
        quantities = (
            row.observed, row.evaluated, row.refusals,
            row.leakage_failures, row.unmeasured,
        )
        if any(isinstance(n, bool) or not isinstance(n, int) or n < 0 for n in quantities):
            raise ValueError("aggregate counts must be nonnegative integers")
        if row.evaluated + row.refusals + row.unmeasured != row.observed:
            raise ValueError("aggregate categories must cover every observation")
        if row.leakage_failures > row.evaluated:
            raise ValueError("leakage failures cannot exceed evaluated rows")
        key = (row.group, row.label)
        current = totals.setdefault(key, [0, 0, 0, 0, 0])
        for i, number in enumerate(quantities):
            current[i] += number
    return [
        {
            "group": group,
            "label": label,
            "observed": counts[0],
            "evaluated": counts[1],
            "refusals": counts[2],
            "leakage_failures": counts[3],
            "unmeasured": counts[4],
            "quality_status": STATUS_NOT_TESTED,
        }
        for (group, label), counts in sorted(totals.items())
    ]

"""Count-only audit of geometric refusals and declared eye invisibility.

No image, face coordinates, identifiers, or inferred group attributes leave
this module. Group labels are optional externally supplied aggregate names.
This is engineering triage, not an acceptance or demographic-quality score.
Author: John Khan.
"""
from __future__ import annotations

import re
from collections import Counter
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

import numpy as np

from .iris_colour import VisibleIrisResult

GROUP_PATTERN = re.compile(r"[a-z0-9_-]{1,32}\Z")
REGION_CAUSES = frozenset({"empty_raw_contour", "outside_visible_oval", "empty_clipped_contour"})
VISIBILITY_CAUSES = frozenset({"hidden_by_turn", "closed"})
IRIS_MISSING_CODES = frozenset({
    "iris_masks_overlap",
    "right:unobserved",
    "left:unobserved",
    "right:inconsistent_hidden_mask",
    "left:inconsistent_hidden_mask",
    "right:no_edit",
    "left:no_edit",
})
IRIS_HIDDEN_CODES = frozenset({
    "right:closed",
    "left:closed",
    "right:hidden_by_turn",
    "left:hidden_by_turn",
})


@dataclass(frozen=True)
class GeometryCounts:
    """Whole-set counts only; no per-input evidence or generated verdict."""

    total: int
    valid: int
    invalid: int
    refused: int
    invalid_reasons: dict[str, int]
    visibility_reasons: dict[str, int]
    groups: dict[str, dict[str, int]]

    @property
    def measured_valid_fraction(self) -> float | None:
        return self.valid / self.total if self.total else None

    def to_json(self) -> dict[str, Any]:
        return {
            "format": "beljour-region-counts/1",
            "total": self.total,
            "valid": self.valid,
            "invalid": self.invalid,
            "refused": self.refused,
            "invalid_reasons": dict(sorted(self.invalid_reasons.items())),
            "visibility_reasons": dict(sorted(self.visibility_reasons.items())),
            "groups": {
                key: dict(sorted(value.items()))
                for key, value in sorted(self.groups.items())
            },
            "quality_verdict": "UNPROVEN",
        }


def _validated_label(value: str) -> str:
    if not isinstance(value, str) or GROUP_PATTERN.fullmatch(value) is None:
        raise ValueError("a supplied group name must be a short aggregate slug")
    return value


def _invalid_reasons(value: object, invalid: bool) -> tuple[str, ...]:
    if value is None:
        return ("other_invalid_geometry",) if invalid else ()
    if not isinstance(value, (tuple, list)):
        raise ValueError("invalid reasons must be a list of geometry categories")
    reasons: list[str] = []
    for raw in value:
        if not isinstance(raw, str):
            raise ValueError("invalid reason is not a category")
        if raw == "face_oval_empty":
            reasons.append(raw)
            continue
        parts = raw.split(":", 1)
        if len(parts) != 2 or parts[1] not in REGION_CAUSES:
            raise ValueError("invalid reason is not a known geometry category")
        if parts[0] not in ("right_eye", "left_eye", "lips_outer"):
            raise ValueError("invalid reason references an unsupported region")
        reasons.append(raw)
    if invalid and not reasons:
        return ("other_invalid_geometry",)
    if not invalid and reasons:
        raise ValueError("valid geometry cannot have invalid reasons")
    return tuple(sorted(set(reasons)))


def _visible_reasons(value: object) -> tuple[str, ...]:
    if value is None:
        return ()
    if not isinstance(value, Mapping):
        raise ValueError("visibility evidence must map regions to reason categories")
    reasons: list[str] = []
    for region, reason in value.items():
        if not isinstance(region, str) or not isinstance(reason, str):
            raise ValueError("visibility evidence must contain region and reason names")
        if reason not in VISIBILITY_CAUSES:
            raise ValueError("unknown eye-visibility declaration")
        if region not in (
            "right_eye", "left_eye", "right_brow", "left_brow",
            "right_iris", "left_iris", "eyes", "brows", "irises", "mouth_opening",
        ):
            raise ValueError("visibility evidence references an unknown region")
        reasons.append(region + ":" + reason)
    return tuple(sorted(set(reasons)))


def aggregate(
    diagnostics: Iterable[Mapping[str, Any]],
    *,
    supplied_groups: Iterable[str] | None = None,
) -> GeometryCounts:
    """Stream only named geometry categories into bounded summary counters.

    An empty submitted sequence is not a PASS. An input with no valid oval is
    counted as invalid. A refusal is separate from a measured invalid mask.
    Unknown group labels and malformed reason structures fail closed.
    """
    group_iterator = iter(supplied_groups) if supplied_groups is not None else None
    totals: Counter[str] = Counter()
    reasons: Counter[str] = Counter()
    visible: Counter[str] = Counter()
    groups: dict[str, Counter[str]] = {}
    for diagnostic in diagnostics:
        if not isinstance(diagnostic, Mapping):
            raise ValueError("geometry observation must be a mapping")
        if group_iterator is None:
            group = "all"
        else:
            try:
                group = _validated_label(next(group_iterator))
            except StopIteration as exc:
                raise ValueError("group count differs from observation count") from exc
        invalid_value = diagnostic.get("invalid_geometry")
        if not isinstance(invalid_value, bool):
            raise ValueError("geometry-invalid state must be a boolean")
        state = "invalid" if invalid_value else "valid"
        totals["total"] += 1
        totals[state] += 1
        selected = groups.setdefault(group, Counter())
        selected["total"] += 1
        selected[state] += 1
        for reason in _invalid_reasons(diagnostic.get("invalid_reasons"), invalid_value):
            reasons[reason] += 1
        for reason in _visible_reasons(diagnostic.get("not_visible")):
            visible[reason] += 1
        if diagnostic.get("refused") is True:
            totals["refused"] += 1
            selected["refused"] += 1
    if group_iterator is not None:
        try:
            next(group_iterator)
        except StopIteration:
            pass
        else:
            raise ValueError("group count differs from observation count")
    return GeometryCounts(
        totals["total"], totals["valid"], totals["invalid"], totals["refused"],
        dict(reasons), dict(visible), {name: dict(value) for name, value in groups.items()},
    )


def merge_shards(shards: Mapping[str, GeometryCounts]) -> GeometryCounts:
    """Merge unique count-only shard summaries; never infer absent observations."""
    seen: set[str] = set()
    totals: Counter[str] = Counter()
    invalid_reasons: Counter[str] = Counter()
    visibility_reasons: Counter[str] = Counter()
    groups: dict[str, Counter[str]] = {}
    for shard, counts in shards.items():
        if not isinstance(counts, GeometryCounts):
            raise ValueError("each shard must contain a count-only report")
        key = _validated_label(shard)
        if key in seen:
            raise ValueError("duplicate shard identity")
        seen.add(key)
        totals["total"] += counts.total
        totals["valid"] += counts.valid
        totals["invalid"] += counts.invalid
        totals["refused"] += counts.refused
        invalid_reasons.update(counts.invalid_reasons)
        visibility_reasons.update(counts.visibility_reasons)
        for group, values in counts.groups.items():
            groups.setdefault(group, Counter()).update(values)
    return GeometryCounts(
        totals["total"], totals["valid"], totals["invalid"], totals["refused"],
        dict(invalid_reasons), dict(visibility_reasons),
        {name: dict(values) for name, values in groups.items()},
    )


@dataclass(frozen=True)
class WrittenRuleCounts:
    """Independent mask-rate components with unchanged written thresholds."""

    observations: int
    missing_measurements: int
    face_area_empty: int
    invalid_geometry: int
    skin_share_below: int
    skin_share_above: int
    eyes_outside: int

    def to_json(self) -> dict[str, Any]:
        return {
            "format": "beljour-region-rule-breakdown/1",
            "observations": self.observations,
            "missing_measurements": self.missing_measurements,
            "face_area_empty": self.face_area_empty,
            "invalid_geometry": self.invalid_geometry,
            "skin_share_below": self.skin_share_below,
            "skin_share_above": self.skin_share_above,
            "eyes_outside": self.eyes_outside,
            "status": "UNPROVEN",
        }


def written_rule_breakdown(diagnostics: Iterable[Mapping[str, Any]]) -> WrittenRuleCounts:
    """Measure the existing 0.45/0.97 skin and 0.95 eye thresholds.

    Each component may fail independently. An unknown or NaN measurement is
    missing, not an inferred success. Counts can overlap; they must not be
    added together to invent a new denominator or relaxed pass threshold.
    """
    totals: Counter[str] = Counter()
    for diagnostic in diagnostics:
        totals["observations"] += 1
        if diagnostic.get("invalid_geometry") is True:
            totals["invalid_geometry"] += 1
        area = diagnostic.get("face_area_px")
        if isinstance(area, (float, int)) and not isinstance(area, bool):
            if not 0 < area < float("inf"):
                totals["face_area_empty"] += 1
        else:
            totals["missing_measurements"] += 1
        share = diagnostic.get("skin_share")
        if isinstance(share, (float, int)) and not isinstance(share, bool):
            if not float("-inf") < share < float("inf"):
                totals["missing_measurements"] += 1
            elif share < 0.45:
                totals["skin_share_below"] += 1
            elif share > 0.97:
                totals["skin_share_above"] += 1
        else:
            totals["missing_measurements"] += 1
        contained = diagnostic.get("eyes_inside")
        if isinstance(contained, (float, int)) and not isinstance(contained, bool):
            if not float("-inf") < contained < float("inf"):
                totals["missing_measurements"] += 1
            elif contained < 0.95:
                totals["eyes_outside"] += 1
        else:
            totals["missing_measurements"] += 1
    return WrittenRuleCounts(
        totals["observations"], totals["missing_measurements"],
        totals["face_area_empty"], totals["invalid_geometry"],
        totals["skin_share_below"], totals["skin_share_above"],
        totals["eyes_outside"],
    )


@dataclass(frozen=True)
class MaskEligibility:
    """Independent synthetic mask measurements, not a frozen-set verdict."""

    empty_without_reason: tuple[str, ...]
    contradictory_visibility: tuple[str, ...]
    skin_share: float
    eyes_inside: float
    valid_geometry: bool
    eligible: bool

    def to_json(self) -> dict[str, Any]:
        return {
            "empty_without_reason": list(self.empty_without_reason),
            "contradictory_visibility": list(self.contradictory_visibility),
            "skin_share": self.skin_share,
            "eyes_inside": self.eyes_inside,
            "valid_geometry": self.valid_geometry,
            "eligible": self.eligible,
            "release_status": "UNPROVEN",
        }


def measure_mask_eligibility(
    masks: Mapping[str, np.ndarray],
    region_names: tuple[str, ...],
    *,
    not_visible: Mapping[str, str],
    invalid_geometry: bool,
) -> MaskEligibility:
    """Recompute core empty/skin/eye checks without trusting a PASS field.

    Missing, malformed, nonfinite or contradictory evidence is not eligible.
    The numerical comparisons are the existing written mask bounds: skin
    0.45--0.97, visible eyes at least 0.95 inside the visible oval. This
    function does not classify a subject or grant real-face acceptance.
    """
    if len(region_names) != len(set(region_names)) or set(masks) != set(region_names):
        raise ValueError("all named masks must be supplied exactly once")
    if not isinstance(invalid_geometry, bool):
        raise ValueError("geometry verdict must be measured as a boolean")
    for name, state in not_visible.items():
        if name not in region_names or state not in VISIBILITY_CAUSES:
            raise ValueError("not-visible reasons must be known geometric categories")
    arrays: dict[str, np.ndarray] = {}
    dimensions: tuple[int, int] | None = None
    for name in region_names:
        value = np.asarray(masks[name], dtype=np.float64)
        if value.ndim != 2 or min(value.shape) <= 0:
            raise ValueError("each region mask must be a nonempty two-dimensional plane")
        if dimensions is None:
            dimensions = value.shape
        if value.shape != dimensions:
            raise ValueError("all masks must share their original image dimensions")
        if not np.all(np.isfinite(value)) or np.any(value < 0) or np.any(value > 1):
            raise ValueError("region mask coverage must be finite in 0..1")
        arrays[name] = value
    for required in ("face_oval", "skin", "eyes"):
        if required not in arrays:
            raise ValueError("oval, skin and combined eyes are mandatory masks")
    oval = arrays["face_oval"]
    area = float(np.sum(oval))
    zero = tuple(sorted(name for name, mask in arrays.items() if float(np.sum(mask)) == 0))
    missing = tuple(name for name in zero if name not in not_visible)
    contradictory = tuple(sorted(
        name for name in not_visible if name not in zero
    ))
    skin_share = float(np.sum(arrays["skin"])) / area if area else 0.0
    eye_area = float(np.sum(arrays["eyes"]))
    if eye_area:
        eyes_inside = float(np.sum(arrays["eyes"] * oval)) / eye_area
    else:
        eyes_inside = 1.0 if "eyes" in not_visible else 0.0
    eligible = (
        area > 0
        and not missing
        and not contradictory
        and not invalid_geometry
        and 0.45 <= skin_share <= 0.97
        and eyes_inside >= 0.95
    )
    return MaskEligibility(missing, contradictory, skin_share, eyes_inside,
                           not invalid_geometry, bool(eligible))


@dataclass(frozen=True)
class IrisCounts:
    """Count-only iris audit; results cannot claim frozen acceptance."""

    total: int
    eligible: int
    refused: int
    edited_one: int
    edited_two: int
    undeclared_reasons: dict[str, int]
    declared_reasons: dict[str, int]
    groups: dict[str, dict[str, int]]

    def to_json(self) -> dict[str, Any]:
        """Export only category counts, never source pixels or per-person rows."""
        return {
            "format": "beljour-iris-counts/1",
            "total": self.total,
            "eligible": self.eligible,
            "refused": self.refused,
            "edited_one": self.edited_one,
            "edited_two": self.edited_two,
            "undeclared_reasons": dict(sorted(self.undeclared_reasons.items())),
            "declared_reasons": dict(sorted(self.declared_reasons.items())),
            "groups": {
                name: dict(sorted(counts.items()))
                for name, counts in sorted(self.groups.items())
            },
            "quality_verdict": "UNPROVEN",
        }


def iris_counts(
    results: Iterable[VisibleIrisResult],
    *,
    supplied_groups: Iterable[str] | None = None,
) -> IrisCounts:
    """Count eligible eyes and refusals without retaining rendered frames.

    Group assignments are supplied by the caller. This report does not infer
    skin tone, demographics, occlusion or any per-person information. Missing
    group labels and unknown diagnostic codes are rejected instead of guessed.
    """
    group_iterator = iter(supplied_groups) if supplied_groups is not None else None
    overall: Counter[str] = Counter()
    missing: Counter[str] = Counter()
    hidden: Counter[str] = Counter()
    groups: dict[str, Counter[str]] = {}
    for result in results:
        if not isinstance(result, VisibleIrisResult):
            raise ValueError("iris audit requires measured local render results")
        if result.visible_irises not in (0, 1, 2) or result.changed < 0:
            raise ValueError("iris render has an impossible measurement")
        if result.changed == 0 and result.visible_irises > 0:
            raise ValueError("iris render cannot count an unchanged visible iris")
        if result.changed > 0 and result.visible_irises == 0:
            raise ValueError("iris refusal cannot retain a partial edit")
        if result.reason not in ("measured_visible_iris", "iris_not_observed"):
            raise ValueError("iris render reason is not recognized")
        if result.eligible != (result.reason == "measured_visible_iris"):
            raise ValueError("iris render reason conflicts with eligibility")
        if group_iterator is None:
            group = "all"
        else:
            try:
                group = _validated_label(next(group_iterator))
            except StopIteration as exc:
                raise ValueError("group count differs from observation count") from exc
        for reason in result.undeclared_missing:
            if reason not in IRIS_MISSING_CODES:
                raise ValueError("unknown iris refusal reason")
            missing[reason] += 1
        for reason in result.declared_not_visible:
            if reason not in IRIS_HIDDEN_CODES:
                raise ValueError("unknown declared iris visibility reason")
            hidden[reason] += 1
        overall["total"] += 1
        outcome = "eligible" if result.eligible else "refused"
        overall[outcome] += 1
        selected = groups.setdefault(group, Counter())
        selected["total"] += 1
        selected[outcome] += 1
        if result.eligible:
            name = "edited_one" if result.visible_irises == 1 else "edited_two"
            overall[name] += 1
            selected[name] += 1
    if group_iterator is not None:
        try:
            next(group_iterator)
        except StopIteration:
            pass
        else:
            raise ValueError("group count differs from observation count")
    return IrisCounts(
        overall["total"], overall["eligible"], overall["refused"],
        overall["edited_one"], overall["edited_two"],
        dict(missing), dict(hidden),
        {name: dict(counts) for name, counts in groups.items()},
    )

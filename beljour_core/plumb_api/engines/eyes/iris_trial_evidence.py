"""Independent pixel and consent-local evidence for observed iris previews.

This module reports measured invariants, never an appearance-quality verdict.
It keeps no face pixels, identity fields, or per-person result logs.
Author: John Khan.
"""

from __future__ import annotations

import re
from collections import Counter
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Literal

import numpy as np

from .iris_trial import FaceBox, FloatPlane, IrisTrialResult, checked_box, face_support

Verdict = Literal["FAIL", "UNPROVEN"]
SLUG = re.compile(r"[a-z0-9_-]{1,32}\Z")


@dataclass(frozen=True)
class IrisAudit:
    status: str
    pixels: int
    changed_inside: int
    changed_outside: int
    off_mask_max_rgb: int
    changed_alpha: int
    changed_catchlights: int
    missing_guard: bool
    visibility_violations: int
    verdict: Verdict

    def to_counts(self) -> dict[str, object]:
        return {
            "format": "beljour-iris-audit/1",
            "status": self.status,
            "pixels": self.pixels,
            "changed_inside": self.changed_inside,
            "changed_outside": self.changed_outside,
            "off_mask_max_rgb": self.off_mask_max_rgb,
            "changed_alpha": self.changed_alpha,
            "changed_catchlights": self.changed_catchlights,
            "missing_guard": self.missing_guard,
            "visibility_violations": self.visibility_violations,
            "quality_verdict": self.verdict,
        }


def _checked_mask(values: object, shape: tuple[int, int]) -> FloatPlane:
    try:
        alpha = np.asarray(values, dtype=np.float64)
    except (TypeError, ValueError) as error:
        raise ValueError("iris audit needs numeric masks") from error
    if alpha.shape != shape or not np.all(np.isfinite(alpha)):
        raise ValueError("iris audit mask shape or finite alpha is invalid")
    if np.any((alpha < 0) | (alpha > 1)):
        raise ValueError("iris audit mask alpha must be in 0..1")
    return alpha


def audit_trial(
    before: np.ndarray, result: IrisTrialResult,
    masks: Mapping[str, object], box: FaceBox,
) -> IrisAudit:
    """Compare a full frame with independently supplied iris annotations.

    Preview thumbnails are not evaluated at a different resolution. The
    benchmark's 0.5 mask support boundary is used without dilation. A white
    catchlight in the original is protected even within measured iris support.
    """
    if before.dtype != np.uint8 or before.ndim != 3 or before.shape[2] not in (3, 4):
        raise ValueError("iris audit requires an RGB or RGBA byte frame")
    if result.image.dtype != np.uint8 or result.image.shape != before.shape:
        raise ValueError("iris audit requires full-resolution matching frames")
    if set(masks) != {"right_iris", "left_iris"}:
        raise ValueError("iris audit requires both observed iris masks")
    checked = checked_box(box)
    if checked is None:
        raise ValueError("iris audit requires a measured primary face box")
    height, width = before.shape[:2]
    primary = face_support((height, width), checked)
    right = _checked_mask(masks["right_iris"], (height, width))
    left = _checked_mask(masks["left_iris"], (height, width))
    selected = primary & ((right >= 0.5) | (left >= 0.5))
    raw = np.abs(before[..., :3].astype(np.int16) - result.image[..., :3].astype(np.int16))
    changed = np.any(raw != 0, axis=2)
    unauthorized = ~selected
    changed_outside = int(np.count_nonzero(changed & unauthorized))
    off_mask_max = int(np.max(raw[unauthorized])) if np.any(unauthorized) else 0
    changed_alpha = 0
    if before.shape[2] == 4:
        changed_alpha = int(np.count_nonzero(before[..., 3] != result.image[..., 3]))
    catchlight = np.min(before[..., :3], axis=2) >= 245
    changed_catchlights = int(np.count_nonzero(changed & catchlight & selected))
    missing_guard = result.status in ("rendered", "neutral") and not result.guard_called
    visible_count = int(bool(np.any(right >= 0.5))) + int(bool(np.any(left >= 0.5)))
    visibility_violations = int(
        result.status == "rendered" and result.visible_irises > visible_count
    )
    if result.status in ("refused", "no_mesh", "no_observation", "neutral") and np.any(changed):
        visibility_violations += 1
    failures = (
        changed_outside > 0 or changed_alpha > 0 or changed_catchlights > 0
        or missing_guard or visibility_violations > 0
    )
    return IrisAudit(
        result.status, height * width, int(np.count_nonzero(changed & selected)),
        changed_outside, off_mask_max, changed_alpha, changed_catchlights,
        missing_guard, visibility_violations, "FAIL" if failures else "UNPROVEN",
    )


@dataclass(frozen=True)
class IrisAuditCounts:
    """Whole-set counts without photographs, hashes, or individual measurements."""

    observations: int
    failures: int
    unproven: int
    statuses: dict[str, int]
    reasons: dict[str, int]
    groups: dict[str, dict[str, int]]

    def to_json(self) -> dict[str, object]:
        return {
            "format": "beljour-iris-counts/1",
            "observations": self.observations,
            "failures": self.failures,
            "unproven": self.unproven,
            "statuses": dict(sorted(self.statuses.items())),
            "reasons": dict(sorted(self.reasons.items())),
            "groups": {
                key: dict(sorted(value.items())) for key, value in sorted(self.groups.items())
            },
            "quality_verdict": "UNPROVEN" if self.failures == 0 else "FAIL",
        }


def _safe_group(label: str) -> str:
    if not isinstance(label, str) or SLUG.fullmatch(label) is None:
        raise ValueError("group must be an externally supplied aggregate slug")
    return label


def aggregate_trial_audits(
    observations: Iterable[IrisAudit], *, supplied_groups: Iterable[str] | None = None,
) -> IrisAuditCounts:
    """Stream count-only groups with exact group/observation cardinality."""
    iterator = iter(supplied_groups) if supplied_groups is not None else None
    totals: Counter[str] = Counter()
    statuses: Counter[str] = Counter()
    reasons: Counter[str] = Counter()
    groups: dict[str, Counter[str]] = {}
    for observation in observations:
        if not isinstance(observation, IrisAudit):
            raise ValueError("observations must be iris trial evidence")
        if iterator is None:
            group = "all"
        else:
            try:
                group = _safe_group(next(iterator))
            except StopIteration as error:
                raise ValueError("group/observation count differs") from error
        totals["observations"] += 1
        totals["failures" if observation.verdict == "FAIL" else "unproven"] += 1
        statuses[observation.status] += 1
        for name, count in (
            ("outside_mask", observation.changed_outside),
            ("alpha", observation.changed_alpha),
            ("catchlight", observation.changed_catchlights),
            ("identity_guard", int(observation.missing_guard)),
            ("visibility", observation.visibility_violations),
        ):
            if count:
                reasons[name] += 1
        selected = groups.setdefault(group, Counter())
        selected["observations"] += 1
        selected[observation.verdict.lower()] += 1
    if iterator is not None:
        try:
            next(iterator)
        except StopIteration:
            pass
        else:
            raise ValueError("group/observation count differs")
    return IrisAuditCounts(
        totals["observations"], totals["failures"], totals["unproven"],
        dict(statuses), dict(reasons), {key: dict(value) for key, value in groups.items()},
    )

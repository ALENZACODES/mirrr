"""Independent brow pixel-invariant measurements and count-only group reports.

Supplied masks define every eligible pixel. No landmarks, identity, group
membership or human appearance scores are inferred from photo content.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Literal

import numpy as np

from .trial import BrowTrialResult, ByteFrame, checked_image, checked_mask

Verdict = Literal["FAIL", "UNPROVEN"]
GROUP_LABEL = re.compile(r"[a-z0-9_-]{1,32}\Z")


@dataclass(frozen=True)
class BrowPixelEvidence:
    status: str
    observed_pixels: int
    changed_pixels: int
    changed_outside: int
    max_outside_rgb: int
    alpha_changes: int
    protected_changes: int
    guard_missing: bool
    texture_correlation: float | None
    mean_luma_change: float | None
    verdict: Verdict

    def safe_counts(self) -> dict[str, object]:
        return {
            "format": "beljour-brow-pixel-evidence/1",
            "status": self.status,
            "observed_pixels": self.observed_pixels,
            "changed_pixels": self.changed_pixels,
            "changed_outside": self.changed_outside,
            "max_outside_rgb": self.max_outside_rgb,
            "alpha_changes": self.alpha_changes,
            "protected_changes": self.protected_changes,
            "guard_missing": self.guard_missing,
            "texture_correlation": self.texture_correlation,
            "mean_luma_change": self.mean_luma_change,
            "quality_verdict": self.verdict,
        }


def _correlation(before: np.ndarray, after: np.ndarray) -> float | None:
    if before.size < 12:
        return None
    x = before - float(np.mean(before))
    y = after - float(np.mean(after))
    denominator = math.sqrt(float(np.sum(x * x)) * float(np.sum(y * y)))
    if denominator <= 1e-12:
        return None
    return max(-1.0, min(1.0, float(np.sum(x * y)) / denominator))


def audit_brow_trial(
    before: ByteFrame,
    result: BrowTrialResult,
    observed_masks: Mapping[str, object],
    protected: object | None = None,
) -> BrowPixelEvidence:
    """Audit a real output against independent externally supplied masks.

    The 0.5 support limit matches the renderer. Missing mask measurements
    are invalid evidence, never a zero-change quality pass.
    """
    checked_image(before)
    after = result.image
    checked_image(after)
    if after.shape != before.shape:
        raise ValueError("brow evidence needs full-size before and after")
    if set(observed_masks) != {"right_brow", "left_brow"}:
        raise ValueError("brow evidence needs both observed regions")
    shape = before.shape[:2]
    right = checked_mask(observed_masks["right_brow"], shape)
    left = checked_mask(observed_masks["left_brow"], shape)
    if np.any((right >= 0.5) & (left >= 0.5)):
        raise ValueError("independent brow regions must not overlap")
    permitted = (right >= 0.5) | (left >= 0.5)
    protected_region = np.zeros(shape, dtype=np.bool_)
    if protected is not None:
        protected_region = checked_mask(protected, shape) >= 0.5
        permitted &= ~protected_region
    delta = np.abs(before[..., :3].astype(np.int16) - after[..., :3].astype(np.int16))
    changed = np.any(delta != 0, axis=2)
    outside = ~permitted
    changed_outside = int(np.count_nonzero(changed & outside))
    outside_max = int(np.max(delta[outside])) if np.any(outside) else 0
    alpha_changes = 0
    if before.shape[2] == 4:
        alpha_changes = int(np.count_nonzero(before[..., 3] != after[..., 3]))
    protected_changes = int(np.count_nonzero(changed & protected_region))
    missing_guard = result.status in ("rendered", "neutral") and not result.guard_called
    changed_in_refusal = result.status not in ("rendered", "neutral") and bool(np.any(changed))
    failed = (
        changed_outside > 0 or alpha_changes > 0 or protected_changes > 0
        or missing_guard or changed_in_refusal
    )
    luminance_weights = np.array((0.2126, 0.7152, 0.0722))
    old_luma = before[..., :3].astype(np.float64) @ luminance_weights
    new_luma = after[..., :3].astype(np.float64) @ luminance_weights
    observed_count = int(np.count_nonzero(permitted))
    correlation = _correlation(old_luma[permitted], new_luma[permitted])
    mean_shift = float(np.mean(new_luma[permitted] - old_luma[permitted])) if observed_count else None
    return BrowPixelEvidence(
        result.status,
        observed_count,
        int(np.count_nonzero(changed & permitted)),
        changed_outside,
        outside_max,
        alpha_changes,
        protected_changes,
        missing_guard,
        correlation,
        mean_shift,
        "FAIL" if failed else "UNPROVEN",
    )


@dataclass(frozen=True)
class BrowAggregate:
    observations: int
    failures: int
    unproven: int
    statuses: dict[str, int]
    groups: dict[str, dict[str, int]]

    def safe_counts(self) -> dict[str, object]:
        return {
            "format": "beljour-brow-group-counts/1",
            "observations": self.observations,
            "failures": self.failures,
            "unproven": self.unproven,
            "statuses": dict(sorted(self.statuses.items())),
            "groups": {label: dict(sorted(row.items())) for label, row in sorted(self.groups.items())},
            "quality_verdict": "FAIL" if self.failures else "UNPROVEN",
        }


def aggregate_brow_evidence(
    values: Iterable[BrowPixelEvidence], groups: Iterable[str] | None = None,
) -> BrowAggregate:
    """Emit only anonymous group counts, never input metadata or image bytes."""
    group_names = iter(groups) if groups is not None else None
    statuses: Counter[str] = Counter()
    totals: Counter[str] = Counter()
    group_counts: dict[str, Counter[str]] = {}
    for observation in values:
        if not isinstance(observation, BrowPixelEvidence):
            raise ValueError("brow aggregate requires independently measured evidence")
        if group_names is None:
            label = "all"
        else:
            try:
                label = next(group_names)
            except StopIteration as error:
                raise ValueError("group count does not match observations") from error
            if not isinstance(label, str) or GROUP_LABEL.fullmatch(label) is None:
                raise ValueError("group labels must be short anonymous slugs")
        totals["observations"] += 1
        totals["failures" if observation.verdict == "FAIL" else "unproven"] += 1
        statuses[observation.status] += 1
        counter = group_counts.setdefault(label, Counter())
        counter["observations"] += 1
        counter[observation.verdict.lower()] += 1
    if group_names is not None:
        try:
            next(group_names)
        except StopIteration:
            pass
        else:
            raise ValueError("group count does not match observations")
    return BrowAggregate(
        totals["observations"], totals["failures"], totals["unproven"],
        dict(statuses), {key: dict(counter) for key, counter in group_counts.items()},
    )


@dataclass(frozen=True)
class BrowSideEvidence:
    """Observed support per side, without a subjective appearance rating."""

    side: str
    status: str
    observed_pixels: int
    changed_pixels: int
    mean_rgb_change: float | None

    def safe_counts(self) -> dict[str, object]:
        return {
            "side": self.side,
            "status": self.status,
            "observed_pixels": self.observed_pixels,
            "changed_pixels": self.changed_pixels,
            "mean_rgb_change": self.mean_rgb_change,
            "quality_verdict": "UNPROVEN" if self.status != "INVALID" else "FAIL",
        }


def brow_side_evidence(
    before: ByteFrame,
    result: BrowTrialResult,
    masks: Mapping[str, object],
    states: Mapping[str, str],
) -> tuple[BrowSideEvidence, BrowSideEvidence]:
    """Measure right/left independently, including an observed hidden-side state."""
    checked_image(before)
    checked_image(result.image)
    if result.image.shape != before.shape:
        raise ValueError("brow sides need full-resolution matched frames")
    if set(masks) != {"right_brow", "left_brow"} or set(states) != set(masks):
        raise ValueError("brow sides need two masks and matching visibility")
    report: list[BrowSideEvidence] = []
    for side in ("right_brow", "left_brow"):
        region = checked_mask(masks[side], before.shape[:2]) >= 0.5
        count = int(np.count_nonzero(region))
        state = states[side]
        if state == "visible":
            status = "MEASURED" if count >= 8 else "INVALID"
        elif state in ("not_visible:hidden_by_turn", "not_visible:occluded"):
            status = "DECLARED_NOT_VISIBLE" if count == 0 else "INVALID"
        else:
            status = "INVALID"
        differences = np.abs(
            before[..., :3].astype(np.int16) - result.image[..., :3].astype(np.int16)
        )
        changed = int(np.count_nonzero(np.any(differences[region] != 0, axis=1))) if count else 0
        mean = float(np.mean(differences[region])) if count else None
        report.append(BrowSideEvidence(side, status, count, changed, mean))
    return report[0], report[1]

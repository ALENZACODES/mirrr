"""Measure observed iris tone and texture retention without guessing anatomy.

These are colour-and-pixel measurements on supplied iris/pupil regions. They
cannot substitute for a real-face human review or identity verification.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np

from .iris_trial import ByteFrame, FloatPlane


@dataclass(frozen=True)
class IrisToneMetrics:
    side: str
    status: str
    observed_pixels: int
    changed_pixels: int
    mean_rgb_shift: float | None
    mean_lightness_shift: float | None
    texture_correlation: float | None
    catchlight_changes: int
    pupil_changes: int | None

    def safe_counts(self) -> dict[str, object]:
        return {
            "side": self.side,
            "status": self.status,
            "observed_pixels": self.observed_pixels,
            "changed_pixels": self.changed_pixels,
            "mean_rgb_shift": self.mean_rgb_shift,
            "mean_lightness_shift": self.mean_lightness_shift,
            "texture_correlation": self.texture_correlation,
            "catchlight_changes": self.catchlight_changes,
            "pupil_changes": self.pupil_changes,
            "quality_verdict": "UNPROVEN",
        }


@dataclass(frozen=True)
class IrisToneReport:
    right: IrisToneMetrics
    left: IrisToneMetrics
    outside_max_abs_diff: int
    alpha_changes: int
    verdict: str

    def safe_counts(self) -> dict[str, object]:
        return {
            "format": "beljour-iris-tone/1",
            "right": self.right.safe_counts(),
            "left": self.left.safe_counts(),
            "outside_max_abs_diff": self.outside_max_abs_diff,
            "alpha_changes": self.alpha_changes,
            "quality_verdict": self.verdict,
        }


def _valid_frame(frame: ByteFrame) -> None:
    if frame.dtype != np.uint8 or frame.ndim != 3 or frame.shape[2] not in (3, 4):
        raise ValueError("iris tone requires a uint8 RGB or RGBA frame")
    if min(frame.shape[:2]) < 8:
        raise ValueError("iris tone requires an image at least 8 pixels on each side")


def _mask(value: object, shape: tuple[int, int]) -> FloatPlane:
    try:
        arr = np.asarray(value, dtype=np.float64)
    except (TypeError, ValueError) as error:
        raise ValueError("iris tone mask needs numeric alpha") from error
    if arr.shape != shape or not np.all(np.isfinite(arr)):
        raise ValueError("iris tone mask must match image dimensions and be finite")
    if np.any((arr < 0) | (arr > 1)):
        raise ValueError("iris tone mask must be in 0..1")
    return arr


def _lightness(rgb: np.ndarray) -> np.ndarray:
    """Linear brightness proxy only, not an estimated skin or iris identity."""
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def _correlation(a: np.ndarray, b: np.ndarray) -> float | None:
    if a.size < 12:
        return None
    x = a - float(np.mean(a))
    y = b - float(np.mean(b))
    denominator = math.sqrt(float(np.sum(x * x)) * float(np.sum(y * y)))
    if denominator <= 1e-12:
        return None
    return max(-1.0, min(1.0, float(np.sum(x * y)) / denominator))


def iris_tone_quality(
    before: ByteFrame, after: ByteFrame,
    iris_masks: Mapping[str, object],
    pupil_masks: Mapping[str, object] | None = None,
) -> IrisToneReport:
    """Return per-side, independently measured colour and texture evidence.

    The caller must supply both iris masks, and may supply two pupil masks.
    An absent observed iris is NOT_MEASURED, never a quality pass. Soft mask
    samples below 0.5 remain outside the edited support boundary.
    """
    _valid_frame(before)
    _valid_frame(after)
    if before.shape != after.shape:
        raise ValueError("iris tone images need identical dimensions")
    if set(iris_masks) != {"right_iris", "left_iris"}:
        raise ValueError("iris tone requires two supplied iris masks")
    if pupil_masks is not None and set(pupil_masks) != set(iris_masks):
        raise ValueError("both pupil masks are required together")
    shape = before.shape[:2]
    masks = {key: _mask(value, shape) for key, value in iris_masks.items()}
    pupils = {
        key: _mask(pupil_masks[key], shape) if pupil_masks is not None else None
        for key in ("right_iris", "left_iris")
    }
    difference = np.abs(
        before[..., :3].astype(np.int16) - after[..., :3].astype(np.int16)
    )
    selected = (masks["right_iris"] >= 0.5) | (masks["left_iris"] >= 0.5)
    outside = int(np.max(difference[~selected])) if np.any(~selected) else 0
    alpha_changes = 0
    if before.shape[2] == 4:
        alpha_changes = int(np.count_nonzero(before[..., 3] != after[..., 3]))
    original_light = _lightness(before[..., :3].astype(np.float64))
    revised_light = _lightness(after[..., :3].astype(np.float64))
    metrics: dict[str, IrisToneMetrics] = {}
    for side in ("right_iris", "left_iris"):
        selected_side = masks[side] >= 0.5
        count = int(np.count_nonzero(selected_side))
        if count == 0:
            metrics[side] = IrisToneMetrics(
                side, "NOT_MEASURED", 0, 0, None, None, None, 0,
                None if pupil_masks is None else 0,
            )
            continue
        changed = np.any(difference[selected_side] != 0, axis=1)
        shift = difference[selected_side].astype(np.float64)
        luminance = revised_light[selected_side] - original_light[selected_side]
        observed_catchlight = np.min(before[..., :3], axis=2) >= 245
        caught = selected_side & observed_catchlight
        catchlight_changes = int(np.count_nonzero(
            caught & np.any(difference != 0, axis=2)
        ))
        pupil = pupils[side]
        pupil_changes = None
        if pupil is not None:
            pupil_changes = int(np.count_nonzero(
                (pupil >= 0.5) & np.any(difference != 0, axis=2)
            ))
        metrics[side] = IrisToneMetrics(
            side, "MEASURED", count, int(np.count_nonzero(changed)),
            float(np.mean(shift)), float(np.mean(luminance)),
            _correlation(original_light[selected_side], revised_light[selected_side]),
            catchlight_changes, pupil_changes,
        )
    failures = outside > 0 or alpha_changes > 0 or any(
        item.catchlight_changes > 0 or (item.pupil_changes is not None and item.pupil_changes > 0)
        for item in metrics.values()
    )
    return IrisToneReport(
        metrics["right_iris"], metrics["left_iris"], outside, alpha_changes,
        "FAIL" if failures else "UNPROVEN",
    )


def measured_gate_row(
    report: IrisToneReport, *, visible_irises: int,
    undeclared_missing: tuple[str, ...],
    shape_observed: bool | None,
    guard_called: bool,
) -> dict[str, object]:
    """Map independent measurements to the existing iris definition fields.

    Shape is supplied by the geometry owner. Unknown shape remains unknown,
    never inferred from visually unchanged pixels. A row is evidence only;
    no synthetic row becomes a frozen-face or human-quality PASS.
    """
    if visible_irises not in (0, 1, 2):
        raise ValueError("measured visible iris count must be 0, 1 or 2")
    if shape_observed is not None and not isinstance(shape_observed, bool):
        raise ValueError("shape evidence must be a measured boolean or unknown")
    if not isinstance(guard_called, bool):
        raise ValueError("identity guard evidence must be a boolean")
    if not isinstance(undeclared_missing, tuple) or any(
        not isinstance(reason, str) for reason in undeclared_missing
    ):
        raise ValueError("missing-iris reason codes must be a tuple of strings")
    catchlight_unchanged = all(
        item.catchlight_changes == 0 and (
            item.pupil_changes is None or item.pupil_changes == 0
        )
        for item in (report.right, report.left)
    )
    return {
        "outside_unchanged": report.outside_max_abs_diff == 0 and report.alpha_changes == 0,
        "catchlight_unchanged": catchlight_unchanged,
        "shape_ok": shape_observed,
        "visible_irises": visible_irises,
        "undeclared_missing": list(undeclared_missing),
        "guard_called": guard_called,
        "quality_verdict": "UNPROVEN" if report.verdict == "UNPROVEN" else "FAIL",
    }

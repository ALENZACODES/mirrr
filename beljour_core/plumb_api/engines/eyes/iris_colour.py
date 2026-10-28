"""Eight original iris colours retaining light, pupil and limbal boundary.

A trusted iris segmentation is mandatory; this does not invent an iris from a
face oval. The caller can optionally pass a separate pupil mask. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np

from plumb_api.engines.shade.colourspace import lab_to_srgb, srgb_to_lab, to_bytes

SHADES: dict[str, tuple[float, float]] = {
    "forest": (-12.0, 10.0), "hazel": (8.0, 24.0), "slate": (0.0, -5.0),
    "amber": (12.0, 31.0), "ocean": (-4.0, -15.0), "olive": (-8.0, 18.0),
    "cocoa": (10.0, 17.0), "smoke": (2.0, -1.0),
}
LABEL = "Eye colour simulation. Eye details come from your original photo."


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    alpha: np.ndarray
    reason: str
    changed: int


def iris_colour(
    image: np.ndarray,
    iris: np.ndarray,
    *,
    shade: str = "forest",
    strength: float = 65.0,
    pupil: np.ndarray | None = None,
) -> Result:
    if (
        image.dtype != np.uint8
        or image.ndim != 3
        or image.shape[2] != 3
        or min(image.shape[:2]) < 8
    ):
        raise ValueError("iris colour needs an RGB uint8 photograph >=8px")
    if (
        iris.shape != image.shape[:2]
        or not np.isfinite(iris).all()
        or np.any((iris < 0) | (iris > 1))
    ):
        raise ValueError("iris mask must be a 0..1 image plane")
    if pupil is not None and (
        pupil.shape != iris.shape
        or not np.isfinite(pupil).all()
        or np.any((pupil < 0) | (pupil > 1))
    ):
        raise ValueError("pupil mask must be a 0..1 image plane")
    if shade not in SHADES:
        raise ValueError("unknown original iris shade")
    if not np.isfinite(strength) or not 0 <= strength <= 100:
        raise ValueError("strength out of range")
    zeros = np.zeros(iris.shape)
    region = iris >= 0.5
    if np.count_nonzero(region) < 12 or strength == 0:
        return Result(image.copy(), zeros, "iris unobserved or eye closed", 0)
    yy, xx = np.nonzero(region)
    mid_x = (float(np.min(xx)) + float(np.max(xx))) / 2
    mid_y = (float(np.min(yy)) + float(np.max(yy))) / 2
    rx = max((float(np.max(xx)) - float(np.min(xx))) / 2, 1)
    ry = max((float(np.max(yy)) - float(np.min(yy))) / 2, 1)
    ys, xs = np.indices(region.shape)
    radial = np.sqrt(((xs - mid_x) / rx) ** 2 + ((ys - mid_y) / ry) ** 2)
    lab = srgb_to_lab(image)
    protected = (radial <= 0.35) | (lab[..., 0] > 85)
    if pupil is not None:
        protected |= pupil >= 0.5
    valid = region & ~protected
    amount = np.where(valid, strength / 100 * 0.7, 0.0)
    revised = lab.copy()
    revised[..., 1] += amount * (SHADES[shade][0] - revised[..., 1])
    revised[..., 2] += amount * (SHADES[shade][1] - revised[..., 2])
    ring = valid & (radial >= 0.88)
    revised[..., 0] -= ring * amount * 7.0
    converted = to_bytes(lab_to_srgb(revised))
    result = image.copy()
    result[valid] = converted[valid]
    return Result(result, amount, "measured local edit", int(np.count_nonzero(valid)))


@dataclass(frozen=True)
class VisibleIrisResult:
    """Measured visible-eye render; an unexplained empty iris is not success."""

    image: np.ndarray
    alpha: np.ndarray
    changed: int
    visible_irises: int
    declared_not_visible: tuple[str, ...]
    undeclared_missing: tuple[str, ...]
    reason: str

    @property
    def eligible(self) -> bool:
        return self.visible_irises > 0 and not self.undeclared_missing and self.changed > 0


def recolour_visible(
    image: np.ndarray,
    iris_masks: Mapping[str, np.ndarray],
    states: Mapping[str, str],
    *,
    shade: str = "hazel",
    strength: float = 65.0,
) -> VisibleIrisResult:
    """Render only confirmed disjoint irises, or return the original unchanged.

    Validation and visibility checks finish before the first pixel is edited.
    A hidden/closed eye can be absent, but unexplained missing, overlapping,
    or contradictory iris evidence refuses the whole edit. No pixels from a
    partially edited frame escape on refusal.
    """
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] != 3:
        raise ValueError("visible iris editing requires uint8 RGB pixels")
    if min(image.shape[:2]) < 8:
        raise ValueError("visible iris editing requires an image at least 8px")
    if shade not in SHADES:
        raise ValueError("unknown original iris shade")
    if not isinstance(strength, (float, int)) or not np.isfinite(strength):
        raise ValueError("strength must be finite and in 0..100")
    if not 0 <= strength <= 100:
        raise ValueError("strength must be finite and in 0..100")
    if set(iris_masks) != {"right_iris", "left_iris"}:
        raise ValueError("both measured iris mask keys are required")

    checked: dict[str, np.ndarray] = {}
    for name in ("right_iris", "left_iris"):
        try:
            mask = np.asarray(iris_masks[name], dtype=np.float64)
        except (TypeError, ValueError) as exc:
            raise ValueError("iris masks must contain finite alpha in 0..1") from exc
        if mask.shape != image.shape[:2]:
            raise ValueError("iris mask dimensions must match the original")
        if not np.all(np.isfinite(mask)) or np.any((mask < 0) | (mask > 1)):
            raise ValueError("iris masks must contain finite alpha in 0..1")
        checked[name] = mask

    missing: list[str] = []
    hidden: list[str] = []
    visible: list[str] = []
    for side in ("right", "left"):
        name = side + "_iris"
        mask = checked[name]
        state = states.get(name, "empty")
        if state in ("not_visible:closed", "not_visible:hidden_by_turn"):
            if np.any(mask > 0):
                missing.append(side + ":inconsistent_hidden_mask")
            else:
                hidden.append(side + ":" + state.split(":", 1)[1])
            continue
        if state != "visible" or np.count_nonzero(mask >= 0.5) < 12:
            missing.append(side + ":unobserved")
            continue
        visible.append(name)

    if len(visible) == 2:
        overlap = (checked["right_iris"] >= 0.5) & (checked["left_iris"] >= 0.5)
        if np.any(overlap):
            missing.append("iris_masks_overlap")
    blank = np.zeros(image.shape[:2], dtype=np.float64)
    if missing or not visible:
        return VisibleIrisResult(
            image.copy(), blank, 0, 0, tuple(hidden), tuple(missing), "iris_not_observed"
        )

    result = image.copy()
    coverage = blank
    edited = 0
    count = 0
    for name in visible:
        recoloured = iris_colour(result, checked[name], shade=shade, strength=strength)
        if recoloured.changed == 0:
            return VisibleIrisResult(
                image.copy(), blank, 0, 0, tuple(hidden),
                (name.split("_", 1)[0] + ":no_edit",), "iris_not_observed"
            )
        result = recoloured.image
        coverage = np.maximum(coverage, recoloured.alpha)
        edited += recoloured.changed
        count += 1
    return VisibleIrisResult(
        result, coverage, edited, count, tuple(hidden), (), "measured_visible_iris"
    )

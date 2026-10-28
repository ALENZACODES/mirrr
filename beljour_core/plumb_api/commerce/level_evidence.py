"""Per-strength frame evidence measured from the final guarded pixels.

Evidence is computed from what the engine actually returned, never from the
planned strength: changed pixels inside the caller's editable region, the mean
and largest channel change, and proof that alpha and every pixel outside the
region are untouched. A level whose pixels are identical to the source is
recorded as unchanged, and a refusal keeps its code, so all five stops stay in
one denominator. Local simulation only; nothing here is a quality or
real-face result. Mirrored in web/src/commerce/level-board.ts.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from .strength import validate_level

FIVE_LEVELS: tuple[float, ...] = (1.0, 2.0, 3.0, 4.0, 5.0)
Status = Literal["rendered", "unchanged", "refused"]
STATUSES: tuple[Status, ...] = ("rendered", "unchanged", "refused")
U8 = NDArray[np.uint8]


class FrameEvidenceError(ValueError):
    """An engine returned pixels that broke the alpha or region contract."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class FrameEvidence:
    """Numbers only: no pixels, masks, hashes or landmarks."""

    level: float
    status: Status
    changed_pixels: int
    region_pixels: int
    changed_share: float
    mean_delta: float
    max_delta: int
    identity_similarity: float | None
    identity_blended: bool | None
    guard_applied: bool
    refusal_code: str | None = None

    def public(self) -> dict[str, object]:
        return {
            "level": self.level, "status": self.status,
            "changed_pixels": self.changed_pixels, "region_pixels": self.region_pixels,
            "changed_share": self.changed_share, "mean_delta": self.mean_delta,
            "max_delta": self.max_delta, "identity_similarity": self.identity_similarity,
            "identity_blended": self.identity_blended, "guard_applied": self.guard_applied,
            "refusal_code": self.refusal_code,
        }


def _round(value: float) -> float:
    return round(float(value), 4)


def frame_evidence(before: object, after: object, region: object, level: object, *,
                   similarity: float, blended: bool, guard_applied: bool) -> FrameEvidence:
    """Measure one rendered stop; any edit outside the region or to alpha is an error."""
    stop = validate_level(level)
    source = np.asarray(before)
    output = np.asarray(after)
    allowed = np.asarray(region)
    if (source.dtype != np.uint8 or output.dtype != np.uint8 or source.ndim != 3 or
            source.shape != output.shape or source.shape[2] not in (3, 4)):
        raise FrameEvidenceError("invalid_output", "Rendered frame does not match its source")
    if allowed.dtype != np.bool_ or allowed.shape != source.shape[:2]:
        raise FrameEvidenceError("invalid_mask", "Editable region must be an image-shaped boolean mask")
    if source.shape[2] == 4 and not np.array_equal(source[..., 3], output[..., 3]):
        raise FrameEvidenceError("alpha_changed", "A strength stop changed photo transparency")
    difference = np.abs(source[..., :3].astype(np.int16) - output[..., :3].astype(np.int16))
    moved = np.any(difference > 0, axis=-1)
    if bool(np.any(moved & ~allowed)):
        raise FrameEvidenceError("protected_change", "A strength stop edited pixels outside the hair region")
    changed = int(moved.sum())
    region_pixels = int(allowed.sum())
    if not np.isfinite(similarity) or not 0.0 <= similarity <= 1.0:
        raise FrameEvidenceError("invalid_output", "Identity similarity must lie in [0, 1]")
    mean = float(difference[moved].mean()) / 255.0 if changed else 0.0
    return FrameEvidence(
        level=stop, status="rendered" if changed else "unchanged", changed_pixels=changed,
        region_pixels=region_pixels,
        changed_share=_round(changed / region_pixels) if region_pixels else 0.0,
        mean_delta=_round(mean), max_delta=int(difference.max()) if changed else 0,
        identity_similarity=_round(similarity), identity_blended=bool(blended),
        guard_applied=bool(guard_applied),
    )


def refused_evidence(level: object, code: str, region_pixels: int = 0) -> FrameEvidence:
    """A refusal stays in the denominator with its code and no pixel claims."""
    if not isinstance(code, str) or not code or len(code) > 48:
        raise ValueError("Refusal code must be a short string")
    if type(region_pixels) is not int or region_pixels < 0:
        raise ValueError("Region pixel count must be a nonnegative integer")
    return FrameEvidence(validate_level(level), "refused", 0, region_pixels, 0.0, 0.0, 0,
                         None, None, False, code)


@dataclass(frozen=True)
class LevelTotals:
    rendered: int
    unchanged: int
    refused: int

    @property
    def cases(self) -> int:
        return self.rendered + self.unchanged + self.refused

    def public(self) -> dict[str, int]:
        return {"rendered": self.rendered, "unchanged": self.unchanged,
                "refused": self.refused, "cases": self.cases}


def totals(evidence: tuple[FrameEvidence, ...]) -> LevelTotals:
    """Exact five-stop counts; the denominator always includes unchanged and refused."""
    levels = tuple(item.level for item in evidence)
    if levels != FIVE_LEVELS:
        raise ValueError("Evidence must cover exactly the five strength stops in order")
    return LevelTotals(*(sum(1 for item in evidence if item.status == status)
                         for status in STATUSES))

"""Diagnostic triage before the hair-fibre cover renderer, with every case counted.

Before the existing guarded CoverSession.render runs, an input is checked for the
four reasons a fibre preview cannot be judged. Each gives a coded ``not_applicable``
outcome that stays in the denominator; none is retried with guessed geometry:

* ``no_mesh``: no valid primary-head landmarks;
* ``insufficient_hair``: fewer than MIN_HAIR_PIXELS marked hair pixels outside the
  marked scalp (ASSUMED 64; the renderer itself only needs 8);
* ``too_dark``: median L* of the marked region below DARK_LIGHTNESS (ASSUMED 8), too
  dark to read hair from scalp;
* ``low_detail``: L* standard deviation of the hair pixels below MIN_DETAIL (ASSUMED
  0.25), a flat area with no strand detail to follow.

An eligible input goes to the unchanged renderer; its own refusals are kept as
``refused`` and a level-1.0 result that changes nothing as ``unchanged``.
Simulation of a topical product, not a diagnosis. Mirrored in
web/src/commerce/fibre-evidence.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from ..core.colour import srgb_to_lab_array
from .cover import CoverRefusal, CoverResult, CoverSession, HeadLandmarks, Zone

MIN_HAIR_PIXELS = 64
DARK_LIGHTNESS = 8.0
MIN_DETAIL = 0.25
TriageStatus = Literal["eligible", "not_applicable", "rendered", "unchanged", "refused"]
STATUSES: tuple[TriageStatus, ...] = ("not_applicable", "rendered", "unchanged", "refused")

__all__ = ["TriageOutcome", "TriageSummary", "cover_with_triage", "summarize_triage", "triage_cover"]


@dataclass(frozen=True, slots=True)
class TriageOutcome:
    status: TriageStatus
    code: str | None
    hair_pixels: int
    result: CoverResult | None = None

    def public(self) -> dict[str, Any]:
        return {"status": self.status, "code": self.code, "hair_pixels": self.hair_pixels,
                "render": None if self.result is None else self.result.public()}


def _mask(value: object, shape: tuple[int, int]) -> np.ndarray | None:
    data = np.asarray(value)
    if data.shape != shape or data.dtype not in (np.bool_, np.uint8, np.float32, np.float64):
        return None
    if data.dtype == np.uint8:
        return np.asarray(data >= 128)
    as_float = data.astype(np.float64)
    if not np.all(np.isfinite(as_float)) or bool(np.any(as_float < 0)) or bool(np.any(as_float > 1)):
        return None
    return np.asarray(as_float >= 0.5)


def triage_cover(image: object, hair_region: object, scalp_show: object, *,
                 landmarks: HeadLandmarks | None) -> TriageOutcome:
    """``eligible`` or a coded ``not_applicable``; never renders."""
    if not isinstance(landmarks, HeadLandmarks):
        return TriageOutcome("not_applicable", "no_mesh", 0)
    try:
        landmarks.validate()
    except ValueError:
        return TriageOutcome("not_applicable", "no_mesh", 0)
    pixels = np.asarray(image)
    if pixels.dtype != np.uint8 or pixels.ndim != 3 or pixels.shape[2] not in (3, 4):
        raise ValueError("Fibre triage needs a uint8 RGB or RGBA photo")
    shape = (int(pixels.shape[0]), int(pixels.shape[1]))
    region, scalp = _mask(hair_region, shape), _mask(scalp_show, shape)
    if region is None or scalp is None:
        raise ValueError("Hair and scalp masks must match the photo and lie in 0..1 (or 0..255)")
    hair = region & ~scalp
    count = int(hair.sum())
    if count < MIN_HAIR_PIXELS:
        return TriageOutcome("not_applicable", "insufficient_hair", count)
    lightness = srgb_to_lab_array(pixels[..., :3][region].astype(np.float64))[:, 0]
    if float(np.median(lightness)) < DARK_LIGHTNESS:
        return TriageOutcome("not_applicable", "too_dark", count)
    hair_l = srgb_to_lab_array(pixels[..., :3][hair].astype(np.float64))[:, 0]
    if float(np.std(hair_l)) < MIN_DETAIL:
        return TriageOutcome("not_applicable", "low_detail", count)
    return TriageOutcome("eligible", None, count)


def cover_with_triage(session: CoverSession, image: object, hair_region: object, scalp_show: object, *,
                      landmarks: HeadLandmarks | None, zone: Zone = "crown", level: object = 3.0) -> TriageOutcome:
    """Triage, then the existing guarded renderer for eligible inputs only."""
    found = triage_cover(image, hair_region, scalp_show, landmarks=landmarks)
    if found.status != "eligible":
        return found
    result = session.render(image, hair_region, scalp_show, zone=zone, level=level, landmarks=landmarks)
    if isinstance(result, CoverRefusal):
        return TriageOutcome("refused", result.code, found.hair_pixels)
    return TriageOutcome("rendered" if result.changed_pixels else "unchanged", None, found.hair_pixels, result)


@dataclass(frozen=True, slots=True)
class TriageSummary:
    total: int
    counts: tuple[tuple[str, int], ...]
    codes: tuple[tuple[str, int], ...]

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-fibre-triage/1", "total": self.total, "statuses": dict(self.counts),
                "codes": dict(self.codes), "kind": "synthetic_or_user_inputs", "provider_calls": 0}


def summarize_triage(outcomes: Iterable[TriageOutcome]) -> TriageSummary:
    """Counts by status and code; not_applicable and refused cases stay in the total."""
    rows = list(outcomes)
    if not all(isinstance(r, TriageOutcome) and r.status != "eligible" for r in rows):
        raise ValueError("Summaries take finished triage outcomes")
    codes: dict[str, int] = {}
    for r in rows:
        if r.code is not None:
            codes[r.code] = codes.get(r.code, 0) + 1
    return TriageSummary(len(rows), tuple((s, sum(r.status == s for r in rows)) for s in STATUSES),
                         tuple(sorted(codes.items())))

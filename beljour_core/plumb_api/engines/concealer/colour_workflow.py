"""Corrected hair readings to a guarded, tinted fibre preview with final-pixel evidence.

1. Two to six corrected hair readings go through ``colour_stability`` (mixed or
   uncorrected light refuses; every reading must pick the same swatch).
2. The agreed swatch, or a visitor-chosen two-swatch mix of it (``two_tone``), is
   the pigment for the existing local, mask-limited ``CoverSession.render`` with its
   default identity guard and validated 1.0-5.0 strength.
3. Moving (interactive) frames return ``preview_only`` receipts with no colour
   claim. Released frames are audited with ``colour_evidence.audit_final_colour``
   against the chosen swatch, inside the marked scalp of the marked hair region.

Repeated levels on the same photo and masks reuse one prepared zone computation
in the session. No provider is called. Receipts carry levels, codes, counts and
distances only: never photos, masks, landmarks, hashes or credentials. Mirrored
in web/src/commerce/colour-workflow.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from ...commerce.strength import validate_level
from ..hair_palette.catalogue import require_shade
from .colour_evidence import FinalColourEvidence, audit_final_colour
from .colour_stability import assess_colour_stability
from .cover import CoverGuard, CoverRefusal, CoverSession, HeadLandmarks, Zone, _binary_mask, _primary_clip
from .shade_support import FibreReading
from .two_tone import TwoTonePlan, plan_two_tone

Phase = Literal["moving", "release"]
Status = Literal["preview_only", "rendered_closer", "adverse_shift", "unchanged", "refused"]


@dataclass(frozen=True, slots=True)
class TintPlan:
    """The pigment chosen from the readings, or the code that stopped the workflow."""

    code: str | None
    swatch_id: str | None
    rgb: tuple[int, int, int] | None
    lab: tuple[float, float, float] | None
    two_tone: TwoTonePlan | None

    @property
    def refused(self) -> bool:
        return self.code is not None

    def public(self) -> dict[str, Any]:
        return {"refused": self.refused, "code": self.code, "swatch_id": self.swatch_id,
                "rgb": None if self.rgb is None else list(self.rgb),
                "two_tone": None if self.two_tone is None else self.two_tone.public()}


def plan_tint(readings: Sequence[FibreReading], *, approve_lighter: bool = False,
              second_id: str | None = None) -> TintPlan:
    """Agree on a swatch from the readings; optionally mix it with a second chosen swatch."""
    stability = assess_colour_stability(readings, approve_lighter=approve_lighter)
    if stability.code is not None or stability.plan is None or stability.plan.best is None:
        return TintPlan(stability.code or "too_far", None, None, None, None)
    shade = require_shade(stability.plan.best.record.id)
    if second_id is None:
        return TintPlan(None, shade.id, shade.rgb, shade.lab, None)
    mix = plan_two_tone(stability.plan.reading, shade.id, second_id, approve_lighter=approve_lighter)
    if mix.best is None:
        return TintPlan(mix.code, shade.id, None, None, mix)
    return TintPlan(None, shade.id, mix.best.rgb, mix.best.lab, mix)


@dataclass(frozen=True, slots=True)
class TintReceipt:
    level: float
    phase: Phase
    status: Status
    code: str | None
    swatch_id: str | None
    second_id: str | None
    second_percent: int | None
    changed_pixels: int
    identity_similarity: float | None
    identity_blended: bool | None
    evidence: FinalColourEvidence | None
    provider_calls: int = 0

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-tinted-fibre-receipt/1", "level": self.level, "phase": self.phase,
                "status": self.status, "code": self.code, "swatch_id": self.swatch_id,
                "second_id": self.second_id, "second_percent": self.second_percent,
                "changed_pixels": self.changed_pixels,
                "identity_guard": None if self.identity_similarity is None else {
                    "applied": True, "similarity": round(self.identity_similarity, 6),
                    "blended": self.identity_blended, "engine": "pixel_proxy"},
                "evidence": None if self.evidence is None else self.evidence.public(),
                "provider_calls": 0, "simulated": True, "tested_against_real_products": False}


def _allowed(image: np.ndarray, hair_region: object, scalp_show: object,
             primary_box: tuple[int, int, int, int] | None) -> np.ndarray:
    shape = (int(image.shape[0]), int(image.shape[1]))
    region, scalp, box = _binary_mask(hair_region, shape), _binary_mask(scalp_show, shape), _primary_clip(shape, primary_box)
    if region is None or scalp is None or box is None:
        return np.zeros(shape, dtype=np.bool_)
    return region & scalp & box


class TintedFibreWorkflow:
    """One visitor's local tinted preview; the session cache is the only state kept."""

    def __init__(self, session: CoverSession | None = None) -> None:
        self.session = CoverSession() if session is None else session

    def render(self, plan: TintPlan, image: object, hair_region: object, scalp_show: object, *,
               landmarks: HeadLandmarks | None, zone: Zone = "crown", level: object = 3.0,
               phase: Phase = "release", primary_box: tuple[int, int, int, int] | None = None,
               guard: CoverGuard | None = None, lock_level: object = 5.0) -> TintReceipt:
        checked = validate_level(level)
        if phase not in ("moving", "release"):
            raise ValueError("Unknown local preview phase")
        second = None if plan.two_tone is None else plan.two_tone.second_id
        percent = None if plan.two_tone is None or plan.two_tone.best is None else plan.two_tone.best.percent

        def receipt(status: Status, code: str | None = None, changed: int = 0, similarity: float | None = None,
                    blended: bool | None = None, evidence: FinalColourEvidence | None = None) -> TintReceipt:
            return TintReceipt(checked, phase, status, code, plan.swatch_id, second, percent, changed,
                               similarity, blended, evidence)

        if plan.refused or plan.rgb is None or plan.lab is None:
            return receipt("refused", plan.code)
        result = self.session.render(image, hair_region, scalp_show, zone=zone, level=checked,
                                     landmarks=landmarks, primary_box=primary_box, palette_rgb=plan.rgb,
                                     guard=guard, lock_level=lock_level, phase=phase)
        if isinstance(result, CoverRefusal):
            return receipt("refused", result.code)
        if phase == "moving":
            return receipt("preview_only", None, result.changed_pixels, result.identity_similarity,
                           result.identity_blended)
        before = np.asarray(image)
        evidence = audit_final_colour(before, result.image, _allowed(before, hair_region, scalp_show, primary_box),
                                      plan.lab)
        status: Status = "refused" if evidence.status == "refused" else evidence.status
        return receipt(status, evidence.code, result.changed_pixels, result.identity_similarity,
                       result.identity_blended, evidence)

    def render_levels(self, plan: TintPlan, image: object, hair_region: object, scalp_show: object, *,
                      levels: Sequence[object] = (1.0, 2.0, 3.0, 4.0, 5.0), **options: Any) -> tuple[TintReceipt, ...]:
        """The same photo and masks at several strengths, sharing one prepared zone."""
        return tuple(self.render(plan, image, hair_region, scalp_show, level=level, **options) for level in levels)

"""Two-cheek consensus for W6 skin readings, behind the checked cheek-first photo entry.

A glared or shadowed forehead can make the historical W6 reading refuse even when
both cheeks agree. This module adds one narrow recovery path. The forehead is left
out only when all three conditions hold:

1. both cheeks keep at least ``minimum_zone_pixels`` original pixels;
2. the two cheek medians are within the committed zone-consistency bound
   (``zone_delta_e_ok``, CIEDE2000) of each other;
3. the forehead median is further than that bound from *both* cheeks.

The recovered reading then goes through the unchanged ``find_from_pixels``, so it
must still clear the 0.45 confidence floor, the 6.0 delta-E ceiling and the
1.0 L* no-lightening rule. A reading the historical path accepts is never
replaced, and a refusal the consensus cannot explain stays a refusal.

Lighting follows the existing W6 order: an explicit neutral reference wins, then
an explicit background, then the conservative grey-world estimate of
``measurement.background_from_face``. The public summary carries reference labels,
counts and bounded measurements only: no source pixels, masks or landmarks.
Reference shades are in-house estimates, not physical products. Mirrored in
web/src/engines/shade/skin-accuracy.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

import numpy as np

from . import colourspace as cs
from .finder import (
    ShadeResult,
    WhiteBalance,
    extended_reference_table,
    find_from_pixels,
    pixels_to_lab,
    thresholds,
    trimmed_stats,
    white_balance,
    zone_masks,
)
from .measurement import background_from_face
from .reading import PatchAudit, audit_patches

CHEEKS = ("cheek_right", "cheek_left")
FOREHEAD = "forehead"
SOURCES = ("baseline", "cheek_consensus", "refused")

_NOTES = {
    None: "Both cheeks agree; the forehead was used only when it agreed with them.",
    "insufficient_cheek_samples": "Not enough visible pixels on both cheeks; no shade is suggested.",
    "cheeks_disagree": "The two cheeks read differently; no shade is suggested.",
    "reading_refused": "The cheek reading did not pass the existing shade limits.",
}


def _limits() -> tuple[int, float]:
    t = thresholds()
    return int(t["minimum_zone_pixels"]), float(t["confidence"]["zone_delta_e_ok"])


def _pixels(zone_rgb: Mapping[str, object], name: str) -> np.ndarray:
    raw = np.asarray(zone_rgb.get(name, np.zeros((0, 3))), dtype=np.float64)
    return cs.check_rgb(raw).reshape(-1, 3) if raw.size else np.zeros((0, 3))


def _median(pixels: np.ndarray, white: WhiteBalance) -> np.ndarray:
    median, _, _ = trimmed_stats(pixels_to_lab(pixels, white))
    return median


@dataclass(frozen=True)
class ConsensusDecision:
    """Outcome of the two-cheek consensus path; ``reading`` is None before measurement."""

    usable: bool
    reason: str | None
    cheek_distance: float | None
    forehead_distances: tuple[float, float] | None
    forehead_excluded: bool
    zones_used: tuple[str, ...]
    zone_sizes: Mapping[str, int]
    reading: ShadeResult | None
    note: str

    def public(self) -> dict[str, Any]:
        best = None if self.reading is None else self.reading.best
        return {
            "usable": self.usable,
            "reason": self.reason,
            "cheek_distance": None if self.cheek_distance is None else round(self.cheek_distance, 4),
            "forehead_distances": (None if self.forehead_distances is None
                                   else [round(v, 4) for v in self.forehead_distances]),
            "forehead_excluded": self.forehead_excluded,
            "zones_used": list(self.zones_used),
            "zone_sizes": dict(self.zone_sizes),
            "reference_id": None if best is None else best["id"],
            "note": self.note,
        }


def _decision(reason: str | None, sizes: dict[str, int], *, cheek: float | None = None,
              forehead: tuple[float, float] | None = None, excluded: bool = False,
              used: tuple[str, ...] = (), reading: ShadeResult | None = None) -> ConsensusDecision:
    return ConsensusDecision(reason is None, reason, cheek, forehead, excluded, used, sizes,
                             reading, _NOTES[reason])


def recover_consensus(zone_rgb: Mapping[str, object], white: WhiteBalance, table: Any = None) -> ConsensusDecision:
    """Read W6 from the cheeks, leaving out a forehead that disagrees with both of them.

    ``zone_rgb`` maps ``cheek_right``, ``cheek_left`` and ``forehead`` to (n, 3)
    sRGB pixels, normally the audited samples of ``reading.audit_patches``.
    ``table`` defaults to the 96 references the cheek-first reader uses.
    """
    minimum, bound = _limits()
    pixels = {name: _pixels(zone_rgb, name) for name in (*CHEEKS, FOREHEAD)}
    sizes = {name: int(len(values)) for name, values in pixels.items()}
    if min(sizes[name] for name in CHEEKS) < minimum:
        return _decision("insufficient_cheek_samples", sizes)
    right, left = (_median(pixels[name], white) for name in CHEEKS)
    cheek = cs.delta_e(right, left)
    if cheek > bound:
        return _decision("cheeks_disagree", sizes, cheek=cheek)
    used: tuple[str, ...] = CHEEKS
    forehead: tuple[float, float] | None = None
    excluded = False
    if sizes[FOREHEAD] >= minimum:
        top = _median(pixels[FOREHEAD], white)
        forehead = (cs.delta_e(top, right), cs.delta_e(top, left))
        excluded = min(forehead) > bound
        if not excluded:
            used = (*CHEEKS, FOREHEAD)
    inventory = extended_reference_table() if table is None else table
    reading = find_from_pixels({name: pixels[name] for name in used}, white, inventory)
    reason = "reading_refused" if reading.refused else None
    return _decision(reason, sizes, cheek=cheek, forehead=forehead, excluded=excluded,
                     used=used, reading=reading)


@dataclass(frozen=True)
class SkinPhotoAssessment:
    """The checked W6 outcome for one photo, keeping the historical reading for audit."""

    accepted: bool
    source: str
    reading: ShadeResult
    baseline: ShadeResult
    audit: PatchAudit
    consensus: ConsensusDecision | None
    background: str

    @property
    def reference_id(self) -> str | None:
        return None if not self.accepted or self.reading.best is None else str(self.reading.best["id"])

    def public(self) -> dict[str, Any]:
        return {
            "format": "beljour-skin-accuracy/1",
            "accepted": self.accepted,
            "source": self.source,
            "reference_id": self.reference_id,
            "reading": self.reading.to_json(),
            "baseline_refused": self.baseline.refused,
            "lighting_audit": self.audit.public(),
            "consensus": None if self.consensus is None else self.consensus.public(),
            "background": self.background,
            "provider_calls": 0,
            "tested_against_real_products": False,
        }


def _audited(found: ShadeResult, audit: PatchAudit) -> ShadeResult:
    """The historical cheek-first outcome: a failed lighting audit refuses the reading."""
    if audit.usable:
        return found
    return ShadeResult(
        refused=True, reason=audit.note, measured_lab=found.measured_lab,
        undertone=found.undertone, depth_band=found.depth_band, white=found.white,
        zones=found.zones, confidence={**found.confidence, "overall": 0.0},
        best=None, alternative=None, test_plan=None,
        notes=(*found.notes, f"Lighting audit: {audit.reason}."),
    )


def _photo(image: object) -> np.ndarray:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("skin accuracy needs a uint8 RGB or RGBA photo")
    return img


def assess_skin_zones(image: object, masks: Mapping[str, np.ndarray], *,
                      neutral_mask: object | None = None, background_mask: object | None = None,
                      table: Any = None, background: str | None = None) -> SkinPhotoAssessment:
    """Cheek-first W6 on supplied zone masks, then the consensus path only on refusal.

    ``masks`` holds boolean ``cheek_right``, ``cheek_left`` and ``forehead`` arrays
    the size of the photo, as ``finder.zone_masks`` returns them. ``background``
    labels the lighting source in the public summary.
    """
    img = _photo(image)
    if background is None:
        background = ("explicit_neutral" if neutral_mask is not None
                      else "explicit_background" if background_mask is not None else "none")
    t = thresholds()
    conf = t["confidence"]
    white = white_balance(img, neutral_mask=neutral_mask, background_mask=background_mask)
    samples, audit = audit_patches(
        img, masks, white.gains, white.mode, minimum=int(t["minimum_zone_pixels"]),
        cheek_limit=float(conf["zone_delta_e_ok"]) + float(conf["zone_delta_e_span"]),
    )
    inventory = extended_reference_table() if table is None else table
    baseline = _audited(find_from_pixels(samples, white, inventory), audit)
    if not baseline.refused:
        return SkinPhotoAssessment(True, "baseline", baseline, baseline, audit, None, background)
    consensus = recover_consensus(samples, white, inventory)
    if consensus.usable and consensus.reading is not None:
        return SkinPhotoAssessment(True, "cheek_consensus", consensus.reading, baseline, audit,
                                   consensus, background)
    return SkinPhotoAssessment(False, "refused", baseline, baseline, audit, consensus, background)


def assess_skin_photo(image: object, points: object, *, neutral_mask: object | None = None,
                      background_mask: object | None = None, table: Any = None) -> SkinPhotoAssessment:
    """W6 on one photo with its 478 landmarks in pixel coordinates.

    With neither a neutral reference nor a background mask, the conservative
    grey-world background estimate is tried; the label says which one was used.
    """
    img = _photo(image)
    masks = zone_masks(points, img.shape[0], img.shape[1])
    label: str | None = None
    if neutral_mask is None and background_mask is None:
        estimate = background_from_face(img, points)
        background_mask, label = estimate.mask, estimate.reason
    return assess_skin_zones(img, masks, neutral_mask=neutral_mask, background_mask=background_mask,
                             table=table, background=label)

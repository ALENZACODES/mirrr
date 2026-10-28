"""Display-target evidence for the hair palette: guarded output against the expected composite.

apply_shade() mixes each allowed hair pixel with the swatch in sRGB bytes at opacity
(level - 1) / 4 * 0.8. This module re-derives that on-screen composite independently
and compares it with the pixels the guarded renderer actually returned:

* mean and largest CIEDE2000 between output and composite hair pixels, against the
  ASSUMED 1.25 display-target tolerance (an engineering tolerance, not a validated
  quality threshold);
* bytes outside the allowed hair support, the alpha channel and the input array must
  be unchanged; an identity-guard blend is reported, never hidden.

audit_palette_targets() runs every one of the 90 swatches on a drawn controlled
case. Synthetic on-screen colour only: not physical dye calibration, a real-world
match or real-face evidence. Mirrored in web/src/engines/hair_palette/evidence.ts.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Literal

import numpy as np
from numpy.typing import NDArray

from ..core.colour import ciede2000, srgb_to_lab_array
from ..menshair.render import HairAnchors
from .catalogue import catalogue, require_shade
from .preview import PaletteRefusal, apply_shade

DISPLAY_TOLERANCE = 1.25
MAX_OPACITY = 0.8
EvidenceStatus = Literal["meets_target", "misses_target", "unchanged", "refused"]
CONTROL_SIZE = 96
CONTROL_PATCH = (slice(44, 50), slice(44, 50))
CONTROL_HAIR = (96, 84, 76)
CONTROL_BACKGROUND = (180, 176, 170)
CONTROL_ANCHORS = HairAnchors.parse({
    "left_temple": (0.30, 0.38), "right_temple": (0.70, 0.38), "crown": (0.50, 0.12),
    "left_ear": (0.26, 0.56), "right_ear": (0.74, 0.56), "nape": (0.50, 0.82),
})

__all__ = ["DISPLAY_TOLERANCE", "PaletteTargetAudit", "TargetEvidence", "audit_palette_targets",
           "control_case", "expected_composite", "target_evidence"]


def _hair_support(mask: object, height: int, width: int,
                  box: tuple[int, int, int, int] | None) -> NDArray[np.bool_]:
    """The same allowed-pixel rule as apply_shade(): uint8 >= 128, otherwise >= 0.5, clipped."""
    values = np.asarray(mask)
    if values.shape != (height, width) or values.dtype not in (np.uint8, np.bool_, np.float32, np.float64):
        raise ValueError("Hair evidence must be an image-shaped mask")
    if values.dtype == np.uint8:
        allow = np.asarray(values, dtype=np.uint8) >= 128
    else:
        as_float = np.asarray(values, dtype=np.float64)
        if not np.all(np.isfinite(as_float)) or bool(np.any(as_float < 0)) or bool(np.any(as_float > 1)):
            raise ValueError("Hair region coverage is not valid")
        allow = as_float >= 0.5
    if box is not None:
        clipped = np.zeros((height, width), dtype=bool)
        clipped[box[1]:box[3], box[0]:box[2]] = True
        allow = allow & clipped
    return np.asarray(allow, dtype=np.bool_)


def expected_composite(source: NDArray[np.uint8], allow: NDArray[np.bool_], shade_id: str,
                       level: float) -> NDArray[np.uint8]:
    """The documented on-screen mix, independent of the renderer's own arithmetic."""
    opacity = (float(level) - 1.0) / 4.0 * MAX_OPACITY
    target = np.asarray(require_shade(shade_id).rgb, dtype=np.float64)
    out = source.copy()
    mixed = source[..., :3][allow].astype(np.float64) * (1 - opacity) + target * opacity
    out[..., :3][allow] = np.floor(mixed + 0.5).astype(np.uint8)
    return out


@dataclass(frozen=True, slots=True)
class TargetEvidence:
    shade_id: str
    level: float
    status: EvidenceStatus
    code: str | None
    mean_delta_e: float | None
    max_delta_e: float | None
    outside_unchanged: bool
    alpha_unchanged: bool
    source_unchanged: bool
    guard_blended: bool

    def public(self) -> dict[str, Any]:
        def rounded(v: float | None) -> float | None:
            return None if v is None else round(v, 4)
        return {"shade_id": self.shade_id, "level": self.level, "status": self.status, "code": self.code,
                "mean_delta_e": rounded(self.mean_delta_e), "max_delta_e": rounded(self.max_delta_e),
                "tolerance": DISPLAY_TOLERANCE, "outside_unchanged": self.outside_unchanged,
                "alpha_unchanged": self.alpha_unchanged, "source_unchanged": self.source_unchanged,
                "guard_blended": self.guard_blended, "kind": "on_screen_composite_not_dye"}


def target_evidence(image: NDArray[np.uint8], hair_mask: object, landmarks: object | None, shade_id: str,
                    level: float = 3.0, *, primary_box: tuple[int, int, int, int] | None = None,
                    allow_lightening: bool = False) -> TargetEvidence:
    """Render one swatch with apply_shade and compare it with the expected composite."""
    before = np.array(image, copy=True)
    found = apply_shade(image, hair_mask, landmarks, shade_id, level, primary_box=primary_box,
                        allow_lightening=allow_lightening)
    source_ok = bool(np.array_equal(before, image))
    if isinstance(found, PaletteRefusal):
        return TargetEvidence(shade_id, float(level), "refused", found.code, None, None, True, True, source_ok, False)
    allow = _hair_support(hair_mask, before.shape[0], before.shape[1], primary_box)
    expected = expected_composite(before, allow, shade_id, found.level)
    out = found.image
    outside = bool(np.array_equal(out[~allow], before[~allow]))
    alpha = before.shape[-1] < 4 or bool(np.array_equal(out[..., 3], before[..., 3]))
    if found.changed_pixels == 0:
        return TargetEvidence(shade_id, found.level, "unchanged", None, 0.0, 0.0, outside, alpha, source_ok,
                              found.identity_blended)
    got = srgb_to_lab_array(out[..., :3][allow].astype(np.float64))
    want = srgb_to_lab_array(expected[..., :3][allow].astype(np.float64))
    distances = [ciede2000(tuple(a), tuple(b)) for a, b in zip(got, want, strict=True)]
    mean, top = float(np.mean(distances)), float(np.max(distances))
    status: EvidenceStatus = "meets_target" if top <= DISPLAY_TOLERANCE and outside and alpha and source_ok \
        else "misses_target"
    return TargetEvidence(shade_id, found.level, status, None, mean, top, outside, alpha, source_ok,
                          found.identity_blended)


def control_case() -> tuple[NDArray[np.uint8], NDArray[np.uint8]]:
    """A drawn RGBA control: a small 6x6 hair patch keeps the default identity guard from blending."""
    image = np.empty((CONTROL_SIZE, CONTROL_SIZE, 4), dtype=np.uint8)
    image[..., :3] = CONTROL_BACKGROUND
    image[..., 3] = 230
    image[CONTROL_PATCH[0], CONTROL_PATCH[1], :3] = CONTROL_HAIR
    mask = np.zeros((CONTROL_SIZE, CONTROL_SIZE), dtype=np.uint8)
    mask[CONTROL_PATCH] = 255
    return image, mask


@dataclass(frozen=True, slots=True)
class PaletteTargetAudit:
    level: float
    evidence: tuple[TargetEvidence, ...]

    @property
    def meets(self) -> int:
        return sum(e.status == "meets_target" for e in self.evidence)

    def public(self) -> dict[str, Any]:
        worst = max((e.max_delta_e or 0.0) for e in self.evidence)
        return {"format": "beljour-palette-targets/1", "level": self.level, "swatches": len(self.evidence),
                "meets_target": self.meets, "tolerance": DISPLAY_TOLERANCE, "worst_delta_e": round(worst, 4),
                "guard_blended": sum(e.guard_blended for e in self.evidence),
                "kind": "drawn_controlled_on_screen_composite"}


@lru_cache(maxsize=4)
def audit_palette_targets(level: float = 5.0) -> PaletteTargetAudit:
    """Every swatch on the drawn control, lighter swatches explicitly allowed for the audit."""
    image, mask = control_case()
    return PaletteTargetAudit(float(level), tuple(
        target_evidence(image, mask, CONTROL_ANCHORS, s.id, level, allow_lightening=True) for s in catalogue()))

"""Final-pixel colour evidence for a rendered fibre preview.

The audit compares the guarded output that is actually shown against the
explicitly chosen in-house Lab swatch, on the pixels of the allowed edit region:

* any change outside the allowed region refuses with ``protected_region_changed``;
* any change to the alpha channel refuses with ``alpha_changed``;
* no changed pixel inside the region is ``unchanged`` (no colour claim is made);
* otherwise the CIEDE2000 distance from the region's mean colour to the swatch is
  measured before and after. A smaller distance is ``rendered_closer``; an equal
  or larger one is recorded as ``adverse_shift`` instead of being reported as an
  improvement.

The mean colour is taken in linear light and converted to CIELAB (D65). Only
counts and distances are kept, never pixels, masks or hashes. This is digital
on-screen colour, not physical dye or fibre equivalence. Mirrored in
web/src/commerce/colour-evidence.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from ..shade import colourspace as cs
from ..shade.distance import delta_e
from ..shade.loaders import checked_lab

Status = Literal["rendered_closer", "adverse_shift", "unchanged", "refused"]
RefusalCode = Literal["protected_region_changed", "alpha_changed", "empty_region"]
LABEL = "On-screen colour check of a simulation; not a physical dye or fibre match."


@dataclass(frozen=True, slots=True)
class FinalColourEvidence:
    status: Status
    code: RefusalCode | None
    region_pixels: int
    changed_pixels: int
    outside_changed: int
    before_delta_e: float | None
    after_delta_e: float | None

    @property
    def shift(self) -> float | None:
        """After minus before; negative is closer to the chosen swatch."""
        if self.before_delta_e is None or self.after_delta_e is None:
            return None
        return self.after_delta_e - self.before_delta_e

    def public(self) -> dict[str, Any]:
        def r(value: float | None) -> float | None:
            return None if value is None else round(value, 4)
        return {"format": "beljour-final-colour/1", "status": self.status, "code": self.code,
                "region_pixels": self.region_pixels, "changed_pixels": self.changed_pixels,
                "outside_changed": self.outside_changed, "before_delta_e": r(self.before_delta_e),
                "after_delta_e": r(self.after_delta_e), "shift_delta_e": r(self.shift),
                "label": LABEL, "tested_against_real_products": False}


def mean_lab(pixels: np.ndarray) -> np.ndarray:
    """Mean of (n, 3) sRGB pixels in linear light, as CIELAB."""
    return np.asarray(cs.xyz_to_lab(cs.linear_to_xyz(cs.decode(pixels).mean(axis=0))), dtype=np.float64)


def _image(value: object, name: str) -> np.ndarray:
    arr = np.asarray(value)
    if arr.dtype != np.uint8 or arr.ndim != 3 or arr.shape[2] not in (3, 4):
        raise ValueError(f"{name} must be a uint8 RGB or RGBA image")
    return arr


def audit_final_colour(before: object, after: object, allowed: object,
                       target_lab: Sequence[float]) -> FinalColourEvidence:
    """Check the shown output against the chosen swatch inside the allowed region only."""
    old, new = _image(before, "before"), _image(after, "after")
    if old.shape != new.shape:
        raise ValueError("before and after must have the same size")
    region = np.asarray(allowed)
    if region.shape != old.shape[:2]:
        raise ValueError("allowed region must match the image size")
    inside = region >= 0.5 if region.dtype != np.bool_ else region
    target = checked_lab(target_lab)
    count = int(np.count_nonzero(inside))
    moved = np.any(old[..., :3] != new[..., :3], axis=-1)
    outside = int(np.count_nonzero(moved & ~inside))
    changed = int(np.count_nonzero(moved & inside))
    if outside:
        return FinalColourEvidence("refused", "protected_region_changed", count, changed, outside, None, None)
    if old.shape[2] == 4 and bool(np.any(old[..., 3] != new[..., 3])):
        return FinalColourEvidence("refused", "alpha_changed", count, changed, 0, None, None)
    if count == 0:
        return FinalColourEvidence("refused", "empty_region", 0, 0, 0, None, None)
    if changed == 0:
        return FinalColourEvidence("unchanged", None, count, 0, 0, None, None)
    first = delta_e(mean_lab(old[..., :3][inside].astype(np.float64)).tolist(), target)
    second = delta_e(mean_lab(new[..., :3][inside].astype(np.float64)).tolist(), target)
    status: Status = "rendered_closer" if second < first else "adverse_shift"
    return FinalColourEvidence(status, None, count, changed, 0, first, second)

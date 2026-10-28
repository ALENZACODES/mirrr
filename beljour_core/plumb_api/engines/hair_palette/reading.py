"""Hair colour reading from a photo, for choosing an in-house swatch by hand.

The hair mask (and an optional manually marked neutral reference) come from the user.
Steps, refusing with a code instead of guessing:

1. Source transparency: in an RGBA photo, hair pixels that are not fully opaque are
   left out and counted; if too few opaque pixels remain: ``transparent_source``
   (or ``no_hair`` when nothing was marked).
2. Neutral reference (optional): its upper and lower halves, corrected with the same
   W6 gains, must agree within ``zone_delta_e_ok`` (3.0 CIEDE2000), otherwise
   ``inconsistent_neutral``. Without one the reading is labelled uncorrected.
3. The hair Lab is concealer.shade_support.read_fibre_colour on the opaque pixels.
   Its left and right halves must agree within the committed W6 zone bound (10.0),
   otherwise ``mixed_lighting``.
4. Measured level and up to three suggestions from hair_palette.suggest(), which
   never goes above the measured level (no automatic lightening).

Every reading is an estimate from an on-screen photo, not a dye result. Mirrored in
web/src/engines/hair_palette/reading.ts. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np
from numpy.typing import NDArray

from ..concealer.colour_stability import mixed_light_limit
from ..concealer.shade_support import FibreReading, read_fibre_colour
from ..shade.distance import delta_e
from ..shade.finder import thresholds
from .evidence import _hair_support
from .matching import ShadeSuggestion, measured_level, suggest

LABEL = "Hair colour estimate from your photo. Not a dye or product result."
ReadingCode = Literal["no_hair", "transparent_source", "inconsistent_neutral", "mixed_lighting"]

__all__ = ["HairColourReading", "ReadingRefusal", "read_hair_colour"]


@dataclass(frozen=True, slots=True)
class ReadingRefusal:
    code: ReadingCode
    excluded_transparent: int
    separation: float | None = None

    def public(self) -> dict[str, Any]:
        return {"refused": True, "code": self.code, "excluded_transparent": self.excluded_transparent,
                "separation": None if self.separation is None else round(self.separation, 4), "label": LABEL}


@dataclass(frozen=True, slots=True)
class HairColourReading:
    reading: FibreReading
    level: int
    suggestions: tuple[ShadeSuggestion, ...]
    halves_delta_e: float
    excluded_transparent: int

    @property
    def corrected(self) -> bool:
        return self.reading.white_mode != "none"

    def public(self) -> dict[str, Any]:
        return {"refused": False, "reading": self.reading.public(), "level": self.level,
                "corrected": self.corrected, "halves_delta_e": round(self.halves_delta_e, 4),
                "excluded_transparent": self.excluded_transparent,
                "suggestions": [s.public() for s in self.suggestions], "no_auto_lightening": True,
                "label": LABEL}


def _halves(mask: NDArray[np.bool_], axis: int) -> tuple[NDArray[np.bool_], NDArray[np.bool_]]:
    """Split a mask at the median row (axis 0) or column (axis 1) of its pixels."""
    index = np.nonzero(mask)[axis]
    cut = float(np.median(index))
    grid = np.indices(mask.shape)[axis]
    return mask & (grid < cut), mask & (grid >= cut)


def read_hair_colour(image: object, hair_mask: object, *, neutral_mask: object | None = None,
                     primary_box: tuple[int, int, int, int] | None = None) -> HairColourReading | ReadingRefusal:
    pixels = np.asarray(image)
    if pixels.dtype != np.uint8 or pixels.ndim != 3 or pixels.shape[2] not in (3, 4):
        raise ValueError("Hair colour reading needs a uint8 RGB or RGBA photo")
    height, width = pixels.shape[:2]
    minimum = int(thresholds()["minimum_zone_pixels"])
    support = _hair_support(hair_mask, height, width, primary_box)
    opaque = np.ones((height, width), dtype=bool) if pixels.shape[2] == 3 else pixels[..., 3] == 255
    hair = support & opaque
    excluded = int((support & ~opaque).sum())
    if int(hair.sum()) < minimum:
        return ReadingRefusal("transparent_source" if excluded else "no_hair", excluded)
    neutral = None
    if neutral_mask is not None:
        neutral = _hair_support(neutral_mask, height, width, None) & opaque
        if int(neutral.sum()) < 2 * minimum:
            return ReadingRefusal("inconsistent_neutral", excluded)
        top, bottom = _halves(neutral, 0)
        if min(int(top.sum()), int(bottom.sum())) < minimum:
            return ReadingRefusal("inconsistent_neutral", excluded)
        gap = delta_e(read_fibre_colour(pixels, top, neutral_mask=neutral).lab,
                      read_fibre_colour(pixels, bottom, neutral_mask=neutral).lab)
        if gap > float(thresholds()["confidence"]["zone_delta_e_ok"]):
            return ReadingRefusal("inconsistent_neutral", excluded, gap)
    found = read_fibre_colour(pixels, hair, neutral_mask=neutral)
    left, right = _halves(hair, 1)
    if min(int(left.sum()), int(right.sum())) < minimum:
        halves = 0.0
    else:
        halves = delta_e(read_fibre_colour(pixels, left, neutral_mask=neutral).lab,
                         read_fibre_colour(pixels, right, neutral_mask=neutral).lab)
    if halves > mixed_light_limit():
        return ReadingRefusal("mixed_lighting", excluded, halves)
    return HairColourReading(found, measured_level(found.lab), suggest(found.lab, count=3), halves, excluded)

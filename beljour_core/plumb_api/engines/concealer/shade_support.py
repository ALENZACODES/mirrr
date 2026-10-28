"""Local fibre-colour reading and planning against the in-house hair swatches.

Reading: hair pixels inside a caller-supplied hair mask, corrected with the W6
lighting gains (an explicit neutral card first, else a labelled grey-world
background estimate, finder.white_balance), then the LS5 shade-card rule: keep the
pixels whose L* lies between the 20th and 80th percentile (drops shine and shadow)
and take the median of each Lab channel.

Planning: the nearest swatches of the 90-swatch hair catalogue by CIEDE2000
(shade.distance.rank_shades), never above the reading's measured hair level. A
lighter swatch is offered only as a separate option that needs the user's explicit
approval. Coded refusals instead of guesses:

* ``uncorrected_lighting``: no neutral card or usable background, so the colour is
  the light's as much as the hair's;
* ``too_far``: the closest allowed swatch is beyond the committed W6 distance limit
  (thresholds.json ``refuse_delta_e_above``, 6.0). ASSUMED: the skin limit is reused
  for fibre colour until a hair-specific limit is measured.

No image, mask, landmark or supplier name is kept; swatches are original estimates.
Mirrored in web/src/commerce/shade-support.ts. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from ..core.filters import quantile
from ..shade.distance import ShadeMatch, nearest_shade, rank_shades
from ..shade.finder import pixels_to_lab, thresholds, white_balance
from ..shade.loaders import Lab, checked_lab

LABEL = "Fibre colour estimate from your photo. In-house swatches, not tested against real products."
WHITE_MODES = ("neutral", "grey_world", "none")
TRIM = (0.2, 0.8)
MAX_COUNT = 10
RefusalCode = Literal["uncorrected_lighting", "mixed_lighting", "too_far", "unstable_swatch"]

__all__ = ["LABEL", "FibrePlan", "FibreReading", "RefusalCode", "plan_fibre_colour", "read_fibre_colour"]


@dataclass(frozen=True, slots=True)
class FibreReading:
    """A corrected hair colour; ``white_mode`` says how (or whether) lighting was corrected."""

    lab: Lab
    white_mode: str
    clamped: bool = False
    pixels: int = 0

    def __post_init__(self) -> None:
        object.__setattr__(self, "lab", checked_lab(self.lab))
        if self.white_mode not in WHITE_MODES:
            raise ValueError("white_mode must be neutral, grey_world or none")
        if type(self.clamped) is not bool or type(self.pixels) is not int or self.pixels < 0:
            raise ValueError("clamped must be a boolean and pixels a non-negative integer")

    def public(self) -> dict[str, Any]:
        return {"lab": [round(v, 4) for v in self.lab], "white_mode": self.white_mode,
                "clamped": self.clamped, "pixels": self.pixels}


def read_fibre_colour(image: object, hair_mask: object, *, neutral_mask: object | None = None,
                      background_mask: object | None = None) -> FibreReading:
    """Corrected median hair Lab from one photo; raises ValueError on too few hair pixels."""
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("Fibre colour needs a uint8 RGB or RGBA photo")
    mask = np.asarray(hair_mask)
    if mask.shape != img.shape[:2]:
        raise ValueError("Hair mask must match the photo size")
    pixels = img[..., :3][mask >= 0.5].astype(np.float64)
    if len(pixels) < int(thresholds()["minimum_zone_pixels"]):
        raise ValueError("Too few hair pixels to read a colour")
    white = white_balance(img, neutral_mask=neutral_mask, background_mask=background_mask)
    lab = pixels_to_lab(pixels, white)
    lo, hi = quantile(lab[:, 0], TRIM[0]), quantile(lab[:, 0], TRIM[1])
    keep = lab[(lab[:, 0] >= lo) & (lab[:, 0] <= hi)]
    median = tuple(quantile(keep[:, c], 0.5) for c in range(3))
    return FibreReading((median[0], median[1], median[2]), white.mode, white.clamped, len(pixels))


@dataclass(frozen=True, slots=True)
class FibrePlan:
    """Ranked swatches for one reading, or a coded refusal with no swatch named."""

    reading: FibreReading
    code: RefusalCode | None
    matches: tuple[ShadeMatch, ...]
    lighter_option: ShadeMatch | None
    approved_lighter: bool

    @property
    def refused(self) -> bool:
        return self.code is not None

    @property
    def best(self) -> ShadeMatch | None:
        return self.matches[0] if self.matches else None

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-fibre-colour/1", "label": LABEL, "refused": self.refused,
                "code": self.code, "reading": self.reading.public(),
                "matches": [m.public() for m in self.matches],
                "lighter_option": None if self.lighter_option is None else self.lighter_option.public(),
                "lighter_needs_approval": self.lighter_option is not None,
                "approved_lighter": self.approved_lighter, "tested_against_real_products": False}


def _refuse(reading: FibreReading, code: RefusalCode, approved_lighter: bool) -> FibrePlan:
    return FibrePlan(reading, code, (), None, approved_lighter)


def plan_fibre_colour(reading: FibreReading, *, approve_lighter: bool = False, count: int = 3) -> FibrePlan:
    """Up to ``count`` swatches nearest first; a lighter one only with ``approve_lighter``."""
    if not isinstance(reading, FibreReading):
        raise ValueError("Expected a fibre colour reading")
    if type(approve_lighter) is not bool:
        raise ValueError("approve_lighter must be a boolean")
    if type(count) is not int or not 1 <= count <= MAX_COUNT:
        raise ValueError(f"count must be 1..{MAX_COUNT}")
    if reading.white_mode == "none":
        return _refuse(reading, "uncorrected_lighting", approve_lighter)
    matches = rank_shades(reading.lab, "hair", allow_lighter=approve_lighter, limit=count)
    limit = float(thresholds()["confidence"]["refuse_delta_e_above"])
    if not matches or matches[0].delta_e > limit:
        return _refuse(reading, "too_far", approve_lighter)
    overall = nearest_shade(reading.lab, "hair", allow_lighter=True)
    lighter = None
    if (not approve_lighter and overall is not None and overall.measured_level is not None
            and overall.record.level > overall.measured_level and overall.delta_e <= limit):
        lighter = overall
    return FibrePlan(reading, None, matches, lighter, approve_lighter)

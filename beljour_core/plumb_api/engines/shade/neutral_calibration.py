"""Checked neutral-card evidence for the W6 shade reader.

A neutral card corrects colour only when the visitor has confirmed it is neutral
material; nothing here guesses that a grey-looking area is neutral. Clipped
pixels (any channel at or below 4, or at or above 251, the same bounds as the
cheek audit) and transparent pixels (alpha at or below 245, the same bound as
the background estimate) are left out. The remaining card is split into its
upper and lower halves, and the two halves must agree within the committed W6
zone distance (``zone_delta_e_ok``, CIEDE2000, on the uncorrected colour). Mixed
lighting across the card refuses; it never lowers any reliability or colour
distance requirement. Each half needs ``minimum_zone_pixels`` usable pixels.

The decision carries the usable card mask for the reader and, in its public
summary, counts and bounded measurements only. A neutral-card reading is a
lighting correction for a cosmetic estimate, not clinical testing or device
calibration. Mirrored in web/src/engines/shade/neutral-calibration.ts.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from . import colourspace as cs
from .finder import WhiteBalance, thresholds, white_from_pixels

CLIP_LOW = 4
CLIP_HIGH = 251
OPAQUE_ABOVE = 245
REASONS = ("not_confirmed", "card_too_small", "card_clipped", "mixed_lighting")
_NOTES = {
    None: "Confirmed neutral card with even lighting; colour is corrected from it.",
    "not_confirmed": "The card was not confirmed as neutral material, so it is not used.",
    "card_too_small": "The marked card is too small to measure; it is not used.",
    "card_clipped": "Too much of the card is clipped or transparent to measure; it is not used.",
    "mixed_lighting": "The top and bottom of the card are lit differently; retake in even light.",
}


@dataclass(frozen=True)
class NeutralDecision:
    usable: bool
    reason: str | None
    card_pixels: int
    usable_pixels: int
    upper_lower_distance: float | None
    white: WhiteBalance | None
    mask: np.ndarray | None
    note: str

    def public(self) -> dict[str, Any]:
        return {
            "usable": self.usable,
            "reason": self.reason,
            "card_pixels": self.card_pixels,
            "usable_pixels": self.usable_pixels,
            "upper_lower_distance": (None if self.upper_lower_distance is None
                                     else round(self.upper_lower_distance, 4)),
            "white": None if self.white is None else self.white.to_json(),
            "note": self.note,
            "clinical": False,
        }


def _refuse(reason: str, card: int, usable: int = 0, distance: float | None = None) -> NeutralDecision:
    return NeutralDecision(False, reason, card, usable, distance, None, None, _NOTES[reason])


def _lab(pixels: np.ndarray) -> np.ndarray:
    return cs.xyz_to_lab(cs.linear_to_xyz(cs.decode(pixels).mean(axis=0)))


def inspect_neutral_card(image: object, card_mask: object, *, confirmed: bool) -> NeutralDecision:
    """Check a visitor-marked neutral card before it may correct a skin reading."""
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("neutral card needs a uint8 RGB or RGBA photo")
    marked = np.asarray(card_mask)
    if marked.shape != img.shape[:2]:
        raise ValueError("neutral card mask must match the photo size")
    if not isinstance(confirmed, bool):
        raise ValueError("confirmed must be a boolean")
    card = marked >= 0.5
    card_pixels = int(np.count_nonzero(card))
    if not confirmed:
        return _refuse("not_confirmed", card_pixels)
    minimum = int(thresholds()["minimum_zone_pixels"])
    if card_pixels < 2 * minimum:
        return _refuse("card_too_small", card_pixels)
    rgb = img[..., :3]
    usable = card & np.all(rgb > CLIP_LOW, axis=2) & np.all(rgb < CLIP_HIGH, axis=2)
    if img.shape[2] == 4:
        usable &= img[..., 3] > OPAQUE_ABOVE
    rows = np.nonzero(card)[0]
    middle = (int(rows.min()) + int(rows.max()) + 1) / 2
    above = np.arange(img.shape[0])[:, None] < middle
    upper, lower = usable & above, usable & ~above
    count = int(np.count_nonzero(usable))
    if min(int(np.count_nonzero(upper)), int(np.count_nonzero(lower))) < minimum:
        return _refuse("card_clipped", card_pixels, count)
    distance = cs.delta_e(_lab(rgb[upper].astype(np.float64)), _lab(rgb[lower].astype(np.float64)))
    if distance > float(thresholds()["confidence"]["zone_delta_e_ok"]):
        return _refuse("mixed_lighting", card_pixels, count, distance)
    white = white_from_pixels(rgb[usable].astype(np.float64), "neutral")
    return NeutralDecision(True, None, card_pixels, count, distance, white, usable, _NOTES[None])


def neutral_photo_options(decision: NeutralDecision) -> dict[str, Any]:
    """Keyword options for the W6 photo readers: the checked card, or nothing."""
    if not decision.usable or decision.mask is None:
        return {}
    return {"neutral_mask": decision.mask}

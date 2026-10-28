"""Unit costs for every YouCam call we make, so the app can show the price before it runs.

Numbers come from the YouCam docs (skin analysis, face reshape and skin tone pages were
re-checked on Oct 22, 2026). Anything not re-checked is marked in UNVERIFIED.
"""
from __future__ import annotations

import math

SD_CONCERNS: tuple[str, ...] = (
    "wrinkle", "droopy_upper_eyelid", "droopy_lower_eyelid", "firmness", "acne", "moisture",
    "eye_bag", "dark_circle_v2", "age_spot", "radiance", "redness", "oiliness", "pore",
    "texture", "tear_trough", "skin_type",
)

_SKIN_SD = ((4, 9), (8, 12), (12, 14), (16, 16))
_SKIN_HD = ((4, 12), (8, 16), (12, 20), (16, 22))
_FACE_ATTR = ((5, 10), (14, 20), (28, 30))

FLAT_COSTS: dict[str, int] = {
    "makeup-vto": 1,
    "face-reshape": 1,
    "face-lift": 1,
    "skin-tone-analysis": 20,
    "aging": 2,
    "teeth-whiten": 1,
    "hair-color": 1,
    "eye-color-vto": 1,
    "look-vto": 2,
    "mu-transfer": 2,
    # Hair styling (BELJOUR). Prices are not confirmed; spike S1 compares these with
    # the account's price list. Where unsure, the higher plausible price is used so the
    # caps err on the safe side.
    "hair-style": 2,
    "hair-transfer": 3,  # provisional ceiling; verify with account feature-cost before enabling
    "hair-bang": 1,
    "hair-curl": 1,
    "hair-extension": 1,
    "hair-volume": 2,
}

# Not confirmed in the docs: cloth-v4 (docs list 2 units for V2 and V3 only) and the rest
# below come from the hackathon brief.
UNVERIFIED = {"teeth-whiten", "hair-color", "eye-color-vto",
              "look-vto", "mu-transfer", "video-sr", "hair-style", "hair-bang", "hair-curl",
              "hair-extension", "hair-volume", "hair-transfer"}

_SKIN_SIM = ((4, 4), (10, 6))


def _tier(count: int, tiers: tuple[tuple[int, int], ...], what: str) -> int:
    if count < 1:
        raise ValueError(f"{what}: choose at least one item")
    for upper, units in tiers:
        if count <= upper:
            return units
    raise ValueError(f"{what}: at most {tiers[-1][0]} items per call")


def skin_analysis_units(concern_count: int, hd: bool = False) -> int:
    return _tier(concern_count, _SKIN_HD if hd else _SKIN_SD, "skin analysis")


def face_attr_units(feature_count: int) -> int:
    return _tier(feature_count, _FACE_ATTR, "face attributes")


def skin_simulation_units(concern_count: int) -> int:
    return _tier(concern_count, _SKIN_SIM, "skin simulation")


def video_sr_units(seconds: float) -> int:
    if seconds <= 0 or seconds > 60:
        raise ValueError("video enhance takes clips from 0 to 60 seconds")
    return math.ceil(seconds / 2)


def estimate(feature: str, payload: dict) -> int:
    """Units a single call will cost if it succeeds."""
    if feature == "skin-analysis":
        actions = payload.get("dst_actions") or []
        hd = any(str(a).startswith("hd_") for a in actions)
        return skin_analysis_units(len(actions), hd)
    if feature == "face-attr-analysis":
        return face_attr_units(len(payload.get("features") or []))
    if feature == "skin-simulation":
        return skin_simulation_units(sum(1 for v in payload.values() if isinstance(v, (int, float)) and v))
    if feature in FLAT_COSTS:
        return FLAT_COSTS[feature]
    raise ValueError(f"no unit price on file for {feature}")

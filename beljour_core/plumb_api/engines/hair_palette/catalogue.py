"""Original, commercially independent hair-colour swatch catalogue.

All swatches are in-house RGB samples converted to CIE Lab D65. Their measured
appearance on a customer or physical product is NOT verified. Author: John Khan.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from ..core.colour import ciede2000, lab_to_rgb, rgb_to_lab

Undertone = Literal["warm", "neutral", "cool"]
Family = Literal[
    "natural", "ash", "golden", "copper", "red", "violet", "mahogany",
    "fashion", "grey", "silver", "white",
]
CATALOGUE_PATH = Path(__file__).with_name("catalogue.json")
FAMILIES = frozenset({
    "natural", "ash", "golden", "copper", "red", "violet", "mahogany",
    "fashion", "grey", "silver", "white",
})
UNDERTONES = frozenset({"warm", "neutral", "cool"})
Lab = tuple[float, float, float]
RGB = tuple[int, int, int]


@dataclass(frozen=True, slots=True)
class HairShade:
    id: str
    name: str
    family: Family
    undertone: Undertone
    level: int
    lab: Lab
    lch: Lab
    rgb: RGB
    assumed: bool

    @classmethod
    def parse(cls, value: object) -> HairShade:
        if not isinstance(value, dict):
            raise ValueError("Hair swatch must be an object")
        keys = {"id", "name", "family", "undertone", "level", "lab", "lch", "rgb", "assumed"}
        if set(value) != keys:
            raise ValueError("Hair swatch has unknown or missing properties")
        key = value["id"]
        if not isinstance(key, str) or not key or len(key) > 60 or not key.replace("-", "").isalnum():
            raise ValueError("Invalid local swatch id")
        name = value["name"]
        if not isinstance(name, str) or not 3 <= len(name) <= 80:
            raise ValueError("Invalid shade label")
        family = value["family"]
        tone = value["undertone"]
        if family not in FAMILIES or tone not in UNDERTONES:
            raise ValueError("Invalid swatch classification")
        level = value["level"]
        if type(level) is not int or not 1 <= level <= 10:
            raise ValueError("Hair level must be 1..10")
        raw_rgb = value["rgb"]
        if (not isinstance(raw_rgb, list) or len(raw_rgb) != 3 or
                any(type(c) is not int or not 0 <= c <= 255 for c in raw_rgb)):
            raise ValueError("Expected bounded sRGB channels")
        rgb: RGB = (raw_rgb[0], raw_rgb[1], raw_rgb[2])
        lab = _triple(value["lab"], "Lab")
        lch = _triple(value["lch"], "LCh")
        if not 0 <= lch[2] < 360 or lch[1] < 0:
            raise ValueError("LCh values out of range")
        if any(abs(a - b) > 0.006 for a, b in zip(rgb_to_lab(rgb), lab, strict=True)):
            raise ValueError("Swatch Lab and source RGB disagree")
        expected = (lab[0], math.hypot(lab[1], lab[2]), math.degrees(math.atan2(lab[2], lab[1])) % 360)
        if any(abs(a - b) > 0.006 for a, b in zip(expected, lch, strict=True)):
            raise ValueError("Swatch Lab and LCh disagree")
        if value["assumed"] is not True:
            raise ValueError("Original swatches must disclose estimated status")
        # A round trip through the display gamut must not silently clip a swatch.
        reproduced = lab_to_rgb(lab)
        if max(abs(channel - estimate) for channel, estimate in zip(rgb, reproduced, strict=True)) > 0.1:
            raise ValueError("Out-of-gamut swatch or inconsistent Lab")
        return cls(key, name, family, tone, level, lab, lch, rgb, True)

    def public(self) -> dict[str, Any]:
        return {"id": self.id, "name": self.name, "family": self.family, "undertone": self.undertone,
                "level": self.level, "lab": list(self.lab), "lch": list(self.lch),
                "rgb": list(self.rgb), "assumed": True}


def _triple(value: object, name: str) -> Lab:
    if not isinstance(value, list) or len(value) != 3:
        raise ValueError(f"{name} must contain three channels")
    if any(type(channel) not in (float, int) or not math.isfinite(channel) for channel in value):
        raise ValueError(f"{name} must contain finite numbers")
    return float(value[0]), float(value[1]), float(value[2])


@lru_cache(maxsize=1)
def catalogue() -> tuple[HairShade, ...]:
    payload = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    if payload.get("format") != "beljour-hair-palette/1" or payload.get("author") != "John Khan":
        raise ValueError("Hair palette source is not cleared")
    values = payload.get("shades")
    if not isinstance(values, list) or len(values) < 60:
        raise ValueError("Expected at least 60 original swatches")
    shades = tuple(HairShade.parse(item) for item in values)
    if len({row.id for row in shades}) != len(shades):
        raise ValueError("Duplicate original swatch ID")
    for i, first in enumerate(shades):
        for second in shades[i + 1:]:
            if ciede2000(first.lab, second.lab) < 1.0:
                raise ValueError("Original swatches too close to distinguish")
    return shades


def require_shade(shade_id: str) -> HairShade:
    for shade in catalogue():
        if shade.id == shade_id:
            return shade
    raise ValueError("Unknown in-house hair swatch")

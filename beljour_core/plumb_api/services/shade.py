"""Colour science for shade matching: sRGB hex -> CIELAB (D65) -> CIEDE2000.

CIEDE2000 is written from Sharma, Wu and Dalal (2005), "The CIEDE2000 color difference
formula: implementation notes, supplementary test data and mathematical observations",
and is checked against their published test pairs in tests/test_shade.py.
"""
from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path

from ..engines.core.colour import ciede2000, hex_to_lab, hex_to_rgb, lab_to_rgb, rgb_to_hex, rgb_to_lab

__all__ = [
    "ciede2000", "hex_to_lab", "hex_to_rgb", "lab_to_rgb", "rgb_to_hex", "rgb_to_lab",
    "catalogue", "catalogue_stats", "describe_delta", "lip_suggestions", "match", "shop_link", "undertone",
]

CATALOGUE_PATH = Path(__file__).resolve().parent.parent / "data" / "shades.json"

# D65 reference white, 2 degree observer
_WHITE = (95.047, 100.0, 108.883)


def describe_delta(de: float) -> str:
    """Common reading of CIEDE2000 values."""
    if de <= 1.0:
        return "a match you can't tell apart"
    if de <= 2.0:
        return "very close, visible only up close"
    if de <= 3.5:
        return "close, a small difference at a glance"
    if de <= 6.0:
        return "noticeably different"
    return "a different shade"


def undertone(color: str) -> dict:
    """Rough undertone from the CIELAB hue angle of measured skin. A guide only: lighting
    and camera white balance move this number, so we say so in the UI."""
    L, a, b = hex_to_lab(color)
    angle = math.degrees(math.atan2(b, a))
    if angle >= 62:
        name = "warm (golden)"
    elif angle <= 48:
        name = "cool (pink)"
    else:
        name = "neutral"
    depth = "light" if L >= 70 else "medium" if L >= 50 else "deep"
    return {"undertone": name, "hue_angle": round(angle, 1), "depth": depth, "lightness": round(L, 1)}


@lru_cache(maxsize=1)
def catalogue() -> dict:
    return json.loads(CATALOGUE_PATH.read_text())


def match(target_hex: str, kind: str = "foundation", top: int = 3) -> list[dict]:
    target = hex_to_lab(target_hex)
    items = catalogue()["products"][kind]
    scored = []
    for item in items:
        de = ciede2000(target, hex_to_lab(item["hex"]))
        scored.append({**item, "delta_e": round(de, 2), "verdict": describe_delta(de)})
    scored.sort(key=lambda s: s["delta_e"])
    return scored[:top]


def catalogue_stats(target_hex: str, kind: str = "foundation") -> dict:
    """How much the match helps: best ΔE against the median ΔE of the whole range."""
    target = hex_to_lab(target_hex)
    des = sorted(ciede2000(target, hex_to_lab(i["hex"])) for i in catalogue()["products"][kind])
    mid = des[len(des) // 2] if len(des) % 2 else (des[len(des) // 2 - 1] + des[len(des) // 2]) / 2
    return {"best": round(des[0], 2), "median": round(mid, 2), "count": len(des)}


LIP_FAMILIES = {
    "warm (golden)": ("coral", "brick", "warm nude"),
    "cool (pink)": ("berry", "rose", "cool nude"),
    "neutral": ("rose", "warm nude", "berry", "coral"),
}


def lip_suggestions(measured_lip_hex: str, skin_undertone: str, top: int = 3) -> list[dict]:
    """Lip shades from families that tend to suit the undertone, ranked so the first is the
    closest to a gentle step up from the natural lip colour."""
    families = LIP_FAMILIES.get(skin_undertone, LIP_FAMILIES["neutral"])
    lip = hex_to_lab(measured_lip_hex)
    items = [i for i in catalogue()["products"]["lip"] if i["family"] in families]
    ranked = sorted(items, key=lambda i: ciede2000(lip, hex_to_lab(i["hex"])))
    return [{**i, "delta_e_from_lip": round(ciede2000(lip, hex_to_lab(i["hex"])), 2)} for i in ranked[:top]]


def shop_link(item: dict, template: str | None) -> str | None:
    """Build a store search link from a template the owner chose, e.g.
    https://example-store.test/search?q={q}. No affiliate tags are ever added."""
    if not template or "{q}" not in template:
        return None
    from urllib.parse import quote_plus
    return template.replace("{q}", quote_plus(item.get("search", item["name"])))

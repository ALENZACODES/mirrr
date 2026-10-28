"""Builds plumb_api/data/shades.json: an original, made up sample range so the app works
without any brand's data. Foundation shades are spread evenly in CIELAB across depth and
undertone. Swap this file for a licensed product feed with the same fields to go live.

Run from api/:  python scripts/build_sample_shades.py
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from plumb_api.services.shade import lab_to_rgb, rgb_to_hex  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "plumb_api" / "data" / "shades.json"

UNDERTONES = (("C", "cool", 47.0), ("N", "neutral", 56.0), ("W", "warm", 66.0))


def foundation() -> list[dict]:
    items = []
    steps = 24
    for i in range(steps):
        L = 87 - i * (87 - 26) / (steps - 1)
        # chroma rises from light to mid depth and eases off for the deepest shades,
        # which is roughly how measured skin colours behave in CIELAB
        t = i / (steps - 1)
        chroma = 13 + 19 * math.sin(math.pi * min(1.0, t * 1.25) / 2) - 9 * max(0.0, t - 0.7) / 0.3
        for code, name, hue in UNDERTONES:
            a = chroma * math.cos(math.radians(hue))
            b = chroma * math.sin(math.radians(hue))
            hex_ = rgb_to_hex(lab_to_rgb((L, a, b)))
            sid = f"F{i + 1:02d}{code}"
            items.append({"id": sid, "name": f"Sample Base {i + 1}{code}", "hex": hex_,
                          "undertone": name, "search": f"foundation {name} undertone shade {hex_}"})
    return items


LIPS = [
    ("L01", "Sample Lip Coral", "#E0614F", "coral"), ("L02", "Sample Lip Peach", "#D9826A", "coral"),
    ("L03", "Sample Lip Brick", "#A6402F", "brick"), ("L04", "Sample Lip Terracotta", "#B35A3C", "brick"),
    ("L05", "Sample Lip Honey Nude", "#C08A6E", "warm nude"), ("L06", "Sample Lip Toffee", "#9E6650", "warm nude"),
    ("L07", "Sample Lip Rosewood", "#B05A6A", "rose"), ("L08", "Sample Lip Petal", "#D47A8E", "rose"),
    ("L09", "Sample Lip Berry", "#8C2A4C", "berry"), ("L10", "Sample Lip Plum", "#6E2442", "berry"),
    ("L11", "Sample Lip Mauve Nude", "#A97A86", "cool nude"), ("L12", "Sample Lip Dusty Pink", "#C28A96", "cool nude"),
]
BLUSH = [
    ("B01", "Sample Blush Apricot", "#E8906E"), ("B02", "Sample Blush Rose", "#D8798A"),
    ("B03", "Sample Blush Berry", "#B0506A"), ("B04", "Sample Blush Terracotta", "#B8664C"),
]


def main() -> None:
    data = {
        "_note": "Made up sample range for demos. Not real products. No brand names, no affiliate links.",
        "products": {
            "foundation": foundation(),
            "lip": [{"id": i, "name": n, "hex": h, "family": f, "search": f"{f} lipstick {h}"} for i, n, h, f in LIPS],
            "blush": [{"id": i, "name": n, "hex": h, "search": f"blush {h}"} for i, n, h in BLUSH],
        },
    }
    OUT.write_text(json.dumps(data, indent=1))
    print(f"wrote {OUT} with {len(data['products']['foundation'])} foundation shades")


if __name__ == "__main__":
    main()

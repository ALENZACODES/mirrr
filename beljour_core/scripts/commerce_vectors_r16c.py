"""Offline commerce Python/TypeScript parity fixture (fictional products only).

Vector values come from the validated Python source and intentionally include deep
warm/cool as well as low-depth, concern and finish differences. Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plumb_api.commerce.catalogue import products  # noqa: E402
from plumb_api.commerce.ranking import Profile, rank  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / "parity" / "commerce-r16c.json"


def fixture() -> dict:
    scenarios = []
    for depth, tone, finish, concerns in [
        (9, "cool", "matte", {"redness": 12, "oiliness": 33}),
        (9, "warm", "matte", {"redness": 12, "oiliness": 33}),
        (10, "olive", "dewy", {"moisture": 8}),
        (1, "neutral", "natural", {}),
        (6, "warm", "satin", {"spots": 16}),
    ]:
        profile = Profile(depth, tone, "manual", evidence="Visitor selected this synthetic scenario")
        selected = rank(profile, concerns, finish=finish)
        scenarios.append({"profile": profile.to_json(), "finish": finish, "concerns": concerns,
                          "recommendations": [{"sku": r["product"]["id"], "score": r["score"],
                                               "why": r["why"]} for r in selected]})
    return {"format": "beljour-commerce-parity/1", "author": "John Khan",
            "products": [product.to_json() for product in products()], "scenarios": scenarios}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    rendered = json.dumps(fixture(), ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if not TARGET.is_file() or TARGET.read_text(encoding="utf-8") != rendered:
            raise SystemExit("commerce parity vector mismatch: regenerate with api/scripts/commerce_vectors_r16c.py")
        print("commerce: source and 5 rank scenarios verified")
    else:
        TARGET.write_text(rendered, encoding="utf-8")
        print(f"wrote {TARGET}: {len(fixture()['products'])} products")


if __name__ == "__main__":
    main()

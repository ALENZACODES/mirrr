"""Parity vectors for the browser's Still you check (web/src/layout/still-you.ts).

Draws two small test faces (no photo), makes three "after" versions of each (smoothed, skin
lightened, untouched), and records what the Python arena checks say: the marks found on the
original, how many each version keeps, and the skin and background L* shifts. Images are
stored as base64 RGB bytes. The web test recomputes everything in TypeScript and must match.

    python scripts/make_parity_qa.py           # write parity/still-you-qa.json
    python scripts/make_parity_qa.py --check   # fail if the file no longer matches Python
Author: John Khan.
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path

import numpy as np

API = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API))

from plumb_api.arena import marks as M  # noqa: E402
from plumb_api.arena import scorer  # noqa: E402
from plumb_api.arena.identity import central_zones  # noqa: E402
from plumb_api.arena.synthetic import drawn_face  # noqa: E402
from plumb_api.engines.core.filters import box_mean  # noqa: E402

OUT = API.parent / "parity" / "still-you-qa.json"
FORMAT = "beljour-parity-still-you/1"
CASES = (("medium", 3), ("very_dark", 5))
SIZE = (96, 116)


def _b64(image: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(image, dtype=np.uint8).tobytes()).decode("ascii")


def _round(v: float | None) -> float | None:
    return None if v is None else round(float(v), 9)


def afters(image: np.ndarray, skin: np.ndarray) -> dict[str, np.ndarray]:
    smooth = np.stack([box_mean(image[..., c].astype(float), 3) for c in range(3)], axis=-1)
    light = image.astype(float) + 22 * (skin >= 0.5)[..., None]
    return {"untouched": image.copy(), "smoothed": np.clip(np.rint(smooth), 0, 255).astype(np.uint8),
            "lightened": np.clip(np.rint(light), 0, 255).astype(np.uint8)}


def build() -> dict:
    cases = []
    for tone, seed in CASES:
        face = drawn_face(tone, seed=seed, width=SIZE[0], height=SIZE[1], freckles=8)
        image = face.image
        h, w = image.shape[:2]
        skin = central_zones((h, w))["skin"]
        iod = 0.33 * w
        found = M.find_marks(image, skin, iod)
        case = {"tone": tone, "width": w, "height": h, "iod": iod, "before": _b64(image),
                "marks": [[_round(m.x), _round(m.y), _round(m.radius), _round(m.contrast), m.area] for m in found],
                "afters": []}
        for name, after in afters(image, skin).items():
            kept = M.retention(found, after, iod)
            sdl, bdl = scorer.skin_shift(image, after, skin)
            case["afters"].append({"name": name, "image": _b64(after), "found": kept.found, "kept": kept.kept,
                                   "skin_dl": _round(sdl), "background_dl": _round(bdl),
                                   "lightened": scorer.lightened(sdl, bdl)})
        cases.append(case)
    return {"format": FORMAT, "about": "Python arena checks vs web/src/layout/still-you.ts", "cases": cases}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args(argv)
    data = build()
    text = json.dumps(data, indent=1) + "\n"
    if args.check:
        if not OUT.is_file() or json.loads(OUT.read_text(encoding="utf-8")) != json.loads(text):
            print("still-you parity: parity/still-you-qa.json is out of date; run scripts/make_parity_qa.py")
            return 1
        print("still-you parity: up to date")
        return 0
    OUT.write_text(text, encoding="utf-8")
    print(f"still-you parity: wrote {OUT} ({len(data['cases'])} cases)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Reference vectors for the five skin tools: Python bytes the browser port must match.

One drawn face (engines/skin/synthetic.py), its landmark points, and the Python output of
each tool at a few settings. web/test/skin-tools.test.mjs rebuilds the skin mask from the
same points in TypeScript and compares every byte (one step of tolerance, as the other
Python/TypeScript pairs allow). Drawn pixels only; no photographic test data.
Usage: python api/scripts/skin_tools_vectors.py [--check]
Author: John Khan.
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plumb_api.engines.core.refusal import Refusal  # noqa: E402
from plumb_api.engines.skin.studio import render  # noqa: E402
from plumb_api.engines.skin.synthetic import skin_face  # noqa: E402

TARGET = Path(__file__).resolve().parents[1] / "tests" / "goldens" / "skin-tools.json"
CASES: tuple[tuple[str, float, dict[str, Any]], ...] = (
    ("freckles", 60, {"density": 70, "seed": 7}),
    ("freckles", 100, {"density": 30, "seed": 11}),
    ("tan", 60, {"direction": "add", "undertone": "neutral"}),
    ("tan", 100, {"direction": "add", "undertone": "olive"}),
    ("tan", 50, {"direction": "remove", "undertone": "warm", "allow_lightening": True}),
    ("matte", 50, {}),
    ("matte", 100, {}),
    ("glow", 60, {"style": "cassis"}),
    ("glow", 100, {"style": "collioure"}),
    ("tone", 50, {"redness": 0}),
    ("tone", 100, {"redness": 100}),
)


def b64(a: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode("ascii")


def vectors() -> dict[str, Any]:
    face = skin_face("medium", seed=3, width=80, height=96)
    cases = []
    for tool, strength, params in CASES:
        result = render(tool, face.image, face.points, strength=strength, **params)
        if isinstance(result, Refusal):
            raise RuntimeError(f"{tool} refused the drawn face: {result.code}")
        cases.append({"tool": tool, "strength": strength, "params": params, "out": b64(result.image)})
    h, w = face.image.shape[:2]
    return {"author": "John Khan", "version": "skin-tools/1", "byte_tolerance": 1, "width": w, "height": h,
            "image": b64(face.image), "points": [[float(x), float(y)] for x, y in face.points[:, :2]],
            "cases": cases, "provenance": "code-drawn face and drawn patches; no human photographs"}


def main() -> int:
    ap = argparse.ArgumentParser(description="skin tool reference vectors")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    content = json.dumps(vectors(), indent=1, sort_keys=True) + "\n"
    if args.check:
        if not TARGET.is_file() or TARGET.read_text(encoding="utf-8") != content:
            print("skin tool vectors and Python source disagree; rerun without --check")
            return 1
        print("skin tool vectors match")
        return 0
    TARGET.write_text(content, encoding="utf-8")
    print(f"wrote {TARGET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Python -> TypeScript vectors for the photo studio (engines/studio) and the illustration looks
(filters/artistic/illustration.py): the drawn studio scene through every tool, three
backdrops on their own and the four illustration looks. web/test/studio.test.mjs renders the
same inputs and must match within one byte. `--check` fails on drift.

    python api/scripts/studio_vectors.py [--check]

Code-drawn scene only; no photograph. Author: John Khan.
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

from plumb_api.engines.studio import studio  # noqa: E402
from plumb_api.engines.studio.backdrops import render_backdrop  # noqa: E402
from plumb_api.engines.studio.synthetic import studio_scene  # noqa: E402
from plumb_api.filters.artistic.illustration import LOOKS, illustrate  # noqa: E402

TARGET = Path(__file__).resolve().parents[1] / "tests" / "goldens" / "studio.json"
TOOL_CASES: tuple[tuple[str, dict[str, Any]], ...] = (
    ("blur", {"strength": 80}), ("replace", {"backdrop": "cahors"}), ("replace", {"backdrop": "quimper"}),
    ("remove", {}), ("relight", {"strength": 100, "side": "upper-right"}),
    ("headshot", {"industry": "finance-law"}), ("authentic", {"strength": 100}),
)
BACKDROP_CASES = ("chinon", "rodez", "briancon")


def b64(a: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode("ascii")


def vectors() -> dict[str, Any]:
    scene = studio_scene("medium", width=96, height=120, seed=5)
    points = np.round(scene.points[:, :2], 9)   # exactly what the JSON carries to the browser
    tools = []
    for tool, options in TOOL_CASES:
        r = studio.render(tool, scene.image, scene.person, points, **options)
        tools.append({"tool": tool, "options": options, "channels": int(r.image.shape[2]), "out": b64(r.image),
                      "crops": [list(c) for c in r.crops]})
    backdrops = [{"id": b, "width": 64, "height": 48,
                  "out": b64(np.clip(np.rint(render_backdrop(b, 64, 48)), 0, 255).astype(np.uint8))} for b in BACKDROP_CASES]
    looks = [{"look": look, "out": b64(illustrate(look, scene.image).image)} for look in LOOKS]
    h, w = scene.image.shape[:2]
    return {"author": "John Khan", "version": "studio/1", "byte_tolerance": 1, "width": w, "height": h,
            "image": b64(scene.image), "person": b64((scene.person > 0.5).astype(np.uint8)),
            "points": points.tolist(),
            "tools": tools, "backdrops": backdrops, "looks": looks,
            "provenance": "code-drawn face, shoulders and wall; no human photographs"}


def main() -> int:
    ap = argparse.ArgumentParser(description="studio reference vectors")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    content = json.dumps(vectors(), indent=1, sort_keys=True) + "\n"
    if args.check:
        if not TARGET.is_file() or TARGET.read_text(encoding="utf-8") != content:
            print("studio vectors and Python source disagree; rerun without --check")
            return 1
        print("studio vectors match")
        return 0
    TARGET.write_text(content, encoding="utf-8")
    print(f"wrote {TARGET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

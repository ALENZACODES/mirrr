"""Reproducible synthetic eyes parity corpus; data, never counted as source.

Run: python -m plumb_api.engines.eyes.parity --write /path/to/parity/eyes-r15b.json
The output contains no person, image file, network result or external asset.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np

from .benchmark import DEFAULT_STYLES
from .contracts import FEATURES
from .engine import render_eyes
from .geometry import frames
from .specimens import specimen

STYLE_CASES = {
    "W59": ("classic", "volume", "mega"), "W60": ("cat", "doll", "wispy", "fox"),
    "W61": ("tint",), "W62": ("strip", "half_strip"), "W63": ("lengthening", "tubing"),
    "W64": ("batwing", "tightline", "soft_wing"), "W65": ("double_wing", "smoked_pencil", "gel", "shadow"),
    "W66": ("cut_crease", "smokey"), "W67": ("foil",), "W76": ("burgundy", "forest"),
}


def sparse_result(image: np.ndarray, mesh: np.ndarray, request: dict[str, Any]) -> dict[str, Any]:
    result = render_eyes(image, mesh, request)
    before = image.reshape(-1, image.shape[2])
    after = result.image.reshape(-1, image.shape[2])
    changed = np.flatnonzero(np.any(before != after, axis=1))
    coverage = result.coverage.ravel()
    supported = np.flatnonzero(coverage > 0)
    return {"request": request, "pixels": [[int(i), *[int(c) for c in after[i]]] for i in changed],
            "coverage": [[int(i), float(coverage[i])] for i in supported], "report": result.report}


def corpus() -> dict[str, Any]:
    fixtures, cases = [], []
    variants = ((55, 0, "monolid", "hooded"), (155, 19, "open", "deep_set"), (225, -24, "deep_set", "monolid"))
    for index, (tone, roll, right, left) in enumerate(variants):
        image, mesh, traces = specimen(80, 96, tone=tone, roll=roll, alpha=index == 1)
        fixtures.append({"id": index, "width": image.shape[1], "height": image.shape[0], "channels": image.shape[2],
                         "data": image.ravel().tolist(), "landmarks": mesh.tolist(), "traces": traces,
                         "frames": [frame.as_dict() for frame in frames(mesh, image.shape[1], image.shape[0])]})
        for feature in FEATURES:
            request = {"feature": feature, "style": DEFAULT_STYLES[feature], "amount": .72,
                       "anatomy": {"right": right, "left": left}, "observed_lashes": traces,
                       "natural_density": .18, "skin_depth": 1 - tone / 255,
                       "colour": [177, 88, 126], "angle": (-65, 0, 65)[index], "lower": True}
            cases.append({"fixture": index, **sparse_result(image, mesh, request)})
        if index == 0:
            for feature, styles in STYLE_CASES.items():
                for style in styles:
                    request = {"feature": feature, "style": style, "amount": .48,
                               "anatomy": {"right": right, "left": left}, "observed_lashes": traces,
                               "blend": .68, "smudge": .4, "lower": True}
                    cases.append({"fixture": index, **sparse_result(image, mesh, request)})
    return {"format": "eyes-r15b-parity/1", "author": "John Khan", "fixture_kind": "drawn mathematical fixtures",
            "pixel_tolerance": 1, "coverage_tolerance": 1e-8, "fixtures": fixtures, "cases": cases}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", type=Path)
    parser.add_argument("--check", type=Path)
    args = parser.parse_args()
    data = corpus()
    text = json.dumps(data, sort_keys=True, separators=(",", ":")) + "\n"
    if args.write:
        args.write.parent.mkdir(parents=True, exist_ok=True)
        args.write.write_text(text, encoding="utf-8")
    if args.check:
        if json.loads(args.check.read_text()) != data:
            print("Eyes parity data differs from the current implementation")
            return 1
    print(f"Eyes parity: {len(data['cases'])} cases on {len(data['fixtures'])} drawn fixtures")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

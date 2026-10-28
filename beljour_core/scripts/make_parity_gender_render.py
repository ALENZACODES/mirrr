"""Cross-language vectors for the R13 gender render path (per-region bisection).

Two drawn heads with hard-edged backgrounds: one feminine stop that needs the
outline regions scaled down, one masculine stop that does not. `--check` fails when
the committed JSON no longer matches Python. Drawn data only. Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.engines.shape import gender  # noqa: E402
from plumb_api.engines.shape.synthetic_heads import drawn_head  # noqa: E402

PATH = ROOT / "parity/gender-render.json"


def _r(value: object) -> object:
    if isinstance(value, np.ndarray):
        return _r(value.tolist())
    if isinstance(value, (list, tuple)):
        return [_r(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _r(v) for k, v in value.items()}
    if isinstance(value, (float, np.floating)):
        return round(float(value), 9)
    return value


def build() -> dict:
    cases = []
    for seed, stop in ((2, -66), (5, 33)):
        xyz, image = drawn_head(seed, width=120, height=138)
        points = np.round(xyz[:, :2], 6)
        result = gender.render_targets(image, points, stop)
        cases.append({"seed": seed, "slider": stop, "width": image.shape[1], "height": image.shape[0],
                      "image": image.ravel(), "points": points, "targets": result.targets,
                      "region_scales": result.region_scales, "failed": result.info["render_failed"],
                      "regions_tried": result.info["regions_tried"], "seam_ratio": result.info["seam_ratio"],
                      "effect_retention": result.info["effect_retention"]})
    return _r({"format": "beljour-gender-render-r13/1", "author": "John Khan", "synthetic": True,
               "float_tolerance": 1e-5, "cases": cases})  # type: ignore[return-value]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = json.dumps(build(), separators=(",", ":"), sort_keys=True) + "\n"
    if args.check:
        if not PATH.exists() or PATH.read_text(encoding="utf-8") != expected:
            raise SystemExit(f"{PATH.relative_to(ROOT)} is out of date; run {Path(__file__).name}")
        print("R13 gender-render vectors match the Python engine")
        return
    PATH.write_text(expected, encoding="utf-8")
    print(f"wrote {PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

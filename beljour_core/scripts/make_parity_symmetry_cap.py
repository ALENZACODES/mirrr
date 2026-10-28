"""Cross-language vectors for R13 symmetry targets: 15% IOD cap and head-angle gate.

Drawn meshes only: asymmetric, tilted, and drawn 3D heads turned about the vertical
axis. `--check` fails when the committed JSON no longer matches Python.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.engines.proportions import symmetry  # noqa: E402
from plumb_api.engines.proportions.synthetic import rolled, symmetric_face, with_asymmetry  # noqa: E402
from plumb_api.engines.shape.synthetic_heads import drawn_head  # noqa: E402
from plumb_api.engines.shape.turn_field import silhouette_depth  # noqa: E402

PATH = ROOT / "parity/symmetry-cap.json"


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


def _turned(seed: int, yaw: float) -> np.ndarray:
    xyz, _ = drawn_head(seed)
    px, pz = xyz[:, 0].mean(), silhouette_depth(xyz)
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    out = xyz.copy()
    x, z = xyz[:, 0] - px, xyz[:, 2] - pz
    out[:, 0], out[:, 2] = px + x * c + z * s, pz - x * s + z * c
    return np.round(out, 6)


def build() -> dict:
    asym = with_asymmetry(symmetric_face(), {"eyes": (6.0, -4.0), "mouth": (40.0, 1.0), "jaw": (6.0, 0.0)})
    meshes = [("asymmetric", np.round(asym, 6)), ("tilted", np.round(rolled(asym, 13), 6)),
              ("turned", _turned(1, 24)), ("near-frontal", _turned(3, 9))]
    cases = []
    for label, points in meshes:
        for strength in (0.0, 0.5, 1.0):
            r = symmetry.safe_targets(points, strength)
            cases.append({"id": label, "strength": strength, "mesh": points, "points": r.points,
                          "refused": r.refused, "reason": r.reason, "yaw": r.yaw_degrees, "roll": r.roll_degrees,
                          "scale": r.scale, "max_move_iod": r.max_move_iod, "raw_max_move_iod": r.raw_max_move_iod})
    return _r({"format": "beljour-symmetry-cap-r13/1", "author": "John Khan", "synthetic": True,
               "float_tolerance": 1e-6, "cases": cases})  # type: ignore[return-value]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = json.dumps(build(), separators=(",", ":"), sort_keys=True) + "\n"
    if args.check:
        if not PATH.exists() or PATH.read_text(encoding="utf-8") != expected:
            raise SystemExit(f"{PATH.relative_to(ROOT)} is out of date; run {Path(__file__).name}")
        print("R13 symmetry-cap vectors match the Python engine")
        return
    PATH.write_text(expected, encoding="utf-8")
    print(f"wrote {PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

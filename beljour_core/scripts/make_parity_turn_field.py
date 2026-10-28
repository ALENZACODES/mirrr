"""Cross-language vectors for the R13 turn field (regulariser, relax, ramp, pivot).

Drawn heads and drawn fields only; no photos or model files. `--check` fails when
the committed JSON no longer matches the Python engine. Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.engines.shape import turn, turn_field  # noqa: E402
from plumb_api.engines.shape.synthetic_heads import drawn_head  # noqa: E402
from plumb_api.engines.warp import field as fields  # noqa: E402

PATH = ROOT / "parity/turn-field.json"


def clean(value: object) -> object:
    if isinstance(value, np.ndarray):
        return clean(value.tolist())
    if isinstance(value, (list, tuple)):
        return [clean(item) for item in value]
    if isinstance(value, dict):
        return {str(key): clean(item) for key, item in value.items()}
    if isinstance(value, (float, np.floating)):
        return round(float(value), 9)
    if isinstance(value, np.integer):
        return int(value)
    return value


def build() -> dict:
    xyz, _ = drawn_head(3, width=200, height=230)
    xyz = np.round(xyz, 6)
    rng = np.random.default_rng(11)
    glitched = xyz.copy()
    ids = rng.choice(478, 8, replace=False)
    glitched[ids, 2] += rng.normal(0, 30, 8)
    glitched = np.round(glitched, 6)
    targets = []
    for label, mesh, yaw, pitch in (("clean-yaw", xyz, 8, 0), ("glitched-pitch", glitched, 0, -6)):
        proposed = turn.project(mesh, yaw, pitch, pivot="silhouette").points
        iod = turn.frame(mesh[:, :2]).iod
        report = turn_field.regularise_targets(mesh[:, :2], proposed, iod)
        targets.append({"id": label, "mesh": mesh, "yaw": yaw, "pitch": pitch, "iod": iod,
                        "proposed": proposed, "points": report.points,
                        "capped_vertices": report.capped_vertices, "max_strain": report.max_strain,
                        "retention": report.retention, "silhouette_depth": turn_field.silhouette_depth(mesh)})
    height, width = 48, 72
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    strong = 9.0 * np.exp(-(((xx - 20) / 4.0) ** 2 + ((yy - 24) / 4.0) ** 2)) * (xx - 20) / 4.0
    mild = 4.0 * np.exp(-(((xx - 54) / 4.0) ** 2 + ((yy - 24) / 4.0) ** 2)) * (xx - 54) / 4.0
    field = fields.Field(xx - strong - mild, yy + 0.3 * np.sin(xx / 7.0))
    relaxed = turn_field.relax_low_jacobian(field, iod=16.0)
    ramps = [[w, y, p, d, r, turn_field.ramp_px(w, y, p, d, r)]
             for w, y, p, d, r in ((300, 8, 0, 200, 3), (300, 2, 0, 200, 3), (300, 0, -6, 200, 3),
                                   (300, 8, 0, 40, 3), (120, 0, 0, 7, 3))]
    return clean({"format": "beljour-turn-field-r13/1", "author": "John Khan", "synthetic": True,
                  "float_tolerance": 1e-6, "targets": targets,
                  "relax": {"width": width, "height": height, "map_x": field.map_x.ravel(),
                            "map_y": field.map_y.ravel(), "iod": 16.0,
                            "attenuation": relaxed.attenuation.ravel(),
                            "regions_scaled": relaxed.regions_scaled, "rounds": relaxed.rounds},
                  "ramps": ramps})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = json.dumps(build(), separators=(",", ":"), sort_keys=True) + "\n"
    if args.check:
        current = PATH.read_text(encoding="utf-8") if PATH.exists() else ""
        if current != expected:
            raise SystemExit(f"{PATH.relative_to(ROOT)} is out of date; run {Path(__file__).name}")
        print("R13 turn-field vectors match the Python engine")
        return
    PATH.write_text(expected, encoding="utf-8")
    print(f"wrote {PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

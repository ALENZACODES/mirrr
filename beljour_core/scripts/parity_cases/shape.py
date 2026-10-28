#!/usr/bin/env python3
"""R6 golden vectors: the same face shape, gender and turning algorithms in two runtimes.

Sampled input XYZ and selected outputs are synthetic. Indices refer exclusively to the
existing R4/R5 canonical mesh tables, never to an independently authored contour table.
Face-mapping inspiration: DECA and 3DDFA_V2; concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from lab.python.beljour_lab.face_harness import synthetic_case  # noqa: E402
from plumb_api.engines.shape import gender, geometry, turn  # noqa: E402
from plumb_api.engines.shape.age import XorShift32, age_strength  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "parity/face-spikes-r6.json"
PROBES = (0, 1, 2, 9, 10, 13, 14, 17, 33, 61, 70, 93, 129, 132, 136, 148, 152, 168, 175, 205,
          234, 263, 291, 300, 358, 362, 377, 379, 386, 454, 468, 473)


def truncate(points: object) -> list[list[float]]:
    return [[round(float(v), 8) for v in points[i]] for i in PROBES]


def build() -> dict:
    vectors = []
    faces = []
    for seed in (1, 3, 5):
        xyz, _ = synthetic_case(seed)
        xyz = xyz.round(10)
        faces.append({"id": seed, "xyz": xyz.tolist(), "width": 180, "height": 200})
        for s in geometry.CONTROLS:
            for amount in (-77, 42, 100):
                output = geometry.target_mesh(xyz[:, :2], {s["id"]: amount})
                vectors.append({"kind": "shape", "face": seed, "id": s["id"], "amount": amount,
                                "sampled": truncate(output), "metrics": geometry.displacement(xyz[:, :2], output)})
        for stop in gender.STOPS:
            output, report = gender.recipe_targets(xyz[:, :2], stop)
            vectors.append({"kind": "gender", "face": seed, "slider": stop,
                            "sampled": truncate(output), "bands": report["requested_bands"],
                            "capped": report["capped_landmarks"]})
        for yaw, pitch, roll in ((-8, 0, 0), (8, 0, 0), (0, 6, 0), (0, -6, 0), (4, -3, 2), (0, 0, 10)):
            output = turn.project(xyz, yaw, pitch, roll)
            vectors.append({"kind": "turn", "face": seed, "yaw": yaw, "pitch": pitch, "roll": roll,
                            "sampled": truncate(output.points), "depth": [round(float(output.depth[i]), 8) for i in PROBES]})
    old = {}
    for stop in (-3, -2, -1, 1, 2, 3, 4, 5):
        older, fraction, raw = age_strength(stop)
        old[str(stop)] = {"older": older, "fraction": fraction, "raw": raw}
    rng = XorShift32(1024)
    return {"format": "beljour-r6-parity/1", "author": "John Khan", "synthetic_only": True,
            "probes": list(PROBES), "faces": faces, "vectors": vectors,
            "age_stops": old, "rng_first_12": [rng.next() for _ in range(12)]}

"""Reference vectors for local eye makeup (#35) and the Foundation step (#101 match).

Python bytes the browser port must match. Eye makeup runs on the eyes engine's drawn
specimen (engines/eyes/specimens.py, with its traced lashes); Foundation runs on the
arena's drawn face (arena/synthetic.py, freckles and moles included) with the shade the
finder matched on it. The finder result is stored, so the browser applies the same shade.
Outputs are stored as the changed pixels only. web/test/local-makeup.test.mjs compares
every byte (one step of tolerance, as the other Python/TypeScript pairs allow).
Drawn pixels only; no photographic test data.
Usage: python api/scripts/local_makeup_vectors.py [--check]
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

from plumb_api.arena.synthetic import drawn_face  # noqa: E402
from plumb_api.engines.core.refusal import Refusal  # noqa: E402
from plumb_api.engines.eyes.makeup import render_eye_makeup  # noqa: E402
from plumb_api.engines.eyes.specimens import specimen  # noqa: E402
from plumb_api.engines.shade.finder import find_reliable_shade  # noqa: E402
from plumb_api.engines.shade.foundation import foundation_from_match  # noqa: E402

TARGET = Path(__file__).resolve().parents[1] / "tests" / "goldens" / "local-makeup.json"
EYE_CASES: tuple[tuple[int, dict[str, Any]], ...] = (
    (0, {"strength": 70, "look": "vezelay", "traced": True}),
    (0, {"strength": 100, "look": "locronan", "traced": True}),
    (0, {"strength": 55, "look": "rocamadour", "traced": True, "anatomy": {"right": "hooded", "left": "monolid"}}),
    (0, {"strength": 80, "look": "vezelay", "traced": False}),
    (0, {"strength": 60, "look": "locronan", "traced": True, "shadow": 0.0, "liner": 0.5,
         "colours": {"liner": [30, 46, 92]}}),
    (1, {"strength": 75, "look": "rocamadour", "traced": True, "anatomy": {"right": "deep_set", "left": "open"}}),
)
FOUNDATION_CASES: tuple[tuple[str, float, str], ...] = (
    ("medium", 30, "best"), ("medium", 100, "alternative"), ("very_dark", 70, "best"),
)


def b64(a: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode("ascii")


def sparse(before: np.ndarray, after: np.ndarray) -> dict[str, str]:
    """The changed pixels only: row-major pixel indices (little-endian uint32) and their bytes."""
    flat_before = before.reshape(-1, before.shape[2])
    flat_after = after.reshape(-1, after.shape[2])
    changed = np.flatnonzero(np.any(flat_before != flat_after, axis=1))
    return {"index": b64(changed.astype("<u4")), "bytes": b64(flat_after[changed])}


def eye_vectors() -> dict[str, Any]:
    fixtures = []
    for tone, alpha in ((150, False), (95, True)):
        image, mesh, traces = specimen(96, 112, tone=tone, alpha=alpha)
        fixtures.append((image, mesh, traces))
    cases = []
    for index, params in EYE_CASES:
        image, mesh, traces = fixtures[index]
        options = {k: v for k, v in params.items() if k != "traced"}
        result = render_eye_makeup(image, mesh, lashes=traces if params["traced"] else (), **options)
        if isinstance(result, Refusal):
            raise RuntimeError(f"eye makeup refused a drawn specimen: {result.code}")
        cases.append({"fixture": index, "params": params, "changed": sparse(image, result.image),
                      "skipped": result.report["skipped"], "elements": sorted(result.report["elements"])})
    return {"fixtures": [{"width": f[0].shape[1], "height": f[0].shape[0], "channels": f[0].shape[2],
                          "image": b64(f[0]), "landmarks": f[1].tolist(), "traces": f[2]} for f in fixtures],
            "cases": cases}


def foundation_vectors() -> dict[str, Any]:
    faces: dict[str, Any] = {}
    cases = []
    for tone, strength, choice in FOUNDATION_CASES:
        face = drawn_face(tone, seed=3, width=120, height=144)
        match, _ = find_reliable_shade(face.image, face.points)
        if match.refused:
            raise RuntimeError(f"the shade finder refused the drawn {tone} face: {match.reason}")
        data = match.to_json()
        result = foundation_from_match(face.image, face.points, data, strength=strength, choice=choice)
        if isinstance(result, Refusal):
            raise RuntimeError(f"foundation refused the drawn {tone} face: {result.code}")
        faces[tone] = {"width": face.image.shape[1], "height": face.image.shape[0], "image": b64(face.image),
                       "points": [[float(x), float(y)] for x, y in face.points[:, :2]],
                       "measured_lab": data["measured_lab"], "best": data["best"], "alternative": data["alternative"]}
        cases.append({"tone": tone, "strength": strength, "choice": choice, "changed": sparse(face.image, result.image)})
    return {"faces": faces, "cases": cases}


def vectors() -> dict[str, Any]:
    return {"author": "John Khan", "version": "local-makeup/1", "byte_tolerance": 1,
            "eye_makeup": eye_vectors(), "foundation": foundation_vectors(),
            "provenance": "code-drawn specimens and faces; no human photographs"}


def main() -> int:
    ap = argparse.ArgumentParser(description="local eye makeup and foundation reference vectors")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    content = json.dumps(vectors(), indent=1, sort_keys=True) + "\n"
    if args.check:
        if not TARGET.is_file() or TARGET.read_text(encoding="utf-8") != content:
            print("local makeup vectors and Python source disagree; rerun without --check")
            return 1
        print("local makeup vectors match")
        return 0
    TARGET.write_text(content, encoding="utf-8")
    print(f"wrote {TARGET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

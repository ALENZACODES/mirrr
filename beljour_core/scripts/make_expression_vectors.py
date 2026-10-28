"""Expressions: the TypeScript copy of expressions.json and Python -> TypeScript vectors.

Writes `web/src/engines/shape/generated/expressions.ts` (never edited by hand) and
`api/tests/goldens/expressions.json`: for drawn meshes (a front face, a rolled face and an
open-mouth face), every expression at several amounts and strengths with the moved target
points and the guarded part scale, the SHA-256 of a striped test pattern rendered through each
expression (the browser must reproduce the exact bytes), and the coded refusals.
`--check` fails on drift. Author: John Khan.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
sys.path.insert(0, str(ROOT / "api/scripts"))
from make_face_part_vectors import HEIGHT, WIDTH, _r, pattern  # noqa: E402

from plumb_api.engines.core import regions  # noqa: E402
from plumb_api.engines.proportions.synthetic import rolled, symmetric_face  # noqa: E402
from plumb_api.engines.shape import expressions, parts  # noqa: E402

VECTORS = ROOT / "api/tests/goldens/expressions.json"
MIRROR = ROOT / "web/src/engines/shape/generated/expressions.ts"


def meshes() -> dict[str, np.ndarray]:
    front = symmetric_face(WIDTH, HEIGHT, face_width=150.0, face_length=200.0)
    open_mouth = front.copy()
    upper, lower = regions.MOUTH_LIPS[:2]
    open_mouth[lower, 1] += 9.0
    return {"front": np.round(front, 6), "rolled": np.round(rolled(front, 8.0), 6), "open_mouth": np.round(open_mouth, 6)}


def case(name: str, mesh: np.ndarray, expression: str, amount: float, strength: float) -> dict[str, Any]:
    row: dict[str, Any] = {"mesh": name, "expression": expression, "amount": amount, "strength": strength,
                           "refused": None, "moved": [], "guard": [], "sha256": None}
    try:
        outcome = expressions.render(pattern(), mesh, expression, amount=amount, strength=strength)
        moved = np.flatnonzero(np.any(outcome.targets != mesh, axis=1))
        row["moved"] = [[int(i), outcome.targets[i, 0], outcome.targets[i, 1]] for i in moved]
        row["guard"] = [[r["part"], r["side"], r["guard_scale"]] for r in outcome.metrics.get("parts", [])]
        row["sha256"] = hashlib.sha256(outcome.image.tobytes()).hexdigest()
        row["changed_pixels"] = outcome.metrics["changed_pixels"]
    except (expressions.ExpressionRefusal, parts.PartRefusal) as refusal:
        row["refused"] = refusal.code
    return row


def build() -> dict[str, Any]:
    faces = meshes()
    cases = []
    for expression in expressions.EXPRESSIONS:
        for amount, strength in ((100.0, 1.0), (50.0, 1.0), (100.0, 0.4), (0.0, 1.0)):
            cases.append(case("front", faces["front"], expression, amount, strength))
        cases.append(case("rolled", faces["rolled"], expression, 100.0, 1.0))
        cases.append(case("open_mouth", faces["open_mouth"], expression, 100.0, 1.0))
    out = {"format": "beljour-expression-vectors/1", "author": "John Khan", "synthetic": True, "version": expressions.VERSION,
           "float_tolerance": 1e-6, "image": [WIDTH, HEIGHT], "table": expressions.TABLE,
           "constants": {"open_mouth_ratio": expressions.OPEN_MOUTH_RATIO, "gap_tolerance": expressions.GAP_TOLERANCE},
           "faces": faces, "cases": cases}
    result: dict[str, Any] = _r(out)  # type: ignore[assignment]
    return result


def mirror() -> str:
    body = json.dumps(expressions.TABLE, separators=(",", ":"), ensure_ascii=False)
    return ("/** GENERATED from api/plumb_api/engines/shape/expressions.json. DO NOT EDIT.\n"
            " * Rebuild: python api/scripts/make_expression_vectors.py. Author: John Khan. */\n"
            f"export const EXPRESSION_TABLE = {body} as const;\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = json.dumps(build(), separators=(",", ":"), sort_keys=True) + "\n"
    generated = mirror()
    if args.check:
        for path, content in ((VECTORS, expected), (MIRROR, generated)):
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                raise SystemExit(f"{path.relative_to(ROOT)} is out of date; run {Path(__file__).name}")
        print("expression vectors and the TypeScript table match the Python engine")
        return
    MIRROR.write_text(generated, encoding="utf-8")
    VECTORS.write_text(expected, encoding="utf-8")
    print(f"wrote {VECTORS.relative_to(ROOT)} and {MIRROR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

"""Face part controls: the TypeScript copy of parts.json and Python -> TypeScript vectors.

Writes `web/src/engines/shape/generated/parts.ts` (the authored table, never edited by hand)
and `api/tests/goldens/face-parts.json`: drawn meshes only (a front face, a rolled face, a mildly
asymmetric face, a face with brows crowding the eyes and a face with one closed eye). Each
case records the requested targets of the points that move, the part regions and the
guarded render's per-part guard scale or its refusal code. A few renders of a striped test
pattern also record the SHA-256 of the output bytes, which the browser must reproduce
exactly. `--check` fails on drift.
Author: John Khan.
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
from plumb_api.engines.core import regions  # noqa: E402
from plumb_api.engines.proportions.synthetic import rolled, symmetric_face, with_asymmetry  # noqa: E402
from plumb_api.engines.shape import parts  # noqa: E402
from plumb_api.engines.shape.shape_guard import MIN_STRENGTH  # noqa: E402

VECTORS = ROOT / "api/tests/goldens/face-parts.json"
MIRROR = ROOT / "web/src/engines/shape/generated/parts.ts"
WIDTH, HEIGHT = 240, 300


def _r(value: object) -> object:
    if isinstance(value, np.ndarray):
        return _r(value.tolist())
    if isinstance(value, (list, tuple)):
        return [_r(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _r(v) for k, v in value.items()}
    if isinstance(value, (float, np.floating)):
        return round(float(value), 9)
    if isinstance(value, np.integer):
        return int(value)
    return value


def meshes() -> dict[str, np.ndarray]:
    front = symmetric_face(WIDTH, HEIGHT, face_width=150.0, face_length=200.0)
    gap = float(np.min(front[list(regions.RIGHT_EYE), 1]) - np.max(front[list(regions.RIGHT_BROW), 1]))
    crowded, touching = front.copy(), front.copy()
    for brow in (regions.RIGHT_BROW, regions.LEFT_BROW):
        crowded[list(brow), 1] += gap * 0.72
        touching[list(brow), 1] += gap * 0.97
    closed = front.copy()
    upper, lower = regions.EYE_LIDS["left"][:2]
    closed[upper, 1] = closed[lower, 1] - 0.3
    return {"front": np.round(front, 6), "rolled": np.round(rolled(front, 8.0), 6),
            "asymmetric": np.round(with_asymmetry(front, {"eyes": (2.0, -1.0), "mouth": (3.0, 1.0),
                                                          "brows": (1.0, -2.0)}), 6),
            "crowded": np.round(crowded, 6), "touching": np.round(touching, 6), "closed_eye": np.round(closed, 6)}


def requests() -> list[tuple[str, dict[str, float], float, bool]]:
    out: list[tuple[str, dict[str, float], float, bool]] = []
    for row in parts.CONTROLS:
        for amount in (-100.0, 100.0):
            out.append(("front", {row["id"]: amount}, 1.0, True))
    mixed = {"nose_width": -60.0, "nose_tip": 40.0, "lip_fullness": 60.0, "lip_corners": 30.0,
             "eye_size": 50.0, "brow_height": 40.0, "brow_tail": -30.0}
    capped = {"eye_size": 100.0, "eye_opening": 100.0}
    for name in ("front", "rolled", "asymmetric"):
        out += [(name, mixed, 0.5, True), (name, capped, 1.0, True), (name, {"nose_length": 100.0}, 1.0, True)]
    lowered = {"brow_height": -100.0, "brow_arch": -100.0, "brow_tail": -100.0}
    out += [("front", mixed, 0.0, True), ("front", mixed, 1.0, False), ("crowded", lowered, 1.0, True),
            ("crowded", {"eye_size": 100.0}, 1.0, True), ("touching", {"brow_height": 50.0}, 1.0, True),
            ("closed_eye", {"eye_opening": 100.0}, 1.0, True), ("closed_eye", {"nose_width": 50.0}, 1.0, True)]
    return out


def pattern() -> np.ndarray:
    """Stripes and a diagonal ramp; `web/test/face-parts.test.mjs` draws the same bytes."""
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    image = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    image[..., 0] = 60 + ((xx >> 2) % 2) * 120 + (yy % 7) * 3
    image[..., 1] = 90 + ((yy >> 2) % 2) * 100
    image[..., 2] = (xx * 3 + yy * 5) % 251
    return image


PIXEL_CASES = ({"nose_width": 100.0}, {"nose_tip": -70.0, "nose_bridge": 50.0},
               {"lip_fullness": -100.0, "lip_corners": 50.0}, {"eye_size": 100.0, "brow_arch": -60.0},
               {"eye_opening": -80.0, "brow_tail": 90.0})


def pixel_case(mesh: np.ndarray, values: dict[str, float]) -> dict[str, Any]:
    outcome = parts.render(pattern(), mesh, values, opted_in=True)
    return {"values": values, "sha256": hashlib.sha256(outcome.image.tobytes()).hexdigest(),
            "changed_pixels": outcome.metrics["changed_pixels"]}


def case(name: str, mesh: np.ndarray, values: dict[str, float], strength: float, opted_in: bool) -> dict[str, Any]:
    row: dict[str, Any] = {"mesh": name, "values": values, "strength": strength, "opted_in": opted_in,
                           "moved": [], "refused": None, "guard": []}
    try:
        targets = parts.target_mesh(mesh, values, strength=strength)
        moved = np.flatnonzero(np.any(targets != mesh, axis=1))
        row["moved"] = [[int(i), targets[i, 0], targets[i, 1]] for i in moved]
        image = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        outcome = parts.render(image, mesh, values, strength=strength, opted_in=opted_in)
        row["guard"] = [[r["part"], r["side"], r["guard_scale"]] for r in outcome.metrics.get("parts", [])]
        row["changed_pixels"] = outcome.metrics["changed_pixels"]
    except parts.PartRefusal as refusal:
        row["refused"] = refusal.code
    return row


def build() -> dict[str, Any]:
    faces = meshes()
    region_rows = []
    for name in ("front", "rolled"):
        mesh = faces[name]
        f = parts.frame(mesh)
        for part, side, core in parts.INSTANCES:
            region = parts.part_region(mesh, f, part, side, core)
            region_rows.append({"mesh": name, "part": part, "side": side, "margin": region.margin,
                                "hull": region.hull, "ring": region.ring})
    cases = [case(name, faces[name], values, strength, opted)
             for name, values, strength, opted in requests()]
    constants = {"ring_factor": parts.RING_FACTOR, "layout_factor": parts.LAYOUT_FACTOR,
                 "clearance": parts.CLEARANCE, "min_margin_iod": parts.MIN_MARGIN_IOD,
                 "min_part_iod": parts.MIN_PART_IOD, "max_move_iod": parts.MAX_MOVE_IOD,
                 "aperture_cap": parts.APERTURE_CAP, "band_soft": parts.BAND_SOFT,
                 "identity_minimum": parts.IDENTITY_MINIMUM, "min_strength": MIN_STRENGTH,
                 "identity_ids": list(parts.identity_proxy.DEFAULT_PROTECTED),
                 "geometry_tau": parts.identity_proxy.GEOMETRY_TAU}
    out = {"format": "beljour-face-parts/1", "author": "John Khan", "synthetic": True, "float_tolerance": 1e-6,
           "image": [WIDTH, HEIGHT], "version": parts.VERSION, "spec": parts.SPEC, "constants": constants,
           "faces": faces, "regions": region_rows, "cases": cases,
           "pixels": [pixel_case(faces["front"], values) for values in PIXEL_CASES]}
    result: dict[str, Any] = _r(out)  # type: ignore[assignment]
    return result


def mirror() -> str:
    body = json.dumps(parts.SPEC, separators=(",", ":"), ensure_ascii=False)
    return ("/** GENERATED from api/plumb_api/engines/shape/parts.json. DO NOT EDIT.\n"
            " * Rebuild: python api/scripts/make_face_part_vectors.py. Author: John Khan. */\n"
            f"export const PART_SPEC = {body} as const;\n"
            "export type PartControlId = typeof PART_SPEC.controls[number]['id'];\n")


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
        print("face part vectors and the TypeScript table match the Python engine")
        return
    MIRROR.write_text(generated, encoding="utf-8")
    VECTORS.write_text(expected, encoding="utf-8")
    print(f"wrote {VECTORS.relative_to(ROOT)} and {MIRROR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

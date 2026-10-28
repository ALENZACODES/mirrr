"""Drawn scenes and live Python vectors for the skin touch-up tools (#26, #27, #28).

Faces come from arena/synthetic.drawn_face (made-up mesh, drawn skin, drawn freckles and
moles with known positions). On top of them this module draws known-truth defects: raised
red blemishes, thin dark lines in the forehead and crow's-feet zones, and darker under-eye
crescents. Run as a script it prints the Python results as JSON for the browser mirror test
(web/test/skin-touch-up.test.mjs); nothing is written to disk. No photographs.
Author: John Khan.
"""
from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from typing import Any

import numpy as np

from plumb_api.arena.synthetic import drawn_face
from plumb_api.engines.skin import local_zones as Z
from plumb_api.engines.skin.blemish import heal_blemishes
from plumb_api.engines.skin.under_eye import brighten_under_eyes
from plumb_api.engines.skin.wrinkles import soften_lines

WIDTH, HEIGHT = 200, 240


@dataclass(frozen=True)
class Scene:
    image: np.ndarray
    points: np.ndarray
    marks: tuple[tuple[float, float, float], ...]      # drawn freckles and moles (x, y, radius)
    blemishes: tuple[tuple[float, float], ...]         # drawn red spots (x, y)
    lines: np.ndarray                                  # drawn line strength 0..1
    crescents: np.ndarray                              # drawn under-eye darkening 0..1


def _bytes(img: np.ndarray) -> np.ndarray:
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)


def scene(tone: str = "medium", *, seed: int = 3, blemishes: bool = True, lines: bool = False,
          circles: bool = False, alpha: bool = False) -> Scene:
    face = drawn_face(tone, seed=seed, width=WIDTH, height=HEIGHT, freckles=10)
    pts = face.points
    img = face.image.astype(np.float64)
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    spots: list[tuple[float, float]] = []
    if blemishes:
        for c in ((pts[50] + pts[205]) / 2, pts[9] + np.array([0.0, -8.0])):
            blob = np.exp(-((xx - c[0]) ** 2 + (yy - c[1]) ** 2) / (2 * 2.0 ** 2))
            img[..., 0] += 40 * blob
            img[..., 1] -= 25 * blob
            img[..., 2] -= 20 * blob
            spots.append((float(c[0]), float(c[1])))
    drawn = np.zeros((HEIGHT, WIDTH))
    if lines:
        for t in (0.45, 0.65):
            y0 = pts[10][1] + (pts[9][1] - pts[10][1]) * t
            drawn = np.maximum(drawn, np.exp(-((yy - y0) ** 2) / (2 * 0.8 ** 2)) * ((xx > 80) & (xx < 120)))
        for sign, corner in ((-1, pts[33]), (1, pts[263])):
            for k in (-1, 0, 1):
                x0, y0 = corner[0] + sign * 6, corner[1] + k * 4
                d = np.abs((yy - y0) - k * 0.3 * (xx - x0) * sign)
                seg = (sign * (xx - x0) >= 0) & (sign * (xx - x0) < 10)
                drawn = np.maximum(drawn, np.exp(-d ** 2 / (2 * 0.7 ** 2)) * seg)
        img = img * (1 - 0.22 * drawn[..., None])
    cres = np.zeros((HEIGHT, WIDTH), dtype=np.float64)
    if circles:
        frame = Z.face_frame(pts)
        skin = Z.skin_region(pts, HEIGHT, WIDTH)
        for side in Z.SIDES:
            cres = np.maximum(cres, Z.polygons_mask([Z.under_eye_polygon(pts, frame, side, 0.6)],
                                                    HEIGHT, WIDTH, skin, 2).astype(np.float64))
        img = img * (1 - 0.15 * cres[..., None]) * np.array([1.0, 0.98, 1.03]) ** cres[..., None]
    out = _bytes(img)
    if alpha:
        a = ((xx * 7 + yy * 3) % 200 + 55).astype(np.uint8)
        out = np.dstack([out, a])
    return Scene(out, pts, face.marks, tuple(spots), drawn, cres)


def _b64(a: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode("ascii")


def _case(kind: str, sc: Scene, params: dict[str, Any], result: Z.TouchUpResult) -> dict[str, Any]:
    report = result.report
    row: dict[str, Any] = {
        "kind": kind, "params": params, "width": WIDTH, "height": HEIGHT, "channels": int(sc.image.shape[2]),
        "image": _b64(sc.image), "points": sc.points.tolist(), "out": _b64(result.image),
        "status": result.status, "reason_code": result.reason_code}
    if kind == "heal":
        row["actions"] = [[s["kind"], s["action"], s["area"]] for s in report.get("spots", [])]
        row["taps"] = [t["code"] for t in report.get("taps", [])]
    if kind == "under_eye":
        row["sides"] = {k: v.get("action") for k, v in report.get("sides", {}).items()}
    return row


def vectors() -> dict[str, Any]:
    cases = []
    base = scene()
    mole = base.marks[0]
    for params in ({"strength": 100.0}, {"strength": 50.0, "method": "fast-marching"},
                   {"strength": 100.0, "taps": [[mole[0], mole[1]]], "keep": [list(base.blemishes[1])]}):
        cases.append(_case("heal", base, params, heal_blemishes(base.image, base.points, **params)))
    dark = scene("dark", seed=5, alpha=True)
    cases.append(_case("heal", dark, {"strength": 80.0}, heal_blemishes(dark.image, dark.points, strength=80.0)))
    lined = scene(blemishes=False, lines=True)
    for params in ({"strength": 100.0}, {"strength": 40.0, "zones": ["forehead"]}):
        cases.append(_case("lines", lined, params, soften_lines(lined.image, lined.points, **params)))
    shaded = scene("tan", seed=4, blemishes=False, circles=True, alpha=True)
    for strength, bags in ((100.0, True), (60.0, False)):
        cases.append(_case("under_eye", shaded, {"strength": strength, "include_bags": bags},
                           brighten_under_eyes(shaded.image, shaded.points, strength=strength, include_bags=bags)))
    cases.append(_case("under_eye", base, {"strength": 100.0}, brighten_under_eyes(base.image, base.points)))
    return {"format": "beljour-skin-touch-up-vectors/1", "author": "John Khan", "synthetic": True,
            "byte_tolerance": 1, "cases": cases}


if __name__ == "__main__":
    print(json.dumps(vectors()))

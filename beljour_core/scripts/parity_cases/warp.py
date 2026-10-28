"""Write the R5 parity vectors (parity/warp-fill-r5.json) and the Python warp/fill quality
reports (parity/warpfill-report-python.json).

Inputs are drawn from a seeded NumPy generator and stored explicitly, so the TypeScript side
never replays a random stream. Re-run after changing a warp, fill or Q12 kernel, then run
both suites:

    cd api && python scripts/make_parity.py warp
    cd api && python -m pytest -q tests/test_parity_r5.py
    cd web && npm test

Author: John Khan.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "api"))

from plumb_api.engines.proportions import symmetry, synthetic  # noqa: E402
from plumb_api.engines.warp import falloff, triangulate  # noqa: E402
from plumb_api.engines.warp.tps import border_pins  # noqa: E402
from plumb_api.quality import warp_parity, warpfill  # noqa: E402
from plumb_api.quality.parity import FORMAT, TOLERANCE, encode_array  # noqa: E402

OUT = ROOT / "parity" / "warp-fill-r5.json"
REPORTS = ROOT / "parity" / "warpfill-report-python.json"


class Builder:
    def __init__(self, seed: int) -> None:
        self.rng = np.random.default_rng(seed)
        self.vectors: list[dict[str, Any]] = []

    def add(self, kernel: str, args: dict[str, Any]) -> None:
        n = sum(1 for v in self.vectors if v["kernel"] == kernel) + 1
        vector = {"id": f"{kernel}#{n:03d}", "kernel": kernel, "args": args}
        vector["expected"] = warp_parity.evaluate(vector)
        self.vectors.append(vector)

    def pts(self, n: int, low: float, high: float) -> list[list[float]]:
        return [[round(float(x), 4), round(float(y), 4)] for x, y in self.rng.uniform(low, high, (n, 2))]

    def num(self, low: float, high: float, places: int = 4) -> float:
        return round(float(self.rng.uniform(low, high)), places)

    def u8(self, h: int, w: int, c: int = 3) -> dict[str, Any]:
        return encode_array(self.rng.integers(0, 256, (h, w, c), dtype=np.uint8))


def disc(h: int, w: int, cx: float, cy: float, r: float) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r).astype(np.float64)


def smooth(h: int, w: int, seed: int) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    k = 1 + seed % 5
    img = np.stack([90 + 6 * k * xx / w + 20 * np.sin(yy / (4 + k)), 70 + 60 * yy / h,
                    120 + 40 * np.cos((xx + k * yy) / 9)], -1)
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)


def warp_vectors(b: Builder) -> None:
    for k in range(6):
        src = b.pts(5 + k, 0, 40)
        dst = [[x + b.num(-3, 3), y + b.num(-3, 3)] for x, y in src]
        b.add("warp.tps_map", {"src": src, "dst": dst, "smooth": [0.0, 0.0, 0.5, 0.0, 2.0, 0.0][k],
                               "points": b.pts(6, -5, 45)})
    for k in range(5):
        h, w = 10 + k * 3, 12 + k * 2
        moved = b.pts(1 + k % 3, 3, min(h, w) - 3)
        to = [[x + b.num(-2, 2), y + b.num(-2, 2)] for x, y in moved]
        b.add("warp.tps_field", {"h": h, "w": w, "from": moved, "to": to,
                                 "pins": b.pts(2, 1, min(h, w) - 1) if k % 2 else [], "step": [1, 2, 3, 4, 5][k]})
    for mode in ("affine", "similarity", "rigid"):
        for k in range(3):
            p = b.pts(4 + k, 0, 50)
            q = [[x + b.num(-4, 4), y + b.num(-4, 4)] for x, y in p]
            pts = b.pts(8, -5, 55) + [p[0]]
            b.add("warp.mls_points", {"mode": mode, "alpha": [1.0, 0.5, 2.0][k], "p": p, "q": q, "points": pts})
    for k, mode in enumerate(("affine", "similarity", "rigid", "similarity")):
        h, w = 11 + k * 2, 13 + k
        moved = b.pts(3, 3, min(h, w) - 3)
        to = [[x + b.num(-1.5, 1.5), y + b.num(-1.5, 1.5)] for x, y in moved]
        b.add("warp.mls_field", {"h": h, "w": w, "from": moved, "to": to, "mode": mode, "alpha": 1.0,
                                 "step": [1, 2, 4, 3][k], "pin_border": k % 2 == 1})
    for k in range(5):
        pts = b.pts(6 + 4 * k, 0, 30) + [[0.0, 0.0], [30.0, 0.0], [0.0, 30.0], [30.0, 30.0]]
        b.add("warp.delaunay", {"points": pts})
    grid = [[float(x * 5), float(y * 5)] for y in range(4) for x in range(5)]
    b.add("warp.delaunay", {"points": grid})
    for k in range(4):
        h, w = 14 + k * 2, 16 + k * 3
        src = [list(p) for p in border_pins(w, h).tolist()] + b.pts(3, 3, min(h, w) - 3)
        tris = [list(t) for t in triangulate.delaunay(src)]
        dst = [list(p) for p in src[:-3]] + [[x + b.num(-1.5, 1.5), y + b.num(-1.5, 1.5)] for x, y in src[-3:]]
        b.add("warp.piecewise", {"h": h, "w": w, "src": src, "dst": dst, "triangles": tris})
        b.add("warp.triangle_flips", {"src": src, "dst": dst, "triangles": tris, "min_ratio": 0.2})
    for k in range(4):
        h, w = 9 + k, 11 + k
        yy, xx = np.mgrid[0:h, 0:w].astype(float)
        amp = [0.5, 1.5, 3.0, 6.0][k]
        mx = xx + amp * np.sin(yy / 2.0 + k)
        my = yy + amp * np.cos(xx / 3.0)
        field = {"map_x": encode_array(np.round(mx, 6)), "map_y": encode_array(np.round(my, 6))}
        b.add("warp.fold_report", {**field, "minimum": 0.2})
        b.add("warp.safe_strength", {**field, "minimum": 0.2})
        inner = {"map_x": encode_array(np.round(xx + 0.7 * np.cos(yy / 3), 6)), "map_y": encode_array(np.round(yy - 0.4, 6))}
        b.add("warp.compose", {"outer": field, "inner": inner})
    for kind in falloff.CURVES:
        b.add("warp.curve", {"kind": kind, "values": [-0.5, 0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0, 1.5]})
    for k, kind in enumerate(falloff.CURVES):
        h, w = 12 + k, 14 + k
        band = disc(h, w, w / 2, h / 2, 4 + k)
        b.add("warp.band_weights", {"band": encode_array(band), "ramp": [0.0, 2.0, 3.5, 5.0][k], "kind": kind})
        b.add("warp.radial_weights", {"h": h, "w": w, "cx": b.num(3, w - 3), "cy": b.num(3, h - 3),
                                      "radius": b.num(3, 8), "kind": kind})
    for k, method in enumerate(("tps", "mls-affine", "mls-similarity", "mls-rigid", "piecewise")):
        h, w = 16, 18
        img = smooth(h, w, k)
        band = disc(h, w, 9, 8, 6)
        params = {"method": method, "from": [6.0, 8.0, 12.0, 8.0, 9.0, 4.0], "to": [7.0, 8.5, 11.0, 8.0, 9.0, 4.0],
                  "band": "band", "ramp": 3.0}
        b.add("warp.engine", {"image": encode_array(img), "band": encode_array(band), "params": params})
    b.add("warp.engine", {"image": encode_array(smooth(14, 14, 7)), "band": None,
                          "params": {"method": "tps", "from": [5.0, 7.0, 9.0, 7.0], "to": [10.0, 7.0, 4.0, 7.0]}})


def fill_vectors(b: Builder) -> None:
    for k in range(5):
        h, w, c = 12 + k, 14 + k, 1 + k % 3
        values = np.round(b.rng.uniform(0, 1, (h, w, c)), 6)
        if k % 2 == 0:
            yy, xx = np.mgrid[0:h, 0:w]
            values = np.round(np.stack([0.1 + 0.03 * xx + 0.01 * j * yy for j in range(c)], -1), 6)
        mask = disc(h, w, w / 2, h / 2, 2.5 + k * 0.5)
        b.add("fill.fast_marching", {"values": encode_array(values), "mask": encode_array(mask),
                                     "radius": [3, 4, 5, 2, 6][k], "gradient": k != 3})
    for k in range(3):
        h, w = 9 + k, 10 + k
        hole = disc(h, w, w / 2, h / 2, 2 + k)
        b.add("fill.onion_peel", {"image": b.u8(h, w), "hole": encode_array(hole)})
    for k in range(5):
        h, w = 20 + 2 * k, 22 + 2 * k
        img = warpfill.grid_scene(h, w, 6, 3, 1) if k % 2 else smooth(h, w, k)
        hole = disc(h, w, w / 2 + k % 3, h / 2, 3 + k % 2)
        b.add("fill.patchmatch", {"image": encode_array(img), "mask": encode_array(hole),
                                  "patch_radius": [2, 3, 2, 3, 1][k], "iterations": [3, 4, 5, 2, 4][k], "seed": 11 + k})
    for k in range(4):
        h, w = 14 + k * 2, 16 + k * 2
        yy, xx = np.mgrid[0:h, 0:w].astype(float)
        values = np.round(0.2 + 0.001 * xx ** 2 + 0.002 * xx * yy - 0.0003 * yy ** 2 + 0.05 * np.sin(xx / 3) * (k % 2), 8)
        mask = disc(h, w, w / 2, h / 2, 3 + k)
        b.add("fill.biharmonic", {"values": encode_array(values), "mask": encode_array(mask)})
    for k, method in enumerate(("biharmonic", "fast-marching", "patchmatch", "biharmonic", "fast-marching", "patchmatch")):
        h, w = 18, 20
        img = smooth(h, w, k)
        hole = disc(h, w, 10, 9, 3)
        b.add("fill.fill", {"image": encode_array(img), "mask": encode_array(hole), "method": method,
                            "grow": [0.0, 0.0, 0.0, 1.5, 2.0, 1.0][k], "seed": 3 + k})
    for seed in (0, 1, 7, 2 ** 31 + 5, 2 ** 40 + 3):
        b.add("fill.xorshift", {"seed": seed, "count": 6})


def quality_vectors(b: Builder) -> None:
    for k in range(3):
        b.add("quality.grid_scene", {"h": 12 + k * 4, "w": 14 + k * 4, "spacing": 4 + k, "offset": 2, "thickness": 1})
    straight = warpfill.grid_scene(32, 36, 6, 3, 1)
    bent = straight.copy()
    bent[12:18, 10:20] = np.roll(bent[12:18, 10:20], 2, axis=0)
    band = disc(32, 36, 18, 16, 6)
    for img, bnd in ((straight, None), (bent, None), (bent, band), (straight, band)):
        b.add("quality.q12", {"image": encode_array(img), "band": encode_array(bnd) if bnd is not None else None,
                              "spacing": 6, "offset": 3, "thickness": 1})


def proportion_vectors(b: Builder) -> None:
    faces = []
    base = synthetic.symmetric_face()
    faces.append(base)
    faces.append(synthetic.with_asymmetry(base, {"eyes": (3.0, -2.0), "jaw": (-4.0, 0.0), "brows": (0.0, 2.5)}))
    faces.append(synthetic.rolled(synthetic.with_asymmetry(base, {"mouth": (2.0, 1.0), "nose": (-1.5, 0.0)}), 12.0))
    jitter = base + b.rng.normal(0, 1.2, base.shape)
    faces.append(synthetic.rolled(jitter, -7.0))
    faces.append(synthetic.symmetric_face(640, 480, face_width=260, face_length=330)[:468])
    for k, face in enumerate(faces):
        pts = [[round(float(x), 6), round(float(y), 6)] for x, y in face]
        regions = None if k % 2 == 0 else ["eyes", "jaw", "mouth"]
        b.add("proportions.symmetry", {"points": pts, "regions": regions})
        b.add("proportions.targets", {"points": pts, "strength": [0.0, 0.5, 1.0, 0.3, 0.75][k],
                                      "side": ["average", "right", "left", "average", "right"][k],
                                      "regions": regions, "midline": k != 3})
        if k < 3:
            small = (face - face.mean(0)) * 0.25 + [60.0, 70.0]
            moved = symmetry.targets(small, [1.0, 0.6, 0.9][k])
            sp = [[round(float(x), 6), round(float(y), 6)] for x, y in small]
            mv = [[round(float(x), 6), round(float(y), 6)] for x, y in moved]
            b.add("warp.anchor_ring", {"mesh": sp, "scale": [1.35, 1.2, 1.6][k], "count": [24, 16, 32][k]})
            b.add("warp.mesh_warp", {"h": 140, "w": 120, "before": sp, "after": mv, "strength": 1.0, "guard": k != 2})
        if len(face) == 478 or k == 4:
            b.add("proportions.ratios", {"points": pts, "set": ["golden", "classical", "custom", "golden", "classical"][k],
                                         "custom": {"thirds": [1, 1, 1], "mouth_nose_width": 1.4} if k == 2 else {}})


def build(seed: int = 20261022) -> dict[str, Any]:
    b = Builder(seed)
    warp_vectors(b)
    fill_vectors(b)
    quality_vectors(b)
    proportion_vectors(b)
    kernels = sorted({v["kernel"] for v in b.vectors})
    return {"format": FORMAT, "tolerance": TOLERANCE, "round": "R5", "kernels": kernels, "vectors": b.vectors}


def dump(value: Any) -> str:
    def clean(v: Any) -> Any:
        if isinstance(v, float) and not math.isfinite(v):
            return None
        if isinstance(v, dict):
            return {k: clean(x) for k, x in v.items()}
        if isinstance(v, list):
            return [clean(x) for x in v]
        return v
    return json.dumps(clean(value), separators=(",", ":")) + "\n"

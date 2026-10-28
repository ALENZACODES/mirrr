"""Write the shared parity vectors (CONTRACTS.md §16) to parity/core-r3.json.

Inputs come from a seeded NumPy generator and are stored explicitly, so the
TypeScript side never has to reproduce a random stream. Expected values are the
Python kernels' outputs. Re-run after changing a shared kernel, then run both suites:

    cd api && python scripts/make_parity_vectors.py
    cd api && python -m pytest -q tests/test_parity_r3.py
    cd web && npm test

Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))

from plumb_api.engines.core import pyramid, regions  # noqa: E402
from plumb_api.engines.core.blending import MODES  # noqa: E402
from plumb_api.quality import parity  # noqa: E402
from plumb_api.quality.samples import sample_report  # noqa: E402

OUT = ROOT / "parity" / "core-r3.json"
SAMPLE = ROOT / "parity" / "report-sample-python.json"
SHARMA = [
    ((50, 2.6772, -79.7751), (50, 0, -82.7485)), ((50, 3.1571, -77.2803), (50, 0, -82.7485)),
    ((50, -1.3802, -84.2814), (50, 0, -82.7485)), ((50, 0, 0), (50, -1, 2)),
    ((50, 2.49, -0.001), (50, -2.49, 0.0009)), ((50, 2.49, -0.001), (50, -2.49, 0.0011)),
    ((50, 2.5, 0), (50, 0, -2.5)), ((50, 2.5, 0), (73, 25, -18)),
    ((60.2574, -34.0099, 36.2677), (60.4626, -34.1751, 39.4387)),
    ((22.7233, 20.0904, -46.694), (23.0331, 14.973, -42.5619)),
]


class Builder:
    def __init__(self, seed: int) -> None:
        self.rng = np.random.default_rng(seed)
        self.vectors: list[dict[str, Any]] = []

    def add(self, kernel: str, args: dict[str, Any]) -> None:
        n = sum(1 for v in self.vectors if v["kernel"] == kernel) + 1
        vector = {"id": f"{kernel}#{n:03d}", "kernel": kernel, "args": args}
        vector["expected"] = parity.evaluate(vector)
        self.vectors.append(vector)

    # random inputs -----------------------------------------------------------
    def u8(self, *shape: int) -> dict[str, Any]:
        return parity.encode_array(self.rng.integers(0, 256, shape, dtype=np.uint8))

    def floats(self, *shape: int, low: float = 0.0, high: float = 1.0) -> dict[str, Any]:
        return parity.encode_array(np.round(self.rng.uniform(low, high, shape), 6))

    def binary(self, h: int, w: int, share: float) -> dict[str, Any]:
        return parity.encode_array((self.rng.random((h, w)) < share).astype(np.float64))

    def soft(self, h: int, w: int) -> dict[str, Any]:
        yy, xx = np.mgrid[0:h, 0:w]
        cx, cy = self.rng.uniform(1, w - 1), self.rng.uniform(1, h - 1)
        r = self.rng.uniform(1.5, max(2.0, min(h, w) / 2))
        alpha = np.clip(r - np.hypot(xx - cx, yy - cy), 0, 1)
        return parity.encode_array(np.round(alpha, 6))

    def num(self, low: float, high: float) -> float:
        return round(float(self.rng.uniform(low, high)), 6)


def colour_vectors(b: Builder) -> None:
    for k in range(8):
        values = [0.0, 0.04045, 0.040451, 1.0] if k == 0 else [b.num(0, 1) for _ in range(12)]
        b.add("colour.srgb_decode", {"values": values})
    for k in range(8):
        values = [0.0, 0.0031308, 0.0031309, 1.0, -0.05] if k == 0 else [b.num(-0.1, 1.2) for _ in range(12)]
        b.add("colour.srgb_encode", {"values": values})
    fixed = [[0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 128, 128]]
    for rgb in fixed + [[b.num(0, 255) for _ in range(3)] for _ in range(6)]:
        b.add("colour.rgb_to_lab", {"rgb": rgb})
    for _ in range(8):
        b.add("colour.lab_to_rgb", {"lab": [b.num(5, 95), b.num(-40, 40), b.num(-40, 40)]})
    for lab1, lab2 in SHARMA:
        b.add("colour.ciede2000", {"lab1": list(lab1), "lab2": list(lab2)})
    for _ in range(6):
        b.add("colour.ciede2000", {"lab1": [b.num(0, 100), b.num(-80, 80), b.num(-80, 80)],
                                   "lab2": [b.num(0, 100), b.num(-80, 80), b.num(-80, 80)]})
    for rgb in fixed[1:3] + [[b.num(0, 255) for _ in range(3)] for _ in range(6)]:
        b.add("colour.rgb_to_oklab", {"rgb": rgb})
    for _ in range(6):
        b.add("colour.oklab_to_rgb", {"lab": [b.num(0.2, 0.9), b.num(-0.15, 0.15), b.num(-0.15, 0.15)]})
    for t in (0.0, 0.25, 0.5, 0.75, 1.0, 0.33):
        b.add("colour.mix_oklab", {"rgb1": [b.num(0, 255) for _ in range(3)],
                                   "rgb2": [b.num(0, 255) for _ in range(3)], "t": t})


def maps(b: Builder, h: int, w: int, spread: float) -> tuple[dict[str, Any], dict[str, Any]]:
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    mx = np.round(xx + b.rng.uniform(-spread, spread, (h, w)), 6)
    my = np.round(yy + b.rng.uniform(-spread, spread, (h, w)), 6)
    return parity.encode_array(mx), parity.encode_array(my)


def buffer_vectors(b: Builder) -> None:
    for shape in ((4, 5, 3), (3, 3, 4), (6, 2, 3), (1, 7, 3)):
        b.add("buffer.decode", {"image": b.u8(*shape)})
    for shape in ((4, 5, 3), (3, 3, 3), (2, 6, 3), (5, 1, 3)):
        b.add("buffer.encode", {"image": b.floats(*shape, low=-0.1, high=1.1)})
    for k in range(10):
        channels = 4 if k % 3 == 2 else 3
        mx, my = maps(b, 5, 6, 2.5)
        b.add("buffer.remap", {"image": b.u8(4, 5, channels), "map_x": mx, "map_y": my,
                               "border": "constant" if k % 2 else "edge", "linear_light": k % 4 < 2})
    for spread in (0.0, 0.3, 0.8, 2.0):
        mx, my = maps(b, 6, 5, spread)
        b.add("buffer.jacobian", {"map_x": mx, "map_y": my})


def mask_vectors(b: Builder) -> None:
    for rect in ((1, 1, 4, 3), (-2, -1, 3, 9), (0, 0, 0, 0), (2, 3, 9, 9)):
        b.add("mask.rectangle", {"h": 5, "w": 6, "left": rect[0], "top": rect[1], "right": rect[2], "bottom": rect[3]})
    for feather in (0.0, 0.0, 0.3, 0.3, 0.6, 0.9):
        b.add("mask.ellipse", {"h": 7, "w": 8, "cx": b.num(2, 6), "cy": b.num(2, 5), "rx": b.num(1.5, 4),
                               "ry": b.num(1.5, 4), "feather": feather})
    for k in range(9):
        count = 3 + k % 6
        points = [[b.num(-1, 11), b.num(-1, 9)] for _ in range(count)]
        b.add("mask.polygon", {"h": 8, "w": 10, "points": points, "supersample": (1, 2, 4, 5)[k % 4]})
    face = synthetic_mesh(b)
    for name in ("face_oval", "lips_outer", "right_eye"):
        points = [[round(float(x), 6), round(float(y), 6)] for x, y in face[list(regions.CONTOURS[name])]]
        b.add("mask.polygon", {"h": 24, "w": 20, "points": points, "supersample": 4})
    for radius in (0, 1, 1, 2, 3, 6):
        b.add("mask.box_blur", {"mask": b.soft(6, 7), "radius": radius})
    for op in ("union", "intersection", "subtract", "union", "intersection", "subtract", "invert", "threshold"):
        b.add("mask.combine", {"op": op, "a": b.soft(5, 6), "b": b.soft(5, 6), "t": 0.4})
    b.add("mask.squared_edt", {"mask": parity.encode_array(np.zeros((4, 5)))})
    b.add("mask.squared_edt", {"mask": parity.encode_array(np.ones((4, 5)))})
    single = np.zeros((7, 9))
    single[3, 4] = 1
    b.add("mask.squared_edt", {"mask": parity.encode_array(single)})
    for share, shape in ((0.05, (9, 11)), (0.1, (12, 7)), (0.3, (6, 13)), (0.02, (15, 15)), (0.5, (1, 9))):
        b.add("mask.squared_edt", {"mask": b.binary(*shape, share)})
    for radius in (0, 1, 1.5, 2.2, 4):
        b.add("mask.dilate", {"mask": b.binary(8, 9, 0.08), "radius": radius})
        b.add("mask.erode", {"mask": b.binary(8, 9, 0.7), "radius": radius})
    for mode in ("inside", "centered", "outside"):
        for radius in (0, 1.5, 3):
            blob = np.zeros((10, 11))
            blob[2:8, 3:9] = 1
            blob[b.rng.integers(0, 10), b.rng.integers(0, 11)] = 1
            b.add("mask.feather", {"mask": parity.encode_array(blob), "radius": radius, "mode": mode})
    for k in range(6):
        guide = b.u8(7, 8, 3) if k % 2 else b.floats(7, 8)
        b.add("mask.guided", {"guide": guide, "source": b.soft(7, 8), "radius": 1 + k % 2,
                              "eps": (1e-3, 1e-2, 1e-4)[k % 3]})
    for band in (None, 2.0, None, 1.0):
        b.add("mask.edge_feather", {"mask": b.binary(8, 9, 0.5), "guide": b.u8(8, 9, 3),
                                    "radius": 2, "eps": 1e-3, "band": band})


def synthetic_mesh(b: Builder) -> np.ndarray:
    """478 points: the needed contours on concentric ellipses, other points at the centre."""
    pts = np.tile([10.0, 12.0], (478, 1))
    shapes = {"face_oval": (10, 12, 8, 10), "lips_outer": (10, 17, 4, 1.8), "lips_inner": (10, 17, 2.5, 0.6),
              "right_eye": (6.5, 9, 2, 1), "left_eye": (13.5, 9, 2, 1),
              "right_brow": (6.5, 6.8, 2.4, 0.7), "left_brow": (13.5, 6.8, 2.4, 0.7)}
    for name, (cx, cy, rx, ry) in shapes.items():
        loop = regions.CONTOURS[name]
        for k, index in enumerate(loop):
            angle = 2 * math.pi * k / len(loop) + b.rng.uniform(-0.05, 0.05)
            pts[index] = (cx + rx * math.cos(angle), cy + ry * math.sin(angle))
    return pts


def pyramid_vectors(b: Builder) -> None:
    for shape in ((7, 6), (8, 8), (5, 9, 3), (1, 6), (3, 1, 3), (2, 2)):
        b.add("pyramid.down", {"image": b.floats(*shape)})
    for coarse, target in (((4, 3), (7, 6)), ((4, 4), (8, 8)), ((3, 5, 3), (5, 9)), ((1, 3), (1, 6)),
                           ((2, 1, 3), (3, 1)), ((1, 1), (2, 2))):
        b.add("pyramid.up", {"image": b.floats(*coarse), "h": target[0], "w": target[1]})
    for shape, levels in (((9, 10), 3), ((8, 7, 3), 2), ((16, 12), 4), ((5, 5), 5)):
        b.add("pyramid.laplacian", {"image": b.floats(*shape), "levels": levels})
    for shape in ((7, 9), (4, 6, 3), (12, 12)):
        bands = pyramid.laplacian(np.round(b.rng.uniform(0, 1, shape), 6), 3)
        b.add("pyramid.collapse", {"bands": [parity.encode_array(x) for x in bands]})


def blend_vectors(b: Builder) -> None:
    edge = np.array([[0, 0, 0], [1, 1, 1], [0.5, 0.25, 0.75], [0.25, 0.5, 1]], dtype=np.float64)
    for mode in MODES:
        cb = np.vstack([edge, np.round(b.rng.uniform(0, 1, (4, 3)), 6)])
        cs = np.vstack([edge[::-1], np.round(b.rng.uniform(0, 1, (4, 3)), 6)])
        b.add("blend.mode", {"cb": parity.encode_array(cb), "cs": parity.encode_array(cs), "mode": mode})
    plan = [("multiply", "srgb", 1.0, True, 3), ("screen", "linear", 0.6, False, 3),
            ("soft-light", "srgb", 0.8, True, 4), ("color", "srgb", 1.0, True, 3),
            ("overlay", "linear", 1.0, True, 3), ("luminosity", "linear", 0.5, False, 4),
            ("hue", "srgb", 0.9, True, 3), ("normal", "srgb", 0.4, True, 4)]
    for mode, space, opacity, use_mask, top_channels in plan:
        b.add("blend.apply", {"base": b.u8(4, 5, 3), "top": b.u8(4, 5, top_channels), "mode": mode,
                              "opacity": opacity, "mask": b.soft(4, 5) if use_mask else None, "space": space})
    for k in range(4):
        channels = 4 if k == 3 else 3
        b.add("blend.alpha", {"base": b.u8(5, 4, channels), "overlay": b.u8(5, 4, channels),
                              "mask": b.soft(5, 4), "linear_light": k != 1})
    for shape, levels in (((9, 10, 3), 3), ((8, 8, 3), 2), ((12, 7, 3), 4), ((6, 6, 1), 2)):
        b.add("blend.multiband", {"a": b.floats(*shape), "b": b.floats(*shape),
                                  "mask": b.soft(*shape[:2]), "levels": levels})


def quality_vectors(b: Builder) -> None:
    for k in range(5):
        before = b.rng.integers(0, 256, (26, 24, 3), dtype=np.uint8)
        after = before.copy()
        mask = np.zeros((26, 24))
        mask[3:7, 4:8] = 1
        after[3:7, 4:8] = b.rng.integers(0, 256, (4, 4, 3), dtype=np.uint8)
        if k % 2:
            after[-1, -1] = np.minimum(255, after[-1, -1].astype(int) + 3 + k)
        b.add("quality.q1", {"before": parity.encode_array(before), "after": parity.encode_array(after),
                             "mask": parity.encode_array(mask)})
    for spread in (0.0, 0.2, 0.7, 1.6):
        mx, my = maps(b, 6, 6, spread)
        b.add("quality.q3", {"map_x": mx, "map_y": my})
    for k in range(5):
        yy, xx = np.mgrid[0:14, 0:16]
        before = np.stack([60 + 5 * xx, 80 + 3 * yy, 120 + 0 * xx], -1) + b.rng.integers(0, 6, (14, 16, 3))
        before = np.clip(before, 0, 255).astype(np.uint8)
        mask = np.clip(4.5 - np.hypot(xx - 8, yy - 7), 0, 1) if k % 2 else (np.hypot(xx - 8, yy - 7) < 4).astype(float)
        after = np.clip(before + mask[..., None] * (20 + 15 * k), 0, 255).astype(np.uint8)
        b.add("quality.q4", {"before": parity.encode_array(before), "after": parity.encode_array(after),
                             "mask": parity.encode_array(np.round(mask, 6))})
    for target in ("#B4283C", "#C89678", "#203040", "#FFFFFF"):
        b.add("quality.q6", {"image": b.u8(6, 7, 3), "mask": b.soft(6, 7), "target": target})
    for _ in range(4):
        b.add("quality.effect", {"before": b.u8(5, 6, 3), "after": b.u8(5, 6, 3), "mask": b.soft(5, 6)})
    for shape in ((8, 9, 3), (6, 6, 3), (12, 10, 3), (5, 7, 4)):
        b.add("quality.texture", {"image": b.u8(*shape), "mask": b.soft(*shape[:2])})


def extra_vectors(b: Builder) -> None:
    """LCh, resizing, the two reference engines and the harness's synthetic photo."""
    for _ in range(4):
        b.add("colour.lab_to_lch", {"lab": [b.num(5, 95), b.num(-60, 60), b.num(-60, 60)]})
    b.add("colour.lab_to_lch", {"lab": [50.0, 0.0, 0.0]})
    for _ in range(4):
        b.add("colour.lch_to_lab", {"lch": [b.num(5, 95), b.num(0, 80), b.num(0, 360)]})
    for turn in (0, 30, -45, 180, 400):
        b.add("colour.rotate_hue", {"rgb": [b.num(20, 235) for _ in range(3)], "degrees": turn})
    for (h, w), (th, tw), ch in (((9, 7), (4, 3), 3), ((8, 8), (8, 8), 3), ((10, 6), (3, 5), 4),
                                 ((5, 9), (1, 1), 3), ((7, 7), (2, 7), 4)):
        b.add("buffer.resize_area", {"image": b.u8(h, w, ch), "w": tw, "h": th})
    for (h, w), (th, tw), ch in (((4, 3), (9, 7), 3), ((5, 5), (5, 5), 3), ((3, 6), (7, 4), 4), ((6, 6), (2, 9), 3)):
        b.add("buffer.resize_bilinear", {"image": b.u8(h, w, ch), "w": tw, "h": th})
    for k, stops in enumerate((0.4, -0.7, 1.2, 0.0)):
        masks_in = {} if k == 0 else {"selection": b.soft(6, 7)}
        b.add("engine.exposure", {"image": b.u8(6, 7, 4 if k == 2 else 3), "masks": masks_in, "params": {"stops": stops}})
    for strength in (0.3, 1.0, 0.6):
        b.add("engine.tint", {"image": b.u8(6, 7, 3), "masks": {"selection": b.soft(6, 7)},
                              "params": {"rgb": [int(v) for v in b.rng.integers(0, 256, 3)], "strength": strength}})
    for seed, (h, w) in ((1, (24, 20)), (2, (16, 18)), (7, (12, 12))):
        b.add("harness.synthetic_photo", {"seed": seed, "h": h, "w": w})


def build(seed: int = 20261022) -> dict[str, Any]:
    b = Builder(seed)
    for part in (colour_vectors, buffer_vectors, mask_vectors, pyramid_vectors, blend_vectors, quality_vectors,
                 extra_vectors):
        part(b)
    return {
        "format": parity.FORMAT,
        "tolerance": parity.TOLERANCE,
        "seed": seed,
        "about": "Shared kernel vectors; expected values are the Python outputs. Author: John Khan.",
        "kernels": sorted({v["kernel"] for v in b.vectors}),
        "vectors": b.vectors,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--check", action="store_true", help="fail if the file on disk differs from a fresh build")
    args = ap.parse_args()
    document = build()
    text = json.dumps(document, separators=(",", ":"), sort_keys=True) + "\n"
    if args.check:
        current = args.out.read_text() if args.out.exists() else ""
        if current != text:
            print(f"{args.out} is out of date; run scripts/make_parity_vectors.py")
            return 1
        print(f"parity: {len(document['vectors'])} vectors up to date")
        return 0
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(text)
    SAMPLE.write_text(json.dumps(sample_report(), indent=1, sort_keys=True) + "\n")
    print(f"parity: wrote {len(document['vectors'])} vectors over {len(document['kernels'])} kernels to {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Reproducible reference vectors for the three local R15A colour treatments.

Drawn pixels and segmentation planes only; no photographic test data.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plumb_api.engines.eyes.iris_colour import iris_colour
from plumb_api.engines.skin.glow_tan import glow_tan
from plumb_api.engines.teeth.whiten import whiten

HERE = Path(__file__).resolve().parents[2] / "parity/r15a-easy-filters.json"


def b64(a: np.ndarray) -> str:
    return base64.b64encode(a.tobytes()).decode("ascii")


def fixture(width: int, height: int) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    result = np.empty((height, width, 3), dtype=np.uint8)
    result[..., 0] = np.asarray((80 + 3 * xx + 2 * yy) % 255, np.uint8)
    result[..., 1] = np.asarray((90 + xx + 4 * yy) % 255, np.uint8)
    result[..., 2] = np.asarray((70 + 2 * xx + yy) % 255, np.uint8)
    return result


def pack(kind: str, image: np.ndarray, mask: np.ndarray, output: np.ndarray, **params: object) -> dict[str, object]:
    h, w = image.shape[:2]
    return {"kind": kind, "width": w, "height": h, "image": b64(image),
            "mask": b64(mask.astype(np.uint8)), "out": b64(output), "params": params}


def vectors() -> dict[str, object]:
    out = []
    image = fixture(26, 24)
    mask = np.zeros((24, 26), np.uint8)
    mask[8:19, 5:22] = 1
    image[9:13, 7:20] = [214, 204, 184]
    image[15:18, 7:20] = [75, 35, 28]
    for strength in (0, 50, 100):
        rendered = whiten(image, mask, strength=strength)
        out.append(pack("teeth", image, mask, rendered.image, strength=strength))
    yy, xx = np.mgrid[:30, :30]
    image = fixture(30, 30)
    iris = ((((xx - 14) / 10) ** 2 + ((yy - 14) / 9) ** 2) < 1).astype(np.uint8)
    image[13:15, 13:15] = [12, 13, 12]
    image[8:11, 18:21] = [242, 244, 241]  # original specular reflection
    for shade in ("forest", "amber", "slate"):
        rendered = iris_colour(image, iris, shade=shade, strength=75)
        out.append(pack("iris", image, iris, rendered.image, shade=shade, strength=75))
    image = fixture(32, 32)
    skin = np.zeros((32, 32), dtype=np.uint8)
    skin[3:29, 3:29] = 1
    for undertone, freckles in (("olive", True), ("cool", False), ("warm", True)):
        rendered = glow_tan(image, skin, undertone=undertone, freckles=freckles, strength=72, seed=73)
        out.append(pack("tan", image, skin, rendered.image,
                        undertone=undertone, freckles=freckles, strength=72, seed=73))
    return {"author": "John Khan", "version": "r15a-easy/1", "byte_tolerance": 1,
            "cases": out, "provenance": "synthetic arithmetic and invented masks, no human photographs"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    content = json.dumps(vectors(), indent=2, sort_keys=True) + "\n"
    if args.check:
        if not HERE.is_file() or HERE.read_text(encoding="utf-8") != content:
            print("R15A easy parity source and fixture drift")
            return 1
        print("r15a easy parity: generated vectors match")
        return 0
    HERE.write_text(content, encoding="utf-8")
    print(f"r15a easy parity: wrote {HERE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

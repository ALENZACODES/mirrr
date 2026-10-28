"""Reference vectors for the local teeth, beard and grey tools: Python bytes the browser
port must match.

Drawn faces only (engines/teeth/synthetic.py and the arena's drawn face); no photographs.
Each fixture stores its image and landmark points once; each case stores only the pixels
that changed (row-major indices as little-endian uint32 and their bytes).
web/test/hair-beard-teeth.test.mjs compares every byte with one step of tolerance, as the
other Python/TypeScript pairs allow.
Usage: python api/scripts/hair_beard_teeth_vectors.py [--check]
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

from plumb_api.engines.core.refusal import Refusal  # noqa: E402
from plumb_api.engines.haircolour.grey import grey_preview  # noqa: E402
from plumb_api.engines.haircolour.grey_synthetic import grey_hair  # noqa: E402
from plumb_api.engines.shave.remove import remove_beard  # noqa: E402
from plumb_api.engines.shave.synthetic import bearded_face  # noqa: E402
from plumb_api.engines.teeth.natural import whiten_teeth  # noqa: E402
from plumb_api.engines.teeth.synthetic import smile_face  # noqa: E402

TARGET = Path(__file__).resolve().parents[1] / "tests" / "goldens" / "hair-beard-teeth.json"
TEETH_FIXTURES = (("medium", "yellowish", False), ("very_dark", "ivory", True), ("very_light", "ivory", False))
TEETH_CASES = ((0, 30), (0, 100), (1, 65), (2, 100))
# Fixture 2 has a skin-coloured hand over the right half of the mouth (the occluder case).
HAND_FIXTURE = 2
BEARD_FIXTURES = (("medium", "stubble", 1, 2, False), ("dark", "short_boxed", 3, 4, True))
BEARD_CASES = ((0, 100, ()), (0, 40, ()), (1, 80, ((100.0, 170.0),)))
GREY_FIXTURES = (("dark_brown", 0.5, False), ("black", 0.4, True))
GREY_CASES = ((0, "cover", 100, None), (0, "blend", 60, None), (0, "silver", 80, None), (1, "cover", 70, None),
              (1, "cover", 50, (30.0, 4.0, 6.0)))


def b64(a: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode("ascii")


def sparse(before: np.ndarray, after: np.ndarray) -> dict[str, str]:
    flat_before = before.reshape(-1, before.shape[2])
    flat_after = after.reshape(-1, after.shape[2])
    changed = np.flatnonzero(np.any(flat_before != flat_after, axis=1))
    return {"index": b64(changed.astype("<u4")), "bytes": b64(flat_after[changed])}


def fixture(image: np.ndarray, points: np.ndarray) -> dict[str, Any]:
    return {"width": image.shape[1], "height": image.shape[0], "channels": image.shape[2], "image": b64(image),
            "points": [[float(x), float(y)] for x, y in points[:, :2]]}


def hand_over_mouth(image: np.ndarray, points: np.ndarray) -> np.ndarray:
    """A block of the face's own skin colour across the right half of the mouth and past its edge."""
    out = image.copy()
    left, right = points[61, 0], points[291, 0]
    top, bottom = points[0, 1], points[17, 1]
    centre = (left + right) / 2
    skin = np.median(image[int(points[1, 1]) - 2:int(points[1, 1]) + 2, int(points[1, 0]) - 2:int(points[1, 0]) + 2].reshape(-1, 3), axis=0)
    out[int(top) - 3:int(bottom) + 4, int(centre):int(right) + 6] = np.rint(skin).astype(np.uint8)
    return out


def teeth_vectors() -> dict[str, Any]:
    images = []
    for tone, shade, alpha in TEETH_FIXTURES:
        face = smile_face(tone, teeth=shade, width=120, height=144, gap=0.35)
        image = face.image
        if len(images) == HAND_FIXTURE:
            image = hand_over_mouth(image, face.points)
        if alpha:
            h, w = image.shape[:2]
            image = np.dstack([image, ((np.arange(h * w) * 7) % 256).reshape(h, w).astype(np.uint8)])
        images.append((image, face.points))
    cases = []
    for index, strength in TEETH_CASES:
        image, points = images[index]
        result = whiten_teeth(image, points, strength=strength)
        if isinstance(result, Refusal):
            raise RuntimeError(f"teeth whitening refused a drawn smile: {result.code}")
        cases.append({"fixture": index, "strength": strength, "changed": sparse(image, result.image)})
    return {"fixtures": [fixture(i, p) for i, p in images], "cases": cases}


def beard_vectors() -> dict[str, Any]:
    images = []
    for tone, style, length, density, alpha in BEARD_FIXTURES:
        face = bearded_face(tone, style=style, length=length, density=density, width=120, height=144)
        image = face.image
        if alpha:
            h, w = image.shape[:2]
            image = np.dstack([image, ((np.arange(h * w) * 3) % 256).reshape(h, w).astype(np.uint8)])
        images.append((image, face.points))
    cases = []
    for index, strength, keep in BEARD_CASES:
        image, points = images[index]
        taps = [[x * 120 / 200, y * 144 / 240] for x, y in keep]
        result = remove_beard(image, points, strength=strength, keep=taps)
        if isinstance(result, Refusal):
            raise RuntimeError(f"beard removal refused a drawn beard: {result.code}")
        cases.append({"fixture": index, "strength": strength, "keep": taps, "scope": result.metrics["scope"],
                      "changed": sparse(image, result.image)})
    return {"fixtures": [fixture(i, p) for i, p in images], "cases": cases}


def grey_vectors() -> dict[str, Any]:
    fixtures = []
    for shade, share, alpha in GREY_FIXTURES:
        hair = grey_hair(shade, grey_share=share, width=72, height=60)
        image = hair.image
        if alpha:
            h, w = image.shape[:2]
            image = np.dstack([image, ((np.arange(h * w) * 13) % 256).reshape(h, w).astype(np.uint8)])
        fixtures.append((image, hair.mask))
    cases = []
    for index, stage, strength, natural in GREY_CASES:
        image, mask = fixtures[index]
        result = grey_preview(image, mask, stage=stage, strength=strength, natural_lab=natural)
        if isinstance(result, Refusal):
            raise RuntimeError(f"grey preview refused drawn hair: {result.code}")
        cases.append({"fixture": index, "stage": stage, "strength": strength,
                      "natural": None if natural is None else list(natural), "changed": sparse(image, result.image)})
    return {"fixtures": [{"width": i.shape[1], "height": i.shape[0], "channels": i.shape[2], "image": b64(i),
                          "mask": b64(np.rint(m * 255).astype(np.uint8))} for i, m in fixtures], "cases": cases}


def vectors() -> dict[str, Any]:
    return {"author": "John Khan", "version": "hair-beard-teeth/1", "byte_tolerance": 1, "teeth": teeth_vectors(),
            "beard": beard_vectors(), "grey": grey_vectors(),
            "provenance": "code-drawn faces; no human photographs"}


def main() -> int:
    ap = argparse.ArgumentParser(description="teeth, beard and grey reference vectors")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    content = json.dumps(vectors(), indent=1, sort_keys=True) + "\n"
    if args.check:
        if not TARGET.is_file() or TARGET.read_text(encoding="utf-8") != content:
            print("hair, beard and teeth vectors and Python source disagree; rerun without --check")
            return 1
        print("hair, beard and teeth vectors match")
        return 0
    TARGET.write_text(content, encoding="utf-8")
    print(f"wrote {TARGET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

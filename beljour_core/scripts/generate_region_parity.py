"""Generate deterministic mask vectors using only the Python canonical contours.

The vectors contain *full* float masks rather than selected checksums: the
TypeScript test compares every pixel against Python's anti-aliased output.
Only artificial geometry is used. No personal photos, keys or network access.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.engines.core import regions  # noqa: E402


def ellipse(cx: float, cy: float, rx: float, ry: float, n: int, phase: float = 0) -> list[list[float]]:
    return [[cx + rx * math.cos(2 * math.pi * i / n + phase),
             cy + ry * math.sin(2 * math.pi * i / n + phase)] for i in range(n)]


def synthetic_mesh(kind: int) -> list[list[float]]:
    """478 distinct mesh indices laid out in small, named synthetic facial regions."""
    points = [[0.5 + 0.11 * math.sin(i * 2.39996),
               0.5 + 0.15 * math.cos(i * 1.788), 0.02 * math.sin(i)] for i in range(478)]
    p = [(x, y, z) for x, y, z in points]
    scale = [1.0, 0.9, 1.08][kind]
    dx = [0, -0.035, 0.04][kind]
    dy = [0, 0.035, -0.018][kind]

    def put(indices: tuple[int, ...], cx: float, cy: float, rx: float, ry: float, phase: float = 0) -> None:
        for idx, (x, y) in zip(indices, ellipse(cx, cy, rx, ry, len(indices), phase), strict=True):
            p[idx] = (x, y, 0.015 * math.cos(idx))

    put(regions.FACE_OVAL, 0.5, 0.53, 0.28, 0.42)
    put(regions.LIPS_OUTER, 0.5, 0.71, 0.116, 0.046)
    put(regions.LIPS_INNER, 0.5, 0.71, 0.084, 0.021)
    put(regions.RIGHT_EYE, 0.385, 0.42, 0.08, 0.034)
    put(regions.LEFT_EYE, 0.615, 0.42, 0.08, 0.034)
    put(regions.RIGHT_BROW, 0.385, 0.34, 0.087, 0.02)
    put(regions.LEFT_BROW, 0.615, 0.34, 0.087, 0.02)
    for centre, surrounding, cx in ((468, (469, 470, 471, 472), 0.385),
                                    (473, (474, 475, 476, 477), 0.615)):
        p[centre] = (cx, 0.42, 0)
        for idx, (x, y) in zip(surrounding, ellipse(cx, 0.42, 0.018, 0.018, 4), strict=True):
            p[idx] = (x, y, 0)
    return [[round((x - 0.5) * scale + 0.5 + dx, 8),
             round((y - 0.5) * scale + 0.5 + dy, 8), round(z, 8)] for x, y, z in p]


def build() -> dict:
    cases: list[dict] = []
    for kind, (w, h, s) in enumerate(((64, 80, 2), (45, 51, 4), (72, 66, 1))):
        mesh = synthetic_mesh(kind)
        expected = {}
        for name in regions.REGIONS:
            mask = regions.region_mask(name, mesh, h, w, supersample=s)
            expected[name] = {"shape": [h, w], "data": mask.reshape(-1).tolist()}
        cases.append(dict(id=f"face-{kind+1:02}", width=w, height=h, supersample=s,
                          landmarks=mesh, expected=expected))
    return dict(format="beljour-regions-parity/1", tolerance=1 / 255,
                source="api/plumb_api/engines/core/regions.py", cases=cases)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    path = ROOT / 'parity' / 'face-regions-r4.json'
    value = json.dumps(build(), separators=(',', ':'), ensure_ascii=False) + '\n'
    if args.check:
        if not path.is_file() or path.read_text() != value:
            raise SystemExit('Region parity vectors are stale; run api/scripts/generate_region_parity.py')
        print('face-region parity vectors match Python regions.py')
    else:
        path.write_text(value)
        print('wrote', path)


if __name__ == '__main__':
    main()

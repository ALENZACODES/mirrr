"""Python -> TypeScript check vectors for the portrait looks (vectors.json beside this file).

`build()` renders, from the Python engine, every look on drawn faces of three skin tones at the
gentle default, the evening sparkle look and a definition-led look at full strength on all
three, strength 0 on an RGBA photo (byte-for-byte identity, alpha kept) and a half-strength
RGBA render (alpha untouched). The browser test (web/test/portrait-looks.test.mjs) renders the
same cases with web/src/filters/portrait/ and must land within one byte level everywhere, with
the same status, refusal code, glint count and marks found and kept. Drawn fixtures only; no
photo of a person. scripts/sync_filters.py writes this file and `--check` fails on drift.
Author: John Khan.
"""
from __future__ import annotations

import base64
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import numpy as np

from ..qa import fixtures as F
from . import compose
from . import looks as L

FORMAT = "beljour-portrait-vectors/1"
PATH = Path(__file__).resolve().parent / "vectors.json"
TONES = ("very_light", "medium", "very_dark")
WIDTH, HEIGHT, GRAIN = 64, 76, 3.0
DECIMALS = 9


def b64(img: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(img, dtype=np.uint8).tobytes()).decode("ascii")


def faces() -> list[F.Portrait]:
    return [F.portrait(t, width=WIDTH, height=HEIGHT, grain=GRAIN) for t in TONES]


def with_alpha(rgb: np.ndarray) -> np.ndarray:
    """A drawn RGBA photo: a diagonal alpha ramp, so any change to alpha shows."""
    h, w = rgb.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    alpha = (64 + (xx * 3 + yy * 2) % 192).astype(np.uint8)
    return np.dstack([rgb, alpha])


def cases() -> list[tuple[int, str, float, bool]]:
    """(face, look, strength, rgba)."""
    out = [(i % len(TONES), look.id, 30.0, False) for i, look in enumerate(L.default())]
    out += [(i, "PL13", 100.0, False) for i in range(len(TONES))]
    out += [(i, "PL04", 100.0, False) for i in range(len(TONES))]
    out += [(1, "PL01", 0.0, True), (2, "PL08", 60.0, True)]
    return out


def _identity(r: compose.Result) -> dict[str, Any] | None:
    i = r.identity
    if i is None:
        return None
    return {"marksFound": i.marks_found, "marksKept": i.marks_kept, "irisKept": round(i.iris_kept, DECIMALS),
            "skinLift": round(i.skin_lift, DECIMALS), "polishUsed": round(i.polish_used, DECIMALS), "passed": i.passed}


def build() -> dict[str, Any]:
    drawn = faces()
    face_rows = [{"tone": p.face.tone, "image": b64(p.image), "points": np.asarray(p.face.points)[:, :2].tolist()}
                 for p in drawn]
    renders = []
    for face, look_id, strength, rgba in cases():
        image = with_alpha(drawn[face].image) if rgba else drawn[face].image
        r = compose.render(image, drawn[face].face.points, look_id, strength)
        renders.append({"face": face, "look": look_id, "strength": strength, "rgba": rgba, "out": b64(r.image),
                        "status": r.status, "code": r.code, "glints": r.glints, "identity": _identity(r)})
    return {"format": FORMAT, "author": "John Khan",
            "about": "Portrait looks, written by api/plumb_api/filters/portrait/vectors.py. Drawn faces only.",
            "width": WIDTH, "height": HEIGHT, "tolerance": {"byte": 1, "lift": 0.05},
            "faces": face_rows, "renders": renders}


def dumps(doc: Mapping[str, Any]) -> str:
    """Compact JSON; a NaN or infinity anywhere is an error, not a silent null."""
    return json.dumps(doc, separators=(",", ":"), ensure_ascii=False, allow_nan=False) + "\n"


def write(path: Path = PATH) -> None:
    path.write_text(dumps(build()), encoding="utf-8")

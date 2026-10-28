"""Byte-level reproducibility evidence for the two original FX2 texture kernels.

This file provides fixture data only, never a claim that a real face passed
quality review. The browser test consumes the committed file, while the Python
suite independently regenerates it and rejects drift. Each vector includes a
whole-frame position, optional crop offset and parameter boundaries.
Created by John Khan.
"""
from __future__ import annotations

import base64
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import numpy as np

from .. import oplist
from ..colour import ops as O
from ..colour import space as S
from ..frame import Frame

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "parity/filters-fx2-texture.json"
FIXTURE_CASES = (
    ("fine-daylight", 19, 13, 19, 13, 0, 0, 0.6, 104729, 0.012, 0.015),
    ("offset-window", 18, 15, 267, 181, 41, 29, 1.0, 87113, 0.036, 0.012),
    ("evening-low", 23, 17, 23, 17, 0, 0, 0.25, 727, 0.018, 0.022),
    ("cropped-cover", 11, 9, 395, 283, 170, 69, 0.83, 104729, 0.024, 0.005),
    ("zero-strength", 20, 14, 20, 14, 0, 0, 0.0, 104729, 0.012, 0.015),
    ("studio-highlights", 21, 16, 297, 213, 13, 41, 0.48, 4294967295, 0.028, 0.06),
)


def pixels(w: int, h: int, offset_x: int, offset_y: int) -> np.ndarray:
    """Synthetic 8-bit patterns, clean-white reference and neutral patches."""
    out = np.empty((h, w, 3), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            xx, yy = x + offset_x, y + offset_y
            r = (xx * 31 + yy * 13 + 29) % 256
            g = (xx * 17 + yy * 47 + 109) % 256
            b = (xx * 19 + yy * 23 + 41) % 256
            if (x + y) % 17 == 0:
                r, g, b = 255, 255, 255
            elif (2 * x + y) % 19 == 0:
                r, g, b = 0, 0, 0
            elif (x + 3 * y) % 13 == 0:
                r, g, b = 141, 141, 141
            out[y, x] = (r, g, b)
    return out


def _params(op: str, amount: float, seed: int, radius: float,
            threshold: float) -> dict[str, Any]:
    if op == "spatial.grain":
        return O.full_params(oplist.op(op), {"amount": amount, "seed": seed})
    return O.full_params(
        oplist.op(op),
        {"amount": amount, "radius": radius, "threshold": threshold},
    )


def build() -> dict[str, Any]:
    """Six deterministic scenes x two kernels, no data about real people."""
    records: list[dict[str, Any]] = []
    for name, width, height, photo_w, photo_h, x0, y0, strength, seed, radius, floor in FIXTURE_CASES:
        frame = Frame(photo_w, photo_h, x0, y0)
        source = pixels(width, height, x0, y0)
        for op in ("spatial.grain", "spatial.structure"):
            params = _params(op, strength, seed, radius, floor)
            out = oplist.op(op).apply(S.bytes_to_unit(source), params, frame)
            records.append({
                "case": name,
                "op": op,
                "width": width,
                "height": height,
                "frame": {"width": photo_w, "height": photo_h, "x0": x0, "y0": y0},
                "params": params,
                "input_b64": base64.b64encode(source.tobytes()).decode("ascii"),
                "output_b64": base64.b64encode(S.unit_to_bytes(out).tobytes()).decode("ascii"),
            })
    return {
        "format": "beljour-original-texture-parity/1",
        "author": "John Khan",
        "source": "synthetic-only",
        "encoding": "rgb-u8-base64",
        "real_faces": 0,
        "vectors": records,
    }


def dumps(data: Mapping[str, Any]) -> str:
    return json.dumps(data, ensure_ascii=False, indent=1) + "\n"


def check() -> list[str]:
    if not PATH.exists():
        return ["texture parity file is missing"]
    original = PATH.read_text(encoding="utf-8")
    if original != dumps(build()):
        return ["texture parity file differs from the Python source"]
    return []

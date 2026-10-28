"""Deterministic byte evidence for BELJOUR Time Warp Scan, no real images.

Writes only synthetic input/output byte hashes, sizes and progress. To check
parity from the repository root, run with ``--check``. Author: John Khan.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.filters.artistic.time_warp import (  # noqa: E402
    ScanOptions,
    TimeWarpScan,
)

DESTINATION = ROOT / "parity" / "filters-timewarp.json"
U8 = NDArray[np.uint8]


def synthetic(width: int, height: int, channels: int, capture: int) -> U8:
    output = np.empty((height, width, channels), dtype=np.uint8)
    for y in range(height):
        for x in range(width):
            for c in range(channels):
                output[y, x, c] = (19 * x + 31 * y + 37 * c + 53 * capture) % 256
    return output


def sha(image: U8) -> str:
    return hashlib.sha256(image.tobytes(order="C")).hexdigest()


def case(width: int, height: int, channels: int, axis: str,
         direction: str, step: int) -> dict[str, Any]:
    initial = synthetic(width, height, channels, 0)
    options = ScanOptions(axis=axis, direction=direction, step=step)
    session = TimeWarpScan(initial, options)
    observed: list[dict[str, Any]] = []
    for capture in range(1, 2 + session.extent // step):
        if session.state.value == "complete":
            break
        incoming = synthetic(width, height, channels, capture)
        result = session.advance(incoming)
        observed.append({
            "capture": capture,
            "state": result.state.value,
            "frozen": result.frozen,
            "nextLine": result.next_line,
            "imageSha256": sha(result.image),
            "userReviewRequired": result.user_review_required,
            "realFacesEvaluated": result.real_faces_evaluated,
        })
    return {
        "width": width,
        "height": height,
        "channels": channels,
        "axis": axis,
        "direction": direction,
        "step": step,
        "initialSha256": sha(initial),
        "states": observed,
    }


def build() -> dict[str, Any]:
    configs = (
        (11, 8, 3, "horizontal", "forward", 1),
        (11, 8, 4, "horizontal", "reverse", 3),
        (11, 8, 3, "vertical", "forward", 2),
        (11, 8, 4, "vertical", "reverse", 5),
        (3, 2, 4, "vertical", "forward", 3),
        (7, 5, 3, "horizontal", "reverse", 2),
    )
    return {
        "format": "beljour-timewarp/1",
        "scope": "synthetic_byte_parity_not_real_faces",
        "creator": "John Khan",
        "cases": [case(*cfg) for cfg in configs],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)
    output = json.dumps(build(), indent=2, sort_keys=True) + "\n"
    if args.check:
        if not DESTINATION.is_file() or DESTINATION.read_text(encoding="utf-8") != output:
            print("Time Warp parity vectors have drifted")
            return 1
        print("Time Warp parity vectors verified")
        return 0
    DESTINATION.write_text(output, encoding="utf-8")
    print(f"wrote {DESTINATION.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

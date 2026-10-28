"""Record synthetic cross-language evidence; no generated source. Author: John Khan."""
from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "api"))
from tests.artistic_helpers import drawn  # noqa: E402

from plumb_api.filters.artistic import render  # noqa: E402
from plumb_api.filters.artistic.types import hash_noise  # noqa: E402


def encode(values: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(values).tobytes()).decode("ascii")


def vectors() -> dict[str, Any]:
    inputs, raw = [], []
    for width, height, tone, rgba in ((40, 48, 33, False), (52, 60, 128, True), (64, 72, 201, False)):
        image, mesh, hair, eyes = drawn(width, height, tone=tone, rgba=rgba)
        inputs.append({"width": width, "height": height, "channels": image.shape[2],
                       "image": encode(image), "mesh": mesh.tolist(),
                       "hair": hair.ravel().tolist(), "eyes": eyes.ravel().tolist()})
        raw.append((image, mesh, hair, eyes))
    cases = []
    settings = (
        ("ink-study", {}),
        ("ink-study", {"amount": 1, "levels": 3, "ink": 1, "shadow": 0.4}),
        ("pigment-oil", {}),
        ("pigment-oil", {"radius": 6, "texture": 1, "seed": 2147483647, "brush_angle": 1.25}),
        ("rain-expression", {"adult_confirmed": True}),
        ("rain-expression", {"amount": 1, "asymmetry": -1, "phase": 0.25, "expression": 1, "adult_confirmed": True}),
        ("meadow-crown", {}),
        ("meadow-crown", {"flowers": 5, "palette": "violet", "height": -0.12, "seed": 2147483647}),
    )
    for index, (image, mesh, hair, eyes) in enumerate(raw):
        for effect, params in settings:
            output = render(effect, image, landmarks=mesh, hair_mask=hair, eye_mask=eyes, params=params)
            cases.append({"input": index, "effect": effect, "params": params,
                          "image": encode(output.image), "support": output.support.ravel().tolist(),
                          "metrics": output.metrics, "label": output.label, "warnings": list(output.warnings)})
    hashes = [{"x": x, "y": y, "seed": seed,
               "value": float(hash_noise(np.array(x), np.array(y), seed))}
              for x, y, seed in ((0, 0, 0), (10, 17, 1), (8191, 8191, 2147483647), (3, 7, 19))]
    return {"format": "beljour-artistic-parity/1", "author": "John Khan",
            "source": "drawn synthetic texture, no person or photograph", "inputs": inputs,
            "cases": cases, "hashes": hashes, "tolerance": {"byte": 1, "support": 1e-9, "metric": 1e-7}}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    path = ROOT / "parity/artistic-local.json"
    expected = json.dumps(vectors(), sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n"
    if args.check:
        if not path.is_file() or path.read_text() != expected:
            print("artistic parity vectors drifted")
            return 1
        print("artistic parity vectors current")
    else:
        path.write_text(expected)
        print(f"wrote {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

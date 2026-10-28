"""Generate/check original synthetic Python->TypeScript short-sides parity vectors.

All pixels are deterministic equations, not a photograph, trained model or borrowed
asset. This script is deliberately offline and makes no provider calls.
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

from plumb_api.engines.menshair import HairAnchors, available_presets, render_style

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / "parity" / "menshair-r16c.json"


def encoded(value: np.ndarray) -> str:
    return base64.b64encode(value.tobytes()).decode("ascii")


def vector(width: int, height: int, alpha: bool, use_scalp: bool) -> dict[str, object]:
    yy, xx = np.mgrid[0:height, 0:width]
    count = 4 if alpha else 3
    input_image = np.zeros((height, width, count), dtype=np.uint8)
    input_image[..., 0] = ((xx * 19 + yy * 13 + 37) % 256).astype(np.uint8)
    input_image[..., 1] = ((xx * 7 + yy * 23 + 61) % 256).astype(np.uint8)
    input_image[..., 2] = ((xx * 29 + yy * 3 + 89) % 256).astype(np.uint8)
    if alpha:
        input_image[..., 3] = ((xx * 17 + yy * 11 + 71) % 256).astype(np.uint8)
    hair = (np.square((xx + 0.5 - width * 0.5) / (width * 0.26)) +
            np.square((yy + 0.5 - height * 0.34) / (height * 0.29)) <= 1).astype(np.uint8) * 255
    scalp = np.zeros((height, width), dtype=np.uint8)
    if use_scalp:
        scalp[height//3:height//2, width//3:2*width//3] = 120
    anchors = HairAnchors.parse({
        "left_temple": [0.28, 0.34], "right_temple": [0.72, 0.34], "crown": [0.5, 0.11],
        "left_ear": [0.24, 0.59], "right_ear": [0.76, 0.59], "nape": [0.5, 0.83],
    })
    scenarios = []
    for preset in available_presets()[:18]:
        # R16 frozen reference remains scoped to its first 18 original styles.
        result, evidence = render_style(input_image, hair, anchors, preset,
                                        scalp_mask=scalp if use_scalp else None)
        scenarios.append({"style_id": preset.id, "expected": encoded(result),
                          "affected_pixels": evidence["affected_pixels"],
                          "mask_support_pixels": evidence["mask_support_pixels"]})
    return {"width": width, "height": height, "channels": count, "with_scalp": use_scalp,
            "image": encoded(input_image), "hair_mask": encoded(hair),
            "scalp_mask": encoded(scalp) if use_scalp else None,
            "anchors": anchors.to_json(), "scenarios": scenarios}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    doc = {"format": "beljour-menshair-parity/1", "author": "John Khan",
           "source": "deterministic locally drawn arrays (no face photos)",
           "tolerance_byte": 1,
           "examples": [vector(16, 16, False, False), vector(26, 18, True, True),
                        vector(32, 25, True, False)]}
    rendered = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not TARGET.is_file() or TARGET.read_text(encoding="utf-8") != rendered:
            raise SystemExit("menshair parity data out of date: run api/scripts/menshair_vectors_r16c.py")
        print(f"menshair parity vectors verified: {len(doc['examples'])} fixtures x 18 styles")
    else:
        TARGET.write_text(rendered, encoding="utf-8")
        print(f"wrote {TARGET}: {len(doc['examples'])} fixtures x 18 styles")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

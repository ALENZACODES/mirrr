"""Python-to-browser parity vectors for the two-swatch fibre colour plan (r31f).

Thirty fixed synthetic cases built only from the original hair palette: a pair of
catalogue swatches, a corrected reading made from one of their 5 percent mixes with
a small fixed lightness offset, and the plan's outcome (chosen share, mixed RGB and
Lab, measured depth levels, CIEDE2000 distance or refusal code). The browser test
web/test/r31f-parity.test.mjs recomputes every case with web/src/commerce/two-tone.ts
and must match the RGB, shares, levels and codes exactly and the distances within
1e-6. Writes and checks parity/colour-sim-r31f.json. Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

from ..hair_palette.catalogue import catalogue
from ..shade import colourspace as cs
from .shade_support import FibreReading
from .two_tone import STEP_PERCENT, mix_rgb, plan_two_tone

PARITY = Path(__file__).resolve().parents[4] / "parity" / "colour-sim-r31f.json"
FORMAT = "beljour-colour-sim-parity/1"
CASES = 30
OFFSETS = (-1.5, 0.0, 1.5)  # L* offsets applied to the reading, cycling by case
DEEP_OFFSET = -20.0  # every tenth case from k = 7: a much deeper reading, to exercise refusals


def parity_cases() -> list[dict[str, Any]]:
    shades = catalogue()
    out: list[dict[str, Any]] = []
    for k in range(CASES):
        first = shades[(7 * k) % len(shades)]
        second = shades[(13 * k + 5) % len(shades)]
        percent = (15 * k) % (100 + STEP_PERCENT) // STEP_PERCENT * STEP_PERCENT
        lab = cs.srgb_to_lab(np.asarray(mix_rgb(first.rgb, second.rgb, percent), dtype=np.float64))
        offset = DEEP_OFFSET if k % 10 == 7 else OFFSETS[k % 3]
        lightness = max(0.0, float(lab[0]) + offset)
        reading_lab = [round(lightness, 6), round(float(lab[1]), 6), round(float(lab[2]), 6)]
        approve = k % 5 == 4
        plan = plan_two_tone(FibreReading((reading_lab[0], reading_lab[1], reading_lab[2]), "neutral"),
                             first.id, second.id, approve_lighter=approve)
        best = plan.best
        out.append({"id": f"r31f-{k:02d}", "first_id": first.id, "second_id": second.id,
                    "reading_lab": reading_lab, "approve_lighter": approve, "code": plan.code,
                    "reading_level": plan.reading_level,
                    "second_percent": None if best is None else best.percent,
                    "rgb": None if best is None else list(best.rgb),
                    "lab": None if best is None else [round(v, 9) for v in best.lab],
                    "level": None if best is None else best.level,
                    "delta_e": None if best is None else round(best.delta_e, 9)})
    return out


def parity_payload() -> dict[str, Any]:
    return {"format": FORMAT, "author": "John Khan", "synthetic": True, "tolerance_delta_e": 1e-6,
            "note": "Screen-space two-swatch estimates from the original palette; not physical mixtures.",
            "cases": parity_cases()}


def write_parity(path: Path = PARITY) -> None:
    path.write_text(json.dumps(parity_payload(), indent=1) + "\n", encoding="utf-8")


def parity_in_sync(path: Path = PARITY) -> bool:
    return bool(json.loads(path.read_text(encoding="utf-8")) == parity_payload())


if __name__ == "__main__":
    if "--check" in sys.argv[1:]:
        if not parity_in_sync():
            raise SystemExit("colour-sim-r31f parity is stale; run without --check")
        print("Two-tone colour parity in sync")
    else:
        write_parity()
        print(f"Wrote {PARITY}")

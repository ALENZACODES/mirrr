"""Planned scalp-cover and pigment-distance contract shared with the browser fibre engine.

Two source-derived vector sets, written to parity/fibre-coverage-r35f.json and checked
by web/src/commerce/fibre-parity.ts:

* 164 planned-cover vectors: the 41 decimal fibre levels 1.0..5.0 (0.1 steps) times
  four starting scalp shares. Each uses the production strands.cut_for_level() and
  crown.level() labels: planned share = start share * (1 - cut). ASSUMED starting
  shares: the three committed crown level cut points (0.12, 0.25, 0.45) and a fully
  visible 1.0.
* 91 pigment distance pairs: CIEDE2000 between every pair of the 14 original LS5
  fibre pigments (shades.SHADES).

This is planned-coverage parity, not a statement about final protected pixels.
Run ``python -m plumb_api.engines.concealer.parity_contract --check`` (or ``--write``).
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ..core.colour import ciede2000
from .crown import LEVEL_LIMITS, level
from .shades import SHADES
from .strands import cut_for_level

FORMAT = "beljour-fibre-coverage/1"
COVER_LEVELS = tuple((10 + k) / 10 for k in range(41))
START_SHARES = (*LEVEL_LIMITS, 1.0)
VECTORS = Path(__file__).resolve().parents[4] / "parity/fibre-coverage-r35f.json"

__all__ = ["PlannedCover", "contract", "cover_vectors", "pigment_pairs", "planned_cover"]


@dataclass(frozen=True, slots=True)
class PlannedCover:
    level: float
    start_share: float
    cut: float
    planned_share: float
    start_label: str
    planned_label: str

    def public(self) -> dict[str, Any]:
        return {"level": self.level, "start_share": self.start_share, "cut": self.cut,
                "planned_share": self.planned_share, "start_label": self.start_label,
                "planned_label": self.planned_label}


def planned_cover(fibre_level: float, start_share: float) -> PlannedCover:
    """Planned visible-scalp share after fibres at one level; the share must lie in 0..1."""
    if type(start_share) not in (int, float) or not 0.0 <= start_share <= 1.0:
        raise ValueError("Starting scalp share must be a number in 0..1")
    cut = cut_for_level(fibre_level)
    planned = float(start_share) * (1.0 - cut)
    return PlannedCover(float(fibre_level), float(start_share), cut, planned, level(start_share), level(planned))


def cover_vectors() -> tuple[PlannedCover, ...]:
    return tuple(planned_cover(lv, share) for share in START_SHARES for lv in COVER_LEVELS)


def pigment_pairs() -> tuple[tuple[str, str, float], ...]:
    return tuple((SHADES[i][0], SHADES[j][0], ciede2000(SHADES[i][2], SHADES[j][2]))
                 for i in range(len(SHADES)) for j in range(i + 1, len(SHADES)))


def contract() -> dict[str, Any]:
    return {"format": FORMAT, "note": "Planned coverage parity; synthetic, not final pixels or a diagnosis.",
            "cover": [v.public() for v in cover_vectors()],
            "pigments": [{"first": a, "second": b, "delta_e": round(d, 10)} for a, b, d in pigment_pairs()]}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fibre planned-coverage parity vectors")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--write", action="store_true")
    args = parser.parse_args(argv)
    text = json.dumps(contract(), separators=(",", ":"), sort_keys=True) + "\n"
    if args.write:
        VECTORS.write_text(text, encoding="utf-8")
        return 0
    if not VECTORS.is_file() or VECTORS.read_text(encoding="utf-8") != text:
        print("Fibre coverage vectors are out of date; run with --write", file=sys.stderr)
        return 1
    print("Fibre coverage vectors in sync")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

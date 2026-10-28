"""144 deterministic skin-lighting cases for the r34f reviews, shared with the browser.

24 in-house references (every fourth of the 96) are drawn as flat skin zones with a
small integer texture, under 6 integer colour casts, with a grey card and a beige wall
under the same cast: 24 x 6 = 144 cases. Pixels are pure integer arithmetic (the same
formula in web/test/r34f-parity.test.mjs), so both languages start from identical bytes:

    zone pixel k, zone z, channel c:  v = clamp(base[c] + (7k + 3z + 5c) mod 9 - 4)
    under cast m (per channel):       v' = min(255, (v * m + 128) >> 8)

Each case runs W6 with the grey card's neutral gains on the extended table, then the
illumination audit (neutral card, grey-world wall, uncorrected), the nearby-reference
inspection and the safety receipt. Synthetic drawn colours, not faces or products.
``python -m plumb_api.engines.shade.sensitivity_parity --check`` (or ``--write``).
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

from . import colourspace as cs
from .finder import ZONES, ShadeResult, extended_reference_table, find_from_pixels, white_from_pixels
from .illumination_sensitivity import LightingEstimate, audit_illumination_sensitivity
from .loaders import load_reference_shades
from .reference_ambiguity import inspect_reference_ambiguity
from .shade_safety import assess_shade_safety

FORMAT = "beljour-skin-sensitivity-r34f/1"
VECTORS = Path(__file__).resolve().parents[4] / "parity/skin-sensitivity-r34f.json"
ZONE_PIXELS = 144
PATCH_PIXELS = 64
CARD = (150, 150, 150)
WALL = (176, 160, 146)  # ASSUMED beige background, deliberately not neutral
CASTS: dict[str, tuple[int, int, int]] = {
    "daylight": (256, 256, 256), "warm": (290, 256, 200), "cool": (215, 250, 300),
    "green": (230, 290, 230), "magenta": (285, 225, 285), "dim": (150, 150, 150),
}

__all__ = ["CASTS", "base_colours", "case_inputs", "case_reading", "cases", "main"]


def base_colours() -> tuple[tuple[str, tuple[int, int, int]], ...]:
    """(reference id, sRGB bytes) for every fourth reference."""
    refs = load_reference_shades()[::4]
    return tuple((r.id, tuple(int(v) for v in cs.to_bytes(cs.lab_to_srgb(r.lab)))) for r in refs)  # type: ignore[misc]


def _cast(values: np.ndarray, cast: tuple[int, int, int]) -> np.ndarray:
    return np.minimum(255, (values * np.asarray(cast, dtype=np.int64) + 128) >> 8)


def case_inputs(base: tuple[int, int, int], cast: tuple[int, int, int]) -> dict[str, np.ndarray]:
    """Zone pixels, grey card and wall under one cast, as int64 (n, 3) arrays."""
    k = np.arange(ZONE_PIXELS)[:, None]
    c = np.arange(3)[None, :]
    zones = {name: _cast(np.clip(np.asarray(base)[None, :] + (7 * k + 3 * z + 5 * c) % 9 - 4, 0, 255), cast)
             for z, name in enumerate(ZONES)}
    zones["card"] = _cast(np.tile(np.asarray(CARD), (PATCH_PIXELS, 1)), cast)
    zones["wall"] = _cast(np.tile(np.asarray(WALL), (PATCH_PIXELS, 1)), cast)
    return zones


def case_reading(base: tuple[int, int, int], cast: tuple[int, int, int]) -> tuple[
        ShadeResult, np.ndarray, list[LightingEstimate]]:
    """(W6 result with neutral-card gains, the measured sample, [neutral, grey-world, none] estimates)."""
    pixels = case_inputs(base, cast)
    neutral = white_from_pixels(pixels["card"], "neutral")
    wall = white_from_pixels(pixels["wall"], "grey_world")
    result = find_from_pixels({z: pixels[z] for z in ZONES}, neutral, extended_reference_table())
    estimates = [LightingEstimate.from_white(neutral), LightingEstimate.from_white(wall),
                 LightingEstimate("none", (1.0, 1.0, 1.0))]
    return result, np.concatenate([pixels[z] for z in ZONES]), estimates


def _run(base: tuple[int, int, int], cast: tuple[int, int, int]) -> dict[str, Any]:
    result, sample, estimates = case_reading(base, cast)
    neutral, wall = estimates[0], estimates[1]
    sensitivity = audit_illumination_sensitivity(result, sample, estimates)
    ambiguity = inspect_reference_ambiguity(result)
    safety = assess_shade_safety(result, sensitivity, ambiguity)
    return {"refused": result.refused, "best": None if result.best is None else result.best["id"],
            "measured_lab": None if result.measured_lab is None else list(result.measured_lab),
            "confidence": result.confidence["overall"],
            "gains": {"neutral": list(neutral.gains), "grey_world": list(wall.gains)},
            "sensitivity": {"status": sensitivity.status, "code": sensitivity.code,
                            "outcomes": [{"mode": o.mode, "lab": list(o.lab), "delta_e": o.delta_e,
                                          "nearest": o.nearest_id, "within_limits": o.within_limits}
                                         for o in sensitivity.outcomes]},
            "ambiguity": {"status": ambiguity.status, "code": ambiguity.code,
                          "alternatives": [m.record.id for m in ambiguity.alternatives]},
            "safety": {"status": safety.status, "reasons": list(safety.reasons)}}


def cases() -> list[dict[str, Any]]:
    out = []
    for ref_id, base in base_colours():
        for name, cast in CASTS.items():
            out.append({"reference": ref_id, "base": list(base), "cast": name, **_run(base, cast)})
    return out


def contract() -> dict[str, Any]:
    return {"format": FORMAT, "note": "Synthetic drawn skin colours under integer casts; not faces or products.",
            "zone_pixels": ZONE_PIXELS, "patch_pixels": PATCH_PIXELS, "card": list(CARD), "wall": list(WALL),
            "casts": {k: list(v) for k, v in CASTS.items()}, "tolerance": 1e-8, "cases": cases()}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="r34f local skin lighting vectors")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--write", action="store_true")
    args = parser.parse_args(argv)
    text = json.dumps(contract(), separators=(",", ":"), sort_keys=True) + "\n"
    if args.write:
        VECTORS.write_text(text, encoding="utf-8")
        return 0
    if not VECTORS.is_file() or json.loads(VECTORS.read_text(encoding="utf-8")) != json.loads(text):
        print("Local skin lighting vectors are out of date; run with --write", file=sys.stderr)
        return 1
    print("Local skin lighting vectors in sync")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

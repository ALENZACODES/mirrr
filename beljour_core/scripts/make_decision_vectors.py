"""Decision layer: the TypeScript copy of estimates.json and Python -> TypeScript vectors.

Writes `web/src/engines/workflow_w/generated/estimates.ts` (the ASSUMED table, never edited by
hand) and `api/tests/goldens/decision-layer.json`: cost and longevity for every service, with
and without her own figures; hair colour targets over a range of drawn Lab colours, base
levels, histories and balayage levels; foundation targets; placement on drawn hair masks;
the printed wording of each; and the coded refusals. `--check` fails on drift.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.engines.workflow_w import decision  # noqa: E402

VECTORS = ROOT / "api/tests/goldens/decision-layer.json"
MIRROR = ROOT / "web/src/engines/workflow_w/generated/estimates.ts"
MASK_W, MASK_H = 24, 30


def _attempt(call: Any, *args: Any, **kwargs: Any) -> dict[str, Any]:
    try:
        return {"result": call(*args, **kwargs), "refused": None}
    except decision.DecisionError as refusal:
        return {"result": None, "refused": refusal.code}


def cost_cases() -> list[dict[str, Any]]:
    requests: list[dict[str, Any]] = [{"service": row["id"]} for row in decision.table()["services"]]
    requests += [
        {"service": "balayage", "sessions": 2},
        {"service": "balayage", "sessions": 3, "price": [250, 380], "upkeep_price": [60, 95]},
        {"service": "all_over_colour", "lasts": [5, 7]},
        {"service": "all_over_colour", "price": [110, 190]},  # same as the table: not counted as edited
        {"service": "grey_blending", "price": [99.5, 149.5], "lasts": [10, 10]},
        {"service": "foundation_bottle", "price": [0, 0]},
        {"service": "makeup_application", "lasts": [48, 48]},
        {"service": "made_up"}, {"service": "balayage", "price": [300, 200]},
        {"service": "balayage", "price": [-1, 10]}, {"service": "balayage", "price": [1, 20000]},
        {"service": "balayage", "lasts": [6.5, 8]}, {"service": "makeup_application", "lasts": [8, 49]},
        {"service": "balayage", "sessions": 0}, {"service": "balayage", "sessions": 13},
    ]
    out = []
    for req in requests:
        kwargs = {k: v for k, v in req.items() if k != "service"}
        row = _attempt(decision.cost_and_longevity, req["service"], **kwargs)
        row["request"] = req
        row["lines"] = decision.cost_lines(row["result"]) if row["result"] else None
        out.append(row)
    return out


def hair_cases() -> list[dict[str, Any]]:
    labs = [[30.0, 18.0, 22.0], [14.0, 1.0, 1.0], [55.0, 6.0, 30.0], [72.0, -1.0, 4.0], [38.0, 30.0, 20.0],
            [45.0, 2.0, -12.0]]
    requests: list[dict[str, Any]] = []
    for lab in labs:
        for base in (None, 2, 5, 9):
            requests.append({"target_lab": lab, "base_level": base, "history": "colour_treated"})
    requests.append({"target_lab": [72.0, -1.0, 4.0], "base_level": 3, "history": "box_dye"})
    for base, target, history, toner in ((3, 8, "colour_treated", "ash"), (4, 7, "virgin", "none"),
                                         (2, 10, "box_dye", "violet"), (6, 6, "virgin", "pearl"),
                                         (None, 9, "virgin", "none")):
        requests.append({"mode": "balayage", "base_level": base, "target_level": target, "history": history,
                         "toner": toner})
    out = []
    for req in requests:
        kwargs = {k: v for k, v in req.items() if k != "target_lab"}
        spec = decision.hair_spec(req.get("target_lab"), **kwargs)
        out.append({"request": req, "result": spec, "lines": decision.spec_lines(spec),
                    "cost_lines": decision.cost_lines(decision.cost_and_longevity(spec["service"],
                                                                                 sessions=spec["sessions"]))})
    return out


def makeup_cases() -> list[dict[str, Any]]:
    out = []
    for lab in ([62.0, 12.0, 18.0], [38.0, 14.0, 22.0], [24.0, 10.0, 14.0], [78.0, 6.0, 12.0], [55.0, 9.0, 8.0],
                [3.0, 0.0, 0.0]):
        row = _attempt(decision.makeup_spec, lab)
        row["request"] = {"skin_lab": lab}
        row["lines"] = decision.spec_lines(row["result"]) if row["result"] else None
        out.append(row)
    return out


def masks() -> dict[str, dict[str, list[float]]]:
    """Drawn hair shapes: a long fall, a crown-only patch and a near-empty mask."""
    yy, xx = np.mgrid[:MASK_H, :MASK_W]
    fall = ((xx >= 4) & (xx < 20) & (yy >= 3) & (yy < 28)).astype(np.float64)
    fall[3:6, 4:7] = 0.4  # soft corner, outside the 0.5 cut
    crown = (((xx - 12) ** 2 + (yy - 8) ** 2) <= 30).astype(np.float64)
    empty = np.zeros((MASK_H, MASK_W))
    empty[0, :10] = 1.0
    ends = np.where(yy >= 20, 0.9, 0.0)
    ribbons = np.where((xx % 6 < 2) & (yy >= 8), 0.6, 0.1)
    face_frame = np.where(xx < 8, 1.0, 0.0) * np.where(yy < 15, 1.0, 0.5)
    return {"hair": {"fall": fall.ravel().tolist(), "crown": crown.ravel().tolist(), "empty": empty.ravel().tolist()},
            "paint": {"ends": ends.ravel().tolist(), "ribbons": ribbons.ravel().tolist(),
                      "face_frame": face_frame.ravel().tolist()}}


def placement_cases(drawn: dict[str, dict[str, list[float]]]) -> list[dict[str, Any]]:
    out = []
    for hair in drawn["hair"]:
        for paint in (None, *drawn["paint"]):
            mask = np.asarray(drawn["hair"][hair]).reshape(MASK_H, MASK_W)
            strokes = None if paint is None else np.asarray(drawn["paint"][paint]).reshape(MASK_H, MASK_W)
            row = _attempt(decision.placement, mask, strokes)
            row["request"] = {"hair": hair, "paint": paint}
            row["lines"] = decision.placement_lines(row["result"]) if row["result"] else None
            out.append(row)
    return out


def build() -> dict[str, Any]:
    drawn = masks()
    return {"format": "beljour-decision-vectors/1", "author": "John Khan", "synthetic": True, "version": decision.VERSION,
            "float_tolerance": 1e-9, "table": decision.table(), "mask_size": [MASK_W, MASK_H], "masks": drawn,
            "constants": {"max_price": decision.MAX_PRICE, "max_sessions": decision.MAX_SESSIONS,
                          "paint_threshold": decision.PAINT_THRESHOLD, "min_hair_pixels": decision.MIN_HAIR_PIXELS,
                          "units": decision.UNITS, "refusals": decision.REFUSALS},
            "cost": cost_cases(), "hair": hair_cases(), "makeup": makeup_cases(), "placement": placement_cases(drawn)}


def mirror() -> str:
    body = json.dumps(decision.table(), separators=(",", ":"), ensure_ascii=False)
    return ("/** GENERATED from api/plumb_api/engines/workflow_w/estimates.json. DO NOT EDIT.\n"
            " * Rebuild: python api/scripts/make_decision_vectors.py. Author: John Khan. */\n"
            f"export const ESTIMATES = {body} as const;\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = json.dumps(build(), separators=(",", ":"), sort_keys=True) + "\n"
    generated = mirror()
    if args.check:
        for path, content in ((VECTORS, expected), (MIRROR, generated)):
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                raise SystemExit(f"{path.relative_to(ROOT)} is out of date; run {Path(__file__).name}")
        print("decision vectors and the TypeScript estimate table match the Python engine")
        return
    MIRROR.parent.mkdir(parents=True, exist_ok=True)
    MIRROR.write_text(generated, encoding="utf-8")
    VECTORS.write_text(expected, encoding="utf-8")
    print(f"wrote {VECTORS.relative_to(ROOT)} and {MIRROR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

"""One local hair colour or makeup decision: the exact shade, where it goes, what it costs and
how long it lasts, written so she can hand it to a professional.

* Shade: a hair target resolves to the nearest in-house swatches (``hair_palette``) with its
  level, undertone and CIEDE2000 distance, and to the sessions the W28 lift limits allow from
  her measured base level. A foundation target resolves to our own reference shades
  (feature 101 finder), never lighter than measured. This is a colour target for her
  professional to formulate from, never a mixing recipe, developer strength or product match.
* Placement: the share of her marked hair that is painted, by roots, mid-lengths and ends.
* Cost and longevity: ranges in Canadian dollars from ``estimates.json`` (ASSUMED, every
  number editable by her), with the first visit, upkeep visits per year and a year-one range
  counted by the W94 rule (``pricing.estimate``). Ranges only; no single price is promised.

Pure functions on plain data; no photo, mask or landmark leaves this module.
Mirrored in ``web/src/engines/workflow_w/decision.ts``; shared vectors in
``api/tests/goldens/decision-layer.json``. Author: John Khan.
"""
from __future__ import annotations

import json
import math
from collections.abc import Sequence
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from ..hair_palette.matching import checked_lab, suggest
from ..haircolour.balayage import HISTORIES, level_lab, level_of_lightness, level_row, levels_data, session_plan
from ..shade.finder import depth_band, match_shades, undertone_of
from .pricing import estimate

VERSION = "decision-layer/1"
TABLE_PATH = Path(__file__).with_name("estimates.json")
SCALE_NOTE = "Levels use the lift scale of the session planner; swatch names keep their own depth numbers."
SPEC_NOTE = ("A colour target for your professional to formulate from. "
             "Not a mixing recipe, developer strength or product match.")
FOUNDATION_NOTE = ("Our own reference shades, never lighter than measured. "
                   "Not tested against real products; swatch on the jaw in daylight.")
PLACEMENT_NOTE = "Share of your marked hair that is painted, by height. Printed as black and white hatching."
MODES = ("all_over", "balayage")
ZONES = ("roots", "mid_lengths", "ends")
ZONE_WORDS = {"roots": "roots", "mid_lengths": "mid-lengths", "ends": "ends"}
UNITS = {"weeks": 104, "hours": 48}       # longest longevity she can enter per unit
MAX_PRICE = 10000.0                       # CAD per session or visit; ASSUMED sanity bound
MAX_SESSIONS = 12
PAINT_THRESHOLD = 0.15                    # painted share counted as placed; same cut as the printed hatch
MIN_HAIR_PIXELS = 16                      # as balayage.measure_base_level

REFUSALS = {
    "unknown_service": "That service is not in the estimate table.",
    "invalid_figures": "Prices and durations need a low and a high value, low first.",
    "no_hair_mask": "Mark your hair first, so the placement can be measured.",
    "no_shade": "No reference shade sits at or below your measured depth, so none is suggested.",
}


class DecisionError(ValueError):
    """A coded refusal: the input cannot give an honest answer, so none is made up."""

    def __init__(self, code: str, detail: str = "") -> None:
        if code not in REFUSALS:
            raise ValueError(f"unknown decision refusal code {code!r}")
        self.code = code
        super().__init__(REFUSALS[code] + (f" ({detail})" if detail else ""))


def _pair(value: object, low: float, high: float, where: str, *, whole: bool = False) -> list[float]:
    if (not isinstance(value, (list, tuple)) or len(value) != 2
            or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in value)):
        raise DecisionError("invalid_figures", where)
    a, b = float(value[0]), float(value[1])
    if not low <= a <= b <= high or (whole and (a != int(a) or b != int(b))):
        raise DecisionError("invalid_figures", where)
    return [a, b]


@lru_cache(maxsize=1)
def _table() -> str:
    data = json.loads(TABLE_PATH.read_text(encoding="utf-8"))
    ids = [row["id"] for row in data["services"]]
    if data.get("currency") != "CAD" or len(set(ids)) != len(ids):
        raise ValueError("estimate table must be CAD with unique service ids")
    for row in data["services"]:
        if row["unit"] not in UNITS or row["kind"] not in ("hair", "makeup"):
            raise ValueError(f"estimate row {row['id']}: unknown unit or kind")
        _pair(row["price"], 0, MAX_PRICE, row["id"])
        _pair(row["lasts"], 1, UNITS[row["unit"]], row["id"], whole=True)
        if row["upkeep"] is not None and row["upkeep"] not in ids:
            raise ValueError(f"estimate row {row['id']}: unknown upkeep service")
    return json.dumps(data)


def table() -> dict[str, Any]:
    """The validated ASSUMED table (a fresh copy each call, so callers cannot change it)."""
    data: dict[str, Any] = json.loads(_table())
    return data


def service(service_id: str) -> dict[str, Any]:
    for row in table()["services"]:
        if row["id"] == service_id:
            out: dict[str, Any] = row
            return out
    raise DecisionError("unknown_service", str(service_id))


def cost_and_longevity(service_id: str, *, sessions: int = 1, price: Sequence[float] | None = None,
                       lasts: Sequence[float] | None = None,
                       upkeep_price: Sequence[float] | None = None) -> dict[str, Any]:
    """Ranges for one service. Her own figures replace the ASSUMED ones field by field."""
    row = service(service_id)
    if isinstance(sessions, bool) or not isinstance(sessions, int) or not 1 <= sessions <= MAX_SESSIONS:
        raise DecisionError("invalid_figures", "sessions")
    unit = row["unit"]
    per = _pair(row["price"] if price is None else price, 0, MAX_PRICE, "price")
    span = _pair(row["lasts"] if lasts is None else lasts, 1, UNITS[unit], "lasts", whole=True)
    edited = [name for name, given, default in (("price", price, row["price"]), ("lasts", lasts, row["lasts"]))
              if given is not None and [float(v) for v in given] != [float(v) for v in default]]
    raw = estimate(per[0], per[1], sessions, int(span[1]))
    first = [float(raw["initial_low"]), float(raw["initial_high"])]
    out: dict[str, Any] = {
        "service": row["id"], "label": row["label"], "kind": row["kind"], "currency": "CAD",
        "sessions": sessions, "per_session": per, "first_visit": first,
        "lasts": span, "unit": unit, "lasts_note": row["lasts_note"], "upkeep": None, "year_one": None,
    }
    if row["upkeep"] is not None and unit == "weeks":
        up_row = service(row["upkeep"])
        up = _pair(up_row["price"] if upkeep_price is None else upkeep_price, 0, MAX_PRICE, "upkeep price")
        if upkeep_price is not None and [float(v) for v in upkeep_price] != [float(v) for v in up_row["price"]]:
            edited.append("upkeep_price")
        # Fewest visits: the longest a result lasts; most visits: the shortest (W94 visit rule).
        fewest = float(estimate(up[0], up[1], 1, int(span[1]))["maintenance_visits_estimate"])
        most = float(estimate(up[0], up[1], 1, int(span[0]))["maintenance_visits_estimate"])
        out["upkeep"] = {"service": up_row["id"], "label": up_row["label"], "per_visit": up,
                         "visits_per_year": [fewest, most]}
        out["year_one"] = [first[0] + up[0] * fewest, first[1] + up[1] * most]
    out["edited"] = edited
    out["source"] = "your figures" if edited else "ASSUMED estimate table"
    out["label_note"] = str(table()["label"])
    return out


def hair_spec(target_lab: Sequence[float] | None = None, *, mode: str = "all_over", base_level: int | None = None,
              history: str = "colour_treated", target_level: int | None = None, toner: str = "none") -> dict[str, Any]:
    """The exact hair colour target: swatch, level, undertone, distance and sessions."""
    if mode not in MODES or history not in HISTORIES:
        raise ValueError("unknown hair decision mode or colour history")
    if base_level is not None:
        level_row(base_level)
    if mode == "balayage":
        if target_level is None:
            raise ValueError("balayage needs a target level")
        lab = [float(v) for v in level_lab(target_level, toner)]
    else:
        if target_lab is None:
            raise ValueError("all-over colour needs a target colour")
        lab = list(checked_lab(target_lab))
    nearest = suggest(lab, allow_lightening=True, count=3)
    # Sessions compare her measured base and the target on the same lift scale (levels.json);
    # the palette's own depth numbers are a separate ASSUMED scale and can differ by 2 levels.
    level = target_level if mode == "balayage" and target_level is not None else level_of_lightness(lab[0])
    if base_level is not None and level > base_level:
        plan = session_plan(base_level, level, history)
        sessions, steps, note = plan["sessions"], list(plan["levels_by_session"]), str(plan["note"])
    elif base_level is not None:
        sessions, steps, note = 1, [level], "Same depth or darker than your base: one session (ASSUMED)."
    else:
        sessions, steps, note = 1, [level], "Starting level unknown: mark your hair to measure it. One session is ASSUMED."
    return {
        "subject": "hair", "mode": mode, "target_lab": lab, "target_level": level,
        "level_name": level_row(level)["name"], "undertone": nearest[0].shade.undertone,
        "toner": toner if mode == "balayage" else None, "base_level": base_level, "history": history,
        "nearest": [{"id": s.shade.id, "name": s.shade.name, "family": s.shade.family, "level": s.shade.level,
                     "undertone": s.shade.undertone, "delta_e00": s.delta_e00} for s in nearest],
        "sessions": sessions, "levels_by_session": steps, "plan_note": note,
        "service": "balayage" if mode == "balayage" else "all_over_colour",
        "note": SPEC_NOTE, "level_scale_note": str(levels_data()["status"]),
    }


def makeup_spec(skin_lab: Sequence[float]) -> dict[str, Any]:
    """Foundation target from a measured skin colour: our reference shades, never lighter."""
    lab = [float(v) for v in checked_lab(skin_lab)]
    matches = match_shades(lab)[:3]
    if not matches:
        raise DecisionError("no_shade")
    return {
        "subject": "makeup", "product": "foundation", "measured_lab": lab,
        "depth_band": depth_band(lab[0]), "undertone": undertone_of(lab)["undertone"],
        "nearest": [{"id": m["id"], "name": m["name"], "undertone": m.get("undertone"), "depth": m.get("depth"),
                     "delta_e00": float(m["delta_e"])} for m in matches],
        "service": "foundation_bottle", "note": FOUNDATION_NOTE,
    }


def placement(hair_mask: object, paint: object | None = None) -> dict[str, Any]:
    """Painted share of the marked hair overall and by thirds of its height."""
    hair = np.asarray(hair_mask, dtype=np.float64)
    if hair.ndim != 2:
        raise ValueError("hair mask must be a 2-D coverage array")
    inside = hair >= 0.5
    if int(inside.sum()) < MIN_HAIR_PIXELS:
        raise DecisionError("no_hair_mask")
    if paint is None:
        placed = inside
        kind = "all_over"
    else:
        strokes = np.asarray(paint, dtype=np.float64)
        if strokes.shape != hair.shape:
            raise ValueError("paint map must match the hair mask")
        placed = inside & (strokes > PAINT_THRESHOLD)
        kind = "painted"
    rows = np.flatnonzero(inside.any(axis=1))
    top, span = int(rows[0]), int(rows[-1]) - int(rows[0]) + 1
    third = np.minimum(2, (np.arange(hair.shape[0]) - top) * 3 // span)
    zones: dict[str, float] = {}
    for index, name in enumerate(ZONES):
        band = (third == index)[:, None] & inside
        total = int(band.sum())
        zones[name] = float((band & placed).sum()) / total if total else 0.0
    return {"kind": kind, "coverage": float(placed.sum()) / float(inside.sum()), "zones": zones,
            "note": PLACEMENT_NOTE}


def money(value: float) -> str:
    """Whole Canadian dollars, half up, with thousands separators (same text in TypeScript)."""
    whole = int(math.floor(value + 0.5))
    return f"${whole:,}"


def percent(share: float) -> int:
    """Whole percent, half up (Python's round() is half-even; the browser's is half up)."""
    return int(math.floor(share * 100 + 0.5))


def one_decimal(value: float) -> str:
    return f"{math.floor(value * 10 + 0.5) / 10:.1f}"


def _range(pair: Sequence[float]) -> str:
    low, high = money(pair[0]), money(pair[1])
    return low if low == high else f"{low} to {high}"


def cost_lines(cost: dict[str, Any]) -> list[str]:
    """Printable wording of a cost and longevity estimate; every line says it is an estimate."""
    source = "your figures" if cost["edited"] else "ASSUMED estimate"
    span = cost["lasts"]
    lasts = f"{int(span[0])}" if span[0] == span[1] else f"{int(span[0])} to {int(span[1])}"
    sessions = cost["sessions"]
    lines = [f"{cost['label']}: {_range(cost['per_session'])} CAD per session ({source}).",
             f"First visit{'s' if sessions > 1 else ''}: {sessions} session{'s' if sessions > 1 else ''}, "
             f"{_range(cost['first_visit'])} CAD.",
             f"Lasts about {lasts} {cost['unit']} {cost['lasts_note']} (estimate)."]
    if cost["upkeep"] is not None:
        up = cost["upkeep"]
        visits = up["visits_per_year"]
        count = f"{int(visits[0])}" if visits[0] == visits[1] else f"{int(visits[0])} to {int(visits[1])}"
        lines.append(f"Upkeep: {up['label'].lower()}, {_range(up['per_visit'])} CAD, about {count} times a year.")
        lines.append(f"Year one including the first visit: {_range(cost['year_one'])} CAD (estimate).")
    lines.append(cost["label_note"])
    return lines


def spec_lines(spec: dict[str, Any]) -> list[str]:
    """Printable wording of the shade target."""
    if spec["subject"] == "makeup":
        lines = [f"Foundation: measured depth band {spec['depth_band']} of 10, {spec['undertone']} undertone."]
        lines += [f"Reference shade {s['id']} ({s['name']}), colour difference {one_decimal(s['delta_e00'])}"
                  for s in spec["nearest"]]
        return [*lines, spec["note"]]
    first = spec["nearest"][0]
    head = (f"Hair target: level {spec['target_level']} of 10 ({spec['level_name']}), {spec['undertone']} undertone"
            + (f", {spec['toner']} toner" if spec["toner"] not in (None, "none") else "") + ".")
    lines = [head, f"Nearest in-house swatch {first['id']} ({first['name']}), colour difference {one_decimal(first['delta_e00'])}."]
    if first["level"] != spec["target_level"]:
        lines.append(SCALE_NOTE)
    if spec["base_level"] is not None:
        lines.append(f"Starting level {spec['base_level']} of 10 (photo estimate), history: "
                     f"{spec['history'].replace('_', ' ')}.")
    steps = " -> ".join(str(v) for v in spec["levels_by_session"])
    lines.append(f"Sessions: {spec['sessions']} (levels {steps}). {spec['plan_note']}")
    return [*lines, spec["note"]]


def placement_lines(place: dict[str, Any]) -> list[str]:
    if place["kind"] == "all_over":
        return ["Placement: all of your marked hair, roots to ends."]
    parts = ", ".join(f"{ZONE_WORDS[z]} {percent(place['zones'][z])}%" for z in ZONES)
    return [f"Placement: {percent(place['coverage'])}% of your marked hair is painted.",
            f"By height: {parts}.", place["note"]]

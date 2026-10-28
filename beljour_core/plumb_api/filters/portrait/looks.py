"""The named portrait looks: what each one does, loaded and checked from recipes/portrait.json.

A portrait look joins three local steps under one name and one 0-100 slider:

* polish    texture-preserving skin smoothing (feature #25's frequency-separated texture graft
            puts the finest detail back, and marks are protected), as a share at strength 100;
* emphasis  gentle definition on eyes, brows and lips with the filter engine's built
            spatial.structure op, a weight per feature at strength 100 (no colour, no shape);
* grade     an ordinary beljour-filter/1 recipe (own curve points and values) rendered by the
            filter engine with its skin guard and hue lock on;

plus, for the evening look only, procedural sparkle (sparkle.py). The grade recipes live in
their own file, beside the 61 core looks, so the core strip, its ranking and its registered
rows stay as they are (the Studio Play pack does the same).

Rules checked here, beyond the recipe schema: polish never above 0.6 ("soften, not erase");
no exposure lift, tone lift, centre light or geometry op in a default grade (a look never
lightens skin by default, women-first rule 8); every look is labelled a simulation; names
are unique and differ from the core catalogue's. The browser copy
(web/src/filters/data/generated/portrait-looks.ts) is written from `export_ts()` by
scripts/sync_filters.py and checked by the same script.
Author: John Khan.
"""
from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from .. import oplist
from ..recipe import registry, schema

FORMAT = "beljour-portrait-looks/1"
PATH = registry.RECIPE_DIR / "portrait.json"
REPO = Path(__file__).resolve().parents[4]
TS_PATH = REPO / "web/src/filters/data/generated/portrait-looks.ts"
POLISH_MAX = 0.6        # "soften, not erase": at most 60% of mid-scale variation smoothed; ASSUMED
EMPHASIS_MAX = 1.0
SPARKLE_DENSITY_MAX = 0.4
LIGHTENING_OPS = ("colour.exposure", "colour.tone", "light.centre")
ID_PREFIX = "PL"


@dataclass(frozen=True)
class Emphasis:
    eyes: float
    brows: float
    lips: float


@dataclass(frozen=True)
class Sparkle:
    density: float
    amount: float
    seed: int
    palette: tuple[tuple[int, int, int], ...]


@dataclass(frozen=True)
class Look:
    id: str
    name: str
    description: str
    polish: float
    emphasis: Emphasis
    sparkle: Sparkle | None
    recipe: Mapping[str, Any]


def _sparkle(raw: Any) -> Sparkle | None:
    if raw is None:
        return None
    palette = tuple(tuple(int(c) for c in colour) for colour in raw["palette"])
    return Sparkle(float(raw["density"]), float(raw["amount"]), int(raw["seed"]),
                   tuple((p[0], p[1], p[2]) for p in palette))


def parse(doc: Mapping[str, Any]) -> tuple[Look, ...]:
    if doc.get("format") != FORMAT:
        raise ValueError(f"portrait looks: format must be {FORMAT}")
    out = []
    for entry in doc.get("looks", []):
        r = entry["recipe"]
        e = entry["emphasis"]
        out.append(Look(str(r["id"]), str(r["name"]), str(r["description"]), float(entry["polish"]),
                        Emphasis(float(e["eyes"]), float(e["brows"]), float(e["lips"])),
                        _sparkle(entry.get("sparkle")), r))
    return tuple(out)


def load(path: Path = PATH) -> tuple[Look, ...]:
    return parse(json.loads(path.read_text(encoding="utf-8")))


def validate(looks: Sequence[Look], core: registry.Catalogue | None = None) -> list[str]:
    """Plain-English problems; an empty list is valid."""
    problems: list[str] = []
    core_names = {r["name"].casefold() for r in (core or registry.default()).recipes}
    recipes = [dict(look.recipe) for look in looks]
    problems += schema.check_catalogue(recipes)
    for look in looks:
        where = look.id
        if not look.id.startswith(ID_PREFIX):
            problems.append(f"{where}: portrait look ids start with {ID_PREFIX}")
        if look.name.casefold() in core_names:
            problems.append(f"{where}: name {look.name!r} is already a core filter")
        if not 0.0 <= look.polish <= POLISH_MAX:
            problems.append(f"{where}: polish must be 0-{POLISH_MAX} (soften, not erase)")
        for part, value in vars(look.emphasis).items():
            if not 0.0 <= value <= EMPHASIS_MAX:
                problems.append(f"{where}: emphasis {part} must be 0-{EMPHASIS_MAX}")
        if not look.recipe["limits"].get("simulationLabel"):
            problems.append(f"{where}: a portrait look is labelled a simulation")
        if look.recipe["tab"] != "Beauty":
            problems.append(f"{where}: portrait looks sit in the Beauty tab")
        for stage in look.recipe["stages"]:
            name = str(stage.get("op"))
            if name in LIGHTENING_OPS:
                problems.append(f"{where}: {name} lifts skin; it can't be in a default look")
            elif oplist.op(name).family == "geometry":
                problems.append(f"{where}: {name} moves geometry")
        s = look.sparkle
        if s is not None:
            if not 0.0 < s.density <= SPARKLE_DENSITY_MAX or not 0.0 < s.amount <= 1.0:
                problems.append(f"{where}: sparkle density 0-{SPARKLE_DENSITY_MAX} and amount 0-1")
            if not s.palette or any(not 0 <= c <= 255 for colour in s.palette for c in colour):
                problems.append(f"{where}: sparkle palette is a list of byte colours")
            if not 0 <= s.seed < 2 ** 31:
                problems.append(f"{where}: sparkle seed is a 31-bit number")
    return problems


@lru_cache(maxsize=1)
def default() -> tuple[Look, ...]:
    looks = load()
    problems = validate(looks)
    if problems:
        raise ValueError("; ".join(problems))
    return looks


def get(look_id: str) -> Look:
    for look in default():
        if look.id == look_id:
            return look
    raise KeyError(look_id)


def export_ts(path: Path = PATH) -> str:
    data = json.loads(path.read_text(encoding="utf-8"))
    return ("/** GENERATED by scripts/sync_filters.py from api/plumb_api/filters/recipes/portrait.json. DO NOT EDIT.\n"
            " * Python is the single source of the portrait looks. Author: John Khan. */\n"
            "import type { PortraitLookData } from \"../../portrait/looks.js\";\n\n"
            "export const PORTRAIT_LOOKS: PortraitLookData = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")

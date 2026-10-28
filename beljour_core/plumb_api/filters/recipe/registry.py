"""The filter catalogue: recipes loaded from recipes/*.json, checked, ranked and looked up.

Python is the single source (filters-plan.md §3.1). `scripts/sync_filters.py` writes the
TypeScript copy (web/src/filters/data/generated/recipes.ts) from `export_catalogue()`, and
`make filters-data` fails if that copy is stale.

A recipe may start from another (`base`) and override whole fields, or patch named stages
(`stagePatch`), so two looks never share copy-pasted stages. Order on the strip is the rank
from §2.22 (ranking.json); ties can't happen because ranks are unique.
Author: John Khan.
"""
from __future__ import annotations

import copy
import json
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from . import schema

RECIPE_DIR = Path(__file__).resolve().parent.parent / "recipes"
RECIPE_FILES = ("colour.json", "mono.json", "originals.json")
ADDON_FILE = "addons.json"
RANKING_FILE = "ranking.json"


class CatalogueError(ValueError):
    """The recipe files don't pass the schema; the message lists every problem."""


@dataclass(frozen=True)
class Catalogue:
    recipes: tuple[dict[str, Any], ...]
    addons: dict[str, dict[str, Any]]
    ranking: dict[str, Any]
    files: dict[str, str]

    def get(self, rid: str) -> dict[str, Any]:
        for r in self.recipes:
            if r["id"] == rid:
                return r
        raise KeyError(f"no filter {rid!r}")

    def ids(self) -> list[str]:
        return [r["id"] for r in self.recipes]

    def ranked(self) -> list[dict[str, Any]]:
        return sorted(self.recipes, key=lambda r: (r["rank"], r["id"]))

    def in_tab(self, tab: str) -> list[dict[str, Any]]:
        return [r for r in self.ranked() if r["tab"] == tab]

    def tabs(self) -> list[str]:
        seen: list[str] = []
        for r in self.ranked():
            if r["tab"] not in seen:
                seen.append(r["tab"])
        return seen

    def for_round(self, round_name: str) -> list[dict[str, Any]]:
        return [r for r in self.ranked() if r["round"] == round_name]


def _read(path: Path, fmt: str) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("format") != fmt:
        raise CatalogueError(f"{path.name}: format must be {fmt}")
    return data


def resolve_bases(raw: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """Apply `base` (whole-field overrides) and `stagePatch` (params merged into named stages)."""
    by_id = {r["id"]: r for r in raw}
    out: dict[str, dict[str, Any]] = {}

    def build(rid: str, trail: tuple[str, ...]) -> dict[str, Any]:
        if rid in out:
            return out[rid]
        if rid in trail:
            raise CatalogueError(f"recipe bases loop: {' -> '.join(trail + (rid,))}")
        if rid not in by_id:
            raise CatalogueError(f"{trail[-1] if trail else '?'}: base {rid!r} does not exist")
        entry = copy.deepcopy(dict(by_id[rid]))
        base_id = entry.pop("base", None)
        patch = entry.pop("stagePatch", {})
        if base_id is not None:
            merged = copy.deepcopy(build(base_id, trail + (rid,)))
            for key in ("presets",):
                merged.pop(key, None)
            merged.update(entry)
            entry = merged
        if patch:
            stages = {s.get("id"): s for s in entry.get("stages", [])}
            for sid, params in patch.items():
                if sid not in stages:
                    raise CatalogueError(f"{rid}: stagePatch names unknown stage {sid!r}")
                stages[sid]["params"] = {**stages[sid].get("params", {}), **params}
        out[rid] = entry
        return entry

    return [build(r["id"], ()) for r in raw]


def load(directory: Path = RECIPE_DIR, files: Iterable[str] = RECIPE_FILES) -> Catalogue:
    raw: list[dict[str, Any]] = []
    sources: dict[str, str] = {}
    for name in files:
        data = _read(directory / name, schema.FORMAT)
        for r in data.get("recipes", []):
            raw.append(r)
            sources[str(r.get("id"))] = f"api/plumb_api/filters/recipes/{name}"
    addons = {a["id"]: a for a in _read(directory / ADDON_FILE, schema.ADDON_FORMAT).get("addons", [])}
    ranking = _read(directory / RANKING_FILE, schema.RANKING_FORMAT)
    recipes = resolve_bases(raw)
    problems = schema.check_catalogue(recipes, addons) + schema.check_ranking(ranking, recipes)
    problems += check_addons(addons)
    if problems:
        raise CatalogueError("; ".join(problems))
    return Catalogue(tuple(recipes), addons, ranking, sources)


def check_addons(addons: Mapping[str, Mapping[str, Any]]) -> list[str]:
    from ..colour import ops as O

    problems: list[str] = []
    for aid, a in addons.items():
        if "manualOnly" in a and not isinstance(a["manualOnly"], bool):
            problems.append(f"add-on {aid}: manualOnly must be a boolean")
        if a.get("manualOnly") and not a.get("built"):
            problems.append(f"add-on {aid}: manualOnly needs a built stage")
        if a.get("built"):
            stage = a.get("stage")
            if not isinstance(stage, Mapping):
                problems.append(f"add-on {aid}: a built add-on names its stage")
            else:
                problems += schema.check_stage(stage, f"add-on {aid}")
                op = O.OPS.get(str(stage.get("op")))
                if op is None or op.family not in ("colour", "spatial", "light"):
                    problems.append(f"add-on {aid}: requires a supported colour, spatial or light stage")
        elif not schema.ROUND_PATTERN.match(str(a.get("round", ""))):
            problems.append(f"add-on {aid}: an add-on not built yet names its round")
    return problems


@lru_cache(maxsize=1)
def default() -> Catalogue:
    """The shipped catalogue (cached; tests that edit recipes call load() on a copy)."""
    return load()


def export_catalogue(cat: Catalogue | None = None) -> dict[str, Any]:
    """The data the browser gets: resolved recipes in rank order, add-ons and the ranking rows."""
    c = cat or default()
    return {"format": schema.FORMAT, "recipes": c.ranked(),
            "addons": [c.addons[k] for k in sorted(c.addons)],
            "ranking": c.ranking.get("rows", [])}

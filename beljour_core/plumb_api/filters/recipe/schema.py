"""Recipe schema beljour-filter/1 (filters-plan.md §3.2) and its validator.

A filter is data: one recipe naming engine ops and their values at strength 100. This module
checks one recipe or a whole catalogue and returns plain-English problems (an empty list is
valid). The TypeScript validator (web/src/filters/recipe/schema.ts) applies the same rules to
the generated copy, so a hand edit to the generated file is caught in the browser tests too.

Rules beyond field types, from the plan and the women-first brief:
* ids and names are unique across the catalogue; a description is at most 80 characters;
* colour looks (class 1) start at the gentle default 30 (brief rule 1, plan ruling R4);
* geometry is "none" outside the Fun tab, and any warp op needs funTab and geometry "fun";
* no stage aims at a face region (lips, brows, lashes, eyelids, cheeks are makeup: YouCam);
* the depth model stays off (ruling R3) and every recipe says it was written from the plan;
* add-ons and presets name only known add-ons and stages.
Author: John Khan.
"""
from __future__ import annotations

import math
import re
from collections.abc import Iterable, Mapping, Sequence
from typing import Any

from .. import oplist as _oplist  # noqa: F401  (registers every op)
from ..colour import curves
from ..colour import ops as O

FORMAT = "beljour-filter/1"
ADDON_FORMAT = "beljour-filter-addons/1"
RANKING_FORMAT = "beljour-filter-ranking/1"
ID_PATTERN = re.compile(r"^[A-Z]{1,3}[0-9]{1,3}$")
ROUND_PATTERN = re.compile(r"^FX[0-9]{1,2}$")
PENDING_ROUND = re.compile(r"^(FX|R)[0-9]{1,2}$")
STAGE_ID = re.compile(r"^[a-z][a-zA-Z0-9-]{0,23}$")
TABS = ("Natural", "Warm", "Cool", "Contrast", "Classic", "Vintage", "Fade", "Pastel", "Film-style",
        "Cinematic", "Clean", "Monochrome", "Light", "Lens", "Frames", "Crowns", "Fun", "Art", "Seasonal", "Beauty")
STATUSES = ("Build", "Stretch", "Post")
GEOMETRY = ("none", "fun")
GUARD_MODES = ("full", "lightness")
MASK_CLASSES = ("hair", "face-skin", "body-skin", "clothes", "background", "person")
LIKE_SOURCES = re.compile(r"^(report#[0-9]{1,3}|assumed)$")
DEFAULT_STRENGTH = {1: 30}
FACE_REGIONS = ("lips", "brows", "lashes", "eyelids", "cheeks", "region")
MAX_DESCRIPTION = 80
MAX_NAME = 40
MAX_STAGES = 16
EDITORIAL_FAMILIES = ("Masthead", "Editorial Day", "Cover Evening", "Salon Suite", "Heritage")
EDITORIAL_LIGHTS = ("Window", "Studio", "Evening")
REQUIRED = ("id", "name", "version", "class", "tab", "status", "round", "rank", "like", "description",
            "editorial", "defaults", "limits", "needs", "stages", "seed", "safety", "provenance")


def _finite(x: Any) -> bool:
    return isinstance(x, int | float) and not isinstance(x, bool) and math.isfinite(float(x))


def check_params(op: O.Op, params: Mapping[str, Any], where: str) -> list[str]:
    problems: list[str] = []
    if not isinstance(params, Mapping):
        return [f"{where}: params must be an object"]
    for key, value in params.items():
        if key in FACE_REGIONS:
            problems.append(f"{where}: aims at a face region ({key}); makeup goes through YouCam")
            continue
        spec = op.params.get(key)
        if spec is None:
            problems.append(f"{where}: {op.name} has no parameter {key!r}")
            continue
        if spec.kind == "stat":
            problems.append(f"{where}: {key} is measured from the photo, not written in a recipe")
            continue
        if spec.kind in ("number", "fixed", "angle"):
            if not _finite(value):
                problems.append(f"{where}: {key} must be a finite number")
            elif spec.kind != "angle" and not spec.lo <= float(value) <= spec.hi:
                problems.append(f"{where}: {key} {value} is outside {spec.lo}..{spec.hi}")
            elif op.name == "spatial.grain" and key == "seed" and not float(value).is_integer():
                problems.append(f"{where}: grain seed must be an unsigned integer")
        elif spec.kind == "points":
            try:
                curves.check_points(value)
            except (ValueError, TypeError) as exc:
                problems.append(f"{where}: {key}: {exc}")
        elif spec.kind == "matrix":
            ok = (isinstance(value, list | tuple) and len(value) == 3
                  and all(isinstance(r, list | tuple) and len(r) == 3 and all(_finite(x) and spec.lo <= x <= spec.hi for x in r)
                          for r in value))
            if not ok:
                problems.append(f"{where}: {key} must be a 3 x 3 matrix of numbers in {spec.lo}..{spec.hi}")
        elif spec.kind == "bands":
            if not isinstance(value, Mapping):
                problems.append(f"{where}: bands must be an object")
                continue
            for band, entry in value.items():
                if band not in O.BANDS:
                    problems.append(f"{where}: unknown band {band!r}")
                    continue
                if not isinstance(entry, Mapping):
                    problems.append(f"{where}: band {band} must be an object")
                    continue
                for k, v in entry.items():
                    limit = O.BAND_LIMITS.get(k)
                    if limit is None:
                        problems.append(f"{where}: band {band} has no setting {k!r}")
                    elif not _finite(v) or abs(float(v)) > limit:
                        problems.append(f"{where}: band {band} {k} must be within +-{limit}")
    return problems


def check_stage(stage: Any, where: str) -> list[str]:
    if not isinstance(stage, Mapping):
        return [f"{where}: a stage is an object"]
    unknown = set(stage) - {"op", "params", "scale", "id"}
    problems = [f"{where}: unknown stage field {k!r}" for k in sorted(unknown)]
    op = O.OPS.get(str(stage.get("op")))
    if op is None:
        return problems + [f"{where}: unknown op {stage.get('op')!r}"]
    if stage.get("scale", "linear") not in O.SCALES:
        problems.append(f"{where}: scale must be one of {', '.join(O.SCALES)}")
    if "id" in stage and not STAGE_ID.match(str(stage["id"])):
        problems.append(f"{where}: stage id {stage['id']!r} must be a short lower-case token")
    return problems + check_params(op, stage.get("params", {}), f"{where} {op.name}")


def check_recipe(recipe: Mapping[str, Any], addons: Mapping[str, Any] | None = None) -> list[str]:
    """Problems with one fully resolved recipe (after `base` is applied)."""
    rid = str(recipe.get("id", "?"))
    where = f"{rid}"
    problems = [f"{where}: missing field {k}" for k in REQUIRED if k not in recipe]
    if problems:
        return problems
    if not ID_PATTERN.match(rid):
        problems.append(f"{where}: id must look like C08 or M01")
    name = recipe["name"]
    if not isinstance(name, str) or not 0 < len(name) <= MAX_NAME:
        problems.append(f"{where}: name must be 1-{MAX_NAME} characters")
    if not isinstance(recipe["version"], int) or recipe["version"] < 1:
        problems.append(f"{where}: version is a whole number from 1")
    cls = recipe["class"]
    if not isinstance(cls, int) or not 1 <= cls <= 20:
        problems.append(f"{where}: class must be 1-20 (the report's technical classes)")
    if recipe["tab"] not in TABS:
        problems.append(f"{where}: unknown tab {recipe['tab']!r}")
    if recipe["status"] not in STATUSES:
        problems.append(f"{where}: status must be Build, Stretch or Post")
    if not ROUND_PATTERN.match(str(recipe["round"])):
        problems.append(f"{where}: round must look like FX1")
    if not isinstance(recipe["rank"], int) or recipe["rank"] < 1:
        problems.append(f"{where}: rank is a whole number from 1")
    like = recipe["like"]
    if not (isinstance(like, Mapping) and isinstance(like.get("score"), int) and 1 <= like["score"] <= 5
            and LIKE_SOURCES.match(str(like.get("source", ""))) and isinstance(like.get("reason"), str) and like["reason"]):
        problems.append(f"{where}: like needs a 1-5 score, a source (report#n, assumed) and a reason")
    desc = recipe["description"]
    if not isinstance(desc, str) or not 0 < len(desc) <= MAX_DESCRIPTION:
        problems.append(f"{where}: description must be 1-{MAX_DESCRIPTION} characters")
    editorial = recipe["editorial"]
    if not isinstance(editorial, Mapping):
        problems.append(f"{where}: editorial must declare family and light")
    else:
        if editorial.get("family") not in EDITORIAL_FAMILIES:
            problems.append(f"{where}: editorial.family must be one of {', '.join(EDITORIAL_FAMILIES)}")
        if editorial.get("light") not in EDITORIAL_LIGHTS:
            problems.append(f"{where}: editorial.light must be one of {', '.join(EDITORIAL_LIGHTS)}")
        if set(editorial) != {"family", "light"}:
            problems.append(f"{where}: editorial only declares family and light")
    problems += _check_defaults(recipe, cls, addons, where)
    problems += _check_limits(recipe, where)
    needs = recipe["needs"]
    if not isinstance(needs, Mapping) or any(m not in MASK_CLASSES for m in needs.get("masks", [])):
        problems.append(f"{where}: needs.masks may list only {', '.join(MASK_CLASSES)}")
    elif needs.get("depth"):
        problems.append(f"{where}: the depth model stays off for filters (ruling R3)")
    stages = recipe["stages"]
    if not isinstance(stages, list) or not 1 <= len(stages) <= MAX_STAGES:
        problems.append(f"{where}: 1-{MAX_STAGES} stages")
        stages = []
    ids: set[str] = set()
    for i, stage in enumerate(stages):
        problems += check_stage(stage, f"{where} stage {i + 1}")
        if isinstance(stage, Mapping) and "id" in stage:
            if stage["id"] in ids:
                problems.append(f"{where}: stage id {stage['id']} is used twice")
            ids.add(str(stage["id"]))
    problems += _check_presets(recipe.get("presets", []), ids, where)
    seed = recipe["seed"]
    if seed != "photo" and not (isinstance(seed, int) and 0 <= seed < 2 ** 32):
        problems.append(f"{where}: seed is 'photo' or a 32-bit number")
    safety = recipe["safety"]
    if not isinstance(safety, Mapping) or not all(isinstance(safety.get(k), bool) for k in ("eyesClear", "faceClear")):
        problems.append(f"{where}: safety needs eyesClear and faceClear")
    prov = recipe["provenance"]
    if not isinstance(prov, Mapping) or "filters-plan.md" not in str(prov.get("writtenFrom", "")):
        problems.append(f"{where}: provenance.writtenFrom must cite filters-plan.md (no other app's output)")
    return problems


def _check_defaults(recipe: Mapping[str, Any], cls: Any, addons: Mapping[str, Any] | None, where: str) -> list[str]:
    d = recipe["defaults"]
    problems: list[str] = []
    if not isinstance(d, Mapping):
        return [f"{where}: defaults must be an object"]
    strength = d.get("strength")
    if not isinstance(strength, int) or not 0 <= strength <= 100:
        problems.append(f"{where}: default strength is a whole number 0-100")
    elif cls in DEFAULT_STRENGTH and strength != DEFAULT_STRENGTH[cls]:
        problems.append(f"{where}: class {cls} looks start at {DEFAULT_STRENGTH[cls]} (gentle default)")
    for key in ("guard", "protectSkin", "backgroundOnly"):
        if not isinstance(d.get(key), bool):
            problems.append(f"{where}: defaults.{key} must be true or false")
    for entry in d.get("addons", []):
        if not isinstance(entry, Mapping) or not _finite(entry.get("amount")) or not 0 <= entry["amount"] <= 100:
            problems.append(f"{where}: an add-on is {{id, amount 0-100}}")
        elif addons is not None and entry.get("id") not in addons:
            problems.append(f"{where}: unknown add-on {entry.get('id')!r}")
    return problems


def _check_limits(recipe: Mapping[str, Any], where: str) -> list[str]:
    lim = recipe["limits"]
    problems: list[str] = []
    if not isinstance(lim, Mapping):
        return [f"{where}: limits must be an object"]
    if lim.get("geometry") not in GEOMETRY:
        problems.append(f"{where}: limits.geometry must be none or fun")
    fun = bool(lim.get("funTab"))
    if lim.get("geometry") == "fun" and not fun:
        problems.append(f"{where}: geometry 'fun' only in the Fun tab")
    if fun and recipe.get("tab") != "Fun":
        problems.append(f"{where}: funTab recipes sit in the Fun tab")
    for stage in recipe.get("stages", []) if isinstance(recipe.get("stages"), list) else []:
        op = O.OPS.get(str(stage.get("op"))) if isinstance(stage, Mapping) else None
        if op is not None and op.family == "geometry" and not (fun and lim.get("geometry") == "fun"):
            problems.append(f"{where}: {op.name} moves geometry; needs funTab and geometry 'fun'")
    if lim.get("guardMode", "full") not in GUARD_MODES:
        problems.append(f"{where}: guardMode must be full or lightness")
    sm = lim.get("strengthMax", 100)
    if not isinstance(sm, int) or not 1 <= sm <= 100:
        problems.append(f"{where}: strengthMax is 1-100")
    return problems


def _check_presets(presets: Any, stage_ids: set[str], where: str) -> list[str]:
    problems: list[str] = []
    if not isinstance(presets, list):
        return [f"{where}: presets must be a list"]
    names: set[str] = set()
    for p in presets:
        if not isinstance(p, Mapping) or not isinstance(p.get("name"), str) or not 0 < len(p["name"]) <= 24:
            problems.append(f"{where}: a preset needs a name of 1-24 characters")
            continue
        label = f"{where} preset {p['name']}"
        if p["name"] in names:
            problems.append(f"{label}: name used twice")
        names.add(p["name"])
        for sid in dict(p.get("patch", {})):
            if sid not in stage_ids:
                problems.append(f"{label}: patches unknown stage {sid!r}")
        for i, stage in enumerate(p.get("append", [])):
            problems += check_stage(stage, f"{label} extra stage {i + 1}")
        for item in p.get("pending", []):
            if not isinstance(item, str) or not PENDING_ROUND.match(item.split()[-1] if item.split() else ""):
                problems.append(f"{label}: pending parts say which round builds them (e.g. 'border FX2')")
    return problems


def patch_problems(recipe: Mapping[str, Any]) -> list[str]:
    """Preset patches checked against the stage they patch (needs stage ids)."""
    problems: list[str] = []
    stages = {s.get("id"): s for s in recipe.get("stages", []) if isinstance(s, Mapping) and "id" in s}
    for p in recipe.get("presets", []):
        for sid, params in dict(p.get("patch", {})).items():
            stage = stages.get(sid)
            op = O.OPS.get(str(stage.get("op"))) if stage else None
            if op is not None:
                problems += check_params(op, params, f"{recipe.get('id')} preset {p.get('name')} patch {sid}")
    return problems


def check_catalogue(recipes: Sequence[Mapping[str, Any]], addons: Mapping[str, Any] | None = None) -> list[str]:
    problems: list[str] = []
    seen_ids: dict[str, int] = {}
    seen_names: dict[str, str] = {}
    ranks: dict[int, str] = {}
    for r in recipes:
        problems += check_recipe(r, addons) + patch_problems(r)
        rid, name = str(r.get("id")), str(r.get("name", "")).casefold()
        seen_ids[rid] = seen_ids.get(rid, 0) + 1
        if name in seen_names and seen_names[name] != rid:
            problems.append(f"{rid}: name {r.get('name')!r} is also {seen_names[name]}")
        seen_names[name] = rid
        rank = r.get("rank")
        if isinstance(rank, int):
            if rank in ranks:
                problems.append(f"{rid}: rank {rank} is also {ranks[rank]}")
            ranks[rank] = rid
    problems += [f"{rid}: id used {n} times" for rid, n in seen_ids.items() if n > 1]
    return problems


def check_ranking(ranking: Mapping[str, Any], recipes: Iterable[Mapping[str, Any]]) -> list[str]:
    """ranking.json agrees with the recipes: same rank, name and score for every built row."""
    problems: list[str] = []
    if ranking.get("format") != RANKING_FORMAT:
        return ["ranking.json: unknown format"]
    rows = {row["id"]: row for row in ranking.get("rows", [])}
    ranks = [row["rank"] for row in ranking.get("rows", [])]
    if len(ranks) != len(set(ranks)):
        problems.append("ranking.json: a rank is used twice")
    if ranks != sorted(ranks):
        problems.append("ranking.json: rows must be in rank order")
    for r in recipes:
        row = rows.get(r["id"])
        if row is None:
            problems.append(f"{r['id']}: not in ranking.json")
            continue
        if row["rank"] != r["rank"] or row["name"] != r["name"] or row["like"] != r["like"]["score"]:
            problems.append(f"{r['id']}: rank, name or score differs from ranking.json")
    return problems

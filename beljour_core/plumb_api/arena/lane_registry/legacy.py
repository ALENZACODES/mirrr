"""Machine-readable registry of the features (master command v2 item 9 lists 1-103, women-first 101-103;
later rows continue the numbering).

features.json holds the facts written by hand: name, group, owning modules, provider (local or
YouCam), plan state and, for blocked features, the reason and a clean substitute. Scores are
never written by hand: they are read from arena results files, and the status a report shows
is derived here:

* Passed / Failed only from a gate verdict (hero gate for 2, 3 and 5; the six-score gate for
  the rest),
* otherwise Built, Blocked or Not started as recorded, with scores "Not tested".

`validate` enforces the registry's own rules (ids 1..N with no gaps, at least the first 103, Built modules exist, blocked rows
name a reason and substitute, YouCam only for makeup and styling, hero filters local).
From R13 it also lists W1-W100 (features.json "women", generated from women-100-features.json;
rules in arena/women.py: a W score without a recorded result is rejected).
From R11 the registry also lists every filter look (features.json "filters"); those rows are
checked against the recipes by `validate_filters` and always report Not tested, because no
filter has an arena run and scores are never written by hand.
`unowned_modules` lists any existing module no feature or infrastructure entry claims.
Author: John Khan.
"""
from __future__ import annotations

import json
from collections.abc import Callable, Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .. import constants as C
from ..gates import FAIL, PASS, FeatureScores, Verdict, feature_gate, hero_gate
from .c import LANE_C_MODULE_OWNERS

REGISTRY_PATH = Path(__file__).resolve().parent.parent / "features.json"
REPO_ROOT = Path(__file__).resolve().parents[4]
STATUSES = ("Built", "Blocked", "Not started")
PLAN_STATES = ("built", "planned", "new_round", "blocked")
PROVIDERS = ("local", "youcam", "none")
GROUPS = ("Age & identity", "Hair & beard", "Beauty, skin & makeup", "Face shape & expression", "Photo fix & restore",
          "Generative AI", "Video", "Fun & viral", "Pro & utility", "Women-first")
# YouCam is for makeup and styling only (decisions.md 2026-10-22 and 2:00 PM): hair styling and
# colour (13-24 where YouCam applies), makeup (33-37, 42), the makeup reel (73), event looks (88)
# and Grey Transition (102). Everything else is local.
YOUCAM_ALLOWED = frozenset(list(range(13, 25)) + [33, 34, 35, 36, 37, 42, 73, 88, 102])
HERO = {2: "old", 3: "young", 5: "gender_swap"}
CORE_PRIORITY = frozenset({60, 92, 95, 96})
FIRST_LIST = 103   # rows of the original master list; features added later take the next free id
# Where modules are looked for when checking that every module is owned.
MODULE_ROOTS = ("api/plumb_api/engines", "web/src/engines")
MODULE_FILES = ("api/plumb_api/services", "web/src/engines/local", "web/src/screens")
MODULE_DIRS = ("web/src/reel", "web/src/body", "web/src/face", "web/src/vision", "web/src/ui/shell", "web/src/demo",
               "web/src/layout", "web/src/arena", "web/src/filters", "api/plumb_api/filters")
FILTER_FIELDS = ("id", "name", "tab", "round", "rank", "status", "recipe", "tested")
SCORE_KEYS = ("scores", "score", "worst_slice", "passed", "gate")


@dataclass(frozen=True)
class Feature:
    id: int
    name: str
    group: str
    status: str
    provider: str
    modules: tuple[str, ...]
    plan: Mapping[str, Any]
    tests: tuple[str, ...] = ()
    hero: bool = False
    arena_filter: str | None = None
    simulation_label: bool = False
    core_priority: bool = False
    opt_in: bool = False

    @property
    def plan_state(self) -> str:
        return str(self.plan.get("state"))

    @property
    def plan_round(self) -> str | None:
        return self.plan.get("round")


def extras(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    """Built work that isn't one of the 103 (John's posture must-haves), so its modules count as wired."""
    return list(json.loads(path.read_text(encoding="utf-8")).get("outside_the_100", []))


def load(path: Path = REGISTRY_PATH) -> tuple[list[Feature], dict[str, str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("format") != "beljour-feature-registry/1":
        raise ValueError("unknown registry format")
    feats = [Feature(id=f["id"], name=f["name"], group=f["group"], status=f["status"], provider=f["provider"],
                     modules=tuple(f.get("modules", [])), plan=f["plan"], hero=bool(f.get("hero", False)),
                     tests=tuple(f.get("tests", [])),
                     arena_filter=f.get("arena_filter"), simulation_label=bool(f.get("simulation_label", False)),
                     core_priority=bool(f.get("core_priority", False)), opt_in=bool(f.get("opt_in", False)))
             for f in data["features"]]
    return feats, dict(data.get("infrastructure", {}))


def validate(
    features: Sequence[Feature],
    *,
    root: Path = REPO_ROOT,
    raw: Mapping[str, Any] | None = None,
) -> list[str]:
    problems: list[str] = []
    ids = [f.id for f in features]
    last = max(len(ids), FIRST_LIST)
    if sorted(ids) != list(range(1, last + 1)):
        problems.append(f"ids must be exactly 1..{last} with no gaps or repeats")
    for f in features:
        where = f"#{f.id} {f.name}"
        if f.status not in STATUSES:
            problems.append(f"{where}: status {f.status!r} (Built, Blocked or Not started only)")
        if f.group not in GROUPS:
            problems.append(f"{where}: unknown group {f.group!r}")
        if f.provider not in PROVIDERS:
            problems.append(f"{where}: provider must be local, youcam or none")
        if f.plan_state not in PLAN_STATES:
            problems.append(f"{where}: plan state {f.plan_state!r}")
        if f.status == "Built":
            if f.plan_state != "built":
                problems.append(f"{where}: Built but plan state is {f.plan_state}")
            if not f.modules:
                problems.append(f"{where}: Built with no owning module")
            if not f.tests:
                problems.append(f"{where}: Built requires behavior tests")
        if f.status == "Not started" and f.modules:
            problems.append(
                f"{where}: Not started with registered code; record Built or Blocked with the missing work"
            )
        if f.status == "Blocked" and f.plan_state != "blocked":
            problems.append(f"{where}: Blocked needs a blocked plan and reason")
        for test in f.tests:
            if not (root / test).is_file():
                problems.append(f"{where}: test {test} does not exist")
        if f.plan_state == "built" and f.status != "Built":
            problems.append(f"{where}: plan says built but status is {f.status}")
        for module in f.modules:
            if not (root / module).exists():
                problems.append(f"{where}: module {module} does not exist")
        if f.plan_state == "blocked":
            if not f.plan.get("reason") or not f.plan.get("substitute"):
                problems.append(f"{where}: blocked rows need a reason and a substitute")
            if f.status != "Blocked":
                problems.append(f"{where}: a blocked feature needs status Blocked")
            if f.provider != "none":
                problems.append(f"{where}: blocked features have provider none")
        if f.plan_state == "planned" and not f.plan_round:
            problems.append(f"{where}: planned rows name their round")
        if f.provider == "youcam" and f.id not in YOUCAM_ALLOWED:
            problems.append(f"{where}: YouCam is for makeup and styling only")
        if f.id in HERO and (not f.hero or f.arena_filter != HERO[f.id] or f.provider != "local"):
            problems.append(f"{where}: hero filter must be local with arena filter {HERO[f.id]}")
        if f.hero and f.id not in HERO:
            problems.append(f"{where}: only 2, 3 and 5 are hero filters")
        if (f.id in CORE_PRIORITY) != f.core_priority:
            problems.append(f"{where}: core priority is exactly 60, 92, 95 and 96")
    if raw is not None:
        for f in raw.get("features", []):
            if any(k in f for k in ("scores", "score", "worst_slice", "passed")):
                problems.append(f"#{f.get('id')}: scores are never written into features.json")
        if "women" in raw:
            from ..women import validate_women

            problems += validate_women(raw["women"].get("rows", []), root=root)
    return problems


def women_rows(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    """W1-W100 rows (R13 on), generated by api/scripts/women_registry.py; see arena/women.py."""
    return list(json.loads(path.read_text(encoding="utf-8")).get("women", {}).get("rows", []))


def filter_rows(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    """The filter looks registered in features.json (R11 on), in strip order."""
    return list(json.loads(path.read_text(encoding="utf-8")).get("filters", {}).get("rows", []))


def validate_filters(rows: Sequence[Mapping[str, Any]], recipes: Sequence[Mapping[str, Any]], *,
                     root: Path = REPO_ROOT) -> list[str]:
    """Every recipe registered exactly once with its name, tab, round and rank; Built, Not tested,
    and never a score."""
    problems: list[str] = []
    by_id: dict[str, Mapping[str, Any]] = {}
    for row in rows:
        rid = str(row.get("id"))
        where = f"filter {rid}"
        if rid in by_id:
            problems.append(f"{where}: registered twice")
        by_id[rid] = row
        if any(k in row for k in SCORE_KEYS):
            problems.append(f"{where}: scores are never written into features.json")
        missing = [k for k in FILTER_FIELDS if k not in row]
        if missing:
            problems.append(f"{where}: missing {', '.join(missing)}")
            continue
        if row["status"] != "Built" or row["tested"] != "Not tested":
            problems.append(f"{where}: a registered filter is Built and Not tested until the arena scores it")
        if not (root / str(row["recipe"])).is_file():
            problems.append(f"{where}: recipe file {row['recipe']} does not exist")
    for r in recipes:
        rid = str(r["id"])
        found = by_id.pop(rid) if rid in by_id else None
        if found is None:
            problems.append(f"filter {rid}: built but not registered")
            continue
        for key in ("name", "tab", "round", "rank"):
            if found.get(key) != r.get(key):
                problems.append(f"filter {rid}: {key} {found.get(key)!r} differs from the recipe ({r.get(key)!r})")
    problems += [f"filter {rid}: registered but no recipe" for rid in by_id]
    return problems


def filter_checklist(rows: Sequence[Mapping[str, Any]]) -> str:
    """One line for the one-page report: how many looks are built, and that none is tested yet."""
    rounds = sorted({str(r.get("round")) for r in rows})
    untested = sum(1 for r in rows if r.get("tested") == "Not tested")
    return (f"Filters ({', '.join(rounds) or 'none'}): {len(rows)} looks built, {untested} Not tested "
            f"(no arena run yet; scores come only from results).")


def module_universe(root: Path = REPO_ROOT) -> list[str]:
    out: list[str] = []
    for base in MODULE_ROOTS:
        folder = root / base
        if folder.is_dir():
            out.extend(
                f"{base}/{p.name}"
                for p in sorted(folder.iterdir())
                if p.is_dir() and not p.name.startswith("_")
            )
    for base in MODULE_FILES:
        folder = root / base
        if folder.is_dir():
            out.extend(f"{base}/{p.name}" for p in sorted(folder.iterdir())
                       if p.is_file() and p.suffix in (".py", ".ts") and p.name != "__init__.py")
    out.extend(d for d in MODULE_DIRS if (root / d).is_dir())
    return out


def unowned_modules(
    features: Sequence[Feature],
    infrastructure: Mapping[str, str],
    root: Path = REPO_ROOT,
    extra: Sequence[Mapping[str, Any]] | None = None,
    *,
    extras_provider: Callable[[Path], list[dict[str, Any]]] = extras,
    universe_provider: Callable[[Path], list[str]] = module_universe,
) -> list[str]:
    extra_rows = extras_provider(REGISTRY_PATH) if extra is None else extra
    claimed = [m for feature in features for m in feature.modules]
    claimed += list(infrastructure)
    claimed += [m for entry in extra_rows for m in entry.get("modules", [])]
    claimed += [str(m) for r in women_rows() for m in (r.get("modules") or [])]
    claimed.extend(LANE_C_MODULE_OWNERS)

    def owned(module: str) -> bool:
        return any(c == module or c.startswith(module + "/") or module.startswith(c + "/") for c in claimed)

    return [m for m in universe_provider(root) if not owned(m)]


# --- scores and derived status ------------------------------------------------------------

@dataclass
class Row:
    feature: Feature
    status: str                       # Built / Not started / Passed / Failed
    scores: dict[str, float | None]   # dimension -> overall mean (None = Not tested)
    worst: dict[str, tuple[str, float] | None]
    source: str                       # "human", "proxy" or "" (not tested)
    verdict: Verdict | None = None
    notes: list[str] = field(default_factory=list)


def _hero_scores(results: Mapping[str, Any], filt: str) -> tuple[dict, dict, str] | None:
    ours = results.get("ours")
    human = results.get("views", {}).get("human", {}).get(filt, {}).get("scores", {}).get(ours)
    if human:
        return _flatten(human) + ("human",)
    proxy = results.get("proxy_scores", {}).get(filt, {}).get(ours)
    if proxy:
        return _flatten(proxy) + ("proxy",)
    return None


def _flatten(by_slice: Mapping[str, Mapping[str, Mapping[str, float]]], min_n: int = C.MIN_SLICE_SCORED_IMAGES
             ) -> tuple[dict, dict]:
    overall = {d: by_slice.get("all", {}).get(d, {}).get("mean") for d in C.DIMENSIONS}
    worst: dict[str, tuple[str, float] | None] = {}
    for d in C.DIMENSIONS:
        rows = [(k, v[d]["mean"]) for k, v in by_slice.items() if k != "all" and d in v and v[d].get("n", 0) >= min_n]
        worst[d] = min(rows, key=lambda kv: (kv[1], kv[0])) if rows else None
    return overall, worst


def feature_rows(features: Sequence[Feature], results: Iterable[Mapping[str, Any]] = (),
                 feature_results: Mapping[int, Mapping[str, Any]] | None = None) -> list[Row]:
    """One row per feature with its derived status and scores. `results` are arena results
    files (newest last); `feature_results` maps a non-hero feature id to its per-slice scores
    ({"source": "human"|"proxy", "scores": {slice: {dim: {"mean", "n"}}}})."""
    results = list(results)
    latest = results[-1] if results else None
    rows: list[Row] = []
    for f in features:
        empty = {d: None for d in C.DIMENSIONS}
        row = Row(f, f.status, dict(empty), {d: None for d in C.DIMENSIONS}, "")
        if f.hero and latest is not None and f.arena_filter:
            got = _hero_scores(latest, f.arena_filter)
            if got:
                row.scores, row.worst, row.source = got
            verdict = hero_gate(latest, f.arena_filter)
            row.verdict = verdict
            if verdict.status == PASS:
                row.status = "Passed"
            elif verdict.status == FAIL:
                row.status = "Failed"
        elif feature_results and f.id in feature_results and f.status == "Built":
            entry = feature_results[f.id]
            overall, worst = _flatten(entry["scores"])
            row.scores, row.worst, row.source = overall, worst, entry.get("source", "proxy")
            slices = {d: {k: v[d]["mean"] for k, v in entry["scores"].items() if k != "all" and d in v
                          and v[d].get("n", 0) >= C.MIN_SLICE_SCORED_IMAGES} for d in C.DIMENSIONS}
            verdict = feature_gate(FeatureScores(overall, slices, row.source))
            row.verdict = verdict
            if verdict.status == PASS:
                row.status = "Passed"
            elif verdict.status == FAIL:
                row.status = "Failed"
        if f.status == "Not started" and row.status in ("Passed", "Failed"):
            row.notes.append("scored but recorded as Not started; check features.json")
        rows.append(row)
    return rows


STATE_WORDS = {
    "built": "already built",
    "planned": "in plan round",
    "new_round": "needs new round",
    "blocked": "blocked",
}


def mapping_markdown(features: Sequence[Feature]) -> str:
    """The 100+3 mapping table for docs/FEATURES.md (master command brief item 10)."""
    lines = ["| # | Feature | Provider | Mapping | Round | Note, or blocked reason and substitute |",
             "|---|---|---|---|---|---|"]
    for f in sorted(features, key=lambda x: x.id):
        state = STATE_WORDS[f.plan_state]
        note = str(f.plan.get("note", ""))
        if f.plan_state == "blocked":
            note = f"Blocked: {f.plan['reason']} Substitute: {f.plan['substitute']}"
        tags = []
        if f.hero:
            tags.append("hero")
        if f.core_priority:
            tags.append("core priority")
        if f.opt_in:
            tags.append("opt-in")
        if f.simulation_label:
            tags.append("simulation label")
        name = f.name + (f" ({', '.join(tags)})" if tags else "")
        lines.append(
            f"| {f.id} | {name} | {f.provider} | {state} | "
            f"{f.plan_round or '-'} | {note.replace('|', '/')} |"
        )
    counts = {s: sum(1 for f in features if f.plan_state == s) for s in PLAN_STATES}
    lines.append("")
    lines.append("Totals: " + ", ".join(f"{STATE_WORDS[s]} {n}" for s, n in counts.items()) + ".")
    return "\n".join(lines)


def to_json(rows: Sequence[Row]) -> list[dict[str, Any]]:
    """Machine-readable registry with derived status and scores (for tools and the web)."""
    out = []
    for r in rows:
        f = r.feature
        out.append({"id": f.id, "name": f.name, "group": f.group, "status": r.status, "provider": f.provider,
                    "modules": list(f.modules), "tests": list(f.tests), "plan": dict(f.plan),
                    "hero": f.hero, "core_priority": f.core_priority,
                    "scores": {d: r.scores.get(d) for d in C.DIMENSIONS},
                    "worst_slice": {d: (list(value) if value is not None else None) for d in C.DIMENSIONS
                                    for value in [r.worst.get(d)]},
                    "score_source": r.source or "not tested",
                    "gate": r.verdict.label if r.verdict else "Not tested"})
    return out


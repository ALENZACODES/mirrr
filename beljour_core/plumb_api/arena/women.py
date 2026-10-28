"""W1-W100, the 100 features women want (John's round 2 attachment), in the arena registry.

women-100-features.json (this folder) is the hand-entered source: John's list, his order and
groups, with gap grade, difficulty, engine note, workstream, provider, overlap, flags and
plan status. `BUILT` below records which W items have code and tests, and where. The
`women` block of features.json is generated from both by api/scripts/women_registry.py,
and `make check` fails if it drifts.

Rules (round2-plan-binding.md section 10, score-rubric-1000.md area 2):
* status is planned, built or blocked; blocked rows carry the reason;
* every row says tested "Not tested" until an arena run records a result;
* a row may carry a score only next to a recorded result file that exists: a W score with
  no result is rejected;
* built rows name owning modules and tests that exist.
Author: John Khan.
"""
from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

SOURCE_PATH = Path(__file__).with_name("women-100-features.json")
REPO_ROOT = Path(__file__).resolve().parents[3]
STATUSES = ("planned", "built", "blocked")
SCORE_KEYS = ("scores", "score", "worst_slice", "passed", "gate")
TOP5 = ("W6", "W39", "W98", "W28", "W93")

BUILT: dict[str, dict[str, Any]] = {
    "W1": {"modules": ["web/src/engines/palette/colour.ts", "web/src/save/palettes.ts",
                       "web/src/screens/palettes.ts"],
           "tests": ["web/test/palette-engine.test.mjs", "web/test/palette-screen.test.mjs"],
           "note": "Digital mixing and explicitly saved Eyes/Blush/Lips colour preferences; chroma changes preserve swatch lightness. No face pixels changed or real-product equivalence claimed."},
    "W2": {"modules": ["web/src/engines/palette/extract.ts", "web/src/screens/palettes.ts"],
           "tests": ["web/test/palette-engine.test.mjs", "web/test/palette-screen.test.mjs"],
           "note": "Local bounded extraction from a chosen photo region, with sampled colour error. Depth warnings are disclosed heuristics using a current W6 reading; no automatic complexion changes or brand matches."},
    "W6": {"modules": ["api/plumb_api/engines/shade/finder.py", "web/src/engines/shade/finder.ts",
                       "web/src/screens/shade-local.ts", "web/src/screens/shade.ts"],
           "tests": ["api/tests/test_w6_shade.py", "web/test/shade-w6.test.mjs", "web/test/shade-local.test.mjs", "web/test/shade-screen-w6.test.mjs"],
           "note": "Own reference shades only; not tested against real products. Depth bands ASSUMED."},
    "W98": {"modules": ["api/plumb_api/engines/shade/lighting.py", "web/src/engines/shade/lighting.ts", "web/src/screens/lighting.ts",
                        "web/src/ui/shell/gpu-renderer.ts"],
            "tests": ["api/tests/test_w98_lighting.py", "web/test/shade-w6.test.mjs", "web/test/lighting-screen.test.mjs", "web/test/gpu-path.test.mjs"],
            "note": "Colour-value simulation; metamerism not modelled; screens not calibrated."},
    "W39": {"modules": ["api/plumb_api/engines/haircolour/recolour.py", "web/src/engines/haircolour/recolour.ts", "web/src/screens/recolour.ts",
                        "web/src/screens/hair-painter.ts"],
            "tests": ["api/tests/test_w39_w28_haircolour.py", "web/test/haircolour-w39-w28.test.mjs", "web/test/recolour-screen.test.mjs"],
            "note": "Local fallback renderer; drawn coil textures only, no real curly-hair slice yet."},
    "W28": {"modules": ["api/plumb_api/engines/haircolour/balayage.py", "web/src/engines/haircolour/balayage.ts", "web/src/screens/balayage.ts"],
            "tests": ["api/tests/test_w39_w28_haircolour.py", "web/test/haircolour-w39-w28.test.mjs", "web/test/balayage-screen.test.mjs"],
            "note": "Lift per session and level scale ASSUMED; shows session 1."},
    "W93": {"modules": ["api/plumb_api/services/salon_pack.py", "web/src/screens/salon-pack.ts",
                        "api/plumb_api/engines/workflow_w/decision.py", "web/src/engines/workflow_w/decision.ts",
                        "web/src/salon/spec.ts", "web/src/salon/spec-pdf.ts", "web/src/screens/decision-sheet.ts"],
            "tests": ["api/tests/test_w93_salon_pack.py", "web/test/salon-pack-screen.test.mjs",
                      "api/tests/test_decision_layer.py", "web/test/decision-layer.test.mjs", "web/test/decision-sheet.test.mjs"],
            "note": "Two-page local PDF plus ZIP at editor resolution, and a settings-only decision spec sheet "
                    "(shade target, placement, ASSUMED CAD price and longevity she can edit); photos only by her "
                    "choice; no hosted share link, side view or real price claim."},
}


# Source rows carry only edited status/test fields. Owning modules are selected
# from existing reviewed feature packages rather than from an invented provider.
# These mappings are declarations of implementation, not real-face quality PASS.
_WOMEN_PACKAGE_MODULES: dict[str, tuple[str, ...]] = {
    "women": (
        "api/plumb_api/engines/women_styling/__init__.py",
        "web/src/engines/women_styling/index.ts",
    ),
    "hair": (
        "api/plumb_api/engines/hair_women/__init__.py",
        "web/src/engines/hair_women/index.ts",
    ),
    "eyes": (
        "api/plumb_api/engines/eyes/__init__.py",
        "web/src/engines/eyes/index.ts",
    ),
    "brows": (
        "api/plumb_api/engines/brows/__init__.py",
        "web/src/engines/brows/index.ts",
    ),
    "lips": (
        "api/plumb_api/engines/lips/__init__.py",
        "web/src/engines/lips/index.ts",
    ),
    "smile": (
        "api/plumb_api/engines/smile/__init__.py",
        "web/src/engines/smile/index.ts",
    ),
    "skin": (
        "api/plumb_api/engines/skin_more/__init__.py",
        "web/src/engines/skin_more/index.ts",
    ),
    "workflow": (
        "api/plumb_api/engines/workflow_w/__init__.py",
        "web/src/engines/workflow_w/index.ts",
    ),
}


def _package_for_w(number: int) -> str:
    if number <= 18:
        return "women"
    if number <= 44:
        return "hair" if number not in (27, 36, 37, 38) else "women"
    if number <= 58:
        return "smile" if number in (50, 51, 52, 53, 58) else "lips"
    if number <= 67 or number in (75, 76):
        return "eyes"
    if number <= 73:
        return "brows"
    if number <= 92:
        return "skin"
    return "workflow"


def declared_built_evidence(item: Mapping[str, Any]) -> dict[str, Any]:
    """Accept only a source status with existing test paths, never a quality score."""
    tests = item.get("tests")
    if not isinstance(tests, list) or not tests or not all(isinstance(t, str) for t in tests):
        raise ValueError(f"{item.get('id')}: built source must name test files")
    package = _package_for_w(int(item["number"]))
    return {
        "modules": list(_WOMEN_PACKAGE_MODULES[package]),
        "tests": tests,
        "note": "Locally implemented; synthetic tests only. Real-face result Not tested.",
    }


def load_source(path: Path = SOURCE_PATH) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("format") != "beljour-women-100/1":
        raise ValueError("unknown women-100 source format")
    return dict(data)


def build_rows(source: Mapping[str, Any], built: Mapping[str, Mapping[str, Any]] = BUILT) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for item in source["features"]:
        row: dict[str, Any] = {"id": item["id"], "name": item["name"], "group": item["group"], "gap": item["gap"],
                               "difficulty": item["difficulty"], "workstream": item["workstream"],
                               "provider": item["provider"], "overlap": item["overlap"]}
        if "top5_rank" in item:
            row["top5_rank"] = item["top5_rank"]
        if item["flags"]:
            row["flags"] = list(item["flags"])
        if item["status"] == "built":
            entry = built.get(item["id"]) or declared_built_evidence(item)
            row["status"] = "built"
            row["modules"] = list(entry["modules"])
            row["tests"] = list(item.get("tests") or entry["tests"])
            row["note"] = entry["note"]
        else:
            row["status"] = item["status"]
            if item["status"] == "blocked":
                row["blocked_reason"] = item["blocked_reason"]
        row["tested"] = "Not tested"
        rows.append(row)
    return rows


def block(source: Mapping[str, Any] | None = None) -> dict[str, Any]:
    src = load_source() if source is None else source
    return {"about": ("W1-W100 from John's '100 Features Women Want That Apps Don't Have' (round 2 plan section 10). "
                      "Generated by api/scripts/women_registry.py from api/plumb_api/arena/women-100-features.json; "
                      "do not edit by hand. Scores come only from recorded results."),
            "source": "api/plumb_api/arena/women-100-features.json",
            "rows": build_rows(src)}



def historical_block(source: Mapping[str, Any] | None = None) -> dict[str, Any]:
    """Preserve the pre-R24c published statuses for historical Lane B views.

    Independently reviewed current implementations stay in ``build_rows``.
    This projection cannot claim a historical release or a new quality pass.
    """
    result = block(source)
    for row in result["rows"]:
        feature_id = str(row["id"])
        entry = BUILT.get(feature_id)
        if entry is not None:
            row["status"] = "built"
            row["modules"] = list(entry["modules"])
            row["tests"] = list(entry["tests"])
            row["note"] = str(entry["note"])
        elif row["status"] == "built":
            row["status"] = "planned"
            for key in ("modules", "tests", "note"):
                row.pop(key, None)
    return result


def validate_women(rows: Sequence[Mapping[str, Any]], *, root: Path = REPO_ROOT) -> list[str]:
    problems: list[str] = []
    ids = [str(r.get("id")) for r in rows]
    if ids != [f"W{i}" for i in range(1, 101)]:
        problems.append("women rows must be exactly W1..W100 in order")
    for row in rows:
        where = f"{row.get('id')} {row.get('name')}"
        status = row.get("status")
        if status not in STATUSES:
            problems.append(f"{where}: status must be planned, built or blocked")
        scored = [k for k in SCORE_KEYS if k in row]
        if scored:
            result = row.get("result")
            if not isinstance(result, str) or not (root / result).is_file():
                problems.append(f"{where}: a score ({', '.join(scored)}) needs a recorded result file")
        elif row.get("tested") != "Not tested":
            problems.append(f"{where}: tested must say Not tested until a result is recorded")
        if status == "blocked" and not row.get("blocked_reason"):
            problems.append(f"{where}: blocked rows need a reason")
        if status == "built":
            modules, tests = row.get("modules") or [], row.get("tests") or []
            if not modules or not tests:
                problems.append(f"{where}: built rows name modules and tests")
            for path in list(modules) + list(tests):
                if not (root / str(path)).exists():
                    problems.append(f"{where}: {path} does not exist")
        elif row.get("modules"):
            problems.append(f"{where}: only built rows list modules")
    for top in TOP5:
        match = [r for r in rows if r.get("id") == top]
        if match and match[0].get("status") == "planned":
            problems.append(f"{top}: a Top 5 item is still planned")
    return problems


def modules(rows: Sequence[Mapping[str, Any]]) -> list[str]:
    return [str(m) for r in rows for m in (r.get("modules") or [])]


def checklist(rows: Sequence[Mapping[str, Any]]) -> str:
    counts = {s: sum(1 for r in rows if r.get("status") == s) for s in STATUSES}
    untested = sum(1 for r in rows if r.get("tested") == "Not tested")
    return (f"W1-W100: {counts['built']} built, {counts['planned']} planned, {counts['blocked']} blocked; "
            f"{untested} Not tested (scores come only from recorded results).")


def markdown(rows: Sequence[Mapping[str, Any]]) -> str:
    lines = ["| W | Feature | Group | Status | Tested | Note, or blocked reason |", "|---|---|---|---|---|---|"]
    for r in rows:
        note = r.get("note") or r.get("blocked_reason") or ""
        name = r["name"] + (f" (Top 5 #{r['top5_rank']})" if "top5_rank" in r else "")
        lines.append(f"| {r['id']} | {name} | {r['group']} | {r['status']} | {r['tested']} | {str(note).replace('|', '/')} |")
    lines.append("")
    lines.append(checklist(rows))
    return "\n".join(lines)

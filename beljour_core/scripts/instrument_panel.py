"""Instrument panel: quality gates, per-slice coverage, licence status and cost per edit, side by
side, read from the instruments themselves. A number that no instrument measured is NOT_RUN.

  python api/scripts/instrument_panel.py meter [--repeats N] [--note TEXT]
        time the local edits now and write docs/numbers/COST-RUN.json (a measured record)
  python api/scripts/instrument_panel.py [--results FILE ...]
        write docs/numbers/INSTRUMENT-PANEL.md and .json from the committed inputs
  python api/scripts/instrument_panel.py --check [--results FILE ...]
        fail if either panel file differs from what the inputs give now

Inputs: api/plumb_api/arena/features.json (feature, filter and women rows), arena results files
(--results, from the test box; none are in the repository), the Proof Wall
(docs/artistic/proof_wall/BELJOUR_PROOF_WALL.json), the licence certificate
(docs/LICENCE-CERTIFICATE.json), the cost run, the price table (api/plumb_api/metering/prices.json,
every price ASSUMED) and the unit caps in plumb_api/config.py. A cost-run probe whose engine
source changed since it was measured is shown STALE and its numbers NOT_RUN.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Any

API = Path(__file__).resolve().parents[1]
REPO = API.parent
sys.path.insert(0, str(API))

from plumb_api.arena import constants as C  # noqa: E402
from plumb_api.arena.gates import hero_gate  # noqa: E402
from plumb_api.config import Settings  # noqa: E402
from plumb_api.metering import meter  # noqa: E402

FORMAT = "beljour-instrument-panel/1"
NOT_RUN, NOT_SET, STALE, MEASURED = meter.NOT_RUN, meter.NOT_SET, "STALE", "MEASURED"
OUT = Path("docs") / "numbers"
MD_PATH, JSON_PATH, RUN_PATH = OUT / "INSTRUMENT-PANEL.md", OUT / "INSTRUMENT-PANEL.json", OUT / "COST-RUN.json"
FEATURES = Path("api/plumb_api/arena/features.json")
PROOF_WALL = Path("docs/artistic/proof_wall/BELJOUR_PROOF_WALL.json")
CERTIFICATE = Path("docs/LICENCE-CERTIFICATE.json")
PRICES = Path("api/plumb_api/metering/prices.json")


def read_json(root: Path, rel: Path) -> dict[str, Any] | None:
    path = root / rel
    return json.loads(path.read_text(encoding="utf-8")) if path.is_file() else None


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def gate_slices() -> list[str]:
    """The marginal slices an arena gate checks for every hero filter (arena/results.py)."""
    return ([f"race:{r}" for r in C.FAIRFACE_RACES] + [f"gender:{g}" for g in C.FAIRFACE_GENDERS]
            + [f"age:{a}" for a in C.ADULT_BANDS])


class Panel:
    def __init__(self, root: Path, results: Sequence[Path] = ()) -> None:
        self.root = root
        loaded = [(p, json.loads(p.read_text(encoding="utf-8"))) for p in results]
        # A SYNTHETIC dry-run results file is never a result: it is listed as refused and the
        # gates and slices it would fill stay NOT_RUN.
        self.refused = [p for p, data in loaded if data.get("synthetic")]
        self.results = [(p, data) for p, data in loaded if not data.get("synthetic")]
        self.registry = read_json(root, FEATURES) or {}

    # quality gates
    def heroes(self) -> list[dict[str, Any]]:
        latest = self.results[-1][1] if self.results else None
        rows = []
        for f in self.registry.get("features", []):
            if not f.get("hero"):
                continue
            row: dict[str, Any] = {"id": f["id"], "name": f["name"], "filter": f.get("arena_filter"),
                                   "rule": f"human judgements vs the reference baseline: overall >= "
                                           f"{C.HERO_OVERALL_MIN:.0%}, every slice >= {C.HERO_SLICE_MIN:.0%}, "
                                           f">= {C.MIN_SLICE_JUDGEMENTS} judgements per slice"}
            if latest is None:
                row.update(status=NOT_RUN, reasons=["no arena results file was given; results live on the test box"],
                           overall=NOT_RUN, worst_slice=NOT_RUN)
            else:
                verdict = hero_gate(latest, f["arena_filter"])
                row.update(status=verdict.label, reasons=verdict.reasons, judged_by=verdict.judged_by,
                           overall=NOT_RUN if verdict.overall is None else round(verdict.overall, 4),
                           worst_slice=NOT_RUN if verdict.worst_slice is None else list(verdict.worst_slice))
            rows.append(row)
        return rows

    def registry_counts(self) -> dict[str, Any]:
        features = self.registry.get("features", [])
        women = self.registry.get("women", {}).get("rows", [])
        filters = self.registry.get("filters", {}).get("rows", [])

        def count(rows: list[dict], key: str) -> dict[str, int]:
            out: dict[str, int] = {}
            for r in rows:
                out[str(r.get(key))] = out.get(str(r.get(key)), 0) + 1
            return dict(sorted(out.items()))
        return {
            "features": {"rows": len(features), "status": count(features, "status"),
                         "scored": NOT_RUN if not self.results else "see hero gates",
                         "rule": f"six dimensions >= {C.FEATURE_AVERAGE_MIN:g} on average and no slice below "
                                 f"{C.FEATURE_SLICE_MIN:g}; scores come only from arena results files"},
            "filters": {"rows": len(filters), "status": count(filters, "status"), "tested": count(filters, "tested")},
            "women": {"rows": len(women), "status": count(women, "status"), "tested": count(women, "tested")},
        }

    def proof_wall(self) -> dict[str, Any]:
        wall = read_json(self.root, PROOF_WALL)
        if wall is None:
            return {"status": NOT_RUN, "reason": f"{PROOF_WALL.as_posix()} is missing"}
        summary, ledger = wall.get("summary", {}), wall.get("coverLedger", {})
        latency = sorted(row["warmP50Ms"] for row in wall.get("latency", []))
        tones: dict[str, dict[str, int]] = {}   # in the ledger's own order, lightest first
        for result in ledger.get("results", []):
            slot = tones.setdefault(result["tone"], {"evaluated": 0, "passes": 0})
            slot["evaluated"] += 1
            slot["passes"] += bool(result.get("passed"))
        run = wall.get("latencyRun", {})
        return {"status": MEASURED, "scope": "synthetic: code-drawn portraits, six tones, three lights",
                "filters": summary.get("filters"), "evaluated": summary.get("evaluated"),
                "passes": summary.get("passes"), "grade": summary.get("syntheticGrade"),
                "real_faces_evaluated": summary.get("realFacesEvaluated"),
                "tones": tones,
                "latency": {"runtime": run.get("runtime"), "scope": run.get("scope"),
                            "filters_timed": len(latency),
                            "warm_p50_ms_median": round(meter.quantile(latency, 0.5), 3) if latency else NOT_RUN,
                            "warm_p50_ms_max": latency[-1] if latency else NOT_RUN,
                            "browser_or_mobile": "verified" if run.get("mobileOrBrowserBudgetVerified") else NOT_RUN},
                "claims": wall.get("claims", {})}

    def slices(self) -> dict[str, Any]:
        """Judgements per gate slice per hero filter, from the latest results file only."""
        latest = self.results[-1][1] if self.results else None
        heroes = [f for f in self.registry.get("features", []) if f.get("hero")]
        rows: list[dict[str, Any]] = []
        for key in gate_slices():
            cells: dict[str, Any] = {}
            for f in heroes:
                value: Any = NOT_RUN
                if latest is not None:
                    human = latest.get("views", {}).get("human", {}).get(f["arena_filter"], {})
                    matchup = human.get("matchups", {}).get(f"{latest.get('ours')}|{latest.get('baseline', 'baseline')}")
                    if matchup is not None:
                        value = matchup.get(key, {}).get("n", 0)
                cells[f["arena_filter"]] = value
            rows.append({"slice": key, "judgements": cells})
        covered = sum(1 for r in rows for v in r["judgements"].values()
                      if isinstance(v, int) and v >= C.MIN_SLICE_JUDGEMENTS)
        return {"minimum_per_slice": C.MIN_SLICE_JUDGEMENTS, "rows": rows,
                "cells": len(rows) * len(heroes), "cells_at_minimum": covered if latest is not None else NOT_RUN}

    # licence certificate
    def licences(self) -> dict[str, Any]:
        cert = read_json(self.root, CERTIFICATE)
        if cert is None:
            return {"status": NOT_RUN, "reason": f"{CERTIFICATE.as_posix()} is missing"}
        verdict = cert["verdict"]
        return {"status": MEASURED, "current": self.certificate_current(), "gate": verdict["gate"],
                "strict": verdict["strict"], "open_items": verdict["open_items"], "by_concern": verdict["by_concern"],
                "items": [f"{i['name']} ({i['section']}, {i['concern']})" for i in cert.get("open_items", [])]}

    def certificate_current(self) -> str:
        script = self.root / "scripts" / "licence_certificate.py"
        if not script.is_file():
            return NOT_RUN
        spec = importlib.util.spec_from_file_location("licence_certificate_for_panel", script)
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        _, outputs = module.render(self.root)
        same = all((self.root / rel).is_file() and (self.root / rel).read_text() == text for rel, text in outputs.items())
        return "yes" if same else "no: run make licence-certificate"

    # cost per edit
    def costs(self) -> dict[str, Any]:
        prices = meter.read_prices(self.root / PRICES)
        run = read_json(self.root, RUN_PATH)
        measured = {row["id"]: row for row in (run or {}).get("probes", [])}
        local = []
        for probe in meter.PROBES:
            row = measured.get(probe.id)
            entry: dict[str, Any] = {"id": probe.id, "label": probe.label, "features": list(probe.features)}
            if row is None:
                entry["status"] = NOT_RUN
            elif row.get("status") != "measured":
                entry.update(status="FAILED", error=row.get("error"))
                row = None
            elif row.get("source_sha256") != self.digest(probe.sources):
                entry["status"] = STALE
                row = None
            else:
                entry["status"] = MEASURED
            for key in ("cold_ms", "warm_p50_ms", "warm_p95_ms", "warm_cpu_p50_ms", "peak_heap_kib", "pixels"):
                entry[key] = row[key] if row else NOT_RUN
            entry.update(meter.compute_cost(row, prices), units_per_edit=0)
            local.append(entry)
        caps = Settings()
        return {
            "run": {"status": MEASURED if run else NOT_RUN,
                    **({k: run.get(k) for k in ("measured_at_utc", "platform", "repeats", "scope", "note")} if run else {})},
            "local": local,
            "provider": meter.provider_rows(prices, session_cap_public=caps.session_cap_public,
                                            session_cap_judge=caps.session_cap_judge,
                                            daily_unit_cap=caps.daily_unit_cap),
            "caps": {"session_cap_public": caps.session_cap_public, "session_cap_judge": caps.session_cap_judge,
                     "daily_unit_cap": caps.daily_unit_cap, "balance_floor": caps.unit_reserve,
                     "judge_codes": "stored as SHA-256 digests only", "live_spend": NOT_RUN},
            "prices": prices["prices"], "currency": prices["currency"],
        }

    def digest(self, sources: Sequence[str]) -> str | None:
        try:
            return meter.source_digest(sources, self.root)
        except FileNotFoundError:   # an engine file was moved or removed: the run no longer applies
            return None

    def instruments(self, doc: dict[str, Any]) -> list[dict[str, str]]:
        """What exists today and what each instrument really measures."""
        wall, lic, cost = doc["proof_wall"], doc["licences"], doc["costs"]
        heroes = doc["quality"]["heroes"]
        hero_state = NOT_RUN if all(h["status"] == NOT_RUN for h in heroes) else ", ".join(h["status"] for h in heroes)
        measured_local = sum(r["status"] == MEASURED for r in cost["local"])
        return [
            {"instrument": "Arena hero gates (Old, Young, Gender swap)",
             "code": "api/plumb_api/arena/gates.py, api/scripts/arena.py",
             "measures": "blind human pairwise judgements against the reference baseline, per slice",
             "today": hero_state},
            {"instrument": "Feature gate (every other feature)", "code": "api/plumb_api/arena/gates.py, registry.py",
             "measures": "six 1-10 scores per slice from arena results files",
             "today": f"{doc['quality']['registry']['features']['rows']} rows, scores {NOT_RUN}"},
            {"instrument": "Per-slice proof (arena slices)", "code": "api/plumb_api/arena/results.py, stats.py",
             "measures": "judgements and Wilson intervals per race, gender and adult age band",
             "today": f"{doc['slices']['cells']} slice cells, at minimum: {doc['slices']['cells_at_minimum']}"},
            {"instrument": "Real-face release gate", "code": "tests/realface (frozen-face bench, preregistered definitions)",
             "measures": "pass rates on licensed adult photos kept outside the repository",
             "today": f"{NOT_RUN} here ({wall.get('claims', {}).get('release', 'no claim recorded')})"},
            {"instrument": "Proof Wall (filters)", "code": "api/plumb_api/filters/qa/proof_wall.py",
             "measures": "synthetic Cover Test on six drawn tones; Node V8 render latency, not browser or mobile",
             "today": f"{wall.get('passes', NOT_RUN)}/{wall.get('evaluated', NOT_RUN)} synthetic checks; "
                      f"real faces {wall.get('real_faces_evaluated', NOT_RUN)}"},
            {"instrument": "YouCam unit caps and judge codes", "code": "api/plumb_api/limits.py, config.py, youcam/units.py",
             "measures": "units reserved before each live call; kill switch, session, daily and balance-floor caps",
             "today": f"enforced in code; live spend is in the server's ledger, {NOT_RUN} here"},
            {"instrument": "Generation cost receipts", "code": "api/plumb_api/pro/generation/meter.py",
             "measures": "GPU milliseconds x a declared rate, per generated image",
             "today": f"{NOT_RUN} (no GPU run recorded; unmeasured images stay NOT_MEASURED)"},
            {"instrument": "Cost-per-edit meter", "code": "api/plumb_api/metering",
             "measures": "local CPU time and heap per engine; provider units per edit; ASSUMED CAD prices",
             "today": f"{measured_local}/{len(cost['local'])} local probes measured; prices ASSUMED"},
            {"instrument": "Licence certificate", "code": "scripts/licence_certificate.py",
             "measures": "rights of every dependency, model, runtime URL and corpus",
             "today": f"gate {lic.get('gate', NOT_RUN)}, strict {lic.get('strict', NOT_RUN)}, "
                      f"{lic.get('open_items', NOT_RUN)} open items"},
            {"instrument": "E29 quality checks", "code": "api/plumb_api/quality, make quality-report",
             "measures": "Q1-Q12 checks on synthetic photos", "today": f"{NOT_RUN} here (reports are not committed)"},
        ]

    def build(self) -> dict[str, Any]:
        doc: dict[str, Any] = {
            "format": FORMAT, "author": "John Khan",
            "about": "Written by api/scripts/instrument_panel.py from the instruments' own outputs. NOT_RUN means no "
                     "instrument measured the number; NOT_SET means its ASSUMED price is unset; STALE means the "
                     "engine changed after it was measured.",
            "inputs": {rel.as_posix(): sha(self.root / rel) for rel in (FEATURES, PROOF_WALL, CERTIFICATE, PRICES, RUN_PATH)
                       if (self.root / rel).is_file()},
            "results_files": [{"path": p.name, "sha256": sha(p)} for p, _ in self.results],
            "refused_results_files": [{"path": p.name, "sha256": sha(p), "reason": "SYNTHETIC dry run, never a result"}
                                      for p in self.refused],
            "quality": {"heroes": self.heroes(), "registry": self.registry_counts()},
            "slices": self.slices(),
            "proof_wall": self.proof_wall(),
            "licences": self.licences(),
            "costs": self.costs(),
        }
        doc["instruments"] = self.instruments(doc)
        return doc


# Markdown
def cell(value: Any) -> str:
    if isinstance(value, dict):
        return ", ".join(f"{k} {v}" for k, v in value.items()) or "-"
    if isinstance(value, float):
        return f"{value:.6f}".rstrip("0").rstrip(".") if abs(value) < 1 else f"{value:,.1f}"
    if isinstance(value, list):
        return ", ".join(str(v) for v in value) or "-"
    return "-" if value is None or value == "" else str(value).replace("|", "\\|")


def table(headers: Sequence[str], rows: Sequence[Sequence[Any]]) -> list[str]:
    if not rows:
        return ["None.", ""]
    return ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers),
            *["| " + " | ".join(cell(v) for v in row) + " |" for row in rows], ""]


def markdown(doc: dict[str, Any]) -> str:
    q, s, wall, lic, cost = doc["quality"], doc["slices"], doc["proof_wall"], doc["licences"], doc["costs"]
    heroes = q["heroes"]
    local = [r for r in cost["local"] if r["status"] == MEASURED]
    lines = ["# BELJOUR instrument panel", "",
             "Written by `api/scripts/instrument_panel.py`; do not edit by hand (`make instrument-panel`). "
             "Every number comes from an instrument in the repository. **NOT_RUN** means nothing measured it; "
             "**NOT_SET** means its price is unset; **STALE** means the engine changed after it was measured. "
             "Prices are ASSUMED.", "",
             "## At a glance", ""]
    lines += table(["Area", "Status", "Evidence"], [
        ["Hero quality gates", ", ".join(f"{h['name']}: {h['status']}" for h in heroes), "arena results files"],
        ["Per-slice coverage", f"{s['cells']} hero slice cells; at >= {s['minimum_per_slice']} human judgements: "
                               f"{s['cells_at_minimum']}",
         "arena results files"],
        ["Filters, synthetic", f"{wall.get('passes', NOT_RUN)}/{wall.get('evaluated', NOT_RUN)} checks, "
                               f"real faces {wall.get('real_faces_evaluated', NOT_RUN)}", PROOF_WALL.as_posix()],
        ["Licence certificate", f"gate {lic.get('gate', NOT_RUN)}, strict {lic.get('strict', NOT_RUN)}, "
                                f"{lic.get('open_items', NOT_RUN)} open items", CERTIFICATE.as_posix()],
        ["Cost per local edit", f"{len(local)}/{len(cost['local'])} engines measured"
                                + (f"; CPU p50 {cell(min(r['warm_cpu_p50_ms'] for r in local))} to "
                                   f"{cell(max(r['warm_cpu_p50_ms'] for r in local))} ms per edit" if local else ""),
         RUN_PATH.as_posix()],
        ["Cost per provider edit", f"{len(cost['provider'])} actions priced from enforced units x ASSUMED price",
         "youcam/units.py, prices.json"],
    ])
    lines += ["## Instruments: what exists and what it measures today", ""]
    lines += table(["Instrument", "Code", "Measures", "Today"],
                   [[i["instrument"], i["code"], i["measures"], i["today"]] for i in doc["instruments"]])
    lines += ["## Quality gates", ""]
    lines += table(["Feature", "Gate status", "Overall", "Worst slice", "Rule", "Reasons"],
                   [[f"#{h['id']} {h['name']}", h["status"], h["overall"], h["worst_slice"], h["rule"], h["reasons"]]
                    for h in heroes])
    reg = q["registry"]
    lines += table(["Rows", "Count", "Status", "Tested"], [
        ["Features", reg["features"]["rows"], reg["features"]["status"], f"scores {reg['features']['scored']}"],
        ["Filters", reg["filters"]["rows"], reg["filters"]["status"], reg["filters"]["tested"]],
        ["Women-first rows", reg["women"]["rows"], reg["women"]["status"], reg["women"]["tested"]]])
    lines += [f"Feature gate rule: {reg['features']['rule']}.", ""]
    lines += ["## Per-slice coverage", "",
              f"Human judgements per gate slice and hero filter (minimum {s['minimum_per_slice']} per slice).", ""]
    filters = [h["filter"] for h in heroes]
    lines += table(["Slice", *filters], [[r["slice"], *[r["judgements"][f] for f in filters]] for r in s["rows"]])
    if wall.get("status") == MEASURED:
        lines += ["Synthetic tone slices from the Proof Wall (code-drawn portraits, not people):", ""]
        lines += table(["Tone", "Checks", "Passed"], [[t, v["evaluated"], v["passes"]] for t, v in wall["tones"].items()])
        lat = wall["latency"]
        lines += [f"Filter render latency: median warm p50 {cell(lat['warm_p50_ms_median'])} ms, slowest "
                  f"{cell(lat['warm_p50_ms_max'])} ms over {lat['filters_timed']} filters ({lat['scope']}); "
                  f"browser or mobile timing {lat['browser_or_mobile']}.", ""]
    lines += ["## Licence certificate", ""]
    if lic.get("status") == MEASURED:
        lines += [f"Gate **{lic['gate']}**, strict release check **{lic['strict']}**, {lic['open_items']} open items ("
                  + ", ".join(f"{n} {k}" for k, n in lic["by_concern"].items()) + f"). Certificate current: {lic['current']}.",
                  "", *[f"- {item}" for item in lic["items"]], ""]
    else:
        lines += [f"{NOT_RUN}: {lic['reason']}.", ""]
    run = cost["run"]
    lines += ["## Cost per edit", "",
              f"Local engines (Python reference, code-drawn input). Run: {run['status']}"
              + (f", {run['measured_at_utc']}, {run['repeats']} warm samples, Python {run['platform']['python']}, "
                 f"{run['platform']['cpu_count']} CPUs ({run['platform']['os']} {run['platform']['machine']})"
                 + (f"; {run['note']}" if run.get("note") else "") if run["status"] == MEASURED else "")
              + ". Server CAD = warm CPU time x the ASSUMED CPU-hour price; in the browser the edit runs on the "
                "person's device, whose timing is not measured.", ""]
    lines += table(["Edit", "Features", "Status", "Cold ms", "Warm p50 ms", "Warm p95 ms", "CPU p50 ms", "Peak heap KiB",
                    "Pixels", "Server CAD per 1,000 edits", "Browser ms"],
                   [[r["label"], r["features"], r["status"], r["cold_ms"], r["warm_p50_ms"], r["warm_p95_ms"],
                     r["warm_cpu_p50_ms"], r["peak_heap_kib"], r["pixels"], r["server_cad_per_1000_edits"], r["browser_ms"]]
                    for r in cost["local"]])
    caps = cost["caps"]
    lines += [f"Provider edits (YouCam). Units are what the server reserves before a call (a cached result costs 0); "
              f"caps: {caps['session_cap_public']} units per public visit, {caps['session_cap_judge']} with a judge code, "
              f"{caps['daily_unit_cap']} per day, balance floor {caps['balance_floor']}; live spend {caps['live_spend']}.", ""]
    lines += table(["Action", "Feature", "Units/edit", "Unit price", "Payload", "CAD/edit", "Per public visit",
                    "Per judge visit", "Per day", "Server compute"],
                   [[r["action"], r["feature"], r["units_per_edit"], r["unit_price_on_file"], r["payload_shape"],
                     r["cad_per_edit"], r["edits_per_public_session"], r["edits_per_judge_session"], r["edits_per_day"],
                     r["server_compute"]] for r in cost["provider"]])
    lines += [f"Price table ({cost['currency']}, api/plumb_api/metering/prices.json):", ""]
    lines += table(["Price", "CAD", "Basis", "Note"],
                   [[k, NOT_SET if v.get("cad") is None else v["cad"], v["basis"], v.get("note", "")]
                    for k, v in cost["prices"].items()])
    lines += ["## Inputs", "", *[f"- `{rel}` sha256 `{digest[:16]}`" for rel, digest in doc["inputs"].items()],
              *[f"- results `{r['path']}` sha256 `{r['sha256'][:16]}`" for r in doc["results_files"]],
              *[f"- refused `{r['path']}` sha256 `{r['sha256'][:16]}`: {r['reason']}" for r in doc["refused_results_files"]],
              ""]
    return "\n".join(lines)


def render(root: Path, results: Sequence[Path] = ()) -> tuple[dict[str, Any], dict[Path, str]]:
    doc = Panel(root, results).build()
    return doc, {MD_PATH: markdown(doc), JSON_PATH: json.dumps(doc, indent=2, sort_keys=True) + "\n"}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    ap.add_argument("action", nargs="?", choices=("panel", "meter"), default="panel")
    ap.add_argument("--root", type=Path, default=REPO)
    ap.add_argument("--check", action="store_true", help="fail if the written panel is out of date")
    ap.add_argument("--results", type=Path, action="append", default=[], help="arena results file, newest last")
    ap.add_argument("--repeats", type=int, default=meter.DEFAULT_REPEATS)
    ap.add_argument("--note", default="")
    args = ap.parse_args(argv)
    if args.action == "meter":
        record = meter.run(repeats=args.repeats, note=args.note)
        path = args.root / RUN_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(record, indent=2, sort_keys=True) + "\n")
        for row in record["probes"]:
            print(f"{row['status']:9} {row['id']}: " + (f"warm p50 {row['warm_p50_ms']} ms, CPU {row['warm_cpu_p50_ms']} ms, "
                                                      f"heap {row['peak_heap_kib']} KiB" if row["status"] == "measured"
                                                      else row.get("error", "")))
        print(f"wrote {RUN_PATH.as_posix()}; run make instrument-panel to show it")
        return 0 if all(r["status"] == "measured" for r in record["probes"]) else 1
    _, outputs = render(args.root, args.results)
    ok = True
    for rel, text in outputs.items():
        path = args.root / rel
        if args.check:
            if not path.is_file() or path.read_text() != text:
                print(f"STALE {rel.as_posix()} is out of date; run make instrument-panel")
                ok = False
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)
    print("instrument panel: " + ("current" if ok and args.check else "written" if ok else "out of date"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

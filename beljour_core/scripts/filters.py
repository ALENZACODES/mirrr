"""Filter pack tools (filters-plan.md §5.4): goldens, Still Her, distinctness, properties, speed.

  python scripts/filters.py goldens --update     re-render every golden (make goldens-filters); prints what moved
  python scripts/filters.py goldens --check      A2: fail if any golden moved past its tolerance
  python scripts/filters.py still-her [--seeds 1 2]   A4 on the six drawn tones, one line per filter
  python scripts/filters.py distinct             §3.4: the closest pairs in each tab
  python scripts/filters.py properties           A3: strength 0, Q9, determinism, kept areas
  python scripts/filters.py bench [--side 1024]  A6 (Python mirror only; the browser budget is measured in web/)
  python scripts/filters.py list                 the catalogue in strip order
  python scripts/filters.py report [--out F]     the per-filter acceptance sheet (A2-A4, §3.4) as markdown
  python scripts/filters.py cover [--all] [--out F]  synthetic Ivy Cover Test, JSON report
  python scripts/filters.py texture [--ids C08] [--amounts 50 75] [--out F]  local opt-in evidence

Drawn fixtures only; real faces run on the box with `make realface` (never here). Author: John Khan.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from plumb_api.filters import engine, studio_play  # noqa: E402
from plumb_api.filters.qa import (  # noqa: E402
    cover,
    distinct,
    fixtures,
    goldens,
    performance,
    proof_wall,
    report,
    still_her,
    texture_gate,
)
from plumb_api.filters.recipe import registry  # noqa: E402


def cmd_goldens(a: argparse.Namespace) -> int:
    if a.update:
        moved = goldens.write()
        print("\n".join(moved) if moved else "goldens: nothing moved")
        print(f"goldens: {len(goldens.load_manifest().get('goldens', {}))} written to {goldens.FOLDER}")
        return 0
    problems = goldens.check()
    for p in problems:
        print("FAIL ", p)
    print(f"goldens: {len(problems)} problems")
    return 1 if problems else 0


def cmd_still_her(a: argparse.Namespace) -> int:
    faces = fixtures.six_tones(seeds=tuple(a.seeds))
    bad = 0
    inputs = [still_her.prepare_face(p.image, p.face.points, p.masks) for p in faces]
    for recipe in registry.default().ranked():
        begin = time.perf_counter()
        reports = [still_her.measure_image(recipe, p.image, p.face.points, p.masks, p.face.tone,
                   face_centre=fixtures.face_centre(p), inputs=prepared)
                   for p, prepared in zip(faces, inputs, strict=True)]
        elapsed_ms = (time.perf_counter() - begin) * 1000
        problems = still_her.problems(recipe, reports)
        worst = max(reports, key=lambda r: r.lift - r.grey_lift)
        print(f"{recipe['id']:5} {recipe['name']:14} lift {worst.lift:+.2f} (grey {worst.grey_lift:+.2f}) "
              f"chroma {min(r.chroma_ratio for r in reports):.0%} hue {max(r.hue_turn for r in reports):.1f} "
              f"marks {min((r.marks_kept or 1.0) for r in reports):.0%} "
              f"recipe_ms {elapsed_ms:.1f} {'FAIL ' + problems[0] if problems else 'ok'}")
        bad += bool(problems)
    print(f"still her: {bad} filters failing")
    return 1 if bad else 0


def cmd_distinct(a: argparse.Namespace) -> int:
    pairs = sorted(distinct.pairs(), key=lambda p: p.mean_de)
    for p in pairs[:a.top]:
        print(f"{p.tab:11} {p.a:5} {p.b:5} mean ΔE2000 {p.mean_de:.2f}")
    close = [p for p in pairs if p.mean_de < distinct.MIN_DE]
    print(f"distinct: {len(pairs)} pairs, {len(close)} under {distinct.MIN_DE}")
    return 1 if close else 0


def cmd_properties(a: argparse.Namespace) -> int:
    face = fixtures.portrait("medium", width=128, height=152)
    problems: list[str] = []
    for recipe in registry.default().ranked():
        problems += distinct.property_problems(recipe, face) + distinct.kept_area_problems(recipe, face)
    for p in problems:
        print("FAIL ", p)
    print(f"properties: {len(problems)} problems")
    return 1 if problems else 0


def cmd_bench(a: argparse.Namespace) -> int:
    face = fixtures.portrait("medium", width=a.side, height=int(a.side * 1.2), grain=3.0)
    rows = []
    for recipe in registry.default().ranked()[:a.count]:
        engine.CACHE.items.clear()
        start = time.perf_counter()
        engine.render(face.image, recipe, engine.Settings(), face.masks, face_centre=fixtures.face_centre(face))
        cold = time.perf_counter() - start
        start = time.perf_counter()
        engine.render(face.image, recipe, engine.Settings(), face.masks, face_centre=fixtures.face_centre(face))
        rows.append({
            "id": recipe["id"],
            "cold_ms": round(cold * 1000, 1),
            "warm_ms": round((time.perf_counter() - start) * 1000, 1),
        })
    print(json.dumps({"side": a.side, "python_mirror": rows}, indent=1))
    return 0


def cmd_face_speed(a: argparse.Namespace) -> int:
    """Measure cached and uncached A4 rows on drawn fixtures; no real faces."""
    face_set = fixtures.six_tones(seeds=(a.seed,))
    faces = face_set[:a.faces]
    recipes = registry.default().ranked()[:a.count]
    result = performance.compare(faces, recipes, repeats=a.repeats)
    print(json.dumps(result.to_dict(), indent=2, sort_keys=True))
    return 0 if result.passed else 1


def cmd_list(a: argparse.Namespace) -> int:
    for r in registry.default().ranked():
        print(f"{r['rank']:3} {r['id']:5} {r['name']:14} {r['tab']:11} "
              f"like {r['like']['score']} ({r['like']['source']})")
    return 0


def cmd_report(a: argparse.Namespace) -> int:
    rows = report.acceptance(ids=a.ids or None)
    text = report.markdown(rows)
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(text, encoding="utf-8")
        print(f"report: {sum(r.passed for r in rows)} of {len(rows)} pass, written to {a.out}")
    else:
        print(text)
    return 0 if all(r.passed for r in rows) else 1


def cmd_cover(a: argparse.Namespace) -> int:
    """Run synthetic-only editorial gates; never imply a real-face release pass."""
    catalogue = registry.default()
    chosen = catalogue.ranked() if a.all else cover.top_thirty(catalogue)
    results = cover.evaluate_many(chosen)
    payload = cover.summary(results)
    audit = cover.cover_gate(chosen, results)
    payload["complete"] = audit["complete"]
    payload["gateProblems"] = audit["problems"]
    payload["selection"] = "all-built" if a.all else "priority-thirty"
    payload["grades"] = [
        {"id": recipe["id"], "family": recipe["editorial"]["family"],
         "light": recipe["editorial"]["light"]}
        for recipe in chosen
    ]
    serialized = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
    if a.out:
        destination = Path(a.out)
        destination.parent.mkdir(parents=True, exist_ok=True)
        detailed = cover.evidence(results)
        detailed["selection"] = payload["selection"]
        detailed["grades"] = payload["grades"]
        destination.write_text(
            json.dumps(detailed, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    print(serialized)
    complete = (payload["evaluated"] == len(chosen) * len(cover.TONE_NAMES)
                and payload["filters"] == len(chosen)
                and not payload["coverageFailures"])
    return 0 if complete and audit["complete"] and payload["passes"] == payload["evaluated"] else 1



def cmd_proof_wall(a: argparse.Namespace) -> int:
    """Export measured synthetic grades and a separately measured Node timing run."""
    recipes = registry.default().ranked()
    latency = json.loads(Path(a.latency).read_text(encoding="utf-8"))
    rows = cover.evaluate_many(recipes)
    proof = proof_wall.build_proof(recipes, rows, latency)
    paths = proof_wall.publish(Path(a.out_dir), proof)
    print(json.dumps({
        "product": "BELJOUR", "filters": len(proof["grades"]),
        "syntheticCoverChecks": proof["summary"]["evaluated"],
        "syntheticCoverPasses": proof["summary"]["passes"],
        "timedFilters": len(proof["latency"]), "realFacesEvaluated": 0,
        "runtime": proof["latencyRun"]["runtime"],
        "files": [str(path) for path in paths.values()],
    }, indent=2, sort_keys=True))
    return 0

def cmd_studio_play_export(a: argparse.Namespace) -> int:
    """Export a Studio Play pack manifest, licence notes and resolved recipes."""
    pack = a.pack
    errors = studio_play.validate(pack)
    if errors:
        for error in errors:
            print("FAIL ", error)
        return 1
    out_dir = Path(a.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = studio_play.manifest(pack)
    resolved = studio_play.resolve_pack(pack)
    licences = studio_play.licence_rows(pack)
    (out_dir / "BELJOUR_STUDIO_PLAY_MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    (out_dir / "BELJOUR_STUDIO_PLAY_RESOLVED_RECIPES.json").write_text(
        json.dumps(resolved, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    with (out_dir / "BELJOUR_STUDIO_PLAY_LICENCES.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=("lookId", "lookName", "pack", "row", "component", "role", "licence", "note"))
        writer.writeheader()
        writer.writerows(licences)
    print(json.dumps({
        "pack": pack,
        "looks": len(resolved),
        "files": [str(out_dir / name) for name in (
            "BELJOUR_STUDIO_PLAY_MANIFEST.json",
            "BELJOUR_STUDIO_PLAY_RESOLVED_RECIPES.json",
            "BELJOUR_STUDIO_PLAY_LICENCES.csv",
        )],
    }, indent=2, sort_keys=True))
    return 0


def cmd_studio_play_proof(a: argparse.Namespace) -> int:
    """Publish synthetic grades and Node timings for one Studio Play pack."""
    pack = a.pack
    recipes = studio_play.resolve_pack(pack)
    errors = studio_play.validate(pack)
    if errors:
        for error in errors:
            print("FAIL ", error)
        return 1
    latency = json.loads(Path(a.latency).read_text(encoding="utf-8"))
    rows = cover.evaluate_many(recipes)
    proof = proof_wall.build_proof(recipes, rows, latency, required_filters=len(recipes))
    paths = proof_wall.publish(Path(a.out_dir), proof)
    print(json.dumps({
        "product": "BELJOUR",
        "pack": pack,
        "looks": len(proof["grades"]),
        "syntheticCoverChecks": proof["summary"]["evaluated"],
        "syntheticCoverPasses": proof["summary"]["passes"],
        "timedLooks": len(proof["latency"]),
        "realFacesEvaluated": 0,
        "runtime": proof["latencyRun"]["runtime"],
        "files": [str(path) for path in paths.values()],
    }, indent=2, sort_keys=True))
    return 0


def cmd_texture(a: argparse.Namespace) -> int:
    """Six drawn tones only; never promote or infer the real-face release gate."""
    out = texture_gate.evaluate(a.ids, a.amounts)
    summary = out.to_dict()
    if a.out:
        target = Path(a.out)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(out.dumps(), encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k != "results"},
                     sort_keys=True, indent=2))
    return 0 if out.synthetic_passed else 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("goldens")
    mode = g.add_mutually_exclusive_group(required=True)
    mode.add_argument("--update", action="store_true")
    mode.add_argument("--check", action="store_true")
    g.set_defaults(fn=cmd_goldens)
    s = sub.add_parser("still-her")
    s.add_argument("--seeds", type=int, nargs="+", default=[1])
    s.set_defaults(fn=cmd_still_her)
    d = sub.add_parser("distinct")
    d.add_argument("--top", type=int, default=10)
    d.set_defaults(fn=cmd_distinct)
    sub.add_parser("properties").set_defaults(fn=cmd_properties)
    b = sub.add_parser("bench")
    b.add_argument("--side", type=int, default=512)
    b.add_argument("--count", type=int, default=10)
    b.set_defaults(fn=cmd_bench)
    fast = sub.add_parser("face-speed", help="synthetic A4 original-face cache comparator")
    fast.add_argument("--faces", type=int, choices=range(1, 7), default=2)
    fast.add_argument("--count", type=int, choices=range(1, 62), default=4)
    fast.add_argument("--repeats", type=int, choices=range(1, 6), default=1)
    fast.add_argument("--seed", type=int, default=1)
    fast.set_defaults(fn=cmd_face_speed)
    sub.add_parser("list").set_defaults(fn=cmd_list)
    ivy = sub.add_parser("cover", help="six-tone synthetic editorial release gate")
    ivy.add_argument("--all", action="store_true", help="include all built recipes")
    ivy.add_argument("--out", default="", help="optional output JSON report")
    ivy.set_defaults(fn=cmd_cover)
    proof = sub.add_parser("proof-wall", help="publish verified synthetic grades and Node latency")
    proof.add_argument("--latency", required=True, help="measured Node V8 JSON from web/test")
    proof.add_argument("--out-dir", required=True, help="destination for four proof files")
    proof.set_defaults(fn=cmd_proof_wall)
    studio_export = sub.add_parser("studio-play-export", help="export Studio Play manifests and resolved looks")
    studio_export.add_argument("--pack", choices=studio_play.pack_names(), default="lut-class")
    studio_export.add_argument("--out-dir", required=True)
    studio_export.set_defaults(fn=cmd_studio_play_export)
    studio_proof = sub.add_parser("studio-play-proof", help="publish synthetic grades and Node latency for a Studio Play pack")
    studio_proof.add_argument("--pack", choices=studio_play.pack_names(), default="lut-class")
    studio_proof.add_argument("--latency", required=True, help="measured Node V8 JSON from web/test")
    studio_proof.add_argument("--out-dir", required=True, help="destination for four proof files")
    studio_proof.set_defaults(fn=cmd_studio_play_proof)
    textured = sub.add_parser("texture", help="synthetic-only Grain/Structure quality gate")
    textured.add_argument("--ids", nargs="+", default=["C08"])
    textured.add_argument("--amounts", type=float, nargs="+", default=[50.0, 75.0])
    textured.add_argument("--out", default="")
    textured.set_defaults(fn=cmd_texture)
    r = sub.add_parser("report")
    r.add_argument("--out", default="")
    r.add_argument("--ids", nargs="*", default=[])
    r.set_defaults(fn=cmd_report)
    a = ap.parse_args(argv)
    return int(a.fn(a))


if __name__ == "__main__":
    sys.exit(main())

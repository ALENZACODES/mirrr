"""Quality arena command line. Runs on the box, where the test faces are; never in CI.

    python scripts/arena.py freeze                     # build manifest.csv + frozen.lock
    python scripts/arena.py verify                     # hashes still match the lock?
    python scripts/arena.py status                     # fresh faces left, per slice
    python scripts/arena.py draw --round qa1 --purpose regression --n 60 --seed 1
    python scripts/arena.py import-baseline --source ~/reference-app-dump
    python scripts/arena.py generate --slot ours-qa1 --version qa1 --round qa1 --workers 6
    python scripts/arena.py feature-proxy --round qa1 --out features-qa1.json
    python scripts/arena.py make-run --run qa1 --ours ours-qa1 --previous ours-r9 --round qa1
    python scripts/arena.py judge-model --run qa1
    python scripts/arena.py proxy-scores --slot ours-qa1 --round qa1
    python scripts/arena.py results --runs qa1 --ours ours-qa1 --previous ours-r9 --out results-qa1.json
    python scripts/arena.py gate --results results-qa1.json
    python scripts/arena.py regression --previous results-r9.json --current results-qa1.json
    python scripts/arena.py kill-fix --results results-qa1.json --filter old --reason "Too Weak"
    python scripts/arena.py report --results results-qa1.json --features features-qa1.json --html report.html --md report.md
    python scripts/arena.py registry --check --table ../docs/FEATURES.md  # compares only; drop --check to write
    python scripts/arena.py plan-quotas [--judgements 20]  # judgements per pair every gate slice needs
    python scripts/arena.py check-capture --source ~/reference-app-dump  # before import-baseline
    python scripts/arena.py check-session --run gate1   # blinding, order, quotas, exact gate maths
    python scripts/arena.py --faces /tmp/dry dry-run    # SYNTHETIC rehearsal of a whole gate run

A dry-run folder is marked SYNTHETIC: its results are stamped, `gate` exits 3 on them, and
report, regression, kill-fix and registry refuse them (docs/ARENA-RUNBOOK.md).

Faces, slots, runs and results stay under the test-faces folder (outside the repo). Landmarks
come from the real-face bench's MediaPipe runner (tests/realface), an internal test tool that
is not shipped, and are cached per face. Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

API = Path(__file__).resolve().parents[1]
REPO = API.parent
sys.path.insert(0, str(API))

import numpy as np  # noqa: E402

from plumb_api.arena import (  # noqa: E402
    batch,
    dry_run,
    exact,
    feature_bench,
    freeze,
    gates,
    holdout,
    intake,
    judging,
    lock_existing,
    pairs,
    registry,
    report,
    results,
    scorer,
    session_check,
)
from plumb_api.arena import constants as C  # noqa: E402
from plumb_api.arena import slots as S  # noqa: E402


def arena_dir(root: Path) -> Path:
    return root / C.ARENA_DIR


WORKING_SIDE = 768  # arena working size, longest side (ASSUMED close to the app's export preview)


def working_image(path: Path) -> np.ndarray:
    """A frozen face or slot image at the arena's working size."""
    from PIL import Image
    image = S.load_image(path)
    scale = WORKING_SIDE / max(image.shape[:2])
    if scale >= 1:
        return image
    size = (round(image.shape[1] * scale), round(image.shape[0] * scale))
    return np.array(Image.fromarray(image).resize(size, Image.Resampling.LANCZOS), dtype=np.uint8)


def landmarks_for(root: Path, face_id: str, image: np.ndarray, detector: Any) -> np.ndarray | None:
    """478-point landmarks in pixels of `image`, or None if no face was found. The cache keeps
    normalised 0..1 coordinates, so it serves any working size."""
    cache = arena_dir(root) / "landmarks" / f"{face_id}.npy"
    h, w = image.shape[:2]
    if cache.is_file():
        data = np.load(cache)
        return None if data.size == 0 else data * np.array([w, h])
    if detector is None:
        return None
    found, _ = detector.landmarks(image)
    cache.parent.mkdir(parents=True, exist_ok=True)
    if not found:
        np.save(cache, np.zeros((0, 2)))
        return None
    norm = np.asarray(found[0], dtype=np.float64)[:, :2]
    np.save(cache, norm)
    return norm * np.array([w, h])


def make_detector(root: Path) -> Any:
    sys.path.insert(0, str(REPO / "tests" / "realface"))
    try:
        import realface_lib  # type: ignore[import-not-found]
        return realface_lib.Detectors(root / "_models")
    except Exception as exc:  # noqa: BLE001 - report and continue with cached landmarks only
        print(f"arena: no landmark detector ({type(exc).__name__}: {exc}); using cached landmarks only")
        return None


def round_faces(root: Path, round_id: str) -> list[str]:
    ledger = holdout.Ledger(root)
    ids = [fid for fid in ledger.order if any(u["round"] == round_id for u in ledger.uses(fid))]
    if not ids:
        raise SystemExit(f"arena: round {round_id} drew no faces")
    return ids


def cmd_freeze(a: argparse.Namespace) -> int:
    if a.fairface_pool:
        pool = freeze.pool_candidates(Path(a.fairface_labels), Path(a.fairface_pool))
        copied = freeze.fill_from_pool(a.faces, pool, seed=a.seed)
        print(f"arena: copied {sum(copied.values())} pool faces into {len(copied)} short cells")
    lock = freeze.freeze(a.faces, seed=a.seed, new_version=a.new_version)
    print(freeze.summary(lock))
    return 0


def cmd_lock_existing(a: argparse.Namespace) -> int:
    """Seal a pre-existing source-managed frozen set without touching images."""
    folder = a.faces / a.set
    lock = lock_existing.lock_existing(folder)
    print(f"arena: sealed {a.set}, {lock['total']} hashed images; frozen.lock created once")
    return 0


def cmd_verify(a: argparse.Namespace) -> int:
    problems = freeze.verify(a.faces)
    for p in problems[:50]:
        print("FAIL", p)
    print(f"verify: {len(problems)} problems")
    return 1 if problems else 0


def cmd_status(a: argparse.Namespace) -> int:
    rem = holdout.Ledger(a.faces).remaining()
    print(json.dumps(rem, indent=1, sort_keys=True))
    return 0


def cmd_draw(a: argparse.Namespace) -> int:
    ledger = holdout.Ledger(a.faces)
    if a.purpose == "gate":
        draw = ledger.gate_faces(a.round)
    elif a.purpose == "tuning":
        draw = ledger.draw_tuning(a.round, a.n, seed=a.seed)
    else:
        draw = ledger.draw_fresh(a.round, a.n, seed=a.seed)
    print(f"arena: {draw.purpose} round {draw.round_id}: {len(draw.face_ids)} faces; {draw.fresh_left} fresh left")
    return 0


def cmd_import(a: argparse.Namespace) -> int:
    rep = S.import_baseline(a.faces, Path(a.source), mapping=Path(a.mapping) if a.mapping else None, overwrite=a.overwrite)
    print(rep.text())
    return 0


def cmd_generate(a: argparse.Namespace) -> int:
    store = S.Slots(a.faces)
    store.create(a.slot, "ours", a.version, "weapons on" if not a.no_weapons else "weapons off")
    detector = make_detector(a.faces)
    filters = a.filters.split(",")
    jobs: list[batch.Job] = []
    skipped = 0
    for fid in round_faces(a.faces, a.round):
        row = store.rows[fid]
        path = store.path(S.ORIGINAL, "old", fid)
        pts = landmarks_for(a.faces, fid, working_image(path), detector)
        if pts is None:
            skipped += 1
            continue
        for filt in filters:
            if store.has(a.slot, filt, fid):
                continue
            if filt == "gender_swap" and row.get("gender", "").lower() not in ("male", "female"):
                continue  # no dataset label: no gender swap (we don't guess anyone's gender)
            jobs.append(batch.Job(str(a.faces), a.slot, fid, filt, dict(row), str(path), pts.tolist(), WORKING_SIDE,
                                  a.seed, not a.no_weapons))
    trace_path = store.dir / a.slot / "trace.jsonl"
    errors = 0
    with trace_path.open("a", encoding="utf-8") as trace:
        def done(row: dict) -> None:
            nonlocal errors
            errors += "error" in row
            trace.write(batch.trace_line(row))
            trace.flush()
        rows = batch.run_jobs(jobs, a.workers, on_done=done)
    print(f"arena: wrote {len(rows) - errors} results to slot {a.slot}; {errors} failed (see trace.jsonl); "
          f"{skipped} faces had no landmarks")
    return 1 if errors else 0


def cmd_feature_proxy(a: argparse.Namespace) -> int:
    store = S.Slots(a.faces)
    faces = []
    for fid in round_faces(a.faces, a.round):
        image = working_image(store.path(S.ORIGINAL, "old", fid))
        pts = landmarks_for(a.faces, fid, image, None)
        if pts is not None:
            faces.append((fid, image, pts))
    wanted = {int(x) for x in a.features.split(",")} if a.features else None
    runners = [r for r in feature_bench.RUNNERS if wanted is None or r.feature in wanted]
    out = feature_bench.bench(faces, store.rows, runners, on_error=lambda msg: print("note:", msg))
    Path(a.out).write_text(json.dumps({"format": "beljour-feature-proxy/1", "round": a.round,
                                       "features": {str(k): v for k, v in out.items()}}, indent=1) + "\n", encoding="utf-8")
    print(f"arena: proxy scores for {len(out)} features on {len(faces)} faces -> {a.out} (automated proxies, not people)")
    return 0


def load_feature_results(path: str | None) -> dict[int, dict]:
    if not path:
        return {}
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("format") != "beljour-feature-proxy/1":
        raise SystemExit(f"arena: {path} is not a feature proxy file")
    return {int(k): v for k, v in data["features"].items()}


def cmd_make_run(a: argparse.Namespace) -> int:
    store = S.Slots(a.faces)
    ledger = holdout.Ledger(a.faces)
    face_ids = list(ledger.gate_faces(a.run).face_ids) if a.gate else round_faces(a.faces, a.round)
    problems = ledger.check_sample(face_ids, "gate" if a.gate else "evaluation")
    if problems:
        raise SystemExit("arena: " + "; ".join(problems[:5]))
    matchups = []
    if S.BASELINE in store.names():
        matchups.append((a.ours, S.BASELINE))
    if a.previous:
        matchups.append((a.ours, a.previous))
    matchups.append((a.ours, S.ORIGINAL))
    run = pairs.plan_run(store, a.run, face_ids, filters=a.filters.split(","), matchups=matchups,
                         judgements_per_pair=a.judgements, judges=a.judges)
    folder = pairs.write_run(store, run)
    print(f"arena: run {a.run}: {len(run.assignments)} assignments for {a.judges} judges in {folder}; "
          f"{len(run.missing)} pairs missing an image" + ("" if S.BASELINE in store.names()
                                                          else "; no baseline slot, so FAIL/UNTESTED vs the reference app"))
    return 0


def cmd_judge_model(a: argparse.Namespace) -> int:
    path = judging.run_model_judge(a.faces, a.run, judging.ProxyJudge(), limit=a.limit)
    print(f"arena: model judgements in {path} (labelled model-judged)")
    return 0


def cmd_proxy(a: argparse.Namespace) -> int:
    store = S.Slots(a.faces)
    out = arena_dir(a.faces) / "results" / f"proxy-{a.slot}-{a.round}.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with out.open("w", encoding="utf-8") as fh:
        for fid in round_faces(a.faces, a.round):
            original = working_image(store.path(S.ORIGINAL, "old", fid))
            pts = landmarks_for(a.faces, fid, original, None)
            for filt in C.FILTERS:
                if not store.has(a.slot, filt, fid):
                    continue
                edited = S.load_image(store.path(a.slot, filt, fid))
                if edited.shape != original.shape:
                    (original_c, edited), _ = S.conform([original, edited])
                    sc = scorer.score_image(original_c, edited, filt)
                else:
                    sc = scorer.score_image(original, edited, filt, points_before=pts)
                fh.write(json.dumps({"slot": a.slot, "filter": filt, "face_id": fid,
                                     "scores": {k: v for k, v in sc.to_json()["scores"].items() if v is not None},
                                     "flags": sc.flags}) + "\n")
                n += 1
    print(f"arena: {n} proxy scores in {out}")
    return 0


def load_results(path: str | Path, *, synthetic_ok: bool = False) -> dict[str, Any]:
    """An arena results file; a SYNTHETIC dry-run file only where the caller allows it."""
    res = results.load(Path(path))
    if res.get("synthetic") and not synthetic_ok:
        raise SystemExit(f"arena: {path} is a SYNTHETIC dry-run results file; it is never reported or compared")
    return res


def cmd_results(a: argparse.Namespace) -> int:
    outcomes, problems = [], []
    for run_id in a.runs.split(","):
        run_dir = arena_dir(a.faces) / "runs" / run_id
        key = pairs.read_key(run_dir)
        records, bad = judging.read_judgements(sorted((run_dir / "judgements").glob("*.jsonl")))
        got, more = judging.unblind(records, key)
        outcomes += got
        problems += bad + more
    proxy = []
    for path in a.proxy or []:
        proxy += [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines() if line.strip()]
    res = results.summarise(outcomes, freeze.read_manifest(a.faces), ours=a.ours, previous=a.previous,
                            runs=a.runs.split(","), proxy=proxy)
    if intake.is_synthetic_root(a.faces):
        res["synthetic"] = {"label": dry_run.LABEL}
    results.write(Path(a.out), res)
    for p in problems[:20]:
        print("note:", p)
    print(f"arena: {len(outcomes)} judgements -> {a.out}")
    return 0


def cmd_gate(a: argparse.Namespace) -> int:
    res = load_results(a.results, synthetic_ok=True)
    prefix = "SYNTHETIC " if res.get("synthetic") else ""
    worst = 0
    for filt in C.FILTERS:
        v = gates.hero_gate(res, filt)
        print(f"{prefix}{C.FILTER_LABELS[filt]}: {v.label}" + (f" ({'; '.join(v.reasons)})" if v.reasons else ""))
        worst = max(worst, 0 if v.status == gates.PASS else 1)
    if prefix:
        print(f"gate: {dry_run.LABEL}")
        return 3
    return worst


def cmd_regression(a: argparse.Namespace) -> int:
    cur = load_results(a.current)
    decisions = [gates.head_to_head_regression(cur)]
    if a.previous:
        decisions.append(gates.regression_check(load_results(a.previous), cur, tolerance=a.tolerance))
    drops = [d for dec in decisions for d in dec.drops if not d.startswith("no previous")]
    for d in drops:
        print("DROP", d)
    print("regression: " + ("REJECT" if drops else "accept") + f" ({sum(d.checked for d in decisions)} comparisons)")
    return 1 if drops else 0


def cmd_kill_fix(a: argparse.Namespace) -> int:
    res = load_results(a.results)
    view = res["views"]["human"].get(a.filter) or res["views"]["model"].get(a.filter)
    if not view:
        raise SystemExit("arena: no judgements for that filter")
    note = gates.select_fix(view["killlist"]["all"], a.reason, why_not_first=a.why or "")
    print(note)
    return 0


def _rows(a: argparse.Namespace) -> list[registry.Row]:
    feats, _ = registry.load()
    res = [load_results(p) for p in (a.results.split(",") if getattr(a, "results", None) else [])]
    return registry.feature_rows(feats, res, load_feature_results(getattr(a, "features", None)))


def cmd_report(a: argparse.Namespace) -> int:
    res = load_results(a.results) if a.results else None
    rows = _rows(a)
    fresh = None
    try:
        fresh = holdout.Ledger(a.faces).remaining()["fresh"]
    except Exception:  # noqa: BLE001 - the report works without a frozen set
        fresh = None
    for target, render in ((a.md, report.markdown), (a.html, report.html_page)):
        if target:
            Path(target).parent.mkdir(parents=True, exist_ok=True)
            Path(target).write_text(render(res, rows, fresh_left=fresh), encoding="utf-8")
    if not a.md and not a.html:
        print(report.markdown(res, rows, fresh_left=fresh))
    return 0


def cmd_registry(a: argparse.Namespace) -> int:
    feats, infra = registry.load()
    raw = json.loads(registry.REGISTRY_PATH.read_text(encoding="utf-8"))
    from plumb_api.filters.recipe import registry as filter_registry

    problems = registry.validate(feats, raw=raw) + [f"unowned module {m}" for m in registry.unowned_modules(feats, infra)]
    filters = registry.filter_rows()
    problems += registry.validate_filters(filters, filter_registry.load().ranked())
    from plumb_api.arena import women

    w_rows = registry.women_rows()
    problems += women.validate_women(w_rows)
    # features.json keeps the historical W view (women.historical_block); the feature doc shows
    # the reviewed current statuses, built from the same committed source by women.block().
    doc_w_rows = women.block()["rows"]
    problems += [f"reviewed {p}" for p in women.validate_women(doc_w_rows)]
    outputs: list[tuple[str, str]] = []
    if a.table:
        outputs.append((a.table, features_doc(feats, doc_w_rows)))
    if a.json:
        outputs.append((a.json, json.dumps(registry.to_json(_rows(a)), indent=1) + "\n"))
    for path, text in outputs:
        if not a.check:
            continue
        target = Path(path)
        if not target.is_file() or target.read_text(encoding="utf-8") != text:
            flag = "--table" if a.table == path else "--json"
            problems.append(f"{path} is out of date: python api/scripts/arena.py registry {flag} {path}")
    for p in problems:
        print("FAIL", p)
    if not a.check:
        for path, text in outputs:
            Path(path).write_text(text, encoding="utf-8")
    print(f"registry: {len(feats)} features, {len(filters)} filters (Not tested), {len(w_rows)} W rows, "
          f"{len(problems)} problems{', checked, nothing written' if a.check else ''}")
    return 1 if (a.check and problems) else 0


def features_doc(feats: Sequence[registry.Feature], w_rows: Sequence[Mapping[str, Any]]) -> str:
    """docs/FEATURES.md: the mapping table, then W1-W100 with the reviewed current statuses."""
    from plumb_api.arena import women

    return (registry.mapping_markdown(feats) + "\n\n## W1-W100 (women-first list)\n\n"
            + women.markdown(w_rows) + "\n")


def sealed_rows(root: Path) -> list[dict[str, str]]:
    rows = [r for r in freeze.read_manifest(root) if r.get("baseline") == "1"]
    if not rows:
        raise SystemExit("arena: the frozen set has no sealed baseline block")
    return rows


def cmd_plan_quotas(a: argparse.Namespace) -> int:
    plan = exact.plan_quotas(sealed_rows(a.faces), filters=a.filters.split(","), judgements_per_pair=a.judgements)
    for filt, row in plan["filters"].items():
        print(f"{C.FILTER_LABELS[filt]}: {row['faces']} sealed faces, {row['judgements_per_pair_needed']} judgements per "
              f"pair needed (smallest slice {row['smallest_slice'][0]}, {row['smallest_slice'][1]} faces); with "
              f"{row['judgements_per_pair']}: {row['judgements']} judgements, {len(row['slices_short'])} slices short")
    print(f"plan: at least {plan['judges_needed']} judges, {plan['total_judgements']} judgements against the reference app")
    return 1 if any(r["slices_short"] for r in plan["filters"].values()) else 0


def cmd_check_capture(a: argparse.Namespace) -> int:
    rep = intake.check_capture(a.faces, Path(a.source), a.filters.split(","))
    print(json.dumps(rep.to_json(), indent=1) if a.json else rep.text())
    return 0 if rep.status == intake.READY else 1


def cmd_check_session(a: argparse.Namespace) -> int:
    rep = session_check.check_run(a.faces, a.run)
    print(json.dumps(rep, indent=1, sort_keys=True) if a.json else session_check.text(rep))
    clean = all(rep[k]["status"] in ("OK", "MET") for k in ("blinding", "order", "quotas"))
    return 0 if clean else 1


def cmd_dry_run(a: argparse.Namespace) -> int:
    """Every step of a gate run, through this command line, on a fresh SYNTHETIC folder."""
    root: Path = a.faces
    f = ["--faces", str(root)]
    steps: list[tuple[str, int, int]] = []

    def step(name: str, expected: int, *args: str) -> None:
        print(f"--- dry run: {name}")
        steps.append((name, expected, main([*f, *args])))

    points = dry_run.build_faces(root, per_cell=a.per_cell, sfhq=a.sfhq, adversarial=a.adversarial)
    step("freeze", 0, "freeze")
    print(f"dry run: cached landmarks for {dry_run.cache_landmarks(root, points)} drawn faces")
    step("draw the sealed block", 0, "draw", "--round", "dry-faces", "--purpose", "gate")
    step("plan quotas", 0 if a.judgements >= C.MIN_SLICE_JUDGEMENTS else 1, "plan-quotas", "--filters", a.filters,
         "--judgements", str(a.judgements))
    step("generate ours", 0, "generate", "--slot", "ours-dry", "--version", "dry", "--round", "dry-faces",
         "--filters", a.filters, *(["--no-weapons"] if a.quick else []), "--workers", str(a.workers))
    capture = root / "capture-synthetic"
    print(f"dry run: wrote {dry_run.write_capture(root, capture, a.filters.split(','))} stand-in reference outputs")
    step("check capture", 0, "check-capture", "--source", str(capture), "--filters", a.filters)
    step("import baseline", 0, "import-baseline", "--source", str(capture))
    step("make the blind gate run", 0, "make-run", "--run", "dry-gate", "--ours", "ours-dry", "--gate", "--filters",
         a.filters, "--judgements", str(a.judgements), "--judges", str(max(a.judgements, 2)))
    print(f"dry run: {dry_run.judge_run(root, 'dry-gate')} scripted judgements")
    step("check session", 0 if a.judgements >= C.MIN_SLICE_JUDGEMENTS else 1, "check-session", "--run", "dry-gate")
    out = root / C.ARENA_DIR / "results" / "results-dry-gate.json"
    step("results", 0, "results", "--runs", "dry-gate", "--ours", "ours-dry", "--out", str(out))
    step("gate (SYNTHETIC, exits 3)", 3, "gate", "--results", str(out))
    bad = [(n, e, got) for n, e, got in steps if e != got]
    for name, expected, got in steps:
        print(f"{'ok ' if expected == got else 'BAD'} {name}: exit {got} (expected {expected})")
    print(f"dry run: {dry_run.LABEL}. Results file: {out}")
    return 1 if bad else 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="BELJOUR quality arena")
    ap.add_argument("--faces", type=Path, default=C.DEFAULT_FACES)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def command(name: str, fn: Any, *options: tuple[tuple[str, ...], dict[str, Any]]) -> None:
        parser = sub.add_parser(name)
        for flags, kwargs in options:
            parser.add_argument(*flags, **kwargs)
        parser.set_defaults(fn=fn)

    def opt(*flags: str, **kwargs: Any) -> tuple[tuple[str, ...], dict[str, Any]]:
        return flags, kwargs

    filters = opt("--filters", default=",".join(C.FILTERS))
    command("freeze", cmd_freeze, opt("--seed", type=int, default=20261023), opt("--new-version", action="store_true"),
            opt("--fairface-pool"), opt("--fairface-labels"))
    command("lock-existing", cmd_lock_existing,
            opt("--set", choices=("frozen-1000", "frozen-10000", "frozen-100000"), required=True))
    command("verify", cmd_verify)
    command("status", cmd_status)
    command("draw", cmd_draw, opt("--round", required=True), opt("--purpose", choices=holdout.PURPOSES, default="regression"),
            opt("--n", type=int, default=60), opt("--seed", type=int, default=1))
    command("import-baseline", cmd_import, opt("--source", required=True), opt("--mapping"), opt("--overwrite", action="store_true"))
    command("generate", cmd_generate, opt("--slot", required=True), opt("--version", required=True), opt("--round", required=True),
            filters, opt("--seed", type=int, default=11), opt("--no-weapons", action="store_true"),
            opt("--workers", type=int, default=1))
    command("feature-proxy", cmd_feature_proxy, opt("--round", required=True), opt("--out", required=True),
            opt("--features", help="comma list of feature ids; default every built local feature with a runner"))
    command("make-run", cmd_make_run, opt("--run", required=True), opt("--ours", required=True), opt("--previous"), opt("--round"),
            opt("--gate", action="store_true"), filters, opt("--judgements", type=int, default=3), opt("--judges", type=int, default=5))
    command("judge-model", cmd_judge_model, opt("--run", required=True), opt("--limit", type=int))
    command("proxy-scores", cmd_proxy, opt("--slot", required=True), opt("--round", required=True))
    command("results", cmd_results, opt("--runs", required=True), opt("--ours", required=True), opt("--previous"),
            opt("--proxy", nargs="*"), opt("--out", required=True))
    command("gate", cmd_gate, opt("--results", required=True))
    command("regression", cmd_regression, opt("--current", required=True), opt("--previous"), opt("--tolerance", type=float, default=0.0))
    command("kill-fix", cmd_kill_fix, opt("--results", required=True), opt("--filter", required=True), opt("--reason", required=True),
            opt("--why"))
    command("report", cmd_report, opt("--results"), opt("--features"), opt("--md"), opt("--html"))
    command("plan-quotas", cmd_plan_quotas, filters, opt("--judgements", type=int))
    command("check-capture", cmd_check_capture, opt("--source", required=True), filters, opt("--json", action="store_true"))
    command("check-session", cmd_check_session, opt("--run", required=True), opt("--json", action="store_true"))
    command("dry-run", cmd_dry_run, filters, opt("--judgements", type=int, default=3), opt("--per-cell", type=int, default=1),
            opt("--sfhq", type=int, default=20), opt("--adversarial", type=int, default=10),
            opt("--quick", action="store_true", help="generate without the quality weapons"),
            opt("--workers", type=int, default=1))
    command("registry", cmd_registry, opt("--check", action="store_true"), opt("--table"), opt("--json"), opt("--results"),
            opt("--features"))
    args = ap.parse_args(argv)
    try:
        return int(args.fn(args))
    except (freeze.FreezeError, holdout.HoldoutError, S.SlotError, pairs.PairError, gates.KillListError) as exc:
        print(f"arena: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

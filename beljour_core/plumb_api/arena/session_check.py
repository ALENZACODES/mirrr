"""Judge-session check: is an arena run blind, randomised and big enough, and what do its
judgements say under the exact gate maths?

Reads one run folder (test-faces/_arena/runs/<run>/: run.json, the sealed key.json, the judge
bundles and judgements/*.jsonl) with the frozen manifest, and reports

  blinding   every bundle passes pairs.bundle_leaks (no slot name, no face ID, random file
             names) and its PNGs carry no text chunks; tells the pairing corrected are counted.
  order      each bundle's order is not the key's order or grouped by face; each slot is shown
             on side A about half the time (exact binomial test, flagged under P_FLAG); no judge
             holds the same pair twice, and every pair is spread over different judges.
  quotas     planned human judgements per gate slice for ours against the baseline, against the
             20-per-slice minimum (a run that can't reach it can't PASS, however it is judged).
  judgements validation and unblinding problems, human and model counts, judgements per judge.
  gate       per hero filter, the ship-gate rule and exact intervals (arena/exact.py) on the
             human ours-against-baseline judgements. Model judgements never enter this.

A run in a dry-run folder is reported as SYNTHETIC throughout. Author: John Khan.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

from . import constants as C
from . import exact
from .freeze import read_manifest
from .intake import is_synthetic_root
from .judging import read_judgements, unblind
from .pairs import bundle_leaks, read_key
from .results import slices_for
from .slots import BASELINE

P_FLAG = 0.001   # ASSUMED: a side balance this unlikely under a fair coin is reported as biased
ORDER_MIN = 8    # ASSUMED: a shuffled bundle this long is sorted by chance under 1 in 40,000


def run_folder(root: Path, run_id: str) -> Path:
    return root / C.ARENA_DIR / "runs" / run_id


def png_text_chunks(path: Path) -> list[str]:
    from PIL import Image
    with Image.open(path) as im:
        return sorted(str(k) for k, v in im.info.items() if isinstance(v, (str, bytes)) and k != "transparency")


def check_blinding(folder: Path, key: Mapping[str, Mapping[str, Any]], slot_names: Sequence[str]) -> dict[str, Any]:
    problems: list[str] = []
    bundles = sorted(p for p in (folder / "bundles").iterdir() if p.is_dir()) if (folder / "bundles").is_dir() else []
    for bundle in bundles:
        problems += [f"{bundle.name}: {p}" for p in bundle_leaks(bundle, slot_names)]
        for image in sorted((bundle / "images").glob("*.png")):
            chunks = png_text_chunks(image)
            if chunks:
                problems.append(f"{bundle.name}/{image.name} carries {', '.join(chunks)}")
    tells = sum(1 for row in key.values() if row.get("tells"))
    return {"bundles": len(bundles), "problems": problems, "pairs_with_corrected_tells": tells,
            "status": "OK" if bundles and not problems else "NO BUNDLES" if not bundles else "LEAKS"}


def check_order(folder: Path, key: Mapping[str, Mapping[str, Any]]) -> dict[str, Any]:
    problems: list[str] = []
    for path in sorted((folder / "bundles").glob("*/manifest.json")):
        ids = [a["id"] for a in json.loads(path.read_text(encoding="utf-8"))["assignments"]]
        faces = [key[i]["face_id"] for i in ids if i in key]
        if len(ids) >= ORDER_MIN and (ids == sorted(ids) or faces == sorted(faces)):
            problems.append(f"{path.parent.name}: assignments are in key or face order, not shuffled")
    shown: dict[str, list[int]] = defaultdict(list)
    for row in key.values():
        shown[row["a"]].append(1)
        shown[row["b"]].append(0)
    balance = {}
    for slot, sides in sorted(shown.items()):
        p = exact.two_sided_p(sum(sides), len(sides))
        balance[slot] = {"on_a": sum(sides), "shown": len(sides), "p": round(p, 6)}
        if p < P_FLAG:
            problems.append(f"slot {slot} is on side A {sum(sides)} of {len(sides)} times (p = {p:.2g})")
    per_judge: Counter[tuple[int, str]] = Counter((row["judge_slot"], row["pair_id"]) for row in key.values())
    problems += [f"judge {j + 1} holds pair {pid} {n} times" for (j, pid), n in sorted(per_judge.items()) if n > 1]
    return {"problems": problems, "side_balance": balance, "status": "OK" if not problems else "BIASED"}


def ours_and_baseline(run_json: Mapping[str, Any]) -> str | None:
    for a, b in run_json.get("matchups", []):
        if BASELINE in (a, b):
            return b if a == BASELINE else a
    return None


def slice_counts(face_ids: Sequence[str], face_slices: Mapping[str, list[str]]) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for fid in face_ids:
        counts.update(k for k in face_slices.get(fid, ["all"]) if k != "all")
    return dict(sorted(counts.items()))


def check_quotas(key: Mapping[str, Mapping[str, Any]], ours: str | None,
                 face_slices: Mapping[str, list[str]]) -> dict[str, Any]:
    if ours is None:
        return {"status": "NO BASELINE", "filters": {}, "note": "the run has no ours-against-baseline matchup; nothing can PASS"}
    out: dict[str, Any] = {}
    for filt in C.FILTERS:
        planned = [row["face_id"] for row in key.values() if row["filter"] == filt and {row["a"], row["b"]} == {ours, BASELINE}]
        counts = slice_counts(planned, face_slices)
        short = {k: n for k, n in counts.items() if n < C.MIN_SLICE_JUDGEMENTS}
        out[filt] = {"planned": len(planned), "slices": counts, "short": short}
    short_any = any(f["short"] for f in out.values() if f["planned"])
    return {"status": "SHORT" if short_any else "MET", "filters": out, "minimum": C.MIN_SLICE_JUDGEMENTS}


def gate_rows(outcomes: Sequence[Any], ours: str, filt: str, face_slices: Mapping[str, list[str]]) -> dict[str, dict[str, int]]:
    rows: dict[str, dict[str, int]] = defaultdict(lambda: {"wins": 0, "n": 0})
    for o in outcomes:
        if o.kind != "human" or o.filter != filt or {o.winner, o.loser} != {ours, BASELINE}:
            continue
        for k in face_slices.get(o.face_id, ["all"]):
            rows[k]["n"] += 1
            rows[k]["wins"] += o.winner == ours
    return dict(rows)


def check_run(root: Path, run_id: str) -> dict[str, Any]:
    folder = run_folder(root, run_id)
    if not (folder / "key.json").is_file():
        raise FileNotFoundError(f"no run {run_id} under {folder.parent}")
    key = read_key(folder)
    run_json = json.loads((folder / "run.json").read_text(encoding="utf-8"))
    face_slices = {r["face_id"]: slices_for(r) for r in read_manifest(root)}
    slot_names = sorted({row[s] for row in key.values() for s in ("a", "b")})
    ours = ours_and_baseline(run_json)
    records, invalid = read_judgements(sorted((folder / "judgements").glob("*.jsonl")))
    outcomes, unblinding = unblind(records, key)
    gate: dict[str, Any] = {}
    for filt in C.FILTERS:
        rows = gate_rows(outcomes, ours, filt, face_slices) if ours else {}
        gate[filt] = exact.gate_maths(rows) if rows else {"rule": "UNTESTED", "note": "no human judgements against the baseline"}
    synthetic = is_synthetic_root(root)
    return {
        "run": run_id, "synthetic": synthetic, "label": "SYNTHETIC dry run, never a result" if synthetic else "real run",
        "ours": ours, "assignments": len(key),
        "blinding": check_blinding(folder, key, slot_names),
        "order": check_order(folder, key),
        "quotas": check_quotas(key, ours, face_slices),
        "judgements": {"valid": len(records), "invalid": invalid, "unblinding": unblinding,
                       "human": sum(o.kind == "human" for o in outcomes), "model": sum(o.kind == "model" for o in outcomes),
                       "per_judge": dict(sorted(Counter(o.judge for o in outcomes).items()))},
        "gate": gate,
    }


def text(report: Mapping[str, Any]) -> str:
    lines = [f"session check: run {report['run']} ({report['label']}), {report['assignments']} assignments"]
    for part in ("blinding", "order", "quotas"):
        block = report[part]
        lines.append(f"{part}: {block['status']}")
        lines += [f"  {p}" for p in block.get("problems", [])[:20]]
        for filt, row in block.get("filters", {}).items():
            if row.get("short"):
                lines.append(f"  {filt}: {len(row['short'])} slices under {block['minimum']} planned judgements: "
                             + ", ".join(f"{k} {n}" for k, n in list(row["short"].items())[:8]))
    j = report["judgements"]
    lines.append(f"judgements: {j['human']} human, {j['model']} model, {len(j['invalid'])} invalid, "
                 f"{len(j['unblinding'])} dropped at unblinding")
    for filt, g in report["gate"].items():
        prefix = "SYNTHETIC " if report["synthetic"] else ""
        if "overall" not in g:
            lines.append(f"gate {filt}: {prefix}{g['rule']} ({g['note']})")
            continue
        o = g["overall"]
        lines.append(f"gate {filt}: {prefix}{g['rule']}; overall {o['wins']}/{o['n']} = {o['rate']} "
                     f"(exact 95% {o['exact_low']}-{o['exact_high']}, against a coin flip: {g['coin_flip']}); "
                     f"slices {g['slice_states']}")
    return "\n".join(lines)

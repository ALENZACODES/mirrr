"""Turn unblinded judgements (and optional proxy scores) into one results file.

Everything is computed twice, once from human judgements and once from model judgements,
and the two are never mixed: a gate reads only the human view, and the report labels the
model view "model-judged" (brief item 3). Per filter and per demographic slice:

* head-to-head win rates (Wilson intervals) for every match-up,
* Elo for every slot (Bradley-Terry fit, face-cluster bootstrap interval, original = 1000),
* the kill-list: share of our losses per loser reason,
* 1-10 scores per dimension (judge scores and automated proxies kept apart),
* Fairness, which is a property of the spread across slices, not of one image.

Author: John Khan.
"""
from __future__ import annotations

import datetime as _dt
import json
from collections import defaultdict
from collections.abc import Iterable, Mapping, Sequence
from pathlib import Path
from typing import Any

from . import constants as C
from . import stats
from .judging import Outcome

RESULTS_FORMAT = "beljour-arena-results/1"
VIEWS = ("human", "model")


def slices_for(row: Mapping[str, str]) -> list[str]:
    """Slice keys a face belongs to: always 'all' and its set, plus its labels."""
    out = ["all", "set:" + row.get("set", "")]
    if row.get("race"):
        out.append("race:" + row["race"])
    if row.get("gender"):
        out.append("gender:" + row["gender"])
    if row.get("age_band"):
        out.append("age:" + row["age_band"])
    for tag in (row.get("tags") or "").split(";"):
        if tag:
            out.append("adv:" + tag)
    return out


def gate_slices(keys: Iterable[str]) -> list[str]:
    """The slices a gate checks: every label value and set, not 'all' and not intersections."""
    return sorted(k for k in keys if k != "all")


def _rate_json(rate: stats.Rate) -> dict[str, Any]:
    return {"wins": rate.wins, "n": rate.n, "rate": rate.rate, "low": round(rate.low, 4), "high": round(rate.high, 4)}


def killlist(outcomes: Sequence[Outcome], ours: str) -> list[dict[str, Any]]:
    """Our losses by reason, most common first; ties broken by the fixed reason order."""
    losses = [o for o in outcomes if o.loser == ours]
    counts = {r: sum(1 for o in losses if o.reason == r) for r in C.REASONS}
    total = len(losses)
    ranked = sorted((r for r in C.REASONS if counts[r]), key=lambda r: (-counts[r], C.REASONS.index(r)))
    return [{"reason": r, "losses": counts[r], "share": round(counts[r] / total, 4)} for r in ranked]


def scores_by_slice(items: Iterable[tuple[str, str, Mapping[str, float]]], face_slices: Mapping[str, list[str]]
                     ) -> dict[str, dict[str, dict[str, dict[str, float]]]]:
    """(slot, face_id, {dim: value}) -> slot -> slice -> dim -> {mean, n}."""
    acc: dict[str, dict[str, dict[str, list[float]]]] = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for slot, fid, values in items:
        for key in face_slices.get(fid, ["all"]):
            for dim, value in values.items():
                if value is not None:
                    acc[slot][key][dim].append(float(value))
    return {slot: {key: {dim: {"mean": round(sum(v) / len(v), 3), "n": len(v)} for dim, v in dims.items()}
                   for key, dims in by_slice.items()} for slot, by_slice in acc.items()}


def fairness_from_scores(by_slice: Mapping[str, Mapping[str, Mapping[str, float]]],
                         min_n: int = C.MIN_SLICE_SCORED_IMAGES) -> dict[str, Any] | None:
    """Fairness 1-10 from the widest gap between slice means on any other dimension:
    10 - 2 x gap (a one-point gap scores 8). ASSUMED mapping; None if too few slices."""
    worst_gap, worst_dim = 0.0, ""
    seen = 0
    for dim in C.DIMENSIONS:
        if dim == "fairness":
            continue
        means = [v[dim]["mean"] for k, v in by_slice.items() if k != "all" and dim in v and v[dim]["n"] >= min_n]
        if len(means) >= 2:
            seen += 1
            gap = max(means) - min(means)
            if gap > worst_gap:
                worst_gap, worst_dim = gap, dim
    if not seen:
        return None
    return {"mean": round(max(1.0, 10.0 - 2.0 * worst_gap), 3), "gap": round(worst_gap, 3), "dimension": worst_dim}


def summarise_view(outcomes: Sequence[Outcome], face_slices: Mapping[str, list[str]], *, ours: str,
                   previous: str | None, reps: int, seed: int) -> dict[str, Any]:
    by_filter: dict[str, list[Outcome]] = defaultdict(list)
    for o in outcomes:
        by_filter[o.filter].append(o)
    out: dict[str, Any] = {}
    for filt in C.FILTERS:
        items = by_filter.get(filt, [])
        if not items:
            continue
        slots = sorted({s for o in items for s in (o.winner, o.loser)})
        slice_keys = sorted({k for o in items for k in face_slices.get(o.face_id, ["all"])})
        elo_out: dict[str, Any] = {}
        matchups: dict[str, dict[str, Any]] = defaultdict(dict)
        kills: dict[str, Any] = {}
        for key in slice_keys:
            part = [o for o in items if key in face_slices.get(o.face_id, ["all"])]
            games_by_face: dict[str, list[stats.Game]] = defaultdict(list)
            for o in part:
                games_by_face[o.face_id].append((o.winner, o.loser))
            res = stats.elo_with_ci(games_by_face, reps=reps if key == "all" else max(100, reps // 4), seed=seed)
            elo_out[key] = {s: {"rating": round(res.rating[s], 1), "low": round(res.low[s], 1),
                                "high": round(res.high[s], 1)} for s in res.rating}
            games = [(o.winner, o.loser) for o in part]
            for other in slots:
                if other != ours:
                    rate = stats.head_to_head(games, ours, other)
                    if rate.n:
                        matchups[f"{ours}|{other}"][key] = _rate_json(rate)
            kills[key] = killlist(part, ours)
        judge_scores = scores_by_slice(((slot, o.face_id, vals) for o in items for slot, vals in o.scores.items()),
                                        face_slices)
        for by_slice in judge_scores.values():
            fair = fairness_from_scores(by_slice)
            if fair:
                by_slice.setdefault("all", {})["fairness"] = {"mean": fair["mean"], "n": 0, "gap": fair["gap"],
                                                              "dimension": fair["dimension"]}
        out[filt] = {"slots": slots, "ours": ours, "previous": previous, "judgements": len(items),
                     "faces": len({o.face_id for o in items}), "elo": elo_out, "matchups": dict(matchups),
                     "killlist": kills, "scores": judge_scores}
    return out


def summarise(outcomes: Sequence[Outcome], manifest_rows: Sequence[Mapping[str, str]], *, ours: str,
              previous: str | None = None, baseline: str = "baseline", runs: Sequence[str] = (),
              proxy: Sequence[Mapping[str, Any]] = (), reps: int = 400, seed: int = 7,
              created: str | None = None) -> dict[str, Any]:
    face_slices = {r["face_id"]: slices_for(r) for r in manifest_rows}
    views = {}
    for kind in VIEWS:
        part = [o for o in outcomes if o.kind == kind]
        views[kind] = summarise_view(part, face_slices, ours=ours, previous=previous, reps=reps, seed=seed)
    proxy_scores = scores_by_slice(((p["slot"] + "|" + p["filter"], p["face_id"], p["scores"]) for p in proxy), face_slices)
    proxy_out: dict[str, Any] = defaultdict(dict)
    for key, by_slice in proxy_scores.items():
        slot, filt = key.split("|", 1)
        fair = fairness_from_scores(by_slice)
        if fair:
            by_slice.setdefault("all", {})["fairness"] = {"mean": fair["mean"], "n": 0, "gap": fair["gap"],
                                                          "dimension": fair["dimension"]}
        proxy_out[filt][slot] = by_slice
    humans = sorted({o.judge for o in outcomes if o.kind == "human"})
    models = sorted({o.model for o in outcomes if o.kind == "model"})
    return {
        "format": RESULTS_FORMAT,
        "created": created or _dt.datetime.now(_dt.UTC).isoformat(timespec="seconds"),
        "runs": list(runs), "ours": ours, "previous": previous, "baseline": baseline,
        "baseline_present": any(baseline in (o.winner, o.loser) for o in outcomes if o.kind == "human"),
        "judges": {"human_judgements": sum(1 for o in outcomes if o.kind == "human"), "human_judges": len(humans),
                   "model_judgements": sum(1 for o in outcomes if o.kind == "model"), "models": models},
        "views": views, "proxy_scores": dict(proxy_out),
    }


def write(path: Path, results: Mapping[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(results, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    tmp.replace(path)
    return path


def load(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("format") != RESULTS_FORMAT:
        raise ValueError(f"{path} is not an arena results file")
    return data


def worst_slice_rate(matchup: Mapping[str, Mapping[str, Any]], min_n: int = C.MIN_SLICE_JUDGEMENTS
                     ) -> tuple[str, float] | None:
    """The slice with the lowest win rate among slices with enough judgements."""
    rows = [(k, v["rate"]) for k, v in matchup.items() if k != "all" and v["n"] >= min_n and v["rate"] is not None]
    return min(rows, key=lambda kv: (kv[1], kv[0])) if rows else None

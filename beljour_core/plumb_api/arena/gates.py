"""Ship gates, the regression-reject rule and the kill-list rule, as code.

Hero filters (OLD, YOUNG, GENDER SWAP), master command v2 "SHIP GATE":
  PASS only with human judgements against the reference app baseline, overall win rate >= 55% and
  every slice >= 48%. No baseline -> "FAIL/UNTESTED vs the reference app", never PASS. Only model
  judgements -> UNTESTED. A slice with fewer than MIN_SLICE_JUDGEMENTS human judgements can't
  be confirmed, so the filter can't PASS (it is not called a FAIL either). Still Her is
  tracked per slice for hero filters but is not part of their pass rule (women-first brief).

Every other feature: 8+ average on all six dimensions AND no slice below 7 on any of them.
Missing dimensions mean "Not tested", never a pass.

Regression: any drop in our Elo, on any filter or slice, or in any slice score, rejects the
change automatically (v2). The rule is literal: tolerance 0 by default.

Kill-list: fix only the #1 loser reason; #2 is allowed only with a written reason; anything
outside the top two is refused (v1 "Loop"). Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

from . import constants as C
from .results import worst_slice_rate

PASS, FAIL, UNTESTED = "PASS", "FAIL", "UNTESTED"


@dataclass
class Verdict:
    status: str
    reasons: list[str] = field(default_factory=list)
    overall: float | None = None
    worst_slice: tuple[str, float] | None = None
    judged_by: str = "human"

    @property
    def label(self) -> str:
        if self.status == UNTESTED and any("baseline" in r for r in self.reasons):
            return "FAIL/UNTESTED vs the reference app"
        return self.status


def hero_gate(results: Mapping[str, Any], filter_name: str, *, min_slice_n: int = C.MIN_SLICE_JUDGEMENTS) -> Verdict:
    """Gate one hero filter on the human view of an arena results file."""
    ours = results.get("ours")
    baseline = results.get("baseline", "baseline")
    human = results.get("views", {}).get("human", {}).get(filter_name)
    model = results.get("views", {}).get("model", {}).get(filter_name)
    key = f"{ours}|{baseline}"
    if human is None or key not in human.get("matchups", {}):
        missing_reasons = ["no reference app baseline judged by people for this filter"]
        if model is not None and key in model.get("matchups", {}):
            missing_reasons.append("model judgements exist but can't pass a gate")
            rate = model["matchups"][key]["all"]["rate"]
            return Verdict(UNTESTED, missing_reasons, rate, worst_slice_rate(model["matchups"][key], min_slice_n), "model")
        return Verdict(UNTESTED, missing_reasons)
    rows = human["matchups"][key]
    overall = rows["all"]["rate"]
    worst = worst_slice_rate(rows, min_slice_n)
    reasons: list[str] = []
    status = PASS
    if overall is None or overall < C.HERO_OVERALL_MIN:
        status = FAIL
        reasons.append(f"overall win {_pct(overall)} < {C.HERO_OVERALL_MIN:.0%}")
    failing = sorted((k, v["rate"]) for k, v in rows.items()
                     if k != "all" and v["n"] >= min_slice_n and v["rate"] is not None and v["rate"] < C.HERO_SLICE_MIN)
    if failing:
        status = FAIL
        reasons.extend(f"slice {k} at {_pct(r)} < {C.HERO_SLICE_MIN:.0%}" for k, r in failing[:6])
    thin = sorted(k for k, v in rows.items() if k != "all" and v["n"] < min_slice_n)
    if thin and status == PASS:
        status = UNTESTED
        reasons.append(f"{len(thin)} slices have under {min_slice_n} judgements: " + ", ".join(thin[:6]))
    return Verdict(status, reasons, overall, worst)


def _pct(value: float | None) -> str:
    return "n/a" if value is None else f"{value:.1%}"


@dataclass
class FeatureScores:
    """Scores for one feature: dimension -> overall mean, and dimension -> slice -> mean."""
    overall: Mapping[str, float | None]
    slices: Mapping[str, Mapping[str, float]]
    source: str  # "human" or "proxy"


def feature_gate(scores: FeatureScores | None, *, average_min: float = C.FEATURE_AVERAGE_MIN,
                 slice_min: float = C.FEATURE_SLICE_MIN) -> Verdict:
    """Non-hero gate: all six dimensions >= 8 on average and no slice under 7."""
    if scores is None:
        return Verdict(UNTESTED, ["no arena results"])
    missing = [d for d in C.DIMENSIONS if scores.overall.get(d) is None]
    if scores.source != "human":
        return Verdict(UNTESTED, ["automated proxies only; a feature passes on people's scores"], judged_by="model")
    reasons: list[str] = []
    status = PASS
    low = [(d, scores.overall[d]) for d in C.DIMENSIONS if scores.overall.get(d) is not None
           and scores.overall[d] < average_min]  # type: ignore[operator]
    if low:
        status = FAIL
        reasons.extend(f"{C.DIMENSION_LABELS[d]} {v:.1f} < {average_min:g}" for d, v in low)
    worst: tuple[str, float] | None = None
    for dim, by_slice in scores.slices.items():
        for key, value in by_slice.items():
            if worst is None or value < worst[1]:
                worst = (f"{key} ({C.DIMENSION_LABELS.get(dim, dim)})", value)
            if value < slice_min:
                status = FAIL
                reasons.append(f"{C.DIMENSION_LABELS.get(dim, dim)} in {key} at {value:.1f} < {slice_min:g}")
    if missing and status == PASS:
        status = UNTESTED
        reasons.append("not scored on: " + ", ".join(C.DIMENSION_LABELS[d] for d in missing))
    return Verdict(status, reasons, None, worst)


@dataclass
class Decision:
    accept: bool
    drops: list[str]
    checked: int


def regression_check(previous: Mapping[str, Any], current: Mapping[str, Any], *, view: str = "human",
                     tolerance: float = 0.0, min_slice_n: int = C.MIN_SLICE_JUDGEMENTS) -> Decision:
    """Reject if our Elo dropped on any filter or slice, or any slice score dropped.

    Elo values are comparable across runs because every run anchors the untouched original at
    1000. Slices with too few judgements in either run are not compared (they can't show a
    drop that isn't noise; they also can't support a PASS)."""
    drops: list[str] = []
    checked = 0
    prev_ours, cur_ours = previous.get("ours"), current.get("ours")
    for filt in C.FILTERS:
        p = previous.get("views", {}).get(view, {}).get(filt)
        c = current.get("views", {}).get(view, {}).get(filt)
        if not p or not c:
            continue
        for key, ratings in c.get("elo", {}).items():
            old = p.get("elo", {}).get(key, {}).get(prev_ours)
            new = ratings.get(cur_ours)
            if old is None or new is None:
                continue
            if key != "all" and (_games(p, key) < min_slice_n or _games(c, key) < min_slice_n):
                continue
            checked += 1
            if new["rating"] < old["rating"] - tolerance:
                drops.append(f"{filt} {key}: Elo {old['rating']:.0f} -> {new['rating']:.0f}")
        for key, dims in c.get("scores", {}).get(cur_ours, {}).items():
            old_dims = p.get("scores", {}).get(prev_ours, {}).get(key, {})
            for dim, value in dims.items():
                if dim in old_dims and value.get("n", 0) and old_dims[dim].get("n", 0):
                    checked += 1
                    if value["mean"] < old_dims[dim]["mean"] - tolerance:
                        drops.append(f"{filt} {key} {dim}: {old_dims[dim]['mean']:.2f} -> {value['mean']:.2f}")
    return Decision(not drops, drops, checked)


def head_to_head_regression(current: Mapping[str, Any], *, view: str = "human",
                            min_slice_n: int = C.MIN_SLICE_JUDGEMENTS) -> Decision:
    """Same-run check when the new version met the previous one on the same fresh faces:
    reject if the new version's Elo is below the previous version's anywhere."""
    ours, prev = current.get("ours"), current.get("previous")
    drops: list[str] = []
    checked = 0
    if not prev:
        return Decision(True, ["no previous version in this run"], 0)
    for filt in C.FILTERS:
        c = current.get("views", {}).get(view, {}).get(filt)
        if not c:
            continue
        for key, ratings in c.get("elo", {}).items():
            if ours not in ratings or prev not in ratings:
                continue
            if key != "all" and _games(c, key) < min_slice_n:
                continue
            checked += 1
            if ratings[ours]["rating"] < ratings[prev]["rating"]:
                drops.append(f"{filt} {key}: new {ratings[ours]['rating']:.0f} < previous {ratings[prev]['rating']:.0f}")
    return Decision(not drops, drops, checked)


def _games(filter_view: Mapping[str, Any], key: str) -> int:
    return max((rows.get(key, {}).get("n", 0) for rows in filter_view.get("matchups", {}).values()), default=0)


class KillListError(ValueError):
    pass


def select_fix(killlist: Sequence[Mapping[str, Any]], reason: str, *, why_not_first: str = "") -> str:
    """Check that `reason` may be worked on now. Returns a note for the round log."""
    if reason not in C.REASONS:
        raise KillListError(f"{reason!r} is not a loser reason")
    if not killlist:
        raise KillListError("no losses recorded yet; run the arena first")
    ranked = [row["reason"] for row in killlist]
    if reason == ranked[0]:
        return f"fixing #1: {reason} ({killlist[0]['share']:.0%} of losses)"
    if len(ranked) > 1 and reason == ranked[1]:
        tied = killlist[0]["share"] == killlist[1]["share"]
        if not (tied or why_not_first.strip()):
            raise KillListError(f"#{2} {reason} needs a written reason why #1 ({ranked[0]}) can't be fixed first")
        return f"fixing #2: {reason}" + (" (tied with #1)" if tied else f" because: {why_not_first.strip()}")
    rank = ranked.index(reason) + 1 if reason in ranked else None
    raise KillListError(f"{reason} is {'#' + str(rank) if rank else 'not on the kill-list'}; only #1 (or #2 with a reason) may be worked on")

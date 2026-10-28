"""The one-page quality report (master command v2, "FINAL DELIVERABLE, ONE PAGE").

Top: per hero filter, blind win % vs the reference app, Elo for both sides with intervals, worst-slice
win %, the #1 remaining failure reason and PASS / FAIL (or FAIL/UNTESTED vs the reference app while no
baseline exists). Bottom: every registered feature marked Built / Passed / Failed / Not started with
their six scores; a feature without arena results shows "-" (Not tested), never a number.
Model-judged numbers and automated proxy scores are marked as such on the page.

Markdown for the repo and chat, HTML sized to print on one page. Author: John Khan.
"""
from __future__ import annotations

import datetime as _dt
import html
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from . import constants as C
from .gates import hero_gate
from .registry import Row, filter_checklist, filter_rows
from .results import worst_slice_rate

SHORT = {"identity": "Id", "realism": "Re", "artifact_free": "Ar", "flattering": "Fl", "fairness": "Fa", "still_her": "SH"}


@dataclass
class HeroLine:
    filter: str
    win: str
    elo: str
    worst: str
    reason: str
    result: str
    extra: list[str]


def _pct(rate: float | None) -> str:
    return "-" if rate is None else f"{rate * 100:.1f}%"


def _elo(cell: Mapping[str, float] | None) -> str:
    if not cell:
        return "-"
    return f"{cell['rating']:.0f} [{cell['low']:.0f}-{cell['high']:.0f}]"


def hero_lines(results: Mapping[str, Any] | None) -> list[HeroLine]:
    lines = []
    for filt in C.FILTERS:
        label = C.FILTER_LABELS[filt]
        if results is None:
            lines.append(HeroLine(label, "UNTESTED", "-", "-", "-", "FAIL/UNTESTED vs the reference app", ["no arena run yet"]))
            continue
        ours, base, prev = results.get("ours"), results.get("baseline", "baseline"), results.get("previous")
        verdict = hero_gate(results, filt)
        view_name = "human" if results.get("views", {}).get("human", {}).get(filt) else "model"
        view = results.get("views", {}).get(view_name, {}).get(filt)
        tag = "" if view_name == "human" else " (model-judged)"
        if view is None:
            lines.append(HeroLine(label, "UNTESTED", "-", "-", "-", verdict.label, ["not in this run"]))
            continue
        vs_base = view.get("matchups", {}).get(f"{ours}|{base}")
        elo_all = view.get("elo", {}).get("all", {})
        if vs_base:
            win = _pct(vs_base["all"]["rate"]) + f" (n={vs_base['all']['n']})" + tag
            worst = worst_slice_rate(vs_base)
            worst_txt = f"{_pct(worst[1])} {worst[0]}" if worst else "too few per slice"
        else:
            win, worst_txt = "UNTESTED (no reference app baseline)", "-"
        elo = f"{_elo(elo_all.get(ours))} / {_elo(elo_all.get(base)) if base in elo_all else '-'}"
        kills = view.get("killlist", {}).get("all", [])
        reason = f"{kills[0]['reason']} ({kills[0]['share'] * 100:.0f}%)" + tag if kills else "-"
        extra = []
        for other, name in ((prev, "previous version"), ("original", "original photo")):
            rows = view.get("matchups", {}).get(f"{ours}|{other}") if other else None
            if rows:
                extra.append(f"vs {name}: {_pct(rows['all']['rate'])} (n={rows['all']['n']}), "
                             f"Elo {_elo(elo_all.get(other))}")
        lines.append(HeroLine(label, win, elo, worst_txt, reason, verdict.label, extra))
    return lines


def _score_cell(row: Row, dim: str) -> str:
    value = row.scores.get(dim)
    if value is None:
        return "-"
    return f"{value:.1f}" + ("*" if row.source != "human" else "")


def judges_line(results: Mapping[str, Any] | None) -> str:
    if results is None:
        return "Judges: none yet."
    j = results.get("judges", {})
    models = ", ".join(j.get("models", [])) or "none"
    return (f"Judges: {j.get('human_judges', 0)} people, {j.get('human_judgements', 0)} judgements; "
            f"model judgements {j.get('model_judgements', 0)} (model-judged: {models}).")


def counts_line(rows: Sequence[Row]) -> str:
    keys = ("Passed", "Failed", "Built", "Blocked", "Not started")
    return " · ".join(f"{k} {sum(1 for r in rows if r.status == k)}" for k in keys)


def markdown(results: Mapping[str, Any] | None, rows: Sequence[Row], *, fresh_left: int | None = None,
             created: str | None = None) -> str:
    when = created or _dt.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M %Z")
    runs = ", ".join(results.get("runs", [])) if results else "none"
    out = [f"# BELJOUR quality report — {when}", "",
           f"Runs: {runs}. {judges_line(results)}" + (f" Fresh faces left: {fresh_left}." if fresh_left is not None else ""),
           "", "## Hero filters, blind arena vs the reference app", "",
           "| Filter | Win % vs the reference app | Elo ours / reference app | Worst-slice win % | #1 failure reason | Result |",
           "|---|---|---|---|---|---|"]
    lines = hero_lines(results)
    for h in lines:
        out.append(f"| {h.filter} | {h.win} | {h.elo} | {h.worst} | {h.reason} | **{h.result}** |")
    extras = [f"{h.filter}: " + "; ".join(h.extra) for h in lines if h.extra]
    if extras:
        out += ["", "Also: " + " · ".join(extras)]
    out += ["", f"Gate: PASS needs people's judgements, >= {C.HERO_OVERALL_MIN:.0%} overall and no slice under "
                f"{C.HERO_SLICE_MIN:.0%} (slices need {C.MIN_SLICE_JUDGEMENTS}+ judgements). No reference app baseline = FAIL/UNTESTED.",
            "", f"## Feature checklist ({len(rows)}): {counts_line(rows)}", "",
            "Scores 1-10: Id Identity, Re Realism, Ar Artifact-Free, Fl Flattering, Fa Fairness, SH Still Her. "
            "\"-\" = Not tested. * = automated proxy, not people. Gate: 8+ average on all six and no slice under 7.", "",
            "| # | Feature | Status | Id | Re | Ar | Fl | Fa | SH |", "|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        cells = " | ".join(_score_cell(r, d) for d in C.DIMENSIONS)
        out.append(f"| {r.feature.id} | {r.feature.name} | {r.status} | {cells} |")
    out += ["", filter_checklist(filter_rows())]
    return "\n".join(out) + "\n"


CSS = """
@page { size: letter; margin: 10mm; }
body { font: 7.4px/1.25 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1B1B35; margin: 0; }
h1 { font: 700 13px Georgia, "Times New Roman", Times, serif; color: #000091; margin: 0 0 2px; }
h2 { font: 700 9.5px Georgia, "Times New Roman", Times, serif; color: #000091; margin: 6px 0 2px; }
.rule { height: 3px; background: linear-gradient(90deg, #000091 0 33.3%, #FFFFFF 33.3% 66.6%, #E1000F 66.6%);
  border-bottom: 1px solid #DCDCE6; margin: 2px 0 4px; }
table { border-collapse: collapse; width: 100%; }
th, td { border-bottom: 1px solid #DCDCE6; padding: 1px 3px; text-align: left; vertical-align: top; }
th { color: #5A5A70; font-weight: 600; }
.hero td { font-size: 8.4px; }
.cols { column-count: 3; column-gap: 8px; font-size: 6.6px; line-height: 1.12; }
.cols td, .cols th { padding: 0 2px; }
.cols td:nth-child(3) { white-space: nowrap; }
.cols table { break-inside: auto; }
.cols tr { break-inside: avoid; }
.small { color: #5A5A70; }
.st-Passed { color: #1F6B3A; font-weight: 700; }
.st-Failed { color: #8E0B1C; font-weight: 700; }
.result { font-weight: 700; }
"""


def html_page(results: Mapping[str, Any] | None, rows: Sequence[Row], *, fresh_left: int | None = None,
              created: str | None = None) -> str:
    e = html.escape
    when = created or _dt.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M %Z")
    runs = ", ".join(results.get("runs", [])) if results else "none"
    hero_rows = "".join(
        f"<tr><td>{e(h.filter)}</td><td>{e(h.win)}</td><td>{e(h.elo)}</td><td>{e(h.worst)}</td><td>{e(h.reason)}</td>"
        f"<td class='result'>{e(h.result)}</td></tr>" for h in hero_lines(results))
    extras = " · ".join(f"{e(h.filter)}: {e('; '.join(h.extra))}" for h in hero_lines(results) if h.extra)
    head = "".join(f"<th>{SHORT[d]}</th>" for d in C.DIMENSIONS)
    feature_rows = "".join(
        f"<tr><td>{r.feature.id}</td><td>{e(r.feature.name)}</td><td class='st-{e(r.status.replace(' ', ''))}'>{e(r.status)}</td>"
        + "".join(f"<td>{e(_score_cell(r, d))}</td>" for d in C.DIMENSIONS) + "</tr>" for r in rows)
    fresh = f" Fresh faces left: {fresh_left}." if fresh_left is not None else ""
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Quality report</title><style>{CSS}</style></head>
<body>
<h1>BELJOUR quality report</h1><div class="rule"></div>
<p class="small">{e(when)} · Runs: {e(runs)}. {e(judges_line(results))}{e(fresh)}</p>
<h2>Hero filters, blind arena vs the reference app</h2>
<table class="hero"><tr><th>Filter</th><th>Win % vs the reference app</th><th>Elo ours / reference app</th><th>Worst-slice win %</th>
<th>#1 failure reason</th><th>Result</th></tr>{hero_rows}</table>
<p class="small">{extras}</p>
<p class="small">PASS needs people's judgements, &ge; {C.HERO_OVERALL_MIN:.0%} overall and no slice under {C.HERO_SLICE_MIN:.0%}
({C.MIN_SLICE_JUDGEMENTS}+ judgements per slice). No reference app baseline = FAIL/UNTESTED.</p>
<h2>Feature checklist ({len(rows)}): {e(counts_line(rows))}</h2>
<p class="small">1-10: Id Identity, Re Realism, Ar Artifact-Free, Fl Flattering, Fa Fairness, SH Still Her. "-" = Not tested.
* = automated proxy, not people. Gate: 8+ average on all six, no slice under 7.</p>
<div class="cols"><table><tr><th>#</th><th>Feature</th><th>Status</th>{head}</tr>{feature_rows}</table></div>
<p class="small">{e(filter_checklist(filter_rows()))}</p>
</body></html>
"""

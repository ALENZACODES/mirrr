"""Per-filter acceptance sheet for a filter round (filters-plan.md §5.4 A2-A4, A8; §3.4).

One row per shipped filter with every automated check this round runs on it:

* A2 golden: worst of its two goldens (mean and max ΔE2000 against the stored PNG)
* A3 properties: strength 0 identical, Q9 monotone, deterministic, kept areas unchanged
* A4 Still Her: pass on the six drawn tones, with the worst skin lift over mid-grey, the lowest
  chroma kept, the largest hue turn and the lowest share of marks kept
* §3.4 makeup rule: the lips-versus-skin ΔE2000 of `still_her.region_aim`
* §3.4 distinctness: the nearest look in the same tab and the mean ΔE2000 between them
* what isn't built yet (pending add-ons and preset parts, with their round)

`markdown` turns the rows into the sheet HANDOFF links to (`python scripts/filters.py report`).
A row passes only when every check passes; the sheet never says more than the checks measured,
and real-face results (A9) stay in their own report. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

from .. import engine
from ..recipe import registry
from . import distinct, fixtures, goldens, still_her


@dataclass
class AcceptanceRow:
    id: str
    name: str
    tab: str
    rank: int
    golden: tuple[float, float] | None
    properties: list[str]
    still_her: list[str]
    worst_lift_over_grey: float
    min_chroma: float
    max_hue_turn: float
    min_marks: float | None
    region_de: float
    nearest: tuple[str, float] | None
    pending: list[str] = field(default_factory=list)

    @property
    def golden_ok(self) -> bool:
        return self.golden is not None and self.golden[0] <= goldens.MEAN_DE and self.golden[1] <= goldens.MAX_DE

    @property
    def distinct_ok(self) -> bool:
        return self.nearest is None or self.nearest[1] >= distinct.MIN_DE

    @property
    def passed(self) -> bool:
        return (self.golden_ok and not self.properties and not self.still_her and self.distinct_ok
                and self.region_de <= still_her.REGION_DE)


def _golden(recipe: Mapping[str, Any]) -> tuple[float, float] | None:
    listed = goldens.load_manifest().get("goldens", {})
    worst: tuple[float, float] | None = None
    for g in goldens.renders(recipe):
        path = goldens.FOLDER / g.name
        if g.name not in listed or not path.exists():
            return None
        mean, peak = goldens.compare(goldens.read_png(path), g.image)
        worst = (mean, peak) if worst is None else (max(worst[0], mean), max(worst[1], peak))
    return worst


def nearest_in_tab(cat: registry.Catalogue) -> dict[str, tuple[str, float]]:
    out: dict[str, tuple[str, float]] = {}
    for p in distinct.pairs(cat):
        for a, b in ((p.a, p.b), (p.b, p.a)):
            if a not in out or p.mean_de < out[a][1]:
                out[a] = (b, p.mean_de)
    return out


def acceptance(cat: registry.Catalogue | None = None, ids: Sequence[str] | None = None,
               with_goldens: bool = True) -> list[AcceptanceRow]:
    c = cat or registry.default()
    faces = fixtures.six_tones()
    face = fixtures.portrait("medium", width=128, height=152)
    near = nearest_in_tab(c)
    rows: list[AcceptanceRow] = []
    inputs = [still_her.prepare_face(p.image, p.face.points, p.masks) for p in faces]
    centres = [prepared.face_centre for prepared in inputs]
    region_input = still_her.prepare_region_aim(fixtures.portrait("medium"))
    for recipe in c.ranked():
        if ids is not None and recipe["id"] not in ids:
            continue
        reports = [still_her.measure_image(recipe, p.image, p.face.points, p.masks, p.face.tone,
                   face_centre=centre, inputs=prepared)
                   for p, prepared, centre in zip(faces, inputs, centres, strict=True)]
        marks = [r.marks_kept for r in reports if r.marks_kept is not None]
        plan = engine.plan(recipe, has_skin=True)
        rows.append(AcceptanceRow(
            recipe["id"], recipe["name"], recipe["tab"], recipe["rank"],
            _golden(recipe) if with_goldens else None,
            distinct.property_problems(recipe, face) + distinct.kept_area_problems(recipe, face),
            still_her.problems(recipe, reports),
            max(r.lift - min(r.grey_lift + still_her.LIFT_OVER_GREY, still_her.LIFT_MAX) for r in reports),
            min(r.chroma_ratio for r in reports), max(r.hue_turn for r in reports), min(marks) if marks else None,
            still_her.region_aim(recipe, prepared=region_input), near.get(recipe["id"]),
            list(plan.pending)))
    return rows


def _fmt_golden(row: AcceptanceRow) -> str:
    if row.golden is None:
        return "missing"
    return f"{'ok' if row.golden_ok else 'FAIL'} {row.golden[0]:.2f}/{row.golden[1]:.2f}"


def markdown(rows: Sequence[AcceptanceRow], *, title: str = "Filter acceptance, FX1") -> str:
    passed = sum(r.passed for r in rows)
    out = [f"# {title}", "",
           f"{passed} of {len(rows)} filters pass every automated check. Drawn fixtures only; thresholds are "
           "ASSUMED and owned by the arena; arena scores are Not tested.", "",
           "| Rank | Filter | Tab | A2 golden mean/max | A3 | A4 Still Her | Lift over limit | Chroma kept | Hue turn | "
           "Marks kept | Lips vs skin | Nearest in tab | Not built yet |",
           "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        near = f"{r.nearest[0]} {r.nearest[1]:.1f}" if r.nearest else "-"
        out.append(f"| {r.rank} | {r.id} {r.name} | {r.tab} | {_fmt_golden(r)} | {'ok' if not r.properties else 'FAIL'} | "
                   f"{'ok' if not r.still_her else 'FAIL'} | {r.worst_lift_over_grey:+.2f} | {r.min_chroma:.0%} | "
                   f"{r.max_hue_turn:.1f} | {'-' if r.min_marks is None else f'{r.min_marks:.0%}'} | {r.region_de:.2f} | "
                   f"{near} | {', '.join(dict.fromkeys(r.pending)) or '-'} |")
    failing = [r for r in rows if not r.passed]
    if failing:
        out += ["", "## Failing", ""]
        for r in failing:
            reasons = r.properties + r.still_her
            if not r.golden_ok:
                reasons.append(f"golden {_fmt_golden(r)}")
            if not r.distinct_ok and r.nearest:
                reasons.append(f"too close to {r.nearest[0]}")
            out.append(f"* {r.id} {r.name}: " + "; ".join(reasons[:4]))
    return "\n".join(out) + "\n"

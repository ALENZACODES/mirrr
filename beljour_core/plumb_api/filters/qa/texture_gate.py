"""Reproducible synthetic-only safety gate for opt-in finishing effects.

This gate applies the existing Still Her face criteria unchanged. It reuses a
prepared input face for every selected recipe, amount and texture effect,
measures the result, and exports only anonymized numeric summaries. It cannot
promote an effect to real-face cleared status: that separate, frozen evidence
requires the box's authorized 100,000-face runner and human Cover Test review.

Inputs are drawn fixtures only. A missing tone, repeated tone, partial set or
non-finite score fails closed instead of being counted as passed coverage.
Created by John Khan.
"""
from __future__ import annotations

import json
import math
from collections import Counter
from collections.abc import Sequence
from dataclasses import asdict, dataclass
from typing import Any

from .. import engine
from ..recipe import registry
from . import fixtures, still_her

TONE_NAMES = ("very_light", "light", "medium", "tan", "dark", "very_dark")
EFFECTS = ("grain", "structure")
DEFAULT_AMOUNTS = (50.0, 75.0)
FORMAT = "beljour-texture-synthetic-gate/1"


@dataclass(frozen=True)
class GateRow:
    recipe: str
    tone: str
    addon: str
    amount: float
    family: str
    light: str
    lift: float
    chroma_kept: float
    hue_degrees: float
    texture_spread: float
    marks_kept: float | None
    problems: tuple[str, ...]

    @property
    def passed(self) -> bool:
        return len(self.problems) == 0


@dataclass(frozen=True)
class GateReport:
    """A numeric report without source pixels or identifying face geometry."""

    rows: tuple[GateRow, ...]
    recipe_ids: tuple[str, ...]
    amounts: tuple[float, ...]
    tones: tuple[str, ...]
    coverage_problems: tuple[str, ...]

    @property
    def expected(self) -> int:
        return len(self.recipe_ids) * len(self.amounts) * len(EFFECTS) * len(TONE_NAMES)

    @property
    def evaluated(self) -> int:
        return len(self.rows)

    @property
    def synthetic_passed(self) -> bool:
        return self.expected > 0 and not validate(self)

    def to_dict(self) -> dict[str, Any]:
        return {
            "format": FORMAT,
            "author": "John Khan",
            "source": "synthetic-only",
            "real_faces": 0,
            "release_gate_passed": False,
            "external_100k_gate": "UNVERIFIED",
            "synthetic_passed": self.synthetic_passed,
            "recipes": list(self.recipe_ids),
            "tones": list(self.tones),
            "effects": list(EFFECTS),
            "amounts": list(self.amounts),
            "expected": self.expected,
            "evaluated": self.evaluated,
            "passed": sum(row.passed for row in self.rows),
            "coverage_problems": list(self.coverage_problems),
            "results": [asdict(row) for row in self.rows],
        }

    def dumps(self) -> str:
        return json.dumps(self.to_dict(), indent=2, sort_keys=True, allow_nan=False) + "\n"


def _check_tones(portraits: Sequence[fixtures.Portrait]) -> list[str]:
    found = [portrait.face.tone for portrait in portraits]
    count = Counter(found)
    errors: list[str] = []
    for name in TONE_NAMES:
        if count[name] != 1:
            errors.append(f"tone {name}: expected exactly one, found {count[name]}")
    for name in sorted(set(found) - set(TONE_NAMES)):
        errors.append(f"unrecognized synthetic tone {name}")
    return errors


def _check_params(ids: Sequence[str], amounts: Sequence[float],
                  cat: registry.Catalogue) -> list[str]:
    errors: list[str] = []
    if not ids:
        errors.append("one or more filter ids are required")
    if len(set(ids)) != len(ids):
        errors.append("duplicate filter id")
    for rid in ids:
        if rid not in cat.ids():
            errors.append(f"unknown filter id {rid}")
    if not amounts:
        errors.append("one or more add-on amounts are required")
    valid_amounts: list[float] = []
    for value in amounts:
        if isinstance(value, bool) or not isinstance(value, int | float):
            errors.append(f"invalid add-on amount {value}")
            continue
        try:
            number = float(value)
        except (ValueError, OverflowError):
            errors.append(f"invalid add-on amount {value}")
            continue
        if not math.isfinite(number) or not 0 < number <= 100:
            errors.append(f"invalid add-on amount {value}")
            continue
        valid_amounts.append(number)
    if len(valid_amounts) == len(amounts) and len(set(valid_amounts)) != len(amounts):
        errors.append("duplicate add-on amount")
    for aid in EFFECTS:
        entry = cat.addons.get(aid)
        if entry is None or not entry.get("built") or not entry.get("manualOnly"):
            errors.append(f"{aid} must be built and opt-in")
    return errors


def validate(report: GateReport) -> list[str]:
    """Reject missing/duplicated cases or numeric evidence, never average away gaps."""
    errors = list(report.coverage_problems)
    if errors:
        return errors
    if Counter(report.tones) != Counter(TONE_NAMES):
        errors.append("tone coverage does not match the six required synthetic tones")
    if not report.recipe_ids or not report.amounts:
        errors.append("recipe and amount selections must be non-empty")
    expected_keys = {
        (rid, tone, aid, amount)
        for rid in report.recipe_ids
        for tone in TONE_NAMES
        for aid in EFFECTS
        for amount in report.amounts
    }
    actual_keys = [(row.recipe, row.tone, row.addon, row.amount) for row in report.rows]
    if len(actual_keys) != len(set(actual_keys)):
        errors.append("duplicate fixture evaluation")
    missing = expected_keys - set(actual_keys)
    extra = set(actual_keys) - expected_keys
    if missing:
        errors.append(f"missing {len(missing)} fixture evaluations")
    if extra:
        errors.append(f"unexpected {len(extra)} fixture evaluations")
    if report.evaluated != report.expected:
        errors.append("fixture count is incomplete")
    for row in report.rows:
        vals = (row.amount, row.lift, row.chroma_kept, row.hue_degrees, row.texture_spread)
        if any(not math.isfinite(v) for v in vals):
            errors.append(f"non-finite metric in {row.recipe} {row.tone} {row.addon}")
        if row.marks_kept is not None and not math.isfinite(row.marks_kept):
            errors.append(f"non-finite mark metric in {row.recipe} {row.tone} {row.addon}")
        if row.problems:
            errors.append(f"failed Still Her rules: {row.recipe} {row.tone} {row.addon}")
    return errors


def evaluate(ids: Sequence[str], amounts: Sequence[float] = DEFAULT_AMOUNTS, *,
             portraits: Sequence[fixtures.Portrait] | None = None,
             catalogue: registry.Catalogue | None = None) -> GateReport:
    """Evaluate only requested recipes, with a single prepared input per face."""
    cat = catalogue or registry.default()
    faces = list(portraits) if portraits is not None else fixtures.six_tones()
    problems = _check_tones(faces) + _check_params(ids, amounts, cat)
    if problems:
        return GateReport((), tuple(ids), tuple(amounts), tuple(p.face.tone for p in faces), tuple(problems))
    prepared = [still_her.prepare_face(p.image, p.face.points, p.masks) for p in faces]
    rows: list[GateRow] = []
    for rid in ids:
        recipe = cat.get(rid)
        for addon in EFFECTS:
            for amount in amounts:
                settings = engine.Settings(addons={addon: float(amount)}, identity_lock=True)
                for face, inputs in zip(faces, prepared, strict=True):
                    measured = still_her.measure_image(
                        recipe, face.image, face.face.points, face.masks, face.face.tone,
                        settings=settings, face_centre=fixtures.face_centre(face), inputs=inputs,
                    )
                    issue = still_her.problems(recipe, (measured,))
                    rows.append(GateRow(
                        recipe=rid,
                        tone=face.face.tone,
                        addon=addon,
                        amount=float(amount),
                        family=str(recipe["editorial"]["family"]),
                        light=str(recipe["editorial"]["light"]),
                        lift=measured.lift,
                        chroma_kept=measured.chroma_ratio,
                        hue_degrees=measured.hue_turn,
                        texture_spread=measured.spread,
                        marks_kept=measured.marks_kept,
                        problems=tuple(issue),
                    ))
    report = GateReport(tuple(rows), tuple(ids), tuple(float(v) for v in amounts),
                        tuple(p.face.tone for p in faces), ())
    extra = validate(report)
    if extra:
        return GateReport(report.rows, report.recipe_ids, report.amounts,
                          report.tones, tuple(extra))
    return report

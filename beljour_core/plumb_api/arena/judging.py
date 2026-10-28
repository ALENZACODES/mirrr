"""Judgements: validation, unblinding, and the pluggable automated judge.

A judgement picks the better side (A or B) and exactly one loser reason from the fixed list,
and may add 1-10 scores per side. Human and model judges use the same record; the `kind`
field is mandatory, and every report says how many judgements came from models
(master command brief, item 3). A model judgement can never make a gate PASS (gates.py).

Judgements are JSON lines: test-faces/_arena/runs/<run>/judgements/*.jsonl.
Author: John Khan.
"""
from __future__ import annotations

import datetime as _dt
import json
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

import numpy as np

from . import constants as C
from .pairs import read_key
from .slots import ORIGINAL, Slots, conform, load_image

JUDGEMENT_FORMAT = "beljour-judgement/1"


class JudgementError(ValueError):
    pass


@dataclass(frozen=True)
class Outcome:
    """One unblinded judgement: which slot won, which lost and why."""
    assignment: str
    pair_id: str
    face_id: str
    filter: str
    winner: str
    loser: str
    reason: str
    judge: str
    kind: str
    model: str
    scores: Mapping[str, Mapping[str, float]]  # slot -> dimension -> 1..10


def validate(record: Mapping[str, Any]) -> dict[str, Any]:
    """Check one judgement record and return it normalised. Raises JudgementError."""
    if record.get("format", JUDGEMENT_FORMAT) != JUDGEMENT_FORMAT:
        raise JudgementError("unknown judgement format")
    out: dict[str, Any] = {"format": JUDGEMENT_FORMAT}
    for key in ("assignment", "judge"):
        value = record.get(key)
        if not isinstance(value, str) or not value.strip():
            raise JudgementError(f"{key} is required")
        out[key] = value.strip()
    kind = record.get("kind")
    if kind not in C.JUDGE_KINDS:
        raise JudgementError("kind must be human or model")
    out["kind"] = kind
    out["model"] = str(record.get("model", "")) if kind == "model" else ""
    if kind == "model" and not out["model"]:
        raise JudgementError("a model judgement names its model")
    if record.get("winner") not in ("A", "B"):
        raise JudgementError("winner must be A or B (no ties)")
    out["winner"] = record["winner"]
    if record.get("reason") not in C.REASONS:
        raise JudgementError("reason must be one of the fixed loser reasons")
    out["reason"] = record["reason"]
    scores: dict[str, dict[str, float]] = {}
    for side, values in (record.get("scores") or {}).items():
        if side not in ("A", "B") or not isinstance(values, Mapping):
            raise JudgementError("scores are keyed by A and B")
        clean = {}
        for dim, value in values.items():
            if dim not in C.DIMENSIONS or dim == "fairness":
                raise JudgementError(f"{dim} can't be scored per image")
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not 1 <= value <= 10:
                raise JudgementError(f"{dim} score must be 1-10")
            clean[dim] = float(value)
        scores[side] = clean
    out["scores"] = scores
    out["at"] = str(record.get("at") or _dt.datetime.now(_dt.UTC).isoformat(timespec="seconds"))
    out["woman_judge"] = bool(record.get("woman_judge", False))
    return out


def read_judgements(paths: Iterable[Path]) -> tuple[list[dict], list[str]]:
    records, problems = [], []
    for path in paths:
        for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            try:
                records.append(validate(json.loads(line)))
            except (json.JSONDecodeError, JudgementError) as exc:
                problems.append(f"{path.name}:{n}: {exc}")
    return records, problems


def unblind(records: Iterable[Mapping[str, Any]], key: Mapping[str, Mapping[str, Any]]) -> tuple[list[Outcome], list[str]]:
    """Join judgements with the sealed key. Drops (and reports) unknown assignments, a judge
    answering the same assignment twice, a judge seeing the same pair twice, and Still Her
    scores that don't meet the women-first rule."""
    outcomes: list[Outcome] = []
    problems: list[str] = []
    seen_assign: set[tuple[str, str]] = set()
    seen_pair: set[tuple[str, str]] = set()
    for rec in records:
        row = key.get(rec["assignment"])
        if row is None:
            problems.append(f"{rec['assignment']}: not in this run")
            continue
        if (rec["judge"], rec["assignment"]) in seen_assign:
            problems.append(f"{rec['judge']} answered {rec['assignment']} twice; first kept")
            continue
        if (rec["judge"], row["pair_id"]) in seen_pair:
            problems.append(f"{rec['judge']} saw pair {row['pair_id']} twice; first kept")
            continue
        seen_assign.add((rec["judge"], rec["assignment"]))
        seen_pair.add((rec["judge"], row["pair_id"]))
        winner = row["a"] if rec["winner"] == "A" else row["b"]
        loser = row["b"] if rec["winner"] == "A" else row["a"]
        scores: dict[str, dict[str, float]] = {}
        for side, values in rec.get("scores", {}).items():
            values = dict(values)
            if "still_her" in values and not (row.get("still_her") and (rec.get("woman_judge") or rec["kind"] == "model")):
                values.pop("still_her")
                problems.append(f"{rec['assignment']}: Still Her score dropped (needs a woman judge on a woman's photo)")
            scores[row["a"] if side == "A" else row["b"]] = values
        outcomes.append(Outcome(rec["assignment"], row["pair_id"], row["face_id"], row["filter"], winner, loser,
                                rec["reason"], rec["judge"], rec["kind"], rec.get("model", ""), scores))
    return outcomes, problems


# --- automated judges --------------------------------------------------------------------

@dataclass(frozen=True)
class Verdict:
    winner: str          # "A" or "B"
    reason: str          # why the other side lost
    scores: Mapping[str, Mapping[str, float]]


class Judge(Protocol):
    """Anything that can look at a reference and two candidates and pick one. Model judges
    must say what they are; reports list them as model-judged."""
    name: str
    kind: str  # always "model" for automated judges

    def judge(self, reference: np.ndarray, a: np.ndarray, b: np.ndarray, filter_name: str) -> Verdict: ...


class ProxyJudge:
    """The built-in automated judge: picks the side with the higher automated proxy score
    (scorer.py) and names the loser's weakest dimension as the reason. It is a sanity check
    and a tie-breaker for Best-of-N, not a stand-in for people; its results are labelled
    'model-judged (proxy-scorer)' everywhere."""
    kind = "model"

    def __init__(self, name: str = "proxy-scorer/1"):
        self.name = name

    def judge(self, reference: np.ndarray, a: np.ndarray, b: np.ndarray, filter_name: str) -> Verdict:
        from . import scorer
        sa = scorer.score_image(reference, a, filter_name)
        sb = scorer.score_image(reference, b, filter_name)
        qa, qb = scorer.judged_quality(sa, filter_name), scorer.judged_quality(sb, filter_name)
        winner, loser_scores = ("A", sb) if qa >= qb else ("B", sa)
        return Verdict(winner, scorer.likely_reason(loser_scores, filter_name),
                       {"A": scorer.as_judge_scores(sa), "B": scorer.as_judge_scores(sb)})


def run_model_judge(root: Path, run_id: str, judge: Judge, *, limit: int | None = None) -> Path:
    """Judge every assignment of a run with an automated judge and write a JSONL file."""
    slots = Slots(root)
    run_dir = root / C.ARENA_DIR / "runs" / run_id
    key = read_key(run_dir)
    out_dir = run_dir / "judgements"
    out_dir.mkdir(parents=True, exist_ok=True)
    safe = "".join(ch if ch.isalnum() else "-" for ch in judge.name)
    path = out_dir / f"model-{safe}.jsonl"
    done: set[str] = set()
    if path.is_file():
        done = {json.loads(line)["assignment"] for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}
    # one judgement per pair: a judge never sees the same pair twice (the people's rule too)
    pairs_done = {key[aid]["pair_id"] for aid in done if aid in key}
    with path.open("a", encoding="utf-8") as fh:
        for n, (aid, row) in enumerate(sorted(key.items())):
            if limit is not None and n >= limit:
                break
            if aid in done or row["pair_id"] in pairs_done:
                continue
            pairs_done.add(row["pair_id"])
            ref = load_image(slots.path(ORIGINAL, row["filter"], row["face_id"]))
            a = load_image(slots.path(row["a"], row["filter"], row["face_id"]))
            b = load_image(slots.path(row["b"], row["filter"], row["face_id"]))
            (ref, a, b), _ = conform([ref, a, b], long_side=512)
            verdict = judge.judge(ref, a, b, row["filter"])
            scores = {side: {d: v for d, v in vals.items() if d != "still_her" or row.get("still_her")}
                      for side, vals in verdict.scores.items()}
            record = validate({"assignment": aid, "judge": judge.name, "kind": "model", "model": judge.name,
                               "winner": verdict.winner, "reason": verdict.reason, "scores": scores})
            fh.write(json.dumps(record, sort_keys=True) + "\n")
    return path

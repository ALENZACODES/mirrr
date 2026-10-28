"""Blind pair generator: same face, same filter, sides randomised, producer hidden.

An arena run is a set of match-ups (for example ours@v2 vs baseline, ours@v2 vs ours@v1,
ours@v2 vs original) over chosen faces and filters. Each pair is judged several times, and
every judgement is a separate *assignment* with its own left/right draw, given to a different
judge. Judges get a bundle folder: the original photo as a reference plus images A and B,
under random file names. The sealed key (key.json, never in a bundle) maps each assignment
back to slots. Run folders live in test-faces/_arena/runs/, outside the repo.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import random
import secrets
from collections.abc import Sequence
from dataclasses import asdict, dataclass, field
from pathlib import Path

from . import constants as C
from .slots import ORIGINAL, Slots, conform, load_image, save_png

RUN_FORMAT = "beljour-arena-run/1"
BUNDLE_FORMAT = "beljour-judge-bundle/1"
KEY_FORMAT = "beljour-arena-key/1"


class PairError(RuntimeError):
    pass


@dataclass(frozen=True)
class Assignment:
    id: str
    pair_id: str
    face_id: str
    filter: str
    a: str          # slot shown as A
    b: str          # slot shown as B
    judge_slot: int
    still_her: bool


@dataclass
class Run:
    run_id: str
    filters: tuple[str, ...]
    matchups: tuple[tuple[str, str], ...]
    judgements_per_pair: int
    judges: int
    secret: str
    assignments: list[Assignment] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)

    def token(self, *parts: str, size: int = 12) -> str:
        msg = "|".join((self.run_id,) + parts).encode()
        return hmac.new(bytes.fromhex(self.secret), msg, hashlib.sha256).hexdigest()[:size]


def still_her_eligible(row: dict[str, str]) -> bool:
    """Still Her is scored by women judges on women's photos (women-first brief). Eligibility
    comes from the dataset's own label; faces with no label are not asked."""
    return row.get("gender", "").lower() == "female"


def plan_run(slots: Slots, run_id: str, face_ids: Sequence[str], *, filters: Sequence[str] = C.FILTERS,
             matchups: Sequence[tuple[str, str]], judgements_per_pair: int = 3, judges: int = 5,
             secret: str | None = None) -> Run:
    """Build pairs and assignments. A pair is skipped (and listed in `missing`) when either
    side has no image for that face and filter, so a run without a baseline still works."""
    if judgements_per_pair < 1 or judges < judgements_per_pair:
        raise PairError("need at least as many judges as judgements per pair, so no judge sees a pair twice")
    for a, b in matchups:
        if a == b:
            raise PairError(f"a match-up needs two different slots, got {a} twice")
        for name in (a, b):
            if name != ORIGINAL:
                slots.info(name)
    bad = [f for f in filters if f not in C.FILTERS]
    if bad:
        raise PairError(f"unknown filters {bad}")
    run = Run(run_id, tuple(filters), tuple(matchups), judgements_per_pair, judges, secret or secrets.token_hex(16))
    rng = random.Random(int(run.token("sides", size=16), 16))
    for fid in face_ids:
        row = slots.rows.get(fid)
        if row is None:
            raise PairError(f"{fid} is not in the frozen set")
        for filt in filters:
            for left, right in matchups:
                if not (slots.has(left, filt, fid) and slots.has(right, filt, fid)):
                    run.missing.append(f"{fid} {filt} {left}-vs-{right}")
                    continue
                pair_id = run.token("pair", fid, filt, left, right)
                first = int(pair_id[:8], 16) % judges
                for k in range(judgements_per_pair):
                    a, b = (left, right) if rng.random() < 0.5 else (right, left)
                    run.assignments.append(Assignment(run.token("assign", pair_id, str(k)), pair_id, fid, filt, a, b,
                                                      (first + k) % judges, still_her_eligible(row)))
    return run


def side_balance(run: Run) -> dict[str, float]:
    """Share of assignments where each slot is shown on the left. Near 0.5 means unbiased."""
    shown: dict[str, list[int]] = {}
    for item in run.assignments:
        shown.setdefault(item.a, []).append(1)
        shown.setdefault(item.b, []).append(0)
    return {slot: sum(v) / len(v) for slot, v in shown.items()}


def write_run(slots: Slots, run: Run, *, long_side: int = 768) -> Path:
    """Write run.json (no producers per image), key.json (sealed) and one bundle per judge."""
    folder = slots.root / C.ARENA_DIR / "runs" / run.run_id
    if (folder / "key.json").exists():
        raise PairError(f"run {run.run_id} exists; runs are write-once")
    folder.mkdir(parents=True, exist_ok=True)
    key_rows: list[dict] = []
    bundles: dict[int, list[dict]] = {j: [] for j in range(run.judges)}
    refs_written: dict[tuple[int, str, str], str] = {}
    for item in run.assignments:
        original = load_image(slots.path(ORIGINAL, item.filter, item.face_id))
        side_a = load_image(slots.path(item.a, item.filter, item.face_id))
        side_b = load_image(slots.path(item.b, item.filter, item.face_id))
        (ref, img_a, img_b), tells = conform([original, side_a, side_b], long_side=long_side)
        images = folder / "bundles" / f"judge-{item.judge_slot + 1:02d}" / "images"
        ref_key = (item.judge_slot, item.face_id, item.filter)
        if ref_key not in refs_written:
            ref_name = run.token("ref", str(item.judge_slot), item.face_id, item.filter, size=16) + ".png"
            save_png(images / ref_name, ref)
            refs_written[ref_key] = ref_name
        a_name = run.token("img", item.id, "A", size=16) + ".png"
        b_name = run.token("img", item.id, "B", size=16) + ".png"
        save_png(images / a_name, img_a)
        save_png(images / b_name, img_b)
        bundles[item.judge_slot].append({"id": item.id, "filter": item.filter, "label": C.FILTER_LABELS[item.filter],
                                         "ref": "images/" + refs_written[ref_key], "a": "images/" + a_name,
                                         "b": "images/" + b_name, "still_her": item.still_her})
        key_rows.append({**asdict(item), "tells": tells})
    for judge, items in bundles.items():
        if not items:
            continue
        random.Random(int(run.token("order", str(judge), size=16), 16)).shuffle(items)
        manifest = {"format": BUNDLE_FORMAT, "run": run.run_id, "bundle": f"judge-{judge + 1:02d}",
                    "reasons": list(C.REASONS), "dimensions": list(C.DIMENSIONS),
                    "question": "Which result is the better version of this filter on this person?",
                    "assignments": items}
        path = folder / "bundles" / f"judge-{judge + 1:02d}" / "manifest.json"
        path.write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8")
    key = {"format": KEY_FORMAT, "run": run.run_id, "secret": run.secret, "assignments": key_rows}
    (folder / "key.json").write_text(json.dumps(key, indent=1) + "\n", encoding="utf-8")
    public = {"format": RUN_FORMAT, "run": run.run_id, "filters": list(run.filters),
              "matchups": [list(m) for m in run.matchups], "judgements_per_pair": run.judgements_per_pair,
              "judges": run.judges, "assignments": len(run.assignments), "missing": run.missing,
              "side_balance": side_balance(run)}
    (folder / "run.json").write_text(json.dumps(public, indent=1) + "\n", encoding="utf-8")
    return folder


def read_key(run_dir: Path) -> dict[str, dict]:
    data = json.loads((run_dir / "key.json").read_text(encoding="utf-8"))
    if data.get("format") != KEY_FORMAT:
        raise PairError("not an arena key")
    return {row["id"]: row for row in data["assignments"]}


def bundle_leaks(bundle_dir: Path, slot_names: Sequence[str]) -> list[str]:
    """Anything in a judge bundle that could reveal a producer: a slot name or face ID in
    the manifest, or a file name that isn't a random token."""
    problems = []
    text = (bundle_dir / "manifest.json").read_text(encoding="utf-8")
    for name in slot_names:
        if name and f'"{name}"' in text or (name and name.startswith("ours") and name in text):
            problems.append(f"manifest mentions slot {name}")
    if "LG0" in text or "LG1" in text:
        problems.append("manifest mentions a face ID")
    for path in (bundle_dir / "images").iterdir():
        if not (len(path.stem) == 16 and all(c in "0123456789abcdef" for c in path.stem)):
            problems.append(f"image name {path.name} is not a random token")
    return problems

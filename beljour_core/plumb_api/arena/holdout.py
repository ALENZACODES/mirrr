"""Holdout scheduler: hands out fresh, never-used faces per round and records every use.

Rules (master command v1, "Loop" and "Regression"; plus the baseline constraint):

* Baseline faces (the first 100 IDs) are sealed. Reference app outputs exist only for them, so they
  are the only faces a vs-reference-app gate can run on. They are never handed out for tuning, and
  any face that was looked at while tuning can never enter a gate or a regression sample.
* A regression or kill-list re-test sample is FRESH: faces never used for anything before.
  Once drawn, a face is spent for fresh sampling.
* Tuning draws spent faces first (already evaluated, so nothing fresh is burned), then fresh.

The ledger is JSON next to the faces (test-faces/_arena/holdout.json, outside the repo) with
an append-only log beside it. Writes are atomic. Author: John Khan.
"""
from __future__ import annotations

import datetime as _dt
import json
import random
from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path

from . import constants as C
from .freeze import read_lock, read_manifest

LEDGER_FORMAT = "beljour-holdout/1"
PURPOSES = ("tuning", "regression", "gate")


class HoldoutError(RuntimeError):
    """The draw would break a holdout rule (sealed face for tuning, too few fresh faces...)."""


@dataclass(frozen=True)
class Draw:
    round_id: str
    purpose: str
    face_ids: tuple[str, ...]
    fresh_left: int


def _utc() -> str:
    return _dt.datetime.now(_dt.UTC).isoformat(timespec="seconds")


class Ledger:
    def __init__(self, root: Path, *, clock: Callable[[], str] = _utc):
        self.root = root
        self.dir = root / C.ARENA_DIR
        self.path = self.dir / "holdout.json"
        self.log_path = self.dir / "holdout.log.jsonl"
        self.clock = clock
        lock = read_lock(root)
        if lock is None:
            raise HoldoutError("no frozen.lock; freeze the set before scheduling")
        self.lock_hash = lock["faces_sha256"]
        rows = read_manifest(root)
        self.meta = {r["face_id"]: r for r in rows}
        self.order = [r["face_id"] for r in rows]
        self.data = self._load()

    # -- storage ---------------------------------------------------------------------------
    def _load(self) -> dict:
        if self.path.is_file():
            data = json.loads(self.path.read_text(encoding="utf-8"))
            if data.get("format") != LEDGER_FORMAT:
                raise HoldoutError("unknown holdout ledger format")
            for fid in self.order:  # a new lock version can add faces; never remove
                data["faces"].setdefault(fid, {"uses": []})
            data["lock_history"] = sorted(set(data.get("lock_history", [])) | {self.lock_hash})
            return data
        return {"format": LEDGER_FORMAT, "lock_history": [self.lock_hash], "faces": {f: {"uses": []} for f in self.order},
                "rounds": []}

    def _save(self, event: dict) -> None:
        self.dir.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(self.data, indent=1, sort_keys=True) + "\n", encoding="utf-8")
        tmp.replace(self.path)
        with self.log_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, sort_keys=True) + "\n")

    # -- state -----------------------------------------------------------------------------
    def sealed(self, fid: str) -> bool:
        return self.meta[fid]["baseline"] == "1"

    def uses(self, fid: str) -> list[dict]:
        return list(self.data["faces"][fid]["uses"])

    def tuned(self, fid: str) -> bool:
        return any(u["purpose"] == "tuning" for u in self.data["faces"][fid]["uses"])

    def fresh(self, fid: str) -> bool:
        return not self.data["faces"][fid]["uses"]

    def fresh_ids(self) -> list[str]:
        return [f for f in self.order if not self.sealed(f) and self.fresh(f)]

    def remaining(self) -> dict[str, int]:
        """Fresh faces left, overall and per slice (for the report and for planning rounds)."""
        out: dict[str, int] = {"fresh": 0}
        for fid in self.fresh_ids():
            out["fresh"] += 1
            key = "slice:" + self.meta[fid]["slice"]
            out[key] = out.get(key, 0) + 1
        out["sealed_baseline"] = sum(1 for f in self.order if self.sealed(f))
        out["tuned"] = sum(1 for f in self.order if self.tuned(f))
        return out

    # -- draws -----------------------------------------------------------------------------
    def _record(self, round_id: str, purpose: str, ids: Sequence[str], note: str = "") -> None:
        at = self.clock()
        for fid in ids:
            self.data["faces"][fid]["uses"].append({"round": round_id, "purpose": purpose, "at": at})
        self.data["rounds"].append({"round": round_id, "purpose": purpose, "n": len(ids), "at": at, "note": note})
        self._save({"round": round_id, "purpose": purpose, "faces": list(ids), "at": at, "note": note,
                    "lock": self.lock_hash})

    def draw_fresh(self, round_id: str, n: int, *, seed: int, purpose: str = "regression",
                   stratify: bool = True) -> Draw:
        """`n` never-used, unsealed faces, spread across slices. Raises if fewer are left."""
        if purpose not in ("regression", "tuning"):
            raise HoldoutError("fresh draws are for regression re-tests or tuning")
        self._check_round(round_id, purpose)
        pool = self.fresh_ids()
        if len(pool) < n:
            raise HoldoutError(f"only {len(pool)} fresh faces left, {n} asked")
        picked = self._stratified(pool, n, seed) if stratify else random.Random(seed).sample(pool, n)
        self._record(round_id, purpose, picked)
        return Draw(round_id, purpose, tuple(picked), len(self.fresh_ids()))

    def draw_tuning(self, round_id: str, n: int, *, seed: int) -> Draw:
        """Faces for looking at while tuning: spent (already evaluated) faces first, then fresh.
        Sealed baseline faces are never given out for tuning."""
        self._check_round(round_id, "tuning")
        spent = [f for f in self.order if not self.sealed(f) and not self.fresh(f)]
        rng = random.Random(seed)
        rng.shuffle(spent)
        picked = spent[:n]
        if len(picked) < n:
            fresh = self.fresh_ids()
            if len(fresh) < n - len(picked):
                raise HoldoutError(f"only {len(spent) + len(fresh)} unsealed faces left for tuning")
            picked += self._stratified(fresh, n - len(picked), seed + 1)
        self._record(round_id, "tuning", picked)
        return Draw(round_id, "tuning", tuple(picked), len(self.fresh_ids()))

    def gate_faces(self, round_id: str) -> Draw:
        """The sealed baseline block, for a vs-reference-app gate run. Faces that were ever used for
        tuning are dropped from the gate (they should not exist; this is a guard)."""
        self._check_round(round_id, "gate")
        ids = [f for f in self.order if self.sealed(f) and not self.tuned(f)]
        self._record(round_id, "gate", ids)
        return Draw(round_id, "gate", tuple(ids), len(self.fresh_ids()))

    def mark_tuning(self, round_id: str, face_ids: Iterable[str]) -> None:
        """Record faces someone looked at while tuning outside a draw. Refuses sealed faces."""
        ids = list(face_ids)
        bad = [f for f in ids if f not in self.meta]
        if bad:
            raise HoldoutError(f"unknown face ids: {', '.join(bad[:5])}")
        sealed = [f for f in ids if self.sealed(f)]
        if sealed:
            raise HoldoutError(f"sealed baseline faces can't be used for tuning: {', '.join(sealed[:5])}")
        self._record(round_id, "tuning", ids, note="marked by hand")

    def check_sample(self, face_ids: Iterable[str], purpose: str) -> list[str]:
        """Problems if these faces were used for a regression or gate sample now."""
        out = []
        for fid in face_ids:
            if fid not in self.meta:
                out.append(f"{fid}: not in the frozen set")
            elif self.tuned(fid):
                out.append(f"{fid}: used for tuning, can't be evaluated")
            elif purpose == "regression" and not self.fresh(fid):
                out.append(f"{fid}: already used, not fresh")
            elif purpose == "regression" and self.sealed(fid):
                out.append(f"{fid}: sealed baseline face")
        return out

    def _check_round(self, round_id: str, purpose: str) -> None:
        if not round_id or any(ch.isspace() for ch in round_id):
            raise HoldoutError("round id must be a non-empty word")
        if any(r["round"] == round_id and r["purpose"] == purpose for r in self.data["rounds"]):
            raise HoldoutError(f"round {round_id} already drew {purpose} faces; use a new round id")

    def _stratified(self, pool: Sequence[str], n: int, seed: int) -> list[str]:
        rng = random.Random(seed)
        groups: dict[str, list[str]] = {}
        for fid in pool:
            groups.setdefault(self.meta[fid]["slice"], []).append(fid)
        keys = sorted(groups)
        rng.shuffle(keys)
        for k in keys:
            rng.shuffle(groups[k])
        out: list[str] = []
        while len(out) < n:
            for k in keys:
                if groups[k] and len(out) < n:
                    out.append(groups[k].pop())
        return out

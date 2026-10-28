"""Pipeline runner: licence -> exact dedup -> quality -> near dedup -> balance -> manifest -> lock.

Each heavy stage writes its kept items, rejects and decision log as JSONL
under work_dir/stages and records their hashes in work_dir/state.json. On
the next run a stage is skipped when its settings, its input and its files
are unchanged, so an interrupted run resumes at the first stage that did not
finish. Publishing (manifest, exported images, lock) always runs and is
idempotent: an unchanged set leaves the existing lock in place, and a changed
set is only re-locked when asked, as a new version that names its parent.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
import shutil
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any

from .config import PipelineConfig
from .hashing import canonical_json, hash_json, sha256_file
from .licence import LicenceFilter
from .lockfile import build_lock, read_lock, write_lock
from .manifest import TOOL_VERSION, ManifestSummary, write_manifest
from .records import ImageRecord
from .stages import (
    NearCheck,
    Reject,
    StageError,
    StageOutput,
    WorkItem,
    balance_stage,
    exact_stage,
    holdout_stage,
    ingest,
    licence_stage,
    near_stage,
    quality_stage,
)

STATE_SCHEMA = "beljour-data-state/1"
WORK_STAGES = ("ingest", "licence", "exact_dedup", "quality", "near_dedup", "holdout",
               "balance")
PUBLISH_STAGES = ("manifest", "lock")
ALL_STAGES = WORK_STAGES + PUBLISH_STAGES


@dataclass
class StageRecord:
    """What happened in one stage of one run."""

    name: str
    status: str
    count_in: int
    count_out: int
    reject_reasons: dict[str, int]
    seconds: float
    stats: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """JSON form for reports."""
        return {"name": self.name, "status": self.status, "count_in": self.count_in,
                "count_out": self.count_out, "rejected": sum(self.reject_reasons.values()),
                "reject_reasons": dict(sorted(self.reject_reasons.items())),
                "seconds": round(self.seconds, 3), "stats": self.stats}


@dataclass
class RunResult:
    """Outcome of a run; paths are None when the run stopped early."""

    set_name: str
    filter_config_sha256: str
    stages: list[StageRecord]
    items: list[WorkItem]
    manifest_path: Path | None = None
    lock_path: Path | None = None
    lock_sha256: str | None = None
    lock_status: str | None = None
    summary: ManifestSummary | None = None


def _write_jsonl(path: Path, rows: Sequence[dict[str, Any]]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".partial")
    with tmp.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(canonical_json(row) + "\n")
    os.replace(tmp, path)
    return sha256_file(path)


def _read_items(path: Path) -> list[WorkItem]:
    with path.open("r", encoding="utf-8") as handle:
        return [WorkItem.from_json(json.loads(line)) for line in handle if line.strip()]


def _reasons(rejects: Sequence[Reject]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for reject in rejects:
        counts[reject.reason] = counts.get(reject.reason, 0) + 1
    return counts


class Pipeline:
    """One configured run with stage-level resume."""

    def __init__(self, config: PipelineConfig, *, fresh: bool = False,
                 from_stage: str | None = None, until: str | None = None,
                 relock: bool = False) -> None:
        for name in (from_stage, until):
            if name is not None and name not in WORK_STAGES:
                raise ValueError(f"unknown stage {name}; stages are {', '.join(WORK_STAGES)}")
        self.config = config
        self.fresh = fresh
        self.from_stage = from_stage
        self.until = until
        self.relock = relock
        self.stage_dir = config.work_dir / "stages"
        self.state_path = config.work_dir / "state.json"
        self.clean_dir = config.work_dir / "clean"
        self.licence_filter: LicenceFilter = config.licence.build()
        self.settings = config.stage_settings(self.licence_filter)
        self.filter_hash = config.filter_config_sha256(self.licence_filter)

    def _paths(self, index: int, name: str) -> tuple[Path, Path, Path]:
        stem = f"{index + 1:02d}-{name}"
        return (self.stage_dir / f"{stem}.jsonl", self.stage_dir / f"{stem}.rejects.jsonl",
                self.stage_dir / f"{stem}.log.jsonl")

    def _load_state(self) -> dict[str, Any]:
        if self.fresh or not self.state_path.is_file():
            return {"schema": STATE_SCHEMA, "stages": {}}
        try:
            state = json.loads(self.state_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {"schema": STATE_SCHEMA, "stages": {}}
        if not isinstance(state, dict) or state.get("schema") != STATE_SCHEMA:
            return {"schema": STATE_SCHEMA, "stages": {}}
        if not isinstance(state.get("stages"), dict):
            state["stages"] = {}
        return state

    def _save_state(self, state: dict[str, Any]) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.state_path.with_name("state.json.partial")
        tmp.write_text(json.dumps(state, indent=1, sort_keys=True) + "\n", encoding="utf-8")
        os.replace(tmp, self.state_path)

    def status(self) -> list[tuple[str, str, int | None]]:
        """(stage, state, kept count) without running anything.

        State is done (would be resumed), stale (settings, input or files
        changed) or pending (never ran or cleared by an earlier change).
        """
        state = self._load_state()
        rows: list[tuple[str, str, int | None]] = []
        input_sha = sha256_file(self.config.intake)
        chain_ok = True
        for index, name in enumerate(WORK_STAGES):
            entry = state["stages"].get(name)
            if not isinstance(entry, dict):
                rows.append((name, "pending", None))
                chain_ok = False
                continue
            ok = chain_ok and self._resumable(entry, index, name, input_sha)
            kept = len(_read_items(self._paths(index, name)[0])) if ok else None
            rows.append((name, "done" if ok else "stale", kept))
            chain_ok = ok
            input_sha = str(entry.get("output_sha256", ""))
        return rows

    def _settings_hash(self, name: str) -> str:
        return hash_json({"stage": name, "tool_version": TOOL_VERSION,
                          "settings": self.settings[name]})

    def _resumable(self, entry: Any, index: int, name: str, input_sha: str) -> bool:
        if not isinstance(entry, dict):
            return False
        if entry.get("settings_sha256") != self._settings_hash(name):
            return False
        if entry.get("input_sha256") != input_sha:
            return False
        kept, rejects, log = self._paths(index, name)
        for path, key in ((kept, "output_sha256"), (rejects, "rejects_sha256"),
                          (log, "log_sha256")):
            if not path.is_file() or sha256_file(path) != entry.get(key):
                return False
        return True

    def _run_stage(self, name: str, items: list[WorkItem]) -> StageOutput:
        config = self.config
        runners: dict[str, Callable[[], StageOutput]] = {
            "ingest": lambda: ingest(config.intake, config.image_root, config.limits,
                                     config.workers),
            "licence": lambda: licence_stage(items, self.licence_filter),
            "exact_dedup": lambda: exact_stage(items),
            "quality": lambda: quality_stage(
                items, config.quality, config.limits,
                self.clean_dir if config.strip_metadata else None, config.workers),
            "near_dedup": lambda: near_stage(items, config.near_dedup),
            "holdout": lambda: holdout_stage(
                items, config.holdout_paths, config.on_leak, config.takedown_hashes(),
                NearCheck(config.near_dedup, config.work_dir / "frozen-prints.jsonl")
                if config.holdout_near else None),
            "balance": lambda: balance_stage(items, config.balance),
        }
        return runners[name]()

    def run(self) -> RunResult:
        """Run (or resume) every stage, then publish unless stopped early."""
        state = self._load_state()
        records: list[StageRecord] = []
        items: list[WorkItem] = []
        input_sha = sha256_file(self.config.intake)
        forced = False
        for index, name in enumerate(WORK_STAGES):
            forced = forced or name == self.from_stage
            kept_path, rejects_path, log_path = self._paths(index, name)
            entry = state["stages"].get(name)
            started = time.perf_counter()
            resumed = None
            if not forced and self._resumable(entry, index, name, input_sha):
                resumed = _read_items(kept_path)
                if not all(Path(item.stored_path).is_file() for item in resumed):
                    # Cleaned images were deleted since this stage ran; rebuild it.
                    resumed = None
            if resumed is not None:
                items_in = len(items)
                items = resumed
                records.append(StageRecord(name, "resumed", int(entry.get("count_in", items_in)),
                                           len(items), dict(entry.get("reject_reasons", {})),
                                           time.perf_counter() - started,
                                           dict(entry.get("stats", {}))))
                input_sha = str(entry["output_sha256"])
            else:
                forced = True
                count_in = len(items)
                output = self._run_stage(name, items)
                items = output.kept
                entry = {
                    "settings_sha256": self._settings_hash(name),
                    "input_sha256": input_sha,
                    "output_sha256": _write_jsonl(kept_path, [i.to_json() for i in items]),
                    "rejects_sha256": _write_jsonl(rejects_path,
                                                   [r.to_json() for r in output.rejects]),
                    "log_sha256": _write_jsonl(log_path, output.log),
                    "count_in": count_in if name != "ingest" else output.stats.get(
                        "intake_rows", 0),
                    "reject_reasons": _reasons(output.rejects),
                    "stats": output.stats,
                }
                state["stages"][name] = entry
                for later in WORK_STAGES[index + 1:]:
                    state["stages"].pop(later, None)
                self._save_state(state)
                input_sha = entry["output_sha256"]
                records.append(StageRecord(name, "ran", int(entry["count_in"]), len(items),
                                           dict(entry["reject_reasons"]),
                                           time.perf_counter() - started, output.stats))
            if name == self.until:
                return RunResult(self.config.set_name, self.filter_hash, records, items)
        return self._publish(items, records)

    def manifest_path(self) -> Path:
        """Final manifest location."""
        suffix = ".manifest.jsonl.gz" if self.config.compress else ".manifest.jsonl"
        return self.config.output_dir / f"{self.config.set_name}{suffix}"

    def lock_path(self) -> Path:
        """Final lock location."""
        return self.config.output_dir / f"{self.config.set_name}.lock"

    def _export_name(self, item: WorkItem) -> str:
        digest = item.record.content_sha256
        suffix = Path(item.stored_path).suffix.lower() or ".img"
        return f"images/{digest[:2]}/{digest}{suffix}"

    def _publish(self, items: list[WorkItem], records: list[StageRecord]) -> RunResult:
        started = time.perf_counter()
        ordered = sorted(items, key=lambda i: i.record.content_sha256)
        final = self.manifest_path()
        draft = final.with_name(final.name + ".next")
        rows = []
        for item in ordered:
            path = self._export_name(item) if self.config.export_images else item.record.path
            record = item.record if path is None else _with_path(item, path)
            notes: dict[str, Any] = {"original_sha256": item.original_sha256,
                                     "quality_score": round(item.score, 4)}
            if item.phash is not None and item.dhash is not None:
                notes["phash"] = item.phash
                notes["dhash"] = item.dhash
            rows.append((record, notes))
        summary = write_manifest(draft, rows, shards=self.config.shards,
                                 compress=self.config.compress)
        records.append(StageRecord("manifest", "ran", len(items), summary.count, {},
                                   time.perf_counter() - started,
                                   {"rows_sha256": summary.rows_sha256,
                                    "shards": summary.shard_count}))
        started = time.perf_counter()
        status, lock = self._decide_lock(summary, final.name, draft)
        try:
            if self.config.export_images:
                self._export(ordered)
        except (OSError, StageError):
            draft.unlink(missing_ok=True)
            raise
        os.replace(draft, final)
        if status != "unchanged":
            write_lock(self.lock_path(), lock, replace=True)
        records.append(StageRecord("lock", status, summary.count, summary.count, {},
                                   time.perf_counter() - started,
                                   {"lock_sha256": lock["lock_sha256"],
                                    "version": lock["version"]}))
        return RunResult(self.config.set_name, self.filter_hash, records, items, final,
                         self.lock_path(), str(lock["lock_sha256"]), status,
                         _final_summary(summary, final))

    def _decide_lock(self, summary: ManifestSummary, manifest_name: str,
                     draft: Path) -> tuple[str, dict[str, Any]]:
        fresh = build_lock(summary, manifest_name, self.filter_hash,
                           set_name=self.config.set_name)
        path = self.lock_path()
        if not path.exists():
            return "created", fresh
        try:
            previous = read_lock(path)
        except ValueError as exc:
            draft.unlink(missing_ok=True)
            raise StageError(f"existing lock {path.name} is invalid; refusing to replace") from exc
        same = (previous["manifest"] == fresh["manifest"]
                and previous["filter_config_sha256"] == self.filter_hash)
        if same:
            return "unchanged", previous
        if not self.relock:
            draft.unlink(missing_ok=True)
            raise StageError(f"{path.name} pins a different set; rerun with --relock to make "
                             "a new version")
        version = int(previous["version"]) + 1
        archive = path.with_name(f"{path.name}.v{previous['version']}")
        shutil.copyfile(path, archive)
        return "relocked", build_lock(summary, manifest_name, self.filter_hash,
                                      set_name=self.config.set_name, version=version,
                                      parent_lock_sha256=str(previous["lock_sha256"]))

    def _export(self, ordered: Sequence[WorkItem]) -> None:
        root = self.config.output_dir
        wanted: set[Path] = set()
        for item in ordered:
            target = root / self._export_name(item)
            wanted.add(target)
            if target.is_file() and sha256_file(target) == item.record.content_sha256:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            tmp = target.with_name(target.name + ".partial")
            shutil.copyfile(item.stored_path, tmp)
            if sha256_file(tmp) != item.record.content_sha256:
                tmp.unlink()
                raise StageError(f"stored image for {item.record.content_sha256[:12]} changed")
            os.replace(tmp, target)
        images = root / "images"
        if images.is_dir():
            for path in sorted(images.rglob("*")):
                if path.is_file() and path not in wanted:
                    path.unlink()


def _with_path(item: WorkItem, path: str) -> ImageRecord:
    return replace(item.record, path=path)


def _final_summary(summary: ManifestSummary, final: Path) -> ManifestSummary:
    return ManifestSummary(summary.count, summary.rows_sha256, summary.shards,
                           summary.shard_count, sha256_file(final), summary.compressed)


def run_pipeline(config: PipelineConfig, **options: Any) -> RunResult:
    """Convenience wrapper: build a Pipeline and run it."""
    return Pipeline(config, **options).run()

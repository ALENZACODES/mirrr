"""Pipeline stages over work items, each returning kept items, rejects and stats.

Order: ingest, licence, exact dedup, quality, near dedup, holdout, balance.
Every stage is a pure function of its input items and settings (the quality
stage also writes cleaned images, keyed by hash), so a stage can be rerun or
skipped on resume without changing the result.
Author: John Khan.
"""

from __future__ import annotations

import json
from collections.abc import Iterator, Mapping, Sequence
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any

from .dedup import HashedItem, NearDupConfig, exact_dedup, near_dedup
from .hashing import is_sha256
from .holdout import HoldoutGuard
from .imaging import DecodeLimits, inspect
from .licence import LicenceFilter
from .near_holdout import NearHoldoutGuard, NearLeak, fingerprint_sets
from .perceptual import from_hex
from .processing import ImageTask, hash_files, run_tasks
from .quality_score import QualityConfig
from .records import ImageRecord, RecordError
from .slices import SliceSpec, balance

MAX_INTAKE_LINE = 64 * 1024
UTF8_BOM = b"\xef\xbb\xbf"


class StageError(RuntimeError):
    """A stage cannot continue (for example a holdout leak in fail mode)."""


@dataclass(frozen=True)
class WorkItem:
    """A record moving through the stages, with what each stage learnt."""

    record: ImageRecord
    original_sha256: str
    stored_path: str
    quality: Mapping[str, Any] | None = None
    phash: str | None = None
    dhash: str | None = None

    @property
    def score(self) -> float:
        """Quality score, 0 before the quality stage."""
        if self.quality is None:
            return 0.0
        return float(self.quality.get("score", 0.0))

    def to_json(self) -> dict[str, Any]:
        """Line form used in stage files."""
        out: dict[str, Any] = {"record": self.record.to_dict(),
                               "original_sha256": self.original_sha256,
                               "stored_path": self.stored_path}
        if self.quality is not None:
            out["quality"] = dict(self.quality)
        if self.phash is not None:
            out["phash"] = self.phash
        if self.dhash is not None:
            out["dhash"] = self.dhash
        return out

    @classmethod
    def from_json(cls, raw: Mapping[str, Any]) -> WorkItem:
        """Inverse of to_json; raises ValueError on bad lines."""
        record = ImageRecord.from_dict(raw["record"])
        original = raw["original_sha256"]
        if not is_sha256(original):
            raise ValueError("work item has a bad original hash")
        return cls(record, original, str(raw["stored_path"]), raw.get("quality"),
                   raw.get("phash"), raw.get("dhash"))


@dataclass(frozen=True)
class Reject:
    """A dropped item and the stage's reason."""

    stage: str
    reason: str
    detail: str
    content_sha256: str
    path: str | None
    related: str | None = None

    def to_json(self) -> dict[str, Any]:
        """Line form used in reject files."""
        out: dict[str, Any] = {"stage": self.stage, "reason": self.reason,
                               "detail": self.detail, "content_sha256": self.content_sha256,
                               "path": self.path}
        if self.related is not None:
            out["related"] = self.related
        return out


@dataclass
class StageOutput:
    """Kept items, rejects, an optional decision log and report stats."""

    kept: list[WorkItem]
    rejects: list[Reject] = field(default_factory=list)
    log: list[dict[str, Any]] = field(default_factory=list)
    stats: dict[str, Any] = field(default_factory=dict)


def _reject(stage: str, item: WorkItem, reason: str, detail: str,
            related: str | None = None) -> Reject:
    return Reject(stage, reason, detail, item.record.content_sha256 or item.original_sha256,
                  item.record.path, related)


def _safe_source(image_root: Path, rel: str) -> Path | None:
    root = image_root.resolve()
    candidate = image_root / rel
    if candidate.is_symlink():
        return None
    resolved = candidate.resolve()
    if not resolved.is_relative_to(root) or not resolved.is_file():
        return None
    return resolved


def read_intake(path: Path) -> Iterator[tuple[int, dict[str, Any] | None, str]]:
    """(line number, parsed object or None, error) for each non-blank line.

    Lines are decoded one by one, so a line that is not UTF-8 is rejected on
    its own instead of stopping the whole intake. A leading byte order mark
    is ignored.
    """
    with path.open("rb") as handle:
        for number, raw_line in enumerate(handle, start=1):
            if number == 1 and raw_line.startswith(UTF8_BOM):
                raw_line = raw_line[len(UTF8_BOM):]
            if not raw_line.strip():
                continue
            if len(raw_line) > MAX_INTAKE_LINE:
                yield number, None, "line too long"
                continue
            try:
                value = json.loads(raw_line.decode("utf-8"))
            except UnicodeDecodeError:
                yield number, None, "not UTF-8 text"
                continue
            except ValueError:
                yield number, None, "not valid JSON"
                continue
            if not isinstance(value, dict):
                yield number, None, "not a JSON object"
                continue
            yield number, value, ""


def _checked_rows(intake: Path, image_root: Path
                  ) -> tuple[list[tuple[str, ImageRecord, Path]], list[Reject]]:
    """Intake rows that parse, validate and point at a safe file."""
    rows: list[tuple[str, ImageRecord, Path]] = []
    rejects: list[Reject] = []
    for number, raw, error in read_intake(intake):
        where = f"intake line {number}"
        if raw is None:
            rejects.append(Reject("ingest", "intake-unreadable", f"{where}: {error}", "", None))
            continue
        try:
            record = ImageRecord.from_dict(raw, require_hash=False)
        except RecordError as exc:
            rejects.append(Reject("ingest", "record-invalid", f"{where}: {exc}",
                                  str(raw.get("content_sha256") or ""),
                                  raw.get("path") if isinstance(raw.get("path"), str) else None))
            continue
        if record.path is None:
            rejects.append(Reject("ingest", "path-missing", f"{where}: no image path", "", None))
            continue
        source = _safe_source(image_root, record.path)
        if source is None:
            rejects.append(Reject("ingest", "path-unsafe-or-missing",
                                  f"{where}: image not found inside image_root", "", record.path))
            continue
        rows.append((where, record, source))
    return rows, rejects


def ingest(intake: Path, image_root: Path, limits: DecodeLimits, workers: int = 1
           ) -> StageOutput:
    """Validate intake rows, hash each file and check its header."""
    rows, rejects = _checked_rows(intake, image_root)
    hashes = hash_files([str(source) for _, _, source in rows], workers=workers)
    kept: list[WorkItem] = []
    for (where, record, source), original in zip(rows, hashes, strict=True):
        if record.content_sha256 and record.content_sha256 != original:
            rejects.append(Reject("ingest", "declared-hash-mismatch",
                                  f"{where}: file hash differs from the declared hash",
                                  record.content_sha256, record.path))
            continue
        with source.open("rb") as handle:
            failure = inspect(handle.read(limits.max_bytes + 1), limits)
        if failure is not None:
            rejects.append(Reject("ingest", failure.reason, f"{where}: {failure.detail}",
                                  original, record.path))
            continue
        kept.append(WorkItem(record.with_hash(original), original, str(source)))
    return StageOutput(kept, rejects, stats={"intake_rows": len(kept) + len(rejects)})


def licence_stage(items: Sequence[WorkItem], licence_filter: LicenceFilter) -> StageOutput:
    """Apply the licence filter; every decision is logged."""
    kept: list[WorkItem] = []
    rejects: list[Reject] = []
    log: list[dict[str, Any]] = []
    for item in items:
        decision = licence_filter.decide(item.record)
        log.append(decision.to_dict())
        if decision.kept:
            kept.append(item)
        else:
            rejects.append(_reject("licence", item, decision.reason, decision.detail))
    return StageOutput(kept, rejects, log)


def _source_rank(item: WorkItem) -> tuple[str, str]:
    return (item.record.source, item.record.path or "")


def exact_stage(items: Sequence[WorkItem]) -> StageOutput:
    """Drop items whose uploaded bytes are identical; keep the first by source and path."""
    indexed = list(enumerate(items))
    kept_pairs, links = exact_dedup(indexed, ident=lambda pair: str(pair[0]),
                                    keys=lambda pair: (pair[1].original_sha256,),
                                    rank=lambda pair: _source_rank(pair[1]))
    rejects = [_reject("exact_dedup", items[int(link.dropped)], "exact-duplicate",
                       "same bytes as a kept image", items[int(link.kept)].record.path)
               for link in links]
    return StageOutput([item for _, item in kept_pairs], rejects,
                       stats={"exact_duplicates": len(rejects)})


def _box(item: WorkItem) -> tuple[int, int, int, int] | None:
    box = item.record.face_box
    return None if box is None else (box.x, box.y, box.width, box.height)


def quality_stage(items: Sequence[WorkItem], quality: QualityConfig, limits: DecodeLimits,
                  clean_dir: Path | None, workers: int) -> StageOutput:
    """Decode, strip, re-hash, score and fingerprint every item."""
    tasks = [ImageTask(item.stored_path, item.original_sha256, _box(item),
                       None if clean_dir is None else str(clean_dir))
             for item in items]
    kept: list[WorkItem] = []
    rejects: list[Reject] = []
    for item, outcome in zip(items, run_tasks(tasks, limits, quality, workers=workers),
                             strict=True):
        if outcome.reason is not None:
            rejects.append(_reject("quality", item, outcome.reason, outcome.detail))
            continue
        record = item.record.with_hash(outcome.content_sha256).with_size(outcome.width,
                                                                         outcome.height)
        updated = replace(item, record=record, stored_path=outcome.stored_path,
                          quality=outcome.quality, phash=outcome.phash, dhash=outcome.dhash)
        assert outcome.quality is not None
        if not outcome.quality["passed"]:
            rejects.append(_reject("quality", updated, "quality-below-threshold",
                                   "; ".join(outcome.quality["rejects"])))
            continue
        kept.append(updated)
    return StageOutput(kept, rejects)


LOSSY_SUFFIXES = (".jpg", ".jpeg", ".webp")


def _quality_rank(item: WorkItem) -> tuple[float, int, bool, str]:
    """Preferred copy first: higher score, more pixels, lossless upload, then hash."""
    pixels = (item.record.width or 0) * (item.record.height or 0)
    lossy = (item.record.path or "").lower().endswith(LOSSY_SUFFIXES)
    return (-round(item.score, 6), -pixels, lossy, item.record.content_sha256)


def near_stage(items: Sequence[WorkItem], config: NearDupConfig) -> StageOutput:
    """Collapse identical cleaned pixels, then remove near copies greedily."""
    unique, exact_links = exact_dedup(list(items), ident=lambda i: i.record.content_sha256,
                                      keys=lambda i: (i.record.content_sha256,),
                                      rank=_quality_rank)
    rejects = [Reject("near_dedup", "identical-pixels", "same pixels as a kept image",
                      link.dropped, None, link.kept) for link in exact_links]
    entries = [HashedItem(item.record.content_sha256, from_hex(item.phash or ""),
                          from_hex(item.dhash or ""), _quality_rank(item), item)
               for item in unique]
    result = near_dedup(entries, config)
    paths = {item.record.content_sha256: item.record.path for item in unique}
    for link in result.links:
        rejects.append(Reject("near_dedup", "near-duplicate",
                              f"pHash {link.phash_distance} bits, dHash {link.dhash_distance} "
                              "bits from a kept image", link.dropped, paths.get(link.dropped),
                              link.kept))
    return StageOutput(result.kept, rejects, [link.to_dict() for link in result.links],
                       {"candidate_pairs": result.candidate_pairs,
                        "confirmed_pairs": result.confirmed_pairs})


def _taken_down(item: WorkItem, hashes: frozenset[str]) -> bool:
    return item.record.content_sha256 in hashes or item.original_sha256 in hashes


@dataclass(frozen=True)
class NearCheck:
    """Settings for the near-copy part of the holdout stage."""

    config: NearDupConfig
    cache_path: Path | None = None


def _near_leaks(items: Sequence[WorkItem], guard: HoldoutGuard, near: NearCheck
                ) -> tuple[dict[str, NearLeak], dict[str, int]]:
    prints, print_stats = fingerprint_sets(guard.sets, cache_path=near.cache_path)
    checker = NearHoldoutGuard(prints, near.config)
    leaks: dict[str, NearLeak] = {}
    for item in items:
        if item.phash is None or item.dhash is None:
            continue
        leak = checker.match(item.record.content_sha256, from_hex(item.phash),
                             from_hex(item.dhash))
        if leak is not None:
            leaks[item.record.content_sha256] = leak
    return leaks, print_stats.to_dict()


def holdout_stage(items: Sequence[WorkItem], lock_paths: Sequence[Path], on_leak: str,
                  taken_down: frozenset[str] = frozenset(),
                  near: NearCheck | None = None) -> StageOutput:
    """Drop taken-down images, then refuse exact and near copies of frozen test images."""
    removed = [_reject("holdout", item, "taken-down", "listed in the takedown registry")
               for item in items if _taken_down(item, taken_down)]
    items = [item for item in items if not _taken_down(item, taken_down)]
    if not lock_paths:
        return StageOutput(list(items), removed,
                           stats={"frozen_sets": [], "leaks": 0, "taken_down": len(removed)})
    guard = HoldoutGuard.from_paths(lock_paths)
    report = guard.check((item.record.content_sha256, (item.original_sha256,))
                         for item in items)
    exact = {leak.content_sha256: leak for leak in report.leaks}
    stats: dict[str, Any] = {"frozen_sets": report.frozen_sets,
                             "frozen_hashes": report.frozen_hashes,
                             "leaks": len(exact), "taken_down": len(removed)}
    close: dict[str, NearLeak] = {}
    if near is not None:
        close, stats["frozen_prints"] = _near_leaks(
            [item for item in items if item.record.content_sha256 not in exact], guard, near)
        stats["near_leaks"] = len(close)
    if (exact or close) and on_leak == "fail":
        sample = ", ".join(sorted(set(exact) | set(close))[:5])
        raise StageError(f"{len(exact)} exact and {len(close)} near copies of frozen test "
                         f"images ({sample})")
    rejects = list(removed)
    kept: list[WorkItem] = []
    for item in items:
        digest = item.record.content_sha256
        if digest in exact:
            rejects.append(_reject("holdout", item, "frozen-test-image",
                                   "in frozen set " + ", ".join(exact[digest].frozen_sets)))
        elif digest in close:
            leak = close[digest]
            rejects.append(_reject("holdout", item, "frozen-test-near-copy",
                                   f"pHash {leak.phash_distance} bits from an image in frozen "
                                   f"set {leak.frozen_set}", leak.frozen_sha256))
        else:
            kept.append(item)
    return StageOutput(kept, rejects, stats=stats)


def balance_stage(items: Sequence[WorkItem], spec: SliceSpec | None) -> StageOutput:
    """Apply slice quotas, or pass everything through when no spec is set."""
    if spec is None:
        ordered = sorted(items, key=lambda i: i.record.content_sha256)
        return StageOutput(ordered, stats={"balanced": False})
    by_hash = {item.record.content_sha256: item for item in items}
    scores = {digest: item.score for digest, item in by_hash.items()}
    result = balance([item.record for item in items], spec, scores)
    chosen = {record.content_sha256 for record in result.selected}
    kept = [by_hash[record.content_sha256] for record in result.selected]
    rejects = [_reject("balance", item, "over-quota-or-outside-targets",
                       "not selected by the slice quotas")
               for item in sorted(items, key=lambda i: i.record.content_sha256)
               if item.record.content_sha256 not in chosen]
    stats = result.to_dict()
    stats["balanced"] = True
    return StageOutput(kept, rejects, stats=stats)


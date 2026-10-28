"""Consent and takedown registry, and removal from published sets.

A removal request names a content hash and a reason code. It is appended to
the registry (beljour-takedown/1 JSONL), which future pipeline runs read so
the image never comes back. Applying a request to a published set verifies
the current lock first, writes a manifest without the matching rows (by
content hash or original upload hash), deletes the exported image, archives
the old lock, writes a new lock version that names its parent, and appends
one audit line. Requests hold hashes and reason codes only, no personal data.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
import shutil
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .hashing import canonical_json, is_sha256
from .integrity import export_target
from .lockfile import assert_lock, build_lock, write_lock
from .manifest import ManifestReader, write_manifest

TAKEDOWN_SCHEMA = "beljour-takedown/1"
AUDIT_SCHEMA = "beljour-audit/1"
REASONS = ("consent-withdrawn", "licence-revoked", "source-request", "rights-dispute",
           "quality-recall")
DATE_PATTERN = "YYYY-MM-DD"


class TakedownError(ValueError):
    """A request is invalid or cannot be applied safely."""


@dataclass(frozen=True)
class TakedownRequest:
    """One removal request; `received` is a plain date, no time or names."""

    content_sha256: str
    reason: str
    received: str
    reference: str = ""

    def __post_init__(self) -> None:
        if not is_sha256(self.content_sha256):
            raise TakedownError("takedown needs a SHA-256 content hash")
        if self.reason not in REASONS:
            raise TakedownError(f"reason must be one of {', '.join(REASONS)}")
        parts = self.received.split("-")
        if len(parts) != 3 or not all(part.isdigit() for part in parts) or len(parts[0]) != 4:
            raise TakedownError(f"received must be a date like {DATE_PATTERN}")
        if len(self.reference) > 64 or "@" in self.reference or "\n" in self.reference:
            raise TakedownError("reference must be a short ticket id, not contact details")

    def to_json(self) -> dict[str, Any]:
        """Registry line."""
        return {"schema": TAKEDOWN_SCHEMA, "content_sha256": self.content_sha256,
                "reason": self.reason, "received": self.received, "reference": self.reference}

    @classmethod
    def from_json(cls, raw: Any) -> TakedownRequest:
        """Parse one registry line."""
        if not isinstance(raw, dict) or raw.get("schema") != TAKEDOWN_SCHEMA:
            raise TakedownError(f"registry lines must use schema {TAKEDOWN_SCHEMA}")
        return cls(str(raw.get("content_sha256", "")), str(raw.get("reason", "")),
                   str(raw.get("received", "")), str(raw.get("reference", "")))


class TakedownRegistry:
    """Append-only JSONL list of removal requests."""

    def __init__(self, path: Path) -> None:
        self.path = path

    def requests(self) -> list[TakedownRequest]:
        """Every request in file order; a bad line is an error, not skipped."""
        if not self.path.is_file():
            return []
        out: list[TakedownRequest] = []
        with self.path.open("r", encoding="utf-8") as handle:
            for number, line in enumerate(handle, start=1):
                if not line.strip():
                    continue
                try:
                    out.append(TakedownRequest.from_json(json.loads(line)))
                except (ValueError, TakedownError) as exc:
                    raise TakedownError(f"{self.path.name} line {number}: {exc}") from exc
        return out

    def hashes(self) -> frozenset[str]:
        """Every content hash that must stay out of all sets."""
        return frozenset(request.content_sha256 for request in self.requests())

    def add(self, requests: Iterable[TakedownRequest]) -> int:
        """Append new requests; a hash already listed is not repeated."""
        known = self.hashes()
        fresh = [r for r in requests if r.content_sha256 not in known]
        if fresh:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("a", encoding="utf-8") as handle:
                for request in fresh:
                    handle.write(canonical_json(request.to_json()) + "\n")
        return len(fresh)


@dataclass(frozen=True)
class TakedownResult:
    """What one application to one set changed."""

    lock_path: Path
    removed: list[str]
    lock_before: str
    lock_after: str
    version: int

    @property
    def changed(self) -> bool:
        """True when rows were removed and a new lock written."""
        return bool(self.removed)


def _audit(path: Path, entry: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(canonical_json({"schema": AUDIT_SCHEMA, **entry}) + "\n")


def audit_path(lock_path: Path) -> Path:
    """Audit log kept next to the lock."""
    return lock_path.with_name(lock_path.name.removesuffix(".lock") + ".audit.jsonl")


def apply_takedown(lock_path: Path, requests: Sequence[TakedownRequest]) -> TakedownResult:
    """Remove requested images from the set pinned by lock_path."""
    lock = assert_lock(lock_path, require_tool_version=False)
    manifest_path = lock_path.parent / str(lock["manifest"]["file"])
    wanted = {request.content_sha256: request for request in requests}
    kept: list[tuple[Any, Any]] = []
    removed: list[tuple[str, str | None, str]] = []
    reader = ManifestReader(manifest_path)
    for row in reader:
        original = row.annotations.get("original_sha256")
        match = wanted.get(row.record.content_sha256) or (
            wanted.get(original) if isinstance(original, str) else None)
        if match is None:
            kept.append((row.record, row.annotations))
        else:
            removed.append((row.record.content_sha256, row.record.path, match.reason))
    before = str(lock["lock_sha256"])
    audit = audit_path(lock_path)
    if not removed:
        _audit(audit, {"action": "takedown-noop", "lock": before,
                       "requested": sorted(wanted)})
        return TakedownResult(lock_path, [], before, before, int(lock["version"]))
    shards = int(reader.header["shards"])
    draft = manifest_path.with_name(manifest_path.name + ".next")
    summary = write_manifest(draft, kept, shards=shards, compress=bool(
        lock["manifest"]["compressed"]))
    version = int(lock["version"]) + 1
    fresh = build_lock(summary, manifest_path.name, str(lock["filter_config_sha256"]),
                       set_name=str(lock["set_name"]), version=version,
                       parent_lock_sha256=before)
    shutil.copyfile(lock_path, lock_path.with_name(f"{lock_path.name}.v{lock['version']}"))
    os.replace(draft, manifest_path)
    write_lock(lock_path, fresh, replace=True)
    for _, rel, _ in removed:
        target = export_target(lock_path.parent, rel)
        if target is not None:
            target.unlink(missing_ok=True)
    for digest, _, reason in removed:
        _audit(audit, {"action": "takedown", "content_sha256": digest, "reason": reason,
                       "lock_before": before, "lock_after": fresh["lock_sha256"],
                       "version": version})
    return TakedownResult(lock_path, sorted(d for d, _, _ in removed), before,
                          str(fresh["lock_sha256"]), version)


def read_audit(path: Path) -> list[dict[str, Any]]:
    """Audit lines in order."""
    if not path.is_file():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]

"""Lock files that pin a finished data set (format beljour-data-lock/1).

A lock records the manifest file hash, the hash of its rows, the record count,
each shard's count and hash, the hash of the filter config that built it and
the tool version. The lock hashes itself, so any edit is caught. Verification
fails closed: an unreadable lock, an unknown format, a missing field or any
drift in the manifest or config is a problem, never a warning. This format is
separate from the frozen test-set locks owned by the real-face runner.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
from collections.abc import Mapping
from pathlib import Path, PurePosixPath
from typing import Any

from .hashing import hash_json, is_sha256
from .manifest import TOOL_NAME, TOOL_VERSION, ManifestError, ManifestSummary, verify_manifest

LOCK_FORMAT = "beljour-data-lock/1"
LOCK_KEYS = frozenset({"format", "set_name", "version", "tool", "tool_version", "manifest",
                       "filter_config_sha256", "parent_lock_sha256", "lock_sha256"})
MANIFEST_KEYS = frozenset({"file", "file_sha256", "rows_sha256", "record_count",
                           "shard_count", "compressed", "shards"})


class LockError(ValueError):
    """A lock is invalid or the data it pins has drifted."""

    def __init__(self, problems: list[str]) -> None:
        self.problems = list(problems)
        super().__init__("data lock check failed: " + "; ".join(self.problems))


def _self_hash(lock: Mapping[str, Any]) -> str:
    return hash_json({key: value for key, value in lock.items() if key != "lock_sha256"})


def build_lock(summary: ManifestSummary, manifest_name: str, filter_config_sha256: str, *,
               set_name: str, version: int = 1, parent_lock_sha256: str | None = None
               ) -> dict[str, Any]:
    """Lock contents for a verified manifest summary."""
    if not is_sha256(filter_config_sha256):
        raise LockError(["filter config hash must be a SHA-256 hex digest"])
    if parent_lock_sha256 is not None and not is_sha256(parent_lock_sha256):
        raise LockError(["parent lock hash must be a SHA-256 hex digest"])
    if not set_name.strip() or version < 1:
        raise LockError(["a lock needs a set name and a version of 1 or more"])
    lock: dict[str, Any] = {
        "format": LOCK_FORMAT,
        "set_name": set_name,
        "version": version,
        "tool": TOOL_NAME,
        "tool_version": TOOL_VERSION,
        "manifest": {
            "file": manifest_name,
            "file_sha256": summary.file_sha256,
            "rows_sha256": summary.rows_sha256,
            "record_count": summary.count,
            "shard_count": summary.shard_count,
            "compressed": summary.compressed,
            "shards": {str(k): v.to_dict() for k, v in sorted(summary.shards.items())},
        },
        "filter_config_sha256": filter_config_sha256,
        "parent_lock_sha256": parent_lock_sha256,
    }
    lock["lock_sha256"] = _self_hash(lock)
    return lock


def write_lock(path: Path, lock: Mapping[str, Any], *, replace: bool = False) -> str:
    """Write a lock atomically; refuses to overwrite unless replace is set."""
    problems = structure_problems(lock)
    if problems:
        raise LockError(problems)
    if path.exists() and not replace:
        raise LockError([f"{path.name} already exists; a set is never re-locked in place"])
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".partial")
    tmp.write_text(json.dumps(dict(lock), indent=1, sort_keys=True) + "\n", encoding="utf-8")
    os.replace(tmp, path)
    return str(lock["lock_sha256"])


def _manifest_problems(manifest: Any) -> list[str]:
    if not isinstance(manifest, dict):
        return ["manifest section missing"]
    problems: list[str] = []
    if set(manifest) != MANIFEST_KEYS:
        problems.append("manifest section has missing or unexpected fields")
        return problems
    file_name = manifest["file"]
    if (not isinstance(file_name, str) or not file_name or "/" in file_name
            or "\\" in file_name or PurePosixPath(file_name).name != file_name
            or file_name in {".", ".."}):
        problems.append("manifest file must be a plain file name next to the lock")
    for key in ("file_sha256", "rows_sha256"):
        if not is_sha256(manifest[key]):
            problems.append(f"manifest {key} is not a SHA-256 hex digest")
    for key in ("record_count", "shard_count"):
        value = manifest[key]
        if not isinstance(value, int) or isinstance(value, bool) or value < 0:
            problems.append(f"manifest {key} must be a non-negative integer")
    if not isinstance(manifest["compressed"], bool):
        problems.append("manifest compressed must be true or false")
    shards = manifest["shards"]
    shard_count = manifest["shard_count"]
    if not isinstance(shards, dict) or not all(
            isinstance(v, dict) and set(v) == {"count", "sha256"} and is_sha256(v["sha256"])
            and isinstance(v["count"], int) and not isinstance(v["count"], bool)
            and v["count"] > 0 for v in shards.values()):
        problems.append("manifest shards must map shard ids to count and sha256")
    elif not all(isinstance(k, str) and k.isdigit() and str(int(k)) == k
                 and isinstance(shard_count, int) and int(k) < shard_count for k in shards):
        problems.append("manifest shard ids must be numbers below the shard count")
    elif isinstance(manifest["record_count"], int) and sum(
            int(v["count"]) for v in shards.values()) != manifest["record_count"]:
        problems.append("shard counts do not add up to the record count")
    return problems


def structure_problems(lock: Any) -> list[str]:
    """Schema-level problems with a lock object."""
    if not isinstance(lock, Mapping):
        return ["lock must be a JSON object"]
    if lock.get("format") != LOCK_FORMAT:
        return [f"lock format must be {LOCK_FORMAT}"]
    if set(lock) != LOCK_KEYS:
        missing = sorted(LOCK_KEYS - set(lock))
        extra = sorted(set(lock) - LOCK_KEYS)
        return [f"lock fields differ (missing {missing}, unexpected {extra})"]
    problems: list[str] = []
    if not isinstance(lock["set_name"], str) or not lock["set_name"].strip():
        problems.append("lock set_name is empty")
    version = lock["version"]
    if not isinstance(version, int) or isinstance(version, bool) or version < 1:
        problems.append("lock version must be a positive integer")
    if not is_sha256(lock["filter_config_sha256"]):
        problems.append("lock filter_config_sha256 is not a SHA-256 hex digest")
    parent = lock["parent_lock_sha256"]
    if parent is not None and not is_sha256(parent):
        problems.append("lock parent_lock_sha256 is not a SHA-256 hex digest")
    problems.extend(_manifest_problems(lock["manifest"]))
    if lock["lock_sha256"] != _self_hash(lock):
        problems.append("lock contents were edited (self hash mismatch)")
    return problems


def read_lock(path: Path) -> dict[str, Any]:
    """Load and structurally check a lock; raises LockError."""
    try:
        lock = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise LockError([f"lock unreadable: {path.name}"]) from exc
    problems = structure_problems(lock)
    if problems:
        raise LockError(problems)
    assert isinstance(lock, dict)
    return lock


def _compare(lock_manifest: Mapping[str, Any], summary: ManifestSummary) -> list[str]:
    problems: list[str] = []
    if summary.file_sha256 != lock_manifest["file_sha256"]:
        problems.append("manifest file hash differs from the lock")
    if summary.rows_sha256 != lock_manifest["rows_sha256"]:
        problems.append("manifest rows differ from the lock")
    if summary.count != lock_manifest["record_count"]:
        problems.append(f"record count {summary.count} differs from the locked "
                        f"{lock_manifest['record_count']}")
    if summary.shard_count != lock_manifest["shard_count"]:
        problems.append("shard count differs from the lock")
    actual = {str(k): v.to_dict() for k, v in sorted(summary.shards.items())}
    for shard in sorted(set(actual) | set(lock_manifest["shards"]), key=int):
        if actual.get(shard) != lock_manifest["shards"].get(shard):
            problems.append(f"shard {shard} differs from the lock")
    return problems


def verify_lock(lock_path: Path, *, manifest_path: Path | None = None,
                filter_config_sha256: str | None = None,
                require_tool_version: bool = True) -> list[str]:
    """Every problem with a lock and the data it pins; empty means intact."""
    try:
        lock = read_lock(lock_path)
    except LockError as exc:
        return exc.problems
    problems: list[str] = []
    if lock["tool"] != TOOL_NAME:
        problems.append(f"lock was written by {lock['tool']}, not {TOOL_NAME}")
    if require_tool_version and lock["tool_version"] != TOOL_VERSION:
        problems.append(f"tool version {lock['tool_version']} differs from {TOOL_VERSION}")
    if filter_config_sha256 is not None and filter_config_sha256 != lock["filter_config_sha256"]:
        problems.append("filter config differs from the one the set was locked with")
    target = manifest_path or lock_path.parent / str(lock["manifest"]["file"])
    if not target.is_file():
        return problems + [f"manifest {target.name} is missing"]
    try:
        summary = verify_manifest(target)
    except (ManifestError, OSError, EOFError) as exc:
        return problems + [f"manifest invalid: {exc}"]
    return problems + _compare(lock["manifest"], summary)


def assert_lock(lock_path: Path, **options: Any) -> dict[str, Any]:
    """Raise LockError unless the lock and its manifest are intact; return the lock."""
    problems = verify_lock(lock_path, **options)
    if problems:
        raise LockError(problems)
    return read_lock(lock_path)

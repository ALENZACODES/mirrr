"""Holdout leak guard: no frozen test image may enter a training set.

Frozen test sets are pinned by beljour-frozen-lock/1 files owned by the
real-face runner. This module only reads them: it checks the format, every
face hash and the lock's own face-list hash, then refuses any training record
whose content hash (or original upload hash) is in a frozen set. A lock that
cannot be read or checked makes the guard fail closed.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .hashing import is_sha256
from .manifest import ManifestReader

FROZEN_LOCK_FORMAT = "beljour-frozen-lock/1"
FROZEN_LOCK_NAME = "frozen.lock"
FACE_FIELDS = ("face_id", "sha256", "rel_path")


class HoldoutError(ValueError):
    """A frozen lock is unusable or a training set leaks test images."""


def frozen_faces_hash(faces: Sequence[dict[str, Any]]) -> str:
    """The frozen lock's face-list hash, computed the same way the lock does."""
    rows = [[face["face_id"], face["sha256"], face["rel_path"]] for face in faces]
    return hashlib.sha256(json.dumps(rows, separators=(",", ":")).encode()).hexdigest()


@dataclass(frozen=True)
class FrozenSet:
    """Hashes of one frozen test set."""

    name: str
    lock_path: Path
    hashes: frozenset[str]
    faces: tuple[tuple[str, str], ...] = ()


def load_frozen_lock(path: Path) -> FrozenSet:
    """Read one frozen lock; raises HoldoutError on any doubt."""
    try:
        lock = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise HoldoutError(f"frozen lock unreadable: {path}") from exc
    if not isinstance(lock, dict) or lock.get("format") != FROZEN_LOCK_FORMAT:
        raise HoldoutError(f"{path}: not a {FROZEN_LOCK_FORMAT} file")
    faces = lock.get("faces")
    if not isinstance(faces, list) or not faces:
        raise HoldoutError(f"{path}: frozen lock lists no faces")
    hashes: set[str] = set()
    pairs: list[tuple[str, str]] = []
    for face in faces:
        if not isinstance(face, dict) or not all(
                isinstance(face.get(key), str) and face[key] for key in FACE_FIELDS):
            raise HoldoutError(f"{path}: malformed face record")
        if not is_sha256(face["sha256"]):
            raise HoldoutError(f"{path}: face hash is not SHA-256")
        hashes.add(face["sha256"])
        pairs.append((face["sha256"], face["rel_path"]))
    if frozen_faces_hash(faces) != lock.get("faces_sha256"):
        raise HoldoutError(f"{path}: face list does not match faces_sha256")
    return FrozenSet(path.parent.name, path, frozenset(hashes), tuple(pairs))


def find_frozen_locks(root: Path) -> list[Path]:
    """Every frozen.lock under root, sorted; symlinks are refused."""
    if not root.is_dir():
        raise HoldoutError(f"frozen set folder not found: {root}")
    found = sorted(root.rglob(FROZEN_LOCK_NAME))
    for path in found:
        if path.is_symlink():
            raise HoldoutError(f"{path}: frozen lock must not be a symlink")
    return found


@dataclass(frozen=True)
class Leak:
    """One training record found in a frozen test set."""

    content_sha256: str
    matched_hash: str
    frozen_sets: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        """JSON form for reports."""
        return {"content_sha256": self.content_sha256, "matched_hash": self.matched_hash,
                "frozen_sets": list(self.frozen_sets)}


@dataclass(frozen=True)
class LeakReport:
    """Outcome of checking a training set."""

    checked: int
    leaks: list[Leak]
    frozen_sets: list[str]
    frozen_hashes: int

    @property
    def clean(self) -> bool:
        """True when nothing leaked."""
        return not self.leaks

    def to_dict(self) -> dict[str, Any]:
        """JSON form for reports."""
        return {"checked": self.checked, "leak_count": len(self.leaks),
                "frozen_sets": self.frozen_sets, "frozen_hashes": self.frozen_hashes,
                "leaks": [leak.to_dict() for leak in self.leaks]}


class HoldoutGuard:
    """Membership test against the union of frozen test sets."""

    def __init__(self, sets: Sequence[FrozenSet]) -> None:
        self.sets = list(sets)
        self._owners: dict[str, list[str]] = {}
        for frozen in self.sets:
            for digest in frozen.hashes:
                self._owners.setdefault(digest, []).append(frozen.name)

    @classmethod
    def from_paths(cls, paths: Iterable[Path]) -> HoldoutGuard:
        """Load lock files, or every frozen.lock under each folder given."""
        sets: list[FrozenSet] = []
        for path in paths:
            locks = find_frozen_locks(path) if path.is_dir() else [path]
            if path.is_dir() and not locks:
                raise HoldoutError(f"{path}: no frozen.lock files found")
            sets.extend(load_frozen_lock(lock) for lock in locks)
        return cls(sets)

    @property
    def hash_count(self) -> int:
        """Distinct frozen hashes."""
        return len(self._owners)

    def leak_for(self, content_sha256: str, *extra_hashes: str) -> Leak | None:
        """A Leak if the record (or any extra hash it carries) is frozen."""
        for digest in (content_sha256, *extra_hashes):
            owners = self._owners.get(digest)
            if owners:
                return Leak(content_sha256, digest, tuple(sorted(set(owners))))
        return None

    def check(self, items: Iterable[tuple[str, Sequence[str]]]) -> LeakReport:
        """Check (content hash, extra hashes) pairs."""
        checked = 0
        leaks: list[Leak] = []
        for digest, extra in items:
            checked += 1
            leak = self.leak_for(digest, *extra)
            if leak is not None:
                leaks.append(leak)
        leaks.sort(key=lambda leak: leak.content_sha256)
        return LeakReport(checked, leaks, sorted({s.name for s in self.sets}), self.hash_count)

    def check_manifest(self, path: Path) -> LeakReport:
        """Check every row of a data manifest (original hashes included)."""
        def rows() -> Iterable[tuple[str, Sequence[str]]]:
            for row in ManifestReader(path):
                original = row.annotations.get("original_sha256")
                extra = [original] if isinstance(original, str) else []
                yield row.record.content_sha256, extra
        return self.check(rows())

    def assert_clean(self, report: LeakReport) -> None:
        """Raise HoldoutError when the report has leaks."""
        if report.leaks:
            sample = ", ".join(leak.content_sha256[:12] for leak in report.leaks[:5])
            raise HoldoutError(f"{len(report.leaks)} training records are in frozen test "
                               f"sets ({sample})")

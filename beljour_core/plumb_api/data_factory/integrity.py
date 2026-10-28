"""Set integrity beyond the lock: exported images and differences between versions.

`verify_exports` checks that every manifest row's exported image exists next
to the lock and hashes to its content hash, and that the images folder holds
nothing else. `diff_manifests` lists what was added, removed or changed
between two manifests, for audit notes when a set is re-locked.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any

from .hashing import sha256_file
from .lockfile import assert_lock
from .manifest import ManifestReader, ManifestRow

EXPORT_FOLDER = "images"


def export_target(root: Path, rel: str | None) -> Path | None:
    """Exported image path for a manifest row, or None if the path is not one."""
    if not rel:
        return None
    pure = PurePosixPath(rel)
    if pure.is_absolute() or ".." in pure.parts or not pure.parts:
        return None
    if pure.parts[0] != EXPORT_FOLDER:
        return None
    target = root / rel
    return target if target.resolve().is_relative_to(root.resolve()) else None


def verify_exports(lock_path: Path) -> list[str]:
    """Problems with the exported images of a locked set; empty means intact."""
    lock = assert_lock(lock_path, require_tool_version=False)
    root = lock_path.parent
    manifest = root / str(lock["manifest"]["file"])
    problems: list[str] = []
    expected: set[Path] = set()
    for row in ManifestReader(manifest):
        target = export_target(root, row.record.path)
        digest = row.record.content_sha256[:12]
        if target is None:
            problems.append(f"{digest}: manifest path is not an exported image")
            continue
        expected.add(target)
        if target.is_symlink() or not target.is_file():
            problems.append(f"{digest}: exported image missing")
        elif sha256_file(target) != row.record.content_sha256:
            problems.append(f"{digest}: exported image changed")
    folder = root / EXPORT_FOLDER
    if folder.is_dir():
        for path in sorted(folder.rglob("*")):
            if path.is_file() and path not in expected:
                problems.append(f"unlisted file in images: {path.relative_to(root).as_posix()}")
    return problems


@dataclass(frozen=True)
class ManifestDiff:
    """Content hashes added, removed and changed (same hash, other metadata)."""

    added: list[str]
    removed: list[str]
    changed: list[str]

    @property
    def same(self) -> bool:
        """True when the two manifests hold the same rows."""
        return not (self.added or self.removed or self.changed)

    def to_dict(self) -> dict[str, Any]:
        """JSON form with counts first."""
        return {"added_count": len(self.added), "removed_count": len(self.removed),
                "changed_count": len(self.changed), "added": self.added,
                "removed": self.removed, "changed": self.changed}


def _rows(path: Path) -> dict[str, ManifestRow]:
    return {row.record.content_sha256: row for row in ManifestReader(path)}


def diff_manifests(before: Path, after: Path) -> ManifestDiff:
    """Compare two verified manifests by content hash; shard numbers are ignored."""
    old, new = _rows(before), _rows(after)
    changed = sorted(digest for digest in set(old) & set(new)
                     if (old[digest].record.to_dict(), dict(old[digest].annotations))
                     != (new[digest].record.to_dict(), dict(new[digest].annotations)))
    return ManifestDiff(sorted(set(new) - set(old)), sorted(set(old) - set(new)), changed)

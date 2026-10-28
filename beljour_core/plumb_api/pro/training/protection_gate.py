"""Fail-closed private artefact export scanner for the integration gate.

Author: John Khan.
"""

from __future__ import annotations

import os
import stat
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from .sealed_store import MAGIC, MAX_CIPHERTEXT_BYTES, NONCE_BYTES, TAG_BYTES

MAX_PRIVATE_EXPORT_FILES = 100_000


@dataclass(frozen=True)
class ProtectionReport:
    scanned: int
    protected: int
    problems: tuple[str, ...]

    @property
    def ready(self) -> bool:
        return self.scanned > 0 and self.problems == ()

    def public(self) -> dict[str, object]:
        return {
            "schema": "beljour-protection-check/1",
            "scanned": self.scanned,
            "protected": self.protected,
            "problems": list(self.problems),
            "release": "AUTHENTICATED_CIPHERTEXT_ONLY" if self.ready else "BLOCKED",
        }


def inspect_private_export(
    folder: Path, *, authenticate: Callable[[Path], bool] | None = None,
) -> ProtectionReport:
    """Fail if any private checkpoint/recipe output is readable or unconstrained.

    Source images and manifests must live outside this dedicated export directory.
    The scan never returns file names, checkpoint identifiers, or bytes.
    """
    if not folder.is_dir() or folder.is_symlink():
        return ProtectionReport(0, 0, ("missing_protected_export_directory",))
    if folder.stat().st_mode & (stat.S_IWGRP | stat.S_IWOTH):
        return ProtectionReport(0, 0, ("untrusted_protected_export_directory",))
    scanned = 0
    accepted = 0
    reasons: set[str] = set()
    for directory, dirs, filenames in os.walk(folder, followlinks=False):
        dirs.sort()
        filenames.sort()
        for name in dirs:
            item = Path(directory) / name
            if item.is_symlink():
                reasons.add("untrusted_subdirectory")
        for name in filenames:
            scanned += 1
            if scanned > MAX_PRIVATE_EXPORT_FILES:
                reasons.add("protected_export_file_count_limit")
                return ProtectionReport(scanned, accepted, tuple(sorted(reasons)))
            item = Path(directory) / name
            try:
                mode = item.lstat().st_mode
                length = item.lstat().st_size
            except OSError:
                reasons.add("invalid_protected_file")
                continue
            if (not stat.S_ISREG(mode) or item.suffix != ".bjev" or
                mode & (stat.S_IRGRP | stat.S_IROTH | stat.S_IWGRP | stat.S_IWOTH)):
                reasons.add("readable_or_unapproved_private_file")
                continue
            if not len(MAGIC) + NONCE_BYTES + TAG_BYTES < length <= MAX_CIPHERTEXT_BYTES:
                reasons.add("invalid_protected_file_size")
                continue
            try:
                with item.open("rb") as handle:
                    magic = handle.read(len(MAGIC))
            except OSError:
                reasons.add("invalid_protected_file")
                continue
            if magic != MAGIC:
                reasons.add("missing_encrypted_artifact_header")
                continue
            if authenticate is None:
                reasons.add("authentication_not_verified")
                continue
            try:
                if not authenticate(item):
                    reasons.add("protected_authentication_failed")
                    continue
            except Exception:
                reasons.add("protected_authentication_failed")
                continue
            accepted += 1
    if scanned == 0:
        reasons.add("missing_protected_artifacts")
    return ProtectionReport(scanned, accepted, tuple(sorted(reasons)))

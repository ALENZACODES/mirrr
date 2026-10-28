"""Content and canonical hashes shared by every data factory stage.

All hashes are lower-case SHA-256 hex digests. Canonical JSON uses sorted keys
and compact separators so the same value always hashes the same way.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Iterable
from pathlib import Path
from typing import Any

SHA256_HEX = re.compile(r"^[0-9a-f]{64}$")
READ_CHUNK = 1 << 20


def is_sha256(value: object) -> bool:
    """True when value is a lower-case 64 character SHA-256 hex digest."""
    return isinstance(value, str) and SHA256_HEX.fullmatch(value) is not None


def sha256_bytes(data: bytes) -> str:
    """SHA-256 hex digest of a byte string."""
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    """SHA-256 hex digest of UTF-8 text."""
    return sha256_bytes(text.encode("utf-8"))


def sha256_file(path: Path) -> str:
    """Stream a file through SHA-256 without loading it whole."""
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(READ_CHUNK)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def canonical_json(value: Any) -> str:
    """Stable JSON text: sorted keys, compact separators, ASCII only."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def hash_json(value: Any) -> str:
    """SHA-256 of the canonical JSON form of value."""
    return sha256_text(canonical_json(value))


class RollingHash:
    """Order-sensitive hash over a stream of canonical JSON rows.

    Each row contributes its canonical text plus a newline, so the digest equals
    the SHA-256 of the rows written one per line.
    """

    def __init__(self) -> None:
        self._digest = hashlib.sha256()
        self.count = 0

    def add(self, row: Any) -> None:
        """Fold one row into the digest."""
        self.add_line(canonical_json(row))

    def add_line(self, text: str) -> None:
        """Fold one already canonical line (without its newline)."""
        self._digest.update(text.encode("utf-8"))
        self._digest.update(b"\n")
        self.count += 1

    def add_all(self, rows: Iterable[Any]) -> None:
        """Fold several rows in order."""
        for row in rows:
            self.add(row)

    def hexdigest(self) -> str:
        """Current digest; adding more rows afterwards is allowed."""
        return self._digest.copy().hexdigest()


def shard_of(content_sha256: str, shards: int) -> int:
    """Deterministic shard index for a content hash.

    Uses the first 16 hex digits as an unsigned integer so the assignment never
    depends on the order records arrive in.
    """
    if shards < 1:
        raise ValueError("shard count must be at least 1")
    if not is_sha256(content_sha256):
        raise ValueError("shard assignment needs a SHA-256 content hash")
    return int(content_sha256[:16], 16) % shards


def seeded_key(seed: str, content_sha256: str) -> str:
    """Stable pseudo-random ordering key for deterministic selection."""
    return sha256_text(f"{seed}\x00{content_sha256}")

"""Near-copy leak guard: catches resized or re-encoded frozen test images.

Frozen locks pin SHA-256 hashes, so a resized or re-encoded copy of a test
image would pass the exact guard. When the frozen images sit next to their
lock, this module reads them (never writes), checks each file still matches
its locked hash, and computes pHash and dHash. Training items within the
near-duplicate thresholds of any frozen image are leaks. Fingerprints are
cached by content hash so large frozen sets are decoded once.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any

from .dedup import MultiIndex, NearDupConfig
from .hashing import canonical_json, is_sha256, sha256_bytes
from .holdout import FrozenSet
from .imaging import DecodedImage, DecodeLimits, decode
from .perceptual import dhash, from_hex, hamming, phash, to_hex

CACHE_SCHEMA = "beljour-frozen-prints/1"


@dataclass(frozen=True)
class FrozenPrint:
    """Perceptual fingerprint of one frozen test image."""

    sha256: str
    set_name: str
    phash: int
    dhash: int


@dataclass(frozen=True)
class PrintStats:
    """How many frozen images could be fingerprinted."""

    printed: int
    missing: int
    changed: int
    unreadable: int

    def to_dict(self) -> dict[str, int]:
        """JSON form for reports."""
        return {"printed": self.printed, "missing": self.missing, "changed": self.changed,
                "unreadable": self.unreadable}


def _load_cache(path: Path | None) -> dict[str, tuple[str, str]]:
    if path is None or not path.is_file():
        return {}
    cache: dict[str, tuple[str, str]] = {}
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except ValueError:
                continue
            if (isinstance(row, dict) and row.get("schema") == CACHE_SCHEMA
                    and is_sha256(row.get("sha256"))):
                cache[str(row["sha256"])] = (str(row["phash"]), str(row["dhash"]))
    return cache


def _save_cache(path: Path | None, cache: dict[str, tuple[str, str]]) -> None:
    if path is None:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".partial")
    with tmp.open("w", encoding="utf-8") as handle:
        for digest in sorted(cache):
            p_hex, d_hex = cache[digest]
            handle.write(canonical_json({"schema": CACHE_SCHEMA, "sha256": digest,
                                         "phash": p_hex, "dhash": d_hex}) + "\n")
    os.replace(tmp, path)


def _frozen_file(lock_path: Path, rel_path: str) -> Path | None:
    pure = PurePosixPath(rel_path)
    if pure.is_absolute() or ".." in pure.parts:
        return None
    target = lock_path.parent / rel_path
    if target.is_symlink() or not target.is_file():
        return None
    return target


def fingerprint_sets(sets: Sequence[FrozenSet], *, cache_path: Path | None = None,
                     limits: DecodeLimits | None = None
                     ) -> tuple[list[FrozenPrint], PrintStats]:
    """Fingerprints of every frozen image that is present and unchanged."""
    cache = _load_cache(cache_path)
    active = limits or DecodeLimits()
    prints: list[FrozenPrint] = []
    missing = changed = unreadable = 0
    for frozen in sets:
        for digest, rel_path in frozen.faces:
            if digest in cache:
                p_hex, d_hex = cache[digest]
                prints.append(FrozenPrint(digest, frozen.name, from_hex(p_hex), from_hex(d_hex)))
                continue
            target = _frozen_file(frozen.lock_path, rel_path)
            if target is None:
                missing += 1
                continue
            data = target.read_bytes()
            if sha256_bytes(data) != digest:
                changed += 1
                continue
            decoded = decode(data, active)
            if not isinstance(decoded, DecodedImage):
                unreadable += 1
                continue
            p_value, d_value = phash(decoded.rgb), dhash(decoded.rgb)
            cache[digest] = (to_hex(p_value), to_hex(d_value))
            prints.append(FrozenPrint(digest, frozen.name, p_value, d_value))
    _save_cache(cache_path, cache)
    return prints, PrintStats(len(prints), missing, changed, unreadable)


@dataclass(frozen=True)
class NearLeak:
    """A training image close to a frozen test image."""

    content_sha256: str
    frozen_sha256: str
    frozen_set: str
    phash_distance: int
    dhash_distance: int

    def to_dict(self) -> dict[str, Any]:
        """JSON form for reports."""
        return {"content_sha256": self.content_sha256, "frozen_sha256": self.frozen_sha256,
                "frozen_set": self.frozen_set, "phash_distance": self.phash_distance,
                "dhash_distance": self.dhash_distance}


class NearHoldoutGuard:
    """Near-duplicate search of training hashes against frozen fingerprints."""

    def __init__(self, prints: Sequence[FrozenPrint], config: NearDupConfig) -> None:
        self.prints = list(prints)
        self.config = config
        self._index = MultiIndex([item.phash for item in self.prints], config.phash_threshold)

    def match(self, content_sha256: str, p_value: int, d_value: int) -> NearLeak | None:
        """Closest frozen image within both thresholds, or None."""
        best: NearLeak | None = None
        for position, p_dist in self._index.query(p_value):
            frozen = self.prints[position]
            d_dist = hamming(frozen.dhash, d_value)
            if d_dist > self.config.dhash_threshold:
                continue
            candidate = NearLeak(content_sha256, frozen.sha256, frozen.set_name, p_dist, d_dist)
            if best is None or (p_dist, d_dist, frozen.sha256) < (
                    best.phash_distance, best.dhash_distance, best.frozen_sha256):
                best = candidate
        return best

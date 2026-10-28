"""SQLite store of earlier card designs (stdlib sqlite3 only).

One row per issued design: exact fingerprint, near-match bucket, parameter vector and,
when computed, the perceptual hash. Perceptual hashes are cached in memory per look as a
NumPy array so a near-duplicate scan is one vectorised XOR and popcount.
Author: John Khan.
"""

from __future__ import annotations

import sqlite3
import struct
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from types import TracebackType

import numpy as np
from numpy.typing import NDArray

from .errors import DesignStoreError
from .fingerprint import DesignKey, param_distance

SCHEMA = """
CREATE TABLE IF NOT EXISTS designs (
    fingerprint TEXT PRIMARY KEY,
    occasion TEXT NOT NULL,
    look TEXT NOT NULL,
    bucket TEXT NOT NULL,
    vector BLOB NOT NULL,
    phash INTEGER,
    seed INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS designs_bucket ON designs (bucket);
CREATE INDEX IF NOT EXISTS designs_look ON designs (occasion, look);
"""

_SIGN = 1 << 63
_WRAP = 1 << 64


def _to_signed(value: int) -> int:
    return value - _WRAP if value >= _SIGN else value


def _to_unsigned(value: int) -> int:
    return value + _WRAP if value < 0 else value


def _pack(vector: tuple[float, ...]) -> bytes:
    return struct.pack(f"<{len(vector)}d", *vector)


def _unpack(blob: bytes) -> tuple[float, ...]:
    return struct.unpack(f"<{len(blob) // 8}d", blob)


def _popcount64(values: NDArray[np.uint64]) -> NDArray[np.uint64]:
    # SWAR popcount; works on every NumPy version without bitwise_count.
    v = values - ((values >> np.uint64(1)) & np.uint64(0x5555555555555555))
    v = (v & np.uint64(0x3333333333333333)) + ((v >> np.uint64(2)) & np.uint64(0x3333333333333333))
    v = (v + (v >> np.uint64(4))) & np.uint64(0x0F0F0F0F0F0F0F0F)
    counts: NDArray[np.uint64] = (v * np.uint64(0x0101010101010101)) >> np.uint64(56)
    return counts


class DesignStore:
    """Persistent record of every design issued, used to refuse repeats."""

    def __init__(self, path: str | Path = ":memory:") -> None:
        self.path = str(path)
        try:
            # One connection may serve several web worker threads; _lock serialises them.
            self._db = sqlite3.connect(self.path, timeout=10.0, check_same_thread=False)
            if self.path != ":memory:":
                self._db.execute("PRAGMA journal_mode=WAL")
                self._db.execute("PRAGMA synchronous=NORMAL")
            self._db.executescript(SCHEMA)
            self._db.commit()
        except sqlite3.DatabaseError as exc:
            raise DesignStoreError(f"design store cannot be opened: {exc}") from None
        # Per look: hashes loaded so far and the highest rowid read, so rows written by
        # other handles on the same file are picked up on the next scan.
        self._hashes: dict[tuple[str, str], tuple[NDArray[np.uint64], int]] = {}
        self._deferred = False
        self._lock = threading.RLock()

    def close(self) -> None:
        with self._lock:
            self._db.close()

    def __enter__(self) -> DesignStore:
        return self

    def __exit__(self, kind: type[BaseException] | None, exc: BaseException | None,
                 trace: TracebackType | None) -> None:
        self.close()

    @contextmanager
    def _transaction(self, begin: str) -> Iterator[DesignStore]:
        # One transaction at a time; a nested exclusive() or batch() joins the outer one.
        with self._lock:
            if self._deferred:
                yield self
                return
            try:
                self._db.execute(begin)
            except sqlite3.OperationalError as exc:
                raise DesignStoreError(f"design store is busy: {exc}") from None
            self._deferred = True
            try:
                yield self
            except BaseException:
                self._deferred = False
                self._db.rollback()
                raise
            self._deferred = False
            try:
                self._db.commit()
            except sqlite3.Error as exc:
                self._db.rollback()
                raise DesignStoreError(f"design store cannot save: {exc}") from None

    @contextmanager
    def exclusive(self) -> Iterator[DesignStore]:
        """Hold the write lock while checking and inserting one design.

        Other processes sharing the file wait, so two of them cannot both pass the near-match
        checks and then insert near-duplicates. Inside batch() the batch transaction is used.
        """
        with self._transaction("BEGIN IMMEDIATE") as store:
            yield store

    @contextmanager
    def batch(self) -> Iterator[DesignStore]:
        """Group many inserts into one transaction; nothing is kept if the body raises."""
        with self._transaction("BEGIN IMMEDIATE") as store:
            yield store

    def __len__(self) -> int:
        with self._lock:
            row = self._db.execute("SELECT COUNT(*) FROM designs").fetchone()
        return int(row[0])

    def has_fingerprint(self, fingerprint: str) -> bool:
        with self._lock:
            row = self._db.execute("SELECT 1 FROM designs WHERE fingerprint = ?",
                                   (fingerprint,)).fetchone()
        return row is not None

    def nearest_param(self, key: DesignKey) -> float:
        """Smallest parameter distance to any stored design in the same bucket."""
        best = float("inf")
        with self._lock:
            rows = self._db.execute("SELECT vector FROM designs WHERE bucket = ?",
                                    (key.bucket,)).fetchall()
        for (blob,) in rows:
            best = min(best, param_distance(key.vector, _unpack(blob)))
        return best

    def _look_hashes(self, occasion: str, look: str) -> NDArray[np.uint64]:
        cache_key = (occasion, look)
        hashes, last = self._hashes.get(cache_key, (np.zeros(0, dtype=np.uint64), 0))
        with self._lock:
            rows = self._db.execute(
                "SELECT rowid, phash FROM designs WHERE occasion = ? AND look = ? "
                "AND phash IS NOT NULL AND rowid > ? ORDER BY rowid",
                (occasion, look, last)).fetchall()
        if rows:
            fresh = np.array([_to_unsigned(r[1]) for r in rows], dtype=np.uint64)
            hashes = np.concatenate((hashes, fresh))
            last = int(rows[-1][0])
        self._hashes[cache_key] = (hashes, last)
        return hashes

    def nearest_phash(self, occasion: str, look: str, phash: int) -> int:
        """Smallest Hamming distance to a stored perceptual hash of the same look (65 if none)."""
        hashes = self._look_hashes(occasion, look)
        if hashes.size == 0:
            return 65
        distances = _popcount64(np.bitwise_xor(hashes, np.uint64(phash)))
        return int(np.min(distances))

    def add(self, key: DesignKey, occasion: str, look: str, seed: int,
            phash: int | None = None) -> bool:
        """Record an issued design; False when another handle stored the same one first."""
        with self._lock:
            try:
                self._db.execute(
                    "INSERT INTO designs (fingerprint, occasion, look, bucket, vector, phash, "
                    "seed) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (key.fingerprint, occasion, look, key.bucket, _pack(key.vector),
                     None if phash is None else _to_signed(phash), seed))
            except sqlite3.IntegrityError:
                if not self._deferred:
                    self._db.rollback()
                return False
            if not self._deferred:
                self._db.commit()
            return True

    def fingerprints(self, occasion: str | None = None) -> list[str]:
        """Every stored fingerprint, optionally for one occasion."""
        with self._lock:
            if occasion is None:
                rows = self._db.execute("SELECT fingerprint FROM designs").fetchall()
            else:
                rows = self._db.execute("SELECT fingerprint FROM designs WHERE occasion = ?",
                                        (occasion,)).fetchall()
        return [str(r[0]) for r in rows]

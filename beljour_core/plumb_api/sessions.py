"""Browser sessions: an id the web app makes up per tab, units spent under it, and whether a
judge code was entered.

A session id is not a login. Anyone can make a new one, so the per-session cap only slows a
person down; the daily cap and the balance floor (limits.py) are the hard limits. Requests
that send no session id all share the "anonymous" session and so share one public cap.

Judge codes are stored as sha256 digests in the environment (BELJOUR_JUDGE_CODE_HASHES),
compared in constant time, and each session gets a few attempts before it is locked out.

Author: John Khan.
"""
from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import sqlite3
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

ANONYMOUS = "anonymous"
SESSION_HEADER = "x-beljour-session"
_ID = re.compile(r"^[A-Za-z0-9_-]{16,64}$")


def valid_session_id(value: str | None) -> bool:
    return bool(value) and bool(_ID.match(value or ""))


def new_session_id() -> str:
    return secrets.token_urlsafe(18)


def hash_code(code: str) -> str:
    """The digest to put in BELJOUR_JUDGE_CODE_HASHES. Codes are trimmed and upper-cased so
    "abcd-1234 " and "ABCD-1234" are the same code."""
    return hashlib.sha256(code.strip().upper().encode()).hexdigest()


def make_judge_code(groups: int = 3, size: int = 4) -> str:
    """A code that is easy to read aloud: no 0/O or 1/I/L."""
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "-".join("".join(secrets.choice(alphabet) for _ in range(size)) for _ in range(groups))


@dataclass(frozen=True)
class JudgeAttempt:
    ok: bool
    attempts_left: int
    locked: bool


class SessionStore:
    def __init__(self, path: Path, clock: Callable[[], float] = time.time):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._clock = clock
        self._lock = threading.Lock()
        self._db = sqlite3.connect(self.path, check_same_thread=False)
        self._db.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions(
              id TEXT PRIMARY KEY, created REAL NOT NULL, last_seen REAL NOT NULL,
              units INTEGER NOT NULL DEFAULT 0, judge INTEGER NOT NULL DEFAULT 0,
              judge_failures INTEGER NOT NULL DEFAULT 0);
            """
        )

    def touch(self, session_id: str) -> None:
        now = self._clock()
        with self._lock:
            self._db.execute(
                "INSERT INTO sessions(id, created, last_seen) VALUES(?,?,?) "
                "ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen", (session_id, now, now))
            self._db.commit()

    def _row(self, session_id: str) -> tuple[int, int, int] | None:
        with self._lock:
            row = self._db.execute("SELECT units, judge, judge_failures FROM sessions WHERE id=?",
                                   (session_id,)).fetchone()
        return (int(row[0]), int(row[1]), int(row[2])) if row else None

    def spent(self, session_id: str) -> int:
        row = self._row(session_id)
        return row[0] if row else 0

    def is_judge(self, session_id: str) -> bool:
        row = self._row(session_id)
        return bool(row and row[1])

    def failures(self, session_id: str) -> int:
        row = self._row(session_id)
        return row[2] if row else 0

    def add_spend(self, session_id: str, units: int) -> int:
        """Add (or, with a negative number, refund) units. Never goes below zero."""
        self.touch(session_id)
        with self._lock:
            self._db.execute("UPDATE sessions SET units = MAX(0, units + ?) WHERE id=?", (units, session_id))
            self._db.commit()
        return self.spent(session_id)

    def try_judge_code(self, session_id: str, code: str, hashes: tuple[str, ...], max_attempts: int) -> JudgeAttempt:
        if session_id == ANONYMOUS:
            return JudgeAttempt(False, 0, True)
        self.touch(session_id)
        failures = self.failures(session_id)
        if self.is_judge(session_id):
            return JudgeAttempt(True, max_attempts - failures, False)
        if failures >= max_attempts:
            return JudgeAttempt(False, 0, True)
        digest = hash_code(code) if code.strip() else ""
        ok = bool(digest) and any(hmac.compare_digest(digest, h) for h in hashes)
        with self._lock:
            if ok:
                self._db.execute("UPDATE sessions SET judge=1 WHERE id=?", (session_id,))
            else:
                self._db.execute("UPDATE sessions SET judge_failures = judge_failures + 1 WHERE id=?", (session_id,))
            self._db.commit()
        left = max(0, max_attempts - self.failures(session_id))
        return JudgeAttempt(ok, left, not ok and left == 0)

    def prune(self, idle_s: float) -> int:
        cutoff = self._clock() - idle_s
        with self._lock:
            cur = self._db.execute("DELETE FROM sessions WHERE last_seen < ? AND id != ?", (cutoff, ANONYMOUS))
            self._db.commit()
        return int(cur.rowcount or 0)

"""Task ledger: a durable note of every YouCam task before and after it is created.

Why: a task that is created twice is paid twice, and a task that is created but never
polled can still be charged. The ledger makes three promises:

  1. A request key is written as `creating` BEFORE the create call goes out.
  2. While a key is `creating`, `created` or `ambiguous`, no second task is created for it.
  3. If the create reply is lost (timeout, dropped connection, server error), the key is
     marked `ambiguous` and is never retried automatically. A person checks the credit
     history and clears it with scripts/ledger.py.

States:
    creating  -> created    the reply carried a task id
    creating  -> failed     YouCam refused the request (4xx) or it never left this server
    creating  -> ambiguous  we can't tell whether a task exists
    created   -> succeeded  result fetched and cached
    created   -> failed     the task itself ended in error
    failed / succeeded -> creating   a new attempt (the old result expired or was refused)

The ledger lives in SQLite under the data dir. On a free host the disk can be wiped by a
restart, so the browser also keeps pending task ids (signed, see tickets.py) and can hand
them back with `adopt`.

Author: John Khan.
"""
from __future__ import annotations

import sqlite3
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

CREATING, CREATED, SUCCEEDED, FAILED, AMBIGUOUS = "creating", "created", "succeeded", "failed", "ambiguous"
STATES = (CREATING, CREATED, SUCCEEDED, FAILED, AMBIGUOUS)
OPEN_STATES = (CREATING, CREATED, AMBIGUOUS)
_NEXT: dict[str, tuple[str, ...]] = {
    CREATING: (CREATED, FAILED, AMBIGUOUS),
    CREATED: (SUCCEEDED, FAILED),
    SUCCEEDED: (CREATING,),
    FAILED: (CREATING,),
    AMBIGUOUS: (),          # only a person clears an ambiguous entry
}


class LedgerConflict(Exception):
    """A task for this key is already open. Carries the current entry."""

    def __init__(self, entry: TaskEntry):
        super().__init__(f"{entry.request_key} is {entry.status}")
        self.entry = entry


class BadTransition(Exception):
    pass


@dataclass(frozen=True)
class TaskEntry:
    request_key: str
    feature: str
    version: str
    status: str
    task_id: str | None
    session_id: str | None
    owner_sha: str | None
    units: int
    attempts: int
    error: str | None
    created_at: float
    updated_at: float

    @property
    def open(self) -> bool:
        return self.status in OPEN_STATES

    def to_json(self) -> dict:
        return {"request_key": self.request_key, "feature": self.feature, "version": self.version,
                "status": self.status, "task_id": self.task_id, "units": self.units,
                "attempts": self.attempts, "error": self.error,
                "created_at": self.created_at, "updated_at": self.updated_at}


_COLUMNS = "request_key,feature,version,status,task_id,session_id,owner_sha,units,attempts,error,created_at,updated_at"


class TaskLedger:
    def __init__(self, path: Path, clock: Callable[[], float] = time.time):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._clock = clock
        self._lock = threading.Lock()
        self._db = sqlite3.connect(self.path, check_same_thread=False)
        self._db.executescript(
            """
            CREATE TABLE IF NOT EXISTS tasks(
              request_key TEXT PRIMARY KEY, feature TEXT NOT NULL, version TEXT NOT NULL,
              status TEXT NOT NULL, task_id TEXT, session_id TEXT, owner_sha TEXT,
              units INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 1,
              error TEXT, created_at REAL NOT NULL, updated_at REAL NOT NULL);
            CREATE INDEX IF NOT EXISTS tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS tasks_session ON tasks(session_id);
            CREATE UNIQUE INDEX IF NOT EXISTS tasks_task_id ON tasks(task_id) WHERE task_id IS NOT NULL;
            """
        )

    # reads -----------------------------------------------------------------
    def get(self, request_key: str) -> TaskEntry | None:
        with self._lock:
            row = self._db.execute(f"SELECT {_COLUMNS} FROM tasks WHERE request_key=?", (request_key,)).fetchone()
        return TaskEntry(*row) if row else None

    def by_task_id(self, task_id: str) -> TaskEntry | None:
        with self._lock:
            row = self._db.execute(f"SELECT {_COLUMNS} FROM tasks WHERE task_id=?", (task_id,)).fetchone()
        return TaskEntry(*row) if row else None

    def entries(self, status: str | None = None, session_id: str | None = None, limit: int = 200) -> list[TaskEntry]:
        sql = f"SELECT {_COLUMNS} FROM tasks WHERE 1=1"
        args: list[object] = []
        if status:
            sql += " AND status=?"
            args.append(status)
        if session_id:
            sql += " AND session_id=?"
            args.append(session_id)
        sql += " ORDER BY updated_at DESC LIMIT ?"
        args.append(limit)
        with self._lock:
            rows = self._db.execute(sql, args).fetchall()
        return [TaskEntry(*r) for r in rows]

    def pending(self, session_id: str | None = None) -> list[TaskEntry]:
        return [e for e in self.entries(session_id=session_id) if e.status in (CREATING, CREATED)]

    def revoke_photo_session(self, owner_sha: str, session_id: str) -> int:
        """Drop a deleted photo's task-read grant for this one browser session.

        A signed resumed job may finish after the original upload has gone, so its
        recorded private session can read the result. Explicit deletion must revoke
        that grant too, including while another session still owns the same bytes.
        Keep the task and spend ledger: deletion must never enable a second charge.
        """
        with self._lock:
            changed = self._db.execute(
                "UPDATE tasks SET session_id=NULL WHERE owner_sha=? AND session_id=?",
                (owner_sha, session_id),
            ).rowcount
            self._db.commit()
        return changed

    def has_private_photo_session(self, owner_sha: str) -> bool:
        """Whether a remaining private session can read a task for this source.

        Photo-owner files may have expired or vanished during a restart. Their
        absence alone is therefore not permission to purge another session's result.
        """
        with self._lock:
            row = self._db.execute(
                "SELECT 1 FROM tasks WHERE owner_sha=? AND session_id IS NOT NULL "
                "AND session_id NOT IN ('', 'anonymous') LIMIT 1", (owner_sha,),
            ).fetchone()
        return row is not None

    def counts(self) -> dict[str, int]:
        with self._lock:
            rows = self._db.execute("SELECT status, COUNT(*) FROM tasks GROUP BY status").fetchall()
        out = {s: 0 for s in STATES}
        out.update({s: int(n) for s, n in rows})
        return out

    # writes ----------------------------------------------------------------
    def begin(self, request_key: str, feature: str, version: str, *, session_id: str | None = None,
              owner_sha: str | None = None, units: int = 0) -> TaskEntry:
        """Write `creating` before any create call. Raises LedgerConflict if a task for this
        key may already exist."""
        now = self._clock()
        with self._lock:
            row = self._db.execute(f"SELECT {_COLUMNS} FROM tasks WHERE request_key=?", (request_key,)).fetchone()
            if row:
                current = TaskEntry(*row)
                if current.status in OPEN_STATES:
                    raise LedgerConflict(current)
                self._db.execute(
                    "UPDATE tasks SET status=?, task_id=NULL, feature=?, version=?, session_id=?, owner_sha=?, units=?,"
                    " attempts=attempts+1, error=NULL, updated_at=? WHERE request_key=?",
                    (CREATING, feature, version, session_id, owner_sha, units, now, request_key))
            else:
                self._db.execute(
                    f"INSERT INTO tasks({_COLUMNS}) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
                    (request_key, feature, version, CREATING, None, session_id, owner_sha, units, 1, None, now, now))
            self._db.commit()
        entry = self.get(request_key)
        assert entry is not None
        return entry

    def _move(self, request_key: str, to: str, *, task_id: str | None = None, error: str | None = None) -> TaskEntry:
        now = self._clock()
        with self._lock:
            row = self._db.execute("SELECT status FROM tasks WHERE request_key=?", (request_key,)).fetchone()
            if not row:
                raise BadTransition(f"{request_key} is not in the ledger")
            if to not in _NEXT[row[0]]:
                raise BadTransition(f"{request_key}: {row[0]} -> {to} is not allowed")
            if task_id is not None:
                self._db.execute("UPDATE tasks SET status=?, task_id=?, error=?, updated_at=? WHERE request_key=?",
                                 (to, task_id, error, now, request_key))
            else:
                self._db.execute("UPDATE tasks SET status=?, error=?, updated_at=? WHERE request_key=?",
                                 (to, error, now, request_key))
            self._db.commit()
        entry = self.get(request_key)
        assert entry is not None
        return entry

    def created(self, request_key: str, task_id: str) -> TaskEntry:
        if not task_id:
            raise BadTransition("a created task needs its task id")
        return self._move(request_key, CREATED, task_id=task_id)

    def succeeded(self, request_key: str) -> TaskEntry:
        return self._move(request_key, SUCCEEDED)

    def failed(self, request_key: str, error: str) -> TaskEntry:
        return self._move(request_key, FAILED, error=error[:500])

    def ambiguous(self, request_key: str, error: str) -> TaskEntry:
        return self._move(request_key, AMBIGUOUS, error=error[:500])

    def adopt(self, request_key: str, feature: str, version: str, task_id: str, *,
              session_id: str | None = None, owner_sha: str | None = None, units: int = 0) -> TaskEntry:
        """Re-enter a task the browser still remembers after the server lost its ledger.
        Adopting never creates a task; it only lets polling resume. A key already known to
        the ledger keeps its own record."""
        existing = self.get(request_key)
        if existing:
            if existing.task_id and existing.task_id != task_id:
                raise BadTransition(f"{request_key} already belongs to another task")
            if existing.status == CREATING:
                return self.created(request_key, task_id)
            return existing
        other = self.by_task_id(task_id)
        if other:
            raise BadTransition(f"task {task_id} already belongs to {other.request_key}")
        now = self._clock()
        with self._lock:
            self._db.execute(
                f"INSERT INTO tasks({_COLUMNS}) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
                (request_key, feature, version, CREATED, task_id, session_id, owner_sha, units, 1,
                 "adopted after restart", now, now))
            self._db.commit()
        entry = self.get(request_key)
        assert entry is not None
        return entry

    def clear(self, request_key: str, note: str = "cleared by hand") -> TaskEntry:
        """For a person, after checking the credit history: an ambiguous (or stuck creating)
        entry becomes failed, so the request can run again."""
        entry = self.get(request_key)
        if not entry:
            raise BadTransition(f"{request_key} is not in the ledger")
        if entry.status not in (AMBIGUOUS, CREATING):
            raise BadTransition(f"only ambiguous or creating entries can be cleared, not {entry.status}")
        now = self._clock()
        with self._lock:
            self._db.execute("UPDATE tasks SET status=?, error=?, updated_at=? WHERE request_key=?",
                             (FAILED, note[:500], now, request_key))
            self._db.commit()
        cleared = self.get(request_key)
        assert cleared is not None
        return cleared

    def stale_creating(self, older_than_s: float) -> list[TaskEntry]:
        """`creating` entries older than this were interrupted mid-create (a crash between
        writing the entry and reading the reply). They are as ambiguous as a lost reply."""
        cutoff = self._clock() - older_than_s
        return [e for e in self.entries(status=CREATING) if e.updated_at < cutoff]

    def sweep(self, older_than_s: float = 600.0) -> int:
        """Move interrupted `creating` entries to `ambiguous`. Returns how many moved."""
        moved = 0
        for entry in self.stale_creating(older_than_s):
            self.ambiguous(entry.request_key, "interrupted while creating; check the credit history")
            moved += 1
        return moved

    def prune(self, older_than_s: float) -> int:
        """Delete finished entries (succeeded, failed) older than this. Open ones stay."""
        cutoff = self._clock() - older_than_s
        with self._lock:
            cur = self._db.execute("DELETE FROM tasks WHERE status IN (?,?) AND updated_at < ?",
                                   (SUCCEEDED, FAILED, cutoff))
            self._db.commit()
        return int(cur.rowcount or 0)

    def close(self) -> None:
        with self._lock:
            self._db.close()

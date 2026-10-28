"""Bounded in-memory foreground scene queue with cancellation and status safety. Author: John Khan."""

from __future__ import annotations

import secrets
import threading
from collections import deque
from dataclasses import dataclass, field
from typing import Any

from .contracts import GenerationRefused, SceneRequest
from .pipeline import GeneratedBatch, SceneRenderer

MAX_PENDING = 12
MAX_HISTORY = 32


@dataclass
class _Task:
    request: SceneRequest | None
    cancel: threading.Event = field(default_factory=threading.Event)
    state: str = "queued"
    result: GeneratedBatch | None = None
    reason: str | None = None


class BoundedSceneQueue:
    """One foreground worker; no disk persistence, remote workers or silent retries."""

    def __init__(self, renderer: SceneRenderer, *, pending_limit: int = MAX_PENDING) -> None:
        if not 1 <= pending_limit <= MAX_PENDING:
            raise ValueError("Invalid scene queue limit")
        self._renderer = renderer
        self._pending_limit = pending_limit
        self._lock = threading.Lock()
        self._signal = threading.Condition(self._lock)
        self._pending: deque[str] = deque()
        self._jobs: dict[str, _Task] = {}
        self._closed = False
        self._worker = threading.Thread(target=self._run, name="beljour-scene-lab", daemon=True)
        self._worker.start()

    def submit(self, request: SceneRequest) -> str:
        request.validate()
        with self._signal:
            if self._closed:
                raise GenerationRefused("generation_queue_closed")
            if len(self._pending) >= self._pending_limit or len(self._jobs) >= MAX_HISTORY:
                raise GenerationRefused("generation_queue_full")
            identifier = secrets.token_hex(16)
            while identifier in self._jobs:
                identifier = secrets.token_hex(16)
            self._jobs[identifier] = _Task(request)
            self._pending.append(identifier)
            self._signal.notify()
            return identifier

    def cancel(self, identifier: str) -> None:
        with self._signal:
            task = self._jobs.get(identifier)
            if task is None:
                raise GenerationRefused("generation_job_unknown")
            task.cancel.set()
            if task.state == "queued":
                task.state = "cancelled"
                task.request = None
                self._pending.remove(identifier)
            self._signal.notify_all()

    def status(self, identifier: str) -> dict[str, Any]:
        with self._signal:
            job = self._jobs.get(identifier)
            if job is None:
                raise GenerationRefused("generation_job_unknown")
            return {
                "schema": "beljour-scene-queue/1",
                "state": job.state,
                "reason": job.reason,
                "count": len(job.result.scenes) if job.result is not None else 0,
                "privacy": "LOCAL_EPHEMERAL",
            }

    def take(self, identifier: str) -> GeneratedBatch:
        """Consume once, discarding any retained pixels and private prompt immediately."""
        with self._signal:
            task = self._jobs.get(identifier)
            if task is None:
                raise GenerationRefused("generation_job_unknown")
            if task.state != "complete" or task.result is None:
                raise GenerationRefused("generation_result_not_available")
            result = task.result
            del self._jobs[identifier]
            return result

    def dismiss(self, identifier: str) -> None:
        with self._signal:
            task = self._jobs.get(identifier)
            if task is None:
                return
            task.cancel.set()
            task.result = None
            if identifier in self._pending:
                self._pending.remove(identifier)
            del self._jobs[identifier]

    def close(self) -> None:
        with self._signal:
            self._closed = True
            for job in self._jobs.values():
                job.cancel.set()
                job.request = None
                job.result = None
            self._pending.clear()
            self._signal.notify_all()
        self._worker.join(timeout=2.0)
        if self._worker.is_alive():
            raise GenerationRefused("generation_backend_uncooperative")
        with self._signal:
            self._jobs.clear()

    def _run(self) -> None:
        while True:
            with self._signal:
                self._signal.wait_for(lambda: bool(self._pending) or self._closed)
                if self._closed:
                    return
                identifier = self._pending.popleft()
                job = self._jobs.get(identifier)
                if job is None or job.cancel.is_set() or job.request is None:
                    continue
                request = job.request
                job.state = "running"
            try:
                rendered = self._renderer.render(request, job.cancel)
                state = "complete"
                reason = None
            except GenerationRefused as exc:
                rendered = None
                state = "refused"
                reason = exc.code
            except Exception:
                rendered = None
                state = "refused"
                reason = "generation_runtime_failed"
            with self._signal:
                if identifier not in self._jobs:
                    continue
                job.request = None
                job.state = "cancelled" if job.cancel.is_set() else state
                job.reason = "generation_cancelled" if job.cancel.is_set() else reason
                job.result = rendered if job.state == "complete" else None
                self._signal.notify_all()

    def __enter__(self) -> BoundedSceneQueue:
        return self

    def __exit__(self, exc_type: object, exc: object, tb: object) -> None:
        self.close()

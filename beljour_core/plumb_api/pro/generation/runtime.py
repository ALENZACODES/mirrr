"""Authenticated in-memory model loading behind a local inference protocol. Author: John Khan."""

from __future__ import annotations

import threading
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Protocol

from ..training.sealed_store import ArtefactProtectionError, SealedStore
from .contracts import MODEL_ID, GenerationRefused, SceneRequest
from .rights import AllowedModel


@dataclass(frozen=True)
class GeneratedPixels:
    encoded: bytes
    measured_gpu_ms: float | None


class LocalSchnellBackend(Protocol):
    """Operator-supplied, locally installed runtime. No remote inference interface."""

    def begin(self, model_id: str, revision: str) -> None: ...

    def feed_encrypted_shard(self, index: int, recovered: memoryview) -> None: ...

    def ready(self) -> bool: ...

    def generate(self, request: SceneRequest, cancelled: threading.Event) -> tuple[GeneratedPixels, ...]: ...

    def close(self) -> None: ...


@contextmanager
def load_runtime(
    approved: AllowedModel,
    store: SealedStore,
    make_backend: Callable[[], LocalSchnellBackend],
) -> Iterator[LocalSchnellBackend]:
    """Decrypt one shard at a time into RAM and zero it after the backend consumes it."""
    if not approved.bundle.shards or store.key_id != approved.bundle.sealed_key_id:
        raise GenerationRefused("generation_model_unapproved")
    backend = make_backend()
    try:
        backend.begin(MODEL_ID, approved.bundle.revision)
        for index, shard in enumerate(approved.bundle.shards):
            path = approved.encrypted_root / shard.filename
            if store.ciphertext_digest(path) != shard.ciphertext_sha256:
                raise GenerationRefused("generation_shard_changed")
            with store.opened(path, kind="weights", binding=approved.bundle.binding(index)) as data:
                backend.feed_encrypted_shard(index, memoryview(data))
        if not backend.ready():
            raise GenerationRefused("generation_runtime_not_ready")
        yield backend
    except ArtefactProtectionError as exc:
        raise GenerationRefused("generation_encrypted_weights_invalid") from exc
    finally:
        backend.close()

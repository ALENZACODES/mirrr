"""Session-only bounded caches for previews and pluggable face embeddings.

Keys bind the exact input bytes, model provenance and command policy. Stored
frames and vectors never go to disk, telemetry, provider APIs or browser cache.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from collections import OrderedDict
from dataclasses import dataclass

from .embedders import EmbedderEvidence, FaceEmbedder
from .errors import CommandValidationError
from .frames import ImageFrame


def frame_digest(frame: ImageFrame) -> str:
    """Hash immutable pixels and dimensions; never return the digest in public reports."""
    header = f"{frame.width}x{frame.height}x{frame.channels}:".encode("ascii")
    checksum = hashlib.sha256()
    checksum.update(header)
    checksum.update(frame.pixels)
    return checksum.hexdigest()


def evidence_digest(evidence: EmbedderEvidence) -> str:
    checksum = hashlib.sha256()
    for value in (
        evidence.model_id,
        evidence.weights_sha256 or "unweighted",
        evidence.implementation_licence,
        evidence.weights_licence or "unlicensed",
        str(evidence.commercial_use_verified),
        str(evidence.real_face_validation_passed),
        str(evidence.synthetic_only),
    ):
        checksum.update(value.encode("utf-8"))
        checksum.update(b"\x00")
    return checksum.hexdigest()


@dataclass(frozen=True, slots=True)
class CacheStats:
    entries: int
    retained_bytes: int
    hits: int
    misses: int
    evictions: int

    def public_metadata(self) -> dict[str, int]:
        return {
            "entries": self.entries,
            "retained_bytes": self.retained_bytes,
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
        }


class FrameCache:
    """Bounded LRU, no cross-session global state, never caches raw names or paths."""

    def __init__(self, *, max_bytes: int = 48 * 1024 * 1024, max_entries: int = 32) -> None:
        if type(max_bytes) is not int or type(max_entries) is not int:
            raise CommandValidationError("invalid_cache_budget", "Cache budgets must be integers.")
        if not 1 <= max_bytes <= 256 * 1024 * 1024 or not 1 <= max_entries <= 256:
            raise CommandValidationError("invalid_cache_budget", "Cache budget is outside safe bounds.")
        self._maximum = max_bytes
        self._max_entries = max_entries
        self._stored: OrderedDict[str, ImageFrame] = OrderedDict()
        self._retained_bytes = 0
        self._hits = 0
        self._misses = 0
        self._evictions = 0

    @property
    def stats(self) -> CacheStats:
        return CacheStats(
            len(self._stored), self._retained_bytes, self._hits, self._misses, self._evictions,
        )

    def get(self, key: str) -> ImageFrame | None:
        frame = self._stored.get(key)
        if frame is None:
            self._misses += 1
            return None
        self._stored.move_to_end(key)
        self._hits += 1
        return frame

    def put(self, key: str, frame: ImageFrame) -> None:
        if not isinstance(key, str) or len(key) != 64 or not isinstance(frame, ImageFrame):
            raise CommandValidationError("invalid_cache_entry", "Cache key or image is invalid.")
        previous = self._stored.pop(key, None)
        if previous is not None:
            self._retained_bytes -= previous.byte_size
        if frame.byte_size > self._maximum:
            return
        while self._stored and (
            self._retained_bytes + frame.byte_size > self._maximum
            or len(self._stored) >= self._max_entries
        ):
            _, removed = self._stored.popitem(last=False)
            self._retained_bytes -= removed.byte_size
            self._evictions += 1
        self._stored[key] = frame
        self._retained_bytes += frame.byte_size

    def clear(self) -> None:
        self._stored.clear()
        self._retained_bytes = 0

    @staticmethod
    def make_key(
        image: ImageFrame,
        plan_fingerprint: str,
        evidence: EmbedderEvidence,
        quality: str,
    ) -> str:
        if quality not in ("preview", "export"):
            raise CommandValidationError("invalid_quality", "Image quality must be preview or export.")
        checksum = hashlib.sha256()
        for part in (frame_digest(image), plan_fingerprint, evidence_digest(evidence), quality):
            checksum.update(part.encode("ascii"))
            checksum.update(b":")
        return checksum.hexdigest()


class CachedFaceEmbedder:
    """In-memory face-vector memoization keyed by exact pixels and model evidence.

    Evidence checks remain with IdentityGuard. The wrapper never asserts that a
    cached synthetic embedding verifies a real person's identity.
    """

    def __init__(self, delegate: FaceEmbedder, *, max_entries: int = 8) -> None:
        if type(max_entries) is not int or not 1 <= max_entries <= 64:
            raise CommandValidationError("invalid_cache_budget", "Embedding cache size is invalid.")
        self._delegate = delegate
        self._max_entries = max_entries
        self._vectors: OrderedDict[str, tuple[float, ...]] = OrderedDict()
        self._hits = 0
        self._misses = 0

    @property
    def evidence(self) -> EmbedderEvidence:
        return self._delegate.evidence

    @property
    def hits(self) -> int:
        return self._hits

    @property
    def misses(self) -> int:
        return self._misses

    def embed(self, frame: ImageFrame) -> tuple[float, ...]:
        checksum = hashlib.sha256()
        checksum.update(frame_digest(frame).encode("ascii"))
        checksum.update(evidence_digest(self.evidence).encode("ascii"))
        key = checksum.hexdigest()
        cached = self._vectors.get(key)
        if cached is not None:
            self._vectors.move_to_end(key)
            self._hits += 1
            return cached
        vector = self._delegate.embed(frame)
        self._misses += 1
        if not isinstance(vector, tuple):
            raise CommandValidationError("invalid_embedding", "Face vector must be a tuple.")
        self._vectors[key] = vector
        while len(self._vectors) > self._max_entries:
            self._vectors.popitem(last=False)
        return vector

    def clear(self) -> None:
        self._vectors.clear()

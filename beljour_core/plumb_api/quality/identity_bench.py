"""Licence-gated identity preservation from externally provided face embeddings.

Never download ArcFace, FaceNet or weights of unknown provenance. The default
state is UNPROVEN. Embedding arrays exist only in memory, never in saved rows.
Face preservation needs a commercial-clear model AND separate preregistered
thresholds for each effect; similarity alone cannot certify realism.
Author: John Khan.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Protocol

import numpy as np
from numpy.typing import NDArray

from .distribution import PERMITTED_LICENCES, PROHIBITED


class EmbeddingProvider(Protocol):
    """Caller-supplied local model; its descriptor must match loaded bytes."""

    def embed(self, images: NDArray[np.uint8]) -> NDArray[np.float64]: ...


@dataclass(frozen=True)
class IdentityProvenance:
    weights_sha256: str
    licence: str
    training_sets: tuple[str, ...]
    data_commercial_cleared: bool
    review_reference: str

    def problems(self) -> list[str]:
        failed = []
        if self.licence not in PERMITTED_LICENCES:
            failed.append("face embedding weights not licensed for commercial use")
        if len(self.weights_sha256) != 64 or any(c not in "0123456789abcdef" for c in self.weights_sha256):
            failed.append("weights do not have a known SHA-256")
        if not self.data_commercial_cleared or not self.training_sets:
            failed.append("training-set rights not cleared")
        if not self.review_reference.strip():
            failed.append("independent provenance review missing")
        if any(re.sub("[^a-z0-9]", "", bad) in re.sub("[^a-z0-9]", "", ds.lower())
               for bad in PROHIBITED for ds in self.training_sets):
            failed.append("model trained on banned dataset")
        return failed


@dataclass(frozen=True)
class IdentityMeasurement:
    status: str
    cosine: float | None
    threshold: float | None
    passed: bool | None
    reason: str

    def json(self) -> dict[str, object]:
        return {"status": self.status, "cosine": self.cosine, "threshold": self.threshold,
                "passed": self.passed, "reason": self.reason}


def cosine_similarity(first: NDArray[np.float64], second: NDArray[np.float64]) -> float:
    a, b = np.asarray(first, dtype=np.float64), np.asarray(second, dtype=np.float64)
    if a.ndim != 1 or b.ndim != 1 or a.shape != b.shape or len(a) < 2:
        raise ValueError("identity embeddings must have identical 1D shape")
    if not np.isfinite(a).all() or not np.isfinite(b).all():
        raise ValueError("nonfinite identity embedding")
    norms = float(np.linalg.norm(a) * np.linalg.norm(b))
    if norms < 1e-12:
        raise ValueError("zero-norm identity embedding")
    return float(np.clip(np.dot(a, b) / norms, -1.0, 1.0))


def compare_identity(first: NDArray[np.float64], second: NDArray[np.float64], *,
                     provenance: IdentityProvenance | None, threshold: float | None,
                     effect: str) -> IdentityMeasurement:
    """A missing threshold or cleared licence can NEVER produce an identity PASS."""
    if not effect or threshold is None or not np.isfinite(threshold) or not -1 <= threshold <= 1:
        return IdentityMeasurement("UNPROVEN", None, threshold, None, "no preregistered effect-specific identity threshold")
    problems = ["commercial-safe identity model absent"] if provenance is None else provenance.problems()
    if problems:
        return IdentityMeasurement("UNPROVEN", None, threshold, None, "; ".join(problems))
    try:
        cosine = cosine_similarity(first, second)
    except ValueError as exc:
        return IdentityMeasurement("UNPROVEN", None, threshold, None, str(exc))
    return IdentityMeasurement("MEASURED", cosine, threshold, cosine >= threshold,
                               "identity screening only; other quality gates remain")

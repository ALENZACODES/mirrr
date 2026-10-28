"""Face embedding boundary, licence gate, and synthetic-only deterministic double.

No unreviewed model weights or dataset are included. The deterministic double
is NOT facial identification, identity verification, or proof of edit quality.
It must be explicitly allowed when building test-only IdentityGuard objects.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Protocol

from ..arena.constants import BANNED_SOURCES
from .errors import CommandUnavailable, CommandValidationError
from .frames import ImageFrame

ALLOWED_LICENCES = frozenset({"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause"})
_SHA256 = re.compile(r"^[a-f0-9]{64}$")


def _normalized_source(source: str) -> str:
    return "".join(character for character in source.casefold() if character.isalnum())


def forbidden_training_data(sources: tuple[str, ...]) -> tuple[str, ...]:
    """Fail closed on named datasets and common punctuation/case variants."""
    denied = {_normalized_source(source) for source in BANNED_SOURCES}
    # Preserve abbreviated source aliases without declaring a second deny-list.
    denied.update(
        name[:2] + name[-2:]
        for name in tuple(denied)
        if name.startswith("ms") and name.endswith("1m")
    )
    return tuple(
        source
        for source in sources
        if any(banned in _normalized_source(source) for banned in denied)
    )


@dataclass(frozen=True, slots=True)
class EmbedderEvidence:
    model_id: str
    implementation_licence: str
    weights_licence: str | None
    training_sources: tuple[str, ...]
    weights_sha256: str | None
    commercial_use_verified: bool
    real_face_validation_passed: bool
    synthetic_only: bool = False

    def validate(self, *, allow_test_embedder: bool = False) -> None:
        if not isinstance(self.model_id, str) or not self.model_id or len(self.model_id) > 100:
            raise CommandUnavailable(
                "invalid_model_id",
                "Identity model identifier is missing or too long.",
            )
        if (
            not isinstance(self.training_sources, tuple)
            or any(not isinstance(source, str) for source in self.training_sources)
        ):
            raise CommandUnavailable(
                "invalid_training_sources", "Identity model training evidence is malformed.",
            )
        if type(self.synthetic_only) is not bool or type(self.commercial_use_verified) is not bool:
            raise CommandUnavailable("invalid_approval", "Identity approval metadata is malformed.")
        if type(self.real_face_validation_passed) is not bool:
            raise CommandUnavailable("invalid_approval", "Identity validation metadata is malformed.")
        if forbidden_training_data(self.training_sources):
            raise CommandUnavailable(
                "forbidden_training_data",
                "Identity model uses a disallowed training source.",
            )
        if self.synthetic_only:
            if not allow_test_embedder:
                raise CommandUnavailable(
                    "test_model_forbidden",
                    "Synthetic embedder cannot run in production.",
                )
            if self.weights_sha256 is not None or self.weights_licence is not None:
                raise CommandUnavailable(
                    "test_model_invalid",
                    "A synthetic double must not advertise model weights.",
                )
            return
        if self.implementation_licence not in ALLOWED_LICENCES:
            raise CommandUnavailable(
                "code_licence_pending",
                "Identity model implementation licence is not approved.",
            )
        if self.weights_licence not in ALLOWED_LICENCES:
            raise CommandUnavailable(
                "weights_licence_pending",
                "Identity model weights licence is not approved.",
            )
        if (
            not isinstance(self.weights_sha256, str)
            or _SHA256.fullmatch(self.weights_sha256) is None
        ):
            raise CommandUnavailable(
                "weights_pin_missing",
                "Identity model must have a verified SHA-256 pin.",
            )
        if not self.training_sources or any(not name.strip() for name in self.training_sources):
            raise CommandUnavailable(
                "training_data_pending",
                "Identity model training sources must be reviewed.",
            )
        if not self.commercial_use_verified:
            raise CommandUnavailable(
                "commercial_use_pending",
                "Identity model commercial rights are not cleared.",
            )
        if not self.real_face_validation_passed:
            raise CommandUnavailable(
                "identity_validation_pending",
                "Identity model needs genuine holdout validation.",
            )


class FaceEmbedder(Protocol):
    @property
    def evidence(self) -> EmbedderEvidence: ...

    def embed(self, frame: ImageFrame) -> tuple[float, ...]: ...


def normalized_embedding(vector: tuple[float, ...]) -> tuple[float, ...]:
    """Length-checked, safe L2 normalization for a pluggable embedding."""
    if not isinstance(vector, tuple) or not 2 <= len(vector) <= 4096:
        raise CommandValidationError("invalid_embedding", "Embedding must have 2 to 4096 finite values.")
    if any(not isinstance(value, (int, float)) or not math.isfinite(value) for value in vector):
        raise CommandValidationError("invalid_embedding", "Embedding contains an invalid value.")
    # Scale first to avoid overflow when providers return large yet finite values.
    magnitude = max(abs(value) for value in vector)
    if magnitude == 0.0:
        raise CommandValidationError("zero_embedding", "Identity model returned a zero embedding.")
    scaled = tuple(value / magnitude for value in vector)
    length = math.sqrt(math.fsum(value * value for value in scaled))
    return tuple(value / length for value in scaled)


def cosine_similarity(left: tuple[float, ...], right: tuple[float, ...]) -> float:
    if len(left) != len(right):
        raise CommandValidationError(
            "embedding_dimension_changed",
            "Identity embedding dimensions changed.",
        )
    first = normalized_embedding(left)
    second = normalized_embedding(right)
    return max(-1.0, min(1.0, math.fsum(a * b for a, b in zip(first, second, strict=True))))


def identity_meter(similarity: float) -> int:
    """Monotone 0..100 display proxy; not a probability of common identity."""
    if not math.isfinite(similarity) or not -1.0 <= similarity <= 1.0:
        raise CommandValidationError(
            "invalid_similarity",
            "Identity similarity must be finite and in [-1, 1].",
        )
    return min(100, max(0, int(math.floor(max(0.0, similarity) * 100.0 + 0.5))))


class DeterministicTestEmbedder:
    """Image-grid projection ONLY for synthetic tests; no model and no face recognition.

    Every cell contributes its mean centered RGB, with two constant anchoring
    dimensions. Repeated inputs yield identical vectors, offline, with no data.
    """

    @property
    def evidence(self) -> EmbedderEvidence:
        return EmbedderEvidence(
            model_id="synthetic-grid-test-only",
            implementation_licence="MIT",
            weights_licence=None,
            training_sources=(),
            weights_sha256=None,
            commercial_use_verified=False,
            real_face_validation_passed=False,
            synthetic_only=True,
        )

    def embed(self, frame: ImageFrame) -> tuple[float, ...]:
        cells = 4
        values: list[float] = [0.12, -0.12]
        for y in range(cells):
            y0 = y * frame.height // cells
            y1 = max(y0 + 1, (y + 1) * frame.height // cells)
            for x in range(cells):
                x0 = x * frame.width // cells
                x1 = max(x0 + 1, (x + 1) * frame.width // cells)
                total = [0, 0, 0]
                count = 0
                for row in range(y0, min(frame.height, y1)):
                    for col in range(x0, min(frame.width, x1)):
                        offset = (row * frame.width + col) * frame.channels
                        for channel in range(3):
                            total[channel] += frame.pixels[offset + channel]
                        count += 1
                for channel in range(3):
                    values.append(total[channel] / (255.0 * count) - 0.5)
        return normalized_embedding(tuple(values))

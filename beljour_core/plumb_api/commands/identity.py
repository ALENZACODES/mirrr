"""Fail-closed identity gate for already rendered local edits.

Compare cosine embeddings of the original and candidate. In soften mode,
search an original-to-edit blend for an acceptable similarity, verifying the
actual final quantized bytes. Thresholds are ASSUMED, not calibrated on faces.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal

from .embedders import EmbedderEvidence, FaceEmbedder, cosine_similarity, identity_meter
from .errors import CommandUnavailable, CommandValidationError, IdentityBlocked
from .frames import ImageFrame, blend_toward_original, resize_reference
from .types import IdentityLockArgs, LockMode, LockStrength

IdentityStatus = Literal["kept", "softened", "restored", "warned"]
ReferenceAligner = Callable[[ImageFrame, int, int], ImageFrame]


@dataclass(frozen=True, slots=True)
class IdentityThresholds:
    """Assumptions only. Calibrate with held-out permitted same/different pairs."""

    normal: float = 0.85
    strict: float = 0.93

    def __post_init__(self) -> None:
        if (
            not math.isfinite(self.normal)
            or not math.isfinite(self.strict)
            or not 0.0 < self.normal < self.strict < 1.0
        ):
            raise CommandValidationError(
                "invalid_thresholds",
                "Strict threshold must exceed normal in (0, 1).",
            )

    def for_strength(self, strength: LockStrength) -> float:
        return self.strict if strength is LockStrength.STRICT else self.normal


@dataclass(frozen=True, slots=True)
class IdentityDecision:
    status: IdentityStatus
    mode: LockMode
    strength: LockStrength
    threshold: float
    requested_meter: int
    identity_match: int
    requested_cosine: float
    final_cosine: float
    applied_fraction: float
    model_id: str
    synthetic_evidence: bool
    warning: str | None = None

    def public_metadata(self) -> dict[str, str | int | float | bool | None]:
        """No original pixels, landmarks, embeddings, hashes or user identifiers."""
        return {
            "status": self.status,
            "mode": self.mode.value,
            "strength": self.strength.value,
            "threshold": self.threshold,
            "requested_meter": self.requested_meter,
            "identity_match": self.identity_match,
            "applied_fraction": self.applied_fraction,
            "synthetic_evidence": self.synthetic_evidence,
            "warning": self.warning,
        }


@dataclass(frozen=True, slots=True)
class IdentityOutcome:
    frame: ImageFrame
    decision: IdentityDecision


class IdentityGuard:
    """Inject only licensed and evaluated face embedders; never fetch a model.

    Explicit allow_test_embedder is required for the provided synthetic double.
    Original and edited frames may differ in dimensions after /upscale. The
    injected aligner may reconstruct the original at output size; the default
    uses a conservative deterministic resize, not imaginary high-frequency data.
    """

    def __init__(
        self,
        embedder: FaceEmbedder,
        *,
        allow_test_embedder: bool = False,
        thresholds: IdentityThresholds | None = None,
        align_original: ReferenceAligner = resize_reference,
        coarse_samples: int = 12,
        refine_iterations: int = 14,
    ) -> None:
        if not 2 <= coarse_samples <= 64 or not 0 <= refine_iterations <= 32:
            raise CommandValidationError(
                "invalid_search_budget",
                "Invalid identity softening search budget.",
            )
        self._embedder = embedder
        self._allow_test_embedder = allow_test_embedder
        self._thresholds = thresholds if thresholds is not None else IdentityThresholds()
        self._align = align_original
        self._coarse_samples = coarse_samples
        self._refine_iterations = refine_iterations
        embedder.evidence.validate(allow_test_embedder=allow_test_embedder)

    @property
    def embedder_evidence(self) -> EmbedderEvidence:
        """Current model provenance for session-scoped preview cache keys."""
        return self._embedder.evidence

    def _score(self, original: tuple[float, ...], candidate: ImageFrame) -> float:
        try:
            vector = self._embedder.embed(candidate)
        except CommandValidationError:
            raise
        except Exception:
            raise CommandUnavailable(
                "identity_embedder_failed",
                "Face comparison is unavailable. The original photo has been preserved.",
            ) from None
        return cosine_similarity(original, vector)

    def _aligned_reference(self, original: ImageFrame, edited: ImageFrame) -> ImageFrame:
        if original.channels != edited.channels:
            raise CommandValidationError(
                "incompatible_channels",
                "Identity frames must have matching channels.",
            )
        if original.same_layout(edited):
            return original
        try:
            aligned = self._align(original, edited.width, edited.height)
        except CommandValidationError:
            raise
        except Exception:
            raise CommandUnavailable(
                "reference_alignment_failed",
                "Original alignment was unavailable. No edit was committed.",
            ) from None
        if not isinstance(aligned, ImageFrame) or not aligned.same_layout(edited):
            raise CommandValidationError(
                "invalid_aligner",
                "Original aligner returned an incompatible frame.",
            )
        return aligned

    def enforce(
        self,
        original: ImageFrame,
        edited: ImageFrame,
        settings: IdentityLockArgs,
        *,
        command_index: int | None = None,
    ) -> IdentityOutcome:
        if not isinstance(original, ImageFrame) or not isinstance(edited, ImageFrame):
            raise CommandValidationError("invalid_frame", "Identity lock needs two validated frames.")
        if not isinstance(settings, IdentityLockArgs):
            raise CommandValidationError("invalid_settings", "Identity lock needs typed settings.")
        self._embedder.evidence.validate(allow_test_embedder=self._allow_test_embedder)
        evidence = self._embedder.evidence
        try:
            original_vector = self._embedder.embed(original)
        except CommandValidationError:
            raise
        except Exception:
            raise CommandUnavailable(
                "identity_embedder_failed",
                "Face comparison is unavailable. The original photo has been preserved.",
            ) from None
        threshold = self._thresholds.for_strength(settings.strength)
        requested = self._score(original_vector, edited)
        meter = identity_meter(requested)
        passed = requested >= threshold
        if settings.mode is LockMode.BLOCK and not passed:
            raise IdentityBlocked(meter, threshold, command_index=command_index)
        if settings.mode is LockMode.WARN and not passed:
            decision = IdentityDecision(
                "warned", settings.mode, settings.strength, threshold, meter, meter,
                requested, requested, 1.0, evidence.model_id, evidence.synthetic_only,
                "Identity similarity is below the selected threshold. Review before export.",
            )
            return IdentityOutcome(edited, decision)
        if passed or settings.mode is not LockMode.SOFTEN:
            decision = IdentityDecision(
                "kept", settings.mode, settings.strength, threshold, meter, meter,
                requested, requested, 1.0, evidence.model_id, evidence.synthetic_only,
            )
            return IdentityOutcome(edited, decision)

        reference = self._aligned_reference(original, edited)
        baseline_cosine = self._score(original_vector, reference)
        if baseline_cosine < threshold:
            # Resizing can itself change a real embedding. Never call this safe.
            raise CommandUnavailable(
                "identity_alignment_below_threshold",
                "The original cannot be safely aligned for this identity check.",
            )
        best_frame = reference
        best_fraction = 0.0
        upper_failure = 1.0
        # Probe strongest to weakest; a real embedding path is not guaranteed
        # monotonic. Each accepted candidate is independently measured.
        for sample in range(1, self._coarse_samples + 1):
            fraction = 1.0 - sample / self._coarse_samples
            if fraction <= 0.0:
                break
            trial = blend_toward_original(reference, edited, fraction)
            actual = self._score(original_vector, trial)
            if actual >= threshold:
                best_frame = trial
                best_fraction = fraction
                break
            upper_failure = fraction
        # Refine only the first bracket found. Recheck every quantized candidate;
        # if the metric has local non-monotonic regions, accept only verified passes.
        low = best_fraction
        high = upper_failure
        for _ in range(self._refine_iterations):
            middle = (low + high) / 2.0
            trial = blend_toward_original(reference, edited, middle)
            if trial.pixels == best_frame.pixels:
                low = middle
                continue
            score = self._score(original_vector, trial)
            if score >= threshold:
                low = middle
                best_frame = trial
                best_fraction = middle
            else:
                high = middle
        final_cosine = self._score(original_vector, best_frame)
        if final_cosine < threshold:
            # Inference changed between passes: safest available fallback.
            best_frame = reference
            final_cosine = self._score(original_vector, reference)
            best_fraction = 0.0
            if final_cosine < threshold:
                raise CommandUnavailable(
                    "unstable_embedder",
                    "Identity comparison is not stable enough for export.",
                )
        status: IdentityStatus = "restored" if best_fraction == 0.0 else "softened"
        decision = IdentityDecision(
            status, settings.mode, settings.strength, threshold, meter,
            identity_meter(final_cosine), requested, final_cosine, best_fraction,
            evidence.model_id, evidence.synthetic_only,
            "Edit strength was reduced to protect resemblance.",
        )
        return IdentityOutcome(best_frame, decision)

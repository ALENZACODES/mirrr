"""Local scene generation with mandatory input/output review and cost accounting. Author: John Khan."""

from __future__ import annotations

import hashlib
import threading
import time
from dataclasses import dataclass
from typing import Protocol

from .contracts import GenerationRefused, SceneRequest
from .meter import CostLedger, ImageMeter, meter_image
from .runtime import LocalSchnellBackend
from .safety import ImageReviewer, PromptReviewer, check_prompt, verify_and_label_output

MAX_JOB_ELAPSED_SECONDS = 600.0


@dataclass(frozen=True)
class GeneratedScene:
    """Ephemeral bytes, never written to the job log or an export artifact."""

    pixels: bytes
    audit: ImageMeter
    image_review_digest: str


@dataclass(frozen=True)
class GeneratedBatch:
    scenes: tuple[GeneratedScene, ...]
    elapsed_ms: float
    model_status: str
    prompt_review_digest: str

    def public(self) -> dict[str, object]:
        return {
            "schema": "beljour-scene-result/1",
            "count": len(self.scenes),
            "elapsed_ms": self.elapsed_ms,
            "model_status": self.model_status,
            "prompt_review_sha256": self.prompt_review_digest,
            "images": [item.audit.public() for item in self.scenes],
            "release_gate": "NOT_RUN",
        }


class SceneRenderer(Protocol):
    def render(self, request: SceneRequest, cancelled: threading.Event) -> GeneratedBatch: ...


class SafeScenePipeline:
    """Runs a loaded local backend; rejects all results if any image is unreviewed."""

    def __init__(
        self,
        backend: LocalSchnellBackend,
        prompt_reviewer: PromptReviewer,
        image_reviewer: ImageReviewer,
        *,
        ledger: CostLedger | None = None,
        model_revision: str,
    ) -> None:
        self.backend = backend
        self.prompts = prompt_reviewer
        self.images = image_reviewer
        self.ledger = ledger if ledger is not None else CostLedger()
        self.model_revision = model_revision

    def render(self, request: SceneRequest, cancelled: threading.Event) -> GeneratedBatch:
        if cancelled.is_set():
            raise GenerationRefused("generation_cancelled")
        if not self.backend.ready():
            raise GenerationRefused("generation_runtime_not_ready")
        prompt_review_digest = check_prompt(request, self.prompts)
        start = time.perf_counter()
        try:
            outputs = self.backend.generate(request, cancelled)
        except Exception as exc:
            raise GenerationRefused("generation_runtime_failed") from exc
        elapsed = (time.perf_counter() - start) * 1000.0
        if elapsed > MAX_JOB_ELAPSED_SECONDS * 1000:
            raise GenerationRefused("generation_exceeded_runtime_budget")
        if cancelled.is_set():
            raise GenerationRefused("generation_cancelled")
        if len(outputs) != request.settings.images:
            raise GenerationRefused("generation_output_count_mismatch")
        encoded: list[GeneratedScene] = []
        for result in outputs:
            data, reviewer_digest = verify_and_label_output(
                result.encoded,
                purpose=request.purpose,
                width=request.settings.width,
                height=request.settings.height,
                reviewer=self.images,
                cancelled=cancelled.is_set,
            )
            digest = hashlib.sha256(data).hexdigest()
            meter = meter_image(
                digest,
                output_bytes=len(data),
                gpu_ms=result.measured_gpu_ms,
                operator_rate=request.settings.requested_rate_usd_per_gpu_hour,
            )
            encoded.append(GeneratedScene(data, meter, reviewer_digest))
        if cancelled.is_set():
            raise GenerationRefused("generation_cancelled")
        self.ledger.record_many(tuple(output.audit for output in encoded))
        return GeneratedBatch(
            tuple(encoded), elapsed, "SCHNELL_LOCAL_MEASURED", prompt_review_digest,
        )

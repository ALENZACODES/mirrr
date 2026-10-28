"""The local foreground lab entry point for approved generation only. Author: John Khan."""

from __future__ import annotations

from collections.abc import Callable, Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ..training.sealed_store import SealedStore
from .contracts import SceneRequest
from .meter import CostLedger
from .pipeline import GeneratedBatch, SafeScenePipeline
from .queue import BoundedSceneQueue
from .receipts import GenerationReceipt, make_receipt
from .rights import AllowedModel, admit_model
from .runtime import LocalSchnellBackend, load_runtime
from .safety import ImageReviewer, PromptReviewer


@dataclass(frozen=True)
class LabSession:
    queue: BoundedSceneQueue
    costs: CostLedger
    model: AllowedModel

    def receipt(self, request: SceneRequest, result: GeneratedBatch) -> GenerationReceipt:
        return make_receipt(self.model, request, result)

    def public(self) -> dict[str, Any]:
        return {
            "schema": "beljour-generation-lab/1",
            "model": self.model.public(),
            "costs": self.costs.public(),
            "release_gate": "NOT_RUN",
            "runtime": "LOCAL_ENCRYPTED",
        }


@contextmanager
def open_generation_lab(
    *,
    manifest_file: Path,
    encrypted_root: Path,
    rights_review_file: Path,
    ledger: Mapping[str, Any],
    store: SealedStore,
    make_backend: Callable[[], LocalSchnellBackend],
    prompt_reviewer: PromptReviewer,
    image_reviewer: ImageReviewer,
    queue_limit: int = 8,
) -> Iterator[LabSession]:
    """No default model, hosted provider, or unreviewed output pathway exists."""
    admitted = admit_model(
        manifest_file, encrypted_root=encrypted_root,
        rights_review_file=rights_review_file, ledger=ledger, store=store,
    )
    with load_runtime(admitted, store, make_backend) as backend:
        metering = CostLedger()
        pipeline = SafeScenePipeline(
            backend, prompt_reviewer, image_reviewer,
            ledger=metering, model_revision=admitted.bundle.revision,
        )
        with BoundedSceneQueue(pipeline, pending_limit=queue_limit) as queue:
            yield LabSession(queue, metering, admitted)

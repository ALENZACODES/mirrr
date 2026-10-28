"""Hash-bound counts-only receipt for local scene generation. Author: John Khan."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any

from .contracts import JOB_SCHEMA, MODEL_ID, GenerationRefused, SceneRequest, canonical_json
from .pipeline import GeneratedBatch
from .rights import AllowedModel

RECEIPT_SCHEMA = "beljour-scene-provenance/1"


@dataclass(frozen=True)
class GenerationReceipt:
    """Records observable evidence, not an inferred human or release-quality grade."""

    manifest_sha256: str
    input_digest: str
    images: int
    generation_outputs: tuple[str, ...]
    measured_cost_usd: float | None
    reviewer_digests: tuple[str, ...]
    prompt_reviewer_digest: str
    document_sha256: str

    def public(self) -> dict[str, Any]:
        return {
            "schema": RECEIPT_SCHEMA,
            "model": MODEL_ID,
            "approved_manifest_sha256": self.manifest_sha256,
            "request_sha256": self.input_digest,
            "images": self.images,
            "outputs_sha256": list(self.generation_outputs),
            "reviewers_sha256": list(self.reviewer_digests),
            "prompt_reviewer_sha256": self.prompt_reviewer_digest,
            "measured_cost_usd": self.measured_cost_usd,
            "document_sha256": self.document_sha256,
            "quality": "NOT_SCORED",
            "human_review": "NOT_RUN",
        }


def make_receipt(
    model: AllowedModel,
    request: SceneRequest,
    result: GeneratedBatch,
) -> GenerationReceipt:
    """Verify bytes and measured receipts before emitting metadata-only proof."""
    request.validate()
    if len(result.scenes) != request.settings.images or result.model_status != "SCHNELL_LOCAL_MEASURED":
        raise GenerationRefused("invalid_generation_receipt")
    if len(result.prompt_review_digest) != 64 or any(
        character not in "0123456789abcdef" for character in result.prompt_review_digest
    ):
        raise GenerationRefused("missing_prompt_review")
    audits = []
    outputs = []
    reviewers = []
    observed_costs: list[float] = []
    for scene in result.scenes:
        actual = hashlib.sha256(scene.pixels).hexdigest()
        if actual != scene.audit.output_sha256 or len(scene.pixels) != scene.audit.output_bytes:
            raise GenerationRefused("changed_generation_receipt")
        if len(scene.image_review_digest) != 64 or not all(
            character in "0123456789abcdef" for character in scene.image_review_digest
        ):
            raise GenerationRefused("missing_generation_review")
        audits.append(scene.audit.public())
        outputs.append(actual)
        reviewers.append(scene.image_review_digest)
        if scene.audit.measured_cost_usd is not None:
            observed_costs.append(scene.audit.measured_cost_usd)
    amount = sum(observed_costs) if len(observed_costs) == len(audits) else None
    source_audit = request.public_audit()
    if source_audit.get("schema") != JOB_SCHEMA:
        raise GenerationRefused("invalid_generation_request_receipt")
    document = {
        "schema": RECEIPT_SCHEMA,
        "model": MODEL_ID,
        "manifest": model.bundle.bundle_sha256,
        "request": source_audit,
        "scenes": audits,
        "reviewer_digests": reviewers,
        "prompt_review_digest": result.prompt_review_digest,
        "quality": "NOT_SCORED",
    }
    digest = hashlib.sha256(canonical_json(document)).hexdigest()
    return GenerationReceipt(
        model.bundle.bundle_sha256,
        hashlib.sha256(canonical_json(source_audit)).hexdigest(),
        len(audits),
        tuple(outputs),
        amount,
        tuple(reviewers),
        result.prompt_review_digest,
        digest,
    )

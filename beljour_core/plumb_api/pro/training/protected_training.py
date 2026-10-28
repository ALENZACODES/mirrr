"""Audited masked training using only encrypted numeric checkpoint storage.

Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .audit import validate_corpus
from .masked_train import _examples, _rows, evaluate
from .patch_model import initial_weights, trained_step
from .patches import PatchPlan
from .pipeline import TrainingPlan
from .resources import admit_resources
from .sampler import balanced_batch
from .sealed_checkpoint import SealedNumericCheckpoints
from .sealed_store import ArtefactProtectionError


def train_masked_protected(
    approved: Path,
    images: Path,
    checkpoint: SealedNumericCheckpoints,
    training_plan: TrainingPlan,
    patch_plan: PatchPlan,
    *,
    resume: bool = False,
    steps_this_run: int | None = None,
    revocations: Path | None = None,
    memory_budget_bytes: int = 2 * 1024 * 1024 * 1024,
) -> dict[str, Any]:
    """Never create a temporary .npy/.npz or persist readable training parameters."""
    training_plan.validate()
    patch_plan.validate()
    if training_plan.image_size != patch_plan.image_size:
        raise ValueError("Training and patch dimensions differ")
    if steps_this_run is not None and steps_this_run < 1:
        raise ValueError("Invalid protected training step count")
    resources = admit_resources(patch_plan, training_plan, memory_budget_bytes)
    audited = validate_corpus(approved, images, training_plan, revocations=revocations)
    if patch_plan.sha256() != checkpoint.plan.sha256() or not checkpoint.confirms_inputs(
        training_digest=training_plan.digest(),
        manifest_digest=audited.manifest_sha256,
        revocation_digest=audited.revocations_sha256,
    ):
        raise ArtefactProtectionError("protected_training_binding_mismatch")
    training = _rows(approved, images, training_plan, "train")
    heldout = _rows(approved, images, training_plan, "eval")
    if resume:
        start, model = checkpoint.resume()
    else:
        if checkpoint.latest_exists():
            raise ArtefactProtectionError("protected_run_exists")
        start = 0
        model = initial_weights(patch_plan)
    if start >= training_plan.steps:
        raise ValueError("Protected training has completed")
    end = min(
        training_plan.steps,
        start + (steps_this_run if steps_this_run is not None else training_plan.steps),
    )
    before = evaluate(heldout, patch_plan, model, audited)
    last_loss = 0.0
    for step in range(start, end):
        selected, _statistics = balanced_batch(
            training, step=step, seed=training_plan.seed,
            batch_size=training_plan.batch_size,
        )
        inputs, targets = _examples(selected, patch_plan, phase="train")
        model, last_loss = trained_step(
            inputs, targets, model, patch_plan,
            training_plan.learning_rate,
        )
    validate_corpus(
        approved, images, training_plan, revocations=revocations,
        check_image_bytes=False,
    )
    checkpoint.save(end, model)
    return {
        "schema": "beljour-protected-training-report/1",
        "steps": end,
        "train_loss": round(last_loss, 9),
        "before": before,
        "after": evaluate(heldout, patch_plan, model, audited),
        "resource_estimate": resources.public(),
        "persisted": "CIPHERTEXT_ONLY",
        "release_gate": "NOT_RUN",
    }


def score_masked_protected(
    approved: Path,
    images: Path,
    checkpoint: SealedNumericCheckpoints,
    training_plan: TrainingPlan,
    patch_plan: PatchPlan,
    *,
    revocations: Path | None = None,
) -> dict[str, Any]:
    """Score an authenticated in-memory checkpoint; never materialize weights."""
    audited = validate_corpus(approved, images, training_plan, revocations=revocations)
    if patch_plan.sha256() != checkpoint.plan.sha256() or not checkpoint.confirms_inputs(
        training_digest=training_plan.digest(),
        manifest_digest=audited.manifest_sha256,
        revocation_digest=audited.revocations_sha256,
    ):
        raise ArtefactProtectionError("protected_training_binding_mismatch")
    step, model = checkpoint.resume()
    return {
        "schema": "beljour-protected-scoring-report/1",
        "step": step,
        "evaluation": evaluate(_rows(approved, images, training_plan, "eval"), patch_plan, model, audited),
        "release_gate": "NOT_RUN",
    }

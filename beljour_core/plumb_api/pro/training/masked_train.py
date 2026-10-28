"""Reproducible masked-patch reference training on the audited corpus.

Every run re-audits the approved manifests, verifies each image's bytes before
decoding it, trains the NumPy patch model on source-balanced minibatches and
scores it on the subject-disjoint heldout split against a visible-context
baseline. Checkpoints are numeric-only ``.npz`` archives with owner-only
permissions, immutable once written, and bound by digest to the approved
manifests, the revocation register, the training plan and the patch plan.
Resume runs the pre-allocation archive guard before NumPy reads anything.

This legacy writer stores readable weights; the protected path in
`protected_training` keeps only ciphertext. Reports carry aggregates only.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io
import math
import stat
import zipfile
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

from .atomic import (
    decode_private_json,
    encode_private_json,
    read_private_bytes,
    read_private_json,
    write_private_bytes,
    write_private_json,
)
from .audit import CorpusAudit, _iter_rows, validate_corpus
from .checkpoint_guard import validate_numeric_payload
from .model_card import build_model_card, verify_model_card
from .patch_model import (
    PatchWeights,
    initial_weights,
    masked_squared_error,
    reconstruct,
    trained_step,
)
from .patches import MaskedTargets, PatchPlan, masked_example, visible_context_baseline
from .pipeline import TrainingPlan, checked_image, digest_path, read_pixels
from .resources import admit_resources
from .sampler import balanced_batch

CHECKPOINT_SCHEMA = "beljour-masked-checkpoint/1"
LATEST_NAME = "patch-latest.json"
MAX_ARCHIVE_BYTES = 200 * 1024 * 1024
MAX_METADATA_BYTES = 8192
MEMBERS = ("encoder", "encoder_bias", "decoder", "decoder_bias")


@dataclass(frozen=True)
class TrainingRow:
    """An approved image whose bytes matched its manifest digest when listed."""

    path: Path
    sha256: str
    source: str


def _rows(approved: Path, images: Path, plan: TrainingPlan, split: str) -> list[TrainingRow]:
    if split not in ("train", "eval"):
        raise ValueError("Unknown split")
    return [
        TrainingRow(checked_image(images, grant), grant.sha256, grant.source)
        for grant in _iter_rows(approved / f"{split}.jsonl", split=split, plan=plan)
    ]


def _pixels(row: TrainingRow, size: int) -> NDArray[np.float32]:
    if digest_path(row.path) != row.sha256:
        raise ValueError("Approved image bytes changed during training")
    return read_pixels(row.path, size)


def _examples(
    rows: Sequence[TrainingRow], patch_plan: PatchPlan, *, phase: str,
) -> tuple[NDArray[np.float32], MaskedTargets]:
    """Stack the masked patch examples of several images into one batch."""
    if not rows:
        raise ValueError("No images for masked examples")
    inputs, values, weights = [], [], []
    for row in rows:
        example, target = masked_example(
            _pixels(row, patch_plan.image_size), row.sha256, patch_plan, phase=phase,
        )
        inputs.append(example)
        values.append(target.values)
        weights.append(target.weights)
    return np.concatenate(inputs), MaskedTargets(np.concatenate(values), np.concatenate(weights))


def psnr(mse: float) -> float | None:
    """Peak signal-to-noise ratio for 0..1 pixels; undefined for a perfect match."""
    return None if mse <= 0 else round(10.0 * math.log10(1.0 / mse), 6)


def _score(model_error: float, baseline_error: float, values: int, images: int) -> dict[str, Any]:
    mse = model_error / values
    baseline = baseline_error / values
    return {
        "images": images,
        "masked_values": values,
        "masked_mse": round(mse, 9),
        "masked_psnr": psnr(mse),
        "baseline_mse": round(baseline, 9),
        "baseline_psnr": psnr(baseline),
        "beats_baseline": round(mse, 9) < round(baseline, 9),
    }


def evaluate(
    rows: Sequence[TrainingRow], patch_plan: PatchPlan, model: PatchWeights,
    audited: CorpusAudit,
) -> dict[str, Any]:
    """Heldout masked MSE/PSNR, overall and per source, against the baseline."""
    sources: dict[str, int] = {}
    for row in rows:
        sources[row.source] = sources.get(row.source, 0) + 1
    if len(rows) != audited.eval_count or sources != audited.eval_sources:
        raise ValueError("Heldout population differs from the audited corpus")
    model.verify(patch_plan)
    totals: dict[str, list[float]] = {name: [0.0, 0.0, 0.0] for name in sources}
    # One image at a time keeps evaluation memory independent of the heldout size.
    for row in rows:
        inputs, targets = _examples((row,), patch_plan, phase="eval")
        error, count = masked_squared_error(reconstruct(inputs, model), targets)
        baseline, _ = masked_squared_error(
            visible_context_baseline(targets, patch_plan), targets,
        )
        totals[row.source][0] += error
        totals[row.source][1] += baseline
        totals[row.source][2] += count
    error = sum(item[0] for item in totals.values())
    baseline = sum(item[1] for item in totals.values())
    values = int(sum(item[2] for item in totals.values()))
    return {
        "schema": "beljour-masked-eval/1",
        **_score(error, baseline, values, len(rows)),
        "by_source": {
            name: _score(item[0], item[1], int(item[2]), sources[name])
            for name, item in sorted(totals.items())
        },
        "human_quality": "NOT_RUN",
    }


def checkpoint_binding(
    training_plan: TrainingPlan, patch_plan: PatchPlan, audit: CorpusAudit,
) -> dict[str, str | None]:
    return {
        "training": training_plan.digest(),
        "patch": patch_plan.sha256(),
        "manifest": audit.manifest_sha256,
        "revocations": audit.revocations_sha256,
    }


def _private_directory(directory: Path, *protected: Path) -> None:
    """Checkpoints live in their own owner-controlled folder, never in the corpus."""
    if directory.is_symlink():
        raise ValueError("Checkpoint folder must not be a symlink")
    target = directory.resolve()
    for folder in protected:
        if target == folder.resolve() or target.is_relative_to(folder.resolve()):
            raise ValueError("Keep checkpoints outside the approved corpus and images")
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    if directory.stat().st_mode & (stat.S_IWGRP | stat.S_IWOTH):
        raise ValueError("Checkpoint folder is writable by other users")


def archive_bytes(weights: PatchWeights) -> bytes:
    """Deterministic ``.npz`` bytes: fixed member order and timestamps, so the
    same weights always produce the same archive digest."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name in MEMBERS:
            member = io.BytesIO()
            np.lib.format.write_array(member, getattr(weights, name), allow_pickle=False)
            info = zipfile.ZipInfo(f"{name}.npy", date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o600 << 16
            archive.writestr(info, member.getvalue())
    return buffer.getvalue()


def publish_once(path: Path, data: bytes) -> str:
    """Create an owner-only file once. Repeating an identical write (for example
    after a crash before the pointer moved) is accepted; different bytes are not."""
    try:
        return write_private_bytes(path, data, replace=False)
    except FileExistsError:
        existing = read_private_bytes(path, max_bytes=MAX_ARCHIVE_BYTES)
        if existing != data:
            raise ValueError("Checkpoint step already exists with different content") from None
        return hashlib.sha256(existing).hexdigest()


class MaskedCheckpoints:
    """Immutable numeric steps plus a replaceable last-good pointer."""

    def __init__(self, directory: Path, *, patch_plan: PatchPlan,
                 binding: dict[str, str | None]) -> None:
        self.directory = directory
        self.plan = patch_plan
        self.binding = dict(binding)

    def _name(self, step: int, suffix: str) -> Path:
        if type(step) is not int or not 1 <= step <= 99_999_999:
            raise ValueError("Invalid checkpoint step")
        return self.directory / f"patch-checkpoint-{step:08d}.{suffix}"

    def latest_exists(self) -> bool:
        return (self.directory / LATEST_NAME).exists()

    def save(self, step: int, weights: PatchWeights, *, train_loss: float) -> str:
        """Write the archive, then its metadata, then move the pointer."""
        weights.verify(self.plan)
        if not math.isfinite(train_loss) or train_loss < 0:
            raise ValueError("Invalid training loss")
        archive = archive_bytes(weights)
        validate_numeric_payload(archive, self.plan)
        digest = publish_once(self._name(step, "npz"), archive)
        metadata_digest = publish_once(self._name(step, "json"), encode_private_json({
            "schema": CHECKPOINT_SCHEMA, "step": step, "archive_sha256": digest,
            "binding": self.binding, "train_loss": round(train_loss, 9),
        }))
        write_private_json(self.directory / LATEST_NAME, {
            "schema": CHECKPOINT_SCHEMA, "step": step, "metadata_sha256": metadata_digest,
        })
        return digest

    def load(self) -> tuple[int, PatchWeights, dict[str, Any]]:
        """Return the last good step after digest, binding and archive checks."""
        pointer = read_private_json(self.directory / LATEST_NAME, max_bytes=MAX_METADATA_BYTES)
        if set(pointer) != {"schema", "step", "metadata_sha256"} or (
            pointer["schema"] != CHECKPOINT_SCHEMA
        ):
            raise ValueError("Invalid checkpoint pointer")
        step = pointer["step"]
        raw = read_private_bytes(self._name(step, "json"), max_bytes=MAX_METADATA_BYTES)
        if hashlib.sha256(raw).hexdigest() != pointer["metadata_sha256"]:
            raise ValueError("Checkpoint metadata digest mismatch")
        metadata = decode_private_json(raw)
        if set(metadata) != {"schema", "step", "archive_sha256", "binding", "train_loss"} or (
            metadata["schema"] != CHECKPOINT_SCHEMA or metadata["step"] != step
        ):
            raise ValueError("Invalid checkpoint metadata")
        if metadata["binding"] != self.binding:
            raise ValueError("Checkpoint belongs to a different corpus, register or plan")
        archive = read_private_bytes(self._name(step, "npz"), max_bytes=MAX_ARCHIVE_BYTES)
        if hashlib.sha256(archive).hexdigest() != metadata["archive_sha256"]:
            raise ValueError("Checkpoint archive digest mismatch")
        validate_numeric_payload(archive, self.plan)
        with np.load(io.BytesIO(archive), allow_pickle=False) as source:
            if sorted(source.files) != sorted(MEMBERS):
                raise ValueError("Unexpected checkpoint members")
            weights = PatchWeights(*(np.array(source[name], dtype=np.float32) for name in MEMBERS))
        weights.verify(self.plan)
        return step, weights, metadata


def model_card_path(directory: Path, step: int) -> Path:
    if type(step) is not int or not 1 <= step <= 99_999_999:
        raise ValueError("Invalid checkpoint step")
    return directory / f"patch-model-card-{step:08d}.json"


def _train_steps(
    rows: Sequence[TrainingRow], patch_plan: PatchPlan, training_plan: TrainingPlan,
    model: PatchWeights, first: int, last: int,
) -> tuple[PatchWeights, float]:
    loss = 0.0
    for step in range(first, last):
        batch, _ = balanced_batch(
            rows, step=step, seed=training_plan.seed, batch_size=training_plan.batch_size,
        )
        inputs, targets = _examples(batch, patch_plan, phase="train")
        model, loss = trained_step(inputs, targets, model, patch_plan, training_plan.learning_rate)
    return model, loss


def _opened(
    approved: Path, images: Path, directory: Path, plan: TrainingPlan,
    patch_plan: PatchPlan, revocations: Path | None,
) -> tuple[CorpusAudit, MaskedCheckpoints]:
    plan.validate()
    patch_plan.validate()
    if plan.image_size != patch_plan.image_size:
        raise ValueError("Training and patch dimensions differ")
    audit = validate_corpus(approved, images, plan, revocations=revocations)
    _private_directory(directory, approved, images)
    return audit, MaskedCheckpoints(
        directory, patch_plan=patch_plan,
        binding=checkpoint_binding(plan, patch_plan, audit),
    )


def train_masked(
    approved: Path,
    images: Path,
    checkpoint_dir: Path,
    plan: TrainingPlan,
    patch_plan: PatchPlan,
    *,
    resume: bool = False,
    steps_this_run: int | None = None,
    revocations: Path | None = None,
    memory_budget_bytes: int = 2 * 1024 * 1024 * 1024,
) -> dict[str, Any]:
    """Train or resume, save one immutable step and its model card, report aggregates."""
    if steps_this_run is not None and (type(steps_this_run) is not int or steps_this_run < 1):
        raise ValueError("Invalid masked training step count")
    resources = admit_resources(patch_plan, plan, memory_budget_bytes)
    audit, store = _opened(approved, images, checkpoint_dir, plan, patch_plan, revocations)
    training = _rows(approved, images, plan, "train")
    heldout = _rows(approved, images, plan, "eval")
    if resume:
        start, model, _ = store.load()
    elif store.latest_exists():
        raise ValueError("Masked training run already exists; resume it instead")
    else:
        start, model = 0, initial_weights(patch_plan)
    if start >= plan.steps:
        raise ValueError("Masked training has completed")
    end = min(plan.steps, start + (steps_this_run or plan.steps))
    before = evaluate(heldout, patch_plan, model, audit)
    model, loss = _train_steps(training, patch_plan, plan, model, start, end)
    after = evaluate(heldout, patch_plan, model, audit)
    # Revocations or withdrawals during the run must stop the save.
    current = validate_corpus(
        approved, images, plan, revocations=revocations, check_image_bytes=False,
    )
    if (current.manifest_sha256, current.revocations_sha256) != (
        audit.manifest_sha256, audit.revocations_sha256
    ):
        raise ValueError("Approved corpus changed during training")
    digest = store.save(end, model, train_loss=loss)
    card = build_model_card(
        step=end, patch_plan=patch_plan, training_plan=plan, audit=audit,
        evaluation=after, checkpoint_sha256=digest, parameters=model.parameter_count(),
    )
    card_digest = publish_once(
        model_card_path(checkpoint_dir, end), encode_private_json(verify_model_card(card)),
    )
    return {
        "schema": "beljour-masked-training-report/1",
        "steps": end,
        "train_loss": round(loss, 9),
        "before": before,
        "after": after,
        "resource_estimate": resources.public(),
        "checkpoint_sha256": digest,
        "model_card_sha256": card_digest,
        "persisted": "NUMERIC_ARRAYS_ONLY",
        "release_gate": "NOT_RUN",
    }


@dataclass(frozen=True)
class LoadedCheckpoint:
    audit: CorpusAudit
    step: int
    weights: PatchWeights
    archive_sha256: str


def load_masked_checkpoint(
    approved: Path, images: Path, checkpoint_dir: Path, plan: TrainingPlan,
    patch_plan: PatchPlan, *, revocations: Path | None = None,
) -> LoadedCheckpoint:
    """Audit the corpus, then open the checkpoint bound to exactly that audit."""
    if not (checkpoint_dir / LATEST_NAME).exists():
        raise ValueError("No masked checkpoint to score")
    audit, store = _opened(approved, images, checkpoint_dir, plan, patch_plan, revocations)
    step, model, metadata = store.load()
    return LoadedCheckpoint(audit, step, model, metadata["archive_sha256"])


def score_masked_checkpoint(
    approved: Path,
    images: Path,
    checkpoint_dir: Path,
    plan: TrainingPlan,
    patch_plan: PatchPlan,
    *,
    revocations: Path | None = None,
) -> dict[str, Any]:
    """Re-score the stored weights on the audited heldout split."""
    loaded = load_masked_checkpoint(
        approved, images, checkpoint_dir, plan, patch_plan, revocations=revocations,
    )
    heldout = _rows(approved, images, plan, "eval")
    return {
        "schema": "beljour-masked-scoring-report/1",
        "step": loaded.step,
        "evaluation": evaluate(heldout, patch_plan, loaded.weights, loaded.audit),
        "release_gate": "NOT_RUN",
    }

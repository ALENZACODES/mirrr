"""Offline NumPy reconstruction reference with guarded numeric checkpoints.

A linear autoencoder (encoder, latent code, decoder) is trained with analytic
gradients on audited `train` images and scored on the subject-disjoint `eval`
split. It is an auditable ingest and checkpointing baseline, not a foundation
model, and its scores are synthetic-fixture measurements, not quality evidence.

Checkpoints hold only float32 arrays in a stored ZIP plus JSON metadata. Each
step's arrays and metadata are immutable once written; `latest.json` points at
the newest step through the metadata digest. Resume refuses changed plans,
manifests or revocation registers, changed or corrupted arrays, unknown member
names, wrong precision, wrong shapes and nonfinite weights.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io
import re
import stat
import zipfile
from collections import defaultdict
from collections.abc import Iterator, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

from .atomic import (
    PrivateJsonError,
    decode_private_json,
    encode_private_json,
    read_private_bytes,
    write_private_bytes,
    write_private_json,
)
from .audit import CorpusAudit, _iter_rows, validate_corpus
from .pipeline import TrainingPlan, checked_image, read_pixels
from .policy import ImageGrant
from .scoring import psnr_db

CHECKPOINT_SCHEMA = "beljour-reference-checkpoint/1"
POINTER_SCHEMA = "beljour-reference-latest/1"
REPORT_SCHEMA = "beljour-reference-training/1"
LATEST_NAME = "latest.json"
MEMBERS = ("encoder.npy", "encoder_bias.npy", "decoder.npy", "decoder_bias.npy")
MAX_NPY_HEADER = 4096
MAX_METADATA_BYTES = 8192
EVAL_CHUNK = 64
# ASSUMED: global gradient-norm clip that keeps one update bounded.
MAX_GRADIENT_NORM = 10.0
_STEP_NAME = re.compile(r"step-([0-9]{8})\.(npz|json)\Z")
_SHA = re.compile(r"[0-9a-f]{64}\Z")
# Fixed ZIP timestamp so identical weights always produce identical bytes.
_ZIP_TIME = (1980, 1, 1, 0, 0, 0)

Array = NDArray[np.float32]


@dataclass(frozen=True)
class ReferenceWeights:
    encoder: Array
    encoder_bias: Array
    decoder: Array
    decoder_bias: Array

    def arrays(self) -> dict[str, Array]:
        return {
            "encoder.npy": self.encoder, "encoder_bias.npy": self.encoder_bias,
            "decoder.npy": self.decoder, "decoder_bias.npy": self.decoder_bias,
        }

    def verify(self, plan: TrainingPlan) -> None:
        for name, shape in member_shapes(plan).items():
            array = self.arrays()[name]
            if array.dtype != np.float32:
                raise ValueError("Checkpoint precision is not float32")
            if array.shape != shape:
                raise ValueError("Checkpoint array shape mismatch")
            if not np.all(np.isfinite(array)):
                raise ValueError("Checkpoint contains nonfinite weights")


def pixel_width(plan: TrainingPlan) -> int:
    return plan.image_size * plan.image_size * 3


def member_shapes(plan: TrainingPlan) -> dict[str, tuple[int, ...]]:
    width, latent = pixel_width(plan), plan.latent_dim
    return {
        "encoder.npy": (width, latent), "encoder_bias.npy": (latent,),
        "decoder.npy": (latent, width), "decoder_bias.npy": (width,),
    }


def initial_weights(plan: TrainingPlan) -> ReferenceWeights:
    """Seeded scaled-normal initialisation; biases start at zero."""
    plan.validate()
    width, latent = pixel_width(plan), plan.latent_dim
    rng = np.random.default_rng([plan.seed, 0x5EED])
    return ReferenceWeights(
        (rng.standard_normal((width, latent)) / np.sqrt(width)).astype(np.float32),
        np.zeros(latent, dtype=np.float32),
        (rng.standard_normal((latent, width)) / np.sqrt(latent)).astype(np.float32),
        np.zeros(width, dtype=np.float32),
    )


def reconstruct(pixels: Array, weights: ReferenceWeights) -> Array:
    code = pixels @ weights.encoder + weights.encoder_bias
    return np.asarray(code @ weights.decoder + weights.decoder_bias, dtype=np.float32)


def training_step(
    pixels: Array, weights: ReferenceWeights, learning_rate: float,
) -> tuple[ReferenceWeights, float]:
    """One clipped gradient step on per-image summed squared error.

    The reported loss is the per-pixel MSE of the batch before the update.
    """
    count = pixels.shape[0]
    code = pixels @ weights.encoder + weights.encoder_bias
    residual = code @ weights.decoder + weights.decoder_bias - pixels
    loss = float(np.mean(residual * residual))
    grad_output = (2.0 / count) * residual
    grad_decoder = code.T @ grad_output
    grad_decoder_bias = grad_output.sum(axis=0)
    grad_code = grad_output @ weights.decoder.T
    grad_encoder = pixels.T @ grad_code
    grad_encoder_bias = grad_code.sum(axis=0)
    gradients = (grad_encoder, grad_encoder_bias, grad_decoder, grad_decoder_bias)
    norm = float(np.sqrt(sum(float(np.sum(g * g)) for g in gradients)))
    if not np.isfinite(norm) or not np.isfinite(loss):
        raise ValueError("Nonfinite training update")
    scale = learning_rate * min(1.0, MAX_GRADIENT_NORM / norm) if norm > 0 else 0.0
    updated = ReferenceWeights(*(
        (current - scale * gradient).astype(np.float32)
        for current, gradient in zip(
            (weights.encoder, weights.encoder_bias, weights.decoder, weights.decoder_bias),
            gradients, strict=True,
        )
    ))
    return updated, loss


def batch_indices(count: int, *, step: int, seed: int, batch_size: int) -> NDArray[np.int64]:
    """Deterministic per-step minibatch, so a resumed run equals an unbroken one."""
    if count < 1:
        raise ValueError("Empty training split")
    rng = np.random.default_rng([seed, step])
    return np.asarray(rng.choice(count, size=batch_size, replace=count < batch_size), dtype=np.int64)


def split_grants(approved: Path, plan: TrainingPlan, split: str) -> list[ImageGrant]:
    return list(_iter_rows(approved / f"{split}.jsonl", split=split, plan=plan))


def load_pixels(images: Path, grants: Sequence[ImageGrant], size: int) -> Array:
    """Re-verify every image's bytes and hash immediately before use."""
    return np.stack([read_pixels(checked_image(images, grant), size) for grant in grants])


def _chunks(items: Sequence[ImageGrant]) -> Iterator[Sequence[ImageGrant]]:
    for start in range(0, len(items), EVAL_CHUNK):
        yield items[start:start + EVAL_CHUNK]


def heldout_scores(
    images: Path, heldout: Sequence[ImageGrant], plan: TrainingPlan, weights: ReferenceWeights,
) -> dict[str, Any]:
    """Aggregate heldout MSE/PSNR overall and per source; no per-image records."""
    totals: dict[str, float] = defaultdict(float)
    counts: dict[str, int] = defaultdict(int)
    for chunk in _chunks(heldout):
        pixels = load_pixels(images, chunk, plan.image_size)
        errors = np.mean((reconstruct(pixels, weights) - pixels) ** 2, axis=1)
        for grant, error in zip(chunk, errors, strict=True):
            totals[grant.source] += float(error)
            counts[grant.source] += 1
    count = sum(counts.values())
    if count < 1:
        raise ValueError("Empty heldout split")
    mse = sum(totals.values()) / count
    return {
        "count": count,
        "mse": round(mse, 9),
        "psnr_db": round(psnr_db(mse), 6),
        "sources": [
            {"source": name, "count": counts[name], "mse": totals[name] / counts[name]}
            for name in sorted(counts)
        ],
    }


def encode_weights(weights: ReferenceWeights) -> bytes:
    """Deterministic stored ZIP of little-endian float32 NPY members."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_STORED) as archive:
        for name, array in weights.arrays().items():
            member = io.BytesIO()
            np.lib.format.write_array(member, np.ascontiguousarray(array, dtype="<f4"), allow_pickle=False)
            info = zipfile.ZipInfo(name, date_time=_ZIP_TIME)
            info.external_attr = 0o600 << 16
            archive.writestr(info, member.getvalue())
    return buffer.getvalue()


def _member_limit(plan: TrainingPlan) -> dict[str, int]:
    return {
        name: int(np.prod(shape)) * 4 + MAX_NPY_HEADER
        for name, shape in member_shapes(plan).items()
    }


def checkpoint_size_limit(plan: TrainingPlan) -> int:
    return sum(_member_limit(plan).values()) + 4096


def decode_weights(data: bytes, plan: TrainingPlan) -> ReferenceWeights:
    """Inspect the archive directory before any array is allocated."""
    limits = _member_limit(plan)
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            infos = archive.infolist()
            names = [info.filename for info in infos]
            if sorted(names) != sorted(MEMBERS):
                raise ValueError("Unexpected checkpoint member names")
            loaded: dict[str, Array] = {}
            for info in infos:
                if info.is_dir() or info.flag_bits & 0x1 or info.compress_type != zipfile.ZIP_STORED:
                    raise ValueError("Unsupported checkpoint member")
                if info.file_size > limits[info.filename]:
                    raise ValueError("Oversized checkpoint member")
                with archive.open(info) as stream:
                    array = np.lib.format.read_array(stream, allow_pickle=False)
                if array.dtype != np.dtype("<f4"):
                    raise ValueError("Checkpoint precision is not float32")
                loaded[info.filename] = np.asarray(array, dtype=np.float32)
    except (zipfile.BadZipFile, zipfile.LargeZipFile, EOFError, OSError) as exc:
        raise ValueError("Invalid checkpoint archive") from exc
    weights = ReferenceWeights(*(loaded[name] for name in MEMBERS))
    weights.verify(plan)
    return weights


def _binding(plan: TrainingPlan, audit: CorpusAudit) -> dict[str, Any]:
    return {
        "plan_sha256": plan.digest(),
        "manifest_sha256": audit.manifest_sha256,
        "revocations_sha256": audit.revocations_sha256,
    }


def _step_paths(folder: Path, step: int) -> tuple[Path, Path]:
    if not 1 <= step <= 10_000_000:
        raise ValueError("Invalid checkpoint step")
    return folder / f"step-{step:08d}.npz", folder / f"step-{step:08d}.json"


def _publish_immutable(path: Path, data: bytes, limit: int) -> None:
    """Write once; an existing step is accepted only if byte-identical."""
    try:
        write_private_bytes(path, data, replace=False)
    except FileExistsError:
        if read_private_bytes(path, max_bytes=limit) != data:
            raise ValueError("Immutable checkpoint step already differs") from None


def save_checkpoint(
    folder: Path, step: int, weights: ReferenceWeights, plan: TrainingPlan, audit: CorpusAudit,
) -> str:
    """Publish arrays, then immutable metadata, then move the latest pointer."""
    weights.verify(plan)
    arrays_path, metadata_path = _step_paths(folder, step)
    payload = encode_weights(weights)
    _publish_immutable(arrays_path, payload, checkpoint_size_limit(plan))
    metadata = encode_private_json({
        "schema": CHECKPOINT_SCHEMA,
        "step": step,
        "image_size": plan.image_size,
        "latent_dim": plan.latent_dim,
        "weights_sha256": hashlib.sha256(payload).hexdigest(),
        **_binding(plan, audit),
    })
    _publish_immutable(metadata_path, metadata, MAX_METADATA_BYTES)
    digest = hashlib.sha256(metadata).hexdigest()
    write_private_json(folder / LATEST_NAME, {
        "schema": POINTER_SCHEMA, "step": step, "metadata_sha256": digest,
    })
    return digest


def load_checkpoint(
    folder: Path, plan: TrainingPlan, audit: CorpusAudit,
) -> tuple[int, ReferenceWeights]:
    """Resume only the exact plan, manifests and register a checkpoint was bound to."""
    try:
        pointer = decode_private_json(
            read_private_bytes(folder / LATEST_NAME, max_bytes=MAX_METADATA_BYTES),
        )
        if set(pointer) != {"schema", "step", "metadata_sha256"} or pointer["schema"] != POINTER_SCHEMA:
            raise ValueError("Invalid checkpoint pointer")
        step = pointer["step"]
        if type(step) is not int or not isinstance(pointer["metadata_sha256"], str):
            raise ValueError("Invalid checkpoint pointer")
        arrays_path, metadata_path = _step_paths(folder, step)
        raw = read_private_bytes(metadata_path, max_bytes=MAX_METADATA_BYTES)
        if hashlib.sha256(raw).hexdigest() != pointer["metadata_sha256"]:
            raise ValueError("Checkpoint metadata digest mismatch")
        metadata = decode_private_json(raw)
        expected = {
            "schema", "step", "image_size", "latent_dim", "weights_sha256",
            "plan_sha256", "manifest_sha256", "revocations_sha256",
        }
        if set(metadata) != expected or metadata["schema"] != CHECKPOINT_SCHEMA or metadata["step"] != step:
            raise ValueError("Invalid checkpoint metadata")
        if (metadata["image_size"], metadata["latent_dim"]) != (plan.image_size, plan.latent_dim):
            raise ValueError("Input or configuration changed since checkpoint")
        if {key: metadata[key] for key in _binding(plan, audit)} != _binding(plan, audit):
            raise ValueError("Input or configuration changed since checkpoint")
        digest = metadata["weights_sha256"]
        if not isinstance(digest, str) or _SHA.fullmatch(digest) is None:
            raise ValueError("Invalid checkpoint metadata")
        payload = read_private_bytes(arrays_path, max_bytes=checkpoint_size_limit(plan))
    except PrivateJsonError as exc:
        raise ValueError(f"Unreadable checkpoint: {exc.code}") from exc
    if hashlib.sha256(payload).hexdigest() != digest:
        raise ValueError("Checkpoint array digest mismatch")
    return step, decode_weights(payload, plan)


def _checkpoint_folder(folder: Path, approved: Path, images: Path) -> None:
    resolved = folder.resolve()
    for private in (approved, images):
        if resolved.is_relative_to(private.resolve()):
            raise ValueError("Keep checkpoints outside approved manifests and source images")
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    if folder.is_symlink() or not folder.is_dir():
        raise ValueError("Invalid checkpoint directory")
    if folder.stat().st_mode & (stat.S_IWGRP | stat.S_IWOTH):
        raise ValueError("Untrusted checkpoint directory")
    for item in folder.iterdir():
        if item.name != LATEST_NAME and _STEP_NAME.fullmatch(item.name) is None:
            if not item.name.startswith(".private-json-"):
                raise ValueError("Unexpected file in checkpoint directory")


def train(
    approved: Path,
    images: Path,
    checkpoint_dir: Path,
    plan: TrainingPlan,
    *,
    resume: bool = False,
    steps_this_run: int | None = None,
    revocations: Path | None = None,
) -> dict[str, Any]:
    """Audit, train up to ``steps_this_run`` steps, re-audit, then checkpoint.

    Returns aggregates only: step count, last batch loss and heldout MSE/PSNR
    before and after this run. No path, subject, hash or pixel is reported.
    """
    plan.validate()
    if steps_this_run is not None and steps_this_run < 1:
        raise ValueError("Invalid training step count")
    audit = validate_corpus(approved, images, plan, revocations=revocations, check_image_bytes=True)
    _checkpoint_folder(checkpoint_dir, approved, images)
    if resume:
        start, weights = load_checkpoint(checkpoint_dir, plan, audit)
    else:
        if (checkpoint_dir / LATEST_NAME).exists():
            raise ValueError("Checkpoint run exists; resume it or use a new directory")
        start, weights = 0, initial_weights(plan)
    if start >= plan.steps:
        raise ValueError("Training has completed")
    end = min(plan.steps, start + (steps_this_run or plan.steps))
    training = split_grants(approved, plan, "train")
    heldout = split_grants(approved, plan, "eval")
    before = heldout_scores(images, heldout, plan, weights)
    loss = 0.0
    for step in range(start, end):
        chosen = batch_indices(len(training), step=step, seed=plan.seed, batch_size=plan.batch_size)
        pixels = load_pixels(images, [training[index] for index in chosen], plan.image_size)
        weights, loss = training_step(pixels, weights, plan.learning_rate)
    # A withdrawal or edit during the run must not be sealed into a checkpoint.
    if validate_corpus(
        approved, images, plan, revocations=revocations, check_image_bytes=False,
    ).manifest_sha256 != audit.manifest_sha256:
        raise ValueError("Input or configuration changed during training")
    save_checkpoint(checkpoint_dir, end, weights, plan, audit)
    return {
        "schema": REPORT_SCHEMA,
        "steps": end,
        "steps_this_run": end - start,
        "train_loss": round(loss, 9),
        "heldout_before": before,
        "heldout_after": heldout_scores(images, heldout, plan, weights),
        "checkpoint": "NUMERIC_ONLY",
        "release_quality": "NOT_RUN",
        "real_face_evaluation": "NOT_RUN",
    }

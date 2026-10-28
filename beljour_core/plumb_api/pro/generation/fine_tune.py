"""Licence-clear local fine-tuning path with ciphertext-only adapter export. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from ..training.audit import validate_corpus
from ..training.pipeline import TrainingPlan, checked_image
from ..training.sealed_store import ArtefactProtectionError, SealedStore
from ..training.shard_stream import ShardReader
from .contracts import MODEL_ID, GenerationRefused, canonical_json
from .rights import AllowedModel

FINE_TUNE_SCHEMA = "beljour-schnell-finetune/1"
MAX_TRAIN_BATCHES = 100_000
MAX_ADAPTER_BYTES = 256 * 1024 * 1024


@dataclass(frozen=True)
class FineTuneSettings:
    """Read only from authenticated ciphertext; no production presets are embedded."""

    batches: int
    batch_size: int
    image_size: int
    seed: int

    @classmethod
    def decode(cls, raw: bytearray) -> FineTuneSettings:
        try:
            loaded: object = json.loads(raw)
        except (ValueError, UnicodeError) as exc:
            raise GenerationRefused("invalid_finetune_settings") from exc
        if not isinstance(loaded, dict) or set(loaded) != {
            "schema", "batches", "batch_size", "image_size", "seed"
        } or loaded.get("schema") != FINE_TUNE_SCHEMA:
            raise GenerationRefused("invalid_finetune_settings")
        values = (loaded["batches"], loaded["batch_size"], loaded["image_size"], loaded["seed"])
        if any(type(value) is not int for value in values):
            raise GenerationRefused("invalid_finetune_settings")
        batches, batch_size, image_size, seed = values
        if (not 1 <= batches <= MAX_TRAIN_BATCHES or not 1 <= batch_size <= 8 or
            image_size not in (256, 512, 768) or not 0 <= seed < 2**32):
            raise GenerationRefused("invalid_finetune_settings")
        return cls(batches, batch_size, image_size, seed)


class FineTuneBackend(Protocol):
    """Locally installed trainer using the already verified schnell base model."""

    def base_identity(self) -> tuple[str, str]: ...

    def fit_batch(self, images: tuple[NDArray[np.uint8], ...]) -> float: ...

    def export_adapter(self) -> bytearray: ...

    def close(self) -> None: ...


@dataclass(frozen=True)
class FineTuneReceipt:
    batches: int
    images_seen: int
    mean_measured_loss: float
    encrypted_checkpoint_sha256: str
    source_manifest_sha256: str
    status: str = "EXPERIMENTAL_NOT_QUALITY_PASSED"

    def public(self) -> dict[str, Any]:
        return vars(self).copy()


def _read_images(
    paths: tuple[Path, ...], *, size: int,
) -> tuple[NDArray[np.uint8], ...]:
    arrays: list[NDArray[np.uint8]] = []
    try:
        for path in paths:
            with Image.open(path) as image:
                if image.width * image.height > 24_000_000:
                    raise GenerationRefused("invalid_finetune_image")
                sampled = image.convert("RGB").resize((size, size), Image.Resampling.BILINEAR)
                arrays.append(np.array(sampled, dtype=np.uint8, copy=True))
        return tuple(arrays)
    except Exception:
        for array in arrays:
            array.fill(0)
        raise


def _fine_tune_approved_impl(
    *,
    model: AllowedModel,
    store: SealedStore,
    config_path: Path,
    approved: Path,
    images: Path,
    training_plan: TrainingPlan,
    output: Path,
    backend: FineTuneBackend,
    revocations: Path | None = None,
) -> FineTuneReceipt:
    """Always re-audit the image corpus and save trained adapter bytes encrypted."""
    if backend.base_identity() != (MODEL_ID, model.bundle.revision):
        raise GenerationRefused("finetune_wrong_base_model")
    if model.bundle.sealed_key_id != store.key_id:
        raise GenerationRefused("finetune_wrong_key")
    audit = validate_corpus(approved, images, training_plan, revocations=revocations)
    binding = canonical_json({
        "schema": FINE_TUNE_SCHEMA,
        "bundle": model.bundle.bundle_sha256,
        "approved": audit.manifest_sha256,
        "revocations": audit.revocations_sha256,
    })
    try:
        with store.opened(config_path, kind="tuning", binding=binding) as content:
            settings = FineTuneSettings.decode(content)
            settings_hash = hashlib.sha256(content).hexdigest()
    except ArtefactProtectionError as exc:
        raise GenerationRefused("finetune_settings_unavailable") from exc
    reader = ShardReader(
        approved, images, training_plan, shard=0, shard_count=1,
        split="train", revocations=revocations,
    )
    used = 0
    losses: list[float] = []
    result_bytes: bytearray | None = None
    try:
        for _ in range(settings.batches):
            grants = reader.next_batch(settings.batch_size)
            if not grants:
                break
            paths = tuple(checked_image(images, grant) for grant in grants)
            tensors = _read_images(paths, size=settings.image_size)
            try:
                loss = float(backend.fit_batch(tensors))
                if not math.isfinite(loss) or loss < 0:
                    raise GenerationRefused("invalid_finetune_measurement")
                losses.append(loss)
                used += len(tensors)
            finally:
                for tensor in tensors:
                    tensor.fill(0)
        if not losses:
            raise GenerationRefused("finetune_no_training_data")
        result_bytes = backend.export_adapter()
        if not isinstance(result_bytes, bytearray) or not 1 <= len(result_bytes) <= MAX_ADAPTER_BYTES:
            raise GenerationRefused("invalid_finetune_adapter")
        checkpoint_binding = canonical_json({
            "schema": "beljour-schnell-adapter/1",
            "bundle": model.bundle.bundle_sha256,
            "manifest": audit.manifest_sha256,
            "revocations": audit.revocations_sha256,
            "settings": settings_hash,
        })
        digest = store.put(output, result_bytes, kind="checkpoint", binding=checkpoint_binding)
        return FineTuneReceipt(
            len(losses), used, sum(losses) / len(losses), digest, audit.manifest_sha256,
        )
    finally:
        if result_bytes is not None:
            result_bytes[:] = b"\x00" * len(result_bytes)


def fine_tune_approved_only(
    *,
    model: AllowedModel,
    store: SealedStore,
    config_path: Path,
    approved: Path,
    images: Path,
    training_plan: TrainingPlan,
    output: Path,
    backend: FineTuneBackend,
    revocations: Path | None = None,
) -> FineTuneReceipt:
    """Always close a privileged model runtime, including preflight refusals."""
    try:
        return _fine_tune_approved_impl(
            model=model, store=store, config_path=config_path, approved=approved,
            images=images, training_plan=training_plan, output=output,
            backend=backend, revocations=revocations,
        )
    finally:
        backend.close()

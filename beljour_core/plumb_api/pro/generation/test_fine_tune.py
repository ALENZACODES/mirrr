"""Commercial-rights-gated synthetic adapter training and sealed persistence tests. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
import pytest
from numpy.typing import NDArray

from ..training.audit import CorpusAudit, validate_corpus
from ..training.test_support import DrawnCorpus, make_corpus
from .contracts import GenerationRefused, canonical_json
from .fine_tune import FINE_TUNE_SCHEMA, FineTuneReceipt, FineTuneSettings, fine_tune_approved_only
from .test_support import LocalBundleFixture, make_bundle


class SyntheticAdapterTrainer:
    def __init__(self, *, model_revision: str = "b" * 40) -> None:
        self.model_revision = model_revision
        self.steps = 0
        self.closed = False
        self.tensors: list[NDArray[np.uint8]] = []
        self.exported: bytearray | None = None
        self.abort = False

    def base_identity(self) -> tuple[str, str]:
        return "black-forest-labs/FLUX.1-schnell", self.model_revision

    def fit_batch(self, images: tuple[NDArray[np.uint8], ...]) -> float:
        if self.abort:
            raise ValueError("synthetic failure")
        self.steps += 1
        self.tensors.extend(images)
        assert all(image.shape == (256, 256, 3) for image in images)
        return float(sum(float(np.mean(image)) for image in images) / 255 / len(images))

    def export_adapter(self) -> bytearray:
        self.exported = bytearray(b"synthetic-adapter-only" * 3)
        return self.exported

    def close(self) -> None:
        self.closed = True


def _bundle_and_corpus(root: Path) -> tuple[LocalBundleFixture, DrawnCorpus, CorpusAudit]:
    bundle = make_bundle(root / "model")
    corpus = make_corpus(root / "corpus", size=18)
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan)
    return bundle, corpus, audit


def _settings_file(
    root: Path, bundle: LocalBundleFixture, audit: CorpusAudit,
    *, batches: int = 2, batch_size: int = 2, image_size: int = 256,
) -> Path:
    payload = {
        "schema": FINE_TUNE_SCHEMA,
        "batches": batches,
        "batch_size": batch_size,
        "image_size": image_size,
        "seed": 321,
    }
    binding = canonical_json({
        "schema": FINE_TUNE_SCHEMA,
        "bundle": bundle.approved.bundle.bundle_sha256,
        "approved": audit.manifest_sha256,
        "revocations": audit.revocations_sha256,
    })
    file = root / "sealed-finetune-settings.bjev"
    bundle.store.put(file, json.dumps(payload).encode(), kind="tuning", binding=binding)
    return file


def _execute(
    bundle: LocalBundleFixture, corpus: DrawnCorpus,
    settings_file: Path, output: Path, backend: SyntheticAdapterTrainer,
) -> FineTuneReceipt:
    return fine_tune_approved_only(
        model=bundle.approved,
        store=bundle.store,
        config_path=settings_file,
        approved=corpus.approved,
        images=corpus.photos,
        training_plan=corpus.plan,
        output=output,
        backend=backend,
    )


def test_cleared_drawn_corpus_produces_only_encrypted_adapter(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    file = _settings_file(tmp_path, bundle, audit)
    trainer = SyntheticAdapterTrainer()
    output = tmp_path / "sealed-adapter.bjev"
    receipt = _execute(bundle, corpus, file, output, trainer)
    assert receipt.batches == 2
    assert receipt.images_seen == 4
    assert 0 < receipt.mean_measured_loss < 1
    assert receipt.source_manifest_sha256 == audit.manifest_sha256
    assert receipt.status == "EXPERIMENTAL_NOT_QUALITY_PASSED"
    assert output.exists()
    assert output.read_bytes().startswith(b"BLJRSEAL1")
    assert b"synthetic-adapter-only" not in output.read_bytes()
    assert hashlib.sha256(output.read_bytes()).hexdigest() == receipt.encrypted_checkpoint_sha256
    assert trainer.closed
    assert trainer.exported is not None
    assert not any(trainer.exported)
    assert all(not image.any() for image in trainer.tensors)
    assert b"\"batches\"" not in file.read_bytes()


@pytest.mark.parametrize("changes", [
    {"batches": 0}, {"batches": 100_001}, {"image_size": 128},
    {"batch_size": 0}, {"batch_size": 9}, {"seed": -1},
    {"seed": 2**32}, {"batches": "2"},
])
def test_invalid_encrypted_finetune_settings(changes: dict[str, Any]) -> None:
    payload: dict[str, Any] = {
        "schema": FINE_TUNE_SCHEMA,
        "batches": 4,
        "batch_size": 2,
        "image_size": 256,
        "seed": 9,
    }
    payload.update(changes)
    with pytest.raises(GenerationRefused, match="settings"):
        FineTuneSettings.decode(bytearray(json.dumps(payload).encode()))


def test_wrong_base_model_rejected_before_data_used(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    file = _settings_file(tmp_path, bundle, audit)
    backend = SyntheticAdapterTrainer(model_revision="0" * 40)
    with pytest.raises(GenerationRefused, match="base_model"):
        _execute(bundle, corpus, file, tmp_path / "sealed-adapter.bjev", backend)
    assert not backend.steps


def test_wrong_encryption_key_refuses_configuration(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    file = _settings_file(tmp_path, bundle, audit)
    file.write_bytes(file.read_bytes()[:-1] + b"x")
    with pytest.raises(GenerationRefused, match="settings_unavailable"):
        _execute(bundle, corpus, file, tmp_path / "sealed-adapter.bjev", SyntheticAdapterTrainer())


def test_training_backend_failure_does_not_create_plaintext(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    file = _settings_file(tmp_path, bundle, audit)
    trainer = SyntheticAdapterTrainer()
    trainer.abort = True
    output = tmp_path / "sealed-adapter.bjev"
    with pytest.raises(ValueError, match="failure"):
        _execute(bundle, corpus, file, output, trainer)
    assert not output.exists()
    assert trainer.closed


def test_revoked_corpus_is_rejected_before_fit(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    file = _settings_file(tmp_path, bundle, audit)
    record = corpus.records[0]
    doc = {
        "schema": "beljour-training-revocations/1",
        "subjects": [record["subject_key"]],
        "images": [],
    }
    revocations = tmp_path / "revoked.json"
    revocations.write_text(json.dumps(doc))
    trainer = SyntheticAdapterTrainer()
    with pytest.raises(ValueError):
        fine_tune_approved_only(
            model=bundle.approved, store=bundle.store, config_path=file,
            approved=corpus.approved, images=corpus.photos,
            training_plan=corpus.plan, output=tmp_path / "sealed-adapter.bjev",
            backend=trainer, revocations=revocations,
        )
    assert not trainer.steps


def test_approved_manifest_change_is_rejected(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    file = _settings_file(tmp_path, bundle, audit)
    train = corpus.approved / "train.jsonl"
    train.write_bytes(train.read_bytes() + b"\n")
    trainer = SyntheticAdapterTrainer()
    with pytest.raises(ValueError):
        _execute(bundle, corpus, file, tmp_path / "sealed-adapter.bjev", trainer)
    assert trainer.steps == 0


def test_adapter_output_cannot_be_plaintext(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    file = _settings_file(tmp_path, bundle, audit)
    output = tmp_path / "adapter.npz"
    with pytest.raises(ValueError):
        _execute(bundle, corpus, file, output, SyntheticAdapterTrainer())
    assert not output.exists()


def test_invalid_settings_still_close_privileged_backend(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    settings = _settings_file(tmp_path, bundle, audit)
    settings.write_bytes(settings.read_bytes()[:-1] + b"0")
    trainer = SyntheticAdapterTrainer()
    with pytest.raises(GenerationRefused):
        _execute(bundle, corpus, settings, tmp_path / "sealed-adapter.bjev", trainer)
    assert trainer.closed
    assert trainer.steps == 0


def test_wrong_base_rejection_closes_privileged_backend(tmp_path: Path) -> None:
    bundle, corpus, audit = _bundle_and_corpus(tmp_path)
    settings = _settings_file(tmp_path, bundle, audit)
    trainer = SyntheticAdapterTrainer(model_revision="0" * 40)
    with pytest.raises(GenerationRefused):
        _execute(bundle, corpus, settings, tmp_path / "sealed-adapter.bjev", trainer)
    assert trainer.closed

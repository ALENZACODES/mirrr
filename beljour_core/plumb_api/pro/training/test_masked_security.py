"""Masked checkpoints refuse tampering, foreign corpora and unsafe locations.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io
import json
import os
import zipfile
from pathlib import Path

import numpy as np
import pytest

from .atomic import read_private_json, write_private_json
from .audit import CorpusInvalid
from .masked_train import LATEST_NAME, score_masked_checkpoint, train_masked
from .patches import PatchPlan
from .pipeline import TrainingPlan
from .revocations import REVOCATION_SCHEMA_V2
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture
def trained(tmp_path: Path) -> tuple[DrawnCorpus, Path]:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    folder = tmp_path / "checkpoints"
    train_masked(corpus.approved, corpus.photos, folder, corpus.plan, PatchPlan(), steps_this_run=1)
    return corpus, folder


def _score(corpus: DrawnCorpus, folder: Path, plan: PatchPlan | None = None,
           training: TrainingPlan | None = None) -> None:
    score_masked_checkpoint(corpus.approved, corpus.photos, folder,
                            training or corpus.plan, plan or PatchPlan())


def test_checkpoints_inside_the_corpus_are_refused(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    for inside in (corpus.approved / "checkpoints", corpus.photos / "checkpoints", corpus.approved):
        with pytest.raises(ValueError, match="outside"):
            train_masked(corpus.approved, corpus.photos, inside, corpus.plan, PatchPlan())


def test_symlinked_or_shared_checkpoint_folders_are_refused(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    real = tmp_path / "real"
    real.mkdir()
    (tmp_path / "link").symlink_to(real, target_is_directory=True)
    with pytest.raises(ValueError, match="symlink"):
        train_masked(corpus.approved, corpus.photos, tmp_path / "link", corpus.plan, PatchPlan())
    shared = tmp_path / "shared"
    shared.mkdir()
    os.chmod(shared, 0o777)
    with pytest.raises(ValueError, match="other users"):
        train_masked(corpus.approved, corpus.photos, shared, corpus.plan, PatchPlan())


def test_changed_archive_bytes_are_refused(trained: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = trained
    archive = folder / "patch-checkpoint-00000001.npz"
    data = bytearray(archive.read_bytes())
    data[len(data) // 2] ^= 0xFF
    archive.write_bytes(bytes(data))
    with pytest.raises(ValueError, match="digest"):
        _score(corpus, folder)


def test_rewritten_metadata_is_refused(trained: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = trained
    path = folder / "patch-checkpoint-00000001.json"
    metadata = json.loads(path.read_text())
    metadata["train_loss"] = 0.0
    path.chmod(0o600)
    path.write_text(json.dumps(metadata))
    with pytest.raises(ValueError, match="metadata digest"):
        _score(corpus, folder)


def test_a_consistently_forged_archive_still_fails_the_member_guard(
    trained: tuple[DrawnCorpus, Path],
) -> None:
    """Replace the archive and re-sign metadata and pointer: the guard still refuses it."""
    corpus, folder = trained
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as archive:
        archive.writestr("encoder.npy", b"\x93NUMPY")
        archive.writestr("payload.pkl", b"cos\nsystem\n")
    forged = stream.getvalue()
    (folder / "patch-checkpoint-00000001.npz").write_bytes(forged)
    metadata = read_private_json(folder / "patch-checkpoint-00000001.json")
    metadata["archive_sha256"] = hashlib.sha256(forged).hexdigest()
    digest = write_private_json(folder / "patch-checkpoint-00000001.json", metadata)
    write_private_json(folder / LATEST_NAME, {**read_private_json(folder / LATEST_NAME),
                                              "metadata_sha256": digest})
    with pytest.raises(ValueError, match="masked checkpoint"):
        _score(corpus, folder)


def test_foreign_plans_cannot_open_the_checkpoint(trained: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = trained
    with pytest.raises(ValueError, match="different corpus"):
        _score(corpus, folder, plan=PatchPlan(masked_fraction=0.4))
    with pytest.raises(CorpusInvalid):
        _score(corpus, folder, training=TrainingPlan(
            image_size=32, latent_dim=32, batch_size=4, steps=5,
            learning_rate=0.0005, seed=2026, holdout_fraction=0.3,
        ))


def test_new_revocation_register_retires_old_checkpoints(trained: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = trained
    register = corpus.root / "revocations.json"
    register.write_text(json.dumps({
        "schema": REVOCATION_SCHEMA_V2, "subjects": [], "images": [], "receipts": [],
    }))
    # The ingest summary was bound to "no register"; a register is a corpus change.
    with pytest.raises(CorpusInvalid, match="revocation"):
        score_masked_checkpoint(corpus.approved, corpus.photos, folder, corpus.plan,
                                PatchPlan(), revocations=register)


def test_pointer_to_missing_step_fails_closed(trained: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = trained
    write_private_json(folder / LATEST_NAME, {**read_private_json(folder / LATEST_NAME), "step": 9})
    with pytest.raises(ValueError):
        _score(corpus, folder)


def test_nonfinite_weights_in_a_valid_archive_are_refused(trained: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = trained
    archive = folder / "patch-checkpoint-00000001.npz"
    with np.load(archive) as source:
        arrays = {name: source[name].copy() for name in source.files}
    arrays["decoder"][0, 0] = np.nan
    stream = io.BytesIO()
    np.savez_compressed(stream, **arrays)
    archive.chmod(0o600)
    archive.write_bytes(stream.getvalue())
    metadata = read_private_json(folder / "patch-checkpoint-00000001.json")
    metadata["archive_sha256"] = hashlib.sha256(stream.getvalue()).hexdigest()
    digest = write_private_json(folder / "patch-checkpoint-00000001.json", metadata)
    write_private_json(folder / LATEST_NAME, {**read_private_json(folder / LATEST_NAME),
                                              "metadata_sha256": digest})
    with pytest.raises(ValueError, match="Nonfinite"):
        _score(corpus, folder)


def test_changed_training_image_stops_a_run(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    (corpus.photos / corpus.records[0]["image"]).write_bytes(b"not the approved image")
    with pytest.raises(ValueError, match="image_hash_mismatch"):
        train_masked(corpus.approved, corpus.photos, tmp_path / "checkpoints", corpus.plan, PatchPlan())

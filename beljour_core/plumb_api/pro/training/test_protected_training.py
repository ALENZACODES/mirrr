"""Synthetic checkpoint privacy in full audit and training paths. Author: John Khan."""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from .audit import validate_corpus
from .patches import PatchPlan
from .protected_training import score_masked_protected, train_masked_protected
from .sealed_checkpoint import SealedNumericCheckpoints
from .sealed_store import ArtefactProtectionError, SealedStore
from .test_support import DrawnCorpus, make_corpus


def _secure(tmp_path: Path) -> tuple[DrawnCorpus, SealedNumericCheckpoints]:
    suite = pytest.importorskip("cryptography.hazmat.primitives.ciphers.aead")
    corpus = make_corpus(tmp_path)
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan)
    vault = SealedStore(suite.AESGCM(os.urandom(32)), "OperatorKey98")
    protected = SealedNumericCheckpoints(
        tmp_path / "protected", vault, patch_plan=PatchPlan(),
        training_digest=corpus.plan.digest(), manifest_digest=audit.manifest_sha256,
    )
    return corpus, protected


def test_protected_training_and_resume_never_write_plain_numpy(tmp_path: Path) -> None:
    corpus, vault = _secure(tmp_path)
    first = train_masked_protected(
        corpus.approved, corpus.photos, vault, corpus.plan, PatchPlan(), steps_this_run=2,
    )
    assert first["steps"] == 2
    assert first["persisted"] == "CIPHERTEXT_ONLY"
    second = train_masked_protected(
        corpus.approved, corpus.photos, vault, corpus.plan, PatchPlan(), resume=True,
    )
    assert second["steps"] == corpus.plan.steps
    assert second["release_gate"] == "NOT_RUN"
    files = list(vault.directory.iterdir())
    assert files and all(item.suffix == ".bjev" for item in files)
    assert not any(item.read_bytes().startswith(b"PK\x03\x04") for item in files)
    evaluated = score_masked_protected(
        corpus.approved, corpus.photos, vault, corpus.plan, PatchPlan(),
    )
    assert evaluated["step"] == corpus.plan.steps
    assert evaluated["release_gate"] == "NOT_RUN"


def test_mismatched_manifest_refuses_prior_checkpoint_access(tmp_path: Path) -> None:
    corpus, checkpoint = _secure(tmp_path)
    first = train_masked_protected(
        corpus.approved, corpus.photos, checkpoint, corpus.plan, PatchPlan(),
        steps_this_run=1,
    )
    assert first["steps"] == 1
    different = SealedNumericCheckpoints(
        checkpoint.directory, checkpoint.store, patch_plan=PatchPlan(),
        training_digest=corpus.plan.digest(), manifest_digest="c" * 64,
    )
    with pytest.raises(ArtefactProtectionError, match="binding"):
        train_masked_protected(
            corpus.approved, corpus.photos, different, corpus.plan, PatchPlan(), resume=True,
        )


def test_repeat_initial_run_fails_without_overwriting_first_step(tmp_path: Path) -> None:
    corpus, checkpoint = _secure(tmp_path)
    train_masked_protected(
        corpus.approved, corpus.photos, checkpoint, corpus.plan, PatchPlan(),
        steps_this_run=1,
    )
    with pytest.raises(ArtefactProtectionError, match="exists"):
        train_masked_protected(
            corpus.approved, corpus.photos, checkpoint, corpus.plan, PatchPlan(),
            steps_this_run=1,
        )
    assert checkpoint.resume()[0] == 1

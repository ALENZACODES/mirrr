"""Checkpoint encryption and resume using drawn numeric arrays. Author: John Khan."""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pytest

from .patch_model import initial_weights
from .patches import PatchPlan
from .sealed_checkpoint import SealedNumericCheckpoints
from .sealed_store import ArtefactProtectionError, SealedStore


def _build(tmp_path: Path, *, key: bytes | None = None) -> SealedNumericCheckpoints:
    cipher = pytest.importorskip("cryptography.hazmat.primitives.ciphers.aead")
    secret = key if key is not None else os.urandom(32)
    store = SealedStore(cipher.AESGCM(secret), "OperatorKey98")
    return SealedNumericCheckpoints(
        tmp_path / "private", store, patch_plan=PatchPlan(),
        training_digest="a" * 64, manifest_digest="b" * 64,
    )


def test_numeric_checkpoint_never_persists_plaintext_model(tmp_path: Path) -> None:
    store = _build(tmp_path)
    weights = initial_weights(PatchPlan())
    digest = store.save(1, weights)
    files = sorted(file.name for file in store.directory.iterdir())
    assert files == ["sealed-checkpoint-00000001.bjev", "sealed-latest.bjev"]
    assert not any(name.endswith((".npz", ".npy", ".json")) for name in files)
    saved = (store.directory / "sealed-checkpoint-00000001.bjev").read_bytes()
    assert not saved.startswith(b"PK\x03\x04")
    assert len(digest) == 64
    step, restored = store.resume()
    assert step == 1
    np.testing.assert_array_equal(restored.encoder, weights.encoder)
    np.testing.assert_array_equal(restored.decoder, weights.decoder)


def test_changed_manifest_or_revocation_fails_aead_binding(tmp_path: Path) -> None:
    store = _build(tmp_path)
    store.save(2, initial_weights(PatchPlan()))
    changed = SealedNumericCheckpoints(
        store.directory, store.store, patch_plan=PatchPlan(),
        training_digest="a" * 64, manifest_digest="c" * 64,
    )
    with pytest.raises(ArtefactProtectionError, match="authentication"):
        changed.resume()
    revoked = SealedNumericCheckpoints(
        store.directory, store.store, patch_plan=PatchPlan(),
        training_digest="a" * 64, manifest_digest="b" * 64,
        revocation_digest="c" * 64,
    )
    with pytest.raises(ArtefactProtectionError, match="authentication"):
        revoked.resume()


def test_missing_key_is_fail_closed(tmp_path: Path) -> None:
    store = _build(tmp_path)
    store.save(1, initial_weights(PatchPlan()))
    changed = _build(tmp_path)
    with pytest.raises(ArtefactProtectionError, match="authentication"):
        changed.resume()


def test_tampered_step_is_rejected_before_numpy(tmp_path: Path) -> None:
    store = _build(tmp_path)
    store.save(1, initial_weights(PatchPlan()))
    step_file = store.directory / "sealed-checkpoint-00000001.bjev"
    payload = bytearray(step_file.read_bytes())
    payload[-1] ^= 1
    step_file.write_bytes(payload)
    with pytest.raises(ArtefactProtectionError, match="digest"):
        store.resume()


def test_step_is_immutable_and_last_good_pointer_survives(tmp_path: Path) -> None:
    store = _build(tmp_path)
    weights = initial_weights(PatchPlan())
    store.save(1, weights)
    with pytest.raises(ArtefactProtectionError, match="exists"):
        store.save(1, weights)
    assert store.resume()[0] == 1
    store.save(2, weights)
    assert store.resume()[0] == 2


def test_nonfinite_weights_refused_before_file_creation(tmp_path: Path) -> None:
    store = _build(tmp_path)
    weights = initial_weights(PatchPlan())
    weights.encoder[0, 0] = np.nan
    with pytest.raises(ValueError, match="Nonfinite"):
        store.save(1, weights)
    assert not store.latest_exists()
    assert not store.directory.exists() or not list(store.directory.iterdir())


def test_wrong_plan_refuses_protected_checkpoint(tmp_path: Path) -> None:
    store = _build(tmp_path)
    store.save(1, initial_weights(PatchPlan()))
    mismatched = SealedNumericCheckpoints(
        store.directory, store.store, patch_plan=PatchPlan(hidden_dim=16),
        training_digest="a" * 64, manifest_digest="b" * 64,
    )
    with pytest.raises(ArtefactProtectionError):
        mismatched.resume()


def test_invalid_binding_is_rejected() -> None:
    cipher = pytest.importorskip("cryptography.hazmat.primitives.ciphers.aead")
    store = SealedStore(cipher.AESGCM(os.urandom(32)), "OperatorKey98")
    with pytest.raises(ArtefactProtectionError, match="binding"):
        SealedNumericCheckpoints(
            Path("."), store, patch_plan=PatchPlan(),
            training_digest="not-a-hash", manifest_digest="b" * 64,
        )

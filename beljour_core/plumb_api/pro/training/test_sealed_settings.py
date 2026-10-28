"""Encrypted tuning and immutable training configuration regressions.

Author: John Khan.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from .patches import PatchPlan
from .pipeline import TrainingPlan
from .sealed_settings import load_protected_settings, save_protected_settings
from .sealed_store import ArtefactProtectionError, SealedStore


def _vault() -> SealedStore:
    crypto = pytest.importorskip("cryptography.hazmat.primitives.ciphers.aead")
    return SealedStore(crypto.AESGCM(os.urandom(32)), "OperatorKey98")


def test_training_settings_persist_as_ciphertext_only(tmp_path: Path) -> None:
    file = tmp_path / "sealed-settings.bjev"
    settings = TrainingPlan(steps=17, learning_rate=0.00037)
    mask = PatchPlan(masked_fraction=0.55)
    binding = os.urandom(32)
    store = _vault()
    save_protected_settings(file, store, settings, mask, binding=binding)
    ciphertext = file.read_bytes()
    assert b"masked_fraction" not in ciphertext
    assert b"learning_rate" not in ciphertext
    assert b"0.00037" not in ciphertext
    assert load_protected_settings(file, store, binding=binding) == (settings, mask)
    assert not list(tmp_path.glob("*.json"))


def test_wrong_binding_and_key_cannot_unlock_settings(tmp_path: Path) -> None:
    file = tmp_path / "sealed-settings.bjev"
    store = _vault()
    binding = os.urandom(32)
    save_protected_settings(file, store, TrainingPlan(), PatchPlan(), binding=binding)
    with pytest.raises(ArtefactProtectionError, match="authentication"):
        load_protected_settings(file, store, binding=os.urandom(32))
    with pytest.raises(ArtefactProtectionError, match="authentication"):
        load_protected_settings(file, _vault(), binding=binding)


def test_setting_mismatch_rejected_before_persist(tmp_path: Path) -> None:
    file = tmp_path / "sealed-settings.bjev"
    with pytest.raises(ArtefactProtectionError, match="size_mismatch"):
        save_protected_settings(
            file, _vault(), TrainingPlan(image_size=32),
            PatchPlan(image_size=64), binding=os.urandom(32),
        )
    assert not file.exists()

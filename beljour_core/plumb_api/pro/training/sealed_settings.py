"""Encrypted training and tuning configuration without readable disk presets.

Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import asdict, fields
from pathlib import Path
from typing import Any

from .patches import PatchPlan
from .pipeline import TrainingPlan
from .sealed_store import ArtefactProtectionError, SealedStore

SCHEMA = "beljour-private-training-plan/1"
MAX_SETTINGS_BYTES = 16 * 1024


def _validate_exact(value: object, keys: set[str]) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise ArtefactProtectionError("invalid_protected_settings")
    if any(not isinstance(key, str) for key in value):
        raise ArtefactProtectionError("invalid_protected_settings")
    return value


def _restore_numeric_plan(payload: dict[str, Any]) -> tuple[TrainingPlan, PatchPlan]:
    train_values = _validate_exact(payload.get("training"), {item.name for item in fields(TrainingPlan)})
    patch_values = _validate_exact(payload.get("patch"), {item.name for item in fields(PatchPlan)})
    training_ints = ("image_size", "latent_dim", "batch_size", "steps", "seed")
    patch_ints = ("image_size", "patch_edge", "hidden_dim", "seed")
    if any(type(train_values[name]) is not int for name in training_ints):
        raise ArtefactProtectionError("invalid_protected_settings")
    if any(type(patch_values[name]) is not int for name in patch_ints):
        raise ArtefactProtectionError("invalid_protected_settings")
    floats = (
        train_values["learning_rate"], train_values["holdout_fraction"],
        patch_values["masked_fraction"],
    )
    if any(isinstance(value, bool) or not isinstance(value, (int, float)) for value in floats):
        raise ArtefactProtectionError("invalid_protected_settings")
    training = TrainingPlan(**train_values)
    patch = PatchPlan(**patch_values)
    training.validate()
    patch.validate()
    if training.image_size != patch.image_size:
        raise ArtefactProtectionError("protected_settings_size_mismatch")
    return training, patch


def save_protected_settings(
    file: Path, store: SealedStore,
    training: TrainingPlan, patch: PatchPlan, *, binding: bytes,
) -> str:
    """Persist only authenticated ciphertext, using no plaintext JSON sidecar."""
    training.validate()
    patch.validate()
    if training.image_size != patch.image_size:
        raise ArtefactProtectionError("protected_settings_size_mismatch")
    obj = {
        "schema": SCHEMA,
        "training": asdict(training),
        "patch": asdict(patch),
    }
    payload = bytearray(json.dumps(
        obj, sort_keys=True, separators=(",", ":"), allow_nan=False,
    ).encode("ascii"))
    if len(payload) > MAX_SETTINGS_BYTES:
        raise ArtefactProtectionError("protected_settings_size_limit")
    try:
        return store.put(file, payload, kind="tuning", binding=binding)
    finally:
        payload[:] = b"\x00" * len(payload)


def load_protected_settings(
    file: Path, store: SealedStore, *, binding: bytes,
) -> tuple[TrainingPlan, PatchPlan]:
    """Decode and validate settings in volatile memory; never create a temp JSON."""
    with store.opened(file, kind="tuning", binding=binding) as plaintext:
        if len(plaintext) > MAX_SETTINGS_BYTES:
            raise ArtefactProtectionError("protected_settings_size_limit")
        try:
            value = json.loads(plaintext)
        except (ValueError, UnicodeError) as exc:
            raise ArtefactProtectionError("invalid_protected_settings") from exc
    container = _validate_exact(value, {"schema", "training", "patch"})
    if container["schema"] != SCHEMA:
        raise ArtefactProtectionError("invalid_protected_settings")
    return _restore_numeric_plan(container)

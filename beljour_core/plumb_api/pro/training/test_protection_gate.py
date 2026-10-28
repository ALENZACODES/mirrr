"""Gate checks for private artifact exports without disclosing names.

Author: John Khan.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from .protection_gate import inspect_private_export
from .sealed_store import SealedStore


def _store() -> SealedStore:
    provider = pytest.importorskip("cryptography.hazmat.primitives.ciphers.aead")
    return SealedStore(provider.AESGCM(os.urandom(32)), "OperatorKey98")


def test_protected_only_export_can_be_reported(tmp_path: Path) -> None:
    store = _store()
    export = tmp_path / "export"
    export.mkdir(mode=0o700)
    binding = os.urandom(32)
    store.put(
        export / "sealed-weights.bjev", b"synthetic-weight-bytes",
        kind="weights", binding=binding,
    )
    unsigned = inspect_private_export(export)
    assert not unsigned.ready
    assert "authentication_not_verified" in unsigned.problems

    def authenticate(path: Path) -> bool:
        with store.opened(path, kind="weights", binding=binding) as plain:
            return bool(plain)

    report = inspect_private_export(export, authenticate=authenticate)
    assert report.ready
    assert report.public()["release"] == "AUTHENTICATED_CIPHERTEXT_ONLY"
    assert report.public()["scanned"] == 1
    assert "weights.bjev" not in str(report.public())


@pytest.mark.parametrize("extension,plain", [
    (".npz", b"PK\x03\x04weights"),
    (".npy", b"\x93NUMPYfake"),
    (".json", b'{"learning_rate":0.01}'),
    (".pt", b"synthetic-model-weights"),
])
def test_readable_model_or_tuning_file_blocks_export(
    tmp_path: Path, extension: str, plain: bytes,
) -> None:
    export = tmp_path / "export"
    export.mkdir(mode=0o700)
    target = export / f"weights{extension}"
    target.write_bytes(plain)
    target.chmod(0o600)
    report = inspect_private_export(export)
    assert report.ready is False
    assert report.public()["release"] == "BLOCKED"
    assert str(target) not in str(report.public())


def test_plaintext_disguised_as_encrypted_is_rejected(tmp_path: Path) -> None:
    export = tmp_path / "export"
    export.mkdir(mode=0o700)
    target = export / "sealed-false.bjev"
    target.write_bytes(b"plaintext content, not encrypted" * 2)
    target.chmod(0o600)
    result = inspect_private_export(export)
    assert not result.ready
    assert "missing_encrypted_artifact_header" in result.problems


def test_untrusted_permissions_or_empty_folder_cannot_pass(tmp_path: Path) -> None:
    export = tmp_path / "export"
    export.mkdir(mode=0o700)
    assert inspect_private_export(export).ready is False
    export.chmod(0o777)
    assert inspect_private_export(export).ready is False


def test_forged_header_does_not_pass_authentication(tmp_path: Path) -> None:
    store = _store()
    export = tmp_path / "export"
    export.mkdir(mode=0o700)
    target = export / "sealed-forged.bjev"
    target.write_bytes(b"BLJRSEAL1" + os.urandom(12) + b"synthetic-plaintext-not-encrypted" + b"0" * 16)
    target.chmod(0o600)
    def authenticate(path: Path) -> bool:
        with store.opened(path, kind="weights", binding=os.urandom(32)) as payload:
            return bool(payload)
    report = inspect_private_export(export, authenticate=authenticate)
    assert not report.ready
    assert "protected_authentication_failed" in report.problems

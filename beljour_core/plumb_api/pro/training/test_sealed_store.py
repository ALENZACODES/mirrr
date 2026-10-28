"""Synthetic ciphertext persistence and authenticated-refusal tests. Author: John Khan."""

from __future__ import annotations

import os
from pathlib import Path
from typing import cast

import pytest

from .sealed_store import AeadBackend, ArtefactProtectionError, SealedStore


def _store(key: bytes | None = None) -> SealedStore:
    suite = pytest.importorskip("cryptography.hazmat.primitives.ciphers.aead")
    return SealedStore(suite.AESGCM(os.urandom(32) if key is None else key), "OperatorKey98")


def _binding() -> bytes:
    return os.urandom(32)


def test_seal_only_writes_ciphertext_then_zeros_open_buffer(tmp_path: Path) -> None:
    store = _store()
    path = tmp_path / "sealed-weights.bjev"
    original = b"private-weight-block-sample" * 30
    binding = _binding()
    digest = store.put(path, original, kind="weights", binding=binding)
    assert path.is_file()
    assert path.stat().st_mode & 0o777 == 0o600
    assert len(digest) == 64
    assert original not in path.read_bytes()
    assert not path.read_bytes().startswith(b"PK\x03\x04")
    with store.opened(path, kind="weights", binding=binding) as opened:
        assert opened == original
        tracked = opened
    assert not any(tracked)


def test_wrong_key_context_and_kind_fail_authentication(tmp_path: Path) -> None:
    key = os.urandom(32)
    store = _store(key)
    file = tmp_path / "sealed-weights.bjev"
    binding = _binding()
    store.put(file, b"one-time-test-payload", kind="weights", binding=binding)
    with pytest.raises(ArtefactProtectionError):
        _store().get(file, kind="weights", binding=binding)
    with pytest.raises(ArtefactProtectionError):
        store.get(file, kind="checkpoint", binding=binding)
    with pytest.raises(ArtefactProtectionError):
        store.get(file, kind="weights", binding=_binding())
    with store.opened(file, kind="weights", binding=binding) as recovered:
        assert recovered == b"one-time-test-payload"


def test_unique_random_nonces_and_no_overwrite(tmp_path: Path) -> None:
    store = _store()
    binding = _binding()
    first = tmp_path / "sealed-one.bjev"
    second = tmp_path / "sealed-two.bjev"
    store.put(first, b"same-payload", kind="recipe", binding=binding)
    store.put(second, b"same-payload", kind="recipe", binding=binding)
    assert first.read_bytes() != second.read_bytes()
    original = first.read_bytes()
    with pytest.raises(ArtefactProtectionError, match="exists"):
        store.put(first, b"replacement", kind="recipe", binding=binding)
    assert first.read_bytes() == original
    store.put(first, b"new-value", kind="recipe", binding=binding, replace=True)
    with store.opened(first, kind="recipe", binding=binding) as recovered:
        assert recovered == b"new-value"


def test_mutation_and_truncation_fail_closed(tmp_path: Path) -> None:
    store = _store()
    binding = _binding()
    path = tmp_path / "sealed-block.bjev"
    store.put(path, b"private-value", kind="checkpoint", binding=binding)
    tampered = bytearray(path.read_bytes())
    tampered[-2] ^= 0x80
    path.write_bytes(tampered)
    with pytest.raises(ArtefactProtectionError, match="authentication"):
        store.get(path, kind="checkpoint", binding=binding)
    path.write_bytes(tampered[:12])
    with pytest.raises(ArtefactProtectionError, match="envelope"):
        store.get(path, kind="checkpoint", binding=binding)


def test_private_paths_required_and_symlinks_refused(tmp_path: Path) -> None:
    store = _store()
    path = tmp_path / "sealed-one.bjev"
    store.put(path, b"private", kind="tuning", binding=_binding())
    path.chmod(0o644)
    with pytest.raises(ArtefactProtectionError, match="exposed"):
        store.get(path, kind="tuning", binding=_binding())
    link = tmp_path / "sealed-alias.bjev"
    link.symlink_to(path)
    with pytest.raises(ArtefactProtectionError):
        store.get(link, kind="tuning", binding=_binding())
    with pytest.raises(ArtefactProtectionError):
        store.put(tmp_path / "secrets.npz", b"hidden", kind="weights", binding=_binding())


def test_validation_refuses_unaudited_backend_and_key_references() -> None:
    class Empty:
        pass

    with pytest.raises(ArtefactProtectionError, match="backend"):
        SealedStore(cast(AeadBackend, Empty()), "OperatorKey98")
    with pytest.raises(ArtefactProtectionError, match="key_reference"):
        SealedStore(_store()._backend, "bad")


def test_encryption_failure_never_creates_output(tmp_path: Path) -> None:
    class Refusing:
        def encrypt(self, nonce: bytes, data: bytes, associated_data: bytes) -> bytes:
            raise ValueError("forced")

        def decrypt(self, nonce: bytes, data: bytes, associated_data: bytes) -> bytes:
            raise ValueError("forced")

    store = SealedStore(Refusing(), "OperatorKey98")
    file = tmp_path / "sealed-not-created.bjev"
    with pytest.raises(ArtefactProtectionError, match="seal_failed"):
        store.put(file, b"private", kind="weights", binding=_binding())
    assert not file.exists()


@pytest.mark.parametrize("payload", [b"", b"nonempty"])
def test_domain_validation_is_mandatory(tmp_path: Path, payload: bytes) -> None:
    store = _store()
    with pytest.raises(ArtefactProtectionError):
        store.put(tmp_path / "sealed-one.bjev", payload, kind="weights", binding=b"")


def test_key_rotation_never_creates_readable_intermediate(tmp_path: Path) -> None:
    first = _store()
    second = _store()
    binding = _binding()
    source = tmp_path / "sealed-old.bjev"
    target = tmp_path / "sealed-new.bjev"
    original = b"private-rotation-sample" * 10
    first.put(source, original, kind="weights", binding=binding)
    second_digest = first.rotate(
        source, target, kind="weights", binding=binding, successor=second,
    )
    assert len(second_digest) == 64
    assert original not in target.read_bytes()
    with second.opened(target, kind="weights", binding=binding) as restored:
        assert restored == original
    with pytest.raises(ArtefactProtectionError, match="authentication"):
        first.get(target, kind="weights", binding=binding)

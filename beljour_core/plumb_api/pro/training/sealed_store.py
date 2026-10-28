"""Authenticated, disk-ciphertext-only private artefact storage. Author: John Khan."""

from __future__ import annotations

import hashlib
import os
import stat
import tempfile
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Protocol

MAGIC = b"BLJRSEAL1"
NONCE_BYTES = 12
TAG_BYTES = 16
MAX_PLAINTEXT_BYTES = 256 * 1024 * 1024
MAX_CIPHERTEXT_BYTES = len(MAGIC) + NONCE_BYTES + MAX_PLAINTEXT_BYTES + TAG_BYTES
KINDS = frozenset({"checkpoint", "weights", "tuning", "recipe"})


class ArtefactProtectionError(ValueError):
    """A fail-closed result with no paths, source identifiers or key material."""


class AeadBackend(Protocol):
    """An independently approved AES-256-GCM backend, supplied by the operator."""

    def encrypt(self, nonce: bytes, data: bytes, associated_data: bytes) -> bytes: ...

    def decrypt(self, nonce: bytes, data: bytes, associated_data: bytes) -> bytes: ...


def _associated_data(kind: str, binding: bytes, key_id: str) -> bytes:
    if kind not in KINDS or not 1 <= len(binding) <= 1024:
        raise ArtefactProtectionError("invalid_protected_context")
    if not 8 <= len(key_id) <= 64 or not key_id.isascii() or not key_id.isalnum():
        raise ArtefactProtectionError("invalid_key_reference")
    digest = hashlib.sha256(binding).digest()
    return b"beljour-private-artifact/1\x00" + kind.encode("ascii") + b"\x00" + key_id.encode() + digest


def _private_folder(folder: Path) -> None:
    if folder.is_symlink() or not folder.is_dir():
        raise ArtefactProtectionError("invalid_protected_directory")
    mode = folder.stat().st_mode
    if mode & (stat.S_IWGRP | stat.S_IWOTH):
        raise ArtefactProtectionError("untrusted_protected_directory")


def _private_file(file: Path) -> int:
    try:
        metadata = file.lstat()
    except OSError as exc:
        raise ArtefactProtectionError("missing_protected_artifact") from exc
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_size > MAX_CIPHERTEXT_BYTES:
        raise ArtefactProtectionError("invalid_protected_artifact")
    if metadata.st_mode & (stat.S_IRGRP | stat.S_IROTH | stat.S_IWGRP | stat.S_IWOTH):
        raise ArtefactProtectionError("exposed_protected_artifact")
    return metadata.st_size


class SealedStore:
    """Accept only ciphertext paths; a key or credential is never serialized."""

    def __init__(self, backend: AeadBackend, key_id: str) -> None:
        _associated_data("weights", b"probe", key_id)
        if not callable(getattr(backend, "encrypt", None)) or not callable(
            getattr(backend, "decrypt", None)
        ):
            raise ArtefactProtectionError("missing_aead_backend")
        self._backend = backend
        self.key_id = key_id

    def _verify_target(self, file: Path) -> None:
        if file.suffix != ".bjev" or not file.name.startswith("sealed-"):
            raise ArtefactProtectionError("invalid_protected_target")
        _private_folder(file.parent)
        if file.is_symlink():
            raise ArtefactProtectionError("invalid_protected_target")

    def put(
        self, file: Path, data: bytes | bytearray, *, kind: str, binding: bytes,
        replace: bool = False,
    ) -> str:
        """Encrypt before opening any output file; never stage plaintext on disk."""
        self._verify_target(file)
        if not 1 <= len(data) <= MAX_PLAINTEXT_BYTES:
            raise ArtefactProtectionError("protected_payload_limit")
        aad = _associated_data(kind, binding, self.key_id)
        nonce = os.urandom(NONCE_BYTES)
        try:
            encrypted = self._backend.encrypt(nonce, bytes(data), aad)
        except Exception as exc:
            raise ArtefactProtectionError("protected_seal_failed") from exc
        if len(encrypted) != len(data) + TAG_BYTES:
            raise ArtefactProtectionError("invalid_aead_backend_output")
        envelope = MAGIC + nonce + encrypted
        digest = hashlib.sha256(envelope).hexdigest()
        fd, temp_name = tempfile.mkstemp(prefix=".sealed-stage-", dir=file.parent)
        temp = Path(temp_name)
        try:
            os.fchmod(fd, 0o600)
            with os.fdopen(fd, "wb") as handle:
                handle.write(envelope)
                handle.flush()
                os.fsync(handle.fileno())
            if replace:
                if file.is_symlink():
                    raise ArtefactProtectionError("invalid_protected_target")
                os.replace(temp, file)
            else:
                try:
                    os.link(temp, file)
                except FileExistsError as exc:
                    raise ArtefactProtectionError("protected_artifact_exists") from exc
            return digest
        finally:
            temp.unlink(missing_ok=True)

    def ciphertext_digest(self, file: Path) -> str:
        """Hash only a checked regular ciphertext file; never follow symlinks."""
        self._verify_target(file)
        _private_file(file)
        return hashlib.sha256(file.read_bytes()).hexdigest()

    def get(self, file: Path, *, kind: str, binding: bytes) -> bytearray:
        """Decrypt into memory only. Caller must clear the returned bytearray."""
        self._verify_target(file)
        _private_file(file)
        envelope = file.read_bytes()
        if not envelope.startswith(MAGIC) or len(envelope) < len(MAGIC) + NONCE_BYTES + TAG_BYTES + 1:
            raise ArtefactProtectionError("invalid_protected_envelope")
        aad = _associated_data(kind, binding, self.key_id)
        start = len(MAGIC)
        nonce = envelope[start:start + NONCE_BYTES]
        ciphertext = envelope[start + NONCE_BYTES:]
        try:
            recovered = self._backend.decrypt(nonce, ciphertext, aad)
        except Exception as exc:
            raise ArtefactProtectionError("protected_authentication_failed") from exc
        if not 1 <= len(recovered) <= MAX_PLAINTEXT_BYTES:
            raise ArtefactProtectionError("protected_payload_limit")
        return bytearray(recovered)

    @contextmanager
    def opened(self, file: Path, *, kind: str, binding: bytes) -> Iterator[bytearray]:
        buffer = self.get(file, kind=kind, binding=binding)
        try:
            yield buffer
        finally:
            buffer[:] = b"\x00" * len(buffer)

    def rotate(
        self, old_file: Path, new_file: Path, *,
        kind: str, binding: bytes, successor: SealedStore,
    ) -> str:
        """Rotate using only a temporary in-memory plaintext buffer."""
        with self.opened(old_file, kind=kind, binding=binding) as plain:
            return successor.put(new_file, plain, kind=kind, binding=binding)

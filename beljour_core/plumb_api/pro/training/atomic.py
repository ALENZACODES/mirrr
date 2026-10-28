"""Atomic, owner-only JSON metadata and numeric files for private training state.

Ingest summaries, consent holds, revocation registers, checkpoint lineage,
exported certificates and reference-trainer checkpoints are written here. A writer stages the complete document
in a temporary file in the destination folder, flushes it to disk and then
publishes it in one rename (or one hard link when overwriting is not allowed),
so readers see either the old document or the new one, never a partial file.

Readers accept only a bounded regular file holding one strict JSON object.
JSON is parsed as data only; nothing read here is ever executed. Errors carry a
constant code and never a path, subject, receipt or document content.

Folder trust (symlinks, group-writable directories) is checked by the callers
that own those folders, as `withdrawal` and `protection_gate` already do.

Author: John Khan.
"""

from __future__ import annotations

import errno
import hashlib
import json
import os
import stat
import tempfile
from collections.abc import Mapping
from pathlib import Path
from typing import Any

# ASSUMED: 1 MiB covers every metadata file read through this module (ingest
# summaries are capped at 32 KiB by `audit`; lineage grows by 67 bytes per
# withdrawal). Revocation registers are larger and are read by `revocations`.
MAX_PRIVATE_JSON_BYTES = 1024 * 1024
PRIVATE_FILE_MODE = stat.S_IRUSR | stat.S_IWUSR
_STAGE_PREFIX = ".private-json-"
_NOT_SUPPORTED = frozenset({
    errno.EINVAL, errno.ENOTSUP, getattr(errno, "EOPNOTSUPP", errno.ENOTSUP), errno.ENOSYS,
})
# A folder that cannot be opened or fsynced reports one of these. The rename has
# already happened by then, so the document is in place.
_DIRECTORY_SYNC_UNSUPPORTED = _NOT_SUPPORTED | {errno.EBADF, errno.EACCES, errno.EPERM}
# os.link fails with one of these where hard links are unavailable (FAT, some
# network or sandboxed filesystems); the exclusive-create fallback is used then.
_LINK_UNSUPPORTED = _NOT_SUPPORTED | {errno.EPERM, errno.EMLINK}


class PrivateJsonError(ValueError):
    """A fail-closed metadata error with a constant code and no private content."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def encode_private_json(document: Mapping[str, Any]) -> bytes:
    """Encode one JSON object deterministically, refusing NaN and non-string keys."""
    if not isinstance(document, Mapping) or any(not isinstance(key, str) for key in document):
        raise PrivateJsonError("invalid_private_json")
    try:
        text = json.dumps(
            dict(document), sort_keys=True, ensure_ascii=True,
            separators=(",", ":"), allow_nan=False,
        )
    except (TypeError, ValueError, RecursionError) as exc:
        raise PrivateJsonError("unserializable_private_json") from exc
    return text.encode("ascii") + b"\n"


def _restrict(descriptor: int, path: Path) -> None:
    if hasattr(os, "fchmod"):
        os.fchmod(descriptor, PRIVATE_FILE_MODE)
    else:
        # Windows before Python 3.13 has no fchmod; mode bits only set read-only there.
        os.chmod(path, PRIVATE_FILE_MODE)


def _sync_directory(folder: Path) -> None:
    """Make the rename durable on POSIX. Windows cannot open a folder for fsync."""
    if os.name == "nt":
        return
    try:
        descriptor = os.open(folder, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
    except OSError as exc:
        if exc.errno not in _DIRECTORY_SYNC_UNSUPPORTED:
            raise
        return
    try:
        os.fsync(descriptor)
    except OSError as exc:
        if exc.errno not in _DIRECTORY_SYNC_UNSUPPORTED:
            raise
    finally:
        os.close(descriptor)


def _checked_target(path: Path) -> None:
    """Refuse to publish over a symlink, folder, device or pipe."""
    try:
        existing = path.lstat()
    except FileNotFoundError:
        return
    if not stat.S_ISREG(existing.st_mode):
        raise PrivateJsonError("invalid_private_target")


def _create_exclusive(path: Path, data: bytes) -> None:
    """No-overwrite fallback for filesystems without hard links.

    ASSUMED acceptable: the name can appear before its bytes are complete, but a
    crash leaves a short file that `read_private_json` refuses, never a silent
    overwrite. `O_EXCL` also refuses an existing symlink at the destination.
    """
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_BINARY", 0)
    descriptor = os.open(path, flags, PRIVATE_FILE_MODE)
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
    except BaseException:
        path.unlink(missing_ok=True)
        raise


def write_private_bytes(path: Path, data: bytes | bytearray, *, replace: bool = True) -> str:
    """Atomically publish owner-only (0600) bytes and return their SHA-256.

    With ``replace=False`` an existing file is never touched and FileExistsError
    is raised. The staging file sits in the destination folder, so the final
    rename or link never crosses a filesystem, and it is removed on any failure.
    """
    path = Path(path)
    data = bytes(data)
    _checked_target(path)
    descriptor, name = tempfile.mkstemp(prefix=_STAGE_PREFIX, suffix=".tmp", dir=path.parent)
    staged = Path(name)
    try:
        try:
            output = os.fdopen(descriptor, "wb")
        except BaseException:
            os.close(descriptor)
            raise
        with output:
            _restrict(output.fileno(), staged)
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
        if replace:
            os.replace(staged, path)
        else:
            try:
                os.link(staged, path)
            except FileExistsError:
                raise FileExistsError(errno.EEXIST, "private_file_exists") from None
            except OSError as exc:
                if exc.errno not in _LINK_UNSUPPORTED:
                    raise
                _create_exclusive(path, data)
        _sync_directory(path.parent)
    finally:
        staged.unlink(missing_ok=True)
    return hashlib.sha256(data).hexdigest()


def write_private_json(path: Path, document: Mapping[str, Any], *, replace: bool = True) -> str:
    """Atomically publish an owner-only JSON object; see `write_private_bytes`."""
    return write_private_bytes(path, encode_private_json(document), replace=replace)


def _unique_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise PrivateJsonError("duplicate_private_json_key")
        result[key] = value
    return result


def _reject_constant(_: str) -> object:
    raise PrivateJsonError("invalid_private_json")


def _checked_metadata(info: os.stat_result, max_bytes: int) -> None:
    if not stat.S_ISREG(info.st_mode):
        raise PrivateJsonError("invalid_private_file")
    # ASSUMED: a group- or world-writable file could have been altered by someone
    # else, so it is refused. Windows has no such mode bits.
    if os.name != "nt" and info.st_mode & (stat.S_IWGRP | stat.S_IWOTH):
        raise PrivateJsonError("untrusted_private_file")
    if not 1 <= info.st_size <= max_bytes:
        raise PrivateJsonError("private_file_size_limit")


def _read_bounded(path: Path, max_bytes: int) -> bytes:
    """Read a regular file without following a final symlink or blocking on a pipe.

    The opened descriptor is checked, not only the name, so a concurrent atomic
    replace yields the complete old or new document rather than an error.
    """
    try:
        _checked_metadata(path.lstat(), max_bytes)
    except FileNotFoundError as exc:
        raise PrivateJsonError("missing_private_file") from exc
    except OSError as exc:
        raise PrivateJsonError("unreadable_private_file") from exc
    no_follow = getattr(os, "O_NOFOLLOW", 0)
    flags = os.O_RDONLY | no_follow | getattr(os, "O_NONBLOCK", 0) | getattr(os, "O_BINARY", 0)
    try:
        descriptor = os.open(path, flags)
    except FileNotFoundError as exc:
        raise PrivateJsonError("missing_private_file") from exc
    except OSError as exc:
        raise PrivateJsonError("unreadable_private_file") from exc
    with os.fdopen(descriptor, "rb") as source:
        opened = os.fstat(source.fileno())
        _checked_metadata(opened, max_bytes)
        if not no_follow:
            # Without O_NOFOLLOW (Windows), the name must still be the file opened.
            try:
                named = path.lstat()
            except OSError as exc:
                raise PrivateJsonError("changed_private_file") from exc
            if (opened.st_dev, opened.st_ino) != (named.st_dev, named.st_ino):
                raise PrivateJsonError("changed_private_file")
        data = source.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise PrivateJsonError("private_file_size_limit")
    return data


def read_private_bytes(path: Path, *, max_bytes: int) -> bytes:
    """Return the bytes of a bounded, owner-controlled regular file."""
    if max_bytes < 1:
        raise PrivateJsonError("invalid_private_read_limit")
    return _read_bounded(Path(path), max_bytes)


def read_private_json(path: Path, *, max_bytes: int = MAX_PRIVATE_JSON_BYTES) -> dict[str, Any]:
    """Return one strict JSON object: no duplicate keys, NaN or trailing data."""
    return decode_private_json(read_private_bytes(path, max_bytes=max_bytes))


def decode_private_json(data: bytes) -> dict[str, Any]:
    """Parse bytes already read (and digest-checked) by the caller, strictly."""
    try:
        loaded: object = json.loads(
            data.decode("utf-8"),
            object_pairs_hook=_unique_keys, parse_constant=_reject_constant,
        )
    except PrivateJsonError:
        raise
    except (ValueError, RecursionError) as exc:
        # Covers bad UTF-8, malformed JSON and integers beyond Python's digit limit.
        raise PrivateJsonError("invalid_private_json") from exc
    if not isinstance(loaded, dict):
        raise PrivateJsonError("invalid_private_json")
    return loaded

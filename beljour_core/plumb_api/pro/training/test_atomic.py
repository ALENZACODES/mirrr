"""Atomic owner-only metadata writes and strict bounded reads. Author: John Khan."""

from __future__ import annotations

import errno
import hashlib
import json
import os
import threading
from pathlib import Path

import pytest

from . import atomic
from .atomic import (
    PrivateJsonError,
    decode_private_json,
    read_private_bytes,
    read_private_json,
    write_private_bytes,
    write_private_json,
)

posix_only = pytest.mark.skipif(os.name == "nt", reason="POSIX permission bits")


def staged(folder: Path) -> list[str]:
    return [item.name for item in folder.iterdir() if item.name.startswith(".private-json-")]


@posix_only
def test_round_trip_is_canonical_owner_only_and_digest_bound(tmp_path: Path) -> None:
    target = tmp_path / "summary.json"
    digest = write_private_json(target, {"b": 1, "a": [1, 2], "u": "é"})
    assert target.stat().st_mode & 0o777 == 0o600
    assert target.read_bytes() == b'{"a":[1,2],"b":1,"u":"\\u00e9"}\n'
    assert digest == hashlib.sha256(target.read_bytes()).hexdigest()
    assert read_private_json(target) == {"a": [1, 2], "b": 1, "u": "é"}
    assert staged(tmp_path) == []


@posix_only
def test_replace_publishes_new_document_and_tightens_mode(tmp_path: Path) -> None:
    target = tmp_path / "register.json"
    target.write_text("{}")
    target.chmod(0o644)
    write_private_json(target, {"version": 2})
    assert json.loads(target.read_text()) == {"version": 2}
    assert target.stat().st_mode & 0o777 == 0o600


def test_no_overwrite_keeps_existing_bytes_and_hides_path(tmp_path: Path) -> None:
    target = tmp_path / "consent-hold.json"
    write_private_json(target, {"v": 1}, replace=False)
    before = target.read_bytes()
    with pytest.raises(FileExistsError) as caught:
        write_private_json(target, {"v": 2}, replace=False)
    assert str(tmp_path) not in str(caught.value)
    assert target.read_bytes() == before
    assert staged(tmp_path) == []


@posix_only
def test_symlink_destination_is_never_followed_or_replaced(tmp_path: Path) -> None:
    target = tmp_path / "certificate.json"
    target.symlink_to(tmp_path / "elsewhere.json")
    for replace in (False, True):
        with pytest.raises(PrivateJsonError, match="invalid_private_target"):
            write_private_json(target, {"v": 1}, replace=replace)
    assert not (tmp_path / "elsewhere.json").exists()
    assert target.is_symlink()


@posix_only
def test_filesystem_without_hard_links_uses_exclusive_create(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    def refuse_link(*_: object) -> None:
        raise OSError(errno.EPERM, "hard links unavailable")

    monkeypatch.setattr(atomic.os, "link", refuse_link)
    target = tmp_path / "certificate.json"
    write_private_json(target, {"v": 1}, replace=False)
    assert target.stat().st_mode & 0o777 == 0o600
    with pytest.raises(FileExistsError):
        write_private_json(target, {"v": 2}, replace=False)
    assert read_private_json(target) == {"v": 1}
    assert staged(tmp_path) == []


@pytest.mark.parametrize("broken", ["fsync", "replace"])
def test_failed_write_keeps_previous_document_and_removes_stage(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, broken: str,
) -> None:
    target = tmp_path / "summary.json"
    write_private_json(target, {"v": 1})

    def fail(*_: object) -> None:
        raise OSError(errno.EIO, "simulated disk error")

    monkeypatch.setattr(atomic.os, broken, fail)
    with pytest.raises(OSError):
        write_private_json(target, {"v": 2})
    monkeypatch.undo()
    assert read_private_json(target) == {"v": 1}
    assert staged(tmp_path) == []


@pytest.mark.parametrize("document", [
    {"x": float("nan")}, {"x": float("inf")}, {"x": object()}, [1], {1: "a"},
])
def test_unserializable_documents_write_nothing(tmp_path: Path, document: object) -> None:
    with pytest.raises(PrivateJsonError):
        write_private_json(tmp_path / "x.json", document)  # type: ignore[arg-type]
    assert list(tmp_path.iterdir()) == []


def test_missing_parent_folder_is_not_created(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        write_private_json(tmp_path / "absent" / "x.json", {"v": 1})
    assert not (tmp_path / "absent").exists()


@pytest.mark.parametrize("raw", [
    b'{"a":1,"a":2}', b'{"a":NaN}', b'{"a":-Infinity}', b"[1]", b'{"a":1} trailing',
    b"\xff\xfe{}", b'{"a":' + b"9" * 5000 + b"}", b"[" * 100_000, b'"text"',
])
def test_strict_reads_refuse_ambiguous_or_hostile_json(tmp_path: Path, raw: bytes) -> None:
    target = tmp_path / "x.json"
    target.write_bytes(raw)
    target.chmod(0o600)
    with pytest.raises(PrivateJsonError):
        read_private_json(target)
    with pytest.raises(PrivateJsonError):
        decode_private_json(raw)


@posix_only
def test_reads_refuse_links_pipes_empty_oversized_and_shared_files(tmp_path: Path) -> None:
    real = tmp_path / "real.json"
    write_private_json(real, {"v": 1})
    link = tmp_path / "link.json"
    link.symlink_to(real)
    with pytest.raises(PrivateJsonError, match="invalid_private_file"):
        read_private_json(link)
    if hasattr(os, "mkfifo"):
        pipe = tmp_path / "pipe.json"
        os.mkfifo(pipe)
        with pytest.raises(PrivateJsonError, match="invalid_private_file"):
            read_private_json(pipe)
    with pytest.raises(PrivateJsonError, match="private_file_size_limit"):
        read_private_json(real, max_bytes=4)
    with pytest.raises(PrivateJsonError, match="missing_private_file"):
        read_private_json(tmp_path / "absent.json")
    empty = tmp_path / "empty.json"
    empty.touch(mode=0o600)
    with pytest.raises(PrivateJsonError, match="private_file_size_limit"):
        read_private_json(empty)
    real.chmod(0o620)
    with pytest.raises(PrivateJsonError, match="untrusted_private_file"):
        read_private_json(real)


def test_bytes_round_trip_and_bound(tmp_path: Path) -> None:
    target = tmp_path / "step.npz"
    payload = bytes(range(256)) * 4
    assert write_private_bytes(target, payload, replace=False) == hashlib.sha256(payload).hexdigest()
    assert read_private_bytes(target, max_bytes=len(payload)) == payload
    with pytest.raises(PrivateJsonError, match="private_file_size_limit"):
        read_private_bytes(target, max_bytes=len(payload) - 1)
    with pytest.raises(PrivateJsonError, match="invalid_private_read_limit"):
        read_private_bytes(target, max_bytes=0)


def test_concurrent_readers_only_see_complete_documents(tmp_path: Path) -> None:
    target = tmp_path / "summary.json"
    large = {"rows": ["f" * 64] * 4000}
    write_private_json(target, {"rows": []})
    stop = threading.Event()
    lengths: list[int] = []
    failures: list[Exception] = []

    def reader() -> None:
        while not stop.is_set():
            try:
                lengths.append(len(read_private_json(target)["rows"]))
            except Exception as exc:  # noqa: BLE001 - any failure is a test failure
                failures.append(exc)

    worker = threading.Thread(target=reader)
    worker.start()
    try:
        for index in range(200):
            write_private_json(target, large if index % 2 else {"rows": []})
    finally:
        stop.set()
        worker.join()
    assert failures == []
    assert lengths and set(lengths) <= {0, 4000}
    assert staged(tmp_path) == []

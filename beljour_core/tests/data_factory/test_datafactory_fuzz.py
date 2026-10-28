"""Seeded corruption: readers fail closed with their own errors, never crash.

Each case flips, cuts or inserts bytes in a valid file with a fixed seed, so
runs are repeatable. Decoding returns a failure reason, the manifest reader
raises ManifestError, lock verification returns problems, and the frozen
lock reader raises HoldoutError.
Author: John Khan.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import pytest

from plumb_api.data_factory import imaging
from plumb_api.data_factory.hashing import hash_json
from plumb_api.data_factory.holdout import (
    FROZEN_LOCK_FORMAT,
    HoldoutError,
    frozen_faces_hash,
    load_frozen_lock,
)
from plumb_api.data_factory.lockfile import build_lock, verify_lock, write_lock
from plumb_api.data_factory.manifest import ManifestError, verify_manifest, write_manifest
from plumb_api.data_factory.synthetic import fake_hash, fake_records, portrait, to_jpeg, to_png

CASES = 150


def mutate(data: bytes, rng: random.Random) -> bytes:
    """One random flip, cut, duplication or insertion."""
    if not data:
        return b"\x00"
    position = rng.randrange(len(data))
    kind = rng.randrange(4)
    if kind == 0:
        return data[:position] + bytes([data[position] ^ (1 << rng.randrange(8))]) + \
            data[position + 1:]
    if kind == 1:
        return data[:position]
    if kind == 2:
        end = min(len(data), position + rng.randint(1, 64))
        return data[:end] + data[position:end] + data[end:]
    return data[:position] + bytes(rng.randrange(256) for _ in range(8)) + data[position:]


def _same_json(left: bytes, right: bytes) -> bool:
    """True when a change only touched whitespace, so the lock means the same."""
    try:
        return bool(json.loads(left) == json.loads(right))
    except ValueError:
        return False


@pytest.mark.parametrize("encoder", [to_png, to_jpeg])
def test_decoder_never_raises(encoder: object) -> None:
    rng = random.Random(1)
    assert callable(encoder)
    original = encoder(portrait(5, 96))
    assert isinstance(original, bytes)
    for _ in range(CASES):
        result = imaging.decode(mutate(original, rng))
        assert isinstance(result, (imaging.DecodedImage, imaging.DecodeFailure))


@pytest.mark.parametrize("compress", [False, True])
def test_manifest_reader_fails_closed(tmp_path: Path, compress: bool) -> None:
    path = tmp_path / ("m.jsonl.gz" if compress else "m.jsonl")
    write_manifest(path, [(r, {"q": 0.5}) for r in fake_records(30, seed=2)], shards=4,
                   compress=compress)
    original = path.read_bytes()
    rng = random.Random(2)
    caught = 0
    for _ in range(CASES):
        damaged = mutate(original, rng)
        if damaged == original:
            continue
        path.write_bytes(damaged)
        with pytest.raises(ManifestError):
            verify_manifest(path)
        caught += 1
    assert caught >= CASES - 2


def test_lock_verify_returns_problems(tmp_path: Path) -> None:
    manifest = tmp_path / "set.jsonl"
    summary = write_manifest(manifest, [(r, {}) for r in fake_records(20, seed=3)], shards=2)
    lock_path = tmp_path / "set.lock"
    write_lock(lock_path, build_lock(summary, manifest.name, hash_json({}), set_name="s"))
    original = lock_path.read_bytes()
    rng = random.Random(3)
    for _ in range(CASES):
        damaged = mutate(original, rng)
        if _same_json(damaged, original):
            continue
        lock_path.write_bytes(damaged)
        problems = verify_lock(lock_path)
        assert problems, damaged[:80]
    lock_path.write_bytes(original)
    assert verify_lock(lock_path) == []


def test_frozen_lock_reader_fails_closed(tmp_path: Path) -> None:
    faces = [{"face_id": f"f{i}", "sha256": fake_hash(i), "rel_path": f"{i}.png"}
             for i in range(5)]
    path = tmp_path / "frozen.lock"
    original = json.dumps({"format": FROZEN_LOCK_FORMAT, "faces": faces,
                           "faces_sha256": frozen_faces_hash(faces)}).encode()
    rng = random.Random(4)
    for _ in range(CASES):
        damaged = mutate(original, rng)
        if damaged == original:
            continue
        path.write_bytes(damaged)
        try:
            frozen = load_frozen_lock(path)
        except HoldoutError:
            continue
        assert frozen.hashes == {face["sha256"] for face in faces}

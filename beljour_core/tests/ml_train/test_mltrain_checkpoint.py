"""Checkpoint format: atomic writes, hashes, pruning and corruption handling.

Corrupted checkpoints (truncated, wrong hash, bad sidecar, missing file,
another format) must be rejected with errors that name the problem.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import pytest

from lab.ml.train import checkpoint as C


def _sample(step: int = 7) -> C.Checkpoint:
    return C.Checkpoint(
        step=step,
        arrays={
            "model": {"0.weight": np.arange(6, dtype=np.float32).reshape(2, 3)},
            "optim": {"lr": np.array(0.1), "state.0.m": np.ones((2, 3))},
        },
        rng={"trainer": np.random.default_rng(1).bit_generator.state},
        meta={"note": "unit"},
    )


def test_round_trip(tmp_path: Path) -> None:
    path = C.save(tmp_path, _sample())
    assert path.name == "ckpt-00000007.json"
    loaded = C.load(path)
    assert loaded.step == 7 and loaded.meta == {"note": "unit"}
    np.testing.assert_array_equal(loaded.section("model")["0.weight"],
                                  np.arange(6).reshape(2, 3))
    assert loaded.section("optim")["lr"] == pytest.approx(0.1)
    assert loaded.section("ema") == {}
    restored = np.random.default_rng()
    restored.bit_generator.state = loaded.rng["trainer"]
    assert restored.random() == np.random.default_rng(1).random()
    assert set(C.load_weights(path)) == {"0.weight"}


def test_sidecar_records_hash_and_size(tmp_path: Path) -> None:
    path = C.save(tmp_path, _sample())
    sidecar = json.loads(path.read_text())
    payload = (tmp_path / sidecar["npz"]).read_bytes()
    assert sidecar["sha256"] == C.sha256_bytes(payload)
    assert sidecar["bytes"] == len(payload)
    assert sidecar["format"] == C.FORMAT and sidecar["version"] == C.VERSION


def test_no_temporary_files_left(tmp_path: Path) -> None:
    C.save(tmp_path, _sample())
    assert sorted(p.name for p in tmp_path.iterdir()) == ["ckpt-00000007.json",
                                                         "ckpt-00000007.npz"]


def test_failed_write_leaves_no_partial_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch
                                             ) -> None:
    def broken_replace(src: str, dst: str) -> None:
        raise OSError("disk full")

    monkeypatch.setattr(os, "replace", broken_replace)
    with pytest.raises(OSError, match="disk full"):
        C.atomic_write_text(tmp_path / "x.json", "{}")
    assert list(tmp_path.iterdir()) == []


def test_truncated_array_file_is_rejected(tmp_path: Path) -> None:
    path = C.save(tmp_path, _sample())
    npz = tmp_path / "ckpt-00000007.npz"
    npz.write_bytes(npz.read_bytes()[:50])
    with pytest.raises(C.CheckpointError, match="truncated"):
        C.load(path)


def test_wrong_hash_is_rejected(tmp_path: Path) -> None:
    path = C.save(tmp_path, _sample())
    npz = tmp_path / "ckpt-00000007.npz"
    data = bytearray(npz.read_bytes())
    data[len(data) // 2] ^= 0xFF
    npz.write_bytes(bytes(data))
    with pytest.raises(C.CheckpointError, match="content hash"):
        C.load(path)


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (lambda s: "not json {", "not valid JSON"),
        (lambda s: json.dumps({**json.loads(s), "format": "other"}), "not a"),
        (lambda s: json.dumps({**json.loads(s), "version": 99}), "version 99"),
        (lambda s: json.dumps({k: v for k, v in json.loads(s).items() if k != "sha256"}),
         "missing 'sha256'"),
        (lambda s: json.dumps({**json.loads(s), "npz": "gone.npz"}), "array file not found"),
        (lambda s: json.dumps({**json.loads(s), "npz": "../x.npz"}), "must not contain a path"),
        (lambda s: json.dumps({**json.loads(s), "rng": "abc"}), "'rng' has the wrong type"),
        (lambda s: json.dumps({**json.loads(s), "bytes": True}), "'bytes' has the wrong type"),
    ],
)
def test_bad_sidecars_are_rejected(tmp_path: Path, mutate: object, message: str) -> None:
    path = C.save(tmp_path, _sample())
    path.write_text(mutate(path.read_text()))  # type: ignore[operator]
    with pytest.raises(C.CheckpointError, match=message):
        C.load(path)


def test_missing_sidecar_and_unreadable_zip(tmp_path: Path) -> None:
    with pytest.raises(C.CheckpointError, match="sidecar not found"):
        C.load(tmp_path / "ckpt-00000001.json")
    path = C.save(tmp_path, _sample())
    garbage = b"this is not a zip archive at all"
    npz = tmp_path / "ckpt-00000007.npz"
    npz.write_bytes(garbage)
    sidecar = json.loads(path.read_text())
    sidecar["bytes"] = len(garbage)
    sidecar["sha256"] = C.sha256_bytes(garbage)
    path.write_text(json.dumps(sidecar))
    with pytest.raises(C.CheckpointError, match="cannot be read"):
        C.load(path)


def test_latest_skips_corrupt_and_prune_keeps_newest(tmp_path: Path) -> None:
    for step in (1, 2, 3):
        C.save(tmp_path, _sample(step))
    newest = tmp_path / "ckpt-00000003.npz"
    newest.write_bytes(b"broken")
    latest = C.latest(tmp_path)
    assert latest is not None and latest.name == "ckpt-00000002.json"
    removed = C.prune(tmp_path, 1)
    assert [p.name for p in removed] == ["ckpt-00000001.json", "ckpt-00000002.json"]
    assert [step for step, _ in C.list_checkpoints(tmp_path)] == [3]
    assert C.latest(tmp_path) is None
    assert C.list_checkpoints(tmp_path / "nowhere") == []
    with pytest.raises(ValueError, match="keep_last"):
        C.prune(tmp_path, 0)


def test_keep_last_on_save(tmp_path: Path) -> None:
    for step in range(5):
        C.save(tmp_path, _sample(step), keep_last=2)
    assert [step for step, _ in C.list_checkpoints(tmp_path)] == [3, 4]


def test_unknown_sections_are_rejected(tmp_path: Path) -> None:
    bad = C.Checkpoint(step=1, arrays={"weights": {"a": np.zeros(1)}})
    with pytest.raises(ValueError, match="unknown checkpoint section"):
        C.save(tmp_path, bad)
    with pytest.raises(C.CheckpointError, match="no known section"):
        C._unflatten({"stray": np.zeros(1)})


def test_fuzzed_byte_flips_raise_checkpoint_error_only(tmp_path: Path) -> None:
    path = C.save(tmp_path, _sample())
    npz = tmp_path / "ckpt-00000007.npz"
    pristine = npz.read_bytes()
    rng = np.random.default_rng(11)
    for _ in range(60):
        data = bytearray(pristine)
        for index in rng.integers(0, len(data), size=int(rng.integers(1, 4))):
            data[int(index)] ^= int(rng.integers(1, 256))
        cut = int(rng.integers(len(data) // 2, len(data) + 1))
        npz.write_bytes(bytes(data[:cut]))
        with pytest.raises(C.CheckpointError):
            C.load(path)
    npz.write_bytes(pristine)
    assert C.load(path).step == 7


def test_fuzzed_sidecar_text_raises_checkpoint_error_only(tmp_path: Path) -> None:
    path = C.save(tmp_path, _sample())
    pristine = path.read_text()
    rng = np.random.default_rng(12)
    for _ in range(60):
        chars = list(pristine)
        for index in rng.integers(0, len(chars), size=3):
            chars[int(index)] = chr(int(rng.integers(32, 127)))
        path.write_text("".join(chars))
        try:
            loaded = C.load(path)
        except C.CheckpointError:
            continue
        assert isinstance(loaded.rng, dict) and isinstance(loaded.meta, dict)


def test_average_weights(tmp_path: Path) -> None:
    paths = []
    for step, value in ((1, 1.0), (2, 2.0), (3, 6.0)):
        sample = _sample(step)
        sample.arrays["model"]["0.weight"] = np.full((2, 3), value, dtype=np.float32)
        paths.append(C.save(tmp_path, sample))
    averaged = C.average_weights(paths)
    np.testing.assert_array_equal(averaged["0.weight"], np.full((2, 3), 3.0))
    assert averaged["0.weight"].dtype == np.float32
    odd = _sample(9)
    odd.arrays["model"] = {"other": np.zeros(1)}
    with pytest.raises(C.CheckpointError, match="weight names differ"):
        C.average_weights([paths[0], C.save(tmp_path, odd)])
    wide = _sample(10)
    wide.arrays["model"]["0.weight"] = np.zeros((3, 3), dtype=np.float32)
    with pytest.raises(C.CheckpointError, match="shapes differ"):
        C.average_weights([paths[0], C.save(tmp_path, wide)])
    with pytest.raises(ValueError, match="at least one"):
        C.average_weights([])

"""Atomic writes under injected crashes, checkpoints and the shard-done test.

Author: John Khan.
"""

from __future__ import annotations

import gzip
from pathlib import Path

import pytest

from lab.facescale import resume as R


class Crash(Exception):
    pass


def _crash(temp: Path, final: Path) -> None:
    raise Crash(f"crash before renaming {temp.name}")


def test_atomic_write_leaves_old_file_on_crash(tmp_path: Path) -> None:
    target = tmp_path / "shard-00000.json.gz"
    R.atomic_write_json(target, {"v": 1}, gz=True)
    R.set_crash_hook(_crash)
    try:
        with pytest.raises(Crash):
            R.atomic_write_json(target, {"v": 2}, gz=True)
    finally:
        R.set_crash_hook(None)
    assert R.read_json(target) == {"v": 1}
    assert list(tmp_path.glob(".*.tmp")) == []


def test_crash_on_first_write_leaves_nothing_that_looks_complete(tmp_path: Path) -> None:
    target = tmp_path / "x.json"
    R.set_crash_hook(_crash)
    try:
        with pytest.raises(Crash):
            R.atomic_write_json(target, {"v": 1})
    finally:
        R.set_crash_hook(None)
    assert not target.exists()


def test_leftover_temp_files_are_cleaned(tmp_path: Path) -> None:
    (tmp_path / ".shard-00001.json.gz.abc.tmp").write_bytes(b"partial")
    (tmp_path / "keep.json").write_text("{}")
    assert R.clean_temp_files(tmp_path) == 1
    assert [p.name for p in tmp_path.iterdir()] == ["keep.json"]


def test_read_json_handles_gzip_and_damage(tmp_path: Path) -> None:
    plain = tmp_path / "a.json"
    plain.write_text('{"a": 1}')
    assert R.read_json(plain) == {"a": 1}
    cut = tmp_path / "b.json.gz"
    cut.write_bytes(gzip.compress(b'{"a": 1}')[:-6])
    with pytest.raises(ValueError):
        R.read_json(cut)
    with pytest.raises(ValueError):
        R.read_json(tmp_path / "missing.json")


def _expect(**changes: object) -> R.Expect:
    base = {"run_id": "fs-1", "plan_family": frozenset({"p1", "p0"}), "index": 3,
            "count": 2, "member_hash": "m3"}
    base.update(changes)
    return R.Expect(**base)  # type: ignore[arg-type]


def _result(**changes: object) -> dict[str, object]:
    body = {"run_id": "fs-1", "plan_hash": "p0", "shard_index": 3, "member_hash": "m3",
            "complete": True, "items": 2}
    body.update(changes)
    return body


def test_shard_done_requires_every_field(tmp_path: Path) -> None:
    path = tmp_path / R.shard_name(3)
    assert R.shard_done(path, _expect()) == (False, "missing")
    R.atomic_write_json(path, _result(), gz=True)
    assert R.shard_done(path, _expect()) == (True, "done")
    cases = {
        "run_id differs": _result(run_id="fs-2"),
        "plan hash differs": _result(plan_hash="p9"),
        "shard index differs": _result(shard_index=4),
        "member hash differs": _result(member_hash="m4"),
        "not marked complete": _result(complete=False),
        "item count differs from the plan": _result(items=1),
    }
    for reason, body in cases.items():
        R.atomic_write_json(path, body, gz=True)
        assert R.shard_done(path, _expect()) == (False, reason)
    path.write_bytes(b"\x1f\x8bbroken")
    assert R.shard_done(path, _expect())[0] is False
    R.atomic_write_json(path, [1, 2], gz=True)
    assert R.shard_done(path, _expect()) == (False, "not an object")


def test_checkpoint_round_trip_and_stale_checkpoints(tmp_path: Path) -> None:
    point = R.Checkpoint("fs-1", "p1", 2, {"a" * 64, "b" * 64}, {"cells": []})
    R.save_checkpoint(tmp_path, point)
    members = ["a" * 64, "b" * 64, "c" * 64]
    back = R.load_checkpoint(tmp_path, "fs-1", {"p1"}, 2, members)
    assert back is not None and back.done == point.done and back.partial == {"cells": []}
    assert R.load_checkpoint(tmp_path, "fs-2", {"p1"}, 2, members) is None
    assert R.load_checkpoint(tmp_path, "fs-1", {"p9"}, 2, members) is None
    assert R.load_checkpoint(tmp_path, "fs-1", {"p1"}, 2, ["a" * 64]) is None
    assert R.load_checkpoint(tmp_path, "fs-1", {"p1"}, 5, members) is None
    (tmp_path / R.checkpoint_name(2)).write_bytes(b"junk")
    assert R.load_checkpoint(tmp_path, "fs-1", {"p1"}, 2, members) is None
    R.drop_checkpoint(tmp_path, 2)
    assert not (tmp_path / R.checkpoint_name(2)).exists()

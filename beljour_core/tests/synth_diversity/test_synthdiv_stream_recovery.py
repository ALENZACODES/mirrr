"""Failures leave no partial output; a rerun after repair equals an uninterrupted run.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

import lab.synth_diversity.stress_provenance_stream_verify as stream_verify
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world
from lab.synth_diversity.stress_provenance_stream_verify import StreamSummary, verify_and_export
from lab.synth_diversity.types import SyntheticInputError


def export(world: StreamWorld, out: Path, work: Path | None) -> StreamSummary:
    return verify_and_export(world.roster, world.ledger, world.stream, world.trust,
                             world.registry, world.now, out, work)


def test_crash_during_allowlist_leaves_nothing(tmp_path: Path,
                                               monkeypatch: pytest.MonkeyPatch) -> None:
    world = build_world(tmp_path / "w")
    (tmp_path / "work").mkdir()
    (tmp_path / "out").mkdir()
    calls = {"count": 0}
    original = stream_verify.training_fence

    def flaky(*args: Any, **kwargs: Any) -> tuple[str, ...]:
        calls["count"] += 1
        if calls["count"] == 2:
            raise SyntheticInputError("simulated crash")
        return original(*args, **kwargs)

    monkeypatch.setattr(stream_verify, "training_fence", flaky)
    with pytest.raises(SyntheticInputError, match="simulated"):
        export(world, tmp_path / "out" / "allow.jsonl", tmp_path / "work")
    assert list((tmp_path / "out").iterdir()) == []
    assert list((tmp_path / "work").iterdir()) == []
    monkeypatch.setattr(stream_verify, "training_fence", original)
    resumed = export(world, tmp_path / "out" / "allow.jsonl", tmp_path / "work")
    clean = export(build_world(tmp_path / "w2"), tmp_path / "out" / "second.jsonl",
                   tmp_path / "work")
    assert resumed.allowlist_sha256 == clean.allowlist_sha256
    assert (tmp_path / "out" / "allow.jsonl").read_bytes() == (
        tmp_path / "out" / "second.jsonl").read_bytes()


def test_failed_verification_removes_index(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w", omit={"sfhq-0002"})
    (tmp_path / "work").mkdir()
    with pytest.raises(SyntheticInputError):
        export(world, tmp_path / "allow.jsonl", tmp_path / "work")
    assert list((tmp_path / "work").iterdir()) == []
    assert not (tmp_path / "allow.jsonl").exists()


def test_repeat_runs_are_byte_identical(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    first = export(world, tmp_path / "a.jsonl", None)
    second = export(world, tmp_path / "b.jsonl", None)
    assert first == second

"""Crash recovery, digest, size and security tests for synthetic-only shards.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

import lab.synth_diversity.shards as shards
from lab.synth_diversity.__main__ import main
from lab.synth_diversity.fixtures import make_drawn_face, save_drawn_fixture
from lab.synth_diversity.plan import make_plans
from lab.synth_diversity.shards import (
    MAX_PIXELS_IN_SHARD,
    _json_bytes,
    verify_shards,
    write_shards,
)
from lab.synth_diversity.types import BaseFace, SyntheticInputError, TraitPlan
from lab.synth_diversity.writer import load_manifest, repository_root


def _setup(count: int = 3) -> tuple[list[BaseFace], list[TraitPlan]]:
    """Return only code-drawn sources and tagged deterministic plans."""
    bases = [make_drawn_face(seed=31, size=(96, 112), base_id="safe_base")]
    plans = make_plans(count, seed=19)
    return bases, plans


def _read_ledger(directory: Path) -> dict[str, Any]:
    """Read only the local JSON metadata, never synthetic raster contents."""
    return json.loads((directory / "shards.json").read_text(encoding="utf-8"))


def test_bounded_shards_complete_with_provenance(tmp_path: Path) -> None:
    bases, plans = _setup(5)
    root = tmp_path / "new_shards"
    ledger_path = write_shards(root, bases, plans, shard_size=2)
    assert ledger_path == root / "shards.json"
    assert verify_shards(root) == []
    ledger = _read_ledger(root)
    assert ledger["format"] == 1
    assert ledger["complete"] is True
    assert ledger["test_only"] is True
    assert ledger["train_allowed"] is False
    assert ledger["plan_count"] == 5
    assert ledger["shard_size"] == 2
    assert [entry["sample_count"] for entry in ledger["shards"]] == [2, 2, 1]
    assert all(entry["name"].startswith("shard-") for entry in ledger["shards"])
    assert all(len(entry["sha256"]) == 64 for entry in ledger["shards"])
    assert not list(root.rglob("*.jpg"))


def test_resume_does_not_rewrite_existing_shard_files(tmp_path: Path) -> None:
    bases, plans = _setup(3)
    root = tmp_path / "permanent"
    write_shards(root, bases, plans, shard_size=2)
    first = {
        str(path.relative_to(root)): path.read_bytes()
        for path in root.rglob("*")
        if path.is_file()
    }
    write_shards(root, bases, plans, shard_size=2, resume=True)
    second = {
        str(path.relative_to(root)): path.read_bytes()
        for path in root.rglob("*")
        if path.is_file()
    }
    assert first == second
    assert verify_shards(root) == []


def test_interrupted_after_first_shard_restarts_with_no_duplicates(tmp_path: Path) -> None:
    bases, plans = _setup(4)
    root = tmp_path / "interrupted"

    def stop_after_first(index: int) -> None:
        if index == 0:
            raise RuntimeError("intentional single-shard interruption")

    with pytest.raises(RuntimeError, match="interruption"):
        write_shards(root, bases, plans, shard_size=2, after_shard=stop_after_first)
    before = (root / "shard-000000" / "manifest.jsonl").read_bytes()
    assert _read_ledger(root)["complete"] is False
    assert len(_read_ledger(root)["shards"]) == 1
    write_shards(root, bases, plans, shard_size=2, resume=True)
    assert (root / "shard-000000" / "manifest.jsonl").read_bytes() == before
    assert len(_read_ledger(root)["shards"]) == 2
    assert verify_shards(root) == []


def test_resume_recovers_completed_shard_missing_from_ledger(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    bases, plans = _setup(3)
    root = tmp_path / "interrupted_ledger"
    real_writer = shards._write_ledger
    calls = 0

    def fail_ledger_once(directory: Path, contents: dict[str, Any]) -> None:
        nonlocal calls
        calls += 1
        if calls == 2:
            raise OSError("synthetic simulated power loss")
        real_writer(directory, contents)

    monkeypatch.setattr(shards, "_write_ledger", fail_ledger_once)
    with pytest.raises(OSError, match="power loss"):
        write_shards(root, bases, plans, shard_size=2)
    assert (root / "shard-000000" / "manifest.jsonl").exists()
    assert len(_read_ledger(root)["shards"]) == 0
    first_bytes = (root / "shard-000000" / "manifest.jsonl").read_bytes()
    monkeypatch.setattr(shards, "_write_ledger", real_writer)
    write_shards(root, bases, plans, shard_size=2, resume=True)
    assert (root / "shard-000000" / "manifest.jsonl").read_bytes() == first_bytes
    assert verify_shards(root) == []


def test_tampered_raster_is_never_silently_rebuilt(tmp_path: Path) -> None:
    bases, plans = _setup(2)
    root = tmp_path / "shards"
    write_shards(root, bases, plans, shard_size=2)
    image = root / "shard-000000" / "sample-000000.png"
    image.write_bytes(image.read_bytes() + b"corrupt")
    assert any("digest mismatch" in error for error in verify_shards(root))
    with pytest.raises(SyntheticInputError, match="integrity failed"):
        write_shards(root, bases, plans, shard_size=2, resume=True)
    assert image.read_bytes().endswith(b"corrupt")


def test_resume_refuses_changed_seed_and_same_id_changed_pixels(tmp_path: Path) -> None:
    bases, plans = _setup(2)
    root = tmp_path / "frozen"
    write_shards(root, bases, plans, shard_size=2)
    with pytest.raises(SyntheticInputError, match="metadata"):
        write_shards(root, bases, make_plans(2, 20), shard_size=2, resume=True)
    different = make_drawn_face(seed=32, size=(96, 112), base_id="safe_base")
    with pytest.raises(SyntheticInputError, match="metadata"):
        write_shards(root, [different], plans, shard_size=2, resume=True)


def test_rejects_work_pixel_budget_before_writing(tmp_path: Path) -> None:
    source = make_drawn_face(size=(1024, 1024))
    assert 2 * source.width * source.height > MAX_PIXELS_IN_SHARD
    with pytest.raises(SyntheticInputError, match="working-pixel"):
        write_shards(tmp_path / "bad", [source], make_plans(2, 1), shard_size=2)
    assert not (tmp_path / "bad").exists()


def test_rejects_existing_folder_without_explicit_resume(tmp_path: Path) -> None:
    bases, plans = _setup(1)
    root = tmp_path / "frozen"
    write_shards(root, bases, plans)
    with pytest.raises(SyntheticInputError, match="already exists"):
        write_shards(root, bases, plans)
    with pytest.raises(SyntheticInputError, match="does not exist"):
        write_shards(tmp_path / "missing", bases, plans, resume=True)


def test_rejects_repository_paths_and_symlink_aliases(tmp_path: Path) -> None:
    bases, plans = _setup(1)
    with pytest.raises(SyntheticInputError, match="inside the repo"):
        write_shards(repository_root() / "unwritten", bases, plans)
    alias = tmp_path / "alias"
    alias.symlink_to(tmp_path, target_is_directory=True)
    with pytest.raises(SyntheticInputError, match="symlink"):
        write_shards(alias, bases, plans)
    with pytest.raises(SyntheticInputError, match="base folder"):
        write_shards(
            tmp_path / "bases" / "output", bases, plans, base_dir=tmp_path / "bases"
        )


def test_bad_shard_size_and_empty_plans_fail_cleanly(tmp_path: Path) -> None:
    bases, plans = _setup(1)
    with pytest.raises(SyntheticInputError, match="size"):
        write_shards(tmp_path / "bad", bases, plans, shard_size=17)
    with pytest.raises(SyntheticInputError, match="requires"):
        write_shards(tmp_path / "bad", bases, [])
    with pytest.raises(SyntheticInputError, match="requires"):
        write_shards(tmp_path / "bad", [], plans)


def test_ledger_flags_or_digest_tampering_detected(tmp_path: Path) -> None:
    bases, plans = _setup(2)
    root = tmp_path / "flag"
    write_shards(root, bases, plans)
    ledger_path = root / "shards.json"
    data = _read_ledger(root)
    data["train_allowed"] = True
    ledger_path.write_bytes(_json_bytes(data))
    assert any("safety flags" in error for error in verify_shards(root))
    with pytest.raises(SyntheticInputError, match="metadata"):
        write_shards(root, bases, plans, resume=True)
    data["train_allowed"] = False
    data["shards"][0]["sha256"] = "a" * 64
    ledger_path.write_bytes(_json_bytes(data))
    assert any("committed checksum" in error for error in verify_shards(root))


def test_shard_manifest_contains_plan_declared_tags(tmp_path: Path) -> None:
    bases, plans = _setup(3)
    root = tmp_path / "cells"
    write_shards(root, bases, plans, shard_size=2)
    first = load_manifest(root / "shard-000000")
    last = load_manifest(root / "shard-000001")
    assert [row["tags"] for row in first + last] == [plan.tags for plan in plans]
    assert [row["seed"] for row in first + last] == [plan.seed for plan in plans]
    assert all(row["train_allowed"] is False for row in first + last)
    assert all(row["test_only"] is True for row in first + last)


def test_make_shards_and_verify_shards_cli(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    base_dir = tmp_path / "bases"
    save_drawn_fixture(base_dir, make_drawn_face(size=(96, 112), base_id="cli_source"))
    out = tmp_path / "cli_shards"
    args = [
        "make-shards",
        "--bases", str(base_dir),
        "--out", str(out),
        "--count", "3",
        "--seed", "202",
        "--shard-size", "2",
    ]
    assert main(args) == 0
    assert "test-only" in capsys.readouterr().out
    assert main(["verify-shards", "--dir", str(out)]) == 0
    assert "verified" in capsys.readouterr().out
    assert main(args + ["--resume"]) == 0
    assert verify_shards(out) == []

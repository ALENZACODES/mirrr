"""Training-leak and display guards refuse facescale test data.

Plans and guard folders live in tmp_path; images are drawn.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

import lab.facescale as FS
from lab.facescale import leakguard as LG
from lab.facescale.loaders import loader_for
from lab.facescale.registry import load_local
from lab.facescale.shards import build_plan, save_plan, scan
from lab.facescale.synthetic import all_layouts, sources_file, write_image


@pytest.fixture()
def planned(tmp_path: Path) -> tuple[Path, Path]:
    """(guard folder, sets folder) for a registered plan over every layout."""
    local = load_local(sources_file(tmp_path / "s.json", all_layouts(tmp_path / "sets")))
    plan = build_plan(scan([loader_for(e) for e in local.values()]), shard_size=10)
    save_plan(plan, tmp_path / "plan")
    guard = tmp_path / "guard"
    LG.register_plan(tmp_path / "plan", plan.plan_hash, guard)
    return guard, tmp_path / "sets"


def test_exports_from_the_package() -> None:
    assert FS.refuse_training is LG.refuse_training
    assert FS.refuse_display is LG.refuse_display
    assert issubclass(FS.TrainingRefused, FS.LeakGuardError)


def test_training_on_a_planned_image_folder_is_refused(planned: tuple[Path, Path]) -> None:
    guard, sets = planned
    with pytest.raises(LG.TrainingRefused, match="facescale test image"):
        LG.refuse_training(sets / "s04", guard=[guard])


def test_copied_test_image_is_caught_by_hash(planned: tuple[Path, Path], tmp_path: Path) -> None:
    guard, sets = planned
    train = tmp_path / "train_set"
    train.mkdir()
    write_image(train / "fresh.png", 9_999)
    assert LG.refuse_training(train, guard=[guard]) == 1
    (train / "renamed.jpg").write_bytes((sets / "s08" / "00000.jpg").read_bytes())
    with pytest.raises(LG.TrainingRefused):
        LG.refuse_training(train, guard=[guard])


def test_manifest_records_are_checked(planned: tuple[Path, Path], tmp_path: Path) -> None:
    guard, _ = planned
    ok = tmp_path / "ok.jsonl"
    ok.write_text(json.dumps({"file": "a.png", "source": "synthetic-gen"}) + "\n")
    assert LG.refuse_training(ok, guard=[guard]) == 1
    named = tmp_path / "named.jsonl"
    named.write_text(json.dumps({"file": "a.png", "source_id": "S07"}) + "\n")
    with pytest.raises(LG.TrainingRefused, match="S07"):
        LG.refuse_training(named, guard=[guard])
    flagged = tmp_path / "flagged.json"
    flagged.write_text(json.dumps({"records": [{"file": "b", "test_only": True}]}))
    with pytest.raises(LG.TrainingRefused, match="test_only"):
        LG.refuse_training(flagged, guard=[guard])
    plan_header = json.loads((tmp_path / "plan" / "plan.json").read_text())
    assert plan_header["total"] > 0
    from lab.facescale.shards import shard_members

    sha = shard_members(tmp_path / "plan", 0)[0].sha
    hashed = tmp_path / "hashed.csv"
    hashed.write_text(f"file,sha256\nx.png,{sha}\n")
    with pytest.raises(LG.TrainingRefused, match="hash"):
        LG.refuse_training(hashed, guard=[guard])


def test_in_memory_records(planned: tuple[Path, Path]) -> None:
    guard, _ = planned
    assert LG.refuse_training([{"source": "own"}, {"sha256": "zz"}], guard=[guard]) == 2
    with pytest.raises(LG.TrainingRefused):
        LG.refuse_training([{"source": "s09"}], guard=[guard])


def test_missing_path_is_refused_not_guessed(tmp_path: Path) -> None:
    with pytest.raises(LG.TrainingRefused, match="does not exist"):
        LG.refuse_training(tmp_path / "none", guard=[tmp_path])
    with pytest.raises(LG.DisplayRefused, match="does not exist"):
        LG.refuse_display(tmp_path / "none", guard=[tmp_path])


def test_display_guard(planned: tuple[Path, Path], tmp_path: Path) -> None:
    guard, sets = planned
    with pytest.raises(LG.DisplayRefused, match="never shown"):
        LG.refuse_display(sets / "s01" / "train" / "0.jpg", guard=[guard])
    shot = tmp_path / "screenshot.png"
    write_image(shot, 4_242)
    assert LG.refuse_display(shot, guard=[guard]) == 1


def test_source_roots_from_environment(
    planned: tuple[Path, Path], tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    _, sets = planned
    monkeypatch.setenv(LG.SOURCES_ENV, str(tmp_path / "s.json"))
    empty = tmp_path / "empty_guard"
    with pytest.raises(LG.TrainingRefused, match="source root"):
        LG.refuse_training(sets / "s06", guard=[empty])
    with pytest.raises(LG.DisplayRefused, match="source root"):
        LG.refuse_display(sets / "s06", guard=[empty])
    monkeypatch.setenv(LG.SOURCES_ENV, str(tmp_path / "missing.json"))
    assert LG.source_roots() == []


def test_guard_folders_from_environment(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(LG.GUARD_ENV, f"{tmp_path / 'a'}:{tmp_path / 'b'}")
    assert LG.guard_dirs() == [tmp_path / "a", tmp_path / "b"]
    monkeypatch.delenv(LG.GUARD_ENV)
    assert LG.guard_dirs()[-1].name == "facescale-guard"
    assert LG.guard_dirs([tmp_path]) == [tmp_path]


def test_bad_guard_file_is_an_error(tmp_path: Path) -> None:
    import numpy as np

    np.save(tmp_path / "bad.npy", np.zeros(3, np.float32))
    with pytest.raises(LG.LeakGuardError, match="wrong type"):
        LG.load_prefixes([tmp_path])
    assert LG.in_plans("short", np.zeros(0, np.uint64)) is False
    assert LG.in_plans("zz" * 10, np.array([1], np.uint64)) is False

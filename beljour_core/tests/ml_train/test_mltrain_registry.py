"""Ownership list for the ML training framework stays complete and accurate.

Fails when a .py file in lab/ml/train or api/tests/ml_train is not listed, or a
listed file does not exist. Uses scratch folders for the failure cases.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import k_ml_train as K


def test_every_file_is_listed_and_every_listed_file_exists() -> None:
    assert K.ml_train_ownership() == []
    assert set(K.files_on_disk()) == set(K.K_ML_TRAIN_MODULES)


def test_registry_points_at_the_repository_root() -> None:
    assert (K.REPO_ROOT / "licences.json").is_file()
    assert (K.REPO_ROOT / K.REGISTRY_FILE).is_file()
    assert K.CONTRIBUTIONS == ()


def test_unlisted_file_is_reported(tmp_path: Path) -> None:
    extra = tmp_path / "lab/ml/train/extra.py"
    extra.parent.mkdir(parents=True)
    extra.write_text('"""x. Author: John Khan."""\n')
    problems = K.ml_train_ownership(tmp_path, {})
    assert problems == ["lab/ml/train/extra.py: not listed in k_ml_train.py"]


def test_missing_file_and_bad_owner_are_reported(tmp_path: Path) -> None:
    modules = {
        "lab/ml/train/gone.py": ("K", "removed module"),
        "api/tests/ml_train/test_mltrain_x.py": ("A", ""),
    }
    present = tmp_path / "api/tests/ml_train/test_mltrain_x.py"
    present.parent.mkdir(parents=True)
    present.write_text("")
    problems = K.ml_train_ownership(tmp_path, modules)
    assert "lab/ml/train/gone.py: listed but missing" in problems
    assert "api/tests/ml_train/test_mltrain_x.py: owner 'A', expected 'K'" in problems
    assert "api/tests/ml_train/test_mltrain_x.py: empty purpose" in problems
    assert len(problems) == 3


def test_cache_folders_are_ignored(tmp_path: Path) -> None:
    cached = tmp_path / "lab/ml/train/__pycache__/x.py"
    cached.parent.mkdir(parents=True)
    cached.write_text("")
    assert K.files_on_disk(tmp_path) == []

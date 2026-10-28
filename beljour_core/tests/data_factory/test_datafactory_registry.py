"""Lane K registry stays in step with the files of the data factory.

Mutation checks run on a scratch copy in tmp_path, never on the repo.
Author: John Khan.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from plumb_api.arena.lane_registry import k_data_factory as registry


def scratch_copy(tmp_path: Path) -> Path:
    for path in registry.MODULES:
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(registry.REPO_ROOT / path, target)
    return tmp_path


def test_registry_matches_repo() -> None:
    assert registry.problems() == []
    assert set(registry.files_on_disk()) <= set(registry.MODULES)
    assert {owner for owner, _ in registry.MODULES.values()} == {"K"}


def test_unlisted_file_fails(tmp_path: Path) -> None:
    root = scratch_copy(tmp_path)
    assert registry.problems(root) == []
    extra = root / "api/plumb_api/data_factory/new_stage.py"
    extra.write_text('"""New stage. Author: John Khan."""\n')
    assert registry.problems(root) == [
        "api/plumb_api/data_factory/new_stage.py: not listed in " + registry.REGISTRY_FILE]


def test_missing_listed_file_fails(tmp_path: Path) -> None:
    root = scratch_copy(tmp_path)
    (root / "api/plumb_api/data_factory/dedup.py").unlink()
    assert registry.problems(root) == [
        "api/plumb_api/data_factory/dedup.py: listed but does not exist"]


def test_owner_purpose_and_self_listing(tmp_path: Path) -> None:
    root = scratch_copy(tmp_path)
    modules = dict(registry.MODULES)
    modules["api/plumb_api/data_factory/records.py"] = ("Z", "")
    del modules[registry.REGISTRY_FILE]
    issues = registry.problems(root, modules)
    assert "api/plumb_api/data_factory/records.py: owner must be K" in issues
    assert "api/plumb_api/data_factory/records.py: purpose is empty" in issues
    assert any("must list itself" in issue for issue in issues)

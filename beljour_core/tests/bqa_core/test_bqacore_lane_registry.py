"""The C17 ownership list stays in step with the files on disk.

Mutations run on a scratch copy of the listed files in tmp_path.
Author: John Khan.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from plumb_api.arena.lane_registry import k_bqa_core


def scratch(tmp_path: Path) -> Path:
    for path in k_bqa_core.MODULES:
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(k_bqa_core.REPO_ROOT / path, target)
    return tmp_path


def test_list_matches_the_repo() -> None:
    assert k_bqa_core.problems() == []
    assert {owner for owner, _ in k_bqa_core.MODULES.values()} == {"K"}


def test_unlisted_and_missing_files_are_reported(tmp_path: Path) -> None:
    root = scratch(tmp_path)
    assert k_bqa_core.problems(root) == []
    (root / "lab/bqa_core/extra.py").write_text('"""Extra. Author: John Khan."""\n')
    (root / "lab/bqa_core/golden.py").unlink()
    assert k_bqa_core.problems(root) == [
        f"lab/bqa_core/extra.py: not listed in {k_bqa_core.REGISTRY_FILE}",
        "lab/bqa_core/golden.py: listed but does not exist",
    ]


def test_owner_purpose_and_self_listing(tmp_path: Path) -> None:
    root = scratch(tmp_path)
    modules = dict(k_bqa_core.MODULES)
    modules["lab/bqa_core/stats.py"] = ("A", " ")
    del modules[k_bqa_core.REGISTRY_FILE]
    found = k_bqa_core.problems(root, modules)
    assert "lab/bqa_core/stats.py: owner must be K" in found
    assert "lab/bqa_core/stats.py: purpose is empty" in found
    assert any("must list itself" in issue for issue in found)

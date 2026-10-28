"""Tests for the lane K ownership list of the seasonal packs task.

Author: John Khan.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from plumb_api.arena.lane_registry import k_packs


def test_every_file_is_listed_and_every_listed_file_exists() -> None:
    assert k_packs.check_k_packs() == []


def test_list_covers_the_folders() -> None:
    files = set(k_packs.k_packs_files())
    assert files
    assert files <= set(k_packs.K_PACKS_MODULES)
    assert "api/plumb_api/seasonal/packs/__init__.py" in files


def test_owner_is_k_everywhere() -> None:
    rows = k_packs.k_packs_ownership()
    assert {row["owner"] for row in rows.values()} == {"K"}
    assert all(row["purpose"] for row in rows.values())


def _copy_tree(tmp_path: Path) -> Path:
    root = tmp_path / "repo"
    for path in k_packs.K_PACKS_MODULES:
        source = k_packs.REPO_ROOT / path
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    return root


def test_check_fails_for_an_unlisted_file(tmp_path: Path) -> None:
    root = _copy_tree(tmp_path)
    extra = root / "api/plumb_api/seasonal/packs/extra_pack.py"
    extra.write_text('"""Extra. Author: John Khan."""\n')
    problems = k_packs.check_k_packs(root)
    assert any("extra_pack.py is in a K folder but not listed" in p for p in problems)


def test_check_fails_for_a_missing_listed_file(tmp_path: Path) -> None:
    root = _copy_tree(tmp_path)
    (root / "api/plumb_api/seasonal/packs/hebrew.py").unlink()
    problems = k_packs.check_k_packs(root)
    assert any("hebrew.py is listed in k_packs.py but does not exist" in p for p in problems)


def test_check_ignores_bytecode_caches(tmp_path: Path) -> None:
    root = _copy_tree(tmp_path)
    cache = root / "api/plumb_api/seasonal/packs/__pycache__"
    cache.mkdir()
    (cache / "stray.py").write_text("")
    assert k_packs.check_k_packs(root) == []


def test_registry_file_is_not_wired_into_the_shared_contract() -> None:
    from plumb_api.arena.lane_registry import LANE_FILE_OWNERS

    assert "api/plumb_api/arena/lane_registry/k_packs.py" not in LANE_FILE_OWNERS

"""Registry check tests for the lane K cards registry file.

Author: John Khan.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from plumb_api.arena.lane_registry import k_cards


def test_every_task_file_is_listed_and_exists() -> None:
    assert k_cards.check() == []


def test_owner_is_k_and_purposes_are_written() -> None:
    for path, (owner, purpose) in k_cards.K_CARDS_FILES.items():
        assert owner == "K", path
        assert purpose and len(purpose) <= 60, path
        assert path.endswith(".py")


def test_every_listed_file_carries_the_author_line() -> None:
    for path in k_cards.K_CARDS_FILES:
        head = (k_cards.REPO_ROOT / path).read_text(encoding="utf-8").split('"""')[1]
        assert head.rstrip().endswith("Author: John Khan."), path


def _scratch_copy(tmp_path: Path) -> Path:
    for path in k_cards.K_CARDS_FILES:
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(k_cards.REPO_ROOT / path, target)
    return tmp_path


def test_check_fails_for_an_unlisted_file(tmp_path: Path) -> None:
    root = _scratch_copy(tmp_path)
    assert k_cards.check(root) == []
    (root / "api/plumb_api/seasonal/cards/extra.py").write_text('"""x"""\n')
    assert k_cards.check(root) == ["unlisted: api/plumb_api/seasonal/cards/extra.py"]


def test_check_fails_for_a_listed_file_that_is_gone(tmp_path: Path) -> None:
    root = _scratch_copy(tmp_path)
    (root / "api/plumb_api/seasonal/cards/store.py").unlink()
    assert k_cards.check(root) == ["missing: api/plumb_api/seasonal/cards/store.py"]


def test_check_fails_for_a_wrong_owner(tmp_path: Path) -> None:
    root = _scratch_copy(tmp_path)
    listed = dict(k_cards.K_CARDS_FILES)
    listed["api/plumb_api/seasonal/cards/store.py"] = ("G", "stolen")
    assert k_cards.check(root, listed) == [
        "owner of api/plumb_api/seasonal/cards/store.py is 'G', expected 'K'"
    ]

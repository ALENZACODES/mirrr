"""The facescale ownership list stays complete and accurate.

Fails when a .py file in lab/facescale or api/tests/facescale is not listed,
or a listed file does not exist. Scratch folders cover the failure cases.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import k_facescale as K


def test_every_file_is_listed_and_every_listed_file_exists() -> None:
    assert K.facescale_ownership() == []
    assert set(K.files_on_disk()) == set(K.K_FACESCALE_MODULES)


def test_registry_points_at_the_repository_root() -> None:
    assert (K.REPO_ROOT / "licences.json").is_file()
    assert (K.REPO_ROOT / K.REGISTRY_FILE).is_file()
    assert K.CONTRIBUTIONS == ()
    assert {owner for owner, _ in K.K_FACESCALE_MODULES.values()} == {"K"}


def test_unlisted_file_is_reported(tmp_path: Path) -> None:
    extra = tmp_path / "lab/facescale/extra.py"
    extra.parent.mkdir(parents=True)
    extra.write_text('"""x. Author: John Khan."""\n')
    assert K.facescale_ownership(tmp_path, {}) == [
        "lab/facescale/extra.py: not listed in k_facescale.py"]


def test_missing_file_bad_owner_and_empty_purpose_are_reported(tmp_path: Path) -> None:
    modules = {
        "lab/facescale/gone.py": ("K", "removed module"),
        "api/tests/facescale/test_facescale_x.py": ("A", ""),
    }
    present = tmp_path / "api/tests/facescale/test_facescale_x.py"
    present.parent.mkdir(parents=True)
    present.write_text('"""x. Author: John Khan."""\n')
    assert K.facescale_ownership(tmp_path, modules) == [
        "api/tests/facescale/test_facescale_x.py: owner 'A', expected 'K'",
        "api/tests/facescale/test_facescale_x.py: empty purpose",
        "lab/facescale/gone.py: listed but missing",
    ]


def test_pycache_is_ignored(tmp_path: Path) -> None:
    cached = tmp_path / "lab/facescale/__pycache__/x.py"
    cached.parent.mkdir(parents=True)
    cached.write_text("")
    assert K.files_on_disk(tmp_path) == []

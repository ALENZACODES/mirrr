"""The task C4 owner registry matches the files on disk, and its check catches drift.

Mutation cases run on scratch copies in tmp_path, never on the real tree.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import k_ml_critic


def test_registry_matches_the_tree() -> None:
    assert k_ml_critic.registry_problems() == []


def test_every_listed_file_is_owned_by_k_and_has_a_purpose() -> None:
    rows = k_ml_critic.owner_rows()
    assert rows
    assert {row["owner"] for row in rows} == {"K"}
    assert all(row["purpose"] for row in rows)
    assert k_ml_critic.THIS_FILE in k_ml_critic.MODULES


def test_registry_lists_only_its_own_folders() -> None:
    allowed = k_ml_critic.OWNED_FOLDERS
    for path in k_ml_critic.MODULES:
        assert path == k_ml_critic.THIS_FILE or path.startswith(tuple(f + "/" for f in allowed))


def scratch_tree(root: Path, files: list[str]) -> None:
    for name in files:
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text('"""Scratch. Author: John Khan."""\n', encoding="utf-8")


def test_unlisted_file_is_reported(tmp_path: Path) -> None:
    listed = {"lab/ml/critic/a.py": ("K", "first")}
    scratch_tree(tmp_path, ["lab/ml/critic/a.py", "lab/ml/identity/new.py"])
    problems = k_ml_critic.registry_problems(tmp_path, listed)
    assert problems == ["lab/ml/identity/new.py: file exists but is not listed in "
                        "k_ml_critic.MODULES"]


def test_missing_file_is_reported(tmp_path: Path) -> None:
    listed = {"lab/ml/critic/a.py": ("K", "first"), "lab/ml/critic/gone.py": ("K", "lost")}
    scratch_tree(tmp_path, ["lab/ml/critic/a.py"])
    problems = k_ml_critic.registry_problems(tmp_path, listed)
    assert problems == ["lab/ml/critic/gone.py: listed in k_ml_critic.MODULES but does not exist"]


def test_wrong_owner_and_empty_purpose_are_reported(tmp_path: Path) -> None:
    listed = {"lab/ml/critic/a.py": ("B", " ")}
    scratch_tree(tmp_path, ["lab/ml/critic/a.py"])
    problems = k_ml_critic.registry_problems(tmp_path, listed)
    assert len(problems) == 2
    assert "owner 'B'" in problems[0]
    assert "purpose is empty" in problems[1]


def test_cache_folders_are_ignored(tmp_path: Path) -> None:
    scratch_tree(tmp_path, ["lab/ml/critic/__pycache__/x.py"])
    assert k_ml_critic.present_files(tmp_path) == []


def test_registry_module_does_not_import_lab() -> None:
    source = Path(k_ml_critic.__file__).read_text(encoding="utf-8")
    import_lines = [line for line in source.splitlines() if line.startswith(("import", "from"))]
    assert not any("lab" in line for line in import_lines)

"""Tests for the C14 owner registry: complete, existing, owned by K.

Uses scratch copies of the folder layout; no images.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import k_facescale_synth as reg


def test_registry_matches_the_tree() -> None:
    assert reg.registry_problems() == []
    assert reg.THIS_FILE in reg.MODULES
    assert all(owner == "K" for owner, _ in reg.MODULES.values())


def _scratch(tmp_path: Path) -> Path:
    for path in reg.MODULES:
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text('"""x."""\n')
    return tmp_path


def test_unlisted_file_is_reported(tmp_path: Path) -> None:
    root = _scratch(tmp_path)
    extra = root / "lab/facescale_synth/stress/new_module.py"
    extra.write_text('"""x."""\n')
    problems = reg.registry_problems(root)
    assert problems == ["lab/facescale_synth/stress/new_module.py: not listed in " + reg.THIS_FILE]


def test_missing_listed_file_is_reported(tmp_path: Path) -> None:
    root = _scratch(tmp_path)
    (root / "lab/facescale_synth/stress/face.py").unlink()
    problems = reg.registry_problems(root)
    assert problems == ["lab/facescale_synth/stress/face.py: listed but missing"]


def test_wrong_owner_and_empty_purpose_are_reported(tmp_path: Path) -> None:
    root = _scratch(tmp_path)
    modules = dict(reg.MODULES)
    modules[reg.THIS_FILE] = ("A", " ")
    problems = reg.registry_problems(root, modules)
    assert any("owner must be K" in p for p in problems)
    assert any("purpose is empty" in p for p in problems)


def test_registry_module_does_not_import_lab_code() -> None:
    source = Path(reg.__file__).read_text(encoding="utf-8")
    assert "import lab" not in source and "from lab" not in source

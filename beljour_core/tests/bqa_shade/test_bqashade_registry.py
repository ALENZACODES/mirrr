"""Registry and source hygiene tests for the C18 folders.

Pass definition: the K registry lists every .py file of the task and nothing
missing; a fake extra file or a listed-but-absent file is caught; every file
keeps lines at most 100 characters, starts with a docstring ending
"Author: John Khan." and has no code-generator header; no
__init__.py in the tests folder and no lab/__init__.py. Author: John Khan.
"""
from __future__ import annotations

import ast
from pathlib import Path

from plumb_api.arena.lane_registry import k_bqa_shade as registry

ROOT = registry.REPO_ROOT


def own_files() -> list[Path]:
    return [ROOT / path for path in registry.MODULES]


def test_registry_is_complete() -> None:
    assert registry.check() == []


def test_registry_catches_extra_and_missing_files(tmp_path: Path) -> None:
    for path in registry.MODULES:
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("", encoding="utf-8")
    assert registry.check(tmp_path) == []
    (tmp_path / "lab/bqa_shade/extra.py").write_text("", encoding="utf-8")
    (tmp_path / "lab/bqa_shade/colour.py").unlink()
    problems = registry.check(tmp_path)
    assert any("extra.py" in p and "missing from" in p for p in problems)
    assert any("colour.py" in p and "listed but missing" in p for p in problems)


def test_lines_and_headers() -> None:
    for path in own_files():
        text = path.read_text(encoding="utf-8")
        for number, line in enumerate(text.splitlines(), 1):
            assert len(line) <= 100, f"{path.name}:{number}"
        doc = ast.get_docstring(ast.parse(text))
        assert doc and doc.rstrip().endswith("Author: John Khan."), path.name
        head = "\n".join(text.splitlines()[:8]).lower()
        assert "generated" not in head and "do not edit" not in head, path.name


def test_layout_rules() -> None:
    assert not (ROOT / "lab/__init__.py").exists()
    assert not (ROOT / "api/tests/bqa_shade/__init__.py").exists()
    assert (ROOT / "lab/bqa_shade/__init__.py").is_file()

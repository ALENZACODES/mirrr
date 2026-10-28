"""Package-wide rules: exports resolve, no network or lab imports, headers, sizes.

Author: John Khan.
"""

from __future__ import annotations

import ast
from pathlib import Path

import plumb_api.data_factory as data_factory

PACKAGE = Path(data_factory.__file__).resolve().parent
TESTS = Path(__file__).resolve().parent
NETWORK_MODULES = {"socket", "http", "urllib", "requests", "httpx", "ftplib", "smtplib",
                   "aiohttp", "websocket", "ssl"}
MAX_LINES = 800


def python_files() -> list[Path]:
    return sorted(PACKAGE.glob("*.py")) + sorted(TESTS.glob("*.py"))


def imported_roots(path: Path) -> set[str]:
    roots: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            roots.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            roots.add(node.module.split(".")[0])
    return roots


def test_every_export_resolves() -> None:
    assert sorted(data_factory.__all__) == sorted(set(data_factory.__all__))
    for name in data_factory.__all__:
        assert getattr(data_factory, name) is not None


def test_no_network_or_lab_imports() -> None:
    for path in sorted(PACKAGE.glob("*.py")):
        roots = imported_roots(path)
        assert not roots & NETWORK_MODULES, path.name
        assert "lab" not in roots and "beljour_lab" not in roots, path.name


def test_headers_and_sizes() -> None:
    for path in python_files():
        text = path.read_text(encoding="utf-8")
        docstring = ast.get_docstring(ast.parse(text))
        assert docstring is not None and docstring.rstrip().endswith("Author: John Khan."), path
        lines = text.splitlines()
        assert len(lines) < MAX_LINES, path
        assert all(len(line) <= 100 for line in lines), path


def test_test_folder_has_no_init_and_uses_prefix() -> None:
    assert not (TESTS / "__init__.py").exists()
    for path in TESTS.glob("*.py"):
        assert path.name.startswith("test_datafactory_"), path.name

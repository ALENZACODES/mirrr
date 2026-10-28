"""Architecture mutations must fail before experimental code can ship.

Pass definition: all static and literal dynamic application imports of lab code
are rejected; lab-to-application dependencies remain allowed. No real faces.
Author: John Khan.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("r14_boundaries", ROOT / "scripts/check_boundaries.py")
assert spec is not None and spec.loader is not None
boundaries = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = boundaries
spec.loader.exec_module(boundaries)


@pytest.mark.parametrize("source", [
    "import lab.python.beljour_lab",
    "from lab.python.beljour_lab import face_harness",
    "from lab import python",
    "from ..lab import worker",
    "__import__('lab.python.beljour_lab')",
    "import importlib\nimportlib.import_module('lab.python.beljour_lab')",
])
def test_python_application_cannot_import_lab(tmp_path, source):
    path = tmp_path / "api/plumb_api/routes/bad.py"
    path.parent.mkdir(parents=True)
    path.write_text(source)
    problems = boundaries.lab_problems(tmp_path)
    assert len(problems) == 1
    assert "imports lab code" in problems[0]


@pytest.mark.parametrize("source", [
    'import { probe } from "../../../lab/web/budget.js";',
    'export { probe } from "../../../lab/web/budget.js";',
    'import("../../../lab/web/budget.js");',
    'import "../../../lab/web/budget.js";',
])
def test_browser_application_cannot_import_lab(tmp_path, source):
    path = tmp_path / "web/src/entry.ts"
    path.parent.mkdir(parents=True)
    path.write_text(source)
    assert len(boundaries.lab_problems(tmp_path)) == 1


def test_lab_can_import_production_and_labels_are_not_lab_imports(tmp_path):
    path = tmp_path / "lab/python/example.py"
    path.parent.mkdir(parents=True)
    path.write_text("from plumb_api.engines.shape import gender")
    application = tmp_path / "web/src/view.ts"
    application.parent.mkdir(parents=True)
    application.write_text('import { label } from "./labels.js";')
    assert boundaries.lab_problems(tmp_path) == []


def test_excluded_dataset_credit_is_rejected_but_enforcement_is_allowed(tmp_path):
    source = boundaries.BANNED_SOURCE_NAMES[0]
    path = tmp_path / "api/plumb_api/engines/credit.py"
    path.parent.mkdir(parents=True)
    path.write_text(f"# Inspired by {source}\n")
    assert len(boundaries.source_credit_problems(tmp_path)) == 1
    path.unlink()
    deny = tmp_path / "api/plumb_api/arena/constants.py"
    deny.parent.mkdir(parents=True)
    deny.write_text(f"DENY = ['{source}']\n")
    assert boundaries.source_credit_problems(tmp_path) == []


def test_shipped_tree_and_original_parity_files_survive_relocation():
    assert boundaries.lab_problems(ROOT) == []
    assert not (ROOT / "web/src/spikes").exists()
    assert not (ROOT / "api/plumb_api/spikes").exists()
    assert (ROOT / "web/src/engines/local/enhance.ts").is_file()
    assert (ROOT / "lab/python/beljour_lab/face_harness.py").is_file()


def test_make_check_requires_both_type_and_lint_gates():
    makefile = (ROOT / "Makefile").read_text()
    rule = next(line for line in makefile.splitlines() if line.startswith("check:"))
    assert "typecheck" in rule and "lint" in rule
    assert "-m mypy --config-file mypy.ini plumb_api" in makefile
    assert "not installed; skipped" not in makefile

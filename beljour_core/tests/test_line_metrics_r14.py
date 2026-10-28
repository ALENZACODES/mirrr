"""Count UTF-8 product copy without silently losing a source file.

This uses pygount itself on temporary original text, without network or faces.
Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

from api.tests.test_repo_checks import REPO, load


def test_utf8_source_and_tests_are_counted_without_generated_builds(tmp_path, monkeypatch, capsys):
    metrics = load(REPO / "scripts/lines_pygount.py")
    source = tmp_path / "web/src/controls.ts"
    test = tmp_path / "web/test/controls.test.mjs"
    generated = tmp_path / "web/dist/controls.js"
    for path in (source, test, generated):
        path.parent.mkdir(parents=True, exist_ok=True)
    source.write_text('const label = "← Crème · 33 →";\nexport { label };\n', encoding="utf-8")
    test.write_text('const expected = "← Crème · 33 →";\n', encoding="utf-8")
    generated.write_text('const build = 1;\n' * 40, encoding="utf-8")
    monkeypatch.setattr(metrics, "ROOT", Path(tmp_path))
    assert metrics.main() == 0
    output = capsys.readouterr()
    assert "cannot read" not in output.err
    assert output.out.startswith("pygount: ")
    counts = json.loads(output.out.removeprefix("pygount: "))
    assert counts == {"code": 2, "test": 1, "files": 2}

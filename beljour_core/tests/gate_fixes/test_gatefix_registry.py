"""The C16 ownership list is complete and every listed file exists.

Pass definition: check() is empty on the repository; it reports a listed file
that is missing and an unlisted file in the task's own folder. Uses tmp_path
copies only. Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import k_gate_fixes as registry


def test_every_new_module_is_listed_and_present() -> None:
    assert registry.check() == []


def test_missing_listed_file_and_unlisted_new_file_are_reported(tmp_path: Path) -> None:
    for path in registry.MODULES:
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("", encoding="utf-8")
    assert registry.check(tmp_path) == []
    first = sorted(registry.MODULES)[0]
    (tmp_path / first).unlink()
    stray = tmp_path / registry.OWN_FOLDERS[0] / "test_gatefix_unlisted.py"
    stray.write_text("", encoding="utf-8")
    problems = registry.check(tmp_path)
    assert f"{first}: listed but missing" in problems
    assert any("test_gatefix_unlisted.py: new file missing" in p for p in problems)

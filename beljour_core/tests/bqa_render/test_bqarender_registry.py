"""The C19 ownership list stays complete and only names files that exist.

Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import k_bqa_render


def test_registry_lists_every_file_and_nothing_missing() -> None:
    assert k_bqa_render.check() == []


def test_registry_check_catches_unlisted_and_missing_files(tmp_path: Path) -> None:
    for path in k_bqa_render.MODULES:
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text('"""x."""\n', encoding="utf-8")
    assert k_bqa_render.check(tmp_path) == []
    (tmp_path / "lab/bqa_render/extra.py").write_text("", encoding="utf-8")
    (tmp_path / "lab/bqa_render/zones.py").unlink()
    problems = k_bqa_render.check(tmp_path)
    assert any("extra.py: new file missing" in p for p in problems)
    assert any("zones.py: listed but missing" in p for p in problems)

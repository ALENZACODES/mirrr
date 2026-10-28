"""Lane S manifest completeness, scope and self-check tests.
Author: John Khan.
"""

from __future__ import annotations

from api.plumb_api.arena.lane_registry.s import LANE_FILES, check_registry


def test_lane_registry_lists_all_python_files() -> None:
    assert check_registry() == []
    assert len(LANE_FILES) == len({entry.path for entry in LANE_FILES})
    assert all(entry.owner == "S" for entry in LANE_FILES)
    assert any(entry.path.endswith("/s.py") for entry in LANE_FILES)
    assert any(entry.path.endswith("test_synthdiv_registry.py") for entry in LANE_FILES)

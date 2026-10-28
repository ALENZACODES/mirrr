"""Lane H ownership and independent-evidence definition are kept in Lane H.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import h


def test_identity_qualification_ownership_does_not_modify_shared_registry() -> None:
    assert h.CONTRIBUTIONS == ()
    assert len(h.LANE_H_R11H_FILES) == len(set(h.LANE_H_R11H_FILES))
    assert all(owner == "H" for owner in h.LANE_H_R11H_OWNER.values())
    assert h.LANE_H_R11H_OWNER.keys() == set(h.LANE_H_R11H_FILES)


def test_every_registered_identity_qualification_module_exists() -> None:
    root = Path(__file__).resolve().parents[3]
    assert all((root / filename).is_file() for filename in h.LANE_H_R11H_FILES)
    assert "api/plumb_api/arena/registry.py" not in h.LANE_H_R11H_FILES
    assert "api/tests/test_lane_registry_r24a.py" not in h.LANE_H_R11H_FILES

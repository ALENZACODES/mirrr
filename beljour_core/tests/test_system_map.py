"""docs/SYSTEM-MAP.md is generated, current, and fails loudly when the system moves under it.

Author: John Khan.
"""
from __future__ import annotations

import dataclasses
import importlib.util
import json
import sys
from pathlib import Path
from types import ModuleType

ROOT = Path(__file__).resolve().parents[2]


def system_map() -> ModuleType:
    spec = importlib.util.spec_from_file_location("system_map", ROOT / "scripts/system_map.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["system_map"] = module      # dataclasses look their module up
    spec.loader.exec_module(module)
    return module


def test_the_page_is_current_and_has_no_problems() -> None:
    m = system_map()
    assert m.problems() == []
    assert m.OUT.read_text(encoding="utf-8") == m.render(), "run make system-map"


def test_every_built_feature_is_on_exactly_one_subsystem() -> None:
    m = system_map()
    rows = {f["id"]: f for f in json.loads(m.FEATURES.read_text(encoding="utf-8"))["features"]}
    mapped = [fid for s in m.SUBSYSTEMS for fid in s.features]
    assert len(mapped) == len(set(mapped))
    assert {fid for fid, r in rows.items() if r["status"] == "Built"} <= set(mapped)


def test_drift_is_caught_dropped_feature_doubled_feature_moved_file_unknown_id() -> None:
    m = system_map()
    first = m.SUBSYSTEMS[0]
    dropped = (dataclasses.replace(first, features=first.features[1:]), *m.SUBSYSTEMS[1:])
    assert any("on no subsystem" in p for p in m.problems(dropped))
    doubled = (*m.SUBSYSTEMS, dataclasses.replace(first, name="Copy"))
    assert any("subsystems:" in p for p in m.problems(doubled))
    moved = (dataclasses.replace(first, entry=("web/src/nowhere.ts",)), *m.SUBSYSTEMS[1:])
    assert any("does not exist" in p for p in m.problems(moved))
    unknown = (dataclasses.replace(first, features=(*first.features, 9999)), *m.SUBSYSTEMS[1:])
    assert any("9999" in p for p in m.problems(unknown))


def test_status_and_real_faces_come_from_the_registry_and_the_panel() -> None:
    m = system_map()
    rows, panel = m.load()
    text = m.render()
    hero = next(s for s in m.SUBSYSTEMS if s.faces == "hero")
    for h in panel["quality"]["heroes"]:
        assert f"{h['name']}: {h['status']}" in m.real_faces(hero, panel)
    assert "renders no face of its own" in m.real_faces(m.SUBSYSTEMS[-1], panel)
    assert m.status(m.SUBSYSTEMS[2], rows) == "built (9 features)"
    assert "NOT_RUN" in text and "Real-face release gate" in text

"""Regression contract for independent per-lane registry edits.

Tests use registry metadata and isolated scratch copies, never real faces.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

from plumb_api.arena import eyes_brows_registry
from plumb_api.arena import lips_skin_registry
from plumb_api.arena import r17b_registry
from plumb_api.arena import registry
from plumb_api.arena.lane_registry import LaneContribution
from plumb_api.arena.lane_registry import a
from plumb_api.arena.lane_registry import b
from plumb_api.arena.lane_registry import c
from plumb_api.arena.lane_registry import d
from plumb_api.arena.lane_registry import e
from plumb_api.arena.lane_registry import f
from plumb_api.arena.lane_registry import g
from plumb_api.arena.lane_registry import legacy


API_ROOT = Path(__file__).resolve().parents[1]


def test_feature_filter_and_women_contract_is_not_reinterpreted() -> None:
    features, infrastructure = registry.load()
    ids = [feature.id for feature in features]
    assert ids[:103] == list(range(1, 104))
    assert ids == list(range(1, len(ids) + 1)), "rows after 103 continue the numbering"
    assert len(registry.filter_rows()) == 61
    assert [row["id"] for row in registry.women_rows()] == [
        f"W{number}" for number in range(1, 101)
    ]
    assert registry.validate(features, raw=json.loads(registry.REGISTRY_PATH.read_text())) == []
    assert registry.unowned_modules(features, infrastructure) == []
    assert registry.REGISTRY_PATH == legacy.REGISTRY_PATH
    assert registry.REPO_ROOT == legacy.REPO_ROOT


def test_all_original_lanes_keep_their_declarations() -> None:
    assert registry.LANE_A_R16A_MODULES is a.LANE_A_R16A_MODULES
    assert registry.LANE_C_MODULE_OWNERS is c.LANE_C_MODULE_OWNERS
    assert registry.LANE_D_R21D_MODULES is d.LANE_D_R21D_MODULES
    assert registry.LANE_E_MODULES is e.LANE_E_MODULES
    assert registry.LANE_E_TESTS is e.LANE_E_TESTS
    assert registry.LANE_E_OWNER == "E"
    assert len(registry.LANE_FILE_OWNERS) == 9
    assert all(
        (registry.REPO_ROOT / path).is_file()
        for path in registry.LANE_FILE_OWNERS
    )
    assert set(c.LANE_C_MODULE_OWNERS.values()) == {"C"}
    assert set(a.LANE_A_R16A_MODULES.values()) == {"A"}
    assert all(owner == "D" for owner, _ in d.LANE_D_R21D_MODULES.values())
    assert all(row["owner"] == "E" for row in registry.lane_e_ownership().values())


def test_original_extra_rows_and_order_are_preserved() -> None:
    path = registry.REGISTRY_PATH
    from_b15 = eyes_brows_registry.module_entries() + lips_skin_registry.module_entries()
    from_e21 = e.lane_e_extra_rows(path)
    from_b18 = r17b_registry.module_entries()
    from_b19 = b.r19_extra_rows(path)
    base = legacy.extras(path)
    assert registry._eyes_brows_extras(path) == base + from_b15
    assert registry.lane_e_extras(path) == base + from_b15 + from_e21
    assert registry.lane_b_r18b_extras(path) == base + from_b15 + from_e21 + from_b18
    historical = base + from_b15 + from_e21 + from_b18 + from_b19
    assert registry.extras(path)[:len(historical)] == historical
    assert registry.lane_b_r19b_cp3_extras(path) == registry.extras(path)
    assert registry.extras_r16b(path) == registry.extras(path) + lips_skin_registry.module_entries()
    assert registry.extras_r17b(path) == registry.extras_r16b(path) + from_b18
    assert [row["owner"] for row in from_e21 + from_b19] == ["E", "B"]


def test_original_women_views_and_module_universe_are_preserved() -> None:
    base = registry.women_rows()
    first = eyes_brows_registry.effective_women_rows(base)
    second = lips_skin_registry.effective_women_rows(first)
    third = r17b_registry.effective_women_rows(second)
    assert registry.effective_women_rows() == first
    assert registry.effective_women_rows_r16b() == second
    assert registry.effective_women_rows_r17b() == third
    original = legacy.module_universe()
    after_e = sorted(set(original) | set(e.lane_e_module_universe()))
    assert registry.lane_e_module_universe() == after_e
    actual = registry.module_universe()
    assert actual == sorted(set(actual))
    assert set(after_e).issubset(actual)


def test_lane_contributions_follow_original_sequence() -> None:
    entries = registry.lane_contributions()
    historical = [(100, "B"), (200, "E"), (300, "B"), (400, "B")]
    actual = [(entry.order, entry.owner) for entry in entries]
    assert actual[:len(historical)] == historical
    assert all(entry.order > 400 for entry in entries[len(historical):])
    assert len({entry.order for entry in entries}) == len(entries)


def test_conflicting_owners_and_stages_are_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(f, "CONTRIBUTIONS", (LaneContribution(400, "F"),))
    with pytest.raises(ValueError, match="duplicate lane registry order"):
        registry.lane_contributions()
    monkeypatch.setattr(f, "CONTRIBUTIONS", (LaneContribution(800, "unknown"),))
    with pytest.raises(ValueError, match="lane registry owner mismatch"):
        registry.lane_contributions()


def test_two_lane_files_can_land_in_one_batch_without_registry_edit(tmp_path: Path) -> None:
    """Edit two real lane files in an isolated package and import from scratch."""
    package = tmp_path / "plumb_api"
    package.mkdir()
    shutil.copy2(API_ROOT / "plumb_api" / "__init__.py", package / "__init__.py")
    arena = package / "arena"
    shutil.copytree(
        API_ROOT / "plumb_api" / "arena",
        arena,
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
    )
    original_loader = (arena / "registry.py").read_bytes()
    source_a = arena / "lane_registry" / "a.py"
    source_g = arena / "lane_registry" / "g.py"
    first_order = max((entry.order for entry in registry.lane_contributions()), default=0) + 10
    second_order = first_order + 10
    with source_a.open("a", encoding="utf-8") as stream:
        stream.write(
            "\nCONTRIBUTIONS = (*CONTRIBUTIONS, "
            f"LaneContribution({first_order}, 'A', lambda path: "
            "[{'id': 'scratch-a'}]))\n"
        )
    with source_g.open("a", encoding="utf-8") as stream:
        stream.write(
            "\nCONTRIBUTIONS = (*CONTRIBUTIONS, "
            f"LaneContribution({second_order}, 'G', lambda path: "
            "[{'id': 'scratch-g'}]))\n"
        )
    assert (arena / "registry.py").read_bytes() == original_loader
    env = dict(os.environ)
    env["PYTHONPATH"] = str(tmp_path)
    script = (
        "from plumb_api.arena import registry\n"
        "rows = registry.extras()\n"
        "assert [row['id'] for row in rows[-2:]] == ['scratch-a', 'scratch-g']\n"
        "assert [(row.order, row.owner) for row in registry.lane_contributions()][-2:] "
        f"== [({first_order}, 'A'), ({second_order}, 'G')]\n"
    )
    completed = subprocess.run(
        [sys.executable, "-c", script],
        cwd=tmp_path,
        env=env,
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
    )
    assert completed.returncode == 0, completed.stdout + completed.stderr
    assert (arena / "registry.py").read_bytes() == original_loader


def test_later_lane_additions_preserve_historical_registry(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A subsequent lane may add rows and paths without rewriting historical rows."""
    path = registry.REGISTRY_PATH
    before = registry.extras(path)
    old_entries = registry.lane_contributions()
    before_modules = registry.module_universe()
    extra_path = "web/src/layout/synthetic-registry-extension.ts"
    extra_row = {"id": "synthetic-later-lane", "owner": "G", "modules": []}
    next_order = max(entry.order for entry in old_entries) + 10
    extension = LaneContribution(
        order=next_order,
        owner="G",
        extra_rows=lambda _path: [extra_row],
        module_paths=lambda _root: [extra_path],
    )
    monkeypatch.setattr(g, "CONTRIBUTIONS", (*g.CONTRIBUTIONS, extension))
    assert registry.lane_contributions() == (*old_entries, extension)
    assert registry.extras(path) == [*before, extra_row]
    assert registry.module_universe() == sorted(set(before_modules) | {extra_path})
    assert registry._eyes_brows_extras(path) == (
        legacy.extras(path)
        + eyes_brows_registry.module_entries()
        + lips_skin_registry.module_entries()
    )

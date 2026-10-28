"""The R20c overlay does not mutate the generated or rights-blocked registry.
Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.engines.women_styling.registry import (
    advertised_capabilities, inspect_canonical_registry, preview_overlay_rows,
    registration_for, registrations,
)
from plumb_api.engines.women_styling.specs import FEATURE_SPECS


REGISTRY_PATH = Path(__file__).resolve().parents[1] / "plumb_api/arena/features.json"


def authoritative_snapshot() -> dict[str, object]:
    return json.loads(REGISTRY_PATH.read_text(encoding="utf8"))


def test_local_registration_is_one_to_one_with_exported_feature_engines() -> None:
    items = registrations()
    assert len(items) == len(FEATURE_SPECS)
    assert [r.id for r in items] == [s.id for s in FEATURE_SPECS]
    assert len({item.id for item in items}) == len(items)
    for item in items:
        assert item.python_module == "plumb_api.engines.women_styling"
        assert item.browser_module == "web/src/engines/women_styling/index.ts"
        assert item.python_test.endswith("women_r20c_engine.py")
        assert item.browser_test.endswith("women_r20c_parity.test.mjs")
        assert item.owner == "John Khan"
        assert item.stage == "implemented-synthetic-tests-only"
        assert item.claims
        assert registration_for(item.id) == item
    for blocked_id in ("W3", "W14", "W45", "W77"):
        with pytest.raises(ValueError, match="No reviewed R20c registration"):
            registration_for(blocked_id)


def test_existing_generated_registry_is_inspected_but_never_edited() -> None:
    original = REGISTRY_PATH.read_bytes()
    registry = authoritative_snapshot()
    assert inspect_canonical_registry(registry) == ()
    items = preview_overlay_rows(registry)
    assert len(items) == len(FEATURE_SPECS)
    assert all(item["release_gate"] == "UNPROVEN" for item in items)
    assert all(item["availability"] == "local-simulation-only" for item in items)
    assert items == advertised_capabilities()
    assert REGISTRY_PATH.read_bytes() == original
    assert registry == authoritative_snapshot()


def test_blocked_rights_and_missing_rows_are_detected_in_registry_preview() -> None:
    registry = authoritative_snapshot()
    women = registry["women"]
    assert isinstance(women, dict)
    rows = women["rows"]
    assert isinstance(rows, list)
    removed = [row for row in rows if row["id"] != "W4"]
    replacement = {**registry, "women": {**women, "rows": removed}}
    assert inspect_canonical_registry(replacement) == ("W4",)
    with pytest.raises(ValueError, match="missing"):
        preview_overlay_rows(replacement)
    tampered = []
    for row in rows:
        if row["id"] == "W3":
            tampered.append({**row, "status": "built"})
        else:
            tampered.append(row)
    with pytest.raises(ValueError, match="Rights-blocked"):
        inspect_canonical_registry({**registry, "women": {**women, "rows": tampered}})
    with pytest.raises(ValueError, match="Duplicated"):
        inspect_canonical_registry({**registry, "women": {**women, "rows": rows + [rows[0]]}})


def test_global_arena_registry_owns_stable_women_styling_modules() -> None:
    """Only a reviewed owner entry can clear module-universe checks.

    A module path with a round suffix must never replace the stable production
    import and no local synthetic pass can imply a frozen real-face verdict.
    """
    from plumb_api.arena.registry import (
        LANE_C_MODULE_OWNERS,
        load,
        unowned_modules,
    )

    features, infrastructure = load()
    for module in (
        "api/plumb_api/engines/women_styling",
        "web/src/engines/women_styling",
    ):
        assert LANE_C_MODULE_OWNERS[module] == "C"
        assert (Path(__file__).resolve().parents[2] / module).is_dir()
        assert module not in unowned_modules(features, infrastructure)
    assert not any("women_r20c" in module for module in LANE_C_MODULE_OWNERS)

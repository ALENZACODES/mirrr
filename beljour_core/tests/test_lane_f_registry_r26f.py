"""Lane F ownership stays private to this lane; shared history is unchanged."""
from __future__ import annotations

from pathlib import Path

from plumb_api.arena.lane_registry import f

REPO = Path(__file__).resolve().parents[2]


def test_registry_contributions_have_distinct_orders_and_f_owner():
    orders = [item.order for item in f.LANE_F_OWNERSHIP]
    assert orders[:3] == [2200, 2300, 2600]
    assert orders[-1] == 2650
    assert len(orders) == len(set(orders))
    assert all(item.owner == "F" for item in f.LANE_F_OWNERSHIP)
    assert f.CONTRIBUTIONS == ()
    assert len(f.LANE_F_R26_MODULES) == len(set(f.LANE_F_R26_MODULES))
    assert len(f.LANE_F_R26_TESTS) == len(set(f.LANE_F_R26_TESTS))


def test_every_registered_module_and_test_exists_without_quality_claim():
    for contribution in f.LANE_F_OWNERSHIP:
        assert contribution.extra_rows is not None
        assert contribution.module_paths is not None
        rows = contribution.extra_rows(REPO)
        assert len(rows) == 1
        row = rows[0]
        assert row["owner"] == "F"
        assert row["status"] == "Built"
        assert row["tested"] == "synthetic_only"
        assert row["modules"] == contribution.module_paths(REPO)
        assert all((REPO / name).is_file() for name in row["modules"])
        assert all((REPO / name).is_file() for name in row["tests"])
        assert "scores" not in row
        assert "passed" not in row
    assert all((REPO / path).is_file() for path in f.LANE_F_R26_MODULES)
    assert all((REPO / path).is_file() for path in f.LANE_F_R26_TESTS)


def test_transferred_concealer_and_hair_palette_are_owned_by_f():
    registered = set(f.LANE_F_R26_MODULES)
    assert "api/plumb_api/engines/concealer/crown.py" in registered
    assert "api/plumb_api/services/fibre.py" in registered
    assert "web/src/engines/local/fibre.ts" in registered
    assert "api/plumb_api/engines/hair_palette/catalogue.py" in registered
    assert "api/plumb_api/engines/menshair/public_render.py" in registered
    assert all("/engines/haircolour/" not in path for path in registered)


def test_gatefix_f_registration_is_separate_and_complete():
    registry = set(f.LANE_F_GATEFIX_MODULES)
    assert len(registry) == len(f.LANE_F_GATEFIX_MODULES)
    assert len(f.LANE_F_GATEFIX_TESTS) >= 6
    assert "api/plumb_api/engines/shade/measurement.py" in registry
    assert "api/plumb_api/styling/local_demo.py" in registry
    assert all((REPO / path).is_file() for path in registry)
    assert all((REPO / path).is_file() for path in f.LANE_F_GATEFIX_TESTS)

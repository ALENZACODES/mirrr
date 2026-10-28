"""R29E admission coverage plan: per-intersection shortfalls that surplus cannot mask.

Author: John Khan.
"""
from __future__ import annotations

import json

from . import body_freeze as F
from .body_coverage import COVERAGE_FORMAT, INTERSECTIONS, coverage_plan


def test_one_body_per_group_needs_1140_more() -> None:
    plan = coverage_plan(F.freeze_manifest(F.control_rows(1)))
    assert plan["format"] == COVERAGE_FORMAT
    assert len(plan["groups"]) == INTERSECTIONS == 60
    assert plan["admitted"] == 60
    assert plan["additional_needed"] == 1140
    assert plan["groups_below_minimum"] == 60
    assert plan["status"] == "MORE_BODIES_NEEDED"
    assert plan["measurement_status"] == "NOT_RUN"


def test_a_complete_set_meets_admission_minimums_but_is_not_measured() -> None:
    plan = coverage_plan(F.freeze_manifest(F.control_rows(20)))
    assert (plan["additional_needed"], plan["status"]) == (0, "ADMISSION_MINIMUMS_MET")
    assert plan["measurement_status"] == "NOT_RUN"


def test_surplus_in_one_group_never_masks_another_groups_gap() -> None:
    rows = F.control_rows(20)
    dropped = [row for row in rows if (row["view"], row["body_size"], row["monk"]) == ("side", "large", "9")][:5]
    kept = [row for row in rows if row not in dropped]
    extra = [dict(row, photo_sha256=f"{index:064x}") for index, row in enumerate(F.control_rows(1)[:40])]
    plan = coverage_plan(F.freeze_manifest(kept + extra))
    assert plan["admitted"] == 1200 - 5 + 40
    gap = next(item for item in plan["groups"] if (item["view"], item["body_size"], item["monk"]) == ("side", "large", "9"))
    assert (gap["admitted"], gap["needed"]) == (15, 5)
    assert plan["additional_needed"] == 5
    assert plan["status"] == "MORE_BODIES_NEEDED"


def test_the_per_view_minimum_can_exceed_the_group_shortfall() -> None:
    rows = [row for row in F.control_rows(20) if row["view"] == "front"]
    plan = coverage_plan(F.freeze_manifest(rows))
    assert plan["views"]["front"] == {"admitted": 600, "needed": 0}
    assert plan["views"]["side"] == {"admitted": 0, "needed": 600}
    assert plan["additional_needed"] == 600


def test_plan_contains_counts_only() -> None:
    rows = F.control_rows(1)
    text = json.dumps(coverage_plan(F.freeze_manifest(rows)))
    assert not any(str(row["photo_sha256"]) in text for row in rows)
    assert "owner_consent_control" not in text

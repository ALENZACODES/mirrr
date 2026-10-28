"""Counts-only coverage plan for admitting the external body set.

For each of the 60 view x body-size x Monk-tone intersections the plan reports how many
admitted bodies exist and how many more the committed minimum (20) needs. Surplus in an
over-represented group never offsets a shortfall elsewhere. `additional_needed` is an
arithmetic lower bound on further admissions, per view also honouring the 600-per-view
minimum; it assumes suitable licensed, released adult material can be admitted into each
missing group (ASSUMED) and is not an estimate of what is available or of model quality.
No photo hash, source or path appears in the plan. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

from .body_evidence import BODY_SIZES, MIN_BODIES_PER_VIEW, MIN_PER_GROUP, MIN_TOTAL_BODIES, VIEWS
from .body_freeze import TONES, FrozenRun

COVERAGE_FORMAT = "beljour-posture-body-coverage-plan/1"
INTERSECTIONS = len(VIEWS) * len(BODY_SIZES) * len(TONES)


def coverage_plan(run: FrozenRun) -> dict[str, Any]:
    counts = run.group_counts()
    groups: list[dict[str, Any]] = []
    for view in VIEWS:
        for size in BODY_SIZES:
            for tone in TONES:
                admitted = counts.get((view, size, tone), 0)
                groups.append({"view": view, "body_size": size, "monk": tone, "admitted": admitted,
                               "needed": max(0, MIN_PER_GROUP - admitted)})
    views: dict[str, dict[str, int]] = {}
    for view in VIEWS:
        admitted = sum(item["admitted"] for item in groups if item["view"] == view)
        group_need = sum(item["needed"] for item in groups if item["view"] == view)
        views[view] = {"admitted": admitted, "needed": max(group_need, MIN_BODIES_PER_VIEW - admitted)}
    total = sum(item["admitted"] for item in views.values())
    additional = max(sum(item["needed"] for item in views.values()), MIN_TOTAL_BODIES - total)
    return {
        "format": COVERAGE_FORMAT,
        "run": run.fingerprint,
        "minimums": {"per_group": MIN_PER_GROUP, "per_view": MIN_BODIES_PER_VIEW, "total": MIN_TOTAL_BODIES},
        "admitted": total,
        "views": views,
        "groups": groups,
        "groups_below_minimum": sum(1 for item in groups if item["needed"]),
        "additional_needed": additional,
        "status": "ADMISSION_MINIMUMS_MET" if additional == 0 else "MORE_BODIES_NEEDED",
        "measurement_status": "NOT_RUN",
    }

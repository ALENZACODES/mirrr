"""Wilson bounds and per-slice synthetic outcome counts with fail-closed statuses.
Author: John Khan.
"""

from __future__ import annotations

from math import isclose
from pathlib import Path

import pytest

from lab.synth_diversity.stress_audit import REQUIRED_INTERSECTIONS
from lab.synth_diversity.stress_evidence import CHECKS, CheckOutcome, write_evidence
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_slices import SliceBridge
from lab.synth_diversity.stress_spec import declared_labels
from lab.synth_diversity.stress_statistics import (
    BELOW,
    BLOCKED,
    INSUFFICIENT,
    MEETS,
    OVERALL,
    SliceCounts,
    StatisticsPolicy,
    audit_evidence,
    wilson_interval,
)
from lab.synth_diversity.types import SyntheticInputError

LENIENT = StatisticsPolicy(1, 0.01)


def study(tmp_path: Path, decide: dict[int, str] | None = None, skip: int | None = None,
          bridge: SliceBridge | None = None) -> tuple[Path, Path, StressSchedule]:
    schedule = StressSchedule(seed=5, count=len(ALL_PROFILES))
    write_stress_manifest(tmp_path / "plan", schedule, bridge)
    rows = [CheckOutcome(case.ordinal, case.identity,
                         {**dict.fromkeys(CHECKS, "pass"),
                          "skin_detail": (decide or {}).get(case.ordinal, "pass")})
            for case in schedule.cases() if case.ordinal != skip]
    write_evidence(tmp_path / "ev", tmp_path / "plan", rows, "r1", bridge)
    return tmp_path / "plan", tmp_path / "ev", schedule


def test_wilson_matches_reference_values() -> None:
    low, high = wilson_interval(8, 10) or (0.0, 0.0)
    assert isclose(low, 0.4901624, abs_tol=1e-6) and isclose(high, 0.9433178, abs_tol=1e-6)
    zero = wilson_interval(0, 20)
    assert zero is not None and zero[0] == 0.0 and isclose(zero[1], 0.1611251, abs_tol=1e-6)
    assert wilson_interval(0, 0) is None


def test_all_pass_lower_bound_is_n_over_n_plus_z_squared() -> None:
    bounds = wilson_interval(73, 73)
    assert bounds is not None and bounds[0] >= 0.95
    previous = wilson_interval(72, 72)
    assert previous is not None and previous[0] < 0.95


@pytest.mark.parametrize("bad", ((5, 4), (-1, 3), (1.0, 3), (True, 3)))
def test_wilson_refuses_impossible_counts(bad: tuple[object, object]) -> None:
    with pytest.raises(SyntheticInputError):
        wilson_interval(*bad)  # type: ignore[arg-type]


def test_slice_status_rules() -> None:
    policy = StatisticsPolicy(30, 0.95)
    assert SliceCounts(100, 99, 0, 0).status(policy) == BLOCKED
    assert SliceCounts(100, 99, 0, 1).status(policy) == BLOCKED
    assert SliceCounts(20, 20, 0, 0).status(policy) == INSUFFICIENT
    assert SliceCounts(40, 40, 0, 0).status(policy) == BELOW
    assert SliceCounts(80, 80, 0, 0).status(policy) == MEETS
    assert SliceCounts(0, 0, 0, 0).status(policy) == INSUFFICIENT


def test_complete_passing_study_meets_lenient_policy(tmp_path: Path) -> None:
    plan, evidence, _ = study(tmp_path)
    report = audit_evidence(plan, evidence, LENIENT)
    data = report.to_dict()
    assert data["synthetic_status"] == "PASS"
    assert data["real_face_quality_status"] == "UNPROVEN"
    assert data["checks"]["skin_detail"][OVERALL]["observed"] == len(ALL_PROFILES)


def test_default_policy_fails_small_samples(tmp_path: Path) -> None:
    plan, evidence, _ = study(tmp_path)
    report = audit_evidence(plan, evidence, StatisticsPolicy())
    assert report.synthetic_status == "FAIL"
    assert all(status in (INSUFFICIENT, BELOW) for _, _, status in report.failing_cells())


def test_one_missing_case_blocks_its_slices(tmp_path: Path) -> None:
    plan, evidence, schedule = study(tmp_path, skip=4)
    report = audit_evidence(plan, evidence, LENIENT)
    assert report.synthetic_status == "FAIL"
    labels = set(declared_labels(schedule.at(4).plan.tags))
    blocked = {name for check, name, status in report.failing_cells()
               if status == BLOCKED and check == "edit_completion"}
    pairs = {"&".join(pair) for pair in REQUIRED_INTERSECTIONS if set(pair) <= labels}
    assert blocked == labels | {OVERALL} | pairs
    assert report.cells["edit_completion"][OVERALL].missing == 1


def test_failures_are_counted_in_each_declared_slice(tmp_path: Path) -> None:
    plan, evidence, schedule = study(tmp_path, decide={0: "fail", 1: "fail"})
    report = audit_evidence(plan, evidence, LENIENT)
    overall = report.cells["skin_detail"][OVERALL]
    assert (overall.passed, overall.failed) == (len(ALL_PROFILES) - 2, 2)
    for label in declared_labels(schedule.at(0).plan.tags):
        assert report.cells["skin_detail"][label].failed >= 1
    assert report.cells["trait_preservation"][OVERALL].failed == 0


def test_runner_error_blocks_even_with_passes(tmp_path: Path) -> None:
    plan, evidence, _ = study(tmp_path, decide={7: "error"})
    report = audit_evidence(plan, evidence, LENIENT)
    assert report.cells["skin_detail"][OVERALL].errored == 1
    assert ("skin_detail", OVERALL, BLOCKED) in report.failing_cells()


def test_required_intersections_are_counted(tmp_path: Path) -> None:
    plan, evidence, _ = study(tmp_path)
    report = audit_evidence(plan, evidence, LENIENT)
    cell = report.cells["edit_completion"]["fitzpatrick=VI&vitiligo=focal"]
    assert cell.scheduled >= 1 and cell.passed == cell.scheduled


def test_unscheduled_child_band_is_not_a_slice(tmp_path: Path) -> None:
    plan, evidence, _ = study(tmp_path)
    report = audit_evidence(plan, evidence, LENIENT)
    assert "age_band=0-9" not in report.cells["skin_detail"]


def test_lane_g_names_are_used_only_from_the_bridge(tmp_path: Path) -> None:
    bridge = SliceBridge({"fitzpatrick=VI": "G-tone-6", "fitzpatrick=V": "G-tone-5"})
    plan, evidence, schedule = study(tmp_path, bridge=bridge)
    report = audit_evidence(plan, evidence, LENIENT, bridge)
    deep = sum(1 for case in schedule.cases() if case.plan.tags["fitzpatrick"] == "VI")
    assert report.cells["skin_detail"]["lane_g:G-tone-6"].scheduled == deep
    assert report.to_dict()["group_alignment"] == "EXPLICIT_MAPPING"


@pytest.mark.parametrize("args", ((0, 0.9), (30, 0.0), (30, 1.5), (True, 0.9)))
def test_policy_validation(args: tuple[object, object]) -> None:
    with pytest.raises(SyntheticInputError):
        StatisticsPolicy(*args)  # type: ignore[arg-type]

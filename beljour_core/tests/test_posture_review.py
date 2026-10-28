"""Synthetic contour metrics never masquerade as participant or diagnostic PASS."""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.posture.levels import level_plan
from plumb_api.engines.posture.review import audit_plan, synthetic_group_rows, synthetic_summary
from plumb_api.engines.posture.synthetic import truth_cases


@pytest.mark.parametrize("fix", list(truth_cases()))
def test_full_strength_truth_metrics_are_bounded_and_unrated(fix: str) -> None:
    fig = truth_cases()[fix]
    p = level_plan(fig.controls, fix, 5)
    checked = audit_plan(p, 5)
    assert checked.checks_ok
    assert checked.reasons == ()
    assert checked.reduction >= 0.1
    assert checked.move_px <= checked.cap_px + 1e-6
    assert checked.release_status == "NOT_RUN"
    assert checked.evidence_class == "synthetic_or_unrated"
    row = checked.to_json()
    assert row["id"] in {f"J{i}" for i in range(10, 17)}
    assert "points" not in row and "photo" not in row


@pytest.mark.parametrize("fix", list(truth_cases()))
def test_neutral_level_is_an_exact_noop_even_when_deviation_exists(fix: str) -> None:
    fig = truth_cases()[fix]
    p = level_plan(fig.controls, fix, 1)
    evaluated = audit_plan(p, 1)
    assert evaluated.checks_ok
    assert evaluated.move_px == 0
    assert evaluated.release_status == "NOT_RUN"


def test_movement_outside_cap_is_rejected_even_if_strength_is_maximum() -> None:
    fig = truth_cases()["lean"]
    p = level_plan(fig.controls, "lean", 5)
    changed = replace(p, cap_px=0.001)
    evaluated = audit_plan(changed, 5)
    assert not evaluated.checks_ok
    assert "movement_over_cap" in evaluated.reasons


def test_raising_safety_cap_is_a_failed_metric_not_an_accepted_preset() -> None:
    fig = truth_cases()["uneven_shoulders"]
    p = level_plan(fig.controls, "uneven_shoulders", 5)
    changed = replace(p, cap_px=fig.controls.torso_height * 0.20)
    evaluated = audit_plan(changed, 5)
    assert not evaluated.checks_ok
    assert "cap_raised" in evaluated.reasons


def test_pins_cannot_be_silently_moved() -> None:
    fig = truth_cases()["lean"]
    p = level_plan(fig.controls, "lean", 5)
    pinned = p.pins[0]
    pos = p.after.points[pinned]
    tampered = p.after.moved({pinned: (pos[0] + 0.1, pos[1])})
    checked = audit_plan(replace(p, after=tampered), 5)
    assert not checked.checks_ok
    assert "pinned_landmark_moved" in checked.reasons


def test_overshoot_and_worse_deviation_are_both_detected() -> None:
    fig = truth_cases()["forward_head"]
    p = level_plan(fig.controls, "forward_head", 5)
    checked = audit_plan(replace(p, measure_after=-1.0), 5)
    assert not checked.checks_ok
    assert "overshot_neutral" in checked.reasons
    checked = audit_plan(replace(p, measure_after=p.measure_before * 1.1), 5)
    assert not checked.checks_ok
    assert "deviation_increased" in checked.reasons


def test_nonfinite_measure_refused_even_if_other_checks_look_good() -> None:
    fig = truth_cases()["slouch"]
    p = level_plan(fig.controls, "slouch", 5)
    checked = audit_plan(replace(p, measure_after=float("nan")), 5)
    assert not checked.checks_ok
    assert "non_finite" in checked.reasons


def test_summary_has_a_row_per_group_and_never_claims_real_body_pass() -> None:
    summary = synthetic_summary()
    rows = synthetic_group_rows()
    assert summary["format"] == "beljour-posture-synthetic-summary/1"
    assert summary["release_status"] == "NOT_RUN"
    assert summary["synthetic_only"] is True
    assert summary["case_count"] == len(rows) == 84
    assert summary["group_count"] == len(summary["group_names"]) == 24
    assert all(str(row["group"]).startswith("drawn/") for row in rows)
    assert {str(row["id"]) for row in rows} == {f"J{i}" for i in range(10, 17)}
    assert all(row["release_status"] == "NOT_RUN" for row in rows)
    assert all(isinstance(row["checks_ok"], bool) for row in rows)
    assert all(np.isfinite(float(row["original_deviation"])) for row in rows)

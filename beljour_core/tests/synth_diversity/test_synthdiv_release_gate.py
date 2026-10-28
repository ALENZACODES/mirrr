"""Per-check, per-slice fail-closed gate with caller-supplied thresholds.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_evidence import (
    CHECKS,
    CheckOutcome,
    verify_evidence,
    write_evidence,
)
from lab.synth_diversity.stress_gate import GatePolicy, evaluate_gate
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_statistics import (
    OVERALL,
    EvidenceReport,
    StatisticsPolicy,
    summarize,
)
from lab.synth_diversity.types import SyntheticInputError

LOW = dict.fromkeys(CHECKS, 0.2)


def report(tmp_path: Path, failing: int = 0, error_at: int | None = None,
           skip: int | None = None) -> EvidenceReport:
    schedule = StressSchedule(seed=8, count=len(ALL_PROFILES))
    write_stress_manifest(tmp_path / "plan", schedule)
    rows = []
    for case in schedule.cases():
        if case.ordinal == skip:
            continue
        verdict = "fail" if case.ordinal < failing else "pass"
        if case.ordinal == error_at:
            verdict = "error"
        rows.append(CheckOutcome(case.ordinal, case.identity,
                                 {**dict.fromkeys(CHECKS, "pass"), "occlusion_integrity": verdict}))
    write_evidence(tmp_path / "ev", tmp_path / "plan", rows, "r")
    evidence = verify_evidence(tmp_path / "plan", tmp_path / "ev")
    return summarize(evidence, StatisticsPolicy(1, 0.01))


def test_clean_run_passes_overall_only_gate(tmp_path: Path) -> None:
    result = evaluate_gate(report(tmp_path), GatePolicy(LOW, 10))
    assert result.status == "PASS"
    assert result.to_dict()["real_face_gate"] == "NOT_EVALUATED"


def test_bound_is_per_check(tmp_path: Path) -> None:
    data = report(tmp_path, failing=20)
    strict = {**LOW, "occlusion_integrity": 0.6}
    result = evaluate_gate(data, GatePolicy(strict, 10))
    assert result.failures == (("occlusion_integrity", OVERALL, "below_lower_bound"),)
    assert evaluate_gate(data, GatePolicy(LOW, 10)).status == "PASS"


def test_missing_case_fails_every_check_even_when_not_required(tmp_path: Path) -> None:
    result = evaluate_gate(report(tmp_path, skip=3), GatePolicy(LOW, 10))
    reasons = {(check, reason) for check, _, reason in result.failures}
    assert {(check, "missing_evidence") for check in CHECKS} <= reasons


def test_runner_error_fails(tmp_path: Path) -> None:
    result = evaluate_gate(report(tmp_path, error_at=0), GatePolicy(LOW, 10))
    assert ("occlusion_integrity", OVERALL, "runner_error") in result.failures


def test_required_slice_needs_samples_and_must_be_scheduled(tmp_path: Path) -> None:
    data = report(tmp_path)
    small = evaluate_gate(data, GatePolicy(LOW, 5, (OVERALL, "head_covering=kippah")))
    assert ("skin_detail", "head_covering=kippah", "insufficient_sample") in small.failures
    absent = evaluate_gate(data, GatePolicy(LOW, 1, (OVERALL, "age_band=0-9")))
    assert ("skin_detail", "age_band=0-9", "required_slice_not_scheduled") in absent.failures


def test_excluded_check_skips_bounds_but_not_missing_evidence(tmp_path: Path) -> None:
    bounds = {check: 0.99 for check in CHECKS if check != "occlusion_integrity"}
    policy = GatePolicy(bounds, 1, excluded_checks=("occlusion_integrity",))
    data = report(tmp_path, failing=len(ALL_PROFILES))
    result = evaluate_gate(data, policy)
    assert all(check != "occlusion_integrity" for check, _, _ in result.failures)
    gap = evaluate_gate(report(tmp_path / "gap", skip=0), policy)
    assert ("occlusion_integrity", OVERALL, "missing_evidence") in gap.failures


def test_policy_digest_changes_with_thresholds() -> None:
    assert GatePolicy(LOW, 10).digest != GatePolicy({**LOW, "skin_detail": 0.3}, 10).digest


@pytest.mark.parametrize("kwargs", (
    {"minimum_wilson_lower": {"skin_detail": 0.5}, "minimum_observations": 1},
    {"minimum_wilson_lower": {**LOW, "skin_detail": 0.0}, "minimum_observations": 1},
    {"minimum_wilson_lower": LOW, "minimum_observations": 0},
    {"minimum_wilson_lower": LOW, "minimum_observations": 1, "required_slices": ()},
    {"minimum_wilson_lower": LOW, "minimum_observations": 1, "excluded_checks": CHECKS},
))
def test_policy_validation(kwargs: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        GatePolicy(**kwargs)  # type: ignore[arg-type]

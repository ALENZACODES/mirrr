"""Paired baseline/candidate regression counts and exact McNemar p-values.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_compare import ComparePolicy, compare_runs, mcnemar_exact
from lab.synth_diversity.stress_evidence import (
    CHECKS,
    CheckOutcome,
    EvidenceSet,
    verify_evidence,
    write_evidence,
)
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_statistics import OVERALL
from lab.synth_diversity.types import SyntheticInputError

PLAN = StressSchedule(seed=77, count=len(ALL_PROFILES))


def run(root: Path, name: str, fails: set[int],
        drop: frozenset[int] = frozenset()) -> EvidenceSet:
    if not (root / "plan").exists():
        write_stress_manifest(root / "plan", PLAN)
    rows = [CheckOutcome(c.ordinal, c.identity, {**dict.fromkeys(CHECKS, "pass"),
                                                 "edit_completion": "fail" if c.ordinal in fails
                                                 else "pass"})
            for c in PLAN.cases() if c.ordinal not in drop]
    write_evidence(root / name, root / "plan", rows, name)
    return verify_evidence(root / "plan", root / name)


def test_mcnemar_reference_values() -> None:
    assert mcnemar_exact(0, 0) == 1.0
    assert mcnemar_exact(5, 0) == pytest.approx(0.0625)
    assert mcnemar_exact(1, 1) == 1.0
    assert mcnemar_exact(10, 2) == pytest.approx(2 * (1 + 12 + 66) / 4096)


def test_identical_runs_have_no_regression(tmp_path: Path) -> None:
    base = run(tmp_path, "base", {1, 2})
    same = run(tmp_path, "same", {1, 2})
    result = compare_runs(base, same, ComparePolicy())
    assert result.status == "NO_REGRESSION_BEYOND_POLICY"
    assert result.cells["edit_completion"][OVERALL].both_fail == 2


def test_pass_to_fail_is_a_regression_and_fail_to_pass_a_fix(tmp_path: Path) -> None:
    base = run(tmp_path, "base", {1})
    cand = run(tmp_path, "cand", {2, 3})
    result = compare_runs(base, cand, ComparePolicy())
    overall = result.cells["edit_completion"][OVERALL]
    assert (overall.regressions, overall.fixes) == (2, 1)
    assert result.status == "REGRESSION"
    assert ("edit_completion", OVERALL, 2) in result.regressed_cells()


def test_regressions_within_policy_are_tolerated(tmp_path: Path) -> None:
    base = run(tmp_path, "base", set())
    cand = run(tmp_path, "cand", {0})
    assert compare_runs(base, cand, ComparePolicy(1)).status == "NO_REGRESSION_BEYOND_POLICY"


def test_regressions_are_attributed_to_declared_slices(tmp_path: Path) -> None:
    base = run(tmp_path, "base", set())
    cand = run(tmp_path, "cand", {5})
    result = compare_runs(base, cand, ComparePolicy())
    tone = f"fitzpatrick={PLAN.at(5).plan.tags['fitzpatrick']}"
    assert result.cells["edit_completion"][tone].regressions == 1


def test_unpaired_cases_mark_incomplete_pairing(tmp_path: Path) -> None:
    base = run(tmp_path, "base", set())
    cand = run(tmp_path, "cand", set(), drop=frozenset({0, 1}))
    result = compare_runs(base, cand, ComparePolicy())
    assert result.paired_cases == len(ALL_PROFILES) - 2
    assert result.status == "INCOMPLETE_PAIRING"
    assert compare_runs(base, cand, ComparePolicy(0, 0.9)).status != "INCOMPLETE_PAIRING"


def test_runs_on_different_plans_cannot_be_compared(tmp_path: Path) -> None:
    base = run(tmp_path / "one", "base", set())
    other = StressSchedule(seed=78, count=len(ALL_PROFILES))
    write_stress_manifest(tmp_path / "two-plan", other)
    rows = [CheckOutcome(0, other.at(0).identity, dict.fromkeys(CHECKS, "pass"))]
    write_evidence(tmp_path / "two", tmp_path / "two-plan", rows, "x")
    with pytest.raises(SyntheticInputError, match="different plans"):
        compare_runs(base, verify_evidence(tmp_path / "two-plan", tmp_path / "two"),
                     ComparePolicy())


@pytest.mark.parametrize("args", ((-1, 1.0), (0, 0.0), (0, 1.2), (True, 1.0)))
def test_policy_validation(args: tuple[object, object]) -> None:
    with pytest.raises(SyntheticInputError):
        ComparePolicy(*args)  # type: ignore[arg-type]

"""Deterministic, aggregate-only fix notes with explicit owner routing.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_evidence import CHECKS, CheckOutcome, write_evidence
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_statistics import (
    OVERALL,
    EvidenceReport,
    StatisticsPolicy,
    audit_evidence,
    wilson_interval,
)
from lab.synth_diversity.stress_triage import (
    KINDS,
    UNASSIGNED,
    additional_passes_needed,
    triage,
)
from lab.synth_diversity.types import SyntheticInputError


def report_for(tmp_path: Path, policy: StatisticsPolicy, missing: int = 0,
               errors: int = 0, failures: int = 0) -> EvidenceReport:
    schedule = StressSchedule(seed=12, count=len(ALL_PROFILES))
    write_stress_manifest(tmp_path / "plan", schedule)
    rows = []
    for case in schedule.cases(missing):
        decision = "error" if case.ordinal < missing + errors else (
            "fail" if case.ordinal < missing + errors + failures else "pass")
        rows.append(CheckOutcome(case.ordinal, case.identity,
                                 {**dict.fromkeys(CHECKS, "pass"), "region_boundary": decision}))
    write_evidence(tmp_path / "ev", tmp_path / "plan", rows, "r1")
    return audit_evidence(tmp_path / "plan", tmp_path / "ev", policy)


def test_priority_order_is_missing_then_error_then_failure_then_sample(tmp_path: Path) -> None:
    report = report_for(tmp_path, StatisticsPolicy(1, 0.5), missing=2, errors=1, failures=3)
    notes = triage(report, max_notes=500)
    kinds = [KINDS.index(note.kind) for note in notes]
    assert kinds == sorted(kinds)
    assert notes[0].kind == "missing_evidence"
    assert {note.kind for note in notes} >= {"missing_evidence", "execution_error",
                                             "observed_failure"}


def test_overall_counts_are_exact(tmp_path: Path) -> None:
    report = report_for(tmp_path, StatisticsPolicy(1, 0.5), missing=2, errors=1, failures=3)
    notes = {(note.kind, note.check, note.slice_name): note.count
             for note in triage(report, max_notes=500)}
    assert notes[("missing_evidence", "edit_completion", OVERALL)] == 2
    assert notes[("execution_error", "region_boundary", OVERALL)] == 1
    assert notes[("observed_failure", "region_boundary", OVERALL)] == 3
    assert ("observed_failure", "skin_detail", OVERALL) not in notes


def test_larger_counts_come_first_within_a_kind(tmp_path: Path) -> None:
    report = report_for(tmp_path, StatisticsPolicy(1, 0.5), failures=5)
    failures = [note for note in triage(report, max_notes=500)
                if note.kind == "observed_failure"]
    assert [note.count for note in failures] == sorted((n.count for n in failures), reverse=True)
    assert failures[0].count == 5
    assert OVERALL in {note.slice_name for note in failures if note.count == 5}
    tied = [note.slice_name for note in failures if note.count == 5]
    assert tied == sorted(tied)


def test_owner_routing_is_explicit_only(tmp_path: Path) -> None:
    report = report_for(tmp_path, StatisticsPolicy(1, 0.5), failures=2)
    unrouted = triage(report)
    assert {note.owner for note in unrouted} == {UNASSIGNED}
    routed = triage(report, {"region_boundary": "lane-b"})
    assert {note.owner for note in routed if note.check == "region_boundary"} == {"lane-b"}
    with pytest.raises(SyntheticInputError):
        triage(report, {"made_up_check": "lane-x"})


def test_notes_are_bounded_and_carry_no_case_ids(tmp_path: Path) -> None:
    report = report_for(tmp_path, StatisticsPolicy(1, 0.5), missing=5)
    notes = triage(report, max_notes=7)
    assert len(notes) == 7
    assert all("S21-" not in str(note.to_dict()) for note in notes)
    with pytest.raises(SyntheticInputError):
        triage(report, max_notes=0)


def test_sample_shortfall_uses_wilson_rule(tmp_path: Path) -> None:
    report = report_for(tmp_path, StatisticsPolicy())
    notes = triage(report, max_notes=500)
    overall = next(note for note in notes if note.slice_name == OVERALL)
    assert overall.kind == "insufficient_sample"
    needed = len(ALL_PROFILES) + overall.count
    reached = wilson_interval(needed, needed)
    short = wilson_interval(needed - 1, needed - 1)
    assert reached is not None and reached[0] >= 0.95
    assert short is not None and short[0] < 0.95


def test_shortfall_closed_form_edges() -> None:
    assert additional_passes_needed(0, StatisticsPolicy(30, 0.95)) == 73
    assert additional_passes_needed(100, StatisticsPolicy(30, 0.95)) == 0
    assert additional_passes_needed(0, StatisticsPolicy(30, 0.5)) == 30
    assert additional_passes_needed(10, StatisticsPolicy(30, 1.0)) == 1_000_000


def test_clean_lenient_report_has_no_notes(tmp_path: Path) -> None:
    report = report_for(tmp_path, StatisticsPolicy(1, 0.01))
    assert triage(report) == ()

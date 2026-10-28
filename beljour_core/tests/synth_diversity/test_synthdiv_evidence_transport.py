"""Runner decision transport: replay against the plan, no invented passes, tamper refusal.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_evidence import (
    CHECKS,
    EVIDENCE_ROWS,
    EVIDENCE_SPEC,
    NON_ATTESTATION,
    CheckOutcome,
    outcome_from_row,
    verify_evidence,
    write_evidence,
)
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_slices import SliceBridge
from lab.synth_diversity.types import SyntheticInputError

COUNT = len(ALL_PROFILES)


def make_plan(root: Path, seed: int = 25) -> tuple[Path, StressSchedule]:
    schedule = StressSchedule(seed=seed, count=COUNT)
    write_stress_manifest(root / f"plan-{seed}", schedule)
    return root / f"plan-{seed}", schedule


def outcome(schedule: StressSchedule, ordinal: int, decision: str = "pass") -> CheckOutcome:
    return CheckOutcome(ordinal, schedule.at(ordinal).identity, dict.fromkeys(CHECKS, decision))


def test_round_trip_keeps_exact_decisions(tmp_path: Path) -> None:
    plan, schedule = make_plan(tmp_path)
    rows = [outcome(schedule, index, ("pass", "fail", "error")[index % 3]) for index in range(6)]
    write_evidence(tmp_path / "ev", plan, rows, "box_runner")
    loaded = verify_evidence(plan, tmp_path / "ev")
    assert [loaded.outcomes[index] for index in range(6)] == rows
    assert loaded.header["attestation"] == NON_ATTESTATION
    assert loaded.header["train_allowed"] is False


def test_absent_cases_stay_absent(tmp_path: Path) -> None:
    plan, schedule = make_plan(tmp_path)
    write_evidence(tmp_path / "ev", plan, [outcome(schedule, 3)], "r1")
    loaded = verify_evidence(plan, tmp_path / "ev")
    assert set(loaded.outcomes) == {3}


@pytest.mark.parametrize("order", ([2, 1], [1, 1]))
def test_unsorted_or_duplicate_ordinals_are_refused(tmp_path: Path, order: list[int]) -> None:
    plan, schedule = make_plan(tmp_path)
    with pytest.raises(SyntheticInputError, match="increasing"):
        write_evidence(tmp_path / "ev", plan, [outcome(schedule, i) for i in order], "r1")
    assert not (tmp_path / "ev").exists()


def test_case_from_another_seed_is_refused(tmp_path: Path) -> None:
    plan, _ = make_plan(tmp_path)
    foreign = StressSchedule(seed=26, count=COUNT)
    with pytest.raises(SyntheticInputError, match="seeded plan"):
        write_evidence(tmp_path / "ev", plan, [outcome(foreign, 0)], "r1")


def test_unplanned_ordinal_is_refused(tmp_path: Path) -> None:
    plan, schedule = make_plan(tmp_path)
    bigger = StressSchedule(seed=25, count=COUNT + 1)
    with pytest.raises(SyntheticInputError, match="unplanned"):
        write_evidence(tmp_path / "ev", plan, [outcome(bigger, COUNT)], "r1")


@pytest.mark.parametrize("checks", (
    {"trait_preservation": "pass"},
    {**dict.fromkeys(CHECKS, "pass"), "extra": "pass"},
    {**dict.fromkeys(CHECKS, "pass"), "skin_detail": "maybe"},
    {**dict.fromkeys(CHECKS, "pass"), "skin_detail": True},
))
def test_incomplete_or_invalid_decisions_are_refused(checks: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        CheckOutcome(0, "S21-" + "a" * 32, checks)  # type: ignore[arg-type]


@pytest.mark.parametrize("runner", ("", "Box", "has space", "../x", "a" * 65))
def test_runner_id_must_be_a_safe_token(tmp_path: Path, runner: str) -> None:
    plan, schedule = make_plan(tmp_path)
    with pytest.raises(SyntheticInputError):
        write_evidence(tmp_path / "ev", plan, [outcome(schedule, 0)], runner)


def test_no_overwrite_and_no_repository_output(tmp_path: Path) -> None:
    plan, schedule = make_plan(tmp_path)
    write_evidence(tmp_path / "ev", plan, [outcome(schedule, 0)], "r1")
    with pytest.raises(SyntheticInputError):
        write_evidence(tmp_path / "ev", plan, [outcome(schedule, 0)], "r1")
    inside = Path(__file__).resolve().parent / "should-not-exist"
    with pytest.raises(SyntheticInputError, match="repo"):
        write_evidence(inside, plan, [outcome(schedule, 0)], "r1")
    assert not inside.exists()


def test_edited_row_fails_digest(tmp_path: Path) -> None:
    plan, schedule = make_plan(tmp_path)
    write_evidence(tmp_path / "ev", plan, [outcome(schedule, 0, "fail")], "r1")
    rows = tmp_path / "ev" / EVIDENCE_ROWS
    rows.write_bytes(rows.read_bytes().replace(b'"fail"', b'"pass"'))
    with pytest.raises(SyntheticInputError, match="digest"):
        verify_evidence(plan, tmp_path / "ev")


def test_extra_file_or_symlinked_rows_are_refused(tmp_path: Path) -> None:
    plan, schedule = make_plan(tmp_path)
    write_evidence(tmp_path / "ev", plan, [outcome(schedule, 0)], "r1")
    (tmp_path / "ev" / "notes.txt").write_text("x")
    with pytest.raises(SyntheticInputError, match="unexpected"):
        verify_evidence(plan, tmp_path / "ev")
    (tmp_path / "ev" / "notes.txt").unlink()
    rows = tmp_path / "ev" / EVIDENCE_ROWS
    rows.rename(tmp_path / "moved.jsonl")
    rows.symlink_to(tmp_path / "moved.jsonl")
    with pytest.raises(SyntheticInputError):
        verify_evidence(plan, tmp_path / "ev")


def test_evidence_is_bound_to_its_plan(tmp_path: Path) -> None:
    plan, schedule = make_plan(tmp_path)
    other, _ = make_plan(tmp_path, seed=31)
    write_evidence(tmp_path / "ev", plan, [outcome(schedule, 0)], "r1")
    with pytest.raises(SyntheticInputError):
        verify_evidence(other, tmp_path / "ev")


def test_mapping_must_match_between_plan_and_evidence(tmp_path: Path) -> None:
    bridge = SliceBridge({"fitzpatrick=VI": "G-deep-vi"})
    schedule = StressSchedule(seed=25, count=COUNT)
    write_stress_manifest(tmp_path / "mapped", schedule, bridge)
    write_evidence(tmp_path / "ev", tmp_path / "mapped", [outcome(schedule, 0)], "r1", bridge)
    assert verify_evidence(tmp_path / "mapped", tmp_path / "ev", bridge).outcomes
    with pytest.raises(SyntheticInputError):
        verify_evidence(tmp_path / "mapped", tmp_path / "ev")


def test_header_cannot_be_relabelled_as_trainable(tmp_path: Path) -> None:
    plan, schedule = make_plan(tmp_path)
    write_evidence(tmp_path / "ev", plan, [outcome(schedule, 0)], "r1")
    spec = tmp_path / "ev" / EVIDENCE_SPEC
    header = json.loads(spec.read_text())
    header["train_allowed"] = True
    spec.write_text(json.dumps(header, sort_keys=True, separators=(",", ":")) + "\n")
    with pytest.raises(SyntheticInputError):
        verify_evidence(plan, tmp_path / "ev")


def test_row_parser_refuses_foreign_fields() -> None:
    row = CheckOutcome(0, "S21-" + "b" * 32, dict.fromkeys(CHECKS, "pass")).to_row()
    assert outcome_from_row(dict(row)).ordinal == 0
    with pytest.raises(SyntheticInputError):
        outcome_from_row({**row, "image": "x"})
    with pytest.raises(SyntheticInputError):
        outcome_from_row({**row, "attestation": "VERIFIED"})

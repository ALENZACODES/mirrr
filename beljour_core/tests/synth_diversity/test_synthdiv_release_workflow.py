"""End-to-end metadata workflow: plan, partition, sharded evidence, merge, gate.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from lab.synth_diversity.stress_compare import ComparePolicy, compare_runs
from lab.synth_diversity.stress_evidence import (
    CHECKS,
    CheckOutcome,
    verify_evidence,
    write_evidence,
)
from lab.synth_diversity.stress_gate import GatePolicy, evaluate_gate
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_merge import merge_evidence
from lab.synth_diversity.stress_partition import (
    CompletionClaim,
    claim_progress,
    partition_schedule,
)
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_statistics import OVERALL, StatisticsPolicy, summarize
from lab.synth_diversity.stress_triage import triage


def decide(ordinal: int, check: str, broken: bool) -> str:
    """A deterministic stand-in runner: one check fails on every seventh case."""
    if broken and check == "region_boundary" and ordinal % 7 == 0:
        return "fail"
    return "pass"


def run_sharded(root: Path, name: str, schedule: StressSchedule, broken: bool) -> Path:
    chunks = partition_schedule(schedule, 30)
    shards = []
    claims = []
    for chunk in chunks:
        rows = [CheckOutcome(case.ordinal, case.identity,
                             {check: decide(case.ordinal, check, broken) for check in CHECKS})
                for case in schedule.cases(chunk.start, chunk.stop)]
        folder = root / f"{name}-shard-{chunk.index}"
        write_evidence(folder, root / "plan", rows, f"worker-{chunk.index}")
        shards.append(folder)
        claims.append(CompletionClaim(chunk.index, chunk.cases_sha256, f"worker-{chunk.index}"))
    assert claim_progress(chunks, claims)["work_status"] == "ALL_CHUNKS_CLAIMED"
    merge_evidence(root / "plan", shards, root / name, name, require_complete=True)
    return root / name


def test_full_metadata_workflow_flags_a_seeded_regression(tmp_path: Path) -> None:
    schedule = StressSchedule(seed=2026, count=100)
    write_stress_manifest(tmp_path / "plan", schedule)
    good = verify_evidence(tmp_path / "plan", run_sharded(tmp_path, "good", schedule, False))
    bad = verify_evidence(tmp_path / "plan", run_sharded(tmp_path, "bad", schedule, True))
    policy = GatePolicy(dict.fromkeys(CHECKS, 0.9), 50)
    floor = StatisticsPolicy(50, 0.9)
    assert evaluate_gate(summarize(good, floor), policy).status == "PASS"
    failed = evaluate_gate(summarize(bad, floor), policy)
    assert failed.failures == (("region_boundary", OVERALL, "below_lower_bound"),)
    comparison = compare_runs(good, bad, ComparePolicy())
    assert comparison.cells["region_boundary"][OVERALL].regressions == 15
    assert comparison.status == "REGRESSION"
    notes = triage(summarize(bad, floor), max_notes=500)
    first = next(note for note in notes if note.kind == "observed_failure")
    assert (first.check, first.count) == ("region_boundary", 15)
    assert all("S21-" not in str(note.to_dict()) for note in notes)

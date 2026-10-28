"""Verified evidence shard merging: overlap, duplication and completeness checks.
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
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_merge import merge_evidence
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.types import SyntheticInputError

SCHEDULE = StressSchedule(seed=41, count=len(ALL_PROFILES))


def shard(root: Path, name: str, ordinals: range, decision: str = "pass") -> Path:
    rows = [CheckOutcome(i, SCHEDULE.at(i).identity, dict.fromkeys(CHECKS, decision))
            for i in ordinals]
    write_evidence(root / name, root / "plan", rows, f"runner-{name}")
    return root / name


@pytest.fixture()
def plan(tmp_path: Path) -> Path:
    write_stress_manifest(tmp_path / "plan", SCHEDULE)
    return tmp_path / "plan"


def test_disjoint_shards_merge_into_complete_evidence(tmp_path: Path, plan: Path) -> None:
    half = len(ALL_PROFILES) // 2
    first = shard(tmp_path, "a", range(half))
    second = shard(tmp_path, "b", range(half, len(ALL_PROFILES)), "fail")
    receipt = merge_evidence(plan, [second, first], tmp_path / "merged", "merger",
                             require_complete=True)
    assert receipt.complete and receipt.to_dict()["coverage"] == "COMPLETE"
    merged = verify_evidence(plan, tmp_path / "merged")
    assert merged.outcomes[0].checks["skin_detail"] == "pass"
    assert merged.outcomes[half].checks["skin_detail"] == "fail"
    assert receipt.shard_runners == ("runner-b", "runner-a")


def test_overlapping_shards_are_refused(tmp_path: Path, plan: Path) -> None:
    first = shard(tmp_path, "a", range(0, 10))
    second = shard(tmp_path, "b", range(9, 20))
    with pytest.raises(SyntheticInputError, match="overlap at ordinal 9"):
        merge_evidence(plan, [first, second], tmp_path / "merged", "merger")
    assert not (tmp_path / "merged").exists()


def test_same_shard_twice_is_refused(tmp_path: Path, plan: Path) -> None:
    first = shard(tmp_path, "a", range(0, 5))
    with pytest.raises(SyntheticInputError, match="twice"):
        merge_evidence(plan, [first, first], tmp_path / "merged", "merger")


def test_partial_merge_is_marked_and_can_be_required_complete(tmp_path: Path,
                                                              plan: Path) -> None:
    first = shard(tmp_path, "a", range(0, 5))
    receipt = merge_evidence(plan, [first], tmp_path / "partial", "merger")
    assert receipt.to_dict()["coverage"] == "PARTIAL"
    with pytest.raises(SyntheticInputError, match="covers 5 of"):
        merge_evidence(plan, [first], tmp_path / "strict", "merger", require_complete=True)


def test_shard_from_another_plan_is_refused(tmp_path: Path, plan: Path) -> None:
    other = StressSchedule(seed=42, count=len(ALL_PROFILES))
    write_stress_manifest(tmp_path / "other-plan", other)
    rows = [CheckOutcome(0, other.at(0).identity, dict.fromkeys(CHECKS, "pass"))]
    write_evidence(tmp_path / "foreign", tmp_path / "other-plan", rows, "r")
    with pytest.raises(SyntheticInputError):
        merge_evidence(plan, [tmp_path / "foreign"], tmp_path / "merged", "merger")


def test_receipt_binds_shard_digests(tmp_path: Path, plan: Path) -> None:
    first = shard(tmp_path, "a", range(0, 3))
    receipt = merge_evidence(plan, [first], tmp_path / "merged", "merger")
    assert receipt.shard_sha256 == (verify_evidence(plan, first).header["sha256"],)
    assert receipt.to_dict()["attestation"] == "MERGED_RUNNER_DECISIONS_NOT_ATTESTED"


def test_empty_shard_list_is_refused(tmp_path: Path, plan: Path) -> None:
    with pytest.raises(SyntheticInputError):
        merge_evidence(plan, [], tmp_path / "merged", "merger")

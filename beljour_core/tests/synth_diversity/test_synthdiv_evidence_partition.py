"""Contiguous seeded partitions, replayable digests and completion-claim checks.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from dataclasses import replace

import pytest

from lab.synth_diversity.stress_partition import (
    CompletionClaim,
    PartitionChunk,
    claim_progress,
    partition_schedule,
    validate_chunks,
)
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.types import SyntheticInputError


def schedule(count: int = 100, seed: int = 25) -> StressSchedule:
    return StressSchedule(seed=seed, count=max(count, len(ALL_PROFILES)))


@pytest.mark.parametrize("size", (1, 7, 33, 100, 250))
def test_chunks_cover_every_ordinal_once(size: int) -> None:
    chunks = partition_schedule(schedule(), size)
    covered = [ordinal for chunk in chunks for ordinal in range(chunk.start, chunk.stop)]
    assert covered == list(range(100))
    assert all(chunk.size <= size for chunk in chunks)
    validate_chunks(schedule(), chunks)


def test_digest_is_sha256_of_ordered_case_ids() -> None:
    chunk = partition_schedule(schedule(), 10)[2]
    ids = [case.identity for case in schedule().cases(20, 30)]
    assert chunk.cases_sha256 == hashlib.sha256(
        "".join(f"{value}\n" for value in ids).encode()).hexdigest()
    assert (chunk.first_case_id, chunk.last_case_id) == (ids[0], ids[-1])


def test_seed_changes_digests_but_not_bounds() -> None:
    first = partition_schedule(schedule(seed=1), 25)
    second = partition_schedule(schedule(seed=2), 25)
    assert [(c.start, c.stop) for c in first] == [(c.start, c.stop) for c in second]
    assert all(a.cases_sha256 != b.cases_sha256 for a, b in zip(first, second, strict=True))


def test_gap_overlap_and_altered_chunks_are_detected() -> None:
    chunks = partition_schedule(schedule(), 20)
    with pytest.raises(SyntheticInputError, match="gap"):
        validate_chunks(schedule(), (chunks[0], replace(chunks[2], index=1)))
    shifted = replace(chunks[1], start=15)
    with pytest.raises(SyntheticInputError, match="overlap"):
        validate_chunks(schedule(), (chunks[0], shifted, *chunks[2:]))
    forged = replace(chunks[3], cases_sha256="0" * 64)
    with pytest.raises(SyntheticInputError, match="replay"):
        validate_chunks(schedule(), (*chunks[:3], forged, chunks[4]))
    with pytest.raises(SyntheticInputError, match="end"):
        validate_chunks(schedule(), chunks[:-1])


def test_claims_report_progress_without_quality_claim() -> None:
    chunks = partition_schedule(schedule(), 30)
    claims = [CompletionClaim(0, chunks[0].cases_sha256, "worker-a"),
              CompletionClaim(2, chunks[2].cases_sha256, "worker-b")]
    progress = claim_progress(chunks, claims)
    assert progress["claimed_cases"] == 60
    assert progress["pending_chunks"] == [1, 3]
    assert progress["work_status"] == "INCOMPLETE"
    assert progress["evidence_status"] == "PLANNED_WORK_ONLY_NOT_QUALITY_EVIDENCE"
    all_claims = [CompletionClaim(c.index, c.cases_sha256, "w") for c in chunks]
    assert claim_progress(chunks, all_claims)["work_status"] == "ALL_CHUNKS_CLAIMED"


def test_stale_foreign_and_double_claims_are_refused() -> None:
    chunks = partition_schedule(schedule(), 30)
    other = partition_schedule(schedule(seed=99), 30)
    with pytest.raises(SyntheticInputError, match="digest"):
        claim_progress(chunks, [CompletionClaim(0, other[0].cases_sha256, "w")])
    with pytest.raises(SyntheticInputError, match="unknown"):
        claim_progress(chunks, [CompletionClaim(9, chunks[0].cases_sha256, "w")])
    twice = CompletionClaim(1, chunks[1].cases_sha256, "w")
    with pytest.raises(SyntheticInputError, match="twice"):
        claim_progress(chunks, [twice, twice])


@pytest.mark.parametrize("size", (0, -3, 10_001, 2.5, True))
def test_chunk_size_bounds(size: object) -> None:
    with pytest.raises(SyntheticInputError):
        partition_schedule(schedule(), size)  # type: ignore[arg-type]


def test_chunk_dict_is_planning_metadata() -> None:
    row = partition_schedule(schedule(), 50)[0].to_dict()
    assert row["status"] == "PLANNED_WORK_ONLY"
    assert isinstance(partition_schedule(schedule(), 50)[0], PartitionChunk)


@pytest.mark.parametrize("bad", ((-1, "0" * 64, "w"), (0, "XYZ", "w"), (0, "0" * 64, "W W")))
def test_claim_fields_are_validated(bad: tuple[object, object, object]) -> None:
    with pytest.raises(SyntheticInputError):
        CompletionClaim(*bad)  # type: ignore[arg-type]

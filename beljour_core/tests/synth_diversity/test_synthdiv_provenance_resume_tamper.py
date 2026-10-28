"""Stale, foreign, reordered, duplicated and partial receipts are refused.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_provenance_resume import (
    JobReceipt,
    check_receipts,
    receipt_from_dict,
)
from lab.synth_diversity.stress_provenance_resume_fixtures import fixture_receipts, fixture_spec
from lab.synth_diversity.types import SyntheticInputError

SPEC = fixture_spec()


def receipts() -> list[JobReceipt]:
    return list(fixture_receipts(SPEC))


def test_stale_receipt_from_another_plan() -> None:
    other = fixture_spec(seed=8)
    with pytest.raises(SyntheticInputError, match="stale"):
        check_receipts(SPEC, list(fixture_receipts(other, 1)))


def test_foreign_job_id() -> None:
    forged = replace(receipts()[0], job_id="job-" + "a" * 24)
    with pytest.raises(SyntheticInputError, match="foreign"):
        check_receipts(SPEC, [forged])


def test_reordered_receipts() -> None:
    rows = receipts()
    with pytest.raises(SyntheticInputError, match="reordered"):
        check_receipts(SPEC, [rows[1], rows[0]])


def test_skipped_job() -> None:
    rows = receipts()
    with pytest.raises(SyntheticInputError, match="skipped"):
        check_receipts(SPEC, [rows[0], rows[2]])


def test_duplicated_receipt() -> None:
    rows = receipts()
    with pytest.raises(SyntheticInputError, match="duplicated"):
        check_receipts(SPEC, [rows[0], rows[1], rows[1]])


def test_extra_receipt_after_finish() -> None:
    rows = receipts()
    with pytest.raises(SyntheticInputError, match="duplicated"):
        check_receipts(SPEC, [*rows, rows[-1]])


def test_partial_receipt() -> None:
    first = replace(receipts()[0], record_count=99_999)
    with pytest.raises(SyntheticInputError, match="partial"):
        check_receipts(SPEC, [first])


def test_bounds_relabelled_to_another_pool() -> None:
    first = replace(receipts()[0], pool="sfhq")
    with pytest.raises(SyntheticInputError, match="bounds"):
        check_receipts(SPEC, [first])


@pytest.mark.parametrize("change", (
    {"plan_sha256": "xyz"}, {"records_sha256": "A" * 64}, {"job_id": "job-1"},
    {"pool": "public"}, {"start": -1}, {"record_count": 1.5},
))
def test_receipt_field_validation(change: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        replace(receipts()[0], **change)  # type: ignore[arg-type]


def test_dict_round_trip_and_extra_fields() -> None:
    row = receipts()[0].to_dict()
    assert receipt_from_dict(dict(row)) == receipts()[0]
    with pytest.raises(SyntheticInputError):
        receipt_from_dict({**row, "approved": True})

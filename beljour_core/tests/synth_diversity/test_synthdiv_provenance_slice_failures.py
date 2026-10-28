"""Missing, extra, child-age or foreign entries make the slice audit fail closed.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.synth_diversity.stress_provenance_fixtures import fixture_records
from lab.synth_diversity.stress_provenance_resume_fixtures import tags_for
from lab.synth_diversity.stress_provenance_slices import ABSENT, slice_audit
from lab.synth_diversity.types import SyntheticInputError

RECORDS = fixture_records()


def test_record_without_tags_is_refused() -> None:
    tags = tags_for(RECORDS)
    del tags["sfhq-0002"]
    with pytest.raises(SyntheticInputError, match="missing for sfhq-0002"):
        slice_audit(RECORDS, tags, ())


def test_tags_for_unknown_records_are_refused() -> None:
    tags = {**tags_for(RECORDS), "own-9999": tags_for(RECORDS)["own-0001"]}
    with pytest.raises(SyntheticInputError, match="outside the inventory"):
        slice_audit(RECORDS, tags, ())


def test_duplicate_records_are_refused() -> None:
    with pytest.raises(SyntheticInputError, match="duplicate"):
        slice_audit((*RECORDS, RECORDS[0]), tags_for(RECORDS), ())


def test_eligible_ids_must_be_in_inventory() -> None:
    with pytest.raises(SyntheticInputError, match="eligible"):
        slice_audit(RECORDS, tags_for(RECORDS), {"own-9999"})


def test_child_age_tags_are_refused() -> None:
    tags = tags_for(RECORDS)
    tags["own-0001"] = {**tags["own-0001"], "age_band": "0-9"}
    with pytest.raises(SyntheticInputError, match="adult"):
        slice_audit(RECORDS, tags, ())


def test_invalid_tags_are_refused() -> None:
    tags = tags_for(RECORDS)
    tags["own-0001"] = {**tags["own-0001"], "fitzpatrick": "VII"}
    with pytest.raises(SyntheticInputError):
        slice_audit(RECORDS, tags, ())


def test_small_inventory_reports_absent_slices() -> None:
    audit = slice_audit(RECORDS, tags_for(RECORDS), ())
    assert ABSENT in {audit.status(name) for name in audit.raw}
    assert len(audit.blocked()) == len(audit.raw)


def test_minimum_must_be_positive() -> None:
    with pytest.raises(SyntheticInputError):
        slice_audit(RECORDS, tags_for(RECORDS), (), minimum_eligible=0)

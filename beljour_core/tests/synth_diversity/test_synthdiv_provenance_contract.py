"""Provenance record schema: pools, classes, tokens, digests and exact rows.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_provenance import (
    POOL_CLASSES,
    RECORD_FIELDS,
    ProvenanceRecord,
    inventory_digest,
    record_from_row,
    sha256_bytes,
)
from lab.synth_diversity.stress_provenance_fixtures import FIXTURE_COUNTS, fixture_records
from lab.synth_diversity.types import SyntheticInputError


def sample() -> ProvenanceRecord:
    return fixture_records()[0]


def test_four_pools_map_to_four_source_classes() -> None:
    assert POOL_CLASSES == {"own_render": "original_3d", "sfhq": "sfhq",
                            "research_test": "research", "quarantine": "unverified"}


def test_fixture_counts_are_the_documented_seven() -> None:
    counts: dict[str, int] = dict.fromkeys(FIXTURE_COUNTS, 0)
    for record in fixture_records():
        counts[record.source_class] += 1
    assert counts == FIXTURE_COUNTS == {"original_3d": 3, "sfhq": 2, "research": 2,
                                        "unverified": 0}


def test_row_round_trip_is_exact() -> None:
    for record in fixture_records():
        assert record_from_row(record.to_row()) == record
    assert set(sample().to_row()) == RECORD_FIELDS


def test_rows_have_no_training_switch_or_image_fields() -> None:
    row = sample().to_row()
    assert not {"train_allowed", "trainable", "path", "pixels", "embedding", "sketch"} & set(row)
    with pytest.raises(SyntheticInputError, match="inventory"):
        record_from_row({**row, "train_allowed": True})


@pytest.mark.parametrize("change", (
    {"pool": "public_web"},
    {"source_class": "sfhq"},
    {"record_id": "Own-1"},
    {"record_id": "own/../1"},
    {"generator": ""},
    {"licence_sha256": "abc"},
    {"content_sha256": "F" * 64},
    {"parents": ("own-0002", "own-0001")},
    {"parents": ("own-0001",)},
    {"parents": tuple(f"p-{i}" for i in range(9))},
))
def test_invalid_fields_are_refused(change: dict[str, object]) -> None:
    with pytest.raises(SyntheticInputError):
        replace(sample(), **change)  # type: ignore[arg-type]


def test_row_parser_refuses_wrong_types_and_versions() -> None:
    row = sample().to_row()
    with pytest.raises(SyntheticInputError):
        record_from_row({**row, "format": 2})
    with pytest.raises(SyntheticInputError):
        record_from_row({**row, "parents": "own-0002"})
    with pytest.raises(SyntheticInputError):
        record_from_row({**row, "format": True})


def test_inventory_digest_is_order_independent_and_content_bound() -> None:
    records = fixture_records()
    assert inventory_digest(records) == inventory_digest(tuple(reversed(records)))
    changed = (replace(records[0], rights_token="rights-other"), *records[1:])
    assert inventory_digest(changed) != inventory_digest(records)
    with pytest.raises(SyntheticInputError):
        inventory_digest((*records, records[0]))


def test_sha256_helper_requires_bytes() -> None:
    assert sha256_bytes(b"") == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    with pytest.raises(SyntheticInputError):
        sha256_bytes("text")  # type: ignore[arg-type]

"""Global lineage and identity closure across the whole admitted inventory.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_provenance import ProvenanceRecord
from lab.synth_diversity.stress_provenance_admission import admit_records
from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
    with_parent,
)
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fixture_trust,
    fixture_witness_receipts,
)
from lab.synth_diversity.types import SyntheticInputError


def attempt(records: list[ProvenanceRecord]) -> None:
    admit_records(records, "b" * 64, fixture_witness_receipts(), fixture_trust(),
                  fixture_approvals(), FIXTURE_NOW)


def test_own_render_derived_from_sfhq_is_refused() -> None:
    records = list(fixture_records())
    records[1] = with_parent(records[1], "sfhq-0002")
    with pytest.raises(SyntheticInputError, match="cross-pool"):
        attempt(records)


def test_parent_outside_inventory_is_refused() -> None:
    records = list(fixture_records())
    records[2] = with_parent(records[2], "own-7777")
    with pytest.raises(SyntheticInputError, match="unknown external parent"):
        attempt(records)


def test_cycle_is_refused() -> None:
    records = list(fixture_records())
    records[0] = with_parent(records[0], "own-0003")
    with pytest.raises(SyntheticInputError, match="cycle"):
        attempt(records)


def test_duplicate_identity_is_refused() -> None:
    records = list(fixture_records())
    with pytest.raises(SyntheticInputError, match="duplicate"):
        attempt([*records, records[0]])


def test_rights_token_shared_with_research_is_refused() -> None:
    records = list(fixture_records())
    index = next(i for i, record in enumerate(records) if record.pool == "research_test")
    records[index] = replace(records[index], rights_token="rights-own-a")
    with pytest.raises(SyntheticInputError, match="rights_token"):
        attempt(records)

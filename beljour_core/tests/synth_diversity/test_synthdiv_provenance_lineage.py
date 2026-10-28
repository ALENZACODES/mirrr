"""Closed single-pool lineage: unknown parents, cross-pool edges and cycles.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_pool_guard import check_pool_isolation
from lab.synth_diversity.stress_provenance import check_lineage
from lab.synth_diversity.stress_provenance_fixtures import fixture_records, with_parent
from lab.synth_diversity.types import SyntheticInputError


def by_id() -> dict[str, object]:
    return {record.record_id: record for record in fixture_records()}


def test_fixture_lineage_is_closed() -> None:
    table = check_lineage(fixture_records())
    assert table["own-0003"].parents == ("own-0001",)


def test_unknown_external_parent_is_refused() -> None:
    records = list(fixture_records())
    records[1] = with_parent(records[1], "own-9999")
    with pytest.raises(SyntheticInputError, match="unknown external parent"):
        check_lineage(records)


def test_cross_pool_derivation_is_refused() -> None:
    records = list(fixture_records())
    records[0] = with_parent(records[0], "sfhq-0001")
    with pytest.raises(SyntheticInputError, match="cross-pool"):
        check_lineage(records)


def test_research_cannot_be_laundered_through_an_own_render_child() -> None:
    records = list(fixture_records())
    index = next(i for i, record in enumerate(records) if record.record_id == "research-0001")
    records[index] = with_parent(records[index], "own-0002")
    with pytest.raises(SyntheticInputError, match="cross-pool"):
        check_lineage(records)


def test_two_node_cycle_is_refused() -> None:
    records = list(fixture_records())
    records[0] = with_parent(records[0], "own-0003")
    with pytest.raises(SyntheticInputError, match="cycle"):
        check_lineage(records)


def test_long_chain_without_cycle_is_accepted() -> None:
    base = fixture_records()[0]
    chain = [replace(base, record_id=f"own-c{i:03d}",
                     parents=() if i == 0 else (f"own-c{i - 1:03d}",)) for i in range(300)]
    assert len(check_lineage(chain)) == 300
    looped = [*chain[1:], replace(chain[0], parents=("own-c299",))]
    with pytest.raises(SyntheticInputError, match="cycle"):
        check_lineage(looped)


def test_duplicate_identifiers_are_refused() -> None:
    records = fixture_records()
    with pytest.raises(SyntheticInputError, match="duplicate"):
        check_lineage((*records, records[2]))


def test_generator_runs_and_rights_tokens_cannot_cross_pools() -> None:
    records = list(fixture_records())
    sfhq = next(i for i, record in enumerate(records) if record.pool == "sfhq")
    records[sfhq] = replace(records[sfhq], generator_run="run-own-a")
    with pytest.raises(SyntheticInputError, match="generator_run"):
        check_pool_isolation(records)
    records = list(fixture_records())
    records[sfhq] = replace(records[sfhq], rights_token="rights-own-b")
    with pytest.raises(SyntheticInputError, match="rights_token"):
        check_pool_isolation(records)
    assert len(check_pool_isolation(fixture_records())) == len(by_id())

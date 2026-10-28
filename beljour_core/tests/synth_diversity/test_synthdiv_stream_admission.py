"""Streamed admission end to end, including evidence holes and approval rules.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance import ApprovalRegistry
from lab.synth_diversity.stress_provenance_admission import admit
from lab.synth_diversity.stress_provenance_fixtures import fixture_sketches
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world
from lab.synth_diversity.stress_provenance_stream_verify import StreamSummary, verify_and_export
from lab.synth_diversity.stress_provenance_witness_fixtures import fixture_witness_receipts
from lab.synth_diversity.types import SyntheticInputError


def export(world: StreamWorld, out: Path,
           registry: ApprovalRegistry | None = None) -> StreamSummary:
    return verify_and_export(world.roster, world.ledger, world.stream, world.trust,
                             world.registry if registry is None else registry, world.now, out)


def test_stream_admission_matches_in_memory_admission(tmp_path: Path) -> None:
    for contaminate in (None, "own-0002"):
        root = tmp_path / str(contaminate)
        world = build_world(root, sketches=fixture_sketches(contaminate))
        summary = export(world, root / "allow.jsonl")
        receipts = fixture_witness_receipts(sketches=fixture_sketches(contaminate),
                                            issued_at=world.now - 3600)
        reference = admit(world.roster, world.ledger, receipts, world.trust, world.registry,
                          world.now)
        assert summary.admitted == len(reference.allowlist)
        assert summary.inventory_sha256 == reference.inventory_sha256


def test_missing_witness_row_is_an_evidence_hole(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w", omit={"research-0001"})
    with pytest.raises(SyntheticInputError, match="evidence hole"):
        export(world, tmp_path / "allow.jsonl")
    assert not (tmp_path / "allow.jsonl").exists()


def test_without_approvals_nothing_is_admitted(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    summary = export(world, tmp_path / "allow.jsonl", ApprovalRegistry())
    assert summary.admitted == 0
    assert summary.excluded_unapproved == 3
    assert (tmp_path / "allow.jsonl").read_bytes() == b""


def test_expired_witnesses_fail(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    with pytest.raises(SyntheticInputError, match="not current"):
        verify_and_export(world.roster, world.ledger, world.stream, world.trust,
                          world.registry, world.now + 8 * 86_400, tmp_path / "allow.jsonl")


def test_registry_is_required(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    with pytest.raises(SyntheticInputError, match="registry"):
        verify_and_export(world.roster, world.ledger, world.stream, world.trust,
                          None, world.now, tmp_path / "a.jsonl")  # type: ignore[arg-type]

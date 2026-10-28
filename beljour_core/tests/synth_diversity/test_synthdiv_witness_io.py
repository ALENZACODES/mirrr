"""Witness bundle and admission document round trips through exact JSON files.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_admission import admit_records
from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
)
from lab.synth_diversity.stress_provenance_witness import verify_witnesses
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fictional_key,
    fixture_trust,
    fixture_witness_receipts,
)
from lab.synth_diversity.stress_provenance_witness_io import (
    read_bundle,
    read_exact,
    write_bundle,
    write_document,
)
from lab.synth_diversity.types import SyntheticInputError


def test_bundle_round_trip_still_verifies(tmp_path: Path) -> None:
    receipts = fixture_witness_receipts()
    write_bundle(tmp_path / "bundle.json", reversed(receipts))
    loaded = read_bundle(tmp_path / "bundle.json")
    assert sorted(loaded, key=lambda r: (r.role, r.subject)) == list(loaded)
    assert verify_witnesses(fixture_records(), loaded, fixture_trust(), FIXTURE_NOW)


def test_admission_document_round_trip(tmp_path: Path) -> None:
    result = admit_records(fixture_records(), "d" * 64, fixture_witness_receipts(),
                           fixture_trust(), fixture_approvals(), FIXTURE_NOW)
    write_document(tmp_path / "admission.json", result.to_dict())
    assert read_exact(tmp_path / "admission.json") == result.to_dict()


def test_existing_file_is_never_replaced(tmp_path: Path) -> None:
    target = tmp_path / "bundle.json"
    target.write_text("keep")
    with pytest.raises(SyntheticInputError, match="already exists"):
        write_bundle(target, fixture_witness_receipts())
    assert target.read_text() == "keep"


def test_repository_paths_are_refused() -> None:
    inside = Path(__file__).resolve().parent / "bundle-should-not-exist.json"
    with pytest.raises(SyntheticInputError, match="repo"):
        write_bundle(inside, fixture_witness_receipts())
    assert not inside.exists()


def test_missing_parent_folder_is_refused(tmp_path: Path) -> None:
    with pytest.raises(SyntheticInputError, match="folder"):
        write_document(tmp_path / "absent" / "x.json", {"a": 1})


def test_bundle_holds_no_keys(tmp_path: Path) -> None:
    write_bundle(tmp_path / "b.json", fixture_witness_receipts())
    text = (tmp_path / "b.json").read_text()
    for role in ("render", "rights", "overlap"):
        assert fictional_key(role).hex() not in text

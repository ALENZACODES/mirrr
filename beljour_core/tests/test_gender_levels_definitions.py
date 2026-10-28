"""R25c preregistration integrity; no actual face evaluation. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from plumb_api.engines.gender_look.level_evidence import aggregate_count_only, evidence, expected_rows

ROOT = Path(__file__).resolve().parents[2]
FOLDER = ROOT / "tests/realface/pass_definitions_r25c"


def test_both_frozen_set_definitions_retain_existing_thresholds_and_group_rules() -> None:
    for name, legacy_folder in (
        ("gender_levels_frozen_1000.json", "pass_definitions"),
        ("gender_levels_frozen_10000.json", "pass_definitions-10000"),
    ):
        data = json.loads((FOLDER / name).read_text(encoding="utf-8"))
        committed = ROOT / "tests/realface" / legacy_folder / "gender.json"
        legacy = json.loads(committed.read_text(encoding="utf-8"))
        assert data["version"] == 1
        assert data["parent_sha256"] == hashlib.sha256(committed.read_bytes()).hexdigest()
        assert data["threshold"]["overall"] >= legacy["threshold"]["overall"]
        assert data["threshold"]["every_slice"] >= legacy["threshold"]["every_slice"]
        assert data["slices"] == legacy["slices"]
        assert data["regression"] == legacy["regression"]
        assert data["expected_rows_per_face"] == 6
        assert data["unproven_until_frozen_measurement"] is True


def test_bands_strictly_increase_with_level_and_are_nonoverlapping() -> None:
    for filename in ("gender_levels_frozen_1000.json", "gender_levels_frozen_10000.json"):
        rows = json.loads((FOLDER / filename).read_text(encoding="utf-8"))["levels"]
        assert [row["level"] for row in rows] == [2, 3.5, 5]
        assert rows[0]["brow_tint_signal_band"][1] < rows[1]["brow_tint_signal_band"][0]
        assert rows[1]["brow_tint_signal_band"][1] < rows[2]["brow_tint_signal_band"][0]


def test_synthetic_evidence_has_six_direction_level_rows_without_a_pass_claim() -> None:
    rows = expected_rows()
    assert len(rows) == 6
    assert len({(row.direction, row.level) for row in rows}) == 6
    assert all(row.status == "UNPROVEN" for row in rows)
    assert all(row.fold_count == 0 and row.nan_count == 0 for row in rows)
    assert aggregate_count_only(rows) == {"observed": 6, "failed": 0, "unproven": 6}


def test_readme_digests_match_exact_definition_bytes() -> None:
    readme = (FOLDER / "README.md").read_text(encoding="utf-8")
    for path in sorted(FOLDER.glob("*.json")):
        assert hashlib.sha256(path.read_bytes()).hexdigest() in readme


def test_invalid_counts_do_not_become_synthetic_release_passes() -> None:
    failure = evidence("masculine", 5.0, 0.99, fold_count=1)
    assert failure.status == "FAIL"
    assert failure.fold_count == 1
    assert failure.nan_count == 0
    counts = aggregate_count_only((failure,))
    assert counts == {"observed": 1, "failed": 1, "unproven": 0}
    with pytest.raises(ValueError, match="duplicate"):
        aggregate_count_only((failure, failure))
    with pytest.raises(ValueError, match="similarity outside"):
        evidence("feminine", 2.0, float("nan"))

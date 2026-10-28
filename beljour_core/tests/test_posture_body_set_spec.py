"""No private bodies: enforce frozen metadata and preregistered NOT_RUN posture gates."""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys

import pytest

from plumb_api.arena.constants import BANNED_SOURCES
from plumb_api.engines.posture.body_evidence import (
    DEFINITIONS,
    EXPECTED_DEFINITIONS,
    SPEC_PATH,
    BodyEvidenceError,
    evaluate_manifest,
    load_definitions,
    spec_uses_canonical_denylist,
    validate_definition,
)


def test_three_definitions_are_predeclared_before_observations() -> None:
    loaded = load_definitions()
    assert list(loaded) == list(EXPECTED_DEFINITIONS)
    assert [len(loaded[key]["fix_ids"]) for key in EXPECTED_DEFINITIONS] == [7, 2, 5]
    assert all(d["status"] == "awaiting body set" for d in loaded.values())
    assert all(d["face_set"]["number_of_bodies"] == 1200 for d in loaded.values())
    assert all(d["regression"]["max_drop"] == 0.0 for d in loaded.values())
    assert all(d["minimum_slice_bodies"] == 20 for d in loaded.values())
    assert all("monk" in d["slices"] for d in loaded.values())


def test_spec_references_canonical_denylist_not_a_copy() -> None:
    assert BANNED_SOURCES
    assert SPEC_PATH.is_file()
    assert spec_uses_canonical_denylist()
    text = SPEC_PATH.read_text(encoding="utf-8")
    assert "plumb_api.arena.constants.BANNED_SOURCES" in text
    assert "derived pose labels" in text
    assert "CC0" in text and "CC BY" in text
    assert "consent" in text.lower()
    assert "minors" in text


def test_cli_lists_all_three_definitions_and_not_run() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "plumb_api.engines.posture.body_evidence", "--validate-definitions"],
        capture_output=True,
        text=True,
        timeout=20,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    for name in EXPECTED_DEFINITIONS:
        assert f"{name}: awaiting body set" in result.stdout
    assert "NOT_RUN" in result.stdout
    assert "PASS" not in result.stdout


def test_empty_manifest_never_passes_or_counts_missing_faces_as_success() -> None:
    result = evaluate_manifest([])
    assert result.status == "NOT_RUN"
    assert result.checked == 0
    assert result.missing == ("awaiting body set",)


def fake_row(i: int, *, source: str = "private-consented-source") -> dict[str, object]:
    return {
        "photo_sha256": hashlib.sha256(f"drawn-metadata-{i}".encode()).hexdigest(),
        "licence": "Owner-Consent",
        "derived_metrics_allowed": True,
        "released_adult": True,
        "minors_excluded": True,
        "view": "front",
        "body_size": "medium",
        "monk": "3",
        "source": source,
        "source_ancestry": ["original-consented"]
    }


def test_valid_but_incomplete_manifest_is_unproven() -> None:
    result = evaluate_manifest([fake_row(1)])
    assert result.status == "UNPROVEN"
    assert result.checked == 1
    assert any("underpowered" in note for note in result.missing)


@pytest.mark.parametrize("source", BANNED_SOURCES)
def test_every_canonical_banned_source_and_its_derivative_is_rejected(source: str) -> None:
    with pytest.raises(BodyEvidenceError, match="deny-list"):
        evaluate_manifest([fake_row(1, source=source)])
    item = fake_row(2)
    item["source_ancestry"] = [source]
    with pytest.raises(BodyEvidenceError, match="deny-list"):
        evaluate_manifest([item])


@pytest.mark.parametrize("field,value", [
    ("licence", "Research-Only"),
    ("derived_metrics_allowed", False),
    ("released_adult", False),
    ("minors_excluded", False),
    ("view", "portrait"),
    ("body_size", "unknown"),
    ("monk", "unknown"),
    ("photo_sha256", "not-sha256"),
])
def test_invalid_evidence_refused_not_marked_pass(field: str, value: object) -> None:
    item = fake_row(3)
    item[field] = value
    with pytest.raises(BodyEvidenceError):
        evaluate_manifest([item])


def test_duplicate_photograph_refused() -> None:
    row = fake_row(5)
    with pytest.raises(BodyEvidenceError, match="reused"):
        evaluate_manifest([row, row])


def test_definition_cannot_change_written_threshold_or_status() -> None:
    d = json.loads((DEFINITIONS / "posture_levels.json").read_text(encoding="utf-8"))
    d["threshold"]["minimum_reduction"] = 0.01
    with pytest.raises(BodyEvidenceError, match="threshold"):
        validate_definition(d, "posture_levels")
    d["threshold"]["minimum_reduction"] = 0.1
    d["status"] = "PASS"
    with pytest.raises(BodyEvidenceError, match="awaiting"):
        validate_definition(d, "posture_levels")

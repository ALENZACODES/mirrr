"""The Tuesday preregistered rules do not retroactively certify faces.

The packaged synthetic 205-row ledger is integrity-checked and independently
marked as not a human or externally locked real-face evaluation.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.lock_matrix import COMMANDS, LEVELS
from plumb_api.commands.studio import STUDIO_LIGHT_REFERENCE
from plumb_api.commands.tuesday_lock import verify_tuesday_lock_json

REPO = Path(__file__).resolve().parents[3]
DEFINITION = REPO / "tests/realface/pass_definitions_r10h/tuesday_lock.json"
EXAMPLE = Path(__file__).with_name("fixtures") / "tuesday_lock_synthetic_r10h.json"


def test_tuesday_definition_has_unchanged_external_evidence_boundary() -> None:
    record = json.loads(DEFINITION.read_text(encoding="utf-8"))
    assert record["version"] == "beljour-pro-tuesday-lock/1"
    assert record["author"] == "John Khan"
    assert record["owner"] == "H"
    assert record["status"] == "NOT_RUN"
    assert record["minimum_faces_for_external_release"] == 100000
    assert record["commands"] == [entry.value for entry in COMMANDS]
    assert record["level_tenths"] == {
        "minimum": 10, "maximum": 50, "increment": 1, "count": len(LEVELS),
    }
    assert record["required_technical_slots"] == 205
    assert record["identity_lock_default"] is True
    assert record["studioquality_editorial_reference"] == STUDIO_LIGHT_REFERENCE
    assert record["synthetic_does_not_clear_external_gate"] is True
    assert record["real_face_gate_authority"] == "external_box_only"
    assert record["release_qualified"] is False
    assert len(record["existing_external_definitions"]) >= 5
    for path in record["existing_external_definitions"]:
        assert (REPO / path).is_file()


def test_actual_synthetic_fixture_contains_205_checked_observations() -> None:
    payload = verify_tuesday_lock_json(EXAMPLE.read_text(encoding="utf-8"))
    assert payload["total_slots"] == 205
    assert payload["technical_status"] == "technical_review_required"
    assert payload["independent_realface_result"] == "NOT_RUN"
    assert payload["release_qualified"] is False
    assert payload["production_identity_qualified"] is False
    matrix = payload["matrix"]
    assert matrix["total_checked"] == 205
    assert matrix["status"] == "synthetic_ready"
    assert all(item["checked_levels"] == 41 for item in matrix["commands"])
    assert all(item["failed_levels"] == [] for item in matrix["commands"])
    assert all(item["missing_levels"] == [] for item in matrix["commands"])
    assert all(item["device_levels"] == 0 for item in matrix["commands"])


def test_tuesday_fixture_cannot_claim_human_release_on_checksum() -> None:
    content = EXAMPLE.read_text(encoding="utf-8")
    corrupted = content.replace('"NOT_RUN"', '"PASSED"')
    assert corrupted != content
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(corrupted)

"""Preregistered identity holdout definition structure, without a face run.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path


def test_identity_pair_definition_cannot_claim_a_release_pass() -> None:
    root = Path(__file__).resolve().parents[3]
    source = root / "tests/realface/pass_definitions_r11h/identity_pairs.json"
    definition = json.loads(source.read_text(encoding="utf-8"))
    assert definition["version"] == "beljour-identity-pair-qualification/1"
    assert definition["owner"] == "H"
    assert definition["author"] == "John Khan"
    assert definition["public_product"] == "BELJOUR"
    assert definition["status"] == "NOT_RUN"
    assert definition["release_qualified"] is False
    assert definition["minimum_faces_for_external_release"] == 100000
    assert definition["required_technical_slots"] == 205
    assert definition["prior_locked_release_definition"].endswith("tuesday_lock.json")
    assert definition["policy_thresholds"].startswith("REQUIRED_FROM_LOCKED_EXTERNAL_POLICY")
    assert not definition["synthetic_results_authoritative_for_real_faces"]
    assert not definition["private_pair_records_in_public_reports"]
    assert set(definition["externally_labelled_dimensions"]) == {
        "source", "tone", "gender", "yaw", "occlusion", "image_size",
    }


def test_identity_pair_definition_requires_independent_evidence() -> None:
    root = Path(__file__).resolve().parents[3]
    path = root / "tests/realface/pass_definitions_r11h/identity_pairs.json"
    record = json.loads(path.read_text(encoding="utf-8"))
    mandatory = record["required_external_evidence"]
    assert len(mandatory) >= 8
    assert any("training_provenance" in item for item in mandatory)
    assert any("subject_disjoint" in item for item in mandatory)
    assert any("private_shard_manifest" in item for item in mandatory)
    assert any("real_face_review" in item for item in mandatory)
    assert record["handling"]["absent_group"] == "UNPROVEN"
    assert record["handling"]["new_identity_regression"] == "BLOCKED"
    assert record["handling"]["unverified_real_face_approval"] == "UNPROVEN"

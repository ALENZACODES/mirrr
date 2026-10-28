"""The shipped Tuesday template remains complete, honest and reproducible.

The separate tier probe is synthetic-only and does not populate gate slots.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

from plumb_api.commands.lock_bundle import verify_written_bundle
from plumb_api.commands.studio import STUDIO_LIGHT_REFERENCE

FIXTURE = (
    Path(__file__).parent / "fixtures" / "tuesday_near_final_r14h"
)
ROOT = Path(__file__).resolve().parents[3]


def test_shipped_dossier_has_every_scope_and_no_measured_pass() -> None:
    folder = FIXTURE / "tuesday-unmeasured-build-unverified-lock"
    report = verify_written_bundle(folder)
    assert len(report.scopes) == 7
    assert all(scope.slots == 41 for scope in report.scopes)
    assert sum(scope.slots for scope in report.scopes) == 287
    assert report.status == "incomplete"
    assert report.observed == 0
    assert report.device_measured == 0
    assert len(report.gaps) == 287
    annex = json.loads((folder / "studio-pose-annex.json").read_text(encoding="utf-8"))
    assert annex["slot_count"] == 82
    assert annex["diagnostic_count"] == 0
    assert annex["studio_reference"] == STUDIO_LIGHT_REFERENCE
    assert annex["release_qualified"] is False
    assert annex["independent_realface_result"] == "NOT_RUN"


def test_synthetic_probe_cannot_replace_tuesday_evidence() -> None:
    probe = json.loads((FIXTURE / "synthetic-tier-probe.json").read_text(encoding="utf-8"))
    assert probe["version"] == "beljour-synthetic-tier-measurement/1"
    assert probe["missing_rows"] == 80
    assert probe["device_qualified"] is False
    assert probe["release_qualified"] is False
    assert probe["identity_model"] == "synthetic_test_only"
    rows = probe["measured_rows"]
    assert [row["tier"] for row in rows] == ["1080", "4k"]
    assert all(row["identity_lock_on"] for row in rows)
    assert all(row["cleanup_first"] for row in rows)
    assert all(row["measured_device"] is False for row in rows)
    assert all(row["output_width"] in (1920, 3840) for row in rows)
    assert all(row["preview_ms"] >= 0 and row["export_ms"] >= 0 for row in rows)


def test_new_definition_is_unrun_and_preserves_existing_numeric_gates() -> None:
    spec = json.loads((
        ROOT / "tests" / "realface" / "pass_definitions_r14h" / "tuesday_lock_evidence.json"
    ).read_text(encoding="utf-8"))
    assert spec["status"] == "NOT_RUN"
    assert spec["coverage"]["command_slots"] == 205
    assert spec["coverage"]["tier_slots"] == 82
    assert spec["coverage"]["studio_pose_diagnostic_slots"] == 82
    assert spec["evidence"]["studio_rounded_skin_lift_existing_limit_l"] == 2.5
    assert spec["evidence"]["pose_existing_minimum_jacobian"] == 0.25
    assert spec["evidence"]["pose_existing_minimum_retention"] == 0.25
    assert spec["evidence"]["pose_changed_protected_face_pixels"] == 0
    assert spec["release"]["real_face_gate"] == "NOT_RUN"
    assert spec["release"]["commercial_identity_qualified"] is False


def test_runbook_requires_independent_face_gate_and_recorded_timings() -> None:
    guide = (FIXTURE / "OPERATOR-RUNBOOK.md").read_text(encoding="utf-8")
    assert "100,000-face" in guide
    assert "preview and export timings" in guide
    assert "STUDIO" in guide
    assert "POSEONLY" in guide
    assert "--studio-pose-annex" in guide

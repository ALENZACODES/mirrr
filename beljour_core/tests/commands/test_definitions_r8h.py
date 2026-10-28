"""Ensure new Studio and Pose definitions are written before external runs.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from plumb_api.commands.quality_gate_r3h import evaluate_r3h_gate, load_r3h_definition


BASE = Path(__file__).resolve().parents[3]
SOURCE = BASE / "tests" / "realface" / "pass_definitions_r8h"


def test_studio_final_byte_definition_cannot_approve_a_synthetic_case() -> None:
    definition = load_r3h_definition(SOURCE / "studio_final_byte.json")
    assert definition.command == "studioquality"
    assert definition.minimum_faces == 100000
    report = evaluate_r3h_gate(definition, {}, face_count=100000)
    assert report.outcome == "unproven"
    assert not report.realface_pass
    assert "max_covered_skin_lightness_rise_lstar" in report.missing


def test_pose_fold_definition_rejects_bad_determinant() -> None:
    definition = load_r3h_definition(SOURCE / "pose_fold_retention.json")
    assert definition.command == "poseonly"
    metrics = {name.name: 0 for name in definition.metrics}
    metrics["minimum_inverse_sampling_determinant"] = -0.1
    report = evaluate_r3h_gate(definition, metrics, face_count=100000)
    assert report.outcome == "fail"
    assert not report.realface_pass
    assert "minimum_inverse_sampling_determinant" in report.failed

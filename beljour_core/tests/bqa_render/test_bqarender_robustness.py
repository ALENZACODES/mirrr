"""Robustness and misuse set: case building, grading with and without a decision gate.

The gates here are synthetic stand-ins written for the test; they prove the grading
logic, not product behaviour. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Any

import numpy as np
import pytest

from lab.bqa_render import robustness as rob
from lab.bqa_render.bench import Bench
from lab.bqa_render.faces import Scene
from lab.bqa_render.rows import parse_context


class PolicyGate:
    """A synthetic gate following the report's defined behaviours."""

    def decide(self, scene: Scene, request: rob.EditRequest) -> rob.Decision:
        if not scene.faces:
            return rob.Decision("refuse", None, "No face found. Please choose a photo of you.")
        if not request.consent or request.target != scene.spec.selected:
            return rob.Decision("refuse", None, "You can only edit your own face.")
        face = scene.subject.spec
        if face.size < 0.06:
            return rob.Decision("guide", None, "Move closer and retake.")
        if abs(face.yaw) > 40 or abs(face.pitch) > 30:
            return rob.Decision("guide", None, "Face the camera and retake.")
        return rob.Decision("handle", scene.spec.selected)


class CarelessGate:
    """A synthetic gate that edits whatever face was asked for (misuse must catch it)."""

    def decide(self, scene: Scene, request: rob.EditRequest) -> rob.Decision:
        if not scene.faces:
            return rob.Decision("refuse")
        return rob.Decision("handle", request.target)


@pytest.fixture()
def bench() -> Bench:
    return Bench(parse_context({"run_id": "rob", "seed": 9}), limit=2, variants=1)


def test_case_building_is_seeded_and_subsets_match() -> None:
    assert sum(f.count for f in rob.load_families()) >= 150
    small = [replace(f, count=min(f.count, 12)) for f in rob.load_families()]
    full = rob.build_cases(9, small)
    assert len(full) == sum(f.count for f in small)
    again = rob.build_cases(9, small)
    assert [c.case_id for c in full] == [c.case_id for c in again]
    assert np.array_equal(full[3].scene.image, again[3].scene.image)
    subset = {c.case_id: c for c in rob.build_cases(9, small, step=10)}
    for case in full:
        if case.case_id in subset:
            assert np.array_equal(case.scene.image, subset[case.case_id].scene.image)
    misuse = [c for c in full if c.family.family == "misuse_bystander"]
    assert all(c.request.target != c.scene.spec.selected and not c.request.consent
               for c in misuse)


def test_without_a_gate_gate_dependent_checks_are_not_applicable(bench: Bench) -> None:
    for check in (rob.check_det03, rob.check_rob03, rob.check_neg02, rob.check_csf03):
        row = check(bench)
        reasons = row["reason_codes"]
        assert row["status"] == "NOT_APPLICABLE" and isinstance(reasons, list)
        assert "no_public_export:decision_gate" in reasons


def test_policy_gate_gives_defined_behaviour(bench: Bench) -> None:
    gate = PolicyGate()
    for check in (rob.check_det03, rob.check_rob03, rob.check_neg02, rob.check_csf03):
        row = check(bench, gate)
        assert row["status"] in ("PASS", "UNPROVEN"), row
        measured = row["measured"]
        assert isinstance(measured, dict) and measured["harmful_outputs"] == 0


def test_careless_gate_fails_misuse(bench: Bench) -> None:
    row = rob.check_csf03(bench, CarelessGate())
    reasons = row["reason_codes"]
    assert row["status"] == "FAIL" and isinstance(reasons, list) and "harmful_output" in reasons
    kinds = {f.failure_type for f in bench.failures}
    assert "non_consensual_output" in kinds or "wrong_face" in kinds


def test_render_containment_rows(bench: Bench) -> None:
    for check in (rob.check_det02, rob.check_rob02, rob.check_cata1):
        row = check(bench)
        measured = row["measured"]
        assert isinstance(measured, dict) and measured["violating_cases"] == 0


@dataclass
class FakeChoice:
    index: int | None
    reason_code: str


def test_subject_choice_gate_wraps_the_documented_signature() -> None:
    calls: list[Any] = []

    def choose(meshes: list[np.ndarray], boxes: list[Any], width: int, height: int
               ) -> FakeChoice:
        calls.append((len(meshes), width, height))
        return FakeChoice(len(meshes) - 1, "selected_largest")

    case = next(c for c in rob.build_cases(9, step=20) if c.family.family == "group")
    decision = rob.SubjectChoiceGate(choose).decide(case.scene, case.request)
    assert decision.action == "handle" and decision.face_index == len(case.scene.faces) - 1
    assert calls[0][0] == len(case.scene.faces)
    none = rob.SubjectChoiceGate(lambda *a: FakeChoice(None, "no_face"))
    assert none.decide(case.scene, case.request).action == "guide"


def test_degradations_keep_shape_and_type() -> None:
    image = np.full((40, 40, 3), 128, dtype=np.uint8)
    for item in rob.DEGRADATIONS:
        out = item.make(image, 1)
        assert out.shape == image.shape and out.dtype == np.uint8

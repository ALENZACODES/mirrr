"""R16A synthetic tests: primary selection must not pick arbitrary bystander.

Only fabricated coordinate arrays. No inference about age, race, gender, or
identity. The selection policy must be stable across returned face order.
Author: John Khan.
"""
from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest

from plumb_api.vision.box_first import FaceBox

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
from primary_face import no_face_reason, select  # noqa: E402


def mesh(cx: float = .5, cy: float = .5, rx: float = .1, ry: float = .16) -> np.ndarray:
    theta = np.linspace(0, 2 * np.pi, 478, endpoint=False)
    return np.stack([cx + rx * np.cos(theta), cy + ry * np.sin(theta),
                     np.zeros_like(theta)], axis=1)


def test_single_face_is_accepted_without_using_demographics():
    chosen = select([mesh()], [], 640, 480, labels={"gender": "unknown", "race": "unknown"})
    assert chosen.index == 0
    assert chosen.reason_code == "selected_largest"
    assert chosen.candidate_count == 1
    assert chosen.ambiguity_ratio is None
    assert chosen.box_confidence is None
    assert chosen.accepted


def test_two_equally_sized_faces_have_deterministic_centre_tiebreak():
    a, b = mesh(.30), mesh(.70)
    chosen = select([a, b], [], 500, 500)
    assert chosen.accepted
    assert chosen.index == 0
    assert chosen.reason_code == "selected_centre_tiebreak"
    assert chosen.candidate_count == 2
    assert chosen.ambiguity_ratio == pytest.approx(1, rel=1e-6)


def test_clearly_larger_face_wins_over_centered_bystander():
    lead = mesh(.28, .5, .18, .2)
    bystander = mesh(.5, .5, .06, .10)
    assert select([bystander, lead], [], 640, 640).index == 1
    assert select([lead, bystander], [], 640, 640).index == 0
    assert select([lead, bystander], [], 640, 640).reason_code == "selected_largest"


def test_center_position_breaks_comparable_area_only_when_decisive():
    center = mesh(.5, .5, .12, .20)
    edge = mesh(.75, .5, .12, .20)
    strict = select([center, edge], [], 640, 640)
    assert strict.reason_code == "selected_centre_tiebreak"
    assert strict.index == 0
    assert select([center, edge], [], 640, 640, dominance=1.01).index == 0


def test_confidence_from_matching_proposal_can_decline():
    candidate = mesh(.5, .5, .10, .15)
    box = FaceBox(240, 210, 160, 140, .55)
    refused = select([candidate], [box], 640, 640)
    assert refused.index is None
    assert refused.reason_code == "low_confidence"
    assert refused.box_confidence == pytest.approx(.55)
    accepted = select([candidate], [FaceBox(240, 210, 160, 140, .90)], 640, 640)
    assert accepted.accepted


def test_nonmatching_proposal_does_not_claim_high_confidence():
    candidate = mesh(.45, .45)
    unrelated = FaceBox(0, 0, 10, 10, .99)
    chosen = select([candidate], [unrelated], 640, 640)
    assert chosen.index == 0
    assert chosen.box_confidence is None


def test_low_confidence_not_blended_with_high_confidence_bystander():
    big = mesh(.24, .5, .15, .20)
    small = mesh(.80, .5, .05, .1)
    boxes = [FaceBox(55, 180, 190, 270, .61), FaceBox(475, 270, 70, 120, .93)]
    chosen = select([big, small], boxes, 640, 640)
    assert chosen.index is None or chosen.reason_code == "selected_largest"
    # The result never pretends a bystander's .93 detection is the lead's confidence.
    assert chosen.box_confidence is None or chosen.box_confidence < .8


@pytest.mark.parametrize("face", [
    np.zeros((0, 3), dtype=np.float64),
    np.full((478, 3), float("nan")),
    np.full((478, 3), float("inf")),
    np.zeros((478, 3), dtype=np.float64),
])
def test_bad_mesh_cannot_be_used_as_the_primary(face):
    chosen = select([face], [], 640, 480)
    assert chosen.index is None
    assert chosen.reason_code == "invalid_mesh"


def test_partial_outside_frame_gets_a_specific_reason():
    bad = mesh(1.11, .5, .15)
    chosen = select([bad], [], 640, 480)
    assert not chosen.accepted
    assert chosen.reason_code == "mesh_out_of_frame"


def test_valid_mesh_does_not_fail_merely_for_near_frame_center():
    candidate = mesh(.25, .3, .12, .14)
    assert select([candidate], [], 320, 320).accepted


@pytest.mark.parametrize("labels,reason", [
    ({"yaw": "profile", "occlusion": "hijab"}, "side_profile_no_face"),
    ({"yaw": "side", "occlusion": "none"}, "side_profile_no_face"),
    ({"yaw": "frontal", "occlusion": "hijab"}, "head_covering_no_face"),
    ({"yaw": "frontal", "occlusion": "headscarf"}, "head_covering_no_face"),
    ({"yaw": "unknown", "occlusion": "unknown"}, "no_face"),
    ({"yaw": "frontal", "occlusion": "glasses"}, "no_face"),
])
def test_missing_face_uses_only_frozen_annotations(labels, reason):
    assert no_face_reason(labels) == reason
    assert select([], [], 320, 320, labels=labels).reason_code == reason
    assert select([], [], 320, 320, labels=labels).candidate_count == 0


def test_missing_face_with_no_manifest_is_not_guessed():
    assert no_face_reason(None) == "no_face"
    assert no_face_reason({}) == "no_face"


@pytest.mark.parametrize("width,height", [(0, 20), (20, 0), (1, 5), (-2, 500), (640.5, 400), (True, 400)])
def test_invalid_image_dimensions_are_rejected(width, height):
    with pytest.raises(ValueError):
        select([mesh()], [], width, height)


@pytest.mark.parametrize("kwargs", [
    {"dominance": 1}, {"dominance": 0}, {"dominance": float("inf")},
    {"minimum_score": -.1}, {"minimum_score": 1.2},
])
def test_policy_cannot_be_weakened_to_arbitrary_or_invalid_selection(kwargs):
    with pytest.raises(ValueError):
        select([mesh()], [], 640, 640, **kwargs)


def test_results_export_only_scalar_metadata():
    result = select([mesh()], [], 640, 640)
    data = result.scalars()
    assert isinstance(data, dict)
    assert "index" not in data
    assert "face_id" not in data
    assert "path" not in data
    assert all(value is None or isinstance(value, (int, float, str)) for value in data.values())


def test_result_does_not_require_facebox_or_model_runtime():
    fake_box = SimpleNamespace(x=250, y=250, width=140, height=140, score=.88)
    selected = select([mesh()], [fake_box], 640, 640)
    assert selected.index == 0
    assert isinstance(selected.box_confidence, float)

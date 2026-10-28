"""Synthetic detection proposals and observed meshes must not be conflated."""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.vision.box_first import DetectionResult, FaceBox
from plumb_api.vision.detected_faces import from_detection


def mesh(cx: float, cy: float = 0.5, rx: float = 0.11) -> np.ndarray:
    theta = np.arange(478, dtype=np.float64) * (2 * math.pi / 478)
    return np.column_stack((cx + rx * np.cos(theta), cy + 0.12 * np.sin(theta),
                            np.zeros_like(theta)))


def box(cx: float, size: float = 90.0, score: float = 0.96) -> FaceBox:
    return FaceBox(cx * 400 - size / 2, 0.5 * 300 - 50, size, 100, score)


def test_all_matched_meshes_are_pickable_and_map_to_original_indices() -> None:
    result = DetectionResult(faces=[mesh(.75), mesh(.35)], boxes=[box(.35), box(.75)])
    chosen = from_detection(result, 400, 300)
    assert chosen.counts()["visible_faces"] == 2
    assert chosen.choices.primary.index in (0, 1)
    assert chosen.mesh_indices == (0, 1)
    other = chosen.tap(.75, .5)
    assert other.index is not None
    assert np.array_equal(chosen.mesh(other), result.faces[0])


def test_unmatched_proposal_does_not_become_a_picker_target() -> None:
    result = DetectionResult(faces=[mesh(.32)], boxes=[box(.32), box(.78)])
    chosen = from_detection(result, 400, 300)
    assert chosen.counts()["visible_faces"] == 1
    assert chosen.tap(.78, .5).code == "no_face_at_point"


def test_no_box_but_measured_mesh_is_a_real_fallback_selection() -> None:
    chosen = from_detection(DetectionResult(faces=[mesh(.45)], used_fallback=True), 400, 300)
    assert chosen.choices.primary.code == "selected_primary"
    assert chosen.mesh(chosen.choices.primary) is not None


def test_no_mesh_returns_no_face_not_a_failed_edit() -> None:
    chosen = from_detection(DetectionResult(boxes=[box(.4)]), 400, 300)
    assert chosen.counts() == {"code": "no_face_found", "visible_faces": 0, "untouched_faces": 0}
    assert chosen.mesh(chosen.choices.primary) is None


def test_corrupt_and_low_confidence_faces_cannot_be_selected() -> None:
    broken = mesh(.4)
    broken[10, 2] = math.nan
    assert from_detection(DetectionResult(faces=[broken]), 400, 300).counts()["visible_faces"] == 0
    low = DetectionResult(faces=[mesh(.4)], boxes=[box(.4, score=.2)])
    assert from_detection(low, 400, 300).counts()["visible_faces"] == 0


def test_returned_mesh_is_not_the_mutable_detector_reference() -> None:
    result = DetectionResult(faces=[mesh(.5)])
    chosen = from_detection(result, 400, 300)
    returned = chosen.mesh(chosen.choices.primary)
    assert returned is not None
    returned[0, 0] = 200.0
    assert chosen.mesh(chosen.choices.primary)[0, 0] < 1.0


@pytest.mark.parametrize("dimensions", [(0, 400), (12.5, 400), (32768, 400), (400, True)])
def test_source_dimensions_are_strict(dimensions: tuple[object, object]) -> None:
    with pytest.raises(ValueError):
        from_detection(DetectionResult(), *dimensions)


def test_one_proposal_cannot_claim_two_different_meshes() -> None:
    first = mesh(.45)
    second = mesh(.47)
    detected = DetectionResult(faces=[first, second], boxes=[box(.46)])
    assert from_detection(detected, 400, 300).counts()["visible_faces"] == 1

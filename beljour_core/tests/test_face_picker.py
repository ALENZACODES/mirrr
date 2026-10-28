"""Bystander preservation and short-lived primary selection on drawn rectangles."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.vision.box_first import FaceBox
from plumb_api.vision.face_picker import compose_selected, picker, summary


def test_biggest_face_wins_with_centre_tiebreak() -> None:
    a = FaceBox(1, 1, 20, 20, .9)
    b = FaceBox(48, 48, 20, 20, .9)
    c = FaceBox(5, 5, 42, 30, .9)
    assert picker([a, b], 100, 100).primary.index == 1
    assert picker([a, b, c], 100, 100).primary.index == 2


def test_explicit_tap_chooses_non_primary() -> None:
    boxes = [FaceBox(3, 3, 55, 60), FaceBox(70, 70, 18, 20)]
    chosen = picker(boxes, 100, 100)
    assert chosen.primary.index == 0
    assert chosen.tap(.8, .8).index == 1
    assert chosen.tap(.8, .8).untouched_faces == 1
    assert chosen.tap(.6, .6).code == "no_face_at_point"
    assert chosen.select(30).code == "invalid_selection"


def test_no_face_has_explicit_non_success_code() -> None:
    chosen = picker([], 100, 100)
    assert chosen.primary.index is None
    assert chosen.primary.code == "no_face_found"
    assert not summary(chosen.primary, {})["processed"]


def test_confidence_restriction_blocks_unvalidated_boxes() -> None:
    chosen = picker([FaceBox(0, 0, 15, 15, .69)], 100, 100)
    assert chosen.primary.code == "no_face_found"


def test_many_faces_fail_closed_instead_of_silent_truncation() -> None:
    boxes = [FaceBox(float(i * 3), 10, 2, 3) for i in range(17)]
    assert picker(boxes, 100, 100).primary.code == "too_many_faces"


def test_hair_body_masks_are_explicit_and_other_person_pixels_unchanged() -> None:
    h, w = 90, 140
    source = np.zeros((h, w, 4), dtype=np.uint8)
    source[..., :3] = 70
    source[..., 3] = 180
    edited = source.copy()
    edited[..., :3] = 225
    chosen = np.zeros((h, w), dtype=np.float32)
    chosen[10:85, 10:80] = 1
    chosen[10:13, 10:80] = .25
    other_person = np.zeros((h, w), dtype=np.float32)
    other_person[0:90, 75:130] = 1
    output = compose_selected(source, edited, chosen, [other_person])
    assert np.array_equal(output[:, 75:130], source[:, 75:130])
    assert np.array_equal(output[:, :10], source[:, :10])
    assert output[50, 30, 0] == 225
    assert output[10, 30, 0] > 70
    assert np.array_equal(output[..., 3], source[..., 3])
    assert np.array_equal(source[..., :3], np.full_like(source[..., :3], 70))


def test_missing_or_invalid_masks_refuse() -> None:
    src = np.zeros((16, 16, 3), dtype=np.uint8)
    edited = np.full_like(src, 255)
    with pytest.raises(ValueError, match="no verified editable region"):
        compose_selected(src, edited, np.zeros((16, 16), dtype=np.float32))
    with pytest.raises(ValueError):
        compose_selected(src, edited, np.ones((16, 16), dtype=np.float32),
                         [np.full((16, 16), np.nan)])


def test_summary_contains_no_coordinates_or_people() -> None:
    chosen = picker([FaceBox(20, 20, 30, 40)], 100, 100).primary
    report = summary(chosen, {"verified_mask": True, "bystanders_unchanged": True})
    assert report == {"code": "selected_primary", "visible_faces": 1,
                      "untouched_faces": 0, "processed": True,
                      "verified_mask": True, "bystanders_unchanged": True}
    assert "x" not in report and "face_id" not in report

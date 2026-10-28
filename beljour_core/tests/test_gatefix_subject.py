"""Synthetic multi-person selection, explicit taps, and protected-pixel tests.

No reference label is inferred from image colour or landmark position.
Author: John Khan.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.vision.box_first import DetectionResult, FaceBox
from plumb_api.vision.detected_faces import from_detection
from plumb_api.vision.face_picker import compose_selected
from plumb_api.vision.subject import AREA_TIE_BAND, choose_subject

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
from primary_face import select  # noqa: E402


def mesh(cx: float, cy: float = 0.5, rx: float = 0.1,
         ry: float = 0.16) -> np.ndarray:
    theta = np.arange(478, dtype=np.float64) * (2 * math.pi / 478)
    return np.column_stack((cx + rx * np.cos(theta), cy + ry * np.sin(theta),
                            0.01 * np.sin(theta)))


def box(cx: float, cy: float = 0.5, width: float = 80,
        height: float = 105, score: float = 0.9) -> FaceBox:
    return FaceBox(320 * cx - width / 2, 240 * cy - height / 2, width, height, score)


def test_largest_face_wins_independent_of_detector_order() -> None:
    left = mesh(0.21, rx=0.16, ry=0.19)
    centre = mesh(0.5, rx=0.08, ry=0.12)
    right = mesh(0.79, rx=0.05, ry=0.07)
    first = choose_subject([right, left, centre], [], 320, 240)
    second = choose_subject([left, centre, right], [], 320, 240)
    assert first.index == 1
    assert second.index == 0
    assert first.reason_code == second.reason_code == "selected_largest"
    assert first.other_faces == second.other_faces == 2
    assert first.candidates == second.candidates == 3


def test_tie_band_is_ten_percent_and_centre_is_only_a_tiebreak() -> None:
    assert AREA_TIE_BAND == 0.10
    largest = mesh(0.24, rx=0.12, ry=0.16)
    smaller = mesh(0.5, rx=0.118, ry=0.157)
    outcome = choose_subject([largest, smaller], [], 320, 240)
    assert outcome.index == 1
    assert outcome.reason_code == "selected_centre_tiebreak"
    much_smaller = mesh(0.5, rx=0.09, ry=0.13)
    outcome = choose_subject([largest, much_smaller], [], 320, 240)
    assert outcome.index == 0
    assert outcome.reason_code == "selected_largest"


def test_explicit_index_taps_any_other_valid_face() -> None:
    images = [mesh(0.2, rx=0.14), mesh(0.50), mesh(0.82, rx=0.06)]
    for index in range(3):
        selected = choose_subject(images, [], 320, 240, chosen_index=index)
        assert selected.accepted
        assert selected.index == index
        assert selected.reason_code == "selected_by_index"
        assert selected.other_faces == 2
        frozen = select(images, [], 320, 240, chosen_index=index)
        assert frozen.index == index
        assert frozen.reason_code == "selected_by_index"


@pytest.mark.parametrize("invalid", [-2, -1, 3, 5, 1.2, True, "0"])
def test_invalid_user_selection_cannot_trigger_an_edit(invalid: object) -> None:
    item = choose_subject([mesh(0.5)], [], 320, 240, chosen_index=invalid)
    assert not item.accepted
    assert item.reason_code == "invalid_selection"


def test_a_clipped_bystander_does_not_veto_the_main_subject() -> None:
    lead = mesh(0.30, rx=0.14)
    clipped = mesh(1.05, rx=0.18)
    chosen = choose_subject([clipped, lead], [], 320, 240)
    assert chosen.index == 1
    assert chosen.reason_code == "selected_largest"
    assert select([clipped, lead], [], 320, 240).index == 1
    other = choose_subject([clipped, lead], [], 320, 240, chosen_index=0)
    assert not other.accepted


def test_wrong_shape_and_nans_are_invalid_not_clipped() -> None:
    invalid = [np.zeros((477, 3)), np.full((478, 3), np.nan)]
    for values in invalid:
        selected = choose_subject([values], [], 320, 240)
        assert selected.reason_code == "invalid_mesh"
        assert selected.index is None


def test_out_of_frame_selected_face_returns_typed_reason() -> None:
    missing = choose_subject([mesh(1.11)], [], 320, 240)
    assert missing.reason_code == "mesh_out_of_frame"
    assert missing.index is None


def test_low_confidence_affects_selected_subject_only() -> None:
    main = mesh(0.28, rx=0.15)
    small = mesh(0.78, rx=0.07)
    proposals = [box(0.28, width=130, height=110, score=.5),
                 box(0.78, width=65, height=105, score=.95)]
    refused = choose_subject([main, small], proposals, 320, 240)
    assert refused.reason_code == "low_confidence"
    assert refused.index is None
    selected = choose_subject([main, small], proposals, 320, 240, chosen_index=1)
    assert selected.index == 1
    assert selected.score == .95


def test_app_and_runner_select_the_same_mesh_in_one_photo() -> None:
    models = [mesh(.2, rx=.16), mesh(.49, rx=.1), mesh(.83, rx=.07)]
    found = from_detection(DetectionResult(faces=models), 320, 240)
    primary = choose_subject(models, [], 320, 240)
    assert primary.index == found.choices.primary.index
    assert found.mesh(found.choices.primary) is not None
    for index in range(3):
        by_tap = found.select(index)
        assert np.array_equal(found.mesh(by_tap), models[index])


def test_blank_frame_has_no_face_and_no_possible_edit() -> None:
    selected = choose_subject([], [], 320, 240)
    assert selected.index is None
    assert selected.reason_code == "no_face"
    result = from_detection(DetectionResult(boxes=[box(.5)]), 320, 240)
    assert result.choices.primary.index is None
    assert result.mesh(result.choices.primary) is None


def _mask(height: int, width: int, x0: int, x1: int) -> np.ndarray:
    region = np.zeros((height, width), dtype=np.float32)
    region[12:88, x0:x1] = 1.0
    return region


@pytest.mark.parametrize("selected", [0, 1])
def test_edit_preserves_every_bystander_byte_outside_reviewed_margin(
    selected: int,
) -> None:
    height, width = 100, 160
    rng = np.random.default_rng(1001)
    original = rng.integers(0, 256, (height, width, 4), dtype=np.uint8)
    edited = np.full_like(original, [255, 180, 40, 255])
    first_mask = _mask(height, width, 12, 70)
    second_mask = _mask(height, width, 92, 145)
    masks = (first_mask, second_mask)
    chosen = masks[selected]
    bystander = masks[1 - selected]
    actual = compose_selected(original, edited, chosen, [bystander])
    assert actual.dtype == np.uint8
    # This margin is intentionally larger than the reviewed feather boundary.
    margin = 4
    protected = np.asarray(bystander > 0)
    expanded = protected.copy()
    for distance in range(1, margin + 1):
        expanded[:, distance:] |= protected[:, :-distance]
        expanded[:, :-distance] |= protected[:, distance:]
    np.testing.assert_array_equal(actual[expanded], original[expanded])
    np.testing.assert_array_equal(actual[:, :, 3], original[:, :, 3])
    assert np.any(actual[chosen > 0, :3] != original[chosen > 0, :3])


def test_a_missing_semantic_region_cannot_use_a_face_box_as_a_mask() -> None:
    photo = np.full((100, 160, 3), 75, np.uint8)
    with pytest.raises(ValueError, match="selected person"):
        compose_selected(photo, np.full_like(photo, 200), np.zeros((100, 160)))


def test_all_protected_region_does_not_edit_bystanders() -> None:
    original = np.full((100, 160, 3), 80, np.uint8)
    mask = np.ones((100, 160), dtype=np.float32)
    resulting = compose_selected(original, np.full_like(original, 240), mask, [mask])
    np.testing.assert_array_equal(resulting, original)


def test_selection_reports_only_counts_without_face_coordinates() -> None:
    item = choose_subject([mesh(.5)], [], 320, 240)
    assert item.index == 0
    assert item.area is not None
    # Count-only receipts consume code and candidates, not the private geometry.
    receipt = {"code": item.reason_code, "faces": item.candidates,
               "bystanders": item.other_faces}
    assert set(receipt) == {"code", "faces", "bystanders"}
    assert all(not isinstance(value, (np.ndarray, FaceBox)) for value in receipt.values())

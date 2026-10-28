"""Independent multi-person pixel safety on synthetic, hand-drawn byte planes."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from plumb_api.vision.box_first import FaceBox
from plumb_api.vision.face_region_audit import MAX_PIXELS, audit
from plumb_api.vision.face_session import FaceSession

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "parity" / "face-region-audit.json"


def photo(channels: int = 4) -> np.ndarray:
    image = np.full((4, 6, channels), 50, dtype=np.uint8)
    if channels == 4:
        image[..., 3] = 70
    return image


def masks() -> tuple[np.ndarray, np.ndarray]:
    selected = np.zeros((4, 6), dtype=np.float32)
    selected[1:3, 1:5] = 1
    protected = np.zeros_like(selected)
    protected[:, 4:] = 1
    return selected, protected


def changed(coordinates: tuple[int, int], *, channels: int = 4,
            channel: int = 0) -> np.ndarray:
    output = photo(channels)
    y, x = coordinates
    output[y, x, channel] = 200
    return output


@pytest.mark.parametrize("channels", [3, 4])
def test_only_one_selected_rgb_pixel_changed(channels: int) -> None:
    selected, bystander = masks()
    result = audit(photo(channels), changed((1, 2), channels=channels), selected, [bystander])
    assert result.passed
    assert result.status == "isolated"
    assert result.selected_pixels == 6
    assert result.protected_pixels == 8
    assert result.changed_in_selection == 1
    assert result.changed_outside_selection == 0
    assert result.changed_bystanders == 0
    assert result.changed_alpha == 0


def test_bystander_change_is_a_failure_even_if_face_is_selected() -> None:
    selected, bystander = masks()
    changed_image = changed((2, 4))
    result = audit(photo(), changed_image, selected, [bystander])
    assert not result.passed
    assert result.status == "isolation_failed"
    assert result.changed_in_selection == 0
    assert result.changed_outside_selection == 1
    assert result.changed_bystanders == 1


def test_outside_mask_change_is_a_failure_without_bystander_label() -> None:
    selected, bystander = masks()
    result = audit(photo(), changed((0, 0)), selected, [bystander])
    assert result.changed_outside_selection == 1
    assert result.changed_bystanders == 0
    assert not result.passed


def test_alpha_change_can_never_be_certified() -> None:
    selected, bystander = masks()
    result = audit(photo(), changed((1, 2), channel=3), selected, [bystander])
    assert result.changed_alpha == 1
    assert result.changed_outside_selection == 0
    assert not result.passed


def test_selection_entirely_protected_cannot_be_success() -> None:
    selected, bystander = masks()
    fully_protected = bystander.copy()
    result = audit(photo(), photo(), fully_protected, [bystander])
    assert result.status == "selection_fully_protected"
    assert result.selected_pixels == 0
    assert not result.passed


def test_require_change_is_never_substituted_for_rubric_quality() -> None:
    selected, bystander = masks()
    result = audit(photo(), photo(), selected, [bystander], require_change=True)
    assert result.status == "no_measured_effect"
    assert result.changed_in_selection == 0
    assert not result.passed
    # Ordinary "level 1.0 means no edit" can still be an isolated no-op.
    assert audit(photo(), photo(), selected, [bystander]).passed


@pytest.mark.parametrize("bad", [float("nan"), -0.01, 1.01, float("inf")])
def test_invalid_fraction_is_never_silently_clipped(bad: float) -> None:
    selected, bystander = masks()
    selected[1, 1] = bad
    with pytest.raises(ValueError, match="finite fractions"):
        audit(photo(), photo(), selected, [bystander])


@pytest.mark.parametrize("bad", [float("nan"), -1.0, 2.0])
def test_invalid_bystander_protection_is_not_ignored(bad: float) -> None:
    selected, bystander = masks()
    bystander[0, 5] = bad
    with pytest.raises(ValueError):
        audit(photo(), photo(), selected, [bystander])


def test_invalid_shapes_channels_or_ranges_refuse() -> None:
    selected, bystander = masks()
    original = photo()
    with pytest.raises(ValueError):
        audit(original[:, :-1], original, selected, [bystander])
    with pytest.raises(ValueError):
        audit(original.astype(np.float32), original, selected, [bystander])
    with pytest.raises(ValueError):
        audit(original, original, selected.reshape(-1), [bystander])
    with pytest.raises(ValueError):
        audit(original, original, selected, [bystander[:, :-1]])
    with pytest.raises(ValueError):
        audit(original, original, np.zeros_like(selected))
    with pytest.raises(ValueError):
        audit(original, original, selected, [bystander], require_change=1)
    assert MAX_PIXELS == 16_777_216


def test_does_not_mutate_source_edited_or_masks() -> None:
    selected, bystander = masks()
    original = photo()
    output = changed((1, 2))
    copies = [item.copy() for item in (selected, bystander, original, output)]
    audit(original, output, selected, [bystander])
    for before, after in zip(copies, (selected, bystander, original, output), strict=True):
        np.testing.assert_array_equal(before, after)


def test_count_only_receipt_never_contains_person_or_pixel_bytes() -> None:
    selected, bystander = masks()
    receipt = audit(photo(), changed((1, 2)), selected, [bystander]).counts()
    assert receipt["passed"] is True
    assert receipt["pixels"] == 24
    assert all(type(value) in (str, int, bool) for value in receipt.values())
    assert all(word not in json.dumps(receipt) for word in ("coordinates", "landmarks", "photo", "face_id"))


def test_browser_python_parity_with_predeclared_synthetic_counts() -> None:
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    selected, bystander = masks()
    for scenario in fixture["scenarios"]:
        before = photo(scenario["channels"])
        output = before.copy()
        for entry in scenario["edits"]:
            output[entry["y"], entry["x"], entry["channel"]] = entry["value"]
        result = audit(before, output, selected, [bystander], require_change=scenario["require_change"])
        assert result.counts() == scenario["expected"]


def test_session_records_and_clears_only_count_evidence() -> None:
    session = FaceSession()
    state = session.new_photo([FaceBox(1, 1, 2, 2, .95)], 6, 4)
    selected, bystander = masks()
    session.provide_masks(state.revision, selected, [bystander])
    assert session.audit_counts() is None
    result = session.apply(state.revision, photo(), changed((1, 2)))
    np.testing.assert_array_equal(result[0, 5], photo()[0, 5])
    assert session.audit_counts() is not None
    assert session.audit_counts()["changed_outside_selection"] == 0
    session.new_photo([], 6, 4)
    assert session.audit_counts() is None


def test_session_refuses_entirely_protected_selection() -> None:
    session = FaceSession()
    state = session.new_photo([FaceBox(1, 1, 2, 2, .95)], 6, 4)
    _, bystander = masks()
    session.provide_masks(state.revision, bystander, [bystander])
    with pytest.raises(ValueError, match="selection_fully_protected"):
        session.apply(state.revision, photo(), photo())
    assert session.audit_counts() is None


def test_face_session_never_marks_corrupt_masks_as_reviewed() -> None:
    session = FaceSession()
    initial = session.new_photo([FaceBox(1, 1, 2, 2, .95)], 6, 4)
    selected, bystander = masks()
    errors = [selected[:, :-1], np.zeros_like(selected), selected.astype(np.float64)]
    errors[2][1, 2] = float("nan")
    for invalid in errors:
        with pytest.raises(ValueError):
            session.provide_masks(initial.revision, invalid, [bystander])
        assert session.state().verified_region is False
    bad_other = bystander.copy()
    bad_other[0, 5] = float("inf")
    with pytest.raises(ValueError):
        session.provide_masks(initial.revision, selected, [bad_other])
    assert session.state().verified_region is False
    assert session.audit_counts() is None

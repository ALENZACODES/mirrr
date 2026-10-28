"""Synthetic session lifetime and immutable bystander-boundary tests."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.vision.box_first import FaceBox
from plumb_api.vision.face_session import FaceSession


def boxes() -> list[FaceBox]:
    return [FaceBox(5, 5, 15, 16), FaceBox(24, 10, 7, 8)]


def masks() -> tuple[np.ndarray, np.ndarray]:
    a = np.zeros((32, 40), dtype=np.float32)
    b = np.zeros((32, 40), dtype=np.float32)
    a[2:30, 2:29] = 1
    b[:, 25:] = 1
    return a, b


def test_new_photo_selects_largest_and_does_not_claim_a_mask() -> None:
    session = FaceSession()
    state = session.new_photo(boxes(), 40, 32)
    assert state.chosen == 0
    assert state.face_count == 2
    assert not state.verified_region


def test_tap_other_face_requires_new_verified_mask() -> None:
    session = FaceSession()
    initial = session.new_photo(boxes(), 40, 32)
    a, b = masks()
    session.provide_masks(initial.revision, a, [b])
    assert session.state().verified_region
    state = session.tap(.67, .45)
    assert state.chosen == 1
    assert state.verified_region is False
    with pytest.raises(ValueError):
        session.apply(state.revision, np.zeros((32, 40, 3), dtype=np.uint8),
                      np.zeros((32, 40, 3), dtype=np.uint8))


def test_copying_masks_prevents_late_caller_mutation() -> None:
    session = FaceSession()
    state = session.new_photo(boxes(), 40, 32)
    a, b = masks()
    session.provide_masks(state.revision, a, [b])
    a[:] = 0
    b[:] = 0
    source = np.full((32, 40, 3), 80, dtype=np.uint8)
    edited = np.full_like(source, 200)
    out = session.apply(state.revision, source, edited)
    assert np.array_equal(out[:, 25:], source[:, 25:])
    assert out[15, 10, 0] == 200
    assert np.array_equal(source, np.full_like(source, 80))


def test_changed_photo_refuses_old_masks_and_pixel_results() -> None:
    session = FaceSession()
    state = session.new_photo(boxes(), 40, 32)
    a, b = masks()
    session.provide_masks(state.revision, a, [b])
    new_state = session.new_photo([], 40, 32)
    assert new_state.chosen is None
    assert new_state.code == "no_face_found"
    with pytest.raises(ValueError):
        session.provide_masks(state.revision, a, [b])
    with pytest.raises(ValueError):
        session.apply(state.revision, np.zeros((32, 40, 3), np.uint8),
                      np.zeros((32, 40, 3), np.uint8))


def test_clear_resets_every_sensitive_reference() -> None:
    session = FaceSession()
    state = session.new_photo(boxes(), 40, 32)
    a, b = masks()
    session.provide_masks(state.revision, a, [b])
    session.clear()
    cleared = session.state()
    assert cleared.chosen is None and cleared.face_count == 0
    assert not cleared.verified_region and cleared.revision > state.revision

"""R28c observed-brow preview behaviour on artificial, non-person pixels.

No medical, biometric or physical brow-growth inferences are made.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.brows.trial import (
    BrowObservation,
    BrowTrialSession,
    GuardDecision,
    PixelGuard,
    checked_box,
    checked_level,
)
from tests.r28c_brow_vectors import DrawnBrowSource, drawn_brows, vectors


@pytest.mark.parametrize("level", [1.0, 1.1, 1.2, 2.0, 3.5, 4.9, 5.0])
def test_decimal_strength_levels(level: float) -> None:
    assert checked_level(level) == level


@pytest.mark.parametrize("bad", [0, 0.95, 1.05, 2.25, 5.1, True, "2.0", float("nan")])
def test_unrepresentable_strength_is_refused(bad: object) -> None:
    with pytest.raises(ValueError, match="level"):
        checked_level(bad)


@pytest.mark.parametrize("box", [(-0.1, 0, 1, 1), (0, 0, 0, 1), (0, 0, 1.1, 1)])
def test_invalid_primary_face_is_rejected(box: tuple[float, ...]) -> None:
    with pytest.raises(ValueError, match="primary face"):
        checked_box(box)


@pytest.mark.parametrize("mode", ["tint", "powder", "lamination"])
@pytest.mark.parametrize("hidden", [None, "right", "left"])
@pytest.mark.parametrize("channels", [3, 4])
def test_two_brow_preview_is_masked_and_alpha_safe(
    mode: str, hidden: str | None, channels: int,
) -> None:
    before, observation = drawn_brows(channels, hidden, True, base=160)
    source = DrawnBrowSource(observation)
    session = BrowTrialSession(source)
    result = session.render(before, box=(0, 0, 1, 1), mode=mode, level=5)
    assert result.status == "rendered"
    assert result.guard_called
    assert result.visible_brows == (1 if hidden else 2)
    assert result.changed_pixels > 0
    assert source.calls == 1
    assert "simulation" in result.label.lower()
    support = np.zeros(before.shape[:2], dtype=np.bool_)
    for alpha in observation.masks.values():
        support |= alpha >= 0.5
    assert observation.protected is not None
    support &= observation.protected < 0.5
    np.testing.assert_array_equal(before[~support], result.image[~support])
    if channels == 4:
        np.testing.assert_array_equal(before[..., 3], result.image[..., 3])
    assert result.safe_report()["quality_verdict"] == "UNPROVEN"


def test_missing_primary_face_has_no_observation_side_effect() -> None:
    frame, observed = drawn_brows()
    source = DrawnBrowSource(observed)
    result = BrowTrialSession(source).render(frame, box=None)
    assert result.status == "no_mesh"
    assert source.calls == 0
    np.testing.assert_array_equal(result.image, frame)


@pytest.mark.parametrize("missing", ["right", "left"])
def test_visible_brow_without_support_fails_atomically(missing: str) -> None:
    frame, observed = drawn_brows()
    observed.masks[missing + "_brow"][:] = 0
    result = BrowTrialSession(DrawnBrowSource(observed)).render(frame, box=(0, 0, 1, 1))
    assert result.status == "refused"
    assert result.reason == "unexplained_missing_brow"
    np.testing.assert_array_equal(result.image, frame)


def test_contradictory_hidden_brow_fails_atomically() -> None:
    frame, observed = drawn_brows()
    states = {**observed.states, "right_brow": "not_visible:occluded"}
    contradictory = replace(observed, states=states)
    result = BrowTrialSession(DrawnBrowSource(contradictory)).render(frame, box=(0, 0, 1, 1))
    assert result.status == "refused"
    np.testing.assert_array_equal(frame, result.image)


def test_overlapping_masks_are_rejected() -> None:
    frame, observed = drawn_brows()
    observed.masks["left_brow"][11:13, 9:13] = 1
    result = BrowTrialSession(DrawnBrowSource(observed)).render(frame, box=(0, 0, 1, 1))
    assert result.reason == "overlapping_brow_masks"
    np.testing.assert_array_equal(frame, result.image)


def test_no_visible_brow_is_not_a_success() -> None:
    frame, observed = drawn_brows(hidden="right")
    observed.masks["left_brow"][:] = 0
    states = {key: "not_visible:hidden_by_turn" for key in observed.states}
    result = BrowTrialSession(DrawnBrowSource(replace(observed, states=states))).render(
        frame, box=(0, 0, 1, 1),
    )
    assert result.status == "no_observation"
    assert result.changed_pixels == 0


def test_other_face_is_untouched_and_out_of_box_mask_refused() -> None:
    frame, observed = drawn_brows()
    session = BrowTrialSession(DrawnBrowSource(observed))
    result = session.render(frame, box=(0, 0, 0.5, 1))
    assert result.reason == "brow_outside_primary_face"
    np.testing.assert_array_equal(frame, result.image)


class UntrustedGuard:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        image = np.zeros_like(before)
        return GuardDecision(image, 0.0, True)


def test_invalid_guard_cannot_overwrite_other_person_or_alpha() -> None:
    frame, observed = drawn_brows(4)
    result = BrowTrialSession(DrawnBrowSource(observed), UntrustedGuard()).render(
        frame, box=(0, 0, 1, 1),
    )
    assert result.status == "rendered"
    support = (observed.masks["right_brow"] >= 0.5) | (observed.masks["left_brow"] >= 0.5)
    np.testing.assert_array_equal(frame[~support], result.image[~support])
    np.testing.assert_array_equal(frame[..., 3], result.image[..., 3])


def test_default_identity_guard_caps_large_change_more_than_lowered_lock() -> None:
    frame = np.full((16, 16, 3), 220, dtype=np.uint8)
    proposed = np.zeros_like(frame)
    guard = PixelGuard()
    strict = guard.guard(frame, proposed, 5.0)
    relaxed = guard.guard(frame, proposed, 2.0)
    assert np.max(frame - strict.image) <= 12
    assert np.max(frame - relaxed.image) <= 42
    assert np.sum(relaxed.image) < np.sum(strict.image)
    assert strict.limited and relaxed.limited


def test_repeated_levels_reuse_masks_until_revision_changes() -> None:
    frame, observed = drawn_brows()
    source = DrawnBrowSource(observed)
    session = BrowTrialSession(source)
    for level in (1.0, 2.0, 2.5, 3.5, 5.0):
        result = session.render(frame, box=(0, 0, 1, 1), level=level)
        assert result.guard_called
    assert source.calls == 1
    assert session.mask_computations == 1
    session.render(frame, box=(0, 0, 1, 1), revision="corrected")
    assert source.calls == 2
    session.invalidate()
    assert session.retained_observations == 0


def test_fixture_parity_vectors_remain_self_consistent() -> None:
    assert len(vectors()) == 8
    for item in vectors():
        assert item["status"] in ("rendered", "neutral")
        assert item["guard_called"] is True


@pytest.mark.parametrize("bad", [float("nan"), -0.1, 1.1, float("inf")])
def test_identity_guard_rejects_nonfinite_or_unbounded_evidence(bad: float) -> None:
    frame, observed = drawn_brows()

    class UnreliableGuard:
        def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
            return GuardDecision(after, bad, False)

    with pytest.raises(ValueError, match="identity guard"):
        BrowTrialSession(DrawnBrowSource(observed), UnreliableGuard()).render(
            frame, box=(0, 0, 1, 1),
        )


def test_replacement_buffer_does_not_reuse_another_photos_observation() -> None:
    frame, observed = drawn_brows()
    source = DrawnBrowSource(observed)
    session = BrowTrialSession(source)
    session.render(frame, box=(0, 0, 1, 1))
    other = frame.copy()
    other[0, 0, 0] = 0
    session.render(other, box=(0, 0, 1, 1))
    assert session.mask_computations == 2


def test_mask_provider_cannot_mutate_callers_original_photo() -> None:
    frame, observed = drawn_brows(4)
    original = frame.copy()

    class MutatingSource:
        def observe(self, digest: str, photo: np.ndarray) -> BrowObservation:
            photo[:] = 0
            return observed

    result = BrowTrialSession(MutatingSource()).render(frame, box=(0, 0, 1, 1))
    np.testing.assert_array_equal(frame, original)
    assert result.status == "rendered"
    np.testing.assert_array_equal(result.image[0], original[0])

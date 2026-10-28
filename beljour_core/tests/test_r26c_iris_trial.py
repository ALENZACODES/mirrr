"""Synthetic observed-iris renderer, scope, guard and cache regressions.

Every image is drawn numerically in memory. Author: John Khan.
"""

from __future__ import annotations

import hashlib

import numpy as np
import pytest

from plumb_api.engines.eyes.iris_trial import (
    IrisObservation,
    IrisTrialEngine,
    PixelLimitGuard,
    checked_box,
    checked_level,
    face_support,
    legacy_strength,
)
from tests.r26c_iris_cases import Observed, SpyGuard, scene


@pytest.mark.parametrize("level", [1.0, 1.1, 1.2, 1.9, 2.0, 3.5, 4.9, 5.0])
def test_valid_decimal_levels_have_documented_mapping(level: float) -> None:
    assert checked_level(level) == level
    assert legacy_strength(level) == pytest.approx((level - 1) * 25)


@pytest.mark.parametrize(
    "bad", [0, 0.95, 1.05, 2.25, 5.1, -1, float("nan"), float("inf"), True, "3.5"]
)
def test_off_grid_or_non_numeric_levels_are_rejected(bad: object) -> None:
    with pytest.raises(ValueError, match="level"):
        checked_level(bad)


@pytest.mark.parametrize("background", [17, 67, 113, 183, 236])
@pytest.mark.parametrize("hidden", [None, "left", "right"])
def test_visible_irises_are_edited_without_touching_other_pixels(
    background: int, hidden: str | None,
) -> None:
    image, observation = scene(background, hidden=hidden)
    source = Observed(observation)
    guard = SpyGuard()
    engine = IrisTrialEngine(source, guard)
    result = engine.render(image, box=(0.02, 0.03, 0.98, 0.97), level=5.0)
    assert result.status == "rendered"
    assert result.changed_pixels > 0
    assert result.guard_called
    assert guard.calls == 1
    assert source.calls == 1
    assert result.visible_irises == (1 if hidden else 2)
    assert "simulation" in result.simulation_label.lower()
    np.testing.assert_array_equal(result.image[0], image[0])
    np.testing.assert_array_equal(result.image[17, 20], image[17, 20])
    np.testing.assert_array_equal(result.image[17, 58], image[17, 58])
    masks = list(observation.masks.values())
    selected = (masks[0] >= 0.5) | (masks[1] >= 0.5)
    np.testing.assert_array_equal(result.image[~selected], image[~selected])
    assert not np.shares_memory(result.image, image)
    report = result.safe_report()
    assert "image" not in report
    assert "identity" not in report
    assert report["quality_verdict"] == "UNPROVEN"


@pytest.mark.parametrize("hidden", [None, "left", "right"])
def test_level_one_is_byte_identical_but_still_invokes_guard(hidden: str | None) -> None:
    image, observation = scene(90, hidden=hidden)
    spy = SpyGuard()
    result = IrisTrialEngine(Observed(observation), spy).render(
        image, box=(0, 0, 1, 1), level=1.0,
    )
    assert result.status == "neutral"
    assert result.guard_called
    assert spy.calls == 1
    assert result.changed_pixels == 0
    np.testing.assert_array_equal(result.image, image)


def test_no_primary_face_is_a_refusal_without_mask_computation() -> None:
    image, observation = scene()
    source = Observed(observation)
    engine = IrisTrialEngine(source)
    result = engine.render(image, box=None)
    assert result.status == "no_mesh"
    assert result.changed_pixels == 0
    assert not result.guard_called
    assert source.calls == 0
    np.testing.assert_array_equal(result.image, image)


@pytest.mark.parametrize("bad", [(0, 0, 0, 1), (-0.1, 0, 1, 1), (0.5, 0, 0.4, 1)])
def test_invalid_primary_scope_never_invokes_mask_provider(bad: tuple[float, ...]) -> None:
    image, observation = scene()
    source = Observed(observation)
    with pytest.raises(ValueError, match="primary face"):
        IrisTrialEngine(source).render(image, box=bad)
    assert source.calls == 0


def test_two_face_input_only_changes_selected_primary_support() -> None:
    image, observation = scene()
    source = Observed(observation)
    box = (0.01, 0.01, 0.52, 0.97)
    response = IrisTrialEngine(source).render(image, box=box)
    assert response.status == "refused"
    assert response.reason == "iris_outside_primary_face"
    np.testing.assert_array_equal(response.image, image)
    primary = face_support(image.shape[:2], checked_box(box))
    assert primary[20, 21] and not primary[20, 59]


def test_cache_reuses_observations_across_five_levels() -> None:
    image, observation = scene()
    source = Observed(observation)
    engine = IrisTrialEngine(source)
    for level in (1.0, 2.0, 2.5, 3.5, 5.0):
        engine.render(image, box=(0, 0, 1, 1), level=level)
    assert source.calls == 1
    assert engine.mask_computations == 1
    assert engine.retained_observations == 1


def test_manual_mask_correction_is_reflected_only_after_invalidation() -> None:
    image, observation = scene()
    source = Observed(observation)
    engine = IrisTrialEngine(source)
    original = engine.render(image, box=(0, 0, 1, 1))
    assert original.visible_irises == 2
    observation.masks["right_iris"][:] = 0.0
    observed_revised = IrisObservation(
        observation.masks,
        {**observation.states, "right_iris": "not_visible:closed"},
    )
    source.observation = observed_revised
    old = engine.render(image, box=(0, 0, 1, 1))
    assert old.visible_irises == 2
    digest = hashlib.sha256(np.ascontiguousarray(image).tobytes()).hexdigest()
    engine.invalidate(digest)
    revised = engine.render(image, box=(0, 0, 1, 1))
    assert revised.visible_irises == 1
    assert source.calls == 2
    assert revised.changed_pixels < original.changed_pixels


def test_cache_is_bounded_and_replacement_photo_makes_new_observation() -> None:
    image, observation = scene()
    source = Observed(observation)
    engine = IrisTrialEngine(source, max_entries=2)
    for step in range(5):
        changed = image.copy()
        changed[0, 0, 0] = np.uint8(step)
        engine.render(changed, box=(0, 0, 1, 1))
    assert source.calls == 5
    assert engine.mask_computations == 5
    assert engine.retained_observations == 2
    engine.invalidate()
    assert engine.retained_observations == 0


@pytest.mark.parametrize("bad", [float("nan"), -0.5, 1.01, float("inf")])
def test_invalid_source_alpha_fails_closed(bad: float) -> None:
    image, observation = scene()
    observation.masks["left_iris"][20, 59] = bad
    with pytest.raises(ValueError, match="alpha"):
        IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1))


def test_invalid_side_state_is_not_promoted_to_visible() -> None:
    image, observation = scene()
    states = dict(observation.states)
    states["right_iris"] = "unknown"
    measured = IrisObservation(observation.masks, states)
    with pytest.raises(ValueError, match="visibility state"):
        IrisTrialEngine(Observed(measured)).render(image, box=(0, 0, 1, 1))


def test_malicious_guard_cannot_touch_background_pupils_catchlights_or_alpha() -> None:
    image, observation = scene(channels=4)
    def whitewash(before: np.ndarray, after: np.ndarray) -> np.ndarray:
        return np.full_like(before, 255)
    spy = SpyGuard(whitewash)
    result = IrisTrialEngine(Observed(observation), spy).render(
        image, box=(0, 0, 1, 1), level=5.0,
    )
    assert result.guard_called and result.changed_pixels > 0
    np.testing.assert_array_equal(result.image[..., 3], image[..., 3])
    np.testing.assert_array_equal(result.image[0, :], image[0, :])
    np.testing.assert_array_equal(result.image[17, 20], image[17, 20])
    np.testing.assert_array_equal(result.image[17, 58], image[17, 58])


@pytest.mark.parametrize("level", [2.0, 4.0, 5.0])
def test_default_pixel_guard_constrains_absolute_rgb_change(level: float) -> None:
    image, observation = scene(93)
    guard = PixelLimitGuard()
    trial = IrisTrialEngine(Observed(observation), guard).render(
        image, box=(0, 0, 1, 1), level=level,
    )
    assert trial.guard_called
    assert trial.similarity is not None
    assert trial.similarity <= 1
    assert trial.changed_pixels > 0


def test_preview_resizes_only_the_output_and_full_size_stays_available() -> None:
    image, observation = scene()
    engine = IrisTrialEngine(Observed(observation))
    low = engine.render(image, box=(0, 0, 1, 1), preview_edge=24)
    full = engine.render(image, box=(0, 0, 1, 1))
    assert low.width == 24 and low.height < image.shape[0]
    assert full.width == image.shape[1] and full.height == image.shape[0]
    assert full.changed_pixels == low.changed_pixels
    assert engine.mask_computations == 1
    assert not np.shares_memory(full.image, image)


@pytest.mark.parametrize("bad", [0, 15, 4097, 24.5, True])
def test_invalid_preview_edge_is_rejected_before_reading_masks(bad: object) -> None:
    image, observation = scene()
    with pytest.raises(ValueError, match="preview_edge"):
        IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1), preview_edge=bad)


@pytest.mark.parametrize("bad", [True, "3.0", 0.1, 5.1, 2.25, float("inf")])
def test_invalid_lock_levels_are_never_silently_lifted(bad: object) -> None:
    image, observation = scene()
    with pytest.raises(ValueError, match="level"):
        IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1), lock_level=bad)


@pytest.mark.parametrize("target", ["left", "right"])
def test_one_visible_eye_with_a_valid_closed_or_hidden_state(target: str) -> None:
    image, observation = scene(70, hidden=target)
    result = IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1))
    assert result.status == "rendered" and result.visible_irises == 1
    assert result.undeclared_missing == ()
    assert target in result.declared_not_visible[0]


def test_both_hidden_irises_never_result_in_success() -> None:
    image, observation = scene()
    for mask in observation.masks.values():
        mask[:] = 0
    measured = IrisObservation(observation.masks, {
        "right_iris": "not_visible:closed",
        "left_iris": "not_visible:hidden_by_turn",
    })
    result = IrisTrialEngine(Observed(measured)).render(image, box=(0, 0, 1, 1))
    assert result.status == "refused"
    assert result.changed_pixels == 0
    np.testing.assert_array_equal(result.image, image)


def test_user_observed_off_axis_pupil_is_protected_even_against_a_hostile_guard() -> None:
    image, observed = scene()
    pupil = {name: np.zeros(image.shape[:2]) for name in observed.masks}
    pupil["right_iris"][20, 16] = 1.0
    pupil["left_iris"][20, 54] = 1.0
    confirmed = IrisObservation(observed.masks, observed.states, pupils=pupil)
    def aggressive(before: np.ndarray, after: np.ndarray) -> np.ndarray:
        return np.full_like(after, 255)
    outcome = IrisTrialEngine(Observed(confirmed), SpyGuard(aggressive)).render(
        image, box=(0, 0, 1, 1), level=5.0,
    )
    assert outcome.guard_called
    np.testing.assert_array_equal(outcome.image[20, 16], image[20, 16])
    np.testing.assert_array_equal(outcome.image[20, 54], image[20, 54])
    assert outcome.changed_pixels > 0


def test_pupil_mask_outside_its_observed_iris_is_refused_before_any_edit() -> None:
    image, observed = scene()
    pupil = {name: np.zeros(image.shape[:2]) for name in observed.masks}
    pupil["right_iris"][0, 0] = 1.0
    confirmed = IrisObservation(observed.masks, observed.states, pupils=pupil)
    with pytest.raises(ValueError, match="pupil"):
        IrisTrialEngine(Observed(confirmed)).render(image, box=(0, 0, 1, 1))

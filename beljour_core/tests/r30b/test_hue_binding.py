"""Skin-hue protection and decimal filter controls, using drawn data only.

These checks cover source masks, optional guard independence, every supported
strength tick, and the one public filter rendering API. Original photographs,
mesh outputs and segmentation masks never leave memory. Author: John Khan.
"""
from __future__ import annotations

import math
from unittest.mock import patch

import numpy as np
import pytest

from plumb_api.filters import engine, strength
from plumb_api.filters.masks import blend, hue_lock
from plumb_api.filters.qa import fixtures
from plumb_api.filters.recipe import registry


@pytest.fixture
def drawn() -> fixtures.Portrait:
    return fixtures.portrait("very_dark", seed=37, width=88, height=104)


def test_every_recipe_defaults_to_identity_lock() -> None:
    catalogue = registry.default()
    ids = catalogue.ids()
    assert len(ids) >= 30
    assert len(ids) == len(set(ids))
    for rid in ids:
        recipe = catalogue.get(rid)
        for guard in (False, True):
            policy = engine.plan(recipe, engine.Settings(guard=guard), has_skin=True)
            assert policy.identity_lock is True, rid
            assert policy.guard is guard, rid
        unlocked = engine.plan(
            recipe,
            engine.Settings(identity_lock=False),
            has_skin=True,
        )
        assert unlocked.identity_lock is False


def test_strengths_expose_exactly_41_checked_decimal_ticks() -> None:
    levels = strength.level_values()
    assert len(levels) == 41
    assert levels[0] == 1.0
    assert levels[-1] == 5.0
    assert len(set(levels)) == 41
    for tenths in range(10, 51):
        level = tenths / 10
        assert levels[tenths - 10] == level
        assert strength.checked_level(level) == level
        assert strength.to_percent(level) == level * 20.0
        assert strength.from_percent(level * 20.0) == level
    assert strength.to_percent(1.0) > 0
    assert strength.to_percent(5.0) == 100.0
    assert strength.from_percent(0.0) == 1.0


@pytest.mark.parametrize(
    "value",
    [float("nan"), math.inf, -math.inf, 0.0, 0.9, 1.05, 2.06, 2.500000002, 5.1, 6.0, True, False],
)
def test_strength_rejects_non_decimal_or_invalid_input(value: float) -> None:
    with pytest.raises(ValueError, match="filter level"):
        strength.to_percent(value)


def test_only_explicit_level_controls_override_historical_strength(
    drawn: fixtures.Portrait,
) -> None:
    recipe = registry.default().get("C03")
    assert engine.plan(recipe, engine.Settings(strength=0), has_skin=True).identity
    assert not engine.plan(recipe, engine.Settings(level=1), has_skin=True).identity
    for tenths in (10, 19, 29, 39, 50):
        level = tenths / 10
        actual = engine.plan(recipe, engine.Settings(level=level), has_skin=True)
        assert actual.strength == strength.to_percent(level)
        assert actual.identity_lock
    with pytest.raises(ValueError, match="level or legacy strength"):
        engine.render(
            drawn.image,
            recipe,
            engine.Settings(level=2.0, strength=40.0),
            drawn.masks,
        )


@pytest.mark.parametrize("skin_guard", [True, False])
@pytest.mark.parametrize("identity_lock", [True, False])
@pytest.mark.parametrize("protect_skin", [True, False])
def test_colour_filters_must_check_hue_despite_optional_toggles(
    drawn: fixtures.Portrait,
    skin_guard: bool,
    identity_lock: bool,
    protect_skin: bool,
) -> None:
    recipe = registry.default().get("C03")
    original = drawn.image.copy()
    with patch.object(hue_lock, "clamp_hue", wraps=hue_lock.clamp_hue) as checked:
        result = engine.render(
            drawn.image,
            recipe,
            engine.Settings(
                level=5,
                guard=skin_guard,
                protect_skin=protect_skin,
                identity_lock=identity_lock,
            ),
            drawn.masks,
        )
    assert checked.call_count == 1
    np.testing.assert_array_equal(drawn.image, original)
    assert result.plan.guard is skin_guard
    assert result.plan.identity_lock is identity_lock
    assert result.plan.strength == 100
    assert result.look.shape == original.shape
    assert result.image.shape == original.shape


def test_landmark_face_oval_is_a_hue_protection_fallback(
    drawn: fixtures.Portrait,
) -> None:
    face_oval = drawn.masks.person
    assert face_oval is not None
    only_oval = blend.FilterMasks(None, face_oval, "landmarks")
    assert hue_lock.face_mask(only_oval) is face_oval
    with patch.object(hue_lock, "clamp_hue", wraps=hue_lock.clamp_hue) as checked:
        result = engine.render(
            drawn.image,
            "C03",
            engine.Settings(level=5, guard=False, protect_skin=False),
            only_oval,
        )
    assert checked.call_count == 1
    assert result.plan.fallback is False
    assert result.plan.guard is False
    assert result.plan.identity_lock


def test_generic_person_outline_cannot_masquerade_as_skin(
    drawn: fixtures.Portrait,
) -> None:
    person = drawn.masks.person
    assert person is not None
    segmented = blend.FilterMasks(None, person, "segmenter")
    assert hue_lock.face_mask(segmented) is None
    with patch.object(hue_lock, "clamp_hue", wraps=hue_lock.clamp_hue) as checked:
        result = engine.render(
            drawn.image,
            "C03",
            engine.Settings(level=5, guard=False, protect_skin=False),
            segmented,
        )
    assert checked.call_count == 0
    assert result.plan.fallback is False
    fallback = engine.render(drawn.image, "C03", engine.Settings(level=5), segmented)
    assert fallback.plan.fallback is True
    assert fallback.plan.strength == engine.FALLBACK_STRENGTH


def test_hue_lock_remains_independent_of_lightness_clipping(
    drawn: fixtures.Portrait,
) -> None:
    assert drawn.masks.skin is not None
    before = drawn.image
    styled = np.empty_like(before)
    styled[..., 0] = before[..., 2]
    styled[..., 1] = before[..., 0]
    styled[..., 2] = before[..., 1]
    original = styled.copy()
    restored = hue_lock.clamp_hue(before, styled, drawn.masks.skin)
    np.testing.assert_array_equal(styled, original)
    assert restored.dtype == np.uint8
    assert restored.shape == before.shape
    outside = np.asarray(drawn.masks.skin) <= 0
    np.testing.assert_array_equal(restored[outside], styled[outside])
    assert np.any(restored != styled)


def test_neutral_identity_does_not_invent_colour(
    drawn: fixtures.Portrait,
) -> None:
    grey = np.mean(drawn.image, axis=-1).astype(np.uint8)
    neutral = np.repeat(grey[..., None], 3, axis=-1)
    source = neutral.copy()
    assert drawn.masks.skin is not None
    corrected = hue_lock.clamp_hue(neutral, neutral, drawn.masks.skin)
    np.testing.assert_array_equal(corrected, source)
    np.testing.assert_array_equal(neutral, source)


def test_legacy_percent_adapter_rejects_boolean_input() -> None:
    for value in (True, False, -0.1, 100.01, float("nan")):
        with pytest.raises(ValueError, match="0..100"):
            strength.from_percent(value)

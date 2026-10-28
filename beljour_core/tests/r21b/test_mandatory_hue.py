"""Hue-only clamp independent of the optional skin guard. Drawn colours only."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.filters import engine, strength
from plumb_api.filters.colour import space
from plumb_api.filters.masks import blend, hue_lock
from plumb_api.filters.recipe import registry


def _fill(value: tuple[int, int, int], size: int = 48) -> np.ndarray:
    return np.tile(np.asarray(value, dtype=np.uint8), (size, size, 1))


def _skin(size: int = 48) -> np.ndarray:
    mask = np.zeros((size, size), dtype=np.float64)
    mask[8:40, 10:38] = 1.0
    mask[7, 10:38] = 0.25
    return mask


def _shifted(source: np.ndarray, degrees: float) -> np.ndarray:
    lab = space.srgb_to_lab(space.bytes_to_unit(source))
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    hue = np.arctan2(lab[..., 2], lab[..., 1]) + np.radians(degrees)
    lab[..., 1] = chroma * np.cos(hue)
    lab[..., 2] = chroma * np.sin(hue)
    return space.unit_to_bytes(space.lab_to_srgb(lab))


def _turn(before: np.ndarray, after: np.ndarray, where: np.ndarray) -> float:
    b = space.srgb_to_lab(space.bytes_to_unit(before))
    a = space.srgb_to_lab(space.bytes_to_unit(after))
    hb = np.degrees(np.arctan2(b[..., 2], b[..., 1]))
    ha = np.degrees(np.arctan2(a[..., 2], a[..., 1]))
    return float(np.abs(space.wrap_degrees(ha - hb))[where].mean())


def test_hue_mask_clamps_a_large_rotation_even_without_a_skin_guard() -> None:
    source = _fill((185, 125, 92))
    looked = _shifted(source, 58)
    mask = _skin()
    actual = hue_lock.clamp_hue(source, looked, mask)
    assert _turn(source, looked, mask >= 0.5) > 30
    assert _turn(source, actual, mask >= 0.5) <= hue_lock.HUE_MAX + 1.0
    np.testing.assert_array_equal(actual[mask == 0], looked[mask == 0])
    assert np.any(actual[mask >= 0.5] != looked[mask >= 0.5])
    np.testing.assert_array_equal(source, _fill((185, 125, 92)))


def test_hue_lock_preserves_neutral_mono_and_empty_masks() -> None:
    source = _fill((194, 129, 95))
    mono = _fill((123, 123, 123))
    np.testing.assert_array_equal(hue_lock.clamp_hue(source, mono, _skin()), mono)
    np.testing.assert_array_equal(hue_lock.clamp_hue(source, _shifted(source, 60), None), _shifted(source, 60))
    np.testing.assert_array_equal(hue_lock.clamp_hue(source, _shifted(source, 60), np.zeros((48, 48))),
                                  _shifted(source, 60))


def test_strict_input_validation_refuses_mismatched_mask() -> None:
    before = _fill((180, 130, 90))
    after = _shifted(before, 50)
    with pytest.raises(ValueError):
        hue_lock.clamp_hue(before, after, _skin(32))
    with pytest.raises(ValueError):
        hue_lock.clamp_hue(before.astype(np.float64), after, _skin())
    with pytest.raises(ValueError):
        hue_lock.clamp_hue(before, after[:, :-1], _skin())


def test_render_has_mandatory_hue_lock_with_guard_disabled() -> None:
    source = _fill((185, 125, 92))
    masks = blend.FilterMasks(_skin(), _skin(), source="landmarks")
    template = registry.default().get("C08")
    look = {**template, "id": "C97", "stages": [{"op": "colour.hsl", "params": {"bands": {
        "orange": {"hue": 45}, "red": {"hue": 45}, "yellow": {"hue": 45}}}}]}
    out = engine.render(source, look, engine.Settings(strength=100, guard=False, identity_lock=False), masks)
    assert out.plan.guard is False
    assert _turn(source, out.look, _skin() >= 0.5) > 10
    assert _turn(source, out.image, _skin() >= 0.5) <= 7
    np.testing.assert_array_equal(out.image[_skin() == 0], out.look[_skin() == 0])


def test_filter_levels_and_identity_default_are_validated() -> None:
    recipe = registry.default().get("C01")
    assert engine.plan(recipe).identity_lock is True
    assert engine.plan(recipe, engine.Settings(level=1.1), has_skin=True).strength == 22
    assert engine.plan(recipe, engine.Settings(level=5.0), has_skin=True).strength == 100
    assert strength.level_values()[0] == 1.0
    assert strength.level_values()[-1] == 5.0
    assert len(strength.level_values()) == 41
    for level in strength.level_values():
        assert strength.checked_level(level) == level
        assert strength.to_percent(level) == pytest.approx(level * 20)
        assert strength.from_percent(strength.to_percent(level)) == level
    assert strength.from_percent(30) == 1.5
    for value in (float("nan"), float("inf"), 0.9, 5.1, 2.05):
        with pytest.raises(ValueError):
            engine.plan(recipe, engine.Settings(level=value))
    with pytest.raises(ValueError):
        engine.plan(recipe, engine.Settings(level=2.0, strength=30.0))


def test_no_lock_without_known_face_or_skin_region() -> None:
    source = _fill((185, 125, 92))
    looked = _shifted(source, 60)
    masks = blend.FilterMasks(skin=None, person=_skin(), source="segmenter")
    assert hue_lock.face_mask(masks) is None
    np.testing.assert_array_equal(hue_lock.clamp_hue(source, looked, hue_lock.face_mask(masks)), looked)
    face = blend.FilterMasks(skin=None, person=_skin(), source="landmarks")
    assert hue_lock.face_mask(face) is not None
    assert np.any(hue_lock.clamp_hue(source, looked, hue_lock.face_mask(face)) != looked)

"""Production face-gate cache safety: byte parity and refusal on stale inputs.

All inputs are generated numeric colour cards and binary/soft masks. No faces or
third-party assets are distributed. The cache is request-local, never global.
"""
from __future__ import annotations

from dataclasses import fields
from unittest.mock import patch

import numpy as np
import pytest

from plumb_api.filters import engine
from plumb_api.filters.colour import space
from plumb_api.filters.masks import hue_lock
from plumb_api.filters.qa import fixtures, still_her
from plumb_api.filters.recipe import registry


def colour_cards(seed: int, width: int = 24, height: int = 28) -> tuple[np.ndarray, np.ndarray]:
    random = np.random.default_rng(seed)
    source = random.integers(40, 212, size=(height, width, 3), dtype=np.uint8)
    source[3:13, 4:16] = (182, 116, 91)
    styled = source.copy()
    styled[3:17, 4:19] = (198, 89, 123)
    return source, styled


def card_mask(width: int = 24, height: int = 28) -> np.ndarray:
    mask = np.zeros((height, width), dtype=np.float64)
    mask[3:15, 4:17] = 1.0
    mask[2, 4:17] = 0.25
    mask[15, 4:17] = 0.5
    return mask


@pytest.mark.parametrize("seed", [0, 3, 17, 93, 311])
def test_cached_hue_reference_is_byte_identical_to_unprepared(seed: int) -> None:
    source, styled = colour_cards(seed)
    mask = card_mask()
    direct = hue_lock.clamp_hue(source, styled, mask)
    prepared = hue_lock.prepare_hue(source, mask)
    cached = hue_lock.clamp_hue(source, styled, mask, prepared)
    np.testing.assert_array_equal(direct, cached)
    assert source.dtype == np.uint8
    assert direct.dtype == np.uint8
    np.testing.assert_array_equal(direct[mask == 0], styled[mask == 0])
    assert prepared.alpha.shape == source.shape[:2]
    assert prepared.selected.shape == source.shape[:2]
    assert int(prepared.selected.sum()) == len(prepared.chroma)
    assert len(prepared.chroma) == len(prepared.hue)


def test_reference_reuse_eliminates_input_side_lab_conversion() -> None:
    source, styled = colour_cards(15)
    mask = card_mask()
    prepared = hue_lock.prepare_hue(source, mask)
    with patch.object(hue_lock.S, "srgb_to_lab", wraps=hue_lock.S.srgb_to_lab) as lab:
        for _ in range(5):
            hue_lock.clamp_hue(source, styled, mask, prepared)
        assert lab.call_count == 5, "only styled output is remeasured per recipe"
    with patch.object(hue_lock.S, "srgb_to_lab", wraps=hue_lock.S.srgb_to_lab) as lab:
        for _ in range(5):
            hue_lock.clamp_hue(source, styled, mask)
        assert lab.call_count == 10, "uncached path measures original and styled"


def test_reference_is_rejected_after_any_image_revision() -> None:
    source, styled = colour_cards(61)
    mask = card_mask()
    prepared = hue_lock.prepare_hue(source, mask)
    edited = source.copy()
    edited[0, 0, 1] ^= 1
    with pytest.raises(ValueError, match="different photo"):
        hue_lock.clamp_hue(edited, styled, mask, prepared)
    np.testing.assert_array_equal(hue_lock.clamp_hue(source, styled, mask, prepared),
                                  hue_lock.clamp_hue(source, styled, mask))
    assert len(prepared.image_digest) == 16
    assert not any(name in {"image", "before", "original", "styled"} for name in
                   [field.name for field in fields(prepared)])


def test_reference_is_rejected_after_any_mask_change() -> None:
    source, styled = colour_cards(51)
    mask = card_mask()
    prepared = hue_lock.prepare_hue(source, mask)
    changed = mask.copy()
    changed[0, 0] = 0.5
    for invalid in (changed, mask.astype(np.float32), np.ones_like(mask) * 0.2):
        with pytest.raises(ValueError, match="different photo"):
            hue_lock.clamp_hue(source, styled, invalid, prepared)
    with pytest.raises(ValueError, match="needs a face"):
        hue_lock.clamp_hue(source, styled, None, prepared)


def test_empty_mask_prepared_reference_is_a_safe_noop() -> None:
    source, styled = colour_cards(90)
    mask = np.zeros(source.shape[:2], dtype=np.float64)
    prepared = hue_lock.prepare_hue(source, mask)
    assert not prepared.selected.any()
    assert prepared.chroma.size == 0
    assert prepared.hue.size == 0
    np.testing.assert_array_equal(hue_lock.clamp_hue(source, styled, mask, prepared), styled)
    np.testing.assert_array_equal(source, colour_cards(90)[0])


@pytest.mark.parametrize("tone", ["very_dark", "dark", "tan", "medium", "light"])
def test_realistic_synthetic_face_pipeline_accepts_one_reference_for_many_recipes(tone: str) -> None:
    portrait = fixtures.portrait(tone, width=96, height=112)
    prepared = still_her.prepare_face(portrait.image, portrait.face.points, portrait.masks)
    assert prepared.hue_source.shape == portrait.image.shape
    for recipe_id in ("C01", "C03", "C05", "C08"):
        recipe = registry.default().get(recipe_id)
        original = engine.render(portrait.image, recipe, masks=portrait.masks,
                                 face_centre=fixtures.face_centre(portrait))
        cached = engine.render(portrait.image, recipe, masks=portrait.masks,
                               face_centre=fixtures.face_centre(portrait), hue_source=prepared.hue_source)
        np.testing.assert_array_equal(original.image, cached.image)
        np.testing.assert_array_equal(original.look, cached.look)
        assert original.plan.key == cached.plan.key


def test_masked_colour_clamp_preserves_original_and_look_buffers() -> None:
    source, styled = colour_cards(77)
    before_copy = source.copy()
    styled_copy = styled.copy()
    mask = card_mask()
    reference = hue_lock.prepare_hue(source, mask)
    result = hue_lock.clamp_hue(source, styled, mask, reference)
    np.testing.assert_array_equal(source, before_copy)
    np.testing.assert_array_equal(styled, styled_copy)
    assert not np.shares_memory(result, source)
    assert not np.shares_memory(result, styled)
    assert not np.shares_memory(reference.alpha, source)
    assert np.all((reference.alpha >= 0) & (reference.alpha <= 1))


def test_clamp_preserves_lightness_and_chroma_for_an_in_gamut_swatch() -> None:
    source = np.full((12, 12, 3), (142, 109, 88), dtype=np.uint8)
    shifted = np.full((12, 12, 3), (139, 97, 115), dtype=np.uint8)
    corrected = hue_lock.clamp_hue(source, shifted, np.ones((12, 12)))
    after_lab = space.srgb_to_lab(space.bytes_to_unit(corrected))[0, 0]
    shifted_lab = space.srgb_to_lab(space.bytes_to_unit(shifted))[0, 0]
    assert abs(after_lab[0] - shifted_lab[0]) < 2.0
    assert abs(np.hypot(*after_lab[1:]) - np.hypot(*shifted_lab[1:])) < 2.0

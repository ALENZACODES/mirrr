"""R25c original-first comparison safety and recipe tests. Author: John Khan."""

from __future__ import annotations

import json

import numpy as np
import pytest

from plumb_api.engines.gender_look.levels import GuardDecision
from plumb_api.engines.hair_women.contracts import HairGeometry
from plumb_api.engines.hair_women.style_compare import StyleChoice, checked_choices, comparison, safe_recipe
from plumb_api.engines.hair_women.style_preview import StyleGuideSession, render_style_guide


class Guard:
    def __init__(self) -> None:
        self.calls = 0

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        self.calls += 1
        return GuardDecision(after.copy(), 1.0, False)


def scene() -> tuple[np.ndarray, np.ndarray, HairGeometry]:
    yy, xx = np.mgrid[:64, :64]
    image = np.zeros((64, 64, 4), dtype=np.uint8)
    image[..., 0] = ((38 + xx + 2 * yy) % 256).astype(np.uint8)
    image[..., 1] = ((78 + xx + yy) % 256).astype(np.uint8)
    image[..., 2] = ((58 + 3 * xx + yy) % 256).astype(np.uint8)
    image[..., 3] = 170
    mask = ((yy > 3) & (yy < 57) & (xx > 5) & (xx < 59)).astype(float)
    head = HairGeometry((.5, .06), (.25, .32), (.75, .32), (.5, .91), .5, .85)
    return image, mask, head


def choices() -> tuple[StyleChoice, ...]:
    return (
        StyleChoice("crescent_pixie", 2.0, "straight"),
        StyleChoice("asymmetric_lob", 3.5, "wavy"),
        StyleChoice("curly_shag", 5.0, "coily"),
    )


def test_original_panel_is_first_immutable_and_not_assigned_a_quality_score() -> None:
    photo, mask, head = scene()
    untouched = photo.copy()
    guard = Guard()
    result = comparison(photo, mask, head, choices(), primary_box=(0, 0, 1, 1), identity_guard=guard)
    assert result.distinct_styles == 3
    assert result.processed == 3
    assert result.refused == 0
    assert result.guard_calls == 3
    assert guard.calls == 3
    assert len(result.panels) == 4
    assert result.panels[0].name == "Original"
    assert result.panels[0].original
    assert result.panels[0].changed_pixel_share == 0
    assert np.array_equal(result.panels[0].image, photo)
    assert np.array_equal(untouched, photo)
    assert "simulation" in result.simulation_label.lower()
    assert all(not panel.original for panel in result.panels[1:])


@pytest.mark.parametrize("use_cache", (False, True))
def test_variants_are_independent_renders_of_original_not_earlier_panel(use_cache: bool) -> None:
    photo, mask, head = scene()
    requested = choices()
    guard = Guard()
    session = StyleGuideSession() if use_cache else None
    board = comparison(photo, mask, head, requested, primary_box=(0, 0, 1, 1),
                       identity_guard=guard, session=session)
    for index, selection in enumerate(requested, 1):
        direct = render_style_guide(photo, mask, head, selection.style, selection.level,
                                    texture=selection.texture, primary_box=(0, 0, 1, 1),
                                    identity_guard=Guard())
        assert np.array_equal(board.panels[index].image, direct.image)
    assert np.array_equal(photo[..., 3], board.panels[-1].image[..., 3])


def test_no_mesh_refuses_each_variant_but_original_is_preserved() -> None:
    photo, mask, _ = scene()
    result = comparison(photo, mask, None, choices(), primary_box=None)
    assert result.refused == 3
    assert result.processed == 0
    assert result.guard_calls == 0
    for panel in result.panels:
        assert np.array_equal(panel.image, photo)


def test_safe_recipe_contains_only_choice_metadata_and_never_a_photo_or_hash() -> None:
    photo, mask, head = scene()
    requested = choices()
    result = comparison(photo, mask, head, requested, primary_box=(0, 0, 1, 1))
    recipe = safe_recipe(result, requested)
    assert set(recipe) == {"format", "simulation", "choices"}
    assert recipe["format"] == "beljour-women-style-choices/1"
    assert recipe["simulation"] is True
    assert len(recipe["choices"]) == 3
    payload = json.dumps(recipe, sort_keys=True)
    assert "base64" not in payload
    assert "image" not in payload
    assert "landmarks" not in payload
    assert "person" not in payload
    assert len(payload) < 512


def test_duplicate_styles_invalid_levels_and_too_many_panels_fail_closed() -> None:
    with pytest.raises(ValueError):
        checked_choices([])
    with pytest.raises(ValueError):
        checked_choices([choices()[0]] * 2)
    with pytest.raises(ValueError):
        checked_choices([*choices(), StyleChoice("long_ribbons", 5.0, "straight"),
                         StyleChoice("twist_taper", 5.0, "coily")])
    with pytest.raises(ValueError):
        checked_choices([StyleChoice("curtain_fringe", 2.25, "curly")])
    with pytest.raises(ValueError):
        checked_choices([StyleChoice("curtain_fringe", 3.5, "unknown")])


def test_recipe_and_panels_must_represent_same_choice_count() -> None:
    photo, mask, head = scene()
    board = comparison(photo, mask, head, choices(), primary_box=(0, 0, 1, 1))
    with pytest.raises(ValueError):
        safe_recipe(board, choices()[:2])


def test_corrected_mask_affects_only_future_panel_renders() -> None:
    photo, mask, head = scene()
    existing = comparison(photo, mask, head, choices(), primary_box=(0, 0, 1, 1))
    corrected = mask.copy()
    corrected[:, :35] = 0
    revised = comparison(photo, corrected, head, choices(), primary_box=(0, 0, 1, 1))
    assert np.array_equal(existing.panels[0].image, revised.panels[0].image)
    assert all(np.array_equal(panel.image[:, :35], photo[:, :35]) for panel in revised.panels)

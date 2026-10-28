"""Every original palette swatch and every short-sides preset across all five stops.

Constructed blocks only; no physical shade or haircut result is claimed. Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.commerce.hair_comparison import compare_levels
from plumb_api.engines.hair_palette import catalogue
from plumb_api.engines.menshair import available_presets
from tests.test_r29f_hair_comparison import HEAD, scene

LIGHT_SKIN, DEEP_SKIN = (205, 177, 145), (61, 43, 36)


def test_all_ninety_swatches_render_five_stops_with_explicit_lightening() -> None:
    image, mask, _ = scene()
    shades = catalogue()
    assert len(shades) == 90
    for shade in shades:
        result = compare_levels(image, mask, HEAD, "palette", shade_id=shade.id, allow_lightening=True)
        statuses = [tile.evidence.status for tile in result.tiles]
        assert statuses[0] == "unchanged", shade.id
        assert result.totals.cases == 5 and result.totals.refused == 0, shade.id
        assert all(tile.evidence.guard_applied for tile in result.tiles), shade.id


def test_without_permission_only_lighter_swatches_are_refused() -> None:
    image, mask, _ = scene()
    refused = 0
    for shade in catalogue():
        result = compare_levels(image, mask, HEAD, "palette", shade_id=shade.id)
        codes = {tile.evidence.refusal_code for tile in result.tiles}
        assert codes in ({None}, {"lightening_not_automatic"}), shade.id
        refused += codes == {"lightening_not_automatic"}
    assert 0 < refused < 90


@pytest.mark.parametrize("skin", [LIGHT_SKIN, DEEP_SKIN])
def test_every_short_sides_preset_runs_five_guarded_stops(skin: tuple[int, int, int]) -> None:
    image, mask, _ = scene()
    image[(mask == 0), :3] = skin
    presets = available_presets()
    assert len(presets) >= 48
    for preset in presets:
        result = compare_levels(image, mask, HEAD, "short-sides", style_id=preset.id)
        changed = [tile.evidence.changed_pixels for tile in result.tiles]
        assert result.totals.refused == 0, preset.id
        assert changed[0] == 0, preset.id
        assert all(tile.evidence.guard_applied for tile in result.tiles), preset.id

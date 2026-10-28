"""R25c women's original style-guide geometry tests. Author: John Khan."""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.hair_women.contracts import HairGeometry
from plumb_api.engines.hair_women.style_guides import (
    DEFINITIONS,
    SIMULATION_LABEL,
    STYLE_KEYS,
    TEXTURES,
    definition,
    fields,
    validate_geometry,
)


def geometry() -> HairGeometry:
    return HairGeometry((0.5, 0.06), (0.25, 0.32), (0.75, 0.32), (0.5, 0.91), 0.5, 0.85)


def test_catalogue_has_distinct_shorts_mids_and_longs_with_specific_guidance() -> None:
    assert len(STYLE_KEYS) == 12
    assert len(set(STYLE_KEYS)) == 12
    assert tuple(row.style_id for row in DEFINITIONS) == STYLE_KEYS
    assert {row.section for row in DEFINITIONS} == {"short", "mid", "long"}
    assert len({row.note for row in DEFINITIONS}) == len(DEFINITIONS)
    assert all(0 < row.highlight <= 20 and 0 < row.shadow <= 20 for row in DEFINITIONS)
    assert all(row.title and row.note and row.title != row.note for row in DEFINITIONS)
    assert "simulation" in SIMULATION_LABEL.lower()
    assert "No new hair" in SIMULATION_LABEL


@pytest.mark.parametrize("style", STYLE_KEYS)
def test_guide_is_finite_bounded_and_does_not_depend_on_photo_colour(style: str) -> None:
    guide = fields(style, geometry(), 64, 64)
    assert guide.zone.shape == (64, 64)
    assert guide.grade.shape == (64, 64)
    assert guide.tone.shape == (64, 64)
    for plane in (guide.zone, guide.grade, guide.tone):
        assert plane.dtype == np.float64
        assert np.all(np.isfinite(plane))
    assert float(np.min(guide.zone)) >= 0
    assert float(np.max(guide.zone)) <= 1
    assert float(np.min(guide.grade)) >= 0
    assert float(np.max(guide.grade)) <= 1
    assert float(np.min(guide.tone)) >= -1
    assert float(np.max(guide.tone)) <= 1
    assert np.count_nonzero(guide.zone) > 0
    assert np.ptp(guide.tone) > 0.04


@pytest.mark.parametrize("style", STYLE_KEYS)
@pytest.mark.parametrize("height", (16, 19, 31))
def test_tile_partition_preserves_full_frame_exactly(style: str, height: int) -> None:
    full = fields(style, geometry(), 64, 64)
    chunks = [fields(style, geometry(), 64, 64, row, min(row + height, 64))
              for row in range(0, 64, height)]
    for name in ("zone", "grade", "tone"):
        reconstructed = np.concatenate([getattr(chunk, name) for chunk in chunks])
        assert np.array_equal(reconstructed, getattr(full, name))


def test_short_side_and_long_hair_fields_are_not_cosmetic_duplicates() -> None:
    signatures = set()
    for style in STYLE_KEYS:
        guide = fields(style, geometry(), 64, 64)
        signature = (
            int(np.count_nonzero(guide.zone)),
            round(float(np.mean(guide.grade)), 6),
            round(float(np.mean(guide.tone)), 6),
        )
        assert signature not in signatures
        signatures.add(signature)


@pytest.mark.parametrize("change", [
    {"crown": (float("nan"), 0.06)},
    {"left_temple": (0.8, 0.32)},
    {"right_temple": (0.3, 0.32)},
    {"chin": (0.5, 0.07)},
    {"crown": (1.4, 0.06)},
])
def test_invalid_head_geometry_fails_closed(change: dict[str, tuple[float, float]]) -> None:
    g = replace(geometry(), **change)
    with pytest.raises(ValueError):
        validate_geometry(g)
    with pytest.raises(ValueError):
        fields("crescent_pixie", g, 64, 64)


@pytest.mark.parametrize("dimensions", [(8, 32), (64, 15), (5000, 5000)])
def test_unsupported_sizes_cannot_allocate_a_guide(dimensions: tuple[int, int]) -> None:
    with pytest.raises(ValueError):
        fields("curtain_fringe", geometry(), *dimensions)


@pytest.mark.parametrize("interval", [(-1, 10), (5, 5), (10, 65), (12, 9)])
def test_invalid_row_intervals_cannot_skip_guarded_tiles(interval: tuple[int, int]) -> None:
    with pytest.raises(ValueError):
        fields("curly_shag", geometry(), 64, 64, *interval)


def test_invalid_style_is_refused_instead_of_falling_back_to_another_recipe() -> None:
    with pytest.raises(ValueError):
        definition("unregistered_look")


def test_texture_labels_cover_all_four_declared_family_inputs() -> None:
    assert TEXTURES == ("straight", "wavy", "curly", "coily")

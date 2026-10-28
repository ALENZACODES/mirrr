"""Design-space size tests: counts come from the grammar, not from guesses.

Author: John Khan.
"""

from __future__ import annotations

import math

from plumb_api.seasonal.cards import OCCASION_IDS, OCCASIONS
from plumb_api.seasonal.cards.design_space import (
    MASKS_BY_LAYOUT,
    all_estimates,
    estimate,
    layout_cells,
    motif_sets,
    palette_orders,
    pattern_cells,
)
from plumb_api.seasonal.cards.fingerprint import NEAR_PARAM
from plumb_api.seasonal.cards.occasions import LAYOUT_IDS
from plumb_api.seasonal.cards.patterns import PATTERN_SPECS


def test_pattern_cells_follow_the_spec_count() -> None:
    per_dim = math.ceil(1 / NEAR_PARAM)
    for family, specs in PATTERN_SPECS.items():
        assert pattern_cells(family) == per_dim ** len(specs)


def test_layout_cells_are_positive_and_grow_with_samples() -> None:
    for layout_id in LAYOUT_IDS:
        small = layout_cells(layout_id, samples=50)
        large = layout_cells(layout_id, samples=400)
        assert 1 <= small <= large <= 400
    assert set(MASKS_BY_LAYOUT) <= set(LAYOUT_IDS)


def test_motif_sets_count_two_to_four_of_n() -> None:
    look = OCCASIONS["halloween"].look("pumpkin_patch")
    n = len(look.motifs)
    assert n == 4
    assert motif_sets(look) == math.comb(4, 2) + math.comb(4, 3) + math.comb(4, 4)


def test_palette_orders_are_bounded_by_permutations() -> None:
    for occasion in OCCASIONS.values():
        for look in occasion.looks:
            count = palette_orders(look, samples=200)
            assert 1 <= count <= len(look.grounds) * 2 * 6


def test_every_occasion_has_room_for_far_more_than_a_million_cards() -> None:
    estimates = all_estimates()
    assert [e.occasion for e in estimates] == list(OCCASION_IDS)
    for item in estimates:
        assert item.log10_designs > 12, item
        assert item.looks == len(item.log10_by_look)
        assert item.log10_designs >= max(item.log10_by_look.values())


def test_more_looks_never_shrink_the_space() -> None:
    halloween = estimate("halloween")
    assert halloween.looks == 5
    biggest_look = max(halloween.log10_by_look.values())
    assert halloween.log10_designs > biggest_look

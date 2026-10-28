"""Design grammar tests: determinism, layout validity, safe areas and ornament collisions.

Author: John Khan.
"""

from __future__ import annotations

import math
import random

import pytest

from plumb_api.seasonal.cards import OCCASION_IDS, OCCASIONS
from plumb_api.seasonal.cards.geometry import Box, circle_hits_box, circles_overlap
from plumb_api.seasonal.cards.grammar import (
    CARD_H,
    CARD_W,
    HEADLINE_MIN,
    HEADLINE_SPAN,
    MIN_ORNAMENT,
    SAFE_FRACTION,
    CardDesign,
    build_layout,
    design_from_seed,
    sub_seed,
)
from plumb_api.seasonal.cards.occasions import LAYOUT_IDS
from plumb_api.seasonal.cards.patterns import PATTERN_SPECS, build_pattern, normalised

CARD = Box(0, 0, CARD_W, CARD_H)


def test_same_seed_gives_identical_frozen_design() -> None:
    a = design_from_seed("halloween", 1234)
    b = design_from_seed("halloween", 1234)
    assert a == b
    assert hash(a) == hash(b)
    assert isinstance(a, CardDesign)
    with pytest.raises(AttributeError):
        a.seed = 5  # type: ignore[misc]


def test_different_seeds_differ() -> None:
    designs = {design_from_seed("diwali", seed) for seed in range(200)}
    assert len(designs) == 200


def test_sub_seeds_are_independent_and_63_bit() -> None:
    values = {sub_seed(7, label) for label in ("layout", "pattern", "palette", "motifs")}
    assert len(values) == 4
    assert all(0 <= v < 2 ** 63 for v in values)
    assert sub_seed(7, "layout") == sub_seed(7, "layout")


def test_look_can_be_pinned() -> None:
    for seed in range(30):
        assert design_from_seed("halloween", seed, "bat_night").look == "bat_night"


def test_every_look_is_reachable_from_seeds() -> None:
    for occasion_id in OCCASION_IDS:
        looks = {design_from_seed(occasion_id, s).look for s in range(120)}
        assert looks == set(OCCASIONS[occasion_id].look_ids), occasion_id


@pytest.mark.parametrize("layout_id", LAYOUT_IDS)
def test_layout_boxes_stay_on_card_and_do_not_overlap(layout_id: str) -> None:
    for seed in range(150):
        layout = build_layout(layout_id, random.Random(seed))
        photo, text = layout.photo_box, layout.text_box
        assert CARD.contains(photo), (layout_id, seed, photo)
        assert CARD.contains(text), (layout_id, seed, text)
        assert not photo.intersects(text), (layout_id, seed)
        assert photo.w > 200 and photo.h > 200
        assert text.h >= CARD_H * 0.16, (layout_id, seed, text)
        assert text.w >= CARD_W * 0.5


def test_unknown_layout_is_rejected() -> None:
    with pytest.raises(ValueError):
        build_layout("diagonal_split", random.Random(0))


def test_circle_and_arch_masks_use_square_and_tall_boxes() -> None:
    for seed in range(50):
        circle = build_layout("circle_badge", random.Random(seed))
        assert circle.photo_shape == "circle"
        assert circle.photo_box.w == pytest.approx(circle.photo_box.h)
        arch = build_layout("arch_window", random.Random(seed))
        assert arch.photo_shape == "arch"
        assert arch.photo_box.h > arch.photo_box.w


@pytest.mark.parametrize("occasion_id", OCCASION_IDS)
def test_ornaments_avoid_photo_text_each_other_and_card_edges(occasion_id: str) -> None:
    safe = CARD.inset(CARD_W * SAFE_FRACTION)
    for seed in range(60):
        design = design_from_seed(occasion_id, seed)
        layout = design.layout
        assert len(design.ornaments) >= 2, (occasion_id, seed)
        discs: list[tuple[float, float, float]] = []
        for o in design.ornaments:
            assert o.size >= MIN_ORNAMENT * CARD_W * 0.72 - 0.01
            radius = o.size * 0.48
            assert safe.inset(-0.6 * o.size).contains_point(o.cx, o.cy)
            assert not circle_hits_box(o.cx, o.cy, radius - 1.0, layout.photo_box)
            assert not circle_hits_box(o.cx, o.cy, radius - 1.0, layout.text_box)
            for other in discs:
                assert not circles_overlap((o.cx, o.cy, radius - 1.0), other)
            discs.append((o.cx, o.cy, radius))


def test_upright_symbols_are_barely_rotated() -> None:
    for seed in range(200):
        for o in design_from_seed("kwanzaa", seed).ornaments:
            if o.motif_id == "kinara":
                assert abs(o.rotation) <= 6.0


@pytest.mark.parametrize("family", sorted(PATTERN_SPECS))
def test_every_pattern_family_builds_and_covers_the_card(family: str) -> None:
    rng = random.Random(3)
    for _ in range(4):
        params = {spec.name: rng.uniform(spec.lo, spec.hi) for spec in PATTERN_SPECS[family]}
        shapes = build_pattern(family, params, CARD_W, CARD_H, 11)
        assert len(shapes) >= 3, family
        assert all(0.0 <= v <= 1.0 for v in normalised(family, params))
        again = build_pattern(family, params, CARD_W, CARD_H, 11)
        assert shapes == again


def test_pattern_parameters_stay_in_range() -> None:
    for occasion_id in OCCASION_IDS:
        for seed in range(30):
            pattern = design_from_seed(occasion_id, seed).pattern
            for spec in PATTERN_SPECS[pattern.family]:
                value = pattern.as_dict()[spec.name]
                assert spec.lo - 1e-9 <= value <= spec.hi + 1e-9


def test_frame_and_text_style_ranges() -> None:
    for seed in range(100):
        design = design_from_seed("new_year", seed)
        assert 14 <= design.frame.inset <= 34
        assert 2 <= design.frame.width <= 7
        assert HEADLINE_MIN <= design.text_style.headline_scale <= HEADLINE_MIN + HEADLINE_SPAN
        assert math.isfinite(design.layout.margin)

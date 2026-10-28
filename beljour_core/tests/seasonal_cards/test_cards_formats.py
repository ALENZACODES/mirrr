"""Share format tests: portrait, square and story cards.

Author: John Khan.
"""

from __future__ import annotations

import io

import pytest
from PIL import Image

from plumb_api.seasonal.cards import DesignStore, export_png, make_another, make_card
from plumb_api.seasonal.cards.access import worst_contrast
from plumb_api.seasonal.cards.fingerprint import design_key
from plumb_api.seasonal.cards.geometry import Box, circle_hits_box
from plumb_api.seasonal.cards.grammar import CARD_FORMATS, design_from_seed, format_of
from plumb_api.seasonal.cards.printing import DPI, print_image, trim_box
from plumb_api.seasonal.cards.service import card_composition
from plumb_api.seasonal.cards.synthetic import synthetic_portrait

FORMATS = sorted(CARD_FORMATS)


@pytest.mark.parametrize("card_format", FORMATS)
def test_layouts_fit_every_format(card_format: str) -> None:
    w, h = CARD_FORMATS[card_format]
    card = Box(0, 0, w, h)
    for seed in range(120):
        design = design_from_seed("halloween", seed, card_format=card_format)
        assert (design.width, design.height) == (w, h)
        assert format_of(design) == card_format
        layout = design.layout
        assert card.contains(layout.photo_box) and card.contains(layout.text_box)
        assert not layout.photo_box.intersects(layout.text_box)
        if layout.photo_shape == "arch":
            assert layout.photo_box.h > layout.photo_box.w
        if layout.photo_shape == "circle":
            assert layout.photo_box.h == pytest.approx(layout.photo_box.w)
        for o in design.ornaments:
            assert not circle_hits_box(o.cx, o.cy, o.size * 0.48 - 1.0, layout.photo_box)
            assert not circle_hits_box(o.cx, o.cy, o.size * 0.48 - 1.0, layout.text_box)


def test_unknown_format_is_refused() -> None:
    with pytest.raises(ValueError):
        design_from_seed("halloween", 1, card_format="banner")
    with pytest.raises(ValueError):
        make_card("halloween", synthetic_portrait(200, 200)[0], card_format="banner")


def test_same_seed_in_two_formats_gives_two_designs() -> None:
    a = design_key(design_from_seed("diwali", 9, card_format="portrait"))
    b = design_key(design_from_seed("diwali", 9, card_format="square"))
    assert a.fingerprint != b.fingerprint
    assert a.bucket != b.bucket


@pytest.mark.parametrize("card_format", FORMATS)
def test_png_size_and_make_another_keep_the_format(card_format: str) -> None:
    w, h = CARD_FORMATS[card_format]
    store = DesignStore()
    card = make_card("eid_al_fitr", synthetic_portrait(300, 400, seed=2)[0], to="Sara",
                     seed=3, store=store, card_format=card_format)
    with Image.open(io.BytesIO(export_png(card, 540))) as image:
        assert image.size == (540, round(540 * h / w))
    again = make_another(card)
    assert (again.design.width, again.design.height) == (w, h)
    assert again.fingerprint != card.fingerprint
    assert worst_contrast(card_composition(again)) >= 4.5


def test_story_print_sheet_keeps_the_aspect() -> None:
    card = make_card("holi", synthetic_portrait(300, 400, seed=4)[0], seed=2,
                     card_format="story")
    sheet = print_image(card)
    x0, y0, x1, y1 = trim_box(sheet.size)
    assert x1 - x0 == 4 * DPI
    assert y1 - y0 == round(4 * DPI * 1920 / 1080)

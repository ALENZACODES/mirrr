"""Seeded soak test: random occasions, looks, formats, photos and text, end to end.

Author: John Khan.
"""

from __future__ import annotations

import random
import xml.etree.ElementTree as ET

import pytest
from PIL import Image

from plumb_api.seasonal.cards import (
    OCCASIONS,
    DesignStore,
    export_svg,
    make_another,
    make_card,
    render_card,
)
from plumb_api.seasonal.cards.access import worst_contrast
from plumb_api.seasonal.cards.colour import WCAG_AA_TEXT
from plumb_api.seasonal.cards.export import check_payload
from plumb_api.seasonal.cards.grammar import CARD_FORMATS
from plumb_api.seasonal.cards.photo import FaceBox
from plumb_api.seasonal.cards.service import card_composition, export_payload
from plumb_api.seasonal.cards.synthetic import synthetic_portrait

WORDS = ("happy", "bright", "night", "with", "love", "from", "all", "of", "us", "sweet",
         "Jos\u00e9", "Zo\u00eb", "Fran\u00e7ois", "\u0141ucja", "Bj\u00f8rn", "Stra\u00dfe",
         "na\u00efve", "\u00c5sa", "supercalifragilistic")


def _sentence(rng: random.Random, words: int) -> str:
    return " ".join(rng.choice(WORDS) for _ in range(words))


@pytest.mark.slow
def test_random_cards_survive_end_to_end() -> None:
    rng = random.Random(2026_10_31)
    store = DesignStore()
    occasions = sorted(OCCASIONS)
    for case in range(60):
        occasion = rng.choice(occasions)
        look = rng.choice((None,) + OCCASIONS[occasion].look_ids)
        card_format = rng.choice(sorted(CARD_FORMATS))
        width = rng.choice((40, 300, 900, 2400))
        height = rng.choice((40, 300, 900, 2400))
        people = rng.choice((1, 1, 2, 3))
        image, faces = synthetic_portrait(width, height, seed=case, people=min(people, 3),
                                          alpha=rng.random() < 0.2)
        if rng.random() < 0.15:
            image = image.convert("L")
        face: FaceBox | None = rng.choice(faces) if rng.random() < 0.6 else None
        card = make_card(occasion, image, to=_sentence(rng, 2)[:40],
                         sender=_sentence(rng, 1)[:40],
                         message=_sentence(rng, rng.randint(0, 30))[:280],
                         look=look, seed=rng.randrange(2 ** 63), face=face,
                         fit=rng.choice(("cover", "contain")), store=store,
                         card_format=card_format)
        assert worst_contrast(card_composition(card)) >= WCAG_AA_TEXT, case
        thumb = render_card(card, 216)
        assert isinstance(thumb, Image.Image) and thumb.width == 216
        ET.fromstring(export_svg(card))
        assert check_payload(export_payload(card)) == []
        again = make_another(card)
        assert again.fingerprint != card.fingerprint
        assert (again.design.width, again.design.height) == CARD_FORMATS[card_format]
    assert len(store) == 120

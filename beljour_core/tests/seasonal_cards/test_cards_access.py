"""Accessibility tests: measured text contrast, plate fallback and colour-vision report.

Author: John Khan.
"""

from __future__ import annotations

import pytest

from plumb_api.seasonal.cards import OCCASIONS, make_card
from plumb_api.seasonal.cards.access import (
    accessible,
    line_box,
    measure,
    with_plate,
    worst_contrast,
)
from plumb_api.seasonal.cards.colour import WCAG_AA_TEXT
from plumb_api.seasonal.cards.compose import compose
from plumb_api.seasonal.cards.grammar import design_from_seed
from plumb_api.seasonal.cards.service import card_composition
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait
from plumb_api.seasonal.cards.text import CardText, TextLine
from plumb_api.seasonal.cards.vision import (
    VISIONS,
    look_vision,
    palette_report,
    report_markdown,
)

LONG = CardText("Samantha", "Alexander", "Wishing you a bright, warm and happy season "
                "with everyone you love", "Season's Greetings")


def test_line_box_follows_alignment() -> None:
    line = TextLine("Hello", "message", 40, 500.0, 900.0, 860.0, 48.8)
    centre = line_box(line, "centre")
    assert centre.x + centre.w / 2 == pytest.approx(500.0)
    assert line_box(line, "left").x == 500.0
    right = line_box(line, "right")
    assert right.right == pytest.approx(500.0)


@pytest.mark.parametrize("occasion_id", sorted(OCCASIONS))
def test_every_look_reaches_aa_behind_every_line(occasion_id: str) -> None:
    for look in OCCASIONS[occasion_id].looks:
        for seed in range(6):
            comp = accessible(compose(design_from_seed(occasion_id, seed, look.id), LONG))
            assert worst_contrast(comp) >= WCAG_AA_TEXT, (look.id, seed)


def test_plate_is_added_only_when_measurement_fails() -> None:
    added = kept = 0
    for seed in range(60):
        comp = compose(design_from_seed("holi", seed), LONG)
        fixed = accessible(comp)
        if comp.plate:
            assert fixed is comp
        elif worst_contrast(comp, include_plate=False) >= WCAG_AA_TEXT:
            assert fixed is comp
            kept += 1
        else:
            assert fixed.plate and fixed.plate_box is not None
            assert fixed.plate_box.contains(fixed.text.bounds)
            added += 1
    assert added > 0 and kept > 0


def test_with_plate_is_idempotent_and_skips_empty_text() -> None:
    comp = compose(design_from_seed("easter", 1), LONG)
    once = with_plate(comp)
    assert with_plate(once) is once
    empty = compose(design_from_seed("easter", 1), CardText("", "", "", ""),
                    include_text=False)
    assert with_plate(empty) is empty
    assert measure(empty) == ()
    assert worst_contrast(empty) == 21.0


def test_service_exports_use_the_accessible_composition() -> None:
    photo = encode_with_metadata(synthetic_portrait(300, 400, seed=2)[0])
    for seed in range(40):
        card = make_card("holi", photo, to="Sam", sender="Alex", message=LONG.message, seed=seed)
        comp = card_composition(card)
        assert worst_contrast(comp) >= WCAG_AA_TEXT
        raw = compose(card.design, card.text)
        if not raw.plate and comp.plate:
            break
    else:
        pytest.fail("expected at least one card that needed the fallback plate")


def test_every_palette_is_colour_vision_safe() -> None:
    rows = palette_report()
    assert len(rows) == sum(len(o.looks) for o in OCCASIONS.values())
    for row in rows:
        assert set(row.text_contrast) == set(VISIONS)
        assert row.text_ok, (row.occasion, row.look, row.text_contrast)
        assert row.ornaments_ok, (row.occasion, row.look, row.ornament_delta_e)


def test_report_markdown_has_one_row_per_look() -> None:
    rows = [look_vision("kwanzaa", look) for look in OCCASIONS["kwanzaa"].looks]
    table = report_markdown(rows)
    assert table.count("\n") == len(rows) + 1
    assert "kwanzaa/seven_lights" in table
    assert "text deut" in table

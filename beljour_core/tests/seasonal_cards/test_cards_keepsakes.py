"""Tests for the three extras: matching envelope, gift tag and print-safe export.

Author: John Khan.
"""

from __future__ import annotations

import io
import math
import xml.etree.ElementTree as ET

import numpy as np
import pytest
from PIL import Image

from plumb_api.seasonal.cards import OCCASION_IDS, Card, make_card
from plumb_api.seasonal.cards.colour import (
    WCAG_AA_TEXT,
    contrast_ratio,
    parse_hex,
    to_lab,
    total_ink,
)
from plumb_api.seasonal.cards.keepsakes import (
    ENVELOPE_H,
    ENVELOPE_W,
    TAG_H,
    TAG_W,
    envelope_scene,
    gift_tag_scene,
)
from plumb_api.seasonal.cards.motifs import draw_motif
from plumb_api.seasonal.cards.printing import (
    BLEED_IN,
    DPI,
    PRINT_MAX_CHROMA,
    export_print_png,
    print_image,
    print_safe_colour,
    print_safe_design,
    print_safe_roles,
    trim_box,
)
from plumb_api.seasonal.cards.scene import scene_image, scene_svg
from plumb_api.seasonal.cards.shapes import Poly
from plumb_api.seasonal.cards.synthetic import synthetic_portrait

NS = {"s": "http://www.w3.org/2000/svg"}


def _card(occasion: str = "halloween", seed: int = 31, to: str = "", sender: str = "") -> Card:
    return make_card(occasion, synthetic_portrait(300, 375, seed=seed)[0], seed=seed, to=to,
                     sender=sender)


def test_envelope_matches_the_card_palette_and_names_the_recipient() -> None:
    card = _card(to="Mia", sender="Dad")
    scene = envelope_scene(card)
    assert (scene.width, scene.height) == (ENVELOPE_W, ENVELOPE_H)
    assert scene.roles == card.design.palette.as_dict()
    texts = [run.text for run in scene.texts]
    assert texts[0] == "To Mia"
    assert "From Dad" in texts
    root = ET.fromstring(scene_svg(scene))
    assert root.get("data-kind") == "envelope"
    assert [t.text for t in root.findall(".//s:text", NS)] == texts
    assert "<image" not in scene_svg(scene)


def test_envelope_without_recipient_uses_the_greeting() -> None:
    scene = envelope_scene(_card("diwali"))
    assert scene.texts[0].text == "Happy Diwali"
    assert all(not run.text.startswith("From") for run in scene.texts)


def test_gift_tag_has_hole_greeting_and_both_names() -> None:
    card = _card("christmas", to="Ann", sender="Raj")
    scene = gift_tag_scene(card)
    assert (scene.width, scene.height) == (TAG_W, TAG_H)
    texts = [run.text for run in scene.texts]
    assert texts[0] == "Merry Christmas"
    assert texts[-2:] == ["To Ann", "From Raj"]
    image = scene_image(scene, 300)
    assert image.size == (300, 450)
    alpha = np.asarray(image.getchannel("A"))
    assert alpha[0, 0] == 0, "chamfered corner stays transparent"
    assert alpha[449, 150] == 255
    hole = np.asarray(image.convert("RGB"))[40, 150]
    assert tuple(int(v) for v in hole) == (255, 255, 255)


@pytest.mark.parametrize("occasion_id", OCCASION_IDS)
def test_keepsakes_render_for_every_occasion(occasion_id: str) -> None:
    card = _card(occasion_id, to="A", sender="B")
    for scene in (envelope_scene(card), gift_tag_scene(card)):
        ET.fromstring(scene_svg(scene))
        assert scene_image(scene, 200).getbbox() is not None
        for run in scene.texts:
            assert run.size >= 14


def test_keepsake_text_reads_against_its_plate() -> None:
    for occasion_id in OCCASION_IDS:
        roles = envelope_scene(_card(occasion_id, to="Sam")).roles
        assert contrast_ratio(parse_hex(roles["ink"]), parse_hex(roles["plate"])) >= \
            WCAG_AA_TEXT


def test_star_ornament_always_has_five_tips() -> None:
    for seed in range(40):
        shapes = draw_motif("star", seed)
        assert len(shapes) == 1 and isinstance(shapes[0], Poly)
        assert len(shapes[0].points) == 10


def test_print_safe_colour_limits_chroma_and_keeps_hue() -> None:
    for colour in ((0, 245, 212), (241, 91, 181), (255, 0, 0), (0, 0, 255), (5, 5, 5)):
        safe = print_safe_colour(colour)
        lightness, a, b = to_lab(safe)
        assert math.hypot(a, b) <= PRINT_MAX_CHROMA + 3.0
        assert lightness >= 9.0
        assert total_ink(safe) <= 3.0
        _, a0, b0 = to_lab(colour)
        if math.hypot(a0, b0) > 20:
            hue0 = math.degrees(math.atan2(b0, a0))
            hue1 = math.degrees(math.atan2(b, a))
            assert abs((hue1 - hue0 + 180) % 360 - 180) < 12


def test_print_safe_roles_keep_aa_text() -> None:
    for occasion_id in OCCASION_IDS:
        for seed in range(10):
            design = print_safe_design(_card(occasion_id, seed).design)
            roles = design.palette.as_dict()
            assert contrast_ratio(parse_hex(roles["ink"]), parse_hex(roles["plate"])) >= \
                WCAG_AA_TEXT
    vivid = print_safe_roles({"background": "#ffffff", "pattern": "#eeeeee",
                              "accent": "#ff0000", "ornament": "#00ff00", "ink": "#000000",
                              "plate": "#ffffff"})
    assert contrast_ratio(parse_hex(vivid["ink"]), parse_hex(vivid["plate"])) >= WCAG_AA_TEXT
    _, a, b = to_lab(parse_hex(vivid["ornament"]))
    assert math.hypot(a, b) <= PRINT_MAX_CHROMA + 3.0


def test_print_sheet_has_bleed_trim_and_crop_marks() -> None:
    card = _card("new_year", to="Mia")
    sheet = print_image(card)
    trim = trim_box(sheet.size)
    assert (trim[2] - trim[0], trim[3] - trim[1]) == (4 * DPI, 5 * DPI)
    pixels = np.asarray(sheet)
    bleed = int(round(BLEED_IN * DPI))
    row = trim[1] + 200
    assert np.array_equal(pixels[row, trim[0] - bleed // 2], pixels[row, trim[0]])
    assert np.array_equal(pixels[row, trim[2] + bleed // 2], pixels[row, trim[2] - 1])
    assert tuple(pixels[2, trim[0]]) == (0, 0, 0), "crop mark above the left trim line"
    assert tuple(pixels[2, 2]) == (255, 255, 255), "slug corner stays clear"
    data = export_print_png(card)
    with Image.open(io.BytesIO(data)) as image:
        assert image.info["Author"] == "John Khan"
        assert round(image.info["dpi"][0]) == DPI

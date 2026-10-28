"""Seeded fuzz tests for the text sanitiser, the text layout and the payload builder.

Author: John Khan.
"""

from __future__ import annotations

import json
import random
import unicodedata

from plumb_api.seasonal.cards import (
    OCCASION_IDS,
    CardTextError,
    export_payload,
    make_card,
    render_card,
)
from plumb_api.seasonal.cards.export import build_payload, check_payload, payload_json
from plumb_api.seasonal.cards.geometry import Box
from plumb_api.seasonal.cards.synthetic import synthetic_portrait
from plumb_api.seasonal.cards.text import (
    LIMITS,
    CardText,
    clean_text,
    layout_text,
    make_text,
    text_width,
)

POOLS: tuple[tuple[int, int], ...] = (
    (0x20, 0x7E), (0x00, 0x1F), (0x7F, 0x9F), (0xA0, 0x24F), (0x300, 0x36F), (0x590, 0x5FF),
    (0x600, 0x6FF), (0x900, 0x97F), (0xA00, 0xA7F), (0x4E00, 0x4E80), (0x200B, 0x202E),
    (0x2066, 0x2069), (0x1F300, 0x1F6FF), (0x1F900, 0x1F9FF), (0xFE00, 0xFE0F),
    (0xE000, 0xE0FF), (0xE0000, 0xE007F), (0x2600, 0x27BF),
)
KEPT_FORMAT = {"\u200e", "\u200f", "\u061c"}
JOINERS = {"\u200c", "\u200d"}


def _random_text(rng: random.Random, length: int) -> str:
    chars = []
    for _ in range(length):
        lo, hi = rng.choice(POOLS)
        chars.append(chr(rng.randint(lo, hi)))
    return "".join(chars)


def test_sanitiser_output_is_clean_and_idempotent() -> None:
    rng = random.Random(20261031)
    for _ in range(3000):
        raw = _random_text(rng, rng.randint(0, 90))
        allow = rng.random() < 0.5
        cleaned = clean_text(raw, "message", allow_newlines=allow)
        assert unicodedata.is_normalized("NFC", cleaned)
        assert clean_text(cleaned, "message", allow_newlines=allow) == cleaned
        assert cleaned == cleaned.strip(" ")
        assert "  " not in cleaned
        for ch in cleaned:
            category = unicodedata.category(ch)
            assert category not in ("Cc", "Co", "Cs", "Cn") or ch == "\n"
            assert category != "Cf" or ch in KEPT_FORMAT or ch in JOINERS
            assert not 0x1F300 <= ord(ch) <= 0x1FAFF
        if not allow:
            assert "\n" not in cleaned
        for index, ch in enumerate(cleaned):
            if ch in JOINERS:
                assert unicodedata.category(cleaned[index - 1])[0] in "LM"
                assert unicodedata.category(cleaned[index + 1])[0] in "LM"


def test_make_text_either_accepts_within_limits_or_names_the_field() -> None:
    rng = random.Random(7)
    for _ in range(1500):
        fields = [_random_text(rng, rng.randint(0, 320)) for _ in range(4)]
        try:
            text = make_text(fields[0], fields[1], fields[2], fields[3], "Happy Holi")
        except CardTextError as error:
            assert error.field in LIMITS
            continue
        assert len(text.to) <= LIMITS["to"]
        assert len(text.sender) <= LIMITS["from"]
        assert len(text.message) <= LIMITS["message"]
        assert 0 < len(text.greeting) <= LIMITS["greeting"]


def test_layout_never_overflows_the_box_width() -> None:
    rng = random.Random(99)
    box = Box(100, 820, 760, 380)
    for _ in range(200):
        message = clean_text(_random_text(rng, rng.randint(0, 200)), "message", True)
        text = CardText(clean_text(_random_text(rng, 30), "to"), "", message, "Happy Diwali")
        layout = layout_text(text, box, rng.choice(("left", "right", "centre")))
        for line in layout.lines:
            assert text_width(line.text, line.size) <= box.w + 0.5


def test_payload_builder_round_trips_any_text() -> None:
    rng = random.Random(5)
    for _ in range(500):
        values = [clean_text(_random_text(rng, rng.randint(0, 40)), "to") for _ in range(4)]
        payload = build_payload(occasion=rng.choice(OCCASION_IDS), look="x",
                                svg='<svg xmlns="http://www.w3.org/2000/svg"/>',
                                to=values[0], sender=values[1], message=values[2],
                                greeting=values[3] or "Hi", fingerprint="f" * 32,
                                seed=rng.randrange(2 ** 63), width=1080.0, height=1350.0)
        assert json.loads(payload_json(payload)) == payload
        assert check_payload(payload) == []


def test_fuzzed_cards_render_and_export_cleanly() -> None:
    rng = random.Random(31)
    image = synthetic_portrait(200, 250, seed=1)[0]
    for index in range(12):
        message = _random_text(rng, rng.randint(0, 120))
        try:
            card = make_card(OCCASION_IDS[index], image, to=_random_text(rng, 12),
                             message=message, seed=index)
        except CardTextError:
            continue
        payload = export_payload(card)
        assert check_payload(payload) == []
        assert payload["text"]["message"] == card.text.message
        assert render_card(card, 108).size == (108, 135)

"""Editable text tests: sanitising, limits, wrapping, auto sizing, RTL and emoji removal.

Author: John Khan.
"""

from __future__ import annotations

import unicodedata

import pytest

from plumb_api.seasonal.cards import CardTextError
from plumb_api.seasonal.cards.geometry import Box
from plumb_api.seasonal.cards.glyphs import undrawable
from plumb_api.seasonal.cards.text import (
    LIMITS,
    MIN_SIZE,
    RAW_LIMIT,
    CardText,
    clean_text,
    layout_text,
    make_text,
    text_width,
    wrap,
    xml_escape,
)

BOX = Box(80, 800, 900, 420)


def test_nfc_normalisation() -> None:
    decomposed = "Cafe\u0301"
    assert clean_text(decomposed, "to") == "Caf\u00e9"
    assert unicodedata.is_normalized("NFC", clean_text(decomposed, "to"))


def test_control_and_format_characters_are_removed() -> None:
    raw = "A\x00B\x07C\u200bD\u2066E\ufeffF\x1b[31mG"
    assert clean_text(raw, "to") == "ABCDEF[31mG"


def test_bidi_marks_are_kept_and_rtl_text_stays_in_logical_order() -> None:
    arabic = "\u0639\u064a\u062f \u0645\u0628\u0627\u0631\u0643"
    hebrew = "\u05d7\u05d2 \u05e9\u05de\u05d7"
    assert clean_text(arabic, "greeting") == arabic
    assert clean_text(hebrew, "message") == hebrew
    assert clean_text("\u200fA\u200e", "to") == "\u200fA\u200e"


def test_emoji_and_pictographs_are_removed() -> None:
    raw = "Happy \U0001F383 Halloween \u2764\ufe0f \U0001F468\u200d\U0001F469\u200d\U0001F467!"
    assert clean_text(raw, "greeting") == "Happy Halloween !"
    assert clean_text("\U0001F1E8\U0001F1E6 Canada", "to") == "Canada"
    assert clean_text("\u2600\u2601", "to") == ""


def test_whitespace_is_collapsed_and_trimmed() -> None:
    assert clean_text("  Sam \t  and\u00a0\u00a0Alex  ", "to") == "Sam and Alex"
    assert clean_text("line one\nline two", "to") == "line one line two"


def test_blank_runs_collapse_and_more_than_six_lines_is_an_error() -> None:
    raw = "a\r\n\r\n\r\nb\n\n\nc\nd\ne\nf\ng\nh"
    cleaned = clean_text(raw, "message", allow_newlines=True)
    assert cleaned.split("\n") == ["a", "", "b", "", "c", "d", "e", "f", "g", "h"]
    with pytest.raises(CardTextError) as info:
        make_text("", "", raw, None, "Hi")
    assert info.value.field == "message"
    make_text("", "", "\n".join("abcdef"), None, "Hi")


def test_raw_input_is_capped_before_cleaning() -> None:
    with pytest.raises(CardTextError) as info:
        clean_text("hello there\n" * 500_000, "message", allow_newlines=True)
    assert "before cleaning" in info.value.reason
    assert clean_text("x" * RAW_LIMIT, "to") == "x" * RAW_LIMIT


def test_joiners_stay_inside_words_only() -> None:
    persian = "\u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u0645"
    assert clean_text(persian, "message") == persian
    assert clean_text("\u200cabc\u200d", "to") == "abc"
    assert clean_text("a \u200d b", "to") == "a b"


def test_accented_latin_is_accepted_and_drawn_without_missing_glyphs() -> None:
    names = ("Jos\u00e9", "Zo\u00eb", "Fran\u00e7ois", "\u0141ucja", "Bj\u00f8rn",
             "Ren\u00e9e M\u00fcller", "Stra\u00dfe", "Sin\u00e9ad", "Dvo\u0159\u00e1k")
    for name in names:
        assert undrawable(name) == []
        assert make_text(name, name, "", None, "Hi").to == unicodedata.normalize("NFC", name)


@pytest.mark.parametrize("text", [
    "\u0639\u064a\u062f \u0645\u0628\u0627\u0631\u0643",
    "\u05d7\u05d2 \u05e9\u05de\u05d7",
    "\u0436\u0438\u0437\u043d\u044c",
    "\u4e2d\u79cb",
])
def test_scripts_the_font_cannot_draw_are_refused_with_the_field(text: str) -> None:
    assert clean_text(text, "greeting") == text
    with pytest.raises(CardTextError) as info:
        make_text("", "", "", text, "Hi")
    assert info.value.field == "greeting"
    assert "cannot draw" in info.value.reason


def test_empty_and_none_fields() -> None:
    text = make_text(None, "", "   ", None, "Happy Diwali")
    assert text == CardText("", "", "", "Happy Diwali")
    assert make_text("", "", "", "\U0001F389", "Happy New Year").greeting == "Happy New Year"


def test_non_text_values_are_refused() -> None:
    with pytest.raises(CardTextError) as info:
        make_text(42, "", "", None, "Hi")
    assert info.value.field == "to"


@pytest.mark.parametrize("field", ["to", "from", "message", "greeting"])
def test_length_limits(field: str) -> None:
    values = {"to": "", "from": "", "message": "", "greeting": None}
    values[field] = "x" * LIMITS[field]
    make_text(values["to"], values["from"], values["message"], values["greeting"], "Hi")
    values[field] = "x" * (LIMITS[field] + 1)
    with pytest.raises(CardTextError) as info:
        make_text(values["to"], values["from"], values["message"], values["greeting"], "Hi")
    assert info.value.field == field


def test_limits_count_characters_after_cleaning() -> None:
    padded = "\U0001F383" * 30 + "x" * LIMITS["to"]
    assert make_text(padded, "", "", None, "Hi").to == "x" * LIMITS["to"]


def test_wrap_respects_width_and_breaks_long_words() -> None:
    long_word = "Supercalifragilisticexpialidocious" * 3
    lines = wrap(f"Hello {long_word} there", 40, 300)
    assert len(lines) >= 4
    assert all(text_width(line, 40) <= 300 for line in lines)
    assert "".join(lines).replace(" ", "") == f"Hello{long_word}there"


def test_wrap_keeps_explicit_paragraphs() -> None:
    assert wrap("one\ntwo", 30, 1000) == ["one", "two"]


def test_layout_fits_inside_box_and_prefers_large_sizes() -> None:
    text = CardText("Sam", "Alex", "See you soon", "Happy Halloween")
    layout = layout_text(text, BOX, "centre", 1.8)
    assert layout.lines[0].role == "headline"
    assert [line.role for line in layout.lines][-1] == "from"
    assert layout.base_size > 30
    for line in layout.lines:
        assert BOX.y - 0.5 <= line.top and line.top + line.height <= BOX.bottom + 0.5
        assert text_width(line.text, line.size) <= BOX.w + 0.5
    assert BOX.contains(layout.bounds.inset(0.5))


def test_long_message_shrinks_text() -> None:
    short = layout_text(CardText("", "", "Hi", "Happy Holi"), BOX, "centre")
    long = layout_text(CardText("", "", "word " * 55, "Happy Holi"), BOX, "centre")
    assert long.base_size < short.base_size
    assert long.base_size >= MIN_SIZE
    assert sum(line.height for line in long.lines) <= BOX.h + 0.5


def test_alignment_sets_anchor_x() -> None:
    text = CardText("A", "B", "", "Happy Easter")
    assert layout_text(text, BOX, "left").lines[0].x == BOX.x
    assert layout_text(text, BOX, "right").lines[0].x == BOX.right
    assert layout_text(text, BOX, "centre").lines[0].x == BOX.x + BOX.w / 2


def test_upper_case_style_applies_to_headline_only() -> None:
    layout = layout_text(CardText("sam", "", "", "Happy Easter"), BOX, "centre", upper=True)
    assert layout.lines[0].text == "HAPPY EASTER"
    assert layout.lines[1].text == "To sam"


def test_xml_escape() -> None:
    assert xml_escape('<b>"Tom" & Jerry</b>') == "&lt;b&gt;&quot;Tom&quot; &amp; Jerry&lt;/b&gt;"

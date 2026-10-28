"""Editable card text: sanitising, wrapping and automatic font sizing.

Fields are normalised to Unicode NFC, stripped of control, format (except the three bidi
marks), private-use and unassigned characters, and of emoji, so the output is plain text.
Right-to-left text is kept in logical order exactly as typed. Sizes are measured with Pillow's
built-in default font so the SVG and PNG renderers share one text layout.
Author: John Khan.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache

from PIL import ImageFont

from .errors import CardTextError
from .geometry import Box
from .glyphs import drawable_form, undrawable

LIMITS: dict[str, int] = {"to": 40, "from": 40, "greeting": 48, "message": 280}
MAX_MESSAGE_LINES = 6
LINE_HEIGHT = 1.22
BASELINE = 0.92
MIN_SIZE = 12
MAX_SIZE = 96
FONT_FAMILY = "'Helvetica Neue', Helvetica, Arial, 'Noto Sans', sans-serif"

_KEEP_FORMAT = {"\u200e", "\u200f", "\u061c"}
# Zero-width non-joiner and joiner change how words in Persian, Hindi or Punjabi are shaped;
# they are kept between two letters and dropped anywhere else (such as inside emoji).
_JOINERS = {"\u200c", "\u200d"}
# Raw input above this many characters is refused before any work is done.
RAW_LIMIT = 2000
_EMOJI_RANGES: tuple[tuple[int, int], ...] = (
    (0x1F000, 0x1FAFF), (0x2600, 0x27BF), (0x2B00, 0x2BFF), (0x2300, 0x23FF),
    (0xFE00, 0xFE0F), (0x1F1E6, 0x1F1FF), (0xE0000, 0xE007F), (0x20E3, 0x20E3),
    (0x3030, 0x3030), (0x303D, 0x303D), (0x3297, 0x3299), (0x2190, 0x21FF),
)
_SPACES = re.compile(r"[ \t\u00a0\u2000-\u200a\u202f\u205f\u3000]+")


def _is_emoji(code: int) -> bool:
    return any(lo <= code <= hi for lo, hi in _EMOJI_RANGES)


def clean_text(value: object, field: str, allow_newlines: bool = False) -> str:
    """Normalise one field; raise CardTextError if it is not a string."""
    if value is None:
        return ""
    if not isinstance(value, str):
        raise CardTextError(field, "must be text")
    if len(value) > RAW_LIMIT:
        raise CardTextError(field, f"longer than {RAW_LIMIT} characters before cleaning")
    text = unicodedata.normalize("NFC", value.replace("\r\n", "\n").replace("\r", "\n"))
    out: list[str] = []
    for ch in text:
        if ch in ("\n", "\u2028", "\u2029"):
            out.append("\n" if allow_newlines else " ")
            continue
        if ch == "\t":
            out.append(" ")
            continue
        category = unicodedata.category(ch)
        if category in ("Cc", "Co", "Cs", "Cn"):
            continue
        if category == "Cf" and ch not in _KEEP_FORMAT and ch not in _JOINERS:
            continue
        if _is_emoji(ord(ch)):
            continue
        out.append(ch)
    out = _drop_loose_joiners(out)
    lines = [_SPACES.sub(" ", line).strip() for line in "".join(out).split("\n")]
    kept: list[str] = []
    for line in lines:
        if line or (kept and kept[-1]):
            kept.append(line)
    while kept and not kept[-1]:
        kept.pop()
    # Removing characters can leave combining marks in a new order; normalise once more.
    return unicodedata.normalize("NFC", "\n".join(kept))


def _is_letter(ch: str) -> bool:
    return unicodedata.category(ch)[0] in ("L", "M")


def _drop_loose_joiners(chars: list[str]) -> list[str]:
    kept: list[str] = []
    for i, ch in enumerate(chars):
        if ch in _JOINERS:
            before = kept[-1] if kept else ""
            after = chars[i + 1] if i + 1 < len(chars) else ""
            if not (before and after and _is_letter(before) and _is_letter(after)):
                continue
        kept.append(ch)
    return kept


@dataclass(frozen=True)
class CardText:
    """The four editable fields after sanitising."""

    to: str
    sender: str
    message: str
    greeting: str


def make_text(to: object, sender: object, message: object, greeting: object,
              default_greeting: str) -> CardText:
    """Sanitise and length-check every field; the greeting falls back to the default."""
    values = {
        "to": clean_text(to, "to"),
        "from": clean_text(sender, "from"),
        "message": clean_text(message, "message", allow_newlines=True),
        "greeting": clean_text(greeting, "greeting"),
    }
    for field, text in values.items():
        if len(text) > LIMITS[field]:
            raise CardTextError(field, f"longer than {LIMITS[field]} characters")
        missing = undrawable(text)
        if missing:
            shown = " ".join(missing[:6])
            raise CardTextError(field, f"the card font cannot draw these characters yet: {shown}")
    if values["message"].count("\n") >= MAX_MESSAGE_LINES:
        raise CardTextError("message", f"more than {MAX_MESSAGE_LINES} lines")
    return CardText(values["to"], values["from"], values["message"],
                    values["greeting"] or default_greeting)


@lru_cache(maxsize=256)
def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Pillow's built-in default font at a pixel size (bitmap fallback without FreeType)."""
    loaded = ImageFont.load_default(size=size)
    return loaded


def text_width(text: str, size: int) -> float:
    """Advance width of a line in pixels at the given size, as drawn (accents included)."""
    return float(font(size).getlength(drawable_form(text)[0]))


def _break_word(word: str, size: int, width: float) -> list[str]:
    pieces: list[str] = []
    current = ""
    for ch in word:
        if current and text_width(current + ch, size) > width:
            pieces.append(current)
            current = ch
        else:
            current += ch
    if current:
        pieces.append(current)
    return pieces


def wrap(text: str, size: int, width: float) -> list[str]:
    """Greedy word wrap; words wider than the line are broken between characters."""
    lines: list[str] = []
    for paragraph in text.split("\n"):
        current = ""
        for word in paragraph.split(" "):
            if not word:
                continue
            trial = f"{current} {word}" if current else word
            if text_width(trial, size) <= width:
                current = trial
                continue
            if current:
                lines.append(current)
            if text_width(word, size) <= width:
                current = word
            else:
                parts = _break_word(word, size, width)
                lines.extend(parts[:-1])
                current = parts[-1]
        lines.append(current)
    return lines


@dataclass(frozen=True)
class TextLine:
    """One laid-out line: text, role, pixel size, anchor x and baseline y (card units)."""

    text: str
    role: str
    size: int
    x: float
    baseline: float
    top: float
    height: float


@dataclass(frozen=True)
class TextLayout:
    """All lines of the text block plus the block's used bounds."""

    lines: tuple[TextLine, ...]
    bounds: Box
    base_size: int


ROLE_SCALE = {"to": 0.82, "message": 1.0, "from": 0.82}


def _blocks(text: CardText, headline_scale: float, upper: bool) -> list[tuple[str, str, float]]:
    greeting = text.greeting.upper() if upper else text.greeting
    blocks: list[tuple[str, str, float]] = [("headline", greeting, headline_scale)]
    if text.to:
        blocks.append(("to", f"To {text.to}", ROLE_SCALE["to"]))
    if text.message:
        blocks.append(("message", text.message, ROLE_SCALE["message"]))
    if text.sender:
        blocks.append(("from", f"From {text.sender}", ROLE_SCALE["from"]))
    return blocks


def _measure(blocks: list[tuple[str, str, float]], base: int,
             width: float) -> list[tuple[str, str, int]]:
    out: list[tuple[str, str, int]] = []
    for role, content, scale in blocks:
        size = max(MIN_SIZE, int(round(base * scale)))
        for line in wrap(content, size, width):
            out.append((role, line, size))
    return out


def _height(lines: list[tuple[str, str, int]]) -> float:
    return sum(size * LINE_HEIGHT for _, _, size in lines)


def layout_text(text: CardText, box: Box, align: str, headline_scale: float = 1.8,
                upper: bool = False) -> TextLayout:
    """Find the largest base size whose wrapped lines fit the box, then position them."""
    blocks = _blocks(text, headline_scale, upper)
    top_size = max(MIN_SIZE, int(MAX_SIZE / headline_scale))
    lo, hi = MIN_SIZE, top_size
    best = MIN_SIZE
    while lo <= hi:
        mid = (lo + hi) // 2
        if _height(_measure(blocks, mid, box.w)) <= box.h:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    measured = _measure(blocks, best, box.w)
    total = _height(measured)
    y = box.y + max(0.0, (box.h - total) / 2)
    if align == "left":
        x = box.x
    elif align == "right":
        x = box.right
    else:
        x = box.x + box.w / 2
    lines: list[TextLine] = []
    max_w = 0.0
    for role, content, size in measured:
        height = size * LINE_HEIGHT
        lines.append(TextLine(content, role, size, round(x, 2),
                              round(y + (height - size) / 2 + size * BASELINE, 2),
                              round(y, 2), round(height, 2)))
        max_w = max(max_w, text_width(content, size))
        y += height
    if align == "left":
        left = box.x
    elif align == "right":
        left = box.right - max_w
    else:
        left = box.x + (box.w - max_w) / 2
    top = lines[0].top if lines else box.y
    bounds = Box(round(left, 2), top, round(max_w, 2), round(min(total, box.h), 2))
    return TextLayout(tuple(lines), bounds, best)


def xml_escape(text: str) -> str:
    """Escape text for an SVG text node."""
    return (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))

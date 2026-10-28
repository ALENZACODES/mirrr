"""Latin accents for Pillow's built-in font, which only has glyphs for plain ASCII.

Text is drawn as its base letters (Unicode NFD with the combining marks removed) and every
accent is drawn as a small shape over or under its letter, so names such as "José", "Zoë",
"François" or "Łucja" read correctly in PNG output. A few letters that do not decompose are
mapped (ß to ss, æ to ae) or drawn with a stroke (ø, ł, đ). Characters with no glyph and no
rule (for example Arabic, Hebrew, Devanagari, Gurmukhi, Cyrillic or Chinese) are reported by
undrawable() so the caller can refuse them instead of drawing empty boxes.
Author: John Khan.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from functools import lru_cache

from PIL import ImageDraw, ImageFont

_PROBE_SIZE = 40
_NOTDEF_PROBE = "\U0010fffd"

# Letters that do not decompose: (base text, extra mark or "").
SPECIAL: dict[str, tuple[str, str]] = {
    "\u00df": ("ss", ""), "\u00e6": ("ae", ""), "\u00c6": ("AE", ""), "\u0153": ("oe", ""),
    "\u0152": ("OE", ""), "\u00f8": ("o", "slash"), "\u00d8": ("O", "slash"),
    "\u0142": ("l", "stroke"), "\u0141": ("L", "stroke"),
    "\u0111": ("d", "bar"), "\u0110": ("D", "bar"), "\u0131": ("i", ""),
    "\u2018": ("'", ""), "\u201c": ('"', ""), "\u201d": ('"', ""), "\u2013": ("-", ""),
    "\u2014": ("-", ""), "\u2026": ("...", ""), "\u00ab": ('"', ""), "\u00bb": ('"', ""),
    "\u00b7": (".", ""), "\u2022": ("-", ""), "\u20ac": ("EUR", ""), "\u00a3": ("GBP", ""),
    "\u00a9": ("(c)", ""), "\u00ae": ("(R)", ""), "\u00bf": ("?", ""), "\u00a1": ("!", ""),
}

# Combining marks drawn as shapes, keyed by code point.
MARKS: dict[str, str] = {
    "\u0300": "grave", "\u0301": "acute", "\u0302": "circumflex", "\u0303": "tilde",
    "\u0304": "macron", "\u0306": "breve", "\u0307": "dot", "\u0308": "diaeresis",
    "\u030a": "ring", "\u030b": "double_acute", "\u030c": "caron", "\u0323": "dot_below",
    "\u0327": "cedilla", "\u0328": "ogonek",
}


# Joiners and bidi marks have no glyph of their own and are fine to keep.
_INVISIBLE = frozenset("\u200c\u200d\u200e\u200f\u061c")


@dataclass(frozen=True)
class Mark:
    """An accent to draw on the base letter at index in the drawn string."""

    index: int
    kind: str


@lru_cache(maxsize=1)
def _probe() -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    return ImageFont.load_default(size=_PROBE_SIZE)


def _signature(ch: str) -> tuple[tuple[int, int], bytes]:
    mask = _probe().getmask(ch)
    return (mask.size, bytes(mask))


@lru_cache(maxsize=4096)
def has_glyph(ch: str) -> bool:
    """True when the built-in font draws this character (not its missing-glyph box)."""
    if ch == " ":
        return True
    return _signature(ch) != _signature(_NOTDEF_PROBE)


@lru_cache(maxsize=2048)
def drawable_form(text: str) -> tuple[str, tuple[Mark, ...]]:
    """The base string to draw with the font, plus the accents to draw on top of it."""
    out: list[str] = []
    marks: list[Mark] = []

    def add(ch: str) -> None:
        if ch in _INVISIBLE:
            return
        if has_glyph(ch) or ch == "\n":
            out.append(ch)
        elif ch in SPECIAL:
            base, extra = SPECIAL[ch]
            out.append(base)
            if extra:
                marks.append(Mark(len("".join(out)) - 1, extra))
        else:
            parts = unicodedata.normalize("NFD", ch)
            if len(parts) == 1:
                out.append(ch)
                return
            for part in parts:
                if part in MARKS and out:
                    marks.append(Mark(len("".join(out)) - 1, MARKS[part]))
                else:
                    add(part)

    for ch in text:
        add(ch)
    return "".join(out), tuple(marks)


def undrawable(text: str) -> list[str]:
    """Characters that cannot be drawn even with accent shapes, in order of first use."""
    base, _ = drawable_form(text)
    seen: list[str] = []
    for ch in base:
        if ch != "\n" and not has_glyph(ch) and ch not in seen:
            seen.append(ch)
    return seen


def _mark_shapes(draw: ImageDraw.ImageDraw, kind: str, gx: float, top: float, bottom: float,
                 size: float, fill: tuple[int, ...]) -> None:
    s = size
    w = max(1, round(s * 0.06))
    y = top - s * 0.07
    if kind in ("acute", "grave", "double_acute"):
        offsets = (-0.07, 0.07) if kind == "double_acute" else (0.0,)
        for off in offsets:
            x = gx + off * s
            lean = 1 if kind != "grave" else -1
            draw.line(((x - lean * 0.05 * s, y), (x + lean * 0.07 * s, y - 0.17 * s)), fill=fill,
                      width=w)
    elif kind in ("circumflex", "caron"):
        peak = y - 0.15 * s if kind == "circumflex" else y
        foot = y if kind == "circumflex" else y - 0.15 * s
        draw.line(((gx - 0.11 * s, foot), (gx, peak), (gx + 0.11 * s, foot)), fill=fill,
                  width=w, joint="curve")
    elif kind in ("diaeresis", "dot"):
        r = s * 0.045
        xs = (gx - 0.09 * s, gx + 0.09 * s) if kind == "diaeresis" else (gx,)
        for x in xs:
            draw.ellipse((x - r, y - 0.07 * s - r, x + r, y - 0.07 * s + r), fill=fill)
    elif kind == "tilde":
        pts = [(gx - 0.13 * s + 0.26 * s * i / 8,
                y - 0.08 * s + 0.05 * s * (1 if i in (5, 6, 7) else -1 if i in (1, 2, 3) else 0))
               for i in range(9)]
        draw.line(pts, fill=fill, width=w, joint="curve")
    elif kind == "ring":
        r = s * 0.07
        draw.ellipse((gx - r, y - 0.09 * s - r, gx + r, y - 0.09 * s + r), outline=fill, width=w)
    elif kind == "macron":
        draw.line(((gx - 0.12 * s, y - 0.06 * s), (gx + 0.12 * s, y - 0.06 * s)), fill=fill,
                  width=w)
    elif kind == "breve":
        draw.arc((gx - 0.11 * s, y - 0.2 * s, gx + 0.11 * s, y), 20, 160, fill=fill, width=w)
    elif kind == "dot_below":
        r = s * 0.045
        draw.ellipse((gx - r, bottom + 0.1 * s - r, gx + r, bottom + 0.1 * s + r), fill=fill)
    elif kind in ("cedilla", "ogonek"):
        hook = 1 if kind == "cedilla" else -1
        x = gx if kind == "cedilla" else gx + 0.1 * s
        draw.line(((x, bottom), (x, bottom + 0.08 * s), (x + hook * 0.07 * s, bottom + 0.14 * s),
                   (x - hook * 0.03 * s, bottom + 0.2 * s)), fill=fill, width=w, joint="curve")
    elif kind in ("slash", "stroke", "bar"):
        mid = (top + bottom) / 2
        if kind == "slash":
            draw.line(((gx - 0.2 * s, bottom + 0.03 * s), (gx + 0.2 * s, top - 0.03 * s)),
                      fill=fill, width=w)
        else:
            rise = 0.06 * s if kind == "stroke" else 0.0
            draw.line(((gx - 0.13 * s, mid + rise), (gx + 0.13 * s, mid - rise)), fill=fill,
                      width=w)


def draw_line(draw: ImageDraw.ImageDraw, x: float, baseline: float, text: str,
              font: ImageFont.FreeTypeFont | ImageFont.ImageFont, size: int,
              fill: tuple[int, ...], anchor: str, bold: int = 0) -> None:
    """Draw one line at an ms/ls/rs anchor, with its accents."""
    base, marks = drawable_form(text)
    draw.text((x, baseline), base, fill=fill, font=font, anchor=anchor, stroke_width=bold,
              stroke_fill=fill)
    if not marks:
        return
    width = font.getlength(base)
    left = x - width / 2 if anchor[0] == "m" else (x - width if anchor[0] == "r" else x)
    for mark in marks:
        start = left + font.getlength(base[: mark.index])
        x0, y0, x1, y1 = font.getbbox(base[mark.index], anchor="ls")
        _mark_shapes(draw, mark.kind, start + (x0 + x1) / 2, baseline + y0,
                     baseline + max(0, y1), float(size), fill)

"""Matching companions from the same seed: an envelope front and a gift tag.

Both reuse the card's palette arrangement, pattern family, pattern parameters and ornament
ids, so they read as one set. Neither contains the photo or any face data.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

from .compose import ornament_art, rounded_rect
from .export import png_bytes
from .geometry import Box
from .grammar import Ornament
from .patterns import build_pattern
from .provider import BuiltinMotifProvider, MotifProvider
from .scene import Scene, TextRun, scene_image
from .service import Card
from .shapes import Circle, Poly, Shape, Stroke, shape_bounds
from .text import text_width, wrap

ENVELOPE_W = 1450.0
ENVELOPE_H = 1050.0
TAG_W = 600.0
TAG_H = 900.0
_BUILTIN = BuiltinMotifProvider()


def _inside(shapes: list[Shape], box: Box) -> list[Shape]:
    kept: list[Shape] = []
    for shape in shapes:
        x0, y0, x1, y1 = shape_bounds([shape])
        if x0 >= box.x and y0 >= box.y and x1 <= box.right and y1 <= box.bottom:
            kept.append(shape)
    return kept


def _fit_size(text: str, width: float, start: int, floor: int = 14) -> int:
    size = start
    while size > floor and text_width(text, size) > width:
        size -= 2
    return size


def _motif_shapes(card: Card, index: int, cx: float, cy: float, size: float,
                  rotation: float = 0.0) -> list[Shape]:
    ornaments = card.design.ornaments
    if not ornaments:
        return []
    source = ornaments[index % len(ornaments)]
    placed = Ornament(source.motif_id, cx, cy, size, rotation, source.swap, source.seed)
    provider: MotifProvider = card.provider if card.provider is not None else _BUILTIN
    single = replace(card.design, ornaments=(placed,))
    return list(ornament_art(single, placed, provider).shapes)


def envelope_scene(card: Card) -> Scene:
    """Envelope front: patterned top band, stamp with the card's ornament, address plate."""
    design = card.design
    w, h = ENVELOPE_W, ENVELOPE_H
    band = Box(0, 0, w, h * 0.26)
    shapes: list[Shape] = [Poly(((0, 0), (w, 0), (w, h), (0, h)), "@background")]
    pattern = build_pattern(design.pattern.family, design.pattern.as_dict(), w, band.h,
                            design.pattern.seed)
    shapes += _inside(pattern, band)
    shapes.append(Stroke(((0, band.bottom), (w, band.bottom)), 6.0, "@accent"))
    stamp = Box(w - 60 - 170, 40, 170, 200)
    shapes.append(rounded_rect(stamp, 6, "#fbfaf6"))
    shapes.append(Stroke(((stamp.x, stamp.y), (stamp.right, stamp.y), (stamp.right, stamp.bottom),
                          (stamp.x, stamp.bottom)), 4.0, "@accent", closed=True))
    shapes += _motif_shapes(card, 0, stamp.x + stamp.w / 2, stamp.y + stamp.h / 2, 130)
    plate = Box(w * 0.19, h * 0.44, w * 0.62, h * 0.3)
    shapes.append(rounded_rect(plate, 24, "@plate"))
    shapes.append(Stroke(rounded_rect(plate, 24, "@accent").points, 3.0, "@accent", closed=True))
    shapes += _motif_shapes(card, 1, 120, h - 120, 120, -8)
    shapes += _motif_shapes(card, 2, w - 120, h - 120, 120, 8)
    to_line = f"To {card.text.to}" if card.text.to else card.text.greeting
    texts = [TextRun(to_line, w / 2, plate.y + plate.h * 0.48,
                     _fit_size(to_line, plate.w - 60, 76), bold=True)]
    texts.append(TextRun(card.text.greeting, w / 2, plate.y + plate.h * 0.8,
                         _fit_size(card.text.greeting, plate.w - 60, 40)))
    if card.text.sender:
        sender = f"From {card.text.sender}"
        texts.append(TextRun(sender, 60, band.y + band.h * 0.62,
                             _fit_size(sender, w * 0.5, 40), anchor="ls"))
    return Scene("envelope", w, h, design.palette.as_dict(), tuple(shapes), tuple(texts))


def _tag_outline(w: float, h: float, cut: float) -> tuple[tuple[float, float], ...]:
    return ((cut, 0.0), (w - cut, 0.0), (w, cut), (w, h), (0.0, h), (0.0, cut))


def gift_tag_scene(card: Card) -> Scene:
    """Gift tag: chamfered tag with a hole, the card's pattern, ornament and greeting."""
    design = card.design
    w, h = TAG_W, TAG_H
    cut = w * 0.12
    shapes: list[Shape] = [Poly(_tag_outline(w, h, cut), "@background")]
    pattern = build_pattern(design.pattern.family, design.pattern.as_dict(), w, h,
                            design.pattern.seed)
    shapes += _inside(pattern, Box(24, 150, w - 48, h - 174))
    shapes.append(Stroke(_tag_outline(w, h, cut), 8.0, "@accent", closed=True))
    shapes.append(Circle(w / 2, 80, 30, "@accent"))
    shapes.append(Circle(w / 2, 80, 22, "#ffffff"))
    shapes += _motif_shapes(card, 0, w / 2, 290, 200)
    plate = Box(50, 430, w - 100, 400)
    shapes.append(rounded_rect(plate, 22, "@plate"))
    shapes.append(Stroke(rounded_rect(plate, 22, "@accent").points, 3.0, "@accent", closed=True))
    texts: list[TextRun] = []
    size = _fit_size(card.text.greeting, plate.w - 40, 60, 28)
    lines = wrap(card.text.greeting, size, plate.w - 40)[:2]
    y = plate.y + 40 + size
    for line in lines:
        texts.append(TextRun(line, w / 2, y, size, bold=True))
        y += size * 1.2
    for label, value in (("To", card.text.to), ("From", card.text.sender)):
        if value:
            line = f"{label} {value}"
            small = _fit_size(line, plate.w - 40, 36)
            y += small * 1.4
            texts.append(TextRun(line, w / 2, y, small))
    return Scene("gift_tag", w, h, design.palette.as_dict(), tuple(shapes), tuple(texts))


def export_envelope_png(card: Card, width: int = 1450) -> bytes:
    """Envelope front as PNG bytes (author and app metadata only)."""
    return png_bytes(scene_image(envelope_scene(card), width))


def export_gift_tag_png(card: Card, width: int = 600) -> bytes:
    """Gift tag as PNG bytes with a transparent outline (author and app metadata only)."""
    return png_bytes(scene_image(gift_tag_scene(card), width))

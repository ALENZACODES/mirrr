"""Composition shared by both renderers: every shape, box and text line of a card.

compose() turns a CardDesign and CardText into absolute card-unit geometry once. The SVG and
raster renderers only paint what is listed here, so they place the photo, the text and the
ornaments in the same boxes.
Author: John Khan.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, replace

from .geometry import Box
from .grammar import CardDesign, FrameSpec, Ornament
from .motifs import BUILTIN_MOTIFS, draw_motif, sparkle
from .occasions import is_forbidden_motif
from .patterns import build_pattern
from .provider import BuiltinMotifProvider, MotifProvider, ShapeMotifProvider, check_motif_svg
from .shapes import Circle, Poly, Shape, Stroke, place
from .text import CardText, TextLayout, layout_text

PLATE_PAD = 22.0
_BUILTIN = BuiltinMotifProvider()


@dataclass(frozen=True)
class OrnamentArt:
    """A placed ornament ready to paint: raster primitives and its SVG element."""

    ornament: Ornament
    shapes: tuple[Shape, ...]
    svg: str | None


@dataclass(frozen=True)
class Composition:
    """Absolute geometry of a card in design units."""

    design: CardDesign
    roles: dict[str, str]
    background: tuple[Shape, ...]
    frame: tuple[Shape, ...]
    ornaments: tuple[OrnamentArt, ...]
    photo_box: Box
    photo_shape: str
    corner: float
    text: TextLayout
    plate: tuple[Shape, ...]
    plate_box: Box | None


def _swap_roles(shapes: list[Shape]) -> list[Shape]:
    swap = {"@ornament": "@accent", "@accent": "@ornament"}
    return [replace(s, colour=swap.get(s.colour, s.colour)) for s in shapes]


def rounded_rect(box: Box, radius: float, colour: str, opacity: float = 1.0) -> Poly:
    """Rounded rectangle as one polygon (corners sampled as quarter circles)."""
    r = max(0.0, min(radius, box.w / 2, box.h / 2))
    corners = ((box.right - r, box.y + r, -math.pi / 2), (box.right - r, box.bottom - r, 0.0),
               (box.x + r, box.bottom - r, math.pi / 2), (box.x + r, box.y + r, math.pi))
    pts: list[tuple[float, float]] = []
    for cx, cy, start in corners:
        for k in range(7):
            a = start + (math.pi / 2) * k / 6
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return Poly(tuple(pts), colour, opacity)


def frame_shapes(frame: FrameSpec, w: float, h: float) -> list[Shape]:
    """Primitives for the card border style."""
    box = Box(0, 0, w, h).inset(frame.inset)
    rect = ((box.x, box.y), (box.right, box.y), (box.right, box.bottom), (box.x, box.bottom))
    if frame.style == "line":
        return [Stroke(rect, frame.width, "@accent", 1.0, closed=True)]
    if frame.style == "double":
        inner = box.inset(frame.width * 2.5)
        inner_rect = ((inner.x, inner.y), (inner.right, inner.y), (inner.right, inner.bottom),
                      (inner.x, inner.bottom))
        return [Stroke(rect, frame.width, "@accent", 1.0, closed=True),
                Stroke(inner_rect, frame.width * 0.6, "@accent", 0.8, closed=True)]
    if frame.style == "dashed":
        out: list[Shape] = []
        dash = frame.width * 6
        for (x0, y0), (x1, y1) in zip(rect, rect[1:] + rect[:1], strict=True):
            length = math.hypot(x1 - x0, y1 - y0)
            steps = int(length // (dash * 2))
            for i in range(steps):
                t0, t1 = (i * 2 * dash) / length, (i * 2 * dash + dash) / length
                out.append(Stroke(((x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0),
                                   (x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1)),
                                  frame.width, "@accent"))
        return out
    if frame.style == "corners":
        arm = min(w, h) * 0.12
        out = []
        for (cx, cy), (sx, sy) in zip(rect, ((1, 1), (-1, 1), (-1, -1), (1, -1)), strict=True):
            out.append(Stroke(((cx, cy + sy * arm), (cx, cy), (cx + sx * arm, cy)),
                              frame.width * 1.4, "@accent"))
            out.append(Circle(cx + sx * arm * 0.35, cy + sy * arm * 0.35, frame.width * 1.2,
                              "@ornament"))
        return out
    return []


def ornament_art(design: CardDesign, ornament: Ornament,
                  provider: MotifProvider) -> OrnamentArt:
    if is_forbidden_motif(ornament.motif_id):
        raise ValueError(f"forbidden motif reached composition: {ornament.motif_id}")
    if isinstance(provider, ShapeMotifProvider):
        unit = provider.motif_shapes(design.occasion, ornament.motif_id, ornament.seed)
        svg = None
    else:
        size = ornament.size
        inner = provider.motif_svg(design.occasion, ornament.motif_id, size, ornament.seed)
        check_motif_svg(inner)
        svg = (f'<g transform="translate({ornament.cx - size / 2:.2f},'
               f'{ornament.cy - size / 2:.2f}) rotate({ornament.rotation:.2f},'
               f'{size / 2:.2f},{size / 2:.2f})">{inner}</g>')
        # Raster output cannot parse foreign SVG; draw the built-in art of the same id,
        # or a sparkle for ids only the external provider knows (ASSUMED fallback).
        if ornament.motif_id in BUILTIN_MOTIFS:
            unit = draw_motif(ornament.motif_id, ornament.seed)
        else:
            unit = sparkle(random.Random(ornament.seed))
    if ornament.swap:
        unit = _swap_roles(unit)
    placed = place(unit, ornament.cx, ornament.cy, ornament.size, ornament.rotation)
    return OrnamentArt(ornament, tuple(placed), svg)


def compose(design: CardDesign, text: CardText,
            provider: MotifProvider | None = None, include_text: bool = True) -> Composition:
    """Resolve a design and its text into absolute shapes and boxes."""
    motif_provider: MotifProvider = provider if provider is not None else _BUILTIN
    roles = design.palette.as_dict()
    background = build_pattern(design.pattern.family, design.pattern.as_dict(), design.width,
                               design.height, design.pattern.seed)
    frame = frame_shapes(design.frame, design.width, design.height)
    ornaments = tuple(ornament_art(design, o, motif_provider) for o in design.ornaments)
    layout = design.layout
    style = design.text_style
    if include_text:
        text_layout = layout_text(text, layout.text_box, layout.align, style.headline_scale,
                                  style.upper)
    else:
        text_layout = TextLayout((), layout.text_box, 0)
    plate: list[Shape] = []
    plate_box: Box | None = None
    if design.palette.plate and text_layout.lines:
        plate_box = text_layout.bounds.inset(-PLATE_PAD)
        plate.append(rounded_rect(plate_box, PLATE_PAD, "@plate"))
    return Composition(design, roles, tuple(background), tuple(frame), ornaments,
                       layout.photo_box, layout.photo_shape, layout.corner, text_layout,
                       tuple(plate), plate_box)


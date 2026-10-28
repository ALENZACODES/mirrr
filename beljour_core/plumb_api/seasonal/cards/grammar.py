"""Design grammar: one seed decides every visual choice of a card.

design_from_seed picks the layout (photo box, mask shape, text block, margins), the background
pattern and its continuous parameters, the palette arrangement and the ornament placements.
The result is a frozen CardDesign made only of numbers, strings and tuples, so it can be
hashed, stored and replayed byte for byte.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import random
from collections.abc import Sequence
from dataclasses import dataclass

from .colour import WCAG_AA_TEXT, best_ink, contrast_ratio, mix, parse_hex, to_hex
from .geometry import Box, circle_hits_box, circles_overlap
from .occasions import Look, get_occasion, is_forbidden_motif
from .patterns import sample_params

DESIGN_VERSION = 1
CARD_W = 1080.0
CARD_H = 1350.0
# Share formats in design units: portrait feed post (default), square post, story.
CARD_FORMATS: dict[str, tuple[float, float]] = {
    "portrait": (CARD_W, CARD_H),
    "square": (1080.0, 1080.0),
    "story": (1080.0, 1920.0),
}
SAFE_FRACTION = 0.035
MIN_ORNAMENT = 0.045
# Headline size relative to body text; capped so the body stays readable on a phone.
HEADLINE_MIN = 1.4
HEADLINE_SPAN = 0.6

UPRIGHT_MOTIFS = frozenset({"kinara", "menorah", "candle", "diya", "lantern", "evergreen",
                            "light_string", "clock", "harvest_corn", "dreidel", "tulip"})
PLACEMENT_STYLES = ("corners", "border", "scatter", "top_band")
FRAME_STYLES = ("none", "line", "double", "dashed", "corners")
ROLE_NAMES = ("background", "pattern", "accent", "ornament", "ink", "plate")


@dataclass(frozen=True)
class LayoutSpec:
    """Where the photo and the text block sit, and the photo mask."""

    layout_id: str
    photo_box: Box
    photo_shape: str
    corner: float
    text_box: Box
    align: str
    margin: float


@dataclass(frozen=True)
class PatternSpec:
    """A background pattern family, its parameter values and its scatter seed."""

    family: str
    params: tuple[tuple[str, float], ...]
    seed: int

    def as_dict(self) -> dict[str, float]:
        return dict(self.params)


@dataclass(frozen=True)
class PaletteSpec:
    """Palette arrangement: which look colour plays which role."""

    order: tuple[int, ...]
    roles: tuple[tuple[str, str], ...]
    plate: bool

    def as_dict(self) -> dict[str, str]:
        return dict(self.roles)


@dataclass(frozen=True)
class Ornament:
    """One placed ornament: motif, centre, box size, rotation and colour swap."""

    motif_id: str
    cx: float
    cy: float
    size: float
    rotation: float
    swap: bool
    seed: int


@dataclass(frozen=True)
class FrameSpec:
    """Border drawn around the whole card."""

    style: str
    inset: float
    width: float


@dataclass(frozen=True)
class TextStyle:
    """How the text block is set."""

    headline_scale: float
    upper: bool


@dataclass(frozen=True)
class CardDesign:
    """Every visual decision of one card. Pure data; no photo and no text."""

    version: int
    occasion: str
    look: str
    seed: int
    width: float
    height: float
    layout: LayoutSpec
    pattern: PatternSpec
    palette: PaletteSpec
    ornaments: tuple[Ornament, ...]
    frame: FrameSpec
    text_style: TextStyle


def sub_seed(seed: int, label: str) -> int:
    """Independent 63-bit stream seed for one design decision."""
    digest = hashlib.sha256(f"{seed}:{label}".encode()).digest()
    return int.from_bytes(digest[:8], "big") >> 1


def _rng(seed: int, label: str) -> random.Random:
    return random.Random(sub_seed(seed, label))


def _r(value: float) -> float:
    return round(value, 2)


def _box(x: float, y: float, w: float, h: float) -> Box:
    return Box(_r(x), _r(y), _r(w), _r(h))


def build_layout(layout_id: str, rng: random.Random, w: float = CARD_W,
                 h: float = CARD_H) -> LayoutSpec:
    """Boxes for one layout id with continuous size and position choices."""
    m = w * rng.uniform(0.06, 0.1)
    gap = h * rng.uniform(0.025, 0.045)
    text_min = h * rng.uniform(0.22, 0.28)
    align = "centre"
    shape = rng.choice(("rect", "rounded"))
    corner = rng.uniform(0.04, 0.12)
    if layout_id in ("photo_top", "framed_centre"):
        pw = w * (rng.uniform(0.62, 0.84) if layout_id == "photo_top" else rng.uniform(0.56, 0.7))
        ph = min(pw * rng.uniform(0.95, 1.25), h - text_min - gap - 2 * m)
        top = m + (h * rng.uniform(0.02, 0.06) if layout_id == "framed_centre" else 0.0)
        photo = _box((w - pw) / 2, top, pw, ph)
        region = Box(m, photo.bottom + gap, w - 2 * m, h - m - photo.bottom - gap)
    elif layout_id == "photo_bottom":
        th = max(text_min, h * rng.uniform(0.24, 0.3))
        pw = w * rng.uniform(0.64, 0.84)
        ph = min(pw * rng.uniform(0.95, 1.2), h - th - gap - 2 * m)
        region = Box(m, m, w - 2 * m, th)
        photo = _box((w - pw) / 2, h - m - ph, pw, ph)
    elif layout_id == "full_bleed":
        ph = h * rng.uniform(0.58, 0.7)
        photo = _box(0, 0, w, ph)
        shape, corner = "rect", 0.0
        region = Box(m, ph + gap, w - 2 * m, h - m - ph - gap)
    elif layout_id in ("offset_left", "offset_right"):
        pw = w * rng.uniform(0.58, 0.72)
        ph = min(pw * rng.uniform(1.0, 1.3), h - text_min - gap - 2 * m)
        x = m if layout_id == "offset_left" else w - m - pw
        photo = _box(x, m + h * rng.uniform(0.0, 0.04), pw, ph)
        align = "right" if layout_id == "offset_left" else "left"
        region = Box(m, photo.bottom + gap, w - 2 * m, h - m - photo.bottom - gap)
    elif layout_id == "arch_window":
        # An arch needs a box taller than wide; on short formats the width gives way.
        room = h - text_min - gap - 2 * m
        pw = min(w * rng.uniform(0.56, 0.7), room / 1.15)
        ph = min(pw * rng.uniform(1.15, 1.35), room)
        photo = _box((w - pw) / 2, m + h * rng.uniform(0.0, 0.04), pw, ph)
        shape, corner = "arch", 0.5
        region = Box(m, photo.bottom + gap, w - 2 * m, h - m - photo.bottom - gap)
    elif layout_id == "circle_badge":
        d = min(w * rng.uniform(0.5, 0.66), h - text_min - gap - 2 * m)
        photo = _box((w - d) / 2, m + h * rng.uniform(0.03, 0.08), d, d)
        shape, corner = "circle", 0.5
        region = Box(m, photo.bottom + gap, w - 2 * m, h - m - photo.bottom - gap)
    elif layout_id == "wide_band":
        ph = h * rng.uniform(0.36, 0.46)
        top = h * rng.uniform(0.12, 0.2)
        photo = _box(m * 0.5, top, w - m, ph)
        region = Box(m, photo.bottom + gap, w - 2 * m, h - m - photo.bottom - gap)
    else:
        raise ValueError(f"unknown layout: {layout_id!r}")
    text = _fit_text(region, align, text_min, rng)
    return LayoutSpec(layout_id, photo, shape, _r(corner), text, align, _r(m))


def _fit_text(region: Box, align: str, text_min: float, rng: random.Random) -> Box:
    # The text block takes part of the free region; the rest is room for ornaments.
    th = min(region.h, max(text_min * 0.85, region.h * rng.uniform(0.6, 0.9)))
    tw = region.w * rng.uniform(0.7, 0.92)
    y = region.y + (region.h - th) * rng.uniform(0.0, 1.0)
    if align == "left":
        x = region.x
    elif align == "right":
        x = region.right - tw
    else:
        x = region.x + (region.w - tw) / 2
    return _box(x, y, tw, th)


def arrange_palette(look: Look, rng: random.Random) -> PaletteSpec:
    """Assign look colours to roles; guarantee AA text contrast with a plate if needed."""
    colours = [parse_hex(c) for c in look.palette]
    bg_idx = rng.choice(look.grounds)
    bg = colours[bg_idx]
    rest = [i for i in range(len(colours)) if i != bg_idx]
    ink_idx = max(rest, key=lambda i: contrast_ratio(colours[i], bg))
    rest.remove(ink_idx)
    soft = sorted(rest, key=lambda i: contrast_ratio(colours[i], bg))
    pattern_idx = rng.choice(soft[:2])
    rest.remove(pattern_idx)
    rng.shuffle(rest)
    accent_idx, ornament_idx = rest[0], rest[1]
    ink = colours[ink_idx]
    plate_colour = bg
    plate = False
    if contrast_ratio(ink, bg) < WCAG_AA_TEXT:
        ink = best_ink(bg)
        if contrast_ratio(ink, bg) < WCAG_AA_TEXT:
            plate = True
            target = (255, 255, 255) if ink[0] < 128 else (0, 0, 0)
            step = 0.0
            while contrast_ratio(ink, plate_colour) < WCAG_AA_TEXT and step < 1.0:
                step += 0.05
                plate_colour = mix(bg, target, step)
    if contrast_ratio(ink, colours[pattern_idx]) < 3.0:
        plate = True
    order = (bg_idx, pattern_idx, accent_idx, ornament_idx, ink_idx)
    roles = (("background", to_hex(bg)), ("pattern", look.palette[pattern_idx]),
             ("accent", look.palette[accent_idx]), ("ornament", look.palette[ornament_idx]),
             ("ink", to_hex(ink)), ("plate", to_hex(plate_colour)))
    return PaletteSpec(order, roles, plate)


def _candidate(style: str, safe: Box, size: float, rng: random.Random) -> tuple[float, float]:
    half = size / 2
    lo_x, hi_x = safe.x + half, safe.right - half
    lo_y, hi_y = safe.y + half, safe.bottom - half
    if style == "corners":
        cx = rng.choice((lo_x, hi_x)) + rng.uniform(-0.6, 0.6) * size
        cy = rng.choice((lo_y, hi_y)) + rng.uniform(-0.6, 0.6) * size
    elif style == "border":
        if rng.random() < 0.5:
            cx = rng.uniform(lo_x, hi_x)
            cy = rng.choice((lo_y, hi_y))
        else:
            cx = rng.choice((lo_x, hi_x))
            cy = rng.uniform(lo_y, hi_y)
    elif style == "top_band":
        cx = rng.uniform(lo_x, hi_x)
        cy = rng.uniform(lo_y, lo_y + (hi_y - lo_y) * 0.35)
    else:
        cx = rng.uniform(lo_x, hi_x)
        cy = rng.uniform(lo_y, hi_y)
    return (min(max(cx, lo_x), hi_x), min(max(cy, lo_y), hi_y))


def place_ornaments(motif_ids: Sequence[str], layout: LayoutSpec, seed: int,
                    w: float = CARD_W, h: float = CARD_H) -> tuple[Ornament, ...]:
    """Place ornaments in the safe area, clear of the photo, the text and each other.

    When a tight layout leaves room for fewer than two ornaments, placement is retried with
    a free scatter and smaller ornaments, up to three rounds.
    """
    rng = _rng(seed, "ornaments")
    style = rng.choice(PLACEMENT_STYLES)
    safe = Box(0, 0, w, h).inset(w * SAFE_FRACTION)
    keep_out = (layout.photo_box.inset(-w * 0.012), layout.text_box.inset(-w * 0.006))
    target = rng.randint(4, 9)
    base = rng.uniform(0.07, 0.13) * w
    placed: list[Ornament] = []
    for _round in range(3):
        placed = []
        discs: list[tuple[float, float, float]] = []
        for index in range(target):
            motif = motif_ids[index % len(motif_ids)]
            size = base * rng.uniform(0.7, 1.3)
            for attempt in range(48):
                # After 20 styled tries, fall back to a free scatter with shrinking size.
                if attempt >= 20:
                    size *= 0.97
                    if size < MIN_ORNAMENT * w:
                        break
                cx, cy = _candidate(style if attempt < 20 else "scatter", safe, size, rng)
                disc = (cx, cy, size * 0.48)
                if any(circle_hits_box(cx, cy, disc[2], box) for box in keep_out):
                    continue
                if any(circles_overlap(disc, other, gap=w * 0.01) for other in discs):
                    continue
                spin = 6.0 if motif in UPRIGHT_MOTIFS else 24.0
                placed.append(Ornament(motif, _r(cx), _r(cy), _r(size),
                                       _r(rng.uniform(-spin, spin)), rng.random() < 0.3,
                                       rng.randrange(1 << 31)))
                discs.append(disc)
                break
        if len(placed) >= 2:
            break
        style = "scatter"
        base *= 0.72
    return tuple(placed)


def format_of(design: CardDesign) -> str:
    """The share format name of a design, from its size."""
    for name, size in CARD_FORMATS.items():
        if size == (design.width, design.height):
            return name
    raise ValueError(f"design size {design.width} x {design.height} is not a card format")


def design_from_seed(occasion_id: str, seed: int, look_id: str | None = None,
                     motif_ids: Sequence[str] | None = None,
                     card_format: str = "portrait") -> CardDesign:
    """Build the complete design for one seed. Same inputs always give the same design."""
    if card_format not in CARD_FORMATS:
        raise ValueError(f"unknown card format: {card_format!r}")
    w, h = CARD_FORMATS[card_format]
    occasion = get_occasion(occasion_id)
    look = occasion.look(look_id) if look_id is not None else \
        occasion.looks[_rng(seed, "look").randrange(len(occasion.looks))]
    layout_rng = _rng(seed, "layout")
    layout = build_layout(layout_rng.choice(look.layouts), layout_rng, w, h)
    pattern_rng = _rng(seed, "pattern")
    family = pattern_rng.choice(look.patterns)
    pattern = PatternSpec(family, sample_params(family, pattern_rng), sub_seed(seed, "scatter"))
    palette = arrange_palette(look, _rng(seed, "palette"))
    pool = [m for m in (motif_ids if motif_ids is not None else look.motifs)
            if not is_forbidden_motif(m)]
    motif_rng = _rng(seed, "motifs")
    motif_rng.shuffle(pool)
    chosen = pool[: motif_rng.randint(min(2, len(pool)), min(4, len(pool)))] if pool else []
    ornaments = place_ornaments(chosen, layout, seed, w, h) if chosen else ()
    frame_rng = _rng(seed, "frame")
    frame = FrameSpec(frame_rng.choice(FRAME_STYLES), _r(frame_rng.uniform(14, 34)),
                      _r(frame_rng.uniform(2, 7)))
    style_rng = _rng(seed, "text")
    headline = _r(style_rng.uniform(HEADLINE_MIN, HEADLINE_MIN + HEADLINE_SPAN))
    text_style = TextStyle(headline, style_rng.random() < 0.35)
    return CardDesign(DESIGN_VERSION, occasion.id, look.id, seed, w, h, layout,
                      pattern, palette, ornaments, frame, text_style)

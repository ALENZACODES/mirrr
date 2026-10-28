"""Frames: a motif border drawn around the whole picture.

Two styles share one renderer. "band" lays a tinted band with motifs spaced
evenly along it and a thin inner rule; "scatter" drops seeded, rotated motifs
along the edges with no band, for a looser leaf or flower frame. The middle
of the picture is never touched by a frame.
Author: John Khan.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass

from .model import Look, PackError, Palette
from .motifs import motif_shapes
from .raster import ImageArray, Layer, composite, with_alpha
from .shapes import stamp


@dataclass(frozen=True)
class Slot:
    """Where one motif of the frame is stamped."""

    x: float
    y: float
    size: float
    angle: float
    motif: str


@dataclass(frozen=True)
class FrameGeometry:
    """Band width and motif size in pixels for an image and amount."""

    band: int
    motif: float


def frame_geometry(width: int, height: int, look: Look, amount: float) -> FrameGeometry:
    """Band thickness grows with the amount; motifs fit inside the band."""
    short = min(width, height)
    base = max(0.04, min(0.2, look.param_float("band", 0.1)))
    band = max(4, int(round(short * base * (0.75 + 0.35 * amount))))
    motif = band * max(0.4, min(1.6, look.param_float("motif_scale", 0.9)))
    return FrameGeometry(band=band, motif=motif)


def _edge_positions(length: float, start: float, size: float, spacing: float) -> list[float]:
    usable = length - 2.0 * start
    if usable <= size * 0.5:
        return []
    count = max(1, int(usable // (size * spacing)))
    step = usable / count
    return [start + step * (index + 0.5) for index in range(count)]


def band_slots(
    width: int, height: int, geometry: FrameGeometry, look: Look, seed: int
) -> list[Slot]:
    """Evenly spaced slots around the band, corners included."""
    motifs = look.param_names("motifs", look.motifs)
    if not motifs:
        raise PackError(f"look {look.id}: a frame needs at least one motif")
    rng = random.Random(f"band:{look.id}:{seed}")
    spacing = max(1.0, look.param_float("spacing", 1.3))
    jitter = look.param_float("jitter", 10.0)
    half = geometry.band / 2.0
    size = geometry.motif
    corner = look.param_str("corner", "")
    slots: list[Slot] = []
    if corner:
        for cx, cy in (
            (half, half),
            (width - half, half),
            (half, height - half),
            (width - half, height - half),
        ):
            slots.append(Slot(cx, cy, size * 1.15, rng.uniform(-jitter, jitter), corner))
        start = geometry.band * 1.1
    else:
        start = 0.0
    index = 0
    for y in (half, height - half):
        for x in _edge_positions(width, start, size, spacing):
            slots.append(
                Slot(x, y, size, rng.uniform(-jitter, jitter), motifs[index % len(motifs)])
            )
            index += 1
    for x in (half, width - half):
        for y in _edge_positions(height, max(start, geometry.band * 1.0), size, spacing):
            slots.append(
                Slot(x, y, size, rng.uniform(-jitter, jitter), motifs[index % len(motifs)])
            )
            index += 1
    return slots


def scatter_slots(
    width: int, height: int, geometry: FrameGeometry, look: Look, seed: int
) -> list[Slot]:
    """Seeded loose slots hugging the edges, sizes and turns varied."""
    motifs = look.param_names("motifs", look.motifs)
    if not motifs:
        raise PackError(f"look {look.id}: a frame needs at least one motif")
    rng = random.Random(f"scatter:{look.id}:{seed}")
    density = max(0.5, min(3.0, look.param_float("density", 1.4)))
    perimeter = 2.0 * (width + height)
    count = max(8, int(perimeter / geometry.motif * density))
    band = float(geometry.band)
    slots: list[Slot] = []
    for index in range(count):
        along = (index + rng.random() * 0.8) / count * perimeter
        depth = rng.uniform(0.15, 0.85) * band
        if along < width:
            x, y = along, depth
        elif along < width + height:
            x, y = width - depth, along - width
        elif along < 2 * width + height:
            x, y = 2 * width + height - along, height - depth
        else:
            x, y = depth, perimeter - along
        size = geometry.motif * rng.uniform(0.75, 1.25)
        slots.append(Slot(x, y, size, rng.uniform(0.0, 360.0), motifs[rng.randrange(len(motifs))]))
    return slots


def _strips(width: int, height: int, reach: int) -> list[tuple[int, int, int, int]]:
    reach = min(reach, width // 2, height // 2)
    return [
        (0, 0, width, reach),
        (0, height - reach, width, height),
        (0, reach, reach, height - reach),
        (width - reach, reach, width, height - reach),
    ]


def _touches_strip(slot: Slot, strip: tuple[int, int, int, int]) -> bool:
    """Strips are disjoint, so a motif crossing a seam is drawn in each part."""
    x0, y0, x1, y1 = strip
    reach = slot.size * 0.75
    return (
        slot.x + reach > x0 and slot.x - reach < x1 and slot.y + reach > y0 and slot.y - reach < y1
    )


def render_frame(
    image: ImageArray,
    look: Look,
    palette: Palette,
    occasion: str,
    amount: float,
    seed: int,
) -> ImageArray:
    """Draw a frame look on a copy of the image."""
    height, width = image.shape[:2]
    geometry = frame_geometry(width, height, look, amount)
    style = look.param_str("style", "band")
    if style == "band":
        slots = band_slots(width, height, geometry, look, seed)
    elif style == "scatter":
        slots = scatter_slots(width, height, geometry, look, seed)
    else:
        raise PackError(f"look {look.id}: unknown frame style {style!r}")
    reach = int(math.ceil(geometry.band + geometry.motif * 0.35))
    band_alpha = max(0.0, min(0.95, look.param_float("band_opacity", 0.7)))
    band_colour = palette.rgb(look.param_str("band_colour", "primary"))
    rule_colour = palette.rgb(look.param_str("rule_colour", "accent"))
    out = image
    for strip in _strips(width, height, reach):
        if strip[2] <= strip[0] or strip[3] <= strip[1]:
            continue
        layer = Layer(*strip)
        if style == "band" and band_alpha > 0:
            _draw_band(
                layer, strip, width, height, geometry.band, with_alpha(band_colour, band_alpha)
            )
            _draw_rule(layer, width, height, geometry.band, with_alpha(rule_colour, 0.9))
        for slot in slots:
            if _touches_strip(slot, strip):
                shapes = motif_shapes(occasion, slot.motif, seed + int(slot.x * 7 + slot.y * 13))
                stamp(layer, shapes, slot.x, slot.y, slot.size, slot.angle)
        out = composite(out, layer, opacity=0.55 + 0.45 * amount)
    return out


def _draw_band(
    layer: Layer,
    strip: tuple[int, int, int, int],
    width: int,
    height: int,
    band: int,
    fill: tuple[int, int, int, int],
) -> None:
    x0, y0, x1, y1 = strip
    bx0, by0 = max(x0, 0), max(y0, 0)
    bx1, by1 = min(x1, width), min(y1, height)
    inner = (band, band, width - band, height - band)
    pieces = (
        (bx0, by0, bx1, min(by1, inner[1])),
        (bx0, max(by0, inner[3]), bx1, by1),
        (bx0, max(by0, inner[1]), min(bx1, inner[0]), min(by1, inner[3])),
        (max(bx0, inner[2]), max(by0, inner[1]), bx1, min(by1, inner[3])),
    )
    for px0, py0, px1, py1 in pieces:
        if px1 > px0 and py1 > py0:
            layer.polygon([(px0, py0), (px1, py0), (px1, py1), (px0, py1)], fill)


def _draw_rule(
    layer: Layer, width: int, height: int, band: int, colour: tuple[int, int, int, int]
) -> None:
    rule = max(1.0, band * 0.06)
    inset = band + rule / 2.0
    corners = [
        (inset, inset),
        (width - inset, inset),
        (width - inset, height - inset),
        (inset, height - inset),
        (inset, inset),
    ]
    layer.line(corners, colour, rule)

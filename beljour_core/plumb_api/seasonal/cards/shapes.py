"""Drawing primitives shared by the SVG and raster card renderers.

Motifs and background patterns are lists of three primitive kinds: filled circles, filled
polygons and stroked polylines. Both renderers draw the same list, so the SVG and the PNG of
a card agree by construction. Colours are '#rrggbb' literals or palette roles written '@role'.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass

from PIL import ImageDraw

from .colour import RGB, parse_hex

Point = tuple[float, float]


@dataclass(frozen=True)
class Circle:
    """A filled disc."""

    cx: float
    cy: float
    r: float
    colour: str
    opacity: float = 1.0


@dataclass(frozen=True)
class Poly:
    """A filled polygon; points are listed in drawing order."""

    points: tuple[Point, ...]
    colour: str
    opacity: float = 1.0


@dataclass(frozen=True)
class Stroke:
    """A stroked polyline, optionally closed."""

    points: tuple[Point, ...]
    width: float
    colour: str
    opacity: float = 1.0
    closed: bool = False


Shape = Circle | Poly | Stroke


def ellipse_points(cx: float, cy: float, rx: float, ry: float,
                   steps: int = 24) -> tuple[Point, ...]:
    """Sample an axis-aligned ellipse as a closed polygon outline."""
    return tuple(
        (cx + rx * math.cos(2 * math.pi * i / steps), cy + ry * math.sin(2 * math.pi * i / steps))
        for i in range(steps)
    )


def star_points(cx: float, cy: float, outer: float, inner: float, tips: int,
                turn: float = -math.pi / 2) -> tuple[Point, ...]:
    """Points of a regular star with the given number of tips."""
    pts: list[Point] = []
    for i in range(tips * 2):
        radius = outer if i % 2 == 0 else inner
        angle = turn + math.pi * i / tips
        pts.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return tuple(pts)


def arc_points(cx: float, cy: float, r: float, start: float, end: float,
               steps: int = 16) -> tuple[Point, ...]:
    """Points along a circular arc from start to end angle (radians)."""
    return tuple(
        (cx + r * math.cos(start + (end - start) * i / steps),
         cy + r * math.sin(start + (end - start) * i / steps))
        for i in range(steps + 1)
    )


def _move(p: Point, x: float, y: float, size: float, cos_t: float, sin_t: float) -> Point:
    # Unit-box point -> rotate about the box centre -> scale -> translate.
    ux, uy = p[0] - 0.5, p[1] - 0.5
    rx = ux * cos_t - uy * sin_t
    ry = ux * sin_t + uy * cos_t
    return (x + rx * size, y + ry * size)


def place(shapes: Iterable[Shape], cx: float, cy: float, size: float,
          rotation_deg: float = 0.0) -> list[Shape]:
    """Move unit-box shapes so the box is centred at (cx, cy) with the given size."""
    t = math.radians(rotation_deg)
    cos_t, sin_t = math.cos(t), math.sin(t)
    out: list[Shape] = []
    for shape in shapes:
        if isinstance(shape, Circle):
            cxy = _move((shape.cx, shape.cy), cx, cy, size, cos_t, sin_t)
            out.append(Circle(cxy[0], cxy[1], shape.r * size, shape.colour, shape.opacity))
        elif isinstance(shape, Poly):
            pts = tuple(_move(p, cx, cy, size, cos_t, sin_t) for p in shape.points)
            out.append(Poly(pts, shape.colour, shape.opacity))
        else:
            pts = tuple(_move(p, cx, cy, size, cos_t, sin_t) for p in shape.points)
            out.append(Stroke(pts, shape.width * size, shape.colour, shape.opacity, shape.closed))
    return out


def resolve(colour: str, roles: Mapping[str, str]) -> str:
    """Turn '@role' into the palette colour for that role; literals pass through."""
    if colour.startswith("@"):
        return roles[colour[1:]]
    return colour


def _num(value: float) -> str:
    text = f"{value:.2f}".rstrip("0").rstrip(".")
    return "0" if text in ("-0", "") else text


def _opacity_attr(opacity: float) -> str:
    if opacity >= 0.999:
        return ""
    return f' fill-opacity="{_num(opacity)}"'


def shape_svg(shape: Shape, roles: Mapping[str, str]) -> str:
    """One SVG element for a primitive, colours resolved against the palette roles."""
    colour = resolve(shape.colour, roles)
    if isinstance(shape, Circle):
        return (f'<circle cx="{_num(shape.cx)}" cy="{_num(shape.cy)}" r="{_num(shape.r)}" '
                f'fill="{colour}"{_opacity_attr(shape.opacity)}/>')
    pts = " ".join(f"{_num(x)},{_num(y)}" for x, y in shape.points)
    if isinstance(shape, Poly):
        return f'<polygon points="{pts}" fill="{colour}"{_opacity_attr(shape.opacity)}/>'
    tag = "polygon" if shape.closed else "polyline"
    stroke_opacity = "" if shape.opacity >= 0.999 else f' stroke-opacity="{_num(shape.opacity)}"'
    return (f'<{tag} points="{pts}" fill="none" stroke="{colour}" '
            f'stroke-width="{_num(shape.width)}" stroke-linecap="round" '
            f'stroke-linejoin="round"{stroke_opacity}/>')


def shapes_svg(shapes: Sequence[Shape], roles: Mapping[str, str]) -> str:
    """Concatenated SVG elements for a list of primitives."""
    return "".join(shape_svg(s, roles) for s in shapes)


def _rgba(colour: str, opacity: float) -> tuple[int, int, int, int]:
    rgb: RGB = parse_hex(colour)
    return (rgb[0], rgb[1], rgb[2], max(0, min(255, int(round(opacity * 255)))))


def draw_shapes(draw: ImageDraw.ImageDraw, shapes: Sequence[Shape], roles: Mapping[str, str],
                scale: float, dx: float = 0.0, dy: float = 0.0) -> None:
    """Draw primitives with Pillow; coordinates are multiplied by scale then shifted."""
    for shape in shapes:
        fill = _rgba(resolve(shape.colour, roles), shape.opacity)
        if isinstance(shape, Circle):
            x, y, r = shape.cx * scale + dx, shape.cy * scale + dy, shape.r * scale
            if r < 0.35:
                continue
            draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)
            continue
        pts = [(x * scale + dx, y * scale + dy) for x, y in shape.points]
        if isinstance(shape, Poly):
            if len(pts) >= 3:
                draw.polygon(pts, fill=fill)
            continue
        if shape.closed:
            pts = pts + [pts[0]]
        width = max(1, int(round(shape.width * scale)))
        draw.line(pts, fill=fill, width=width, joint="curve")


def shape_bounds(shapes: Sequence[Shape]) -> tuple[float, float, float, float]:
    """Axis-aligned bounds (x0, y0, x1, y1) of a list of primitives."""
    xs: list[float] = []
    ys: list[float] = []
    for shape in shapes:
        if isinstance(shape, Circle):
            xs += [shape.cx - shape.r, shape.cx + shape.r]
            ys += [shape.cy - shape.r, shape.cy + shape.r]
        else:
            pad = shape.width / 2 if isinstance(shape, Stroke) else 0.0
            xs += [p[0] - pad for p in shape.points] + [p[0] + pad for p in shape.points]
            ys += [p[1] - pad for p in shape.points] + [p[1] + pad for p in shape.points]
    if not xs:
        return (0.0, 0.0, 0.0, 0.0)
    return (min(xs), min(ys), max(xs), max(ys))

"""Vector shapes shared by the SVG motif output and the raster renderers.

A motif is a tuple of Shape values drawn in a unit box (0..1, y down). The
same tuple becomes an SVG <g> element for cards or is stamped into a Layer
for photos, so a motif looks the same in both places.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from enum import StrEnum

from .model import hex_to_rgb
from .raster import Layer, with_alpha
from .target import Point


class ShapeKind(StrEnum):
    """Primitive kinds a motif may use."""

    POLYGON = "polygon"
    ELLIPSE = "ellipse"
    LINE = "line"


@dataclass(frozen=True)
class Shape:
    """One primitive in unit-box coordinates.

    POLYGON and LINE use points. ELLIPSE uses centre, radii and angle (degrees).
    Width is the stroke width of a LINE in unit-box units.
    """

    kind: ShapeKind
    colour: str
    points: tuple[Point, ...] = ()
    centre: Point = (0.5, 0.5)
    radii: Point = (0.0, 0.0)
    angle: float = 0.0
    width: float = 0.0
    opacity: float = 1.0


def poly(colour: str, points: Sequence[Point], opacity: float = 1.0) -> Shape:
    """A filled polygon."""
    return Shape(ShapeKind.POLYGON, colour, points=tuple(points), opacity=opacity)


def oval(
    colour: str,
    centre: Point,
    radii: Point,
    angle: float = 0.0,
    opacity: float = 1.0,
) -> Shape:
    """A filled, optionally rotated ellipse."""
    return Shape(
        ShapeKind.ELLIPSE, colour, centre=centre, radii=radii, angle=angle, opacity=opacity
    )


def stroke(colour: str, points: Sequence[Point], width: float, opacity: float = 1.0) -> Shape:
    """An open polyline with a stroke width in unit-box units."""
    return Shape(ShapeKind.LINE, colour, points=tuple(points), width=width, opacity=opacity)


def star_points(
    cx: float, cy: float, outer: float, inner: float, tips: int, turn: float = 0.0
) -> list[Point]:
    """Points of a regular star polygon, first tip pointing up before turn."""
    points: list[Point] = []
    for index in range(tips * 2):
        radius = outer if index % 2 == 0 else inner
        theta = math.radians(turn) - math.pi / 2.0 + math.pi * index / tips
        points.append((cx + radius * math.cos(theta), cy + radius * math.sin(theta)))
    return points


def circle_points(cx: float, cy: float, radius: float, steps: int = 32) -> list[Point]:
    """Polygon approximation of a circle."""
    return [
        (
            cx + radius * math.cos(2.0 * math.pi * i / steps),
            cy + radius * math.sin(2.0 * math.pi * i / steps),
        )
        for i in range(steps)
    ]


def rect_points(cx: float, cy: float, w: float, h: float, angle: float = 0.0) -> list[Point]:
    """Corners of a rotated rectangle centred on (cx, cy)."""
    cos_a, sin_a = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    corners = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
    return [(cx + x * cos_a - y * sin_a, cy + x * sin_a + y * cos_a) for x, y in corners]


def crescent_points(
    centre: Point,
    radius: float,
    cut_centre: Point,
    cut_radius: float,
    steps: int = 72,
) -> list[Point]:
    """Outline of a circle with an overlapping circle cut away."""

    def inside(point: Point, c: Point, r: float) -> bool:
        return (point[0] - c[0]) ** 2 + (point[1] - c[1]) ** 2 < r * r

    outer = circle_points(centre[0], centre[1], radius, steps)
    keep_outer = [not inside(p, cut_centre, cut_radius) for p in outer]
    start = next((i for i in range(steps) if keep_outer[i] and not keep_outer[i - 1]), 0)
    outer_arc = [
        outer[(start + i) % steps] for i in range(steps) if keep_outer[(start + i) % steps]
    ]
    inner = circle_points(cut_centre[0], cut_centre[1], cut_radius, steps)
    keep_inner = [inside(p, centre, radius) for p in inner]
    first = next((i for i in range(steps) if keep_inner[i] and not keep_inner[i - 1]), 0)
    inner_arc = [
        inner[(first + i) % steps] for i in range(steps) if keep_inner[(first + i) % steps]
    ]
    return outer_arc + list(reversed(inner_arc))


def transform_point(point: Point, x: float, y: float, size: float, angle: float) -> Point:
    """Unit-box point to image pixels: centre at (x, y), scaled and rotated."""
    px, py = (point[0] - 0.5) * size, (point[1] - 0.5) * size
    cos_a, sin_a = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    return (x + px * cos_a - py * sin_a, y + px * sin_a + py * cos_a)


def stamp(
    layer: Layer,
    shapes: Sequence[Shape],
    x: float,
    y: float,
    size: float,
    angle: float = 0.0,
    alpha: float = 1.0,
    recolour: str | None = None,
) -> None:
    """Draw shapes centred on (x, y) at size pixels, rotated by angle degrees.

    recolour replaces every colour, which turns a motif into a solid silhouette
    (used for face paint and for shadows).
    """
    for shape in shapes:
        colour = hex_to_rgb(recolour or shape.colour)
        fill = with_alpha(colour, alpha * shape.opacity)
        if shape.kind is ShapeKind.ELLIPSE:
            cx, cy = transform_point(shape.centre, x, y, size, angle)
            layer.ellipse(
                cx, cy, shape.radii[0] * size, shape.radii[1] * size, fill, shape.angle + angle
            )
        elif shape.kind is ShapeKind.LINE:
            points = [transform_point(p, x, y, size, angle) for p in shape.points]
            layer.line(points, fill, max(1.0, shape.width * size))
        else:
            points = [transform_point(p, x, y, size, angle) for p in shape.points]
            layer.polygon(points, fill)


def _num(value: float) -> str:
    text = f"{value:.2f}".rstrip("0").rstrip(".")
    return "0" if text in ("-0", "") else text


def _points_attr(points: Sequence[Point], size: float) -> str:
    return " ".join(f"{_num(px * size)},{_num(py * size)}" for px, py in points)


def shape_svg(shape: Shape, size: float) -> str:
    """One SVG element for a shape scaled to a size x size box at the origin."""
    opacity = "" if shape.opacity >= 1.0 else f' fill-opacity="{_num(shape.opacity)}"'
    if shape.kind is ShapeKind.ELLIPSE:
        cx, cy = shape.centre[0] * size, shape.centre[1] * size
        rotate = ""
        if abs(shape.angle) > 1e-6:
            rotate = f' transform="rotate({_num(shape.angle)} {_num(cx)} {_num(cy)})"'
        return (
            f'<ellipse cx="{_num(cx)}" cy="{_num(cy)}" rx="{_num(shape.radii[0] * size)}" '
            f'ry="{_num(shape.radii[1] * size)}" fill="{shape.colour}"{opacity}{rotate}/>'
        )
    if shape.kind is ShapeKind.LINE:
        stroke_opacity = "" if shape.opacity >= 1.0 else f' stroke-opacity="{_num(shape.opacity)}"'
        return (
            f'<polyline points="{_points_attr(shape.points, size)}" fill="none" '
            f'stroke="{shape.colour}" stroke-width="{_num(max(0.5, shape.width * size))}" '
            f'stroke-linecap="round" stroke-linejoin="round"{stroke_opacity}/>'
        )
    return f'<polygon points="{_points_attr(shape.points, size)}" fill="{shape.colour}"{opacity}/>'


def group_svg(shapes: Sequence[Shape], size: float, attributes: dict[str, str]) -> str:
    """A self-contained <g> element with data attributes and no external refs."""
    attrs = "".join(f' {key}="{value}"' for key, value in sorted(attributes.items()))
    body = "".join(shape_svg(shape, size) for shape in shapes)
    return f"<g{attrs}>{body}</g>"

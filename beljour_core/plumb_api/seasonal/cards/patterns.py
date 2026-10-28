"""Background pattern families with continuous parameters.

Each family declares named parameter ranges. A design stores the parameter values plus a
pattern seed; build_pattern turns them into primitives covering the whole card. Parameter
values normalised to 0..1 feed the uniqueness engine's parameter distance.
Author: John Khan.
"""

from __future__ import annotations

import math
import random
from collections.abc import Callable, Mapping
from dataclasses import dataclass

from .shapes import Circle, Point, Poly, Shape, Stroke, ellipse_points, star_points


@dataclass(frozen=True)
class ParamSpec:
    """One continuous pattern parameter and its allowed range."""

    name: str
    lo: float
    hi: float


Params = Mapping[str, float]
Builder = Callable[[Params, float, float, random.Random], list[Shape]]


def _rotate(p: Point, cx: float, cy: float, angle: float) -> Point:
    c, s = math.cos(angle), math.sin(angle)
    x, y = p[0] - cx, p[1] - cy
    return (cx + x * c - y * s, cy + x * s + y * c)


def _stripes(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    angle = math.radians(p["angle"])
    period = p["period"]
    band = period * p["duty"]
    reach = math.hypot(w, h)
    cx, cy = w / 2, h / 2
    shapes: list[Shape] = []
    accent_every = 2 + int(p["accent"] * 3)
    n = int(reach / period) + 2
    for i in range(-n, n + 1):
        x0 = cx + i * period
        corners = ((x0, cy - reach), (x0 + band, cy - reach), (x0 + band, cy + reach),
                   (x0, cy + reach))
        colour = "@accent" if i % accent_every == 0 else "@pattern"
        shapes.append(Poly(tuple(_rotate(c, cx, cy, angle) for c in corners), colour,
                           p["opacity"]))
    return shapes


def _dots(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    step = p["spacing"]
    radius = step * p["radius"]
    jitter = step * p["jitter"]
    shapes: list[Shape] = []
    rows = int(h / step) + 2
    cols = int(w / step) + 2
    for row in range(rows):
        offset = step * p["stagger"] * 0.5 if row % 2 else 0.0
        for col in range(cols):
            x = col * step + offset + rng.uniform(-jitter, jitter)
            y = row * step + rng.uniform(-jitter, jitter)
            shapes.append(Circle(x, y, radius, "@pattern", p["opacity"]))
    return shapes


def _tiles(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    size = p["size"]
    half = size * (1 - p["gap"]) / 2
    angle = math.radians(p["rotation"])
    shapes: list[Shape] = []
    checker = p["checker"] > 0.5
    for row in range(int(h / size) + 2):
        for col in range(int(w / size) + 2):
            cx, cy = col * size, row * size
            corners = ((cx - half, cy - half), (cx + half, cy - half), (cx + half, cy + half),
                       (cx - half, cy + half))
            colour = "@accent" if checker and (row + col) % 2 else "@pattern"
            shapes.append(Poly(tuple(_rotate(c, cx, cy, angle) for c in corners), colour,
                               p["opacity"]))
    return shapes


def _waves(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    spacing = p["spacing"]
    steps = max(12, int(w / 18))
    for row in range(int(h / spacing) + 2):
        y0 = row * spacing
        phase = p["phase"] * 2 * math.pi + row * 0.6
        pts = tuple(
            (w * i / steps,
             y0 + p["amplitude"]
             * math.sin(2 * math.pi * (w * i / steps) / p["wavelength"] + phase))
            for i in range(steps + 1)
        )
        colour = "@accent" if row % 3 == 2 else "@pattern"
        shapes.append(Stroke(pts, p["thickness"], colour, p["opacity"]))
    return shapes


def _rangoli(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    folds = int(round(p["folds"]))
    rings = int(round(p["rings"]))
    cx, cy = w * p["cx"], h * p["cy"]
    span = max(w, h) * 0.9
    shapes: list[Shape] = []
    turn = p["rotation"] * 2 * math.pi / folds
    for ring in range(rings, 0, -1):
        radius = span * ring / rings
        petal = radius / rings * p["petal"] * 2.2
        colour = "@accent" if ring % 2 else "@pattern"
        for i in range(folds):
            a = turn + 2 * math.pi * (i + 0.5 * (ring % 2)) / folds
            c, s = math.cos(a), math.sin(a)
            inner = radius - petal
            pts = ((cx + c * inner, cy + s * inner),
                   (cx + c * (radius - petal / 2) - s * petal * 0.35,
                    cy + s * (radius - petal / 2) + c * petal * 0.35),
                   (cx + c * radius, cy + s * radius),
                   (cx + c * (radius - petal / 2) + s * petal * 0.35,
                    cy + s * (radius - petal / 2) - c * petal * 0.35))
            shapes.append(Poly(pts, colour, p["opacity"]))
        shapes.append(Stroke(tuple((cx + radius * 0.5 * math.cos(2 * math.pi * k / 48),
                                    cy + radius * 0.5 * math.sin(2 * math.pi * k / 48))
                                   for k in range(48)), 3.0, "@pattern", p["opacity"],
                             closed=True))
    return shapes


def _scatter_points(count: int, w: float, h: float, rng: random.Random) -> list[Point]:
    # Jittered grid keeps scatters even without clumps or bald patches.
    cols = max(1, int(math.sqrt(count * w / h)))
    rows = max(1, int(math.ceil(count / cols)))
    pts: list[Point] = []
    for i in range(count):
        r, c = divmod(i, cols)
        pts.append(((c + rng.random()) * w / cols, (r + rng.random()) * h / rows))
    return pts


def _snowfall(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    for x, y in _scatter_points(int(p["density"]), w, h, rng):
        size = rng.uniform(p["size"] * 0.4, p["size"])
        if size > p["size"] * 0.85:
            arms: list[Shape] = []
            for k in range(3):
                a = math.pi / 3 * k + p["twist"]
                dx, dy = size * math.cos(a), size * math.sin(a)
                arms.append(Stroke(((x - dx, y - dy), (x + dx, y + dy)), size * 0.18,
                                   "@pattern", p["opacity"]))
            shapes += arms
        else:
            shapes.append(Circle(x, y, size * 0.35, "@pattern", p["opacity"]))
    return shapes


def _confetti(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    colours = ("@pattern", "@accent", "@ornament")
    for i, (x, y) in enumerate(_scatter_points(int(p["density"]), w, h, rng)):
        length = p["size"]
        width = length / p["aspect"]
        a = rng.uniform(0, math.pi)
        corners = ((x - length / 2, y - width / 2), (x + length / 2, y - width / 2),
                   (x + length / 2, y + width / 2), (x - length / 2, y + width / 2))
        shapes.append(Poly(tuple(_rotate(c, x, y, a) for c in corners), colours[i % 3],
                           p["opacity"]))
    return shapes


def _leaf_scatter(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    for i, (x, y) in enumerate(_scatter_points(int(p["density"]), w, h, rng)):
        size = p["size"] * rng.uniform(0.7, 1.15)
        a = rng.uniform(-p["spread"], p["spread"]) * math.pi
        outline = ((0.0, -0.5), (0.22, -0.18), (0.18, 0.2), (0.0, 0.5), (-0.18, 0.2),
                   (-0.22, -0.18))
        pts = tuple(_rotate((x + ox * size, y + oy * size), x, y, a) for ox, oy in outline)
        shapes.append(Poly(pts, "@accent" if i % 4 == 0 else "@pattern", p["opacity"]))
    return shapes


def _chevrons(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    period = p["period"]
    zig = p["zig"]
    for row in range(int(h / period) + 2):
        y = row * period
        pts: list[Point] = []
        x = 0.0
        up = True
        while x <= w + zig:
            pts.append((x, y - p["height"] / 2 if up else y + p["height"] / 2))
            x += zig
            up = not up
        colour = "@accent" if row % 2 else "@pattern"
        shapes.append(Stroke(tuple(pts), p["thickness"], colour, p["opacity"]))
    return shapes


def _sunburst(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    rays = int(round(p["rays"]))
    cx, cy = w * p["cx"], h * p["cy"]
    reach = math.hypot(w, h) * 1.2
    shapes: list[Shape] = []
    for i in range(0, rays * 2, 2):
        a0 = 2 * math.pi * i / (rays * 2) + p["twist"]
        a1 = 2 * math.pi * (i + 1) / (rays * 2) + p["twist"]
        shapes.append(Poly(((cx, cy), (cx + reach * math.cos(a0), cy + reach * math.sin(a0)),
                            (cx + reach * math.cos(a1), cy + reach * math.sin(a1))),
                           "@pattern", p["opacity"]))
    return shapes


def _starfield(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    for x, y in _scatter_points(int(p["density"]), w, h, rng):
        if rng.random() < p["big"]:
            size = p["size"] * rng.uniform(1.5, 2.6)
            shapes.append(Poly(star_points(x, y, size, size * 0.42, 4), "@accent", p["opacity"]))
        else:
            shapes.append(Circle(x, y, p["size"] * rng.uniform(0.25, 0.6), "@pattern",
                                 p["opacity"]))
    return shapes


def _scallops(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    r = p["radius"]
    shapes: list[Shape] = []
    for row in range(int(h / (r * p["rise"])) + 2):
        y = row * r * p["rise"]
        offset = r if row % 2 else 0.0
        for col in range(int(w / (2 * r)) + 2):
            x = col * 2 * r + offset
            colour = "@accent" if (row + col) % 5 == 0 else "@pattern"
            arc = tuple((x + r * math.cos(math.pi + math.pi * k / 12),
                         y + r * math.sin(math.pi + math.pi * k / 12)) for k in range(13))
            shapes.append(Stroke(arc, p["line"], colour, p["opacity"]))
    return shapes


def _bokeh(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    colours = ("@accent", "@pattern", "@ornament")
    for i, (x, y) in enumerate(_scatter_points(int(p["density"]), w, h, rng)):
        size = p["size"] * rng.uniform(0.4, 1.0)
        alpha = p["opacity"] * rng.uniform(0.5, 1.0)
        shapes.append(Circle(x, y, size, colours[i % 3], alpha))
        shapes.append(Circle(x, y, size * 0.55, colours[i % 3], alpha * p["core"]))
    return shapes


def _colour_cloud(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    colours = ("@accent", "@ornament", "@pattern", "@ink")
    for i, (x, y) in enumerate(_scatter_points(int(p["blobs"]), w, h, rng)):
        rx = p["size"] * rng.uniform(0.5, 1.0)
        ry = rx * rng.uniform(0.5, 1.0) * p["squash"]
        weight = 0.35 if colours[i % 4] == "@ink" else 1.0
        shapes.append(Poly(ellipse_points(x, y, rx, ry, 20), colours[i % 4],
                           p["opacity"] * weight))
    return shapes


def _garland(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    span, depth = p["span"], p["depth"]
    for row in range(int(h / p["spacing"]) + 1):
        y = row * p["spacing"] + p["spacing"] * 0.3
        offset = span / 2 if row % 2 else 0.0
        x = -offset
        while x < w:
            arc = tuple((x + span * k / 12, y + depth * math.sin(math.pi * k / 12))
                        for k in range(13))
            shapes.append(Stroke(arc, max(2.0, p["bead"] * 0.35), "@pattern", p["opacity"]))
            for k in range(1, 12, 2):
                bx, by = arc[k]
                colour = "@accent" if (k // 2) % 2 else "@ornament"
                shapes.append(Circle(bx, by, p["bead"], colour, p["opacity"]))
            x += span
    return shapes


def _petals(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    colours = ("@pattern", "@accent", "@ornament")
    for x, y in _scatter_points(int(p["density"]), w, h, rng):
        size = p["size"] * rng.uniform(0.7, 1.2)
        a = rng.uniform(0, 2 * math.pi)
        outline = ((0.0, -0.5), (0.2, -0.2), (0.16, 0.25), (0.0, 0.5), (-0.16, 0.25),
                   (-0.2, -0.2))
        pts = tuple(_rotate((x + ox * size, y + oy * size), x, y, a) for ox, oy in outline)
        colour = colours[0] if rng.random() > p["mix"] else rng.choice(colours[1:])
        shapes.append(Poly(pts, colour, p["opacity"]))
    return shapes


def _triangles(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    size = p["size"]
    tall = size * math.sqrt(3) / 2
    inset = p["gap"] * size / 2
    for row in range(int(h / tall) + 2):
        y0 = row * tall
        for col in range(int(2 * w / size) + 3):
            x0 = col * size / 2 - size / 2
            up = (row + col) % 2 == 0
            if up:
                pts = ((x0 + inset, y0 + tall - inset * 0.6), (x0 + size / 2, y0 + inset),
                       (x0 + size - inset, y0 + tall - inset * 0.6))
            else:
                pts = ((x0 + inset, y0 + inset * 0.6), (x0 + size - inset, y0 + inset * 0.6),
                       (x0 + size / 2, y0 + tall - inset))
            colour = "@accent" if rng.random() < p["accent"] else "@pattern"
            shapes.append(Poly(pts, colour, p["opacity"]))
    return shapes


def _herringbone(p: Params, w: float, h: float, rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    length = p["length"]
    thick = length * p["width"]
    angle = math.radians(p["angle"])
    dx, dy = length * math.cos(angle), length * math.sin(angle)
    column = abs(dx) + thick
    for col in range(int(w / column) + 2):
        lean = 1 if col % 2 == 0 else -1
        x = col * column
        y = -length
        while y < h + length:
            start = (x, y)
            end = (x + dx, y + lean * dy)
            shapes.append(Stroke((start, end), thick, "@pattern", p["opacity"]))
            y += thick * (1.0 + p["gap"]) / max(0.2, math.cos(angle))
    return shapes


PATTERN_SPECS: dict[str, tuple[ParamSpec, ...]] = {
    "stripes": (ParamSpec("angle", -60, 60), ParamSpec("period", 50, 180),
                ParamSpec("duty", 0.15, 0.6), ParamSpec("opacity", 0.25, 0.85),
                ParamSpec("accent", 0.0, 1.0)),
    "dots": (ParamSpec("spacing", 36, 130), ParamSpec("radius", 0.08, 0.34),
             ParamSpec("stagger", 0.0, 1.0), ParamSpec("opacity", 0.25, 0.85),
             ParamSpec("jitter", 0.0, 0.25)),
    "tiles": (ParamSpec("size", 50, 190), ParamSpec("rotation", 0, 45),
              ParamSpec("gap", 0.06, 0.4), ParamSpec("opacity", 0.2, 0.75),
              ParamSpec("checker", 0.0, 1.0)),
    "waves": (ParamSpec("wavelength", 120, 460), ParamSpec("amplitude", 8, 60),
              ParamSpec("spacing", 40, 150), ParamSpec("thickness", 4, 26),
              ParamSpec("opacity", 0.25, 0.85), ParamSpec("phase", 0.0, 1.0)),
    "rangoli_radial": (ParamSpec("folds", 6, 12), ParamSpec("rings", 2, 5),
                       ParamSpec("cx", 0.2, 0.8), ParamSpec("cy", 0.2, 0.8),
                       ParamSpec("petal", 0.35, 0.95), ParamSpec("rotation", 0.0, 1.0),
                       ParamSpec("opacity", 0.25, 0.8)),
    "snowfall": (ParamSpec("density", 50, 240), ParamSpec("size", 6, 22),
                 ParamSpec("opacity", 0.35, 0.95), ParamSpec("twist", 0.0, 1.0)),
    "confetti": (ParamSpec("density", 60, 260), ParamSpec("size", 10, 30),
                 ParamSpec("aspect", 1.5, 4.0), ParamSpec("opacity", 0.45, 0.95)),
    "leaf_scatter": (ParamSpec("density", 18, 80), ParamSpec("size", 30, 100),
                     ParamSpec("opacity", 0.25, 0.8), ParamSpec("spread", 0.1, 1.0)),
    "chevrons": (ParamSpec("period", 50, 170), ParamSpec("height", 18, 80),
                 ParamSpec("zig", 40, 140), ParamSpec("thickness", 5, 28),
                 ParamSpec("opacity", 0.25, 0.8)),
    "sunburst": (ParamSpec("rays", 10, 36), ParamSpec("cx", 0.1, 0.9),
                 ParamSpec("cy", 0.1, 0.9), ParamSpec("opacity", 0.12, 0.5),
                 ParamSpec("twist", 0.0, 1.0)),
    "starfield": (ParamSpec("density", 40, 220), ParamSpec("size", 3, 11),
                  ParamSpec("opacity", 0.45, 1.0), ParamSpec("big", 0.04, 0.3)),
    "scallops": (ParamSpec("radius", 24, 84), ParamSpec("rise", 0.6, 1.4),
                 ParamSpec("line", 3, 14), ParamSpec("opacity", 0.25, 0.8)),
    "bokeh": (ParamSpec("density", 12, 56), ParamSpec("size", 24, 130),
              ParamSpec("opacity", 0.1, 0.45), ParamSpec("core", 0.3, 1.0)),
    "colour_cloud": (ParamSpec("blobs", 10, 42), ParamSpec("size", 70, 280),
                     ParamSpec("opacity", 0.2, 0.6), ParamSpec("squash", 0.5, 1.0)),
    "garland": (ParamSpec("span", 140, 340), ParamSpec("depth", 20, 90),
                ParamSpec("spacing", 140, 320), ParamSpec("bead", 4, 13),
                ParamSpec("opacity", 0.35, 0.9)),
    "petals": (ParamSpec("density", 30, 140), ParamSpec("size", 16, 50),
               ParamSpec("opacity", 0.3, 0.85), ParamSpec("mix", 0.0, 0.6)),
    "triangles": (ParamSpec("size", 60, 200), ParamSpec("gap", 0.05, 0.35),
                  ParamSpec("opacity", 0.15, 0.65), ParamSpec("accent", 0.0, 0.4)),
    "herringbone": (ParamSpec("length", 40, 120), ParamSpec("width", 0.2, 0.45),
                    ParamSpec("angle", 30, 60), ParamSpec("gap", 0.1, 0.8),
                    ParamSpec("opacity", 0.2, 0.7)),
}

BUILDERS: dict[str, Builder] = {
    "stripes": _stripes, "dots": _dots, "tiles": _tiles, "waves": _waves,
    "rangoli_radial": _rangoli, "snowfall": _snowfall, "confetti": _confetti,
    "leaf_scatter": _leaf_scatter, "chevrons": _chevrons, "sunburst": _sunburst,
    "starfield": _starfield, "scallops": _scallops, "bokeh": _bokeh,
    "colour_cloud": _colour_cloud, "garland": _garland, "petals": _petals,
    "triangles": _triangles, "herringbone": _herringbone,
}


def sample_params(family: str, rng: random.Random) -> tuple[tuple[str, float], ...]:
    """Draw every parameter of a family uniformly from its range, rounded to 4 places."""
    return tuple((spec.name, round(rng.uniform(spec.lo, spec.hi), 4))
                 for spec in PATTERN_SPECS[family])


def normalised(family: str, params: Params) -> tuple[float, ...]:
    """Parameter values mapped to 0..1 in declaration order."""
    return tuple((params[spec.name] - spec.lo) / (spec.hi - spec.lo)
                 for spec in PATTERN_SPECS[family])


def build_pattern(family: str, params: Params, width: float, height: float,
                  seed: int) -> list[Shape]:
    """Primitives for a background pattern covering a width x height card."""
    return BUILDERS[family](params, width, height, random.Random(seed))

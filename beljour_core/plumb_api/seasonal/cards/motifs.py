"""Built-in ornament library for event cards, drawn in code from primitives.

Each motif is drawn in a unit box (0..1 on both axes) and may vary slightly with a seed.
Colours are palette roles ('@ornament', '@accent', '@ink', '@pattern') except where the
symbol has a fixed community colour, such as the seven kinara candles (three red, one black,
three green) or a diya flame. Only greeting symbols are drawn; see occasions.FORBIDDEN_MOTIFS.
Author: John Khan.
"""

from __future__ import annotations

import math
import random
from collections.abc import Callable

from .shapes import Circle, Poly, Shape, Stroke, arc_points, ellipse_points, star_points

MotifDraw = Callable[[random.Random], list[Shape]]

FLAME = "#ffb627"
FLAME_CORE = "#fff1b8"
KINARA_RED = "#c1272d"
KINARA_BLACK = "#111111"
KINARA_GREEN = "#1e7b34"
WOOD = "#7a4a26"
CANDLE_WAX = "#f4efe6"


def _flame(cx: float, base: float, height: float) -> list[Shape]:
    w = height * 0.32
    outer = ((cx, base - height), (cx + w, base - height * 0.35), (cx, base),
             (cx - w, base - height * 0.35))
    inner = ((cx, base - height * 0.6), (cx + w * 0.45, base - height * 0.25), (cx, base),
             (cx - w * 0.45, base - height * 0.25))
    return [Poly(outer, FLAME), Poly(inner, FLAME_CORE)]


def pumpkin(rng: random.Random) -> list[Shape]:
    ribs = rng.choice((3, 4, 5))
    shapes: list[Shape] = []
    width = 0.84 / ribs
    for i in range(ribs):
        cx = 0.08 + width * (i + 0.5)
        shapes.append(Poly(ellipse_points(cx, 0.6, width * 0.75, 0.3), "@ornament"))
    shapes.append(Poly(((0.47, 0.32), (0.5, 0.14), (0.58, 0.12), (0.54, 0.33)), "#3f6b2a"))
    shapes.append(Stroke(arc_points(0.62, 0.2, 0.1, math.pi, 1.8 * math.pi), 0.03, "#3f6b2a"))
    return shapes


def bat(rng: random.Random) -> list[Shape]:
    lift = rng.uniform(-0.06, 0.06)
    wing = ((0.5, 0.42), (0.36, 0.3 + lift), (0.2, 0.28 + lift), (0.02, 0.38 + lift),
            (0.12, 0.5), (0.2, 0.47), (0.28, 0.58), (0.38, 0.52), (0.46, 0.62),
            (0.5, 0.56), (0.54, 0.62), (0.62, 0.52), (0.72, 0.58), (0.8, 0.47),
            (0.88, 0.5), (0.98, 0.38 + lift), (0.8, 0.28 + lift), (0.64, 0.3 + lift))
    ears = ((0.44, 0.44), (0.45, 0.32), (0.49, 0.39), (0.51, 0.39), (0.55, 0.32), (0.56, 0.44))
    return [Poly(wing, "@ink"), Poly(ears, "@ink")]


def full_moon(rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = [Circle(0.5, 0.5, 0.44, "@accent")]
    for _ in range(3):
        shapes.append(Circle(rng.uniform(0.3, 0.7), rng.uniform(0.3, 0.7),
                             rng.uniform(0.04, 0.09), "@ink", 0.12))
    return shapes


def spider_web(rng: random.Random) -> list[Shape]:
    spokes = rng.choice((6, 7, 8))
    shapes: list[Shape] = []
    for i in range(spokes):
        a = 2 * math.pi * i / spokes
        shapes.append(Stroke(((0.5, 0.5), (0.5 + 0.48 * math.cos(a), 0.5 + 0.48 * math.sin(a))),
                             0.015, "@ink", 0.7))
    for ring in (0.14, 0.26, 0.38):
        pts = tuple((0.5 + ring * math.cos(2 * math.pi * i / spokes),
                     0.5 + ring * math.sin(2 * math.pi * i / spokes)) for i in range(spokes))
        shapes.append(Stroke(pts, 0.012, "@ink", 0.7, closed=True))
    return shapes


def candy(rng: random.Random) -> list[Shape]:
    body = ellipse_points(0.5, 0.5, 0.22, 0.16)
    left = ((0.3, 0.5), (0.08, 0.34), (0.12, 0.5), (0.08, 0.66))
    right = ((0.7, 0.5), (0.92, 0.34), (0.88, 0.5), (0.92, 0.66))
    stripe = rng.choice(("@accent", "@ink"))
    return [Poly(left, "@ornament"), Poly(right, "@ornament"), Poly(body, "@ornament"),
            Stroke(((0.42, 0.36), (0.5, 0.64)), 0.04, stripe, 0.8),
            Stroke(((0.54, 0.36), (0.62, 0.64)), 0.04, stripe, 0.8)]


def ghost(rng: random.Random) -> list[Shape]:
    sway = rng.uniform(-0.04, 0.04)
    top = arc_points(0.5, 0.42, 0.3, math.pi, 2 * math.pi)
    hem = ((0.8, 0.86 + sway), (0.7, 0.78), (0.6, 0.88), (0.5, 0.78), (0.4, 0.88),
           (0.3, 0.78), (0.2, 0.86 - sway))
    body = top + ((0.8, 0.42),) + hem + ((0.2, 0.42),)
    return [Poly(body, "#f7f5ef"), Circle(0.41, 0.42, 0.04, "@ink"),
            Circle(0.59, 0.42, 0.04, "@ink"), Poly(ellipse_points(0.5, 0.56, 0.04, 0.06), "@ink")]


def star(rng: random.Random) -> list[Shape]:
    # Always five tips: a six-pointed star reads as a faith emblem, not a greeting ornament.
    return [Poly(star_points(0.5, 0.54, 0.46, rng.uniform(0.18, 0.24), 5), "@accent")]


def snowflake(rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    branch = rng.uniform(0.1, 0.16)
    for i in range(6):
        a = math.pi / 3 * i
        ex, ey = 0.5 + 0.45 * math.cos(a), 0.5 + 0.45 * math.sin(a)
        shapes.append(Stroke(((0.5, 0.5), (ex, ey)), 0.04, "@ornament"))
        mx, my = 0.5 + 0.27 * math.cos(a), 0.5 + 0.27 * math.sin(a)
        for side in (-1.0, 1.0):
            b = a + side * math.pi / 4
            shapes.append(Stroke(((mx, my), (mx + branch * math.cos(b), my + branch * math.sin(b))),
                                 0.03, "@ornament"))
    return shapes


def evergreen(rng: random.Random) -> list[Shape]:
    tiers = rng.choice((3, 4))
    shapes: list[Shape] = [Poly(((0.45, 0.82), (0.55, 0.82), (0.55, 0.96), (0.45, 0.96)), WOOD)]
    for i in range(tiers):
        top = 0.06 + i * (0.6 / tiers)
        half = 0.18 + 0.26 * (i + 1) / tiers
        shapes.append(Poly(((0.5, top), (0.5 + half, top + 0.34), (0.5 - half, top + 0.34)),
                           "@ornament"))
    return shapes


def ornament_ball(rng: random.Random) -> list[Shape]:
    band = rng.choice(("@accent", "@ink"))
    return [Poly(((0.44, 0.08), (0.56, 0.08), (0.56, 0.2), (0.44, 0.2)), "@accent"),
            Circle(0.5, 0.56, 0.38, "@ornament"),
            Stroke(((0.14, 0.56), (0.86, 0.56)), 0.07, band, 0.85),
            Circle(0.38, 0.42, 0.06, "#ffffff", 0.5)]


def holly(rng: random.Random) -> list[Shape]:
    tilt = rng.uniform(-0.05, 0.05)
    leaf_l = ((0.5, 0.5), (0.36, 0.34 + tilt), (0.24, 0.36), (0.16, 0.24), (0.06, 0.3),
              (0.12, 0.44), (0.28, 0.52))
    leaf_r = tuple((1.0 - x, y) for x, y in leaf_l)
    return [Poly(leaf_l, "#2f6b3a"), Poly(leaf_r, "#2f6b3a"), Circle(0.44, 0.58, 0.08, "#c0392b"),
            Circle(0.56, 0.58, 0.08, "#c0392b"), Circle(0.5, 0.68, 0.08, "#c0392b")]


def gift(rng: random.Random) -> list[Shape]:
    ribbon = rng.choice(("@accent", "@ink"))
    return [Poly(((0.12, 0.36), (0.88, 0.36), (0.88, 0.92), (0.12, 0.92)), "@ornament"),
            Poly(((0.44, 0.36), (0.56, 0.36), (0.56, 0.92), (0.44, 0.92)), ribbon),
            Poly(((0.5, 0.36), (0.3, 0.14), (0.24, 0.3)), ribbon),
            Poly(((0.5, 0.36), (0.7, 0.14), (0.76, 0.3)), ribbon)]


def candy_cane(rng: random.Random) -> list[Shape]:
    hook = arc_points(0.5, 0.28, 0.18, math.pi, 2 * math.pi)
    path = hook + ((0.68, 0.94),)
    return [Stroke(path, 0.12, "#f7f5ef"),
            Stroke(path, 0.05, rng.choice(("#c0392b", "@ornament")), 0.9)]


def _leaf(points: tuple[tuple[float, float], ...], colour: str) -> list[Shape]:
    return [Poly(points, colour), Stroke(((0.5, 0.96), (0.5, 0.2)), 0.025, "@ink", 0.5)]


def maple_leaf(rng: random.Random) -> list[Shape]:
    lobes = ((0.5, 0.04), (0.6, 0.24), (0.76, 0.16), (0.72, 0.38), (0.96, 0.36), (0.82, 0.52),
             (0.88, 0.6), (0.6, 0.62), (0.54, 0.8), (0.5, 0.96), (0.46, 0.8), (0.4, 0.62),
             (0.12, 0.6), (0.18, 0.52), (0.04, 0.36), (0.28, 0.38), (0.24, 0.16), (0.4, 0.24))
    return _leaf(lobes, rng.choice(("@ornament", "@accent")))


def oak_leaf(rng: random.Random) -> list[Shape]:
    pts: list[tuple[float, float]] = []
    lobes = 5
    for i in range(lobes * 2 + 1):
        y = 0.06 + 0.84 * i / (lobes * 2)
        w = (0.34 if i % 2 == 0 else 0.22) * math.sin(math.pi * (i + 0.5) / (lobes * 2 + 1))
        pts.append((0.5 + w + 0.02, y))
    left = [(1.0 - x, y) for x, y in reversed(pts)]
    return _leaf(tuple(pts + left), rng.choice(("@ornament", "@accent")))


def acorn(rng: random.Random) -> list[Shape]:
    return [Poly(ellipse_points(0.5, 0.6, 0.24, 0.3), "@ornament"),
            Poly(arc_points(0.5, 0.42, 0.3, math.pi, 2 * math.pi), WOOD),
            Stroke(((0.5, 0.12), (0.55 + rng.uniform(0.0, 0.05), 0.02)), 0.05, WOOD)]


def wheat(rng: random.Random) -> list[Shape]:
    lean = rng.uniform(-0.04, 0.04)
    shapes: list[Shape] = [Stroke(((0.5, 0.98), (0.5 + lean, 0.1)), 0.03, "@accent")]
    for i in range(5):
        y = 0.18 + i * 0.12
        x = 0.5 + lean * (1 - y)
        shapes.append(Poly(ellipse_points(x - 0.08, y, 0.07, 0.04), "@accent"))
        shapes.append(Poly(ellipse_points(x + 0.08, y, 0.07, 0.04), "@accent"))
    shapes.append(Poly(ellipse_points(0.5 + lean * 0.9, 0.1, 0.04, 0.07), "@accent"))
    return shapes


def apple(rng: random.Random) -> list[Shape]:
    return [Circle(0.38, 0.58, 0.28, "@ornament"), Circle(0.62, 0.58, 0.28, "@ornament"),
            Stroke(((0.5, 0.34), (0.52, 0.14)), 0.04, WOOD),
            Poly(ellipse_points(0.64, 0.2, 0.1, 0.05 + rng.uniform(0.0, 0.02)), "#3f6b2a")]


def confetti_burst(rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    colours = ("@ornament", "@accent", "@pattern", "@ink")
    for i in range(12):
        a = 2 * math.pi * i / 12 + rng.uniform(-0.2, 0.2)
        d = rng.uniform(0.2, 0.44)
        x, y = 0.5 + d * math.cos(a), 0.5 + d * math.sin(a)
        s = rng.uniform(0.03, 0.06)
        shapes.append(Poly(((x - s, y - s / 2), (x + s, y - s / 2), (x + s, y + s / 2),
                            (x - s, y + s / 2)), colours[i % 4]))
    return shapes


def firework(rng: random.Random) -> list[Shape]:
    rays = rng.choice((10, 12, 14))
    shapes: list[Shape] = []
    for i in range(rays):
        a = 2 * math.pi * i / rays
        shapes.append(Stroke(((0.5 + 0.12 * math.cos(a), 0.5 + 0.12 * math.sin(a)),
                              (0.5 + 0.42 * math.cos(a), 0.5 + 0.42 * math.sin(a))),
                             0.03, "@ornament" if i % 2 else "@accent"))
        shapes.append(Circle(0.5 + 0.46 * math.cos(a), 0.5 + 0.46 * math.sin(a), 0.025, "@accent"))
    return shapes


def sparkle(rng: random.Random) -> list[Shape]:
    thin = rng.uniform(0.06, 0.1)
    return [Poly(((0.5, 0.02), (0.5 + thin, 0.5 - thin), (0.98, 0.5), (0.5 + thin, 0.5 + thin),
                  (0.5, 0.98), (0.5 - thin, 0.5 + thin), (0.02, 0.5), (0.5 - thin, 0.5 - thin)),
                 "@accent")]


def balloon(rng: random.Random) -> list[Shape]:
    sway = rng.uniform(-0.08, 0.08)
    return [Poly(ellipse_points(0.5, 0.36, 0.26, 0.32), "@ornament"),
            Poly(((0.46, 0.7), (0.54, 0.7), (0.5, 0.66)), "@ornament"),
            Stroke(((0.5, 0.7), (0.5 + sway, 0.84), (0.5 - sway, 0.98)), 0.015, "@ink", 0.7),
            Poly(ellipse_points(0.4, 0.26, 0.05, 0.08), "#ffffff", 0.45)]


def clock(rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = [Circle(0.5, 0.5, 0.44, "@ornament"), Circle(0.5, 0.5, 0.38, "#fbf7ee")]
    for i in range(12):
        a = 2 * math.pi * i / 12
        shapes.append(Circle(0.5 + 0.32 * math.cos(a), 0.5 + 0.32 * math.sin(a), 0.02, "@ink"))
    minute = math.radians(rng.choice((-90, -84, -96)))
    shapes.append(Stroke(((0.5, 0.5), (0.5 + 0.28 * math.cos(minute),
                                       0.5 + 0.28 * math.sin(minute))), 0.03, "@ink"))
    shapes.append(Stroke(((0.5, 0.5), (0.5, 0.3)), 0.04, "@ink"))
    return shapes


def egg(rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = [Poly(ellipse_points(0.5, 0.54, 0.32, 0.42, 32), "@ornament")]
    zig = tuple((0.22 + 0.08 * i, 0.5 + (0.05 if i % 2 else -0.05)) for i in range(8))
    shapes.append(Stroke(zig, 0.035, "@accent"))
    for x in (0.38, 0.5, 0.62):
        shapes.append(Circle(x, 0.72, 0.03 + rng.uniform(0.0, 0.015), "@pattern"))
    return shapes


def tulip(rng: random.Random) -> list[Shape]:
    bend = rng.uniform(-0.05, 0.05)
    head = ((0.28, 0.2), (0.39, 0.34), (0.5, 0.14), (0.61, 0.34), (0.72, 0.2), (0.7, 0.42),
            (0.5, 0.56), (0.3, 0.42))
    return [Stroke(((0.5, 0.5), (0.5 + bend, 0.96)), 0.04, "#3f7d3a"),
            Poly(((0.5 + bend, 0.86), (0.28, 0.66), (0.48, 0.74)), "#3f7d3a"),
            Poly(head, "@ornament")]


def daisy(rng: random.Random) -> list[Shape]:
    petals = rng.choice((8, 10, 12))
    shapes: list[Shape] = []
    for i in range(petals):
        a = 2 * math.pi * i / petals
        cx, cy = 0.5 + 0.28 * math.cos(a), 0.5 + 0.28 * math.sin(a)
        pts = tuple((cx + 0.16 * math.cos(a) * math.cos(t) - 0.07 * math.sin(a) * math.sin(t),
                     cy + 0.16 * math.sin(a) * math.cos(t) + 0.07 * math.cos(a) * math.sin(t))
                    for t in (2 * math.pi * k / 12 for k in range(12)))
        shapes.append(Poly(pts, "#fbfaf5"))
    shapes.append(Circle(0.5, 0.5, 0.14, "@accent"))
    return shapes


def kinara(rng: random.Random) -> list[Shape]:
    colours = (KINARA_RED,) * 3 + (KINARA_BLACK,) + (KINARA_GREEN,) * 3
    shapes: list[Shape] = [Poly(((0.04, 0.68), (0.96, 0.68), (0.88, 0.8), (0.12, 0.8)), WOOD),
                           Poly(((0.38, 0.8), (0.62, 0.8), (0.7, 0.96), (0.3, 0.96)), WOOD)]
    lit = rng.randint(1, 7)
    for i, colour in enumerate(colours):
        x = 0.1 + i * 0.8 / 6
        top = 0.36 if i == 3 else 0.42
        shapes.append(Poly(((x - 0.035, top), (x + 0.035, top), (x + 0.035, 0.68),
                            (x - 0.035, 0.68)), colour))
        if i < lit or i == 3:
            shapes += _flame(x, top - 0.01, 0.13)
    return shapes


def harvest_corn(rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = [Poly(ellipse_points(0.5, 0.44, 0.15, 0.34), "@accent")]
    for row in range(6):
        y = 0.18 + row * 0.09
        for col in (-0.07, 0.0, 0.07):
            shapes.append(Circle(0.5 + col, y, 0.028, "@ornament", 0.8))
    husk = rng.uniform(0.0, 0.05)
    shapes.append(Poly(((0.5, 0.96), (0.24 - husk, 0.5), (0.44, 0.7)), "#6b8e3a"))
    shapes.append(Poly(((0.5, 0.96), (0.76 + husk, 0.5), (0.56, 0.7)), "#6b8e3a"))
    return shapes


def candle(rng: random.Random) -> list[Shape]:
    height = rng.uniform(0.44, 0.56)
    top = 0.94 - height
    return [Poly(((0.38, top), (0.62, top), (0.62, 0.94), (0.38, 0.94)), "@ornament")] + \
        _flame(0.5, top - 0.02, 0.24)


def menorah(rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = [Poly(((0.3, 0.9), (0.7, 0.9), (0.6, 0.84), (0.4, 0.84)), "@ornament"),
                           Stroke(((0.5, 0.84), (0.5, 0.4)), 0.04, "@ornament")]
    for k in range(1, 5):
        r = 0.09 * k
        shapes.append(Stroke(arc_points(0.5, 0.4, r, 0.0, math.pi, 10), 0.03, "@ornament"))
    tops: list[tuple[float, float]] = []
    for k in range(4, 0, -1):
        tops.append((0.5 - 0.09 * k, 0.4))
    tops.append((0.5, 0.3))
    for k in range(1, 5):
        tops.append((0.5 + 0.09 * k, 0.4))
    # Night n lights the shamash (centre) plus n candles placed from the right.
    lit = set((8, 7, 6, 5, 3, 2, 1, 0)[: rng.randint(1, 8)]) | {4}
    for i, (x, y) in enumerate(tops):
        shapes.append(Poly(((x - 0.02, y - 0.12), (x + 0.02, y - 0.12), (x + 0.02, y),
                            (x - 0.02, y)), CANDLE_WAX))
        if i in lit:
            shapes += _flame(x, y - 0.13, 0.09)
    return shapes


def dreidel(rng: random.Random) -> list[Shape]:
    tip = rng.uniform(-0.03, 0.03)
    return [Poly(((0.46, 0.04), (0.54, 0.04), (0.54, 0.2), (0.46, 0.2)), "@accent"),
            Poly(((0.22, 0.2), (0.78, 0.2), (0.78, 0.6), (0.5 + tip, 0.96), (0.22, 0.6)),
                 "@ornament"),
            Stroke(((0.22, 0.4), (0.78, 0.4)), 0.025, "@accent", 0.8)]


def gelt_coin(rng: random.Random) -> list[Shape]:
    return [Circle(0.5, 0.5, 0.42, "#d4a017"), Circle(0.5, 0.5, 0.34, "#e8c34a"),
            Stroke(arc_points(0.5, 0.5, 0.26, 0.0, 2 * math.pi, 20), 0.02, "#b5850f",
                   0.6 + rng.uniform(0.0, 0.3))]


def crescent(rng: random.Random) -> list[Shape]:
    outer = arc_points(0.5, 0.5, 0.44, math.pi * 0.35, math.pi * 1.65, 24)
    inner = arc_points(0.62, 0.46, 0.36, math.pi * 1.5, math.pi * 0.52, 24)
    shapes: list[Shape] = [Poly(outer + inner, "@accent")]
    if rng.random() < 0.6:
        shapes.append(Poly(star_points(0.78, 0.3, 0.1, 0.04, 5), "@accent"))
    return shapes


def lantern(rng: random.Random) -> list[Shape]:
    glow = rng.uniform(0.35, 0.6)
    body = ((0.5, 0.16), (0.74, 0.32), (0.74, 0.72), (0.5, 0.9), (0.26, 0.72), (0.26, 0.32))
    return [Stroke(((0.5, 0.0), (0.5, 0.16)), 0.025, "@ink", 0.7),
            Poly(body, "@ornament"),
            Poly(((0.5, 0.3), (0.62, 0.4), (0.62, 0.66), (0.5, 0.76), (0.38, 0.66), (0.38, 0.4)),
                 FLAME_CORE, glow),
            Stroke(((0.26, 0.52), (0.74, 0.52)), 0.02, "@accent", 0.8)]


def diya(rng: random.Random) -> list[Shape]:
    bowl = arc_points(0.5, 0.56, 0.38, 0.0, math.pi, 18)
    shapes: list[Shape] = [Poly(bowl + ((0.12, 0.56), (0.5, 0.6), (0.88, 0.56)), "@ornament")]
    shapes.append(Stroke(((0.2, 0.66), (0.8, 0.66)), 0.03, "@accent", 0.9))
    shapes += _flame(0.5 + rng.uniform(-0.03, 0.03), 0.56, 0.4)
    return shapes


def rangoli(rng: random.Random) -> list[Shape]:
    folds = rng.choice((6, 8))
    shapes: list[Shape] = []
    for i in range(folds):
        a = 2 * math.pi * i / folds
        c, s = math.cos(a), math.sin(a)
        petal = tuple((0.5 + c * px - s * py, 0.5 + s * px + c * py)
                      for px, py in ((0.08, 0.0), (0.26, -0.09), (0.44, 0.0), (0.26, 0.09)))
        shapes.append(Poly(petal, "@ornament" if i % 2 else "@accent"))
        shapes.append(Circle(0.5 + 0.47 * c, 0.5 + 0.47 * s, 0.025, "@pattern"))
    shapes.append(Circle(0.5, 0.5, 0.08, "@accent"))
    return shapes


def marigold(rng: random.Random) -> list[Shape]:
    shapes: list[Shape] = []
    for ring, (radius, colour) in enumerate(((0.44, "#f28c28"), (0.32, "#f6a623"),
                                             (0.2, "#f9c74f"))):
        petals = 14 - ring * 3
        offset = rng.uniform(0.0, 1.0)
        for i in range(petals):
            a = 2 * math.pi * (i + offset) / petals
            shapes.append(Circle(0.5 + radius * 0.7 * math.cos(a), 0.5 + radius * 0.7 * math.sin(a),
                                 radius * 0.36, colour))
    shapes.append(Circle(0.5, 0.5, 0.08, "#c96d12"))
    return shapes


def light_string(rng: random.Random) -> list[Shape]:
    sag = rng.uniform(0.12, 0.22)
    wire = tuple((x / 10, 0.25 + sag * math.sin(math.pi * x / 10)) for x in range(11))
    shapes: list[Shape] = [Stroke(wire, 0.015, "@ink", 0.7)]
    colours = ("@ornament", "@accent", FLAME, "@pattern")
    for i in range(1, 10, 2):
        x, y = wire[i]
        shapes.append(Poly(ellipse_points(x, y + 0.1, 0.045, 0.08), colours[(i // 2) % 4]))
    return shapes


def colour_powder(rng: random.Random) -> list[Shape]:
    colours = ("#e63946", "#f4a261", "#2a9d8f", "#8e44ad", "#f1c40f", "#ff5fa2")
    shapes: list[Shape] = []
    for _ in range(9):
        shapes.append(Circle(rng.uniform(0.18, 0.82), rng.uniform(0.18, 0.82),
                             rng.uniform(0.08, 0.2), rng.choice(colours), 0.7))
    return shapes


def colour_splash(rng: random.Random) -> list[Shape]:
    pts: list[tuple[float, float]] = []
    lobes = rng.choice((7, 9, 11))
    for i in range(lobes * 2):
        a = math.pi * i / lobes
        r = 0.44 if i % 2 == 0 else rng.uniform(0.2, 0.3)
        pts.append((0.5 + r * math.cos(a), 0.5 + r * math.sin(a)))
    return [Poly(tuple(pts), "@ornament", 0.9), Circle(0.5, 0.5, 0.12, "@accent", 0.8)]


def kite(rng: random.Random) -> list[Shape]:
    tail = tuple((0.5 + 0.06 * math.sin(i * 1.4 + rng.uniform(0.0, 0.5)), 0.74 + i * 0.045)
                 for i in range(6))
    # One spar only; crossed spars would draw a cross inside the kite.
    return [Poly(((0.5, 0.04), (0.8, 0.38), (0.5, 0.76), (0.2, 0.38)), "@ornament"),
            Poly(((0.5, 0.04), (0.8, 0.38), (0.5, 0.76)), "@accent", 0.35),
            Stroke(((0.5, 0.04), (0.5, 0.76)), 0.015, "@ink", 0.6),
            Stroke(tail, 0.015, "@accent")]


BUILTIN_MOTIFS: dict[str, MotifDraw] = {
    "pumpkin": pumpkin, "bat": bat, "full_moon": full_moon, "spider_web": spider_web,
    "candy": candy, "ghost": ghost, "star": star, "snowflake": snowflake,
    "evergreen": evergreen, "ornament_ball": ornament_ball, "holly": holly, "gift": gift,
    "candy_cane": candy_cane, "maple_leaf": maple_leaf, "oak_leaf": oak_leaf, "acorn": acorn,
    "wheat": wheat, "apple": apple, "confetti_burst": confetti_burst, "firework": firework,
    "sparkle": sparkle, "balloon": balloon, "clock": clock, "egg": egg, "tulip": tulip,
    "daisy": daisy, "kinara": kinara, "harvest_corn": harvest_corn, "candle": candle,
    "menorah": menorah, "dreidel": dreidel, "gelt_coin": gelt_coin, "crescent": crescent,
    "lantern": lantern, "diya": diya, "rangoli": rangoli, "marigold": marigold,
    "light_string": light_string, "colour_powder": colour_powder,
    "colour_splash": colour_splash, "kite": kite,
}


def draw_motif(motif_id: str, seed: int) -> list[Shape]:
    """Unit-box shapes for a built-in motif; the seed picks small variations."""
    return BUILTIN_MOTIFS[motif_id](random.Random(seed))

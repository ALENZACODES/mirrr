"""Motif library for the five packs and the shared MotifProvider contract.

Every motif is drawn in code from the primitives in shapes.py. Seeds change
small details (a pumpkin's face, an egg's colours) and are deterministic.
Other packages add motifs for their own occasions with register_motif; the
forbidden-motif check runs on every id.
Author: John Khan.
"""

from __future__ import annotations

import math
import random
from collections.abc import Callable
from typing import Protocol

from .forbidden import forbidden_reason
from .model import PackError
from .occasions import require_occasion
from .shapes import (
    Shape,
    circle_points,
    crescent_points,
    group_svg,
    oval,
    poly,
    rect_points,
    star_points,
    stroke,
)
from .target import Point

MotifBuilder = Callable[[random.Random], tuple[Shape, ...]]


class MotifProvider(Protocol):
    """Frozen art contract shared by the cards and packs packages."""

    def motif_ids(self, occasion: str) -> tuple[str, ...]: ...

    def motif_svg(self, occasion: str, motif_id: str, size: float, seed: int) -> str: ...


class MotifError(PackError):
    """Unknown or rejected motif."""


def _pumpkin(rng: random.Random, shades: tuple[str, str, str], carved: bool) -> tuple[Shape, ...]:
    base, light, dark = shades
    lobes = rng.choice((3, 5))
    shapes: list[Shape] = []
    for index in range(lobes):
        offset = (index - (lobes - 1) / 2.0) / max(1, lobes - 1)
        colour = light if index % 2 else base
        shapes.append(oval(colour, (0.5 + offset * 0.36, 0.6), (0.2, 0.3)))
    shapes.append(oval(base, (0.5, 0.6), (0.18, 0.3)))
    shapes.append(poly("#5b4a1f", [(0.46, 0.33), (0.5, 0.12), (0.57, 0.14), (0.54, 0.33)]))
    shapes.append(oval("#3f7d3a", (0.64, 0.2), (0.09, 0.04), angle=-25.0))
    if carved and rng.random() < 0.6:
        shapes.append(poly(dark, [(0.32, 0.56), (0.4, 0.44), (0.46, 0.57)]))
        shapes.append(poly(dark, [(0.54, 0.57), (0.6, 0.44), (0.68, 0.56)]))
        teeth = [(0.3, 0.68), (0.38, 0.75), (0.44, 0.69), (0.5, 0.76), (0.56, 0.69)]
        teeth += [(0.62, 0.75), (0.7, 0.68), (0.62, 0.84), (0.38, 0.84)]
        shapes.append(poly(dark, teeth))
    return tuple(shapes)


def halloween_pumpkin(rng: random.Random) -> tuple[Shape, ...]:
    """Orange pumpkin, sometimes carved with a friendly face."""
    return _pumpkin(rng, ("#e8741c", "#f39a3d", "#3a1c08"), carved=True)


def harvest_pumpkin(rng: random.Random) -> tuple[Shape, ...]:
    """Deeper harvest pumpkin, never carved."""
    return _pumpkin(rng, ("#c8611a", "#de8233", "#a84f14"), carved=False)


def bat(rng: random.Random) -> tuple[Shape, ...]:
    """A bat with scalloped wings."""
    colour = rng.choice(("#1d1426", "#2b1a38", "#121212"))
    left = [(0.5, 0.42), (0.36, 0.3), (0.18, 0.28), (0.04, 0.42), (0.14, 0.5)]
    left += [(0.22, 0.46), (0.28, 0.56), (0.36, 0.5), (0.42, 0.6), (0.5, 0.56)]
    right = [(1.0 - x, y) for x, y in reversed(left)]
    ears = [(0.44, 0.4), (0.45, 0.3), (0.49, 0.37), (0.51, 0.37), (0.55, 0.3), (0.56, 0.4)]
    return (
        poly(colour, left + right),
        oval(colour, (0.5, 0.47), (0.07, 0.1)),
        poly(colour, ears),
    )


def moon(rng: random.Random) -> tuple[Shape, ...]:
    """A pale crescent moon with a soft glow."""
    tilt = rng.uniform(-0.04, 0.04)
    return (
        oval("#fff6c9", (0.5, 0.5), (0.47, 0.47), opacity=0.22),
        poly(
            "#f7e7a1",
            crescent_points((0.5, 0.5), 0.4, (0.64 + tilt, 0.4), 0.34),
        ),
    )


def web(rng: random.Random) -> tuple[Shape, ...]:
    """A spider web drawn with fine strokes."""
    colour = "#2a2a2a"
    spokes = rng.choice((7, 8))
    shapes: list[Shape] = []
    for index in range(spokes):
        theta = 2.0 * math.pi * index / spokes
        shapes.append(
            stroke(
                colour,
                [(0.5, 0.5), (0.5 + 0.48 * math.cos(theta), 0.5 + 0.48 * math.sin(theta))],
                0.018,
            )
        )
    for ring in (0.14, 0.27, 0.4):
        points = []
        for index in range(spokes + 1):
            theta = 2.0 * math.pi * index / spokes
            sag = ring * 0.9 if index % 2 else ring
            points.append((0.5 + sag * math.cos(theta), 0.5 + sag * math.sin(theta)))
        shapes.append(stroke(colour, points, 0.014))
    return tuple(shapes)


def star(rng: random.Random) -> tuple[Shape, ...]:
    """Five-point star with a small turn."""
    turn = rng.uniform(-12.0, 12.0)
    return (poly("#ffd34d", star_points(0.5, 0.52, 0.47, 0.2, 5, turn)),)


def gold_star(rng: random.Random) -> tuple[Shape, ...]:
    """Gold star with a lighter centre for New Year."""
    turn = rng.uniform(-18.0, 18.0)
    return (
        poly("#e9b52b", star_points(0.5, 0.52, 0.47, 0.2, 5, turn)),
        poly("#fbe58c", star_points(0.5, 0.52, 0.24, 0.1, 5, turn)),
    )


def snowflake(rng: random.Random) -> tuple[Shape, ...]:
    """Six-armed snowflake made of strokes."""
    colour = rng.choice(("#ffffff", "#e8f4ff", "#d6ecff"))
    shapes: list[Shape] = []
    turn = rng.uniform(0.0, 30.0)
    for index in range(6):
        theta = math.radians(turn + 60.0 * index)
        tip = (0.5 + 0.46 * math.cos(theta), 0.5 + 0.46 * math.sin(theta))
        shapes.append(stroke(colour, [(0.5, 0.5), tip], 0.05))
        for reach in (0.22, 0.33):
            base = (0.5 + reach * math.cos(theta), 0.5 + reach * math.sin(theta))
            for side in (-1.0, 1.0):
                branch = theta + side * math.radians(45.0)
                end = (base[0] + 0.12 * math.cos(branch), base[1] + 0.12 * math.sin(branch))
                shapes.append(stroke(colour, [base, end], 0.04))
    return tuple(shapes)


def evergreen(rng: random.Random) -> tuple[Shape, ...]:
    """Stacked-tier evergreen tree with a trunk."""
    green = rng.choice(("#1f6b3a", "#25784a", "#195c33"))
    shade = "#14492a"
    shapes = [poly("#6b4423", rect_points(0.5, 0.9, 0.1, 0.14))]
    for tier, (top, bottom, half) in enumerate(
        ((0.05, 0.4, 0.2), (0.22, 0.62, 0.3), (0.4, 0.86, 0.4))
    ):
        colour = green if tier % 2 == 0 else shade
        shapes.append(poly(colour, [(0.5, top), (0.5 + half, bottom), (0.5 - half, bottom)]))
    return tuple(shapes)


def ornament(rng: random.Random) -> tuple[Shape, ...]:
    """Round bauble with a cap and a highlight."""
    colour = rng.choice(("#c0262d", "#2a6fb0", "#d4a017", "#7b2d8e"))
    return (
        stroke("#8a8a8a", [(0.5, 0.0), (0.5, 0.18)], 0.03),
        poly("#b8b8b8", rect_points(0.5, 0.2, 0.16, 0.08)),
        oval(colour, (0.5, 0.58), (0.36, 0.36)),
        oval("#ffffff", (0.38, 0.46), (0.08, 0.05), angle=-35.0, opacity=0.55),
    )


def gift(rng: random.Random) -> tuple[Shape, ...]:
    """Wrapped box with ribbon and bow."""
    box = rng.choice(("#c0262d", "#1f6b3a", "#2a6fb0"))
    ribbon = rng.choice(("#f2c94c", "#ffffff"))
    return (
        poly(box, rect_points(0.5, 0.64, 0.76, 0.6)),
        poly(ribbon, rect_points(0.5, 0.64, 0.12, 0.6)),
        poly(ribbon, rect_points(0.5, 0.52, 0.76, 0.1)),
        oval(ribbon, (0.38, 0.28), (0.13, 0.08), angle=20.0),
        oval(ribbon, (0.62, 0.28), (0.13, 0.08), angle=-20.0),
    )


def holly(rng: random.Random) -> tuple[Shape, ...]:
    """Two spiky holly leaves and three berries."""
    shapes: list[Shape] = []
    for side in (-1.0, 1.0):
        points = []
        for index in range(9):
            t = index / 8.0
            x = 0.5 + side * (0.05 + 0.42 * t)
            bulge = 0.14 * math.sin(math.pi * t) + (0.04 if index % 2 else 0.0)
            points.append((x, 0.5 - bulge + 0.15 * t))
        for index in range(8, -1, -1):
            t = index / 8.0
            x = 0.5 + side * (0.05 + 0.42 * t)
            bulge = 0.14 * math.sin(math.pi * t) + (0.04 if index % 2 else 0.0)
            points.append((x, 0.5 + bulge * 0.6 + 0.15 * t))
        shapes.append(poly("#1f6b3a", points))
    for dx, dy in ((-0.07, 0.44), (0.07, 0.44), (0.0, 0.34)):
        shapes.append(oval(rng.choice(("#c0262d", "#d6232b")), (0.5 + dx, dy), (0.08, 0.08)))
    return tuple(shapes)


def maple_leaf(rng: random.Random) -> tuple[Shape, ...]:
    """Maple leaf built from a lobed polar outline."""
    colour = rng.choice(("#c8401b", "#d9661f", "#b52f1a", "#e0a020"))
    points: list[Point] = []
    for index in range(66):
        theta = 2.0 * math.pi * index / 66.0
        lobes = abs(math.sin(2.5 * theta)) ** 0.6
        radius = 0.18 + 0.27 * lobes + (0.04 if index % 3 == 0 else 0.0)
        points.append((0.5 + radius * math.sin(theta), 0.46 - radius * math.cos(theta)))
    return (
        poly(colour, points),
        stroke("#6b3a12", [(0.5, 0.5), (0.5, 0.97)], 0.03),
    )


def oak_leaf(rng: random.Random) -> tuple[Shape, ...]:
    """Oak leaf with wavy lobes and a centre vein."""
    colour = rng.choice(("#a0522d", "#b8860b", "#8b4513"))
    left: list[Point] = []
    right: list[Point] = []
    for index in range(17):
        t = index / 16.0
        width = 0.22 * math.sin(math.pi * t) * (0.75 + 0.25 * math.cos(9.0 * math.pi * t))
        y = 0.06 + 0.8 * t
        left.append((0.5 - width, y))
        right.append((0.5 + width, y))
    return (
        poly(colour, left + list(reversed(right))),
        stroke("#5a2e0e", [(0.5, 0.06), (0.5, 0.96)], 0.025),
    )


def acorn(rng: random.Random) -> tuple[Shape, ...]:
    """Acorn with a textured cap."""
    nut = rng.choice(("#c68642", "#b5733a"))
    return (
        oval(nut, (0.5, 0.62), (0.24, 0.3)),
        oval("#6b4423", (0.5, 0.36), (0.3, 0.14)),
        stroke("#4a2f17", [(0.5, 0.24), (0.55, 0.08)], 0.05),
        stroke("#8b6239", [(0.26, 0.38), (0.74, 0.38)], 0.02),
    )


def wheat(rng: random.Random) -> tuple[Shape, ...]:
    """A wheat stalk with paired grains."""
    gold = rng.choice(("#d9a441", "#e3b55a"))
    shapes: list[Shape] = [stroke("#b0812f", [(0.5, 0.98), (0.5, 0.08)], 0.03)]
    for index in range(6):
        y = 0.18 + index * 0.11
        shapes.append(oval(gold, (0.42, y), (0.07, 0.04), angle=-40.0))
        shapes.append(oval(gold, (0.58, y), (0.07, 0.04), angle=40.0))
    shapes.append(oval(gold, (0.5, 0.1), (0.04, 0.07)))
    return tuple(shapes)


CONFETTI_COLOURS = ("#ff4d6d", "#ffd166", "#06d6a0", "#118ab2", "#9b5de5", "#f15bb5")


def confetti(rng: random.Random) -> tuple[Shape, ...]:
    """A small burst of paper strips and dots."""
    shapes: list[Shape] = []
    for _ in range(7):
        colour = rng.choice(CONFETTI_COLOURS)
        cx, cy = rng.uniform(0.15, 0.85), rng.uniform(0.15, 0.85)
        if rng.random() < 0.6:
            shapes.append(poly(colour, rect_points(cx, cy, 0.16, 0.06, rng.uniform(0.0, 180.0))))
        else:
            shapes.append(oval(colour, (cx, cy), (0.05, 0.05)))
    return tuple(shapes)


def firework(rng: random.Random) -> tuple[Shape, ...]:
    """Radial burst with bright tips."""
    colour = rng.choice(("#ffd166", "#ff4d6d", "#7bdff2", "#c77dff"))
    rays = rng.choice((10, 12, 14))
    shapes: list[Shape] = []
    for index in range(rays):
        theta = 2.0 * math.pi * index / rays
        inner = (0.5 + 0.1 * math.cos(theta), 0.5 + 0.1 * math.sin(theta))
        outer = (0.5 + 0.4 * math.cos(theta), 0.5 + 0.4 * math.sin(theta))
        shapes.append(stroke(colour, [inner, outer], 0.025, opacity=0.9))
        shapes.append(oval("#ffffff", outer, (0.03, 0.03)))
    return tuple(shapes)


def balloon(rng: random.Random) -> tuple[Shape, ...]:
    """Party balloon with a knot and string."""
    colour = rng.choice(("#ff4d6d", "#ffd166", "#118ab2", "#9b5de5"))
    return (
        stroke("#9a9a9a", [(0.5, 0.74), (0.46, 0.86), (0.53, 0.98)], 0.015),
        oval(colour, (0.5, 0.38), (0.26, 0.33)),
        poly(colour, [(0.47, 0.74), (0.5, 0.69), (0.53, 0.74)]),
        oval("#ffffff", (0.41, 0.26), (0.05, 0.09), angle=20.0, opacity=0.5),
    )


def sparkle(rng: random.Random) -> tuple[Shape, ...]:
    """Four-point sparkle."""
    turn = rng.choice((0.0, 45.0))
    return (
        poly("#fff3b0", star_points(0.5, 0.5, 0.48, 0.09, 4, turn)),
        oval("#ffffff", (0.5, 0.5), (0.08, 0.08)),
    )


PASTELS = ("#f7a8c4", "#a8d8f7", "#c9f7a8", "#f7e3a8", "#d3b8f7", "#f7c3a8")


def egg(rng: random.Random) -> tuple[Shape, ...]:
    """Decorated egg: pastel body with zigzag band and dots."""
    body = rng.choice(PASTELS)
    trim = rng.choice([colour for colour in PASTELS if colour != body])
    outline: list[Point] = []
    for index in range(40):
        theta = 2.0 * math.pi * index / 40.0
        squash = 0.36 if math.sin(theta) < 0 else 0.42
        outline.append((0.5 + 0.3 * math.cos(theta), 0.55 + squash * math.sin(theta)))
    zigzag = [(0.2 + 0.6 * i / 8.0, 0.55 + (0.05 if i % 2 else -0.05)) for i in range(9)]
    shapes: list[Shape] = [poly(body, outline), stroke(trim, zigzag, 0.04)]
    for dx in (-0.12, 0.0, 0.12):
        shapes.append(oval(trim, (0.5 + dx, 0.36), (0.035, 0.035)))
        shapes.append(oval(trim, (0.5 + dx, 0.74), (0.035, 0.035)))
    return tuple(shapes)


def tulip(rng: random.Random) -> tuple[Shape, ...]:
    """Tulip cup on a stem with one leaf."""
    petal = rng.choice(("#f25c8a", "#f7b32b", "#e84a5f", "#b56fd6"))
    cup = [(0.32, 0.12), (0.41, 0.26), (0.5, 0.1), (0.59, 0.26), (0.68, 0.12)]
    cup += [(0.68, 0.36), (0.6, 0.46), (0.4, 0.46), (0.32, 0.36)]
    return (
        stroke("#3f8f3a", [(0.5, 0.44), (0.5, 0.98)], 0.04),
        oval("#4caf50", (0.38, 0.76), (0.06, 0.18), angle=-25.0),
        poly(petal, cup),
    )


def daisy(rng: random.Random) -> tuple[Shape, ...]:
    """Daisy with white petals around a yellow centre."""
    petals = rng.choice((10, 12))
    shapes: list[Shape] = []
    for index in range(petals):
        theta = 360.0 * index / petals
        rad = math.radians(theta)
        centre = (0.5 + 0.28 * math.cos(rad), 0.5 + 0.28 * math.sin(rad))
        shapes.append(oval("#fdfdf7", centre, (0.17, 0.065), angle=theta))
    shapes.append(oval("#f5c518", (0.5, 0.5), (0.14, 0.14)))
    return tuple(shapes)


def butterfly(rng: random.Random) -> tuple[Shape, ...]:
    """Butterfly with two pairs of wings."""
    upper = rng.choice(PASTELS)
    lower = rng.choice(PASTELS)
    return (
        oval(upper, (0.32, 0.36), (0.2, 0.16), angle=-30.0),
        oval(upper, (0.68, 0.36), (0.2, 0.16), angle=30.0),
        oval(lower, (0.36, 0.64), (0.14, 0.12), angle=30.0),
        oval(lower, (0.64, 0.64), (0.14, 0.12), angle=-30.0),
        oval("#4a3b2a", (0.5, 0.5), (0.04, 0.24)),
        stroke("#4a3b2a", [(0.49, 0.28), (0.42, 0.12)], 0.015),
        stroke("#4a3b2a", [(0.51, 0.28), (0.58, 0.12)], 0.015),
    )


def leaf_sprig(rng: random.Random) -> tuple[Shape, ...]:
    """Curved stem with small spring leaves."""
    green = rng.choice(("#6abf69", "#81c784", "#4caf50"))
    stem = [(0.2, 0.9), (0.35, 0.65), (0.5, 0.45), (0.7, 0.25), (0.85, 0.12)]
    shapes: list[Shape] = [stroke("#4e8f45", stem, 0.03)]
    for index, (x, y) in enumerate(stem[1:4]):
        side = 1.0 if index % 2 else -1.0
        shapes.append(
            oval(green, (x + 0.08 * side, y + 0.06 * side), (0.1, 0.045), angle=-40.0 * side)
        )
    return tuple(shapes)


BUILTIN_MOTIFS: dict[str, dict[str, MotifBuilder]] = {
    "halloween": {
        "pumpkin": halloween_pumpkin,
        "bat": bat,
        "moon": moon,
        "web": web,
        "star": star,
    },
    "christmas": {
        "snowflake": snowflake,
        "evergreen": evergreen,
        "ornament": ornament,
        "gift": gift,
        "holly": holly,
    },
    "thanksgiving": {
        "maple_leaf": maple_leaf,
        "oak_leaf": oak_leaf,
        "acorn": acorn,
        "pumpkin": harvest_pumpkin,
        "wheat": wheat,
    },
    "new_year": {
        "confetti": confetti,
        "firework": firework,
        "star": gold_star,
        "balloon": balloon,
        "sparkle": sparkle,
    },
    "easter": {
        "egg": egg,
        "tulip": tulip,
        "daisy": daisy,
        "butterfly": butterfly,
        "leaf_sprig": leaf_sprig,
    },
}

_LIBRARY: dict[str, dict[str, MotifBuilder]] = {
    occasion: dict(builders) for occasion, builders in BUILTIN_MOTIFS.items()
}


def register_motif(occasion: str, motif_id: str, builder: MotifBuilder) -> None:
    """Add a motif for an occasion so frames and particles can draw it."""
    require_occasion(occasion)
    reason = forbidden_reason(motif_id)
    if reason is not None:
        raise MotifError(reason)
    builders = _LIBRARY.setdefault(occasion, {})
    if motif_id in builders:
        raise MotifError(f"motif {occasion}/{motif_id} is already registered")
    builders[motif_id] = builder


def library_ids(occasion: str) -> tuple[str, ...]:
    """Motif ids known for an occasion, in registration order."""
    require_occasion(occasion)
    return tuple(_LIBRARY.get(occasion, {}))


def motif_shapes(occasion: str, motif_id: str, seed: int = 0) -> tuple[Shape, ...]:
    """Shapes of one motif for a seed, in the unit box."""
    require_occasion(occasion)
    builder = _LIBRARY.get(occasion, {}).get(motif_id)
    if builder is None:
        raise MotifError(f"occasion {occasion} has no motif {motif_id!r}")
    return builder(random.Random(f"{occasion}:{motif_id}:{seed}"))


class PackMotifProvider:
    """MotifProvider over the motif library used by the seasonal packs."""

    def motif_ids(self, occasion: str) -> tuple[str, ...]:
        """Motif ids for an occasion; empty when no motifs are drawn yet."""
        return library_ids(occasion)

    def motif_svg(self, occasion: str, motif_id: str, size: float, seed: int) -> str:
        """One self-contained <g> element sized to a size x size box at the origin."""
        if not math.isfinite(size) or size <= 0:
            raise MotifError("motif size must be a positive number")
        shapes = motif_shapes(occasion, motif_id, seed)
        return group_svg(
            shapes,
            size,
            {"data-occasion": occasion, "data-motif": motif_id, "data-seed": str(int(seed))},
        )


def unit_circle(steps: int = 24) -> list[Point]:
    """Circle polygon in the unit box, used by particle sprites."""
    return circle_points(0.5, 0.5, 0.48, steps)

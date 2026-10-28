"""Face-tracked accessories: hats, ears, crowns and party glasses.

Accessories are described in face-local box units (see target.py), so they
follow the face box and roll without any detection here. They are drawn on a
layer over the effect region only and composited through the allowed mask,
which keeps bystanders, eyes and the mouth exactly as they were. Nothing is
warped: an accessory is an overlay.
Author: John Khan.
"""

from __future__ import annotations

import math
import random
from collections.abc import Callable, Sequence
from dataclasses import replace

from .model import Look, PackError, Palette, hex_to_rgb
from .motifs import motif_shapes
from .raster import ImageArray, Layer, composite, mix, with_alpha
from .shapes import Shape, ShapeKind, oval, poly, stamp, stroke
from .target import FaceTarget, Point, allowed_mask

SHADOW_ALPHA = 0.28
SHADOW_OFFSET: Point = (0.02, 0.025)
AccessoryBuilder = Callable[[FaceTarget, Palette, random.Random], tuple[Shape, ...]]


# A curved headband over the hairline, in face-local units.
HEADBAND: tuple[Point, ...] = tuple(
    (0.48 * math.sin(t), -0.36 - 0.17 * math.cos(t))
    for t in (math.radians(a) for a in range(-90, 91, 15))
)


def _hex(rgb: tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"


def _shade(palette: Palette, role: str, toward: str, t: float) -> str:
    return _hex(mix(palette.rgb(role), palette.rgb(toward), t))


def witch_hat(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Tall bent witch hat with a band and buckle."""
    lean = rng.uniform(0.18, 0.3)
    cone = [(-0.34, -0.5), (-0.14, -0.9), (0.02, -1.14), (lean, -1.3)]
    cone += [(0.12, -1.08), (0.14, -0.86), (0.34, -0.5)]
    return (
        oval(palette.dark, (0.0, -0.47), (0.76, 0.1)),
        poly(palette.dark, cone),
        poly(palette.primary, [(-0.33, -0.52), (0.33, -0.52), (0.29, -0.62), (-0.29, -0.62)]),
        poly(palette.accent, [(-0.07, -0.51), (0.07, -0.51), (0.07, -0.63), (-0.07, -0.63)]),
        poly(palette.dark, [(-0.04, -0.54), (0.04, -0.54), (0.04, -0.6), (-0.04, -0.6)]),
    )


def cat_ears(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Pointed cat ears with soft inner colour on a thin band."""
    inner = _shade(palette, "secondary", "light", 0.35)
    shapes: list[Shape] = [stroke(palette.dark, HEADBAND, 0.05)]
    for side in (-1.0, 1.0):
        outer = [(side * 0.48, -0.42), (side * 0.38, -0.88), (side * 0.12, -0.52)]
        middle = [(side * 0.42, -0.47), (side * 0.36, -0.76), (side * 0.2, -0.53)]
        shapes.append(poly(palette.dark, outer))
        shapes.append(poly(inner, middle))
    return tuple(shapes)


def _dome(top: float, bottom: float, half: float, steps: int = 20) -> list[Point]:
    points = [(-half, bottom)]
    for index in range(steps + 1):
        theta = math.pi * index / steps
        points.append((-half * math.cos(theta), bottom - (bottom - top) * math.sin(theta)))
    points.append((half, bottom))
    return points


def knit_hat(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Knit beanie with a ribbed cuff, a stripe and a pompom."""
    body = palette.primary
    stripe = palette.light
    cuff = _shade(palette, "primary", "dark", 0.3)
    shapes: list[Shape] = [
        poly(body, _dome(-1.0, -0.42, 0.55)),
        poly(stripe, [(-0.5, -0.66), (0.5, -0.66), (0.47, -0.74), (-0.47, -0.74)]),
        poly(cuff, [(-0.58, -0.32), (0.58, -0.32), (0.58, -0.5), (-0.58, -0.5)]),
    ]
    for index in range(13):
        u = -0.54 + index * 0.09
        shapes.append(
            stroke(_shade(palette, "primary", "dark", 0.5), [(u, -0.34), (u, -0.48)], 0.012)
        )
    shapes.append(oval(stripe, (0.0, -1.04), (0.15, 0.12)))
    shapes.append(
        oval(_shade(palette, "light", "dark", 0.15), (0.04, -1.02), (0.08, 0.06), opacity=0.6)
    )
    return tuple(shapes)


def party_hat(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Cone party hat with dots, a fringe and a pompom, worn slightly askew."""
    tip_u = rng.uniform(-0.1, 0.1)
    cone = [(-0.25, -0.47), (tip_u, -1.2), (0.25, -0.47)]
    shapes: list[Shape] = [poly(palette.primary, cone)]
    for row, v in enumerate((-0.62, -0.78, -0.94)):
        width = 0.25 * (1.2 - (-v - 0.47) / 0.73 * 1.0)
        for index in range(3 - row):
            u = (index - (2 - row) / 2.0) * width * 0.6 + tip_u * (-v - 0.47) / 0.73
            shapes.append(oval(palette.accent, (u, v), (0.035, 0.03)))
    fringe = [(-0.27, -0.45)]
    for index in range(11):
        fringe.append((-0.27 + 0.054 * index, -0.5 if index % 2 else -0.43))
    fringe.append((0.27, -0.45))
    shapes.append(poly(palette.secondary, fringe))
    shapes.append(oval(palette.light, (tip_u, -1.22), (0.08, 0.065)))
    return tuple(shapes)


def crown(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Five-point paper crown with jewels."""
    points: list[Point] = [(-0.4, -0.44)]
    for index in range(9):
        u = -0.4 + 0.1 * index
        points.append((u, -0.86 if index % 2 == 0 else -0.66))
    points.append((0.4, -0.44))
    shapes: list[Shape] = [poly(palette.accent, points)]
    rim = [(-0.4, -0.44), (0.4, -0.44), (0.4, -0.52), (-0.4, -0.52)]
    shapes.append(poly(_shade(palette, "accent", "dark", 0.25), rim))
    for index, u in enumerate((-0.3, -0.1, 0.1, 0.3)):
        colour = palette.primary if index % 2 == 0 else palette.secondary
        shapes.append(oval(colour, (u, -0.58), (0.04, 0.035)))
    for index in range(5):
        shapes.append(oval(palette.light, (-0.4 + 0.2 * index, -0.88), (0.03, 0.025)))
    return tuple(shapes)


def bunny_ears(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Tall soft bunny ears on a headband."""
    inner = _shade(palette, "primary", "light", 0.25)
    outer = palette.light
    droop = rng.uniform(4.0, 12.0)
    band = _shade(palette, "light", "dark", 0.2)
    shapes: list[Shape] = [stroke(band, HEADBAND, 0.05)]
    for side in (-1.0, 1.0):
        shapes.append(oval(outer, (side * 0.19, -0.92), (0.11, 0.38), angle=side * droop))
        shapes.append(oval(inner, (side * 0.19, -0.9), (0.055, 0.28), angle=side * droop))
    return tuple(shapes)


def antlers(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Branching felt antlers on a band, with a bell-free bow."""
    brown = "#7a4b2a"
    shapes: list[Shape] = [stroke(brown, HEADBAND, 0.045)]
    for side in (-1.0, 1.0):
        main = [(side * 0.28, -0.46), (side * 0.36, -0.7), (side * 0.48, -0.95)]
        shapes.append(stroke(brown, main, 0.07))
        shapes.append(stroke(brown, [(side * 0.36, -0.7), (side * 0.2, -0.86)], 0.055))
        shapes.append(stroke(brown, [(side * 0.43, -0.86), (side * 0.62, -0.92)], 0.05))
    shapes.append(oval(palette.primary, (-0.1, -0.5), (0.08, 0.05), angle=20.0))
    shapes.append(oval(palette.primary, (0.1, -0.5), (0.08, 0.05), angle=-20.0))
    return tuple(shapes)


def earmuffs(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Fluffy earmuffs on a band over the crown of the head."""
    fluff = palette.light
    shade = _shade(palette, "light", "dark", 0.18)
    band = [(0.56 * math.sin(t), -0.2 - 0.42 * math.cos(t)) for t in _angles(-90, 90, 10)]
    shapes: list[Shape] = [stroke(palette.primary, band, 0.06)]
    for side in (-1.0, 1.0):
        shapes.append(oval(shade, (side * 0.56, -0.02), (0.15, 0.16)))
        shapes.append(oval(fluff, (side * 0.55, -0.04), (0.13, 0.14)))
        for index in range(5):
            theta = 2.0 * math.pi * index / 5 + rng.uniform(0.0, 0.5)
            puff = (side * 0.55 + 0.1 * math.cos(theta), -0.04 + 0.11 * math.sin(theta))
            shapes.append(oval(fluff, puff, (0.06, 0.06)))
    return tuple(shapes)


def _angles(start: int, stop: int, step: int) -> list[float]:
    return [math.radians(a) for a in range(start, stop + 1, step)]


def party_glasses(target: FaceTarget, palette: Palette, rng: random.Random) -> tuple[Shape, ...]:
    """Scalloped party glasses with clear lenses; rims sit just outside the eyes."""
    shapes: list[Shape] = []
    centres: list[tuple[float, float, float]] = []
    for eye in target.eye_regions():
        u, v = target.to_local(eye.cx, eye.cy)
        reach_u = eye.rx / target.box.width + 0.04
        reach_v = eye.ry / target.box.height + 0.045
        centres.append((u, v, reach_u))
        turn = rng.uniform(0.0, 0.3)
        rim: list[Point] = []
        for index in range(25):
            theta = 2.0 * math.pi * index / 24 + turn
            bump = 1.0 + (0.1 if index % 2 == 0 else 0.0)
            rim.append((u + reach_u * bump * math.cos(theta), v + reach_v * bump * math.sin(theta)))
        shapes.append(stroke(palette.accent, rim, 0.03))
    (lu, lv, lr), (ru, rv, rr) = centres
    bridge = [(lu + lr, lv - 0.02), ((lu + ru) / 2, (lv + rv) / 2 - 0.05), (ru - rr, rv - 0.02)]
    shapes.append(stroke(palette.accent, bridge, 0.03))
    return tuple(shapes)


def _arc_points(count: int, spread: float, base: float, lift: float) -> list[Point]:
    points: list[Point] = []
    for index in range(count):
        t = index / max(1, count - 1)
        u = (t - 0.5) * 2.0 * spread
        points.append((u, base - lift * math.cos((t - 0.5) * math.pi)))
    return points


ACCESSORIES: dict[str, AccessoryBuilder] = {
    "witch_hat": witch_hat,
    "cat_ears": cat_ears,
    "knit_hat": knit_hat,
    "party_hat": party_hat,
    "crown": crown,
    "bunny_ears": bunny_ears,
    "antlers": antlers,
    "party_glasses": party_glasses,
    "earmuffs": earmuffs,
}

# Wreath styles stamp motifs from the pack's own library along the hairline.
WREATH_STYLES = ("motif_wreath",)


def register_accessory(name: str, builder: AccessoryBuilder) -> None:
    """Add an accessory style other packs can name in a look's 'style' parameter."""
    if name in ACCESSORIES or name in WREATH_STYLES:
        raise PackError(f"accessory style {name!r} is already registered")
    ACCESSORIES[name] = builder


def draw_local(
    layer: Layer,
    target: FaceTarget,
    shapes: Sequence[Shape],
    alpha: float,
    recolour: str | None = None,
    offset: Point = (0.0, 0.0),
) -> None:
    """Draw face-local shapes onto an image-space layer.

    recolour paints every shape one colour and offset shifts them in box units;
    together they draw a shadow.
    """
    width, height = target.box.width, target.box.height
    du, dv = offset
    for shape in shapes:
        colour = with_alpha(hex_to_rgb(recolour or shape.colour), alpha * shape.opacity)
        if du or dv:
            shape = _shifted(shape, du, dv)
        if shape.kind is ShapeKind.ELLIPSE:
            cx, cy = target.to_image(*shape.centre)
            rx, ry = shape.radii[0] * width, shape.radii[1] * height
            layer.ellipse(cx, cy, rx, ry, colour, shape.angle + target.roll)
        elif shape.kind is ShapeKind.LINE:
            layer.line(target.local_polygon(shape.points), colour, max(1.0, shape.width * width))
        else:
            layer.polygon(target.local_polygon(shape.points), colour)


def _shifted(shape: Shape, du: float, dv: float) -> Shape:
    return replace(
        shape,
        points=tuple((u + du, v + dv) for u, v in shape.points),
        centre=(shape.centre[0] + du, shape.centre[1] + dv),
    )


def _draw_wreath(
    layer: Layer, target: FaceTarget, look: Look, occasion: str, seed: int, alpha: float
) -> None:
    motifs = look.param_names("motifs", look.motifs)
    if not motifs:
        raise PackError(f"look {look.id}: a wreath needs motifs")
    count = int(max(5, min(13, look.param_float("count", 9))))
    rng = random.Random(f"wreath:{look.id}:{seed}")
    size = target.box.width * max(0.1, min(0.35, look.param_float("motif_scale", 0.2)))
    for index, (u, v) in enumerate(_arc_points(count, 0.5, -0.4, 0.14)):
        x, y = target.to_image(u, v)
        shapes = motif_shapes(occasion, motifs[index % len(motifs)], seed + index)
        stamp(layer, shapes, x, y, size, target.roll + rng.uniform(-25.0, 25.0), alpha)


def render_accessory(
    image: ImageArray,
    look: Look,
    palette: Palette,
    occasion: str,
    target: FaceTarget,
    amount: float,
    seed: int,
) -> ImageArray:
    """Draw an accessory on the chosen face only."""
    height, width = image.shape[:2]
    style = look.param_str("style", "")
    x0, y0, x1, y1 = target.region_bounds(width, height)
    layer = Layer(x0, y0, x1, y1)
    alpha = 1.0
    if style in WREATH_STYLES:
        _draw_wreath(layer, target, look, occasion, seed, alpha)
    else:
        builder = ACCESSORIES.get(style)
        if builder is None:
            raise PackError(f"look {look.id}: unknown accessory style {style!r}")
        shapes = builder(target, palette, random.Random(f"{look.id}:{seed}"))
        # A soft shadow below and right of the accessory gives it depth.
        strength = max(0.0, min(0.6, look.param_float("shadow", SHADOW_ALPHA)))
        if strength > 0:
            draw_local(layer, target, shapes, strength, palette.dark, SHADOW_OFFSET)
        draw_local(layer, target, shapes, alpha)
    mask = allowed_mask(target, width, height)
    return composite(image, layer, opacity=0.7 + 0.3 * amount, allowed=mask)

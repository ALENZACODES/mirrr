"""Simple face paint on the cheeks, kept off the eyes and mouth.

Paint is a solid-colour silhouette of a pack motif (a web, a star, a leaf)
blended with multiply, so it can only darken skin and never lightens it. It is
placed from the face box and roll, or from landmarks when the caller gave them,
and composited through the allowed mask so eyes and mouth are never painted.
Author: John Khan.
"""

from __future__ import annotations

import random

from .model import Look, PackError, Palette
from .motifs import motif_shapes
from .raster import BlendMode, ImageArray, Layer, composite
from .shapes import stamp
from .target import FaceTarget, allowed_mask

PLACEMENTS = ("both_cheeks", "left_cheek", "right_cheek", "freckles")


def paint_spots(
    target: FaceTarget, look: Look, seed: int
) -> list[tuple[float, float, float, float]]:
    """(x, y, size, angle) in image pixels for each paint mark."""
    placement = look.param_str("placement", "both_cheeks")
    if placement not in PLACEMENTS:
        raise PackError(f"look {look.id}: placement must be one of {', '.join(PLACEMENTS)}")
    size = target.box.width * max(0.08, min(0.3, look.param_float("size", 0.2)))
    rng = random.Random(f"paint:{look.id}:{seed}")
    spots: list[tuple[float, float, float, float]] = []
    if placement == "freckles":
        count = int(max(3, min(9, look.param_float("count", 5))))
        for side in (-1, 1):
            cu, cv = target.cheek_anchor(side)
            for index in range(count):
                du = (index - (count - 1) / 2.0) * 0.045
                dv = rng.uniform(-0.035, 0.035)
                x, y = target.to_image(cu + du, cv + dv)
                spots.append((x, y, size * rng.uniform(0.35, 0.55), rng.uniform(0.0, 72.0)))
        return spots
    sides = {"both_cheeks": (-1, 1), "left_cheek": (-1,), "right_cheek": (1,)}[placement]
    for side in sides:
        cu, cv = target.cheek_anchor(side)
        x, y = target.to_image(cu, cv)
        spots.append((x, y, size, target.roll + rng.uniform(-15.0, 15.0)))
    return spots


def render_paint(
    image: ImageArray,
    look: Look,
    palette: Palette,
    occasion: str,
    target: FaceTarget,
    amount: float,
    seed: int,
) -> ImageArray:
    """Paint the chosen face's cheeks; nothing else changes."""
    motifs = look.param_names("motifs", look.motifs)
    if not motifs:
        raise PackError(f"look {look.id}: face paint needs a motif")
    height, width = image.shape[:2]
    x0, y0, x1, y1 = target.region_bounds(width, height)
    layer = Layer(x0, y0, x1, y1)
    red, green, blue = palette.rgb(look.param_str("colour", "dark"))
    paint_hex = f"#{red:02x}{green:02x}{blue:02x}"
    for index, (x, y, size, angle) in enumerate(paint_spots(target, look, seed)):
        shapes = motif_shapes(occasion, motifs[index % len(motifs)], seed + index)
        stamp(layer, shapes, x, y, size, angle, recolour=paint_hex)
    mask = allowed_mask(target, width, height)
    opacity = 0.25 + 0.6 * amount
    return composite(image, layer, opacity=opacity, mode=BlendMode.MULTIPLY, allowed=mask)

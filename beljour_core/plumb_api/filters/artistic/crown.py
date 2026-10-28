"""Meadow Crown: original parametric flowers, leaves and vine with hair occlusion.

The crown follows a forehead arc in the eye-line frame. Each flower is made
from six soft ellipses and a disc; all artwork is drawn by these equations.
The observed/manual hair matte is placed back in front, including its soft
alpha edge. No hair segmenter or asset is bundled. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from .geometry import ellipse_alpha, face_frame, over, path_distance
from .types import (
    ArtisticResult,
    Plane,
    blend,
    grid,
    hash_noise,
    integer,
    landmarks,
    mask,
    number,
    parameters,
    photo,
    result,
    smooth01,
)

DEFAULTS = {"amount": 0.8, "size": 1.0, "height": 0.05, "flowers": 7,
            "palette": "rose", "seed": 23}
PALETTES = {
    "rose": ((224.0, 119.0, 148.0), (249.0, 217.0, 225.0), (244.0, 194.0, 86.0)),
    "ivory": ((242.0, 232.0, 208.0), (255.0, 249.0, 232.0), (213.0, 174.0, 62.0)),
    "violet": ((163.0, 140.0, 208.0), (220.0, 211.0, 245.0), (235.0, 203.0, 95.0)),
}
LABEL = "Meadow Crown simulation. Original floral art sits behind your hair mask."


def crown_anchors(points: Plane, *, count: int, size: float, height: float) -> Plane:
    frame = face_frame(points)
    # The landmark forehead is the anchor. Eye-line orientation supplies roll only.
    forehead = points[10] - frame.down * frame.iod * height
    anchors = []
    for t in np.linspace(-1, 1, count):
        offset = frame.across * frame.iod * t * 0.78
        curve = frame.down * frame.iod * (0.13 * t * t - 0.035) * size
        anchors.append(forehead + offset + curve)
    return np.asarray(anchors, dtype=np.float64)


def crown_art(shape: tuple[int, int], points: Plane, *, size: float, height: float,
              count: int, palette: str, seed: int) -> tuple[Plane, Plane, Plane]:
    frame = face_frame(points)
    anchors = crown_anchors(points, count=count, size=size, height=height)
    x, y = grid(shape)
    premultiplied = np.zeros((*shape, 3), dtype=np.float64)
    coverage = np.zeros(shape, dtype=np.float64)
    vine_distance, _ = path_distance(x, y, anchors, max_distance=max(0.65, frame.iod * 0.009) + 0.6)
    vine = smooth01((max(0.65, frame.iod * 0.009) + 0.6 - vine_distance) / 1.0)
    premultiplied, coverage = over(premultiplied, coverage, (61, 104, 61), vine)
    outer, inner, centre = PALETTES[palette]
    for i, anchor in enumerate(anchors):
        jitter = float(hash_noise(np.array(i + 1), np.array(1), seed))
        radius = frame.iod * size * (0.078 + 0.025 * jitter)
        angle = frame.roll + jitter * np.pi
        # Two leaves precede the petals in painter order, with independent orientation.
        for side in (-1, 1):
            leaf_centre = anchor + frame.across * radius * side * 0.9 + frame.down * radius * 0.55
            leaf = ellipse_alpha(x, y, float(leaf_centre[0]), float(leaf_centre[1]),
                                  radius * 1.05, radius * 0.37, frame.roll + side * 0.45)
            premultiplied, coverage = over(premultiplied, coverage, (78, 126, 75), leaf)
        for petal in range(6):
            theta = angle + petal * np.pi / 3
            cx = anchor[0] + np.cos(theta) * radius * 0.64
            cy = anchor[1] + np.sin(theta) * radius * 0.64
            petal_alpha = ellipse_alpha(x, y, float(cx), float(cy), radius * 0.85,
                                       radius * 0.43, theta)
            tint = tuple(outer[k] * (0.72 + 0.28 * petal / 5) for k in range(3))
            premultiplied, coverage = over(premultiplied, coverage, tint, petal_alpha)
            vein = ellipse_alpha(x, y, float(cx), float(cy), radius * 0.63,
                                  radius * 0.16, theta) * 0.35
            premultiplied, coverage = over(premultiplied, coverage, inner, vein)
        disc = ellipse_alpha(x, y, float(anchor[0]), float(anchor[1]), radius * 0.38,
                             radius * 0.38, 0, feather=0.32)
        premultiplied, coverage = over(premultiplied, coverage, centre, disc)
    straight = premultiplied / np.maximum(coverage[..., None], 1e-12)
    return np.clip(straight, 0, 255), coverage, anchors


def render_crown_frame(image: np.ndarray, points: Plane, hair_mask: Any,
                       params: Mapping[str, Any] | None = None) -> ArtisticResult:
    """Rasterize a working crop using full-frame pixel landmarks translated to it.

    Face proportions and flower scale come from those points, never crop size.
    The public normalized-mesh wrapper and tiled entry validate their coordinates
    before arriving here. No landmarks are inferred by this helper.
    """
    src = photo(image)
    if points.shape != (478, 2) or not np.all(np.isfinite(points)):
        raise ValueError("crown frame needs 478 finite pixel points")
    if float(np.linalg.norm(points[468] - points[473])) < 4:
        raise ValueError("crown frame has a degenerate eye distance")
    p = parameters(params, DEFAULTS)
    amount = number(p["amount"], "amount", 0, 1)
    size = number(p["size"], "size", 0.5, 1.6)
    height = number(p["height"], "height", -0.25, 0.3)
    count = integer(p["flowers"], "flowers", 3, 11)
    seed = integer(p["seed"], "seed", 0, 2**31 - 1)
    if not isinstance(p["palette"], str) or p["palette"] not in PALETTES:
        raise ValueError("palette must be rose, ivory or violet")
    hair = mask(hair_mask, src.shape[:2], "hair_mask")
    art, alpha, anchors = crown_art(src.shape[:2], points, size=size, height=height,
                                  count=count, palette=p["palette"], seed=seed)
    support = alpha * (1 - hair) * amount
    out = blend(src, art, support)
    error = np.abs(out[..., :3].astype(float) - src[..., :3].astype(float))
    visible = float(np.sum(support))
    total = float(np.sum(alpha * amount))
    warnings = ["Original procedural artwork; placement depends on your confirmed mesh and hair matte."]
    if visible < 1:
        warnings.append("The crown is hidden by the hair mask or outside the photo.")
    return result("meadow-crown", src, out, support, LABEL,
                  {"hair_foreground_max_error": float(np.max(error[hair == 1], initial=0)),
                   "visible_alpha_sum": visible, "unoccluded_alpha_sum": total,
                   "occluded_fraction": 1 - visible / total if total > 0 else 0.0,
                   "geometry_displacement": 0.0, "flower_count": float(count)}, warnings,
                  {"anchors": anchors, "art_alpha": alpha})


def meadow_crown(image: np.ndarray, mesh: Any, hair_mask: Any,
                 params: Mapping[str, Any] | None = None) -> ArtisticResult:
    src = photo(image)
    return render_crown_frame(src, landmarks(mesh, src.shape[:2]), hair_mask, params)

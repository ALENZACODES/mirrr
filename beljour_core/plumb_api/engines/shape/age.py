"""LS3 Python age-look photo preview and metrics; matches the browser's layer semantics.

A seeded procedural effect, not age inference or forecasting: creases, tonal texture,
small spots and the guarded E08 jaw contour. The image is never uploaded or retained.
Face-mapping inspiration: DECA (distinct shape/appearance effects), FLAME (pose separate
from expression) and face-parsing.PyTorch (edit only semantic zones).
concept only, no code copied; uses canonical R4/R5 contours and anatomy.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core import regions
from ..core.filters import box_mean
from ..proportions import anatomy
from .age_protection import compose_protected
from .geometry import check_face, frame, raster_warp

LAYER_NAMES = ("lines", "texture", "spots", "jowl", "brows_lids", "lips", "colour", "hair")
LABEL = "Age-look simulation of lines, texture and shape; not a prediction of how you will age."
VERSION = "age-spike-r6/1"
Floats = NDArray[np.float64]


def age_strength(stop: int, strength: float = 1.0) -> tuple[bool, float, float]:
    if not isinstance(stop, int) or isinstance(stop, bool) or stop == 0 or stop < -3 or stop > 5:
        raise ValueError("age stop must be -3..-1 or 1..5")
    if not (math.isfinite(strength) and 0 <= strength <= 1):
        raise ValueError("age strength must be [0,1]")
    older = stop > 0
    return older, abs(stop) / (5 if older else 3) * strength, stop * strength


def layer_settings(overrides: Mapping[str, float] | None = None) -> dict[str, float]:
    settings = {name: 1.0 for name in LAYER_NAMES}
    for name, value in (overrides or {}).items():
        if (
            name not in settings
            or isinstance(value, bool)
            or not isinstance(value, (float, int))
            or not math.isfinite(value)
            or not 0 <= value <= 1
        ):
            raise ValueError(f"invalid age layer {name}")
        settings[name] = float(value)
    return settings


class XorShift32:
    def __init__(self, seed: int):
        if isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed <= 0xFFFFFFFF:
            raise ValueError("seed must be uint32")
        self.state = seed or 0x6D2B79F5

    def next(self) -> float:
        s = self.state
        s ^= (s << 13) & 0xFFFFFFFF
        s ^= s >> 17
        s ^= (s << 5) & 0xFFFFFFFF
        self.state = s & 0xFFFFFFFF
        return self.state / 4294967296


@dataclass(frozen=True)
class Stroke:
    start: tuple[float, float]
    mid: tuple[float, float]
    end: tuple[float, float]
    width: float
    depth: float


def curves(face: object, fraction: float) -> tuple[Stroke, ...]:
    mesh = check_face(face)
    if not 0 <= fraction <= 1:
        raise ValueError("crease fraction must be [0,1]")
    f = frame(mesh)

    def point(u: float, v: float) -> tuple[float, float]:
        xy = f.centre + u * f.axis_across + v * f.axis_down
        return float(xy[0]), float(xy[1])

    strokes: list[Stroke] = []
    width = max(0.6, f.iod * 0.012)
    depth = fraction * 20
    for band in range(3):
        height = -f.length * (0.13 + 0.046 * band)
        strokes.append(
            Stroke(
                point(-0.72 * f.iod, height),
                point(0, height - 0.035 * f.iod),
                point(0.72 * f.iod, height),
                width * (0.85 if band == 2 else 1),
                depth * (0.55 + 0.14 * band),
            )
        )
    for name in ("right_eye_outer", "left_eye_outer"):
        a = mesh[anatomy.LANDMARKS[name]]
        side = -1 if name == "right_eye_outer" else 1
        for s in (-1, 0, 1):
            start = a + side * f.axis_across * f.iod * 0.04
            ctrl = start + (side * f.axis_across + s * 0.4 * f.axis_down) * f.iod * 0.10
            end = a + (side * f.axis_across * 0.23 + s * f.axis_down * 0.18) * f.iod
            strokes.append(Stroke(tuple(start), tuple(ctrl), tuple(end), width * 0.7, depth * 0.55))
    for n_id, m_id in ((129, 61), (358, 291)):
        nose, mouth = mesh[n_id], mesh[m_id]
        side = -1 if n_id == 129 else 1
        start = (float(nose[0]), float(nose[1] + f.iod * 0.04))
        mid = (float((nose[0] + mouth[0]) / 2 + side * 0.05 * f.iod), float((nose[1] + mouth[1]) / 2))
        end = (float(mouth[0] + side * 0.06 * f.iod), float(mouth[1] + f.iod * 0.07))
        strokes.append(Stroke(start, mid, end, width * 1.1, depth * 0.75))
        strokes.append(
            Stroke(
                tuple(mouth),
                (float(mouth[0] + side * f.iod * 0.10), float(mouth[1] + f.iod * 0.15)),
                (float(mouth[0] + side * f.iod * 0.11), float(mouth[1] + f.iod * 0.28)),
                width,
                depth * 0.48,
            )
        )
    for ids in (regions.RIGHT_EYE, regions.LEFT_EYE):
        x = float(mesh[list(ids), 0].mean())
        y = float(np.max(mesh[list(ids), 1])) + 0.05 * f.iod
        strokes.append(
            Stroke((x - 0.24 * f.iod, y), (x, y + 0.045 * f.iod), (x + 0.24 * f.iod, y), width * 0.8, depth * 0.45)
        )
    return tuple(strokes)


def sample_curve(stroke: Stroke, steps: int = 32) -> np.ndarray:
    t = np.linspace(0, 1, steps + 1)
    a = np.array(stroke.start)
    b = np.array(stroke.mid)
    c = np.array(stroke.end)
    return ((1 - t) ** 2)[:, None] * a + (2 * (1 - t) * t)[:, None] * b + (t**2)[:, None] * c


def paint_strokes(image: np.ndarray, skin: np.ndarray, strokes: tuple[Stroke, ...]) -> tuple[int, float]:
    h, w = image.shape[:2]
    ink = np.zeros((h, w), dtype=np.float32)
    for line in strokes:
        sigma = max(0.5, line.width)
        limit = math.ceil(sigma * 3)
        for px, py in sample_curve(line):
            x0, x1 = max(0, int(math.floor(px - limit))), min(w, int(math.ceil(px + limit)) + 1)
            y0, y1 = max(0, int(math.floor(py - limit))), min(h, int(math.ceil(py + limit)) + 1)
            if x0 >= x1 or y0 >= y1:
                continue
            yy, xx = np.mgrid[y0:y1, x0:x1]
            weight = np.exp(-((xx - px) ** 2 + (yy - py) ** 2) / (2 * sigma * sigma)) * line.depth
            ink[y0:y1, x0:x1] = np.maximum(ink[y0:y1, x0:x1], weight)
    effect = ink * skin
    touched = int(np.count_nonzero(effect > 0.01))
    rgb = np.maximum(0, np.rint(image[:, :, :3].astype(float) - effect[..., None]))
    image[:, :, :3] = np.uint8(rgb)
    return touched, float(effect[effect > 0.01].mean()) if touched else 0.0


def render(
    image: np.ndarray,
    face: object,
    *,
    stop: int,
    strength: float = 1,
    seed: int = 12345,
    layers: Mapping[str, float] | None = None,
    hair_mask: np.ndarray | None = None,
    protected_mask: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, dict]:
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("age preview needs RGB or RGBA uint8 photo")
    mesh = check_face(face)
    older, fraction, _ = age_strength(stop, strength)
    settings = layer_settings(layers)
    rng = XorShift32(seed)
    h, w, _ = image.shape
    skin = regions.region_mask("skin", mesh, h, w, normalized=False, supersample=2)
    output = image.copy()
    guard = 1.0
    if any(settings[k] > 0 for k in ("jowl", "brows_lids", "lips")):
        modifier = 1 if older else -0.65
        output, metrics = raster_warp(
            image,
            mesh,
            {
                "jowl_fullness": modifier * 75 * fraction * settings["jowl"],
                "jaw_length": modifier * 40 * fraction * settings["jowl"],
                "forehead_height": -modifier * 20 * fraction * settings["brows_lids"],
                "chin_shape": -modifier * 20 * fraction * settings["lips"],
            },
        )
        guard = metrics["guard_scale"]
    wrinkle_pixels, contrast, spots, grey = 0, 0.0, 0, 0
    if older and settings["lines"]:
        wrinkle_pixels, contrast = paint_strokes(output, skin, curves(mesh, fraction * settings["lines"]))
    f = frame(mesh)
    mono = (output[:, :, 0] * 0.2126 + output[:, :, 1] * 0.7152 + output[:, :, 2] * 0.0722).astype(float)
    smooth = box_mean(mono, max(1, round(f.iod / 30)))
    texture = fraction * settings["texture"] * (0.35 if older else -0.48)
    colour = fraction * settings["colour"]
    delta = (mono - smooth) * texture * skin
    tone = np.array([3.0, 1.4, -2.4]) * (1 if older else -1) * colour
    output[:, :, :3] = np.uint8(
        np.clip(np.rint(output[:, :, :3].astype(float) + delta[..., None] + skin[..., None] * tone), 0, 255)
    )
    if older and settings["spots"]:
        n = math.ceil(f.iod**2 / 200 * fraction * settings["spots"])
        yy, xx = np.mgrid[0:h, 0:w]
        for _ in range(n):
            px = int(round(f.centre[0] + (rng.next() - 0.5) * f.iod * 2.3))
            py = int(round(f.centre[1] + (rng.next() - 0.45) * f.length * 0.85))
            radius = max(1, f.iod * (0.012 + rng.next() * 0.022))
            intensity = (7 + rng.next() * 15) * fraction * settings["spots"]
            if not 0 <= px < w or not 0 <= py < h or skin[py, px] < 0.8:
                continue
            spots += 1
            weight = np.exp(-((xx - px) ** 2 + (yy - py) ** 2) / (2 * radius * radius)) * skin * intensity
            output[:, :, :3] = np.uint8(
                np.clip(np.rint(output[:, :, :3].astype(float) - weight[..., None] * [0.65, 1, 1.3]), 0, 255)
            )
    if older and hair_mask is not None and settings["hair"]:
        if hair_mask.shape != (h, w) or np.any((hair_mask < 0) | (hair_mask > 1)):
            raise ValueError("hair mask must be 0..1 with image dimensions")
        alpha = hair_mask * fraction * settings["hair"] * 0.58
        grey = int(np.count_nonzero(alpha > 0))
        rgb = output[:, :, :3].astype(float)
        lum = np.dot(rgb, [0.2126, 0.7152, 0.0722])
        output[:, :, :3] = np.uint8(
            np.clip(np.rint(rgb * (1 - alpha[..., None]) + (lum + 12)[..., None] * alpha[..., None]), 0, 255)
        )
    output = compose_protected(
        image,
        output,
        mesh,
        iod=f.iod,
        protected_mask=protected_mask,
        hair_mask=hair_mask if older and settings["hair"] > 0 else None,
    )
    # Whole edited-pixel mask, including the guarded mesh warp (for Q1 safety).
    edit = (output[:, :, :3] != image[:, :, :3]).any(axis=2).astype(np.float32)
    return (
        output,
        edit,
        {
            "stop": stop,
            "strength_used": strength * guard,
            "guard_scale": guard,
            "wrinkle_pixels": wrinkle_pixels,
            "wrinkle_contrast": contrast,
            "spots_drawn": spots,
            "grey_pixels": grey,
            "texture_amount": texture,
            "colour_amount": colour,
            "released_photo_validated": False,
            "seed": seed,
            "label": LABEL,
        },
    )

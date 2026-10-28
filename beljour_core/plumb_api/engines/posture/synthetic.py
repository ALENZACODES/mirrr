"""LS4 synthetic figures: a drawn body (front or side) on a grid, with known control points.

Not a person and not a photo: capsules (thick round-ended segments), an ellipse head and a
polygon torso, filled with a skin tone and hash noise, over the R5 grid scene so Q12 can
check the background lines. Each figure's posture is set on purpose (lean angle, one
shoulder lower, head forward, shoulders rounded, upper back curved, hips forward, belly
forward) and its control points are returned exactly, so the fix plans have ground truth.
The same figures are drawn by web/src/engines/local/figures.ts; parity vectors sample their masks.

Released full-body photos replace these for the human check (plan §9, decisions Q11).
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ...quality.harness import hash_noise
from ...quality.warpfill import grid_scene
from ..core.regions import polygon
from .points import Controls

GRID = {"spacing": 10, "offset": 5, "thickness": 1}
SKIN = (196.0, 152.0, 128.0)
CLOTH = (70.0, 96.0, 150.0)
U8 = NDArray[np.uint8]
Mask = NDArray[np.float32]


@dataclass(frozen=True)
class Figure:
    image: U8
    person: Mask
    controls: Controls
    grid: dict[str, int]
    params: dict[str, Any]


def capsule(height: int, width: int, a: tuple[float, float], b: tuple[float, float], radius: float) -> Mask:
    """Anti-aliased thick segment a-b with round ends: alpha = clip(r + 0.5 - distance, 0, 1)."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    px, py = xx + 0.5, yy + 0.5
    ax, ay = a
    dx, dy = b[0] - ax, b[1] - ay
    length2 = dx * dx + dy * dy
    if length2 > 0:
        t = np.clip(((px - ax) * dx + (py - ay) * dy) / length2, 0.0, 1.0)
    else:
        t = np.zeros_like(px)
    dist = np.hypot(px - (ax + t * dx), py - (ay + t * dy))
    out: Mask = np.clip(radius + 0.5 - dist, 0.0, 1.0).astype(np.float32)
    return out


def oval(height: int, width: int, cx: float, cy: float, rx: float, ry: float) -> Mask:
    """Anti-aliased ellipse from the normalised radial distance (about 1 px soft edge)."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    r = np.hypot((xx + 0.5 - cx) / rx, (yy + 0.5 - cy) / ry)
    edge = min(rx, ry)
    out: Mask = np.clip((1.0 - r) * edge + 0.5, 0.0, 1.0).astype(np.float32)
    return out


def _rot(p: tuple[float, float], centre: tuple[float, float], degrees: float) -> tuple[float, float]:
    t = math.radians(degrees)
    dx, dy = p[0] - centre[0], p[1] - centre[1]
    return (centre[0] + dx * math.cos(t) - dy * math.sin(t), centre[1] + dx * math.sin(t) + dy * math.cos(t))


def _paint(height: int, width: int, layers: list[tuple[Mask, tuple[float, float, float]]], seed: int,
           flat: bool = False) -> tuple[U8, Mask]:
    base = grid_scene(height, width, GRID["spacing"], GRID["offset"], GRID["thickness"]).astype(np.float64)
    person = np.zeros((height, width), np.float32)
    noise = np.zeros((height, width), dtype=np.float64) if flat else hash_noise(seed, height, width)
    img = base
    for mask, tone in layers:
        colour = np.array(tone)[None, None, :] + 12.0 * noise[..., None]
        img = img * (1 - mask[..., None]) + colour * mask[..., None]
        person = np.maximum(person, mask)
    return np.clip(np.rint(img), 0, 255).astype(np.uint8), person


def front_figure(width: int = 160, height: int = 200, *, lean: float = 0.0, shoulder_drop: float = 0.0,
                 seed: int = 1, skin: tuple[float, float, float] = SKIN, flat: bool = False) -> Figure:
    """Front view. `lean` degrees (+ shoulders to the image right), `shoulder_drop` px
    (+ the subject's left shoulder, on the image right, sits lower)."""
    hip = (0.5 * width, 0.58 * height)
    torso = 0.27 * height
    half_shoulders, half_hips = 0.15 * width, 0.095 * width
    rs = _rot((hip[0] - half_shoulders, hip[1] - torso), hip, lean)
    ls = _rot((hip[0] + half_shoulders, hip[1] - torso + shoulder_drop), hip, lean)
    rh = (hip[0] - half_hips, hip[1])
    lh = (hip[0] + half_hips, hip[1])
    sm = ((rs[0] + ls[0]) / 2, (rs[1] + ls[1]) / 2)
    neck = _rot((sm[0], sm[1] - 0.035 * height), sm, lean)
    up = (sm[0] - hip[0], sm[1] - hip[1])
    norm = math.hypot(*up)
    head = (neck[0] + up[0] / norm * 0.08 * height, neck[1] + up[1] / norm * 0.08 * height)
    arm_r, leg_r = 0.032 * width, 0.042 * width
    layers = [
        (capsule(height, width, rh, (rh[0] - 0.01 * width, rh[1] + 0.2 * height), leg_r), CLOTH),
        (capsule(height, width, lh, (lh[0] + 0.01 * width, lh[1] + 0.2 * height), leg_r), CLOTH),
        (capsule(height, width, rs, (rs[0] - 0.03 * width, rs[1] + 0.24 * height), arm_r), skin),
        (capsule(height, width, ls, (ls[0] + 0.03 * width, ls[1] + 0.24 * height), arm_r), skin),
        (polygon(height, width, [rs, ls, lh, rh], 4), CLOTH),
        (capsule(height, width, sm, neck, 0.03 * width), skin),
        (oval(height, width, head[0], head[1], 0.06 * height, 0.075 * height), skin),
    ]
    image, person = _paint(height, width, layers, seed, flat)
    pts = {"right_shoulder": rs, "left_shoulder": ls, "right_hip": rh, "left_hip": lh,
           "mid_chest": (sm[0] + 0.3 * (hip[0] - sm[0]), sm[1] + 0.3 * (hip[1] - sm[1])),
           "navel": (sm[0] + 0.72 * (hip[0] - sm[0]), sm[1] + 0.72 * (hip[1] - sm[1]))}
    controls = Controls("front", {k: (float(v[0]), float(v[1])) for k, v in pts.items()}, width, height)
    return Figure(image, person, controls, dict(GRID), {"view": "front", "lean": lean, "shoulder_drop": shoulder_drop,
                                                         "seed": seed})


def side_figure(width: int = 160, height: int = 200, *, facing: int = 1, head_forward: float = 0.0,
                round_shoulder: float = 0.0, slouch: float = 0.0, sway: float = 0.0, belly: float = 0.0,
                ankle: bool = True, seed: int = 1, skin: tuple[float, float, float] = SKIN,
                flat: bool = False) -> Figure:
    """Side view facing image right (+1) or left (-1). Offsets are px toward the front
    (head, shoulder, hip, belly) or toward the back (`slouch`, upper-back curve)."""
    if facing not in (-1, 1):
        raise ValueError("facing must be -1 or 1")
    f = float(facing)
    cx = 0.5 * width
    hip = (cx + f * sway, 0.58 * height)
    knee = (cx + f * 0.02 * width, 0.78 * height)
    ank = (cx, 0.96 * height)
    shoulder = (cx + f * round_shoulder, 0.31 * height)
    ear = (shoulder[0] + f * head_forward, 0.19 * height)
    neck = (shoulder[0] + 0.3 * (ear[0] - shoulder[0]), shoulder[1] + 0.3 * (ear[1] - shoulder[1]))
    depth = 0.075 * width
    back = (shoulder[0] + 0.45 * (hip[0] - shoulder[0]) - f * (depth + slouch),
            shoulder[1] + 0.45 * (hip[1] - shoulder[1]))
    torso = [
        (neck[0] - f * 0.03 * width, neck[1]), back, (hip[0] - f * 0.065 * width, hip[1] - 0.04 * height),
        (hip[0] - f * 0.06 * width, hip[1] + 0.03 * height), (hip[0] + f * 0.06 * width, hip[1] + 0.03 * height),
        (hip[0] + f * (0.07 * width + belly), hip[1] - 0.06 * height),
        (shoulder[0] + f * 0.075 * width, shoulder[1] + 0.06 * height), (neck[0] + f * 0.035 * width, neck[1]),
    ]
    layers = [
        (capsule(height, width, hip, knee, 0.05 * width), CLOTH),
        (capsule(height, width, knee, ank, 0.04 * width), CLOTH),
        (polygon(height, width, torso, 4), CLOTH),
        (capsule(height, width, shoulder, (shoulder[0] + f * 0.01 * width, shoulder[1] + 0.25 * height), 0.03 * width), skin),
        (capsule(height, width, neck, ear, 0.03 * width), skin),
        (oval(height, width, ear[0] + f * 0.025 * width, ear[1] - 0.01 * height, 0.06 * height, 0.072 * height), skin),
    ]
    image, person = _paint(height, width, layers, seed, flat)
    pts = {"ear": ear, "neck_base": neck, "shoulder": shoulder, "mid_back": back, "hip": hip, "knee": knee}
    if ankle:
        pts["ankle"] = ank
    controls = Controls("side", {k: (float(v[0]), float(v[1])) for k, v in pts.items()}, width, height, facing)
    return Figure(image, person, controls, dict(GRID), {"view": "side", "facing": facing, "head_forward": head_forward,
                                                         "round_shoulder": round_shoulder, "slouch": slouch,
                                                         "sway": sway, "belly": belly, "ankle": ankle, "seed": seed})


def cases() -> list[Figure]:
    """The LS4 synthetic set: three front and three side figures with known postures."""
    return [
        front_figure(lean=4.0, shoulder_drop=4.0, seed=1),
        front_figure(lean=-3.0, shoulder_drop=-3.0, seed=2),
        front_figure(lean=6.0, shoulder_drop=2.0, seed=3, width=150, height=210),
        side_figure(head_forward=10.0, round_shoulder=4.0, slouch=4.0, sway=5.0, belly=3.0, seed=4),
        side_figure(facing=-1, head_forward=2.0, round_shoulder=12.0, slouch=3.0, sway=1.0, belly=4.0, seed=5),
        side_figure(head_forward=6.0, round_shoulder=3.0, slouch=5.0, sway=6.0, belly=2.0, ankle=False, seed=6),
    ]


# Drawn, non-biometric colour patches, not a representation of real-world skin groups.
FLAT_COLOURS: tuple[tuple[float, float, float], ...] = (
    (76.0, 51.0, 40.0),
    (124.0, 83.0, 60.0),
    (174.0, 122.0, 91.0),
    (220.0, 177.0, 147.0),
)


def truth_cases() -> dict[str, Figure]:
    """One non-neutral synthetic case per built fix, with known user-set offsets.

    The independent before measure is recomputed from exact control coordinates.
    Values are deliberately small enough for the original movement cap to bind.
    """
    return {
        "lean": front_figure(lean=4.0, flat=True),
        "uneven_shoulders": front_figure(shoulder_drop=4.0, flat=True),
        "rounded_shoulders": side_figure(round_shoulder=12.0, head_forward=2.0, flat=True),
        "forward_head": side_figure(head_forward=9.0, flat=True),
        "slouch": side_figure(slouch=8.0, flat=True),
        "swayback": side_figure(sway=8.0, flat=True),
        "pelvic_tilt": side_figure(sway=5.0, flat=True),
    }

"""LS7 local beard strands: stubble, short boxed and moustache drawn hair by hair.

Plan §7.3 M29 asks for 12 styles x 5 lengths x 4 densities x colour x edge x neckline;
LS7 tests the three that decide the tier (stubble, short boxed, moustache) with all the
toggles. Per strand (reusing the LS5 strand machinery, engines/concealer/strands.py):
* seeds: Poisson-disk dart throwing over the beard area, thinned by the edge feather,
  count = density per IOD^2 x area (density levels 1..4 = 25..100%);
* direction: growth flows down the face, turning outward with distance from the midline
  on the jaw and cheeks; the moustache grows outward and down from the philtrum;
* length in % of IOD per style, times the length setting (1..5 = x0.6 .. x1.5); width
  0.6-1.3 px scaled by IOD / 180 (kept within 0.6..1.5);
* colour: a target Lab (the hair colour read from the photo, or any hex) with a per-strand
  delta E 1-2.5 jitter, local lightness shading and a darker root; the strand layer's mean
  colour is checked against the target (delta E <= 3, plan M29);
* stubble also darkens the skin slightly under the strands (a shaving shadow).
Nothing outside the beard area changes (Q1). Mirrored in web/src/engines/local/beard.ts.
Inspiration: MediaPipe Face Landmarker (mesh-based face frame, runtime data) and
face-parsing.PyTorch (a named beard area); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import math
import time
from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..concealer.shades import lab_of_linear, linear_of
from ..concealer.strands import Canvas, Fibre, draw, poisson_seeds
from ..core.colour import ciede2000, hex_to_lab, srgb_to_lab_array
from ..core.composite import decode, encode
from ..core.filters import box_mean
from ..fill.patchmatch import XorShift32
from .regions import EDGES, NECKLINES, area

STYLES: dict[str, dict[str, Any]] = {
    "stubble": {"region": "full", "length": (0.008, 0.02), "density": 900.0, "width": (0.6, 1.0), "shadow": 0.10},
    "short_boxed": {"region": "full", "length": (0.035, 0.08), "density": 600.0, "width": (0.8, 1.3), "shadow": 0.04},
    "moustache": {"region": "moustache", "length": (0.04, 0.09), "density": 800.0, "width": (0.8, 1.3), "shadow": 0.03},
}
LENGTHS = {1: 0.6, 2: 0.8, 3: 1.0, 4: 1.25, 5: 1.5}
DENSITIES = (1, 2, 3, 4)
OUTWARD = 0.6
JITTER_DEGREES = 14.0
ROOT_DARKEN = 2.0
SHADING = 0.2
MAX_STRANDS = 120000
VERSION = "beard-spike-r7/1"
LABEL = "Beard simulation on this photo."
U8 = NDArray[np.uint8]


def target_lab(colour: str | tuple[float, float, float]) -> tuple[float, float, float]:
    if isinstance(colour, str):
        return hex_to_lab(colour)
    if len(colour) != 3 or not all(math.isfinite(v) for v in colour):
        raise ValueError("colour must be a hex string or a finite Lab triple")
    return (float(colour[0]), float(colour[1]), float(colour[2]))


@dataclass(frozen=True)
class BeardOutcome:
    image: U8
    alpha: NDArray[np.float64]
    edit_mask: NDArray[np.float32]
    metrics: dict[str, Any]
    label: str = LABEL


def growth(u_norm: float, across: np.ndarray, down: np.ndarray, moustache: bool) -> np.ndarray:
    """Unit growth direction at a point u_norm = (signed distance from midline) / (IOD / 2)."""
    side = 1.0 if u_norm >= 0 else -1.0
    if moustache:
        v = 0.9 * side * across + 0.5 * down
    else:
        v = down + OUTWARD * side * min(1.0, abs(u_norm)) * across
    out: np.ndarray = v / math.hypot(v[0], v[1])
    return out


def render(image: np.ndarray, face: object, *, style: str = "short_boxed", length: int = 3, density: int = 4,
           colour: str | tuple[float, float, float] = "#3B2A22", edge: str = "faded", neckline: str = "natural",
           seed: int = 11) -> BeardOutcome:
    started = time.perf_counter()
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("expected an RGB or RGBA uint8 photo")
    if style not in STYLES:
        raise ValueError(f"style must be one of {', '.join(STYLES)}")
    if length not in LENGTHS or density not in DENSITIES:
        raise ValueError("length must be 1..5 and density 1..4")
    if edge not in EDGES or neckline not in NECKLINES:
        raise ValueError("unknown edge or neckline")
    spec = STYLES[style]
    target = target_lab(colour)
    h, w = img.shape[:2]
    a = area(face, h, w, region=spec["region"], neckline=neckline, edge=edge)
    f = a.frame
    weight = a.weight.astype(np.float64)
    hard = a.hard > 0
    px_area = float(hard.sum())
    count = min(MAX_STRANDS, int(round(spec["density"] * density / 4 * px_area / (f.iod * f.iod))))
    radius = max(0.75, 0.75 * math.sqrt(px_area / max(count, 1)))
    rng = XorShift32(seed)
    seeds = poisson_seeds(hard, weight, radius, count, rng)
    lab = srgb_to_lab_array(img[..., :3])
    lightness = box_mean(lab[..., 0], max(1, int(round(f.iod * 0.05))))
    local = [float(lightness[int(y), int(x)]) for x, y in seeds]
    reference = sum(local) / len(local) if local else 0.0
    px_scale = min(1.5, max(0.6, f.iod / 180.0))
    lo, hi = spec["length"]
    jitter = math.radians(JITTER_DEGREES)
    strands: list[Fibre] = []
    for (x, y), lit in zip(seeds, local, strict=True):
        u = float(np.dot(np.array([x, y]) - f.centre, f.axis_across))
        g = growth(u / (f.iod / 2), f.axis_across, f.axis_down, spec["region"] == "moustache")
        angle = math.atan2(g[1], g[0]) + (rng.below(2001) - 1000) / 1000 * jitter
        size = (lo + (hi - lo) * rng.below(10001) / 10000) * LENGTHS[length] * f.iod
        width = (spec["width"][0] + (spec["width"][1] - spec["width"][0]) * rng.below(10001) / 10000) * px_scale
        bend = (rng.below(2001) - 1000) / 1000 * 0.2
        hue = math.radians(rng.below(3600) / 10)
        mag = 1.0 + 1.5 * rng.below(10001) / 10000
        shade = max(-5.0, min(5.0, SHADING * (lit - reference)))
        body = (target[0] + shade, target[1] + mag * math.cos(hue), target[2] + mag * math.sin(hue))
        root = (body[0] - ROOT_DARKEN, body[1], body[2])
        dx, dy = math.cos(angle), math.sin(angle)
        x0, y0 = x, y
        x2, y2 = x0 + dx * size, y0 + dy * size
        x1, y1 = x0 + dx * size / 2 - dy * bend * size, y0 + dy * size / 2 + dx * bend * size
        pts = []
        for k in range(5):
            s = k / 4
            c0, c1, c2 = (1 - s) * (1 - s), 2 * (1 - s) * s, s * s
            pts.append((c0 * x0 + c1 * x1 + c2 * x2, c0 * y0 + c1 * y1 + c2 * y2))
        strands.append(Fibre(tuple(pts), width, linear_of(body), linear_of(root)))
    canvas = Canvas(np.zeros((h, w)), np.zeros((h, w, 3)), weight, np.zeros((h, w), bool))
    for strand in strands:
        draw(canvas, strand)
    base = decode(img)
    shadow = spec["shadow"] * density / 4
    base = base * (1 - shadow * weight)[..., None]
    out = encode(base * (1 - canvas.alpha[..., None]) + canvas.colour)
    if img.shape[2] == 4:
        out = np.concatenate([out, img[..., 3:4]], axis=2)
    mean_lab = lab_of_linear([t / canvas.weight for t in canvas.totals]) if canvas.weight > 0 else target
    core = weight >= 0.5
    metrics = {"style": style, "length": length, "density": density, "edge": edge, "neckline": neckline,
               "strands": len(strands), "area_px": int(px_area), "iod": round(f.iod, 4),
               "coverage": round(float(canvas.alpha[core].mean()) if core.any() else 0.0, 6),
               "strand_lab": [round(v, 3) for v in mean_lab], "target_lab": [round(v, 3) for v in target],
               "strand_delta_e": round(ciede2000(mean_lab, target), 4), "shadow": round(shadow, 4),
               "seconds": round(time.perf_counter() - started, 3), "version": VERSION}
    return BeardOutcome(out, canvas.alpha, a.hard, metrics)

"""Q3, Q4 and Q12 (plus Q1) for E06 warp and E07 fill on synthetic grid scenes (plan R5).

Scenes (64 x 56, drawn by code, no photos):
  * grid: light paper with a soft gradient and dark 1 px grid lines every 8 px (offset 4).
  * body: the grid with an opaque, textured oval "body" in the middle; its band is the
    body dilated by 6 px (plan §8.5's body band, scaled to the scene).
  * smooth: a smooth colour field (for the smooth fill methods).

Warp scenarios move the body's sides inward by 3 px and hold its top and bottom, with each
E06 method faded to zero at the band edge over 5 px (smootherstep) and the fold guard on.
Checks: Q3 on the final field, Q4 on the band edge, Q12 on grid lines outside the band,
Q1 outside the band. Fill scenarios cut a disc out of a scene, fill it, and score Q1
(outside the hole), Q4 against the undamaged scene and, on the grid, Q12 for lines that
run straight through the filled hole.

`web/src/quality/warpfill.ts` builds the same scenes and scenarios; the TypeScript test
compares its reports with the Python ones stored in parity/warpfill-report-python.json.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..engines.core.distance import dilate
from ..engines.core.masks import ellipse
from ..engines.fill import fill as fills
from ..engines.warp import falloff, fold
from ..engines.warp import field as fields
from ..engines.warp.engine import build_field
from . import metrics
from .harness import hash_noise
from .metrics import Check
from .report import PhotoResult, build_report

HEIGHT, WIDTH = 56, 64
GRID = {"spacing": 8, "offset": 4, "thickness": 1}
BAND_PX = 6
RAMP_PX = 5.0
REPORT_DATE = "2026-10-22"
WARP_FROM = [[19.0, 30.0], [45.0, 30.0], [32.0, 13.0], [32.0, 47.0]]
WARP_TO = [[22.0, 30.0], [42.0, 30.0], [32.0, 13.0], [32.0, 47.0]]
WARP_METHODS = ("tps", "mls-affine", "mls-similarity", "mls-rigid", "piecewise")
U8 = NDArray[np.uint8]


def grid_scene(height: int = HEIGHT, width: int = WIDTH, spacing: int = 8, offset: int = 4,
               thickness: int = 1) -> U8:
    """Paper with a soft gradient and dark grid lines (rows and columns)."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    paper = np.stack([226 + 10 * xx / width, 228 + 8 * yy / height, 232 - 6 * xx / width], -1)
    on_row = np.zeros(height, bool)
    on_col = np.zeros(width, bool)
    for start in metrics.grid_lines(height, spacing, offset, thickness):
        on_row[start:start + thickness] = True
    for start in metrics.grid_lines(width, spacing, offset, thickness):
        on_col[start:start + thickness] = True
    ink = on_row[:, None] | on_col[None, :]
    img = np.where(ink[..., None], np.array([44.0, 46.0, 60.0]), paper)
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)


def body_scene(seed: int = 1) -> tuple[U8, NDArray[np.float32], NDArray[np.float32]]:
    """(image, body mask, band): a textured oval over the grid, and the oval grown by 6 px."""
    grid = grid_scene().astype(np.float64)
    body = ellipse(HEIGHT, WIDTH, 32.0, 30.0, 13.0, 17.0, feather=0.1)
    tone = np.array([188.0, 142.0, 120.0]) + 10 * hash_noise(seed, HEIGHT, WIDTH)[..., None]
    img = grid * (1 - body[..., None]) + tone * body[..., None]
    band = dilate((body > 0).astype(np.float32), BAND_PX)
    return np.clip(np.rint(img), 0, 255).astype(np.uint8), body, band


def smooth_scene(height: int = HEIGHT, width: int = WIDTH) -> U8:
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    r = 90 + 80 * xx / width + 20 * np.sin(yy / 9)
    g = 70 + 60 * yy / height
    b = 120 + 40 * np.cos((xx + yy) / 14)
    return np.clip(np.rint(np.stack([r, g, b], -1)), 0, 255).astype(np.uint8)


def disc(cx: float, cy: float, radius: float, height: int = HEIGHT, width: int = WIDTH) -> NDArray[np.float32]:
    yy, xx = np.mgrid[0:height, 0:width]
    out: NDArray[np.float32] = ((xx - cx) ** 2 + (yy - cy) ** 2 <= radius * radius).astype(np.float32)
    return out


@dataclass(frozen=True)
class Scenario:
    id: str
    method: str
    checks: list[Check]
    extra: dict[str, float]


def warp_scenario(method: str, seed: int = 1) -> Scenario:
    image, _, band = body_scene(seed)
    full = build_field(HEIGHT, WIDTH, method, np.array(WARP_FROM), np.array(WARP_TO))
    weights = falloff.band_weights(band, RAMP_PX)
    safe = fold.safe_strength(lambda s: fields.weighted(fields.scale(full, s), weights))
    after = fields.apply(image, safe.field)
    checks = [
        metrics.q3_fold_free(safe.field.map_x, safe.field.map_y),
        metrics.q4_seam(image, after, band),
        metrics.q12_straight_lines(after, band, **GRID),
        metrics.q1_outside_mask(image, after, band),
    ]
    return Scenario(f"body-{method}", method, checks,
                    {"strength_used": safe.strength, "max_move": fields.move_stats(safe.field).max_move})


FILL_CASES: dict[str, tuple[str, Callable[[], U8], tuple[float, float, float], bool]] = {
    "smooth-biharmonic": ("biharmonic", smooth_scene, (32.0, 28.0, 6.0), False),
    "smooth-fast-marching": ("fast-marching", smooth_scene, (32.0, 28.0, 6.0), False),
    "grid-patchmatch": ("patchmatch", grid_scene, (36.0, 28.0, 5.0), True),
}


def fill_scenario(case: str) -> Scenario:
    method, scene, (cx, cy, radius), straight = FILL_CASES[case]
    truth = scene()
    hole = disc(cx, cy, radius)
    damaged = truth.copy()
    damaged[hole > 0] = [250, 10, 250]
    out = fills.fill(damaged, hole, method, seed=1)
    checks = [metrics.q1_outside_mask(damaged, out.image, hole), metrics.q4_seam(truth, out.image, hole)]
    if straight:
        checks.append(metrics.q12_straight_lines(out.image, None, **GRID))
    error = float(np.abs(out.image.astype(np.int16) - truth.astype(np.int16))[hole > 0].mean())
    return Scenario(case, method, checks, {"hole_pixels": float(out.hole_pixels), "mean_abs_error": error})


def run_warp() -> list[Scenario]:
    return [warp_scenario(m) for m in WARP_METHODS]


def run_fill() -> list[Scenario]:
    return [fill_scenario(c) for c in FILL_CASES]


def to_report(tool: str, version: str, scenarios: list[Scenario], created: str | None = REPORT_DATE) -> dict[str, Any]:
    entries = [PhotoResult(s.id, True, s.checks, s.method) for s in scenarios]
    return build_report(tool, version, entries, created=created)


def reports(created: str | None = REPORT_DATE) -> dict[str, dict[str, Any]]:
    from ..engines.fill.fill import VERSION as FILL_VERSION
    from ..engines.warp.engine import VERSION as WARP_VERSION
    return {"warp": to_report("warp", WARP_VERSION.split("-")[1], run_warp(), created),
            "fill": to_report("fill", FILL_VERSION.split("-")[1], run_fill(), created)}

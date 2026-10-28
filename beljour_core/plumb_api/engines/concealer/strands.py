"""LS5 fibre render: strands on visible scalp, aimed at a scalp-share cut (plan §8.4).

Light / Medium / Full = cut the zone's scalp share by 30 / 55 / 80%; the 0-100 slider is
the same scale (Full = 100 = 80% cut).
  1. Seeds: Poisson-disk sampling (dart throwing with a minimum distance, in an order
     shuffled by xorshift32, at sub-pixel spots) on scalp pixels, thinned by the zone feather so density
     fades at the zone edge instead of stopping at a hard line.
  2. Orientation: the structure tensor of nearby hair (Lab lightness gradients weighted
     by the hair mask) gives the local strand direction; where it is unclear the whole
     area's dominant direction is used. All fibres in an area point the same way.
  3. Each fibre: a quadratic curve 4-14 px long at 1024 px (scaled by the photo's long
     side, never below half), 1-2 px wide, slightly bent, anti-aliased by distance; its
     colour is the chosen shade plus a per-fibre Lab jitter of delta E 1-3, shaded by the
     local lightness (zero mean over the seeds) with a soft root shadow and a thinner tip.
  4. Fibres are drawn one by one (premultiplied, in linear light) until the scalp pixels
     they cover reach the target, so the cut lands on target by construction; the count
     used and the share reached are reported.
  5. Product types: fibres; tinted spray and powder are smoother renders of the same
     coverage (box-blurred coverage, uniform or mottled shade), found by a batch-then-
     bisect search on the fibre count.

Everything outside the zone is untouched (zone weight 0 there), which is the Q1 check.
Mirrored in web/src/engines/local/strands.ts. Author: John Khan.
"""
from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ...commerce.strength import validate_level
from ..core.colour import ciede2000, srgb_to_lab_array
from ..core.composite import decode, encode
from ..core.distance import feather
from ..core.filters import box_mean, gradient
from ..core.masks import as_mask
from ..core.refusal import DegenerateInput
from ..fill.patchmatch import XorShift32
from .shades import lab_of_linear, linear_of
from .synthetic import value_noise

LEVELS: dict[str, float] = {"light": 37.5, "medium": 68.75, "full": 100.0}
MAX_CUT = 0.80
PRODUCTS = ("fibres", "spray", "powder")
LENGTH_PX = (4.0, 14.0)
WIDTH_PX = (1.0, 2.0)
ANGLE_JITTER_DEGREES = 12.0
BEND = 0.15
ROOT_SHARE = 0.3
ROOT_DARKEN = 3.0
TIP_FADE = 0.35
SHADING = 0.25
SHADING_LIMIT = 6.0
COHERENT = 0.2
TENSOR_SPAN = 18          # structure-tensor window radius at 1024 px (9 px at the 0.5 scale floor)
MIN_SCALE = 0.5
FEATHER_SHARE = 0.02
MAX_FIBRES = 80000
OVERLAP = 0.55
OPACITY = {"fibres": 1.0, "spray": 0.95, "powder": 0.85}
VERSION = "fibre-spike-r7/1"
LABEL = "Hair fibre simulation on this photo. A photo-based estimate, not a diagnosis."
U8 = NDArray[np.uint8]
Floats = NDArray[np.float64]


def cut_for(amount: float | str) -> float:
    """Scalp-share cut for a slider value 0..100 or a named level."""
    if isinstance(amount, str):
        if amount not in LEVELS:
            raise ValueError(f"level must be one of {', '.join(LEVELS)}")
        amount = LEVELS[amount]
    if not (isinstance(amount, (int, float)) and math.isfinite(amount) and 0 <= amount <= 100):
        raise ValueError("amount must be 0..100")
    return MAX_CUT * float(amount) / 100.0


def cut_for_level(level: object) -> float:
    """Strict 1.0--5.0 fibre control; 1 is unchanged and 5 cuts at most 80%."""
    checked = validate_level(level)
    return cut_for((checked - 1.0) * 25.0)


@dataclass(frozen=True)
class Orientation:
    theta: Floats          # strand direction per pixel, radians
    coherence: Floats
    dominant: float


def orientation(image: np.ndarray, hair: np.ndarray, radius: int = 6) -> Orientation:
    """Strand direction from the hair-weighted structure tensor of Lab lightness."""
    lab = srgb_to_lab_array(np.asarray(image)[..., :3])
    gx, gy = gradient(lab[..., 0])
    m = np.asarray(hair, dtype=np.float64)
    jxx, jxy, jyy = box_mean(m * gx * gx, radius), box_mean(m * gx * gy, radius), box_mean(m * gy * gy, radius)
    weight = box_mean(m, radius)
    trace = jxx + jyy
    theta = 0.5 * np.arctan2(2 * jxy, jxx - jyy) + math.pi / 2
    coherence = np.where((trace > 1e-12) & (weight > 0.05),
                         np.sqrt((jxx - jyy) ** 2 + 4 * jxy * jxy) / np.maximum(trace, 1e-12), 0.0)
    sxx, sxy, syy = float((m * gx * gx).sum()), float((m * gx * gy).sum()), float((m * gy * gy).sum())
    dominant = 0.5 * math.atan2(2 * sxy, sxx - syy) + math.pi / 2
    return Orientation(theta, coherence, dominant)


def poisson_seeds(candidates: NDArray[np.bool_], weights: Floats, radius: float, limit: int,
                  rng: XorShift32) -> list[tuple[float, float]]:
    """Dart throwing on candidate pixels in an xorshift32-shuffled order, at sub-pixel spots.

    A candidate pixel is tried when rng.below(1000) < floor(weight * 1000); its point is the
    pixel plus a jitter of (rng.below(1000) + 0.5) / 1000 on each axis, kept when no kept
    point lies closer than `radius` px. Stops after `limit` points. Sub-pixel points keep
    the minimum distance continuous, so density settings stay distinct even when points
    are packed close. The draws happen in the same order in the TypeScript port."""
    h, w = candidates.shape
    order = np.flatnonzero(candidates.ravel()).tolist()
    for i in range(len(order) - 1, 0, -1):
        j = rng.below(i + 1)
        order[i], order[j] = order[j], order[i]
    cell = max(radius, 1.0)
    cols, rows = int(w // cell) + 1, int(h // cell) + 1
    grid: dict[int, list[tuple[float, float]]] = {}
    r2 = radius * radius
    flat_w = weights.ravel()
    kept: list[tuple[float, float]] = []
    for idx in order:
        if len(kept) >= limit:
            break
        threshold = int(math.floor(flat_w[idx] * 1000 + 1e-9))
        if rng.below(1000) >= threshold:
            continue
        x = idx % w + (rng.below(1000) + 0.5) / 1000
        y = idx // w + (rng.below(1000) + 0.5) / 1000
        gx, gy = int(x // cell), int(y // cell)
        clash = False
        for cy in range(max(0, gy - 1), min(rows, gy + 2)):
            for cx in range(max(0, gx - 1), min(cols, gx + 2)):
                for px, py in grid.get(cy * cols + cx, ()):
                    if (px - x) ** 2 + (py - y) ** 2 < r2:
                        clash = True
                        break
                if clash:
                    break
            if clash:
                break
        if clash:
            continue
        grid.setdefault(gy * cols + gx, []).append((x, y))
        kept.append((x, y))
    return kept


@dataclass(frozen=True)
class Fibre:
    points: tuple[tuple[float, float], ...]
    width: float
    body: tuple[float, float, float]      # linear RGB
    root: tuple[float, float, float]


def scale_of(width: int, height: int) -> float:
    return max(MIN_SCALE, max(width, height) / 1024.0)


def build_fibres(seeds: list[tuple[float, float]], orient: Orientation, shade: tuple[float, float, float],
                 lightness: Floats, scale: float, rng: XorShift32) -> list[Fibre]:
    """One fibre per seed, in seed order (all random draws in a fixed order per fibre)."""
    if not seeds:
        return []
    local = [float(lightness[int(y), int(x)]) for x, y in seeds]
    reference = sum(local) / len(local)
    jitter = math.radians(ANGLE_JITTER_DEGREES)
    out: list[Fibre] = []
    for (x, y), lit in zip(seeds, local, strict=True):
        ix, iy = int(x), int(y)
        t = float(orient.theta[iy, ix]) if orient.coherence[iy, ix] >= COHERENT else orient.dominant
        if math.cos(t - orient.dominant) < 0:
            t += math.pi
        phi = t + (rng.below(2001) - 1000) / 1000 * jitter
        length = (LENGTH_PX[0] + (LENGTH_PX[1] - LENGTH_PX[0]) * rng.below(10001) / 10000) * scale
        width = WIDTH_PX[0] + (WIDTH_PX[1] - WIDTH_PX[0]) * rng.below(10001) / 10000
        bend = (rng.below(2001) - 1000) / 1000 * BEND
        hue = math.radians(rng.below(3600) / 10)
        size = 1.0 + 2.0 * rng.below(10001) / 10000
        dl = (rng.below(2001) - 1000) / 1000 * 0.5
        shading = max(-SHADING_LIMIT, min(SHADING_LIMIT, SHADING * (lit - reference)))
        body_lab = (shade[0] + dl * size + shading, shade[1] + size * math.cos(hue), shade[2] + size * math.sin(hue))
        root_lab = (body_lab[0] - ROOT_DARKEN, body_lab[1], body_lab[2])
        dx, dy = math.cos(phi), math.sin(phi)
        x0, y0 = x, y
        x2, y2 = x0 + dx * length, y0 + dy * length
        x1, y1 = x0 + dx * length / 2 - dy * bend * length, y0 + dy * length / 2 + dx * bend * length
        pts = []
        for k in range(5):
            s = k / 4
            a, b, c = (1 - s) * (1 - s), 2 * (1 - s) * s, s * s
            pts.append((a * x0 + b * x1 + c * x2, a * y0 + b * y1 + c * y2))
        out.append(Fibre(tuple(pts), width, linear_of(body_lab), linear_of(root_lab)))
    return out


@dataclass
class Canvas:
    """Alpha and premultiplied linear colour of the fibre layer, plus colour totals."""
    alpha: Floats
    colour: Floats
    zone: Floats
    target: NDArray[np.bool_]
    covered: int = 0
    weight: float = 0.0
    totals: list[float] = field(default_factory=lambda: [0.0, 0.0, 0.0])

    def copy(self) -> Canvas:
        return Canvas(self.alpha.copy(), self.colour.copy(), self.zone, self.target, self.covered, self.weight,
                      list(self.totals))


def draw(canvas: Canvas, f: Fibre, *, with_colour: bool = True) -> None:
    """Composite one fibre: alpha = clip(w/2 + 0.5 - distance) x (1 - 0.35 t) x zone weight."""
    h, w = canvas.alpha.shape
    xs = [p[0] for p in f.points]
    ys = [p[1] for p in f.points]
    pad = f.width / 2 + 1
    left, right = max(0, int(math.floor(min(xs) - pad))), min(w, int(math.ceil(max(xs) + pad)) + 1)
    top, bottom = max(0, int(math.floor(min(ys) - pad))), min(h, int(math.ceil(max(ys) + pad)) + 1)
    if left >= right or top >= bottom:
        return
    yy, xx = np.mgrid[top:bottom, left:right].astype(np.float64)
    px, py = xx + 0.5, yy + 0.5
    best = np.full(px.shape, np.inf)
    along = np.zeros(px.shape)
    for k in range(4):
        ax, ay = f.points[k]
        dx, dy = f.points[k + 1][0] - ax, f.points[k + 1][1] - ay
        length2 = dx * dx + dy * dy
        t = np.clip(((px - ax) * dx + (py - ay) * dy) / length2, 0.0, 1.0) if length2 > 0 else np.zeros(px.shape)
        ex, ey = px - (ax + t * dx), py - (ay + t * dy)
        d = np.sqrt(ex * ex + ey * ey)
        closer = d < best
        best = np.where(closer, d, best)
        along = np.where(closer, (k + t) / 4, along)
    a = np.clip(f.width / 2 + 0.5 - best, 0.0, 1.0) * (1 - TIP_FADE * along) * canvas.zone[top:bottom, left:right]
    old = canvas.alpha[top:bottom, left:right]
    new = old + a * (1 - old)
    tgt = canvas.target[top:bottom, left:right]
    canvas.covered += int((tgt & (old < 0.5) & (new >= 0.5)).sum())
    canvas.alpha[top:bottom, left:right] = new
    if with_colour:
        mix = np.maximum(0.0, 1 - along / ROOT_SHARE)
        patch = canvas.colour[top:bottom, left:right]
        for c in range(3):
            col = f.body[c] + (f.root[c] - f.body[c]) * mix
            patch[..., c] = patch[..., c] * (1 - a) + col * a
            canvas.totals[c] += float((col * a).sum())
        canvas.weight += float(a.sum())


def covered_after_blur(canvas: Canvas, radius: int) -> tuple[int, Floats]:
    soft = box_mean(canvas.alpha, radius) * canvas.zone
    return int((canvas.target & (soft >= 0.5)).sum()), soft


@dataclass(frozen=True)
class FibreOutcome:
    image: U8
    alpha: Floats
    edit_mask: NDArray[np.float32]
    metrics: dict[str, Any]
    label: str = LABEL


def render(image: np.ndarray, zone: np.ndarray, scalp: np.ndarray, shade: tuple[float, float, float], *,
           amount: float | str = "medium", product: str = "fibres", hair: np.ndarray | None = None,
           seed: int = 7) -> FibreOutcome:
    """Fibres (or spray, powder) on the scalp pixels of `zone`, cutting their share by the target."""
    started = time.perf_counter()
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("expected an RGB or RGBA uint8 photo")
    if product not in PRODUCTS:
        raise ValueError(f"product must be one of {', '.join(PRODUCTS)}")
    if not (len(shade) == 3 and all(math.isfinite(v) for v in shade)):
        raise ValueError("shade must be a finite Lab triple")
    h, w = img.shape[:2]
    cut = cut_for(amount)
    hard = as_mask(zone, (h, w)) >= 0.5
    if not hard.any():
        raise ValueError("the zone is empty")
    scale = scale_of(w, h)
    feather_px = max(2.0, FEATHER_SHARE * max(w, h))
    weight = feather(hard.astype(np.float32), feather_px, "inside").astype(np.float64)
    # Shares are measured in the zone core (feather weight >= 0.5): the feathered rim can
    # never be covered fully, by design, so it is not part of the target.
    core = weight >= 0.5
    if not core.any():
        raise DegenerateInput("zone_too_small", "the zone is too small for its feather")
    seeds_on = np.asarray(scalp, dtype=bool) & hard
    scalp_on = seeds_on & core
    hair_on = (hard & ~seeds_on) if hair is None else np.asarray(hair, dtype=bool)
    zone_px, scalp_px = int(core.sum()), int(scalp_on.sum())
    target = int(math.ceil(scalp_px * cut - 1e-9))
    canvas = Canvas(np.zeros((h, w)), np.zeros((h, w, 3)), weight, scalp_on)
    used, reached = 0, target == 0
    blur_r = max(1, int(round(2 * scale)))
    if target > 0:
        rng = XorShift32(seed)
        orient = orientation(img, hair_on, max(6, int(math.floor(TENSOR_SPAN * scale + 0.5))))
        lab = srgb_to_lab_array(img[..., :3])
        lightness = box_mean(lab[..., 0], max(2, int(round(4 * scale))))
        mean_area = (LENGTH_PX[0] + LENGTH_PX[1]) / 2 * scale * (WIDTH_PX[0] + WIDTH_PX[1]) / 2
        estimate = int(math.ceil(target / (mean_area * OVERLAP)))
        limit = min(MAX_FIBRES, 6 * estimate + 100)
        radius = max(1.0, 0.7 * math.sqrt(scalp_px / limit))
        seeds = poisson_seeds(seeds_on, weight, radius, limit, rng)
        fibres = build_fibres(seeds, orient, shade, lightness, scale, rng)
        if product == "fibres":
            for f in fibres:
                draw(canvas, f)
                used += 1
                if canvas.covered >= target:
                    reached = True
                    break
        else:
            used, reached, canvas = _smooth_search(canvas, fibres, target, blur_r, max(16, estimate // 24))
    alpha = canvas.alpha
    base = decode(img)
    if product == "fibres":
        out_lin = base * (1 - alpha[..., None]) + canvas.colour
        lab_mean = lab_of_linear([t / canvas.weight for t in canvas.totals]) if canvas.weight > 0 else tuple(shade)
        covered = canvas.covered
    else:
        covered, soft = covered_after_blur(canvas, blur_r)
        alpha = soft * OPACITY[product]
        tint = np.array(linear_of(shade))
        if product == "powder":
            light = np.array(linear_of((shade[0] + 1.5, shade[1], shade[2])))
            dark = np.array(linear_of((shade[0] - 1.5, shade[1], shade[2])))
            yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
            mottle = value_noise(xx / 2.0, yy / 2.0, seed)[..., None]
            colour = dark * (1 - mottle) + light * mottle
        else:
            colour = np.broadcast_to(tint, (h, w, 3))
        out_lin = base * (1 - alpha[..., None]) + colour * alpha[..., None]
        total = float(alpha.sum())
        lab_mean = lab_of_linear(((colour * alpha[..., None]).reshape(-1, 3).sum(0) / total).tolist()) if total > 0 else tuple(shade)
    out = encode(out_lin)
    if img.shape[2] == 4:
        out = np.concatenate([out, img[..., 3:4]], axis=2)
    before = scalp_px / zone_px
    after = (scalp_px - covered) / zone_px
    metrics = {
        "product": product, "cut_target": round(cut, 6), "fibres_used": used, "reached": bool(reached),
        "scalp_share_before": round(before, 6), "scalp_share_after": round(after, 6),
        "scalp_share_target": round(before * (1 - cut), 6), "covered_px": covered, "target_px": target,
        "fibre_lab": [round(v, 3) for v in lab_mean], "fibre_delta_e": round(ciede2000(lab_mean, shade), 4),
        "feather_px": round(feather_px, 3), "core_px": zone_px, "scale": round(scale, 4), "seconds": round(time.perf_counter() - started, 3),
        "version": VERSION}
    return FibreOutcome(out, alpha, (weight > 0).astype(np.float32), metrics)


def _smooth_search(canvas: Canvas, fibres: list[Fibre], target: int, blur_r: int,
                   batch: int) -> tuple[int, bool, Canvas]:
    """Fewest fibres whose blurred coverage reaches the target: batches, then bisection."""
    k = 0
    while k < len(fibres):
        snap, start = canvas.copy(), k
        for f in fibres[k:k + batch]:
            draw(canvas, f, with_colour=False)
        k = min(len(fibres), k + batch)
        if covered_after_blur(canvas, blur_r)[0] >= target:
            lo, hi = start, k
            while hi - lo > 1:
                mid = (lo + hi) // 2
                trial = snap.copy()
                for f in fibres[start:mid]:
                    draw(trial, f, with_colour=False)
                if covered_after_blur(trial, blur_r)[0] >= target:
                    hi = mid
                else:
                    lo = mid
            final = snap.copy()
            for f in fibres[start:hi]:
                draw(final, f, with_colour=False)
            return hi, True, final
    return len(fibres), False, canvas

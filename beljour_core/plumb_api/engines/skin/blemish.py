"""#26 Blemish and acne healing, with tap-to-heal: blob detection plus a local fill.

1. Measure. Lab of the photo, lightly box-smoothed (radius 1) so camera grain is not taken
   for spots, is compared with the local skin around it: a normalised box mean over the
   visible skin (core regions "skin", eroded by a small margin), recomputed once without
   the first-pass candidates so a spot does not lift its own background.
2. Find spots. Skin pixels redder than their surround (Delta a* >= RED_MIN) and, separately,
   the remaining pixels darker than it (Delta L* <= -DARK_MIN) form 4-connected components,
   so a blemish beside a mole stays a separate spot. Components of at least (IOD/40)^2
   pixels are spots; above (IOD/5)^2 (the size band of arena/marks.py) a spot is a large
   natural mark. A spot is "compact" (round, like a mole or freckle, not a line) when it
   fills at least COMPACT of the disc across its longest side.
3. Sort them. A spot in the size band whose mean redness is at least RED_MIN and at least
   RED_SHARE of its darkening reads as an inflamed blemish and is healed automatically.
   Every other spot is a natural mark (mole, freckle, birthmark, a darker healed mark) and is
   kept (women-first rule 2): it is protected from the fill and never used as a source patch.
4. The person decides. `taps` heal what she marks, a natural mark included: the tapped spot
   is the connected patch of pixels that differ from their surround (Delta E76 >= TAP_MIN)
   nearest the tap, up to (IOD/3)^2 pixels, or a small disc when there is none. `keep` points keep any spot near them,
   blemish or not.
5. Heal. Each hole (spot grown by a size-dependent margin, minus protected marks) is filled
   in its own crop with the existing fill engine: PatchMatch-lite copying real skin texture
   from nearby skin only, or fast marching when no whole source patch fits. Strength blends
   the healed pixels with the original; alpha and every pixel outside the holes are kept.
6. Identity check (local_zones.finish) and a cap on the healed share of the skin.

Thresholds and shares are ASSUMED (drawn faces; no real-face measurement yet). Detection is
photometric, not dermatology: it does not diagnose anything. Mirrored in
web/src/engines/skin/blemish.ts. Local simulation; general cosmetic information, not
medical advice.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections import deque
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.distance import dilate
from ..core.filters import box_mean
from ..fill.fill import fill
from ..fill.patchmatch import patchmatch
from . import local_zones as Z

LABEL = ("Spot healing simulation. Moles, freckles and other natural marks are kept unless you "
         "mark them. " + Z.NOT_MEDICAL)
METHODS = ("patchmatch", "fast-marching")
RED_MIN = 4.0           # Delta a* above the surround (ASSUMED)
DARK_MIN = 3.0          # Delta L* below the surround (ASSUMED)
RED_SHARE = 0.8         # redness must be at least this share of the darkening (ASSUMED)
TAP_MIN = 3.0           # Delta E76 from the surround for a tapped patch (ASSUMED)
BACKGROUND_SHARE = 0.15  # surround radius, share of IOD (ASSUMED)
EDGE_SHARE = 0.04       # skin margin kept clear of eyes, brows, lips and the outline (ASSUMED)
TAP_SHARE = 0.08        # how far from a tap or keep point a spot may be (ASSUMED)
SPOT_SHARE = 0.03       # disc radius when a tap finds no patch (ASSUMED)
COMPACT = 0.45          # area share of the disc across the longest side for a round spot (ASSUMED)
PATCH_RADIUS = 2
ITERATIONS = 5
MAX_HEAL_SHARE = 0.08   # most of the face skin one heal may replace (ASSUMED)
MAX_POINTS = 64


@dataclass(frozen=True)
class Spot:
    pixels: NDArray[np.int64]     # sorted flat indices
    x: float
    y: float
    red: float                    # mean Delta a*
    dark: float                   # mean -Delta L*
    kind: str                     # "blemish" or "mark"
    compact: bool                 # round (mole, freckle), not a line

    @property
    def area(self) -> int:
        return int(len(self.pixels))


@dataclass(frozen=True)
class Measure:
    skin: NDArray[np.bool_]
    area: NDArray[np.bool_]
    delta: NDArray[np.float64]    # H x W x 3, Lab minus local surround
    spots: tuple[Spot, ...]
    iod: float
    min_area: int
    max_area: int
    tap_area: int


def _points(values: object, name: str) -> list[tuple[float, float]]:
    out = []
    for item in values:  # type: ignore[attr-defined]
        if len(item) != 2:
            raise ValueError(f"{name} must be (x, y) pixel points")
        x, y = float(item[0]), float(item[1])
        if not (math.isfinite(x) and math.isfinite(y)):
            raise ValueError(f"{name} must be finite")
        out.append((x, y))
    if len(out) > MAX_POINTS:
        raise ValueError(f"at most {MAX_POINTS} {name}")
    return out


def measure(image: np.ndarray, points: np.ndarray) -> Measure:
    """Spots on the visible skin, sorted into blemishes and natural marks."""
    h, w = image.shape[:2]
    frame = Z.face_frame(points)
    iod = frame.iod
    skin = Z.skin_region(points, h, w)
    area = Z.eroded_skin(skin, max(1.0, EDGE_SHARE * iod))
    lab = box_mean(Z.lab_of(image), 1)
    radius = max(3, Z.half_up(BACKGROUND_SHARE * iod))
    first = Z.local_mean(lab, area, radius)
    d1 = lab - first
    cand = area & ((d1[..., 1] >= RED_MIN) | (d1[..., 0] <= -DARK_MIN))
    clean = area & ~(dilate(cand.astype(np.float32), 1.0) >= 0.5)
    background = Z.local_mean(lab, clean, radius, fallback=first)
    delta = lab - background
    red = area & (delta[..., 1] >= RED_MIN)
    darker = area & (delta[..., 0] <= -DARK_MIN) & ~red
    min_area = max(3, Z.half_up((iod / 40) ** 2))
    max_area = max(min_area, Z.half_up((iod / 5) ** 2))
    flat_a = delta[..., 1].ravel()
    flat_l = delta[..., 0].ravel()
    spots = []
    for pix in sorted(Z.components(red) + Z.components(darker), key=lambda c: int(c[0])):
        if len(pix) < min_area:
            continue
        mean_red = float(sum(flat_a[pix].tolist()) / len(pix))
        dark = float(-sum(flat_l[pix].tolist()) / len(pix))
        blemish = len(pix) <= max_area and mean_red >= RED_MIN and mean_red >= RED_SHARE * max(0.0, dark)
        xs, ys = pix % w, pix // w
        extent = max(int(xs.max() - xs.min()) + 1, int(ys.max() - ys.min()) + 1)
        spots.append(Spot(pix, float(sum(xs.tolist()) / len(pix)) + 0.5, float(sum(ys.tolist()) / len(pix)) + 0.5,
                          mean_red, dark, "blemish" if blemish else "mark",
                          len(pix) >= COMPACT * math.pi * (extent / 2) ** 2))
    return Measure(skin, area, delta, tuple(spots), iod, min_area, max_area, max(max_area, Z.half_up((iod / 3) ** 2)))


def _near(spot: Spot, point: tuple[float, float], width: int, radius: float) -> bool:
    xs, ys = spot.pixels % width + 0.5, spot.pixels // width + 0.5
    d2 = (xs - point[0]) ** 2 + (ys - point[1]) ** 2
    return bool(d2.min() <= radius * radius)


def _tap_patch(m: Measure, tap: tuple[float, float], h: int, w: int) -> tuple[str, NDArray[np.int64]]:
    """(code, flat pixels) for one tap: a connected differing patch, a small disc, or nothing."""
    px, py = math.floor(tap[0]), math.floor(tap[1])
    empty = np.zeros(0, dtype=np.int64)
    if not (0 <= px < w and 0 <= py < h) or not m.area[py, px]:
        return "outside_skin", empty
    reach = max(3.0, TAP_SHARE * m.iod)
    dev = m.delta[..., 0] ** 2 + m.delta[..., 1] ** 2 + m.delta[..., 2] ** 2
    differs = m.area & (dev >= TAP_MIN * TAP_MIN)
    x0, x1 = max(0, math.floor(tap[0] - reach)), min(w - 1, math.ceil(tap[0] + reach))
    y0, y1 = max(0, math.floor(tap[1] - reach)), min(h - 1, math.ceil(tap[1] + reach))
    best, best_d = -1, reach * reach
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if not differs[y, x]:
                continue
            d = (x + 0.5 - tap[0]) ** 2 + (y + 0.5 - tap[1]) ** 2
            if d <= best_d and (best < 0 or d < best_d):
                best, best_d = y * w + x, d
    if best >= 0:
        flat = differs.ravel()
        seen = {best}
        queue = deque([best])
        while queue:
            i = queue.popleft()
            if len(seen) > m.tap_area:
                return "too_large", empty
            x, y = i % w, i // w
            for j, ok in ((i - w, y > 0), (i - 1, x > 0), (i + 1, x < w - 1), (i + w, y < h - 1)):
                if ok and flat[j] and j not in seen:
                    seen.add(j)
                    queue.append(j)
        if len(seen) > m.tap_area:
            return "too_large", empty
        return "healed_mark", np.asarray(sorted(seen), dtype=np.int64)
    r = max(2.0, SPOT_SHARE * m.iod)
    disc = []
    for y in range(max(0, math.floor(tap[1] - r)), min(h - 1, math.ceil(tap[1] + r)) + 1):
        for x in range(max(0, math.floor(tap[0] - r)), min(w - 1, math.ceil(tap[0] + r)) + 1):
            if m.area[y, x] and (x + 0.5 - tap[0]) ** 2 + (y + 0.5 - tap[1]) ** 2 <= r * r:
                disc.append(y * w + x)
    return ("healed_spot", np.asarray(disc, dtype=np.int64)) if disc else ("outside_skin", empty)


def _grow(pixels: NDArray[np.int64], grow: int, h: int, w: int, into: NDArray[np.bool_]) -> None:
    xs, ys = pixels % w, pixels // w
    x0, x1 = max(0, int(xs.min()) - grow - 1), min(w - 1, int(xs.max()) + grow + 1)
    y0, y1 = max(0, int(ys.min()) - grow - 1), min(h - 1, int(ys.max()) + grow + 1)
    crop = np.zeros((y1 - y0 + 1, x1 - x0 + 1), dtype=np.float32)
    crop[ys - y0, xs - x0] = 1
    into[y0:y1 + 1, x0:x1 + 1] |= dilate(crop, float(grow)) >= 0.5


def grow_for(area: int) -> int:
    return max(1, min(6, Z.half_up(0.5 * math.sqrt(area / math.pi)) + 1))


def _heal_crop(work: np.ndarray, pixels: NDArray[np.int64], sources: NDArray[np.bool_],
               method: str, seed: int) -> tuple[str, int]:
    """Fill one hole in place inside its own crop; returns (method used, crop pixels)."""
    h, w = work.shape[:2]
    xs, ys = pixels % w, pixels // w
    m = 2 * PATCH_RADIUS + 2 + math.ceil(math.sqrt(len(pixels)))
    x0, x1 = max(0, int(xs.min()) - m), min(w - 1, int(xs.max()) + m)
    y0, y1 = max(0, int(ys.min()) - m), min(h - 1, int(ys.max()) + m)
    crop = work[y0:y1 + 1, x0:x1 + 1]
    hole = np.zeros(crop.shape[:2], dtype=np.float32)
    hole[ys - y0, xs - x0] = 1
    used = method
    if method == "patchmatch":
        try:
            filled = patchmatch(crop, hole, patch_radius=PATCH_RADIUS, iterations=ITERATIONS, seed=seed,
                                source_mask=sources[y0:y1 + 1, x0:x1 + 1].astype(np.float32)).image
        except ValueError:
            used = "fast-marching"
    if used == "fast-marching":
        filled = fill(crop, hole, "fast-marching").image
    work[ys, xs, :3] = filled[ys - y0, xs - x0, :3]
    return used, int(hole.size)


def heal_blemishes(image: object, landmarks: object, *, strength: float = 100.0, auto: bool = True,
                   taps: Sequence[Sequence[float]] = (), keep: Sequence[Sequence[float]] = (),
                   method: str = "patchmatch", seed: int = 7) -> Z.TouchUpResult:
    """Heal blemishes (auto) and the spots she taps; keep natural marks and her keep points."""
    img = Z.check_photo(image, strength)
    if method not in METHODS:
        raise ValueError(f"method must be one of {', '.join(METHODS)}")
    if isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed < 2 ** 31:
        raise ValueError("seed must be a whole number from 0 to 2^31 - 1")
    tap_points, keep_points = _points(taps, "taps"), _points(keep, "keep points")
    points = Z.mesh_points(landmarks)
    h, w = img.shape[:2]
    code = Z.mesh_refusal(points, h, w)
    if code:
        return Z.unchanged(img, "refused", code, LABEL)
    if strength == 0:
        return Z.unchanged(img, "not_applicable", "zero_strength", LABEL)
    m = measure(img, points)
    if int(m.area.sum()) < Z.MIN_SKIN_PIXELS:
        return Z.unchanged(img, "refused", "no_skin_visible", LABEL)
    reach = max(3.0, TAP_SHARE * m.iod)
    tap_rows: list[dict[str, Any]] = []
    tapped: list[NDArray[np.int64]] = []
    for tap in tap_points:
        tcode, pix = _tap_patch(m, tap, h, w)
        tap_rows.append({"x": tap[0], "y": tap[1], "code": tcode, "pixels": int(len(pix))})
        if len(pix):
            tapped.append(pix)
    tapped_mask = np.zeros(h * w, dtype=bool)
    for pix in tapped:
        tapped_mask[pix] = True
    seeds: list[NDArray[np.int64]] = []
    protect = np.zeros((h, w), dtype=bool)
    exclude = np.zeros((h, w), dtype=bool)
    rows: list[dict[str, Any]] = []
    actions: list[str] = []
    for spot in m.spots:
        exclude.ravel()[spot.pixels] = True
        requested = bool(tapped_mask[spot.pixels].any())
        kept = any(_near(spot, p, w, reach) for p in keep_points)
        if requested:
            action = "healed_by_request"
        elif kept:
            action = "kept_by_request"
        elif spot.kind == "blemish" and auto:
            action = "healed"
            seeds.append(spot.pixels)
        else:
            action = "kept"
        if action.startswith("kept"):
            protect.ravel()[spot.pixels] = True
        actions.append(action)
        rows.append({"x": round(spot.x, 3), "y": round(spot.y, 3), "area": spot.area, "kind": spot.kind,
                     "compact": spot.compact,
                     "red": round(spot.red, 3), "dark": round(spot.dark, 3), "action": action})
    for pix in tapped:
        exclude.ravel()[pix] = True
        protect.ravel()[pix] = False
        seeds.append(pix)
    protect = dilate(protect.astype(np.float32), 1.0) >= 0.5 if protect.any() else protect
    exclude = dilate(exclude.astype(np.float32), 1.0) >= 0.5 if exclude.any() else exclude
    hole = np.zeros((h, w), dtype=bool)
    for pix in seeds:
        _grow(pix, grow_for(len(pix)), h, w, hole)
    for pix in tapped:            # what she marks is healed even where it borders a kept mark
        hole.ravel()[pix] = True
    hole &= ~(protect & ~tapped_mask.reshape(h, w))
    hole &= m.skin
    report: dict[str, Any] = {"spots": rows, "taps": tap_rows, "method": method,
                              "healed_spots": sum(a.startswith("healed") for a in actions),
                              "kept_marks": sum(a.startswith("kept") for a in actions)}
    count = int(hole.sum())
    report["healed_pixels"] = count
    if count == 0:
        return Z.unchanged(img, "not_applicable", "nothing_to_heal", LABEL, report)
    if count > MAX_HEAL_SHARE * int(m.skin.sum()):
        return Z.unchanged(img, "refused", "identity_guard", LABEL, report)
    work = img.copy()
    sources = m.skin & ~exclude & ~hole
    used = []
    for k, pix in enumerate(Z.components(hole)):
        used.append(_heal_crop(work, pix, sources, method, seed + k)[0])
    report["fills"] = used
    s = strength / 100.0
    out = img.copy()
    if s == 1.0:
        out[hole, :3] = work[hole, :3]
    else:
        base = img[hole, :3].astype(np.float64)
        out[hole, :3] = np.clip(np.rint(base + s * (work[hole, :3].astype(np.float64) - base)), 0, 255).astype(np.uint8)
    alpha = np.where(hole, s, 0.0)
    return Z.finish(img, out, alpha, m.skin, LABEL, report)

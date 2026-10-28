"""#27 Fine-line softening: a ridge filter inside landmark zones that softens lines, never erases them.

1. Zones. forehead, glabella, crow's feet and nasolabial folds by default (under-eye on
   request), from local_zones, clipped to the visible skin and feathered.
2. Ridge filter. L* is smoothed with the binomial kernel [1 4 6 4 1]/16 along each axis;
   the Hessian (second differences [1 -2 1], cross term from central differences) gives
   eigenvalues l1 >= l2. A fine line is a long, thin valley: l1 large and l2 near zero.
   Line strength = max(0, l1 - |l2|), so a round spot (l1 close to l2: a mole, a freckle,
   a pore) scores near zero and is left alone. Round spots found by the blemish measure are
   also protected explicitly (women-first rule 2).
3. Soften. Each line pixel moves part of the way toward the mean of the nearby non-line skin
   (a normalised local mean): w = strength/100 x SOFTEN_MAX x zone x ramp(line strength).
   Only pixels darker than their surround move, and never past it, so skin is never lifted
   above its own level. SOFTEN_MAX < 1: at full strength at least 1 - SOFTEN_MAX of every
   line's depth stays ("soften, not erase").
4. Identity check (local_zones.finish).

Thresholds and shares are ASSUMED (drawn faces; real-face tuning not done). This is a local
look simulation, not a treatment preview and not a skin assessment. Mirrored in
web/src/engines/skin/wrinkles.ts. General cosmetic information, not medical advice.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np

from ..core.distance import dilate
from ..core.filters import convolve
from . import local_zones as Z
from .blemish import measure

LABEL = "Line softening simulation. Lines are softened, not erased. " + Z.NOT_MEDICAL
DEFAULT_ZONES = ("forehead", "glabella", "crow_feet", "nasolabial")
SMOOTH = np.array([1.0, 4.0, 6.0, 4.0, 1.0]) / 16.0
SECOND = np.array([1.0, -2.0, 1.0])
CENTRAL = np.array([-0.5, 0.0, 0.5])
SOFTEN_MAX = 0.65       # most of a line's depth one pass removes (ASSUMED; "soften, not erase")
LINE_MIN = 1.0          # line strength (L* per px^2) below which nothing moves (ASSUMED)
LINE_FULL = 3.0         # line strength at which the full weight applies (ASSUMED)
SURROUND_SHARE = 0.08   # surround radius, share of IOD (ASSUMED)
MIN_ZONE_PIXELS = 24


def line_strength(lightness: np.ndarray) -> np.ndarray:
    """max(0, l1 - |l2|) of the Hessian of the binomially smoothed L* plane."""
    smooth = convolve(convolve(lightness, SMOOTH, 0), SMOOTH, 1)
    lxx = convolve(smooth, SECOND, 1)
    lyy = convolve(smooth, SECOND, 0)
    lxy = convolve(convolve(smooth, CENTRAL, 1), CENTRAL, 0)
    half = (lxx - lyy) / 2
    root = np.sqrt(half * half + lxy * lxy)
    mid = (lxx + lyy) / 2
    l1, l2 = mid + root, mid - root
    out: np.ndarray = np.maximum(0.0, l1 - np.abs(l2))
    return out


def soften_lines(image: object, landmarks: object, *, strength: float = 60.0,
                 zones: Sequence[str] = DEFAULT_ZONES) -> Z.TouchUpResult:
    img = Z.check_photo(image, strength)
    names = tuple(zones)
    if not names or any(n not in Z.ZONES for n in names) or len(set(names)) != len(names):
        raise ValueError(f"zones must be distinct names from {', '.join(Z.ZONES)}")
    points = Z.mesh_points(landmarks)
    h, w = img.shape[:2]
    code = Z.mesh_refusal(points, h, w)
    if code:
        return Z.unchanged(img, "refused", code, LABEL)
    if strength == 0:
        return Z.unchanged(img, "not_applicable", "zero_strength", LABEL)
    frame = Z.face_frame(points)
    skin = Z.skin_region(points, h, w)
    zone = Z.zone_mask(points, h, w, names, skin, frame).astype(np.float64)
    inside = zone > 0
    report: dict[str, Any] = {"zones": list(names), "zone_pixels": int(inside.sum())}
    if int(inside.sum()) < MIN_ZONE_PIXELS:
        return Z.unchanged(img, "refused", "zone_not_visible", LABEL, report)
    spots = np.zeros((h, w), dtype=bool)
    for spot in measure(img, points).spots:
        if spot.compact:
            spots.ravel()[spot.pixels] = True
    if spots.any():
        spots = dilate(spots.astype(np.float32), 1.0) >= 0.5
    lab = Z.lab_of(img)
    ridge = line_strength(lab[..., 0])
    ramp = np.clip((ridge - LINE_MIN) / (LINE_FULL - LINE_MIN), 0.0, 1.0)
    ramp = np.where(spots, 0.0, ramp)
    lines = inside & (ramp > 0)
    report["line_pixels"] = int(lines.sum())
    report["protected_spot_pixels"] = int((spots & inside).sum())
    if not lines.any():
        return Z.unchanged(img, "not_applicable", "no_lines_found", LABEL, report)
    radius = max(2, Z.half_up(SURROUND_SHARE * frame.iod))
    calm = skin & (ramp < 0.5) & ~spots
    surround = Z.local_mean(lab, calm, radius)
    gap = surround[..., 0] - lab[..., 0]
    weight = (strength / 100.0) * SOFTEN_MAX * zone * ramp
    weight = np.where(lines & (gap > 0), weight, 0.0)
    moved = weight > 0
    if not moved.any():
        return Z.unchanged(img, "not_applicable", "no_lines_found", LABEL, report)
    revised = lab.copy()
    revised[moved] = lab[moved] + weight[moved, None] * (surround[moved] - lab[moved])
    out = Z.write_lab(img, revised, moved)
    after = Z.lab_of(out)[..., 0]
    depth_before = gap[moved]
    depth_after = surround[moved, 0] - after[moved]
    total_b = 0.0
    total_a = 0.0
    for b, a in zip(depth_before.tolist(), depth_after.tolist(), strict=True):
        total_b += b
        total_a += a
    report["softened_pixels"] = int(moved.sum())
    report["mean_line_depth_before"] = round(total_b / len(depth_before), 4)
    report["mean_line_depth_after"] = round(total_a / len(depth_before), 4)
    return Z.finish(img, out, weight, skin, LABEL, report)

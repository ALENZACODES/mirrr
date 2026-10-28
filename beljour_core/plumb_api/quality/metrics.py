"""Quality checks Q1, Q3, Q4, Q5, Q6, Q9, Q10 and Q12 (plan-r3-final §3), as pure functions.

Every check returns a `Check`: its code, pass/fail, the measured numbers, the rule in
words and the thresholds used. Thresholds default to the plan's values; the ones the
plan marks ASSUMED become frozen in CONTRACTS.md after the spike rounds.

Shared measurement rules (identical in `web/src/quality/metrics.ts`):
  * pixel change: max over R, G, B of |after - before| / 255
  * luma: Y' = 0.2126 R' + 0.7152 G' + 0.0722 B' on sRGB-encoded values / 255
  * gradients: central differences, one-sided on the outer rows and columns
  * dilation: Euclidean disc, from the exact distance transform
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import math
from collections.abc import Callable, Sequence
from dataclasses import asdict, dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..engines.core import colour, pyramid
from ..engines.core.composite import _image, decode
from ..engines.core.distance import dilate
from ..engines.core.filters import gradient_magnitude, quantile
from ..engines.core.masks import as_mask
from ..engines.core.resample import jacobian_determinant

Floats = NDArray[np.float64]

NAMES = {
    "Q1": "Outside-mask invariance",
    "Q3": "Fold-free warp",
    "Q4": "Seam score",
    "Q5": "Determinism and parity",
    "Q6": "Colour accuracy",
    "Q9": "Monotonic strength",
    "Q10": "Texture kept",
    "Q12": "Straight lines kept",
}
PARITY_TOLERANCE = 1 / 255
EDGE_GRADIENT_FLOOR = 2 / 255


@dataclass(frozen=True)
class Check:
    code: str
    passed: bool
    measured: dict[str, Any]
    rule: str
    thresholds: dict[str, float] = field(default_factory=dict)

    @property
    def name(self) -> str:
        return NAMES[self.code]

    def to_json(self) -> dict[str, Any]:
        out = asdict(self)
        out["name"] = self.name
        out["measured"] = {k: _clean(v) for k, v in self.measured.items()}
        return out


def _clean(value: Any) -> Any:
    """JSON-safe numbers: finite floats rounded to 6 places, non-finite as None."""
    if isinstance(value, (bool, np.bool_)):
        return bool(value)
    if isinstance(value, (int, np.integer)):
        return int(value)
    if isinstance(value, (float, np.floating)):
        return round(float(value), 6) if math.isfinite(value) else None
    if isinstance(value, (list, tuple)):
        return [_clean(v) for v in value]
    return value


def _pair(before: np.ndarray, after: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    a, b = _image(before), _image(after)
    if a.shape[:2] != b.shape[:2]:
        raise ValueError("before and after must be the same size")
    return a, b


def pixel_change(before: np.ndarray, after: np.ndarray) -> Floats:
    a, b = _pair(before, after)
    diff = np.abs(a[..., :3].astype(np.int16) - b[..., :3].astype(np.int16))
    return diff.max(axis=2) / 255.0


def luma(image: np.ndarray) -> Floats:
    rgb = _image(image)[..., :3].astype(np.float64) / 255.0
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


# Q1 -----------------------------------------------------------------------------

def q1_outside_mask(before: np.ndarray, after: np.ndarray, edit_mask: np.ndarray, *,
                    dilate_px: float = 8, mean_max: float = 1 / 255,
                    max_max: float = 4 / 255) -> Check:
    """Pixels outside the edit mask (any alpha > 0), dilated by `dilate_px`, must not change."""
    change = pixel_change(before, after)
    region = as_mask(edit_mask, change.shape)
    touched = (region > 0).astype(np.float32)
    grown = dilate(touched, dilate_px) if touched.any() else touched
    outside = grown == 0
    count = int(outside.sum())
    mean = float(change[outside].mean()) if count else 0.0
    peak = float(np.max(change[outside])) if count else 0.0
    return Check("Q1", mean <= mean_max and peak <= max_max,
                 {"mean": mean, "max": peak, "outside_pixels": count,
                  "outside_share": count / change.size},
                 f"outside the mask dilated by {dilate_px:g} px: mean change <= {mean_max * 255:g}/255, "
                 f"max <= {max_max * 255:g}/255",
                 {"dilate_px": dilate_px, "mean_max": mean_max, "max_max": max_max})


# Q3 -----------------------------------------------------------------------------

def q3_fold_free(map_x: np.ndarray, map_y: np.ndarray, *, minimum: float = 0.2) -> Check:
    """The warp's Jacobian determinant stays above `minimum` everywhere."""
    det = jacobian_determinant(map_x, map_y)
    low = float(np.min(det))
    return Check("Q3", low > minimum,
                 {"min_det": low, "folded_share": float((det <= 0).mean()),
                  "below_share": float((det <= minimum).mean())},
                 f"Jacobian determinant > {minimum:g} everywhere", {"minimum": minimum})


# Q4 -----------------------------------------------------------------------------

def mask_edge(mask: np.ndarray, threshold: float = 0.5) -> NDArray[np.bool_]:
    """Pixels whose on/off state (alpha >= threshold) differs from a 4-neighbour."""
    on = as_mask(mask) >= threshold
    edge = np.zeros_like(on)
    horizontal = on[:, 1:] != on[:, :-1]
    vertical = on[1:, :] != on[:-1, :]
    edge[:, 1:] |= horizontal
    edge[:, :-1] |= horizontal
    edge[1:, :] |= vertical
    edge[:-1, :] |= vertical
    return edge


def q4_seam(before: np.ndarray, after: np.ndarray, mask: np.ndarray, *,
            maximum: float = 1.5, percentile: float = 0.9) -> Check:
    """Gradient added along the mask edge, against the photo's own median edge gradient.

    seam = `percentile` quantile, over the edge band (the 0.5 contour grown by 1 px),
    of max(0, |grad after| - |grad before|) on luma. reference = median |grad before|
    over pixels where it is at least 2/255. Pass when seam <= maximum x reference."""
    a, b = _pair(before, after)
    band = mask_edge(mask)
    if band.any():
        band = dilate(band.astype(np.float32), 1) > 0
    g_before = gradient_magnitude(luma(a))
    g_after = gradient_magnitude(luma(b))
    edges = g_before[g_before >= EDGE_GRADIENT_FLOOR]
    reference = quantile(edges, 0.5) if edges.size else EDGE_GRADIENT_FLOOR
    if not band.any():
        return Check("Q4", True, {"seam": 0.0, "reference": reference, "ratio": 0.0, "band_pixels": 0},
                     "no mask edge in the image", {"maximum": maximum, "percentile": percentile})
    excess = np.maximum(0.0, g_after - g_before)[band]
    seam = quantile(excess, percentile)
    ratio = seam / reference
    return Check("Q4", ratio <= maximum,
                 {"seam": seam, "reference": reference, "ratio": ratio, "band_pixels": int(band.sum())},
                 f"added edge gradient (p{percentile * 100:g}) <= {maximum:g} x median edge gradient",
                 {"maximum": maximum, "percentile": percentile})


# Q5 -----------------------------------------------------------------------------

def digest(value: Any) -> str:
    """sha256 of an array's dtype, shape and bytes (or of a JSON-like value's repr)."""
    h = hashlib.sha256()
    if isinstance(value, np.ndarray):
        h.update(str(value.dtype).encode())
        h.update(str(value.shape).encode())
        h.update(np.ascontiguousarray(value).tobytes())
    else:
        h.update(repr(value).encode())
    return h.hexdigest()


def q5_determinism(run: Callable[[], Any], *, runs: int = 2) -> Check:
    """The same call, repeated, gives byte-identical output."""
    if runs < 2:
        raise ValueError("determinism needs at least two runs")
    digests = [digest(run()) for _ in range(runs)]
    same = len(set(digests)) == 1
    return Check("Q5", same, {"runs": runs, "distinct_outputs": len(set(digests)), "sha256": digests[0]},
                 "same input, params and seed give byte-identical output", {"runs": runs})


def max_abs_difference(a: Any, b: Any) -> float:
    """Largest absolute difference between two equally shaped nested numeric values.

    None stands for a non-finite value and only matches another None; booleans and strings
    match only themselves (as in web/src/quality/metrics.ts)."""
    if a is None or b is None:
        return 0.0 if a is None and b is None else math.inf
    if isinstance(a, (list, tuple)) or isinstance(b, (list, tuple)):
        if not isinstance(a, (list, tuple)) or not isinstance(b, (list, tuple)) or len(a) != len(b):
            return math.inf
        return max((max_abs_difference(x, y) for x, y in zip(a, b, strict=True)), default=0.0)
    if isinstance(a, dict) or isinstance(b, dict):
        if not isinstance(a, dict) or not isinstance(b, dict) or a.keys() != b.keys():
            return math.inf
        return max((max_abs_difference(a[k], b[k]) for k in a), default=0.0)
    if isinstance(a, (bool, str)) or isinstance(b, (bool, str)):
        return 0.0 if a == b else math.inf
    return abs(float(a) - float(b))


def q5_parity(expected: Any, actual: Any, *, tolerance: float = PARITY_TOLERANCE) -> Check:
    diff = max_abs_difference(expected, actual)
    return Check("Q5", diff <= tolerance, {"max_abs_difference": diff},
                 f"TypeScript and Python agree within {tolerance * 255:g}/255", {"tolerance": tolerance})


# Q6 -----------------------------------------------------------------------------

def masked_mean_colour(image: np.ndarray, mask: np.ndarray) -> tuple[float, float, float] | None:
    """Mask-weighted mean in linear light, re-encoded to 0..255 sRGB floats."""
    img = _image(image)
    weight = as_mask(mask, img.shape[:2]).astype(np.float64)
    total = float(weight.sum())
    if total <= 0:
        return None
    lin = decode(img)
    mean = (lin * weight[..., None]).sum(axis=(0, 1)) / total
    return tuple(colour.srgb_encode(float(v)) * 255 for v in mean)  # type: ignore[return-value]


def q6_colour_accuracy(image: np.ndarray, mask: np.ndarray, target: str | Sequence[float], *,
                       maximum: float = 3.0) -> Check:
    """CIEDE2000 between the target colour and the rendered mean inside the mask."""
    target_rgb = colour.hex_to_rgb(target) if isinstance(target, str) else tuple(float(v) for v in target)
    mean = masked_mean_colour(image, mask)
    rule = f"CIEDE2000(target, mean in mask) <= {maximum:g}"
    if mean is None:
        return Check("Q6", False, {"delta_e": None, "reason": "empty mask"}, rule, {"maximum": maximum})
    delta = colour.ciede2000(colour.rgb_to_lab(target_rgb), colour.rgb_to_lab(mean))
    return Check("Q6", delta <= maximum,
                 {"delta_e": delta, "mean_rgb": [float(v) for v in mean], "target_rgb": list(target_rgb)},
                 rule, {"maximum": maximum})


# Q9 -----------------------------------------------------------------------------

def effect_strength(before: np.ndarray, after: np.ndarray, mask: np.ndarray | None = None) -> float:
    """Mask-weighted mean CIE76 colour difference between two renders (0 if no weight)."""
    a, b = _pair(before, after)
    diff = np.linalg.norm(colour.srgb_to_lab_array(a[..., :3]) - colour.srgb_to_lab_array(b[..., :3]), axis=-1)
    weight = np.ones(diff.shape) if mask is None else as_mask(mask, diff.shape).astype(np.float64)
    total = float(weight.sum())
    return float((diff * weight).sum() / total) if total > 0 else 0.0


def q9_monotonic(values: Sequence[float], *, min_step: float = 0.0) -> Check:
    """The tool's own effect metric rises strictly across its stops."""
    data = [float(v) for v in values]
    if len(data) < 2 or not all(math.isfinite(v) for v in data):
        raise ValueError("need at least two finite stop values")
    steps = [b - a for a, b in zip(data, data[1:], strict=False)]
    worst = min(steps)
    return Check("Q9", worst > min_step, {"values": data, "smallest_step": worst},
                 f"each stop's effect exceeds the previous by more than {min_step:g}",
                 {"min_step": min_step})


# Q10 ----------------------------------------------------------------------------

def texture_energy(image: np.ndarray, mask: np.ndarray | None = None) -> float:
    """Mask-weighted mean square of luma's finest Laplacian band."""
    detail = pyramid.high_frequency(luma(image))
    weight = np.ones(detail.shape) if mask is None else as_mask(mask, detail.shape).astype(np.float64)
    total = float(weight.sum())
    return float((detail * detail * weight).sum() / total) if total > 0 else 0.0


def q10_texture_kept(before: np.ndarray, after: np.ndarray, skin_mask: np.ndarray, *,
                     minimum: float = 0.60) -> Check:
    """High-frequency energy kept in the skin mask: >= 0.60 at Natural, >= 0.35 at the top stop."""
    _pair(before, after)
    e_before = texture_energy(before, skin_mask)
    e_after = texture_energy(after, skin_mask)
    if e_before <= 1e-12:
        return Check("Q10", True, {"before": e_before, "after": e_after, "ratio": None,
                                   "reason": "no texture in the mask to keep"},
                     f"texture energy ratio >= {minimum:g}", {"minimum": minimum})
    ratio = e_after / e_before
    return Check("Q10", ratio >= minimum, {"before": e_before, "after": e_after, "ratio": ratio},
                 f"texture energy ratio >= {minimum:g}", {"minimum": minimum})


# Q12 ----------------------------------------------------------------------------

def grid_lines(length: int, spacing: int, offset: int, thickness: int = 1) -> list[int]:
    """First row (or column) of each grid line of a synthetic grid along one axis."""
    if spacing < 2 or thickness < 1 or thickness >= spacing or offset < 0:
        raise ValueError("grid needs spacing >= 2, 1 <= thickness < spacing and offset >= 0")
    return list(range(offset, length - thickness + 1, spacing))


def _line_deviation(samples: list[tuple[float, float]]) -> float:
    """Largest distance (along the measured axis) from the least-squares line."""
    n = len(samples)
    mx = sum(s[0] for s in samples) / n
    my = sum(s[1] for s in samples) / n
    sxx = sum((s[0] - mx) ** 2 for s in samples)
    sxy = sum((s[0] - mx) * (s[1] - my) for s in samples)
    slope = sxy / sxx if sxx > 0 else 0.0
    return max(abs(s[1] - (my + slope * (s[0] - mx))) for s in samples)


def q12_straight_lines(after: np.ndarray, band: np.ndarray | None, *, spacing: int, offset: int | None = None,
                       thickness: int = 1, maximum: float = 1.0, min_samples: int = 8) -> Check:
    """Synthetic grid lines outside the body band stay within `maximum` px of straight.

    For every horizontal grid line, each column whose whole window (the line plus
    (spacing - thickness) // 2 px either side) lies outside the band gives one sample: the
    darkness-weighted centre row of the window, with darkness = 1 - luma minus the
    window's lightest value. A least-squares line is fitted to the samples and the largest
    residual is the line's deviation. Vertical lines likewise. Lines with fewer than
    `min_samples` samples are skipped; with no line checked the check fails (no evidence)."""
    img = _image(after)
    h, w = img.shape[:2]
    outside = np.ones((h, w), bool) if band is None else as_mask(band, (h, w)) < 0.5
    dark = 1.0 - luma(img)
    off = spacing // 2 if offset is None else offset
    half = (spacing - thickness) // 2
    worst, worst_line, checked, skipped, total = 0.0, "", 0, 0, 0
    for axis, length, other in (("row", h, w), ("col", w, h)):
        plane = dark if axis == "row" else dark.T
        free = outside if axis == "row" else outside.T
        for start in grid_lines(length, spacing, off, thickness):
            lo, hi = start - half, start + thickness - 1 + half
            if lo < 0 or hi >= length:
                continue
            idx = np.arange(lo, hi + 1, dtype=np.float64)
            samples = []
            for pos in range(other):
                if not free[lo:hi + 1, pos].all():
                    continue
                d = plane[lo:hi + 1, pos]
                d = d - np.min(d)
                total_d = float(d.sum())
                if total_d > 1e-9:
                    samples.append((float(pos), float((idx * d).sum()) / total_d))
            if len(samples) < min_samples:
                skipped += 1
                continue
            checked += 1
            total += len(samples)
            dev = _line_deviation(samples)
            if dev > worst or not worst_line:
                worst, worst_line = max(worst, dev), f"{axis} {start}"
    rule = f"grid lines outside the band within {maximum:g} px of straight"
    thresholds = {"maximum": maximum, "spacing": float(spacing), "min_samples": float(min_samples)}
    if not checked:
        return Check("Q12", False, {"max_deviation": None, "lines_checked": 0, "lines_skipped": skipped,
                                    "samples": 0, "reason": "no grid line outside the band"}, rule, thresholds)
    return Check("Q12", worst <= maximum, {"max_deviation": worst, "lines_checked": checked,
                                           "lines_skipped": skipped, "samples": total, "worst_line": worst_line},
                 rule, thresholds)

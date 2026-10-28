"""LS5 crown reading: brush region, 6-zone grid, scalp/hair split and a density estimate.

Plan §8.4:
* Mask: MediaPipe Hair Segmenter first (pending in the model registry; its card says
  "selfie distance only"), with the always-offered fallback that this module implements:
  the person brushes the area, and inside it our Lab 2-means splits scalp from hair
  (round 1's services/fibre.py prototype, ported here with a stable sort so the
  TypeScript port in web/src/engines/local/fibre.ts gives the same labels).
* Zones: a draggable 6-zone grid over the brushed area (frontal left, centre, right;
  mid; crown; vertex). The cuts are parameters, so the screen can drag them.
* Per zone: scalp share (scalp pixels / zone pixels) and strand-edge density (gradient
  energy times structure-tensor coherence on Lab lightness, i.e. how much oriented
  strand texture the zone shows), mapped to our own 4-level scale.

The level thresholds are ASSUMED until calibrated on released crown photos (decisions Q11).
Copy: "A photo-based estimate. Light and parting change it. Not a diagnosis."
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.colour import srgb_to_lab_array
from ..core.filters import box_mean, gradient
from ..core.masks import as_mask

ZONES = ("frontal_left", "frontal_centre", "frontal_right", "mid", "crown", "vertex")
LEVELS = ("Full", "Light thinning", "Moderate", "Visible scalp")
LEVEL_LIMITS = (0.12, 0.25, 0.45)          # ASSUMED scalp-share cut points, calibrated in LS5
COPY = "A photo-based estimate. Light and parting change it. Not a diagnosis."
TENSOR_RADIUS = 3
Mask = NDArray[np.float32]


def two_means(values: np.ndarray, iters: int = 20) -> tuple[NDArray[np.int64], NDArray[np.float64]]:
    """k-means with k = 2 on (n, d) values; centre 0 is the darker (lower first column).

    Starts from the values at the 20th and 80th percentile positions of a *stable* sort on
    the first column, so ties resolve the same way in every language."""
    vals = np.asarray(values, dtype=np.float64)
    if vals.ndim != 2 or len(vals) < 2:
        raise ValueError("the region needs at least two pixels")
    order = np.argsort(vals[:, 0], kind="stable")
    n = len(order)
    centres = np.stack([vals[order[n // 5]], vals[order[(n * 4) // 5]]]).copy()
    labels = np.zeros(n, dtype=np.int64)
    for it in range(iters):
        d0 = ((vals - centres[0]) ** 2).sum(1)
        d1 = ((vals - centres[1]) ** 2).sum(1)
        new = (d1 < d0).astype(np.int64)
        if it > 0 and np.array_equal(new, labels):
            break
        labels = new
        for k in (0, 1):
            if (labels == k).any():
                centres[k] = vals[labels == k].mean(0)
    if centres[0, 0] > centres[1, 0]:
        centres = centres[::-1].copy()
        labels = 1 - labels
    return labels, centres


@dataclass(frozen=True)
class ZoneGrid:
    """Zone layout over a box (left, top, right, bottom) in pixels.

    `rows` cut the box top to bottom into frontal | mid | crown | vertex; `cols` cut the
    frontal row into left | centre | right. `frontal_at` says whether the frontal row is
    at the top or the bottom of the photo (it depends on how the crown photo was taken)."""
    box: tuple[float, float, float, float]
    rows: tuple[float, float, float] = (0.30, 0.55, 0.80)
    cols: tuple[float, float] = (1 / 3, 2 / 3)
    frontal_at: str = "top"

    def __post_init__(self) -> None:
        left, top, right, bottom = self.box
        if not (np.all(np.isfinite(self.box)) and right - left >= 4 and bottom - top >= 4):
            raise ValueError("zone box must be finite and at least 4 px each way")
        if not (0 < self.rows[0] < self.rows[1] < self.rows[2] < 1):
            raise ValueError("row cuts must rise strictly inside (0, 1)")
        if not (0 < self.cols[0] < self.cols[1] < 1):
            raise ValueError("column cuts must rise strictly inside (0, 1)")
        if self.frontal_at not in ("top", "bottom"):
            raise ValueError("frontal_at must be top or bottom")

    def zone_index(self, height: int, width: int) -> NDArray[np.int64]:
        """Per-pixel zone number 0..5 (ZONES order) inside the box, -1 outside."""
        left, top, right, bottom = self.box
        yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
        u = (xx + 0.5 - left) / (right - left)
        v = (yy + 0.5 - top) / (bottom - top)
        if self.frontal_at == "bottom":
            v = 1.0 - v
        inside = (u >= 0) & (u < 1) & (v >= 0) & (v < 1)
        row = np.searchsorted(np.array(self.rows), v, side="right")
        col = np.searchsorted(np.array(self.cols), u, side="right")
        zone = np.where(row == 0, col, row + 2)
        out: NDArray[np.int64] = np.where(inside, zone, -1).astype(np.int64)
        return out

    def to_json(self) -> dict[str, Any]:
        return {"box": [round(v, 3) for v in self.box], "rows": list(self.rows), "cols": [round(c, 6) for c in self.cols],
                "frontal_at": self.frontal_at}


def grid_for(region: np.ndarray, **kwargs: Any) -> ZoneGrid:
    """A grid over the bounding box of the brushed region (alpha >= 0.5)."""
    on = as_mask(region) >= 0.5
    if not on.any():
        raise ValueError("brush the crown area first")
    ys, xs = np.nonzero(on)
    return ZoneGrid((float(np.min(xs)), float(np.min(ys)), float(np.max(xs) + 1), float(np.max(ys) + 1)), **kwargs)


def level(scalp_share: float) -> str:
    # Three cut points bound the first three labels; the fourth is open-ended.
    for name, limit in zip(LEVELS[:-1], LEVEL_LIMITS, strict=True):
        if scalp_share < limit:
            return name
    return LEVELS[-1]


@dataclass(frozen=True)
class ScalpSplit:
    scalp: NDArray[np.bool_]                 # full-size, False outside the region
    hair: NDArray[np.bool_]
    centres: NDArray[np.float64]             # (hair, scalp) Lab centres
    hair_is_darker: bool

    def classify(self, image: np.ndarray) -> NDArray[np.bool_]:
        """Scalp pixels of another photo of the same size, against the same two centres."""
        lab = srgb_to_lab_array(np.asarray(image)[..., :3])
        d_hair = ((lab - self.centres[0]) ** 2).sum(-1)
        d_scalp = ((lab - self.centres[1]) ** 2).sum(-1)
        out: NDArray[np.bool_] = d_scalp < d_hair
        return out


def split(image: np.ndarray, region: np.ndarray, *, hair_is_darker: bool = True) -> ScalpSplit:
    """Scalp vs hair inside the region by 2-means on Lab; the darker group is hair unless
    `hair_is_darker` is False (very light hair on a darker scalp)."""
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("expected an RGB or RGBA uint8 photo")
    inside = as_mask(region, img.shape[:2]) >= 0.5
    lab = srgb_to_lab_array(img[..., :3])
    labels, centres = two_means(lab[inside])
    hair_label = 0 if hair_is_darker else 1
    hair = np.zeros(inside.shape, bool)
    hair[inside] = labels == hair_label
    scalp = inside & ~hair
    ordered = centres[[hair_label, 1 - hair_label]]
    return ScalpSplit(scalp, hair, ordered, hair_is_darker)


def strand_energy(image: np.ndarray, radius: int = TENSOR_RADIUS) -> NDArray[np.float64]:
    """Gradient magnitude of Lab lightness times structure-tensor coherence, per pixel."""
    lab = srgb_to_lab_array(np.asarray(image)[..., :3])
    gx, gy = gradient(lab[..., 0])
    jxx, jxy, jyy = box_mean(gx * gx, radius), box_mean(gx * gy, radius), box_mean(gy * gy, radius)
    trace = jxx + jyy
    coherence = np.where(trace > 1e-12, np.sqrt((jxx - jyy) ** 2 + 4 * jxy * jxy) / np.maximum(trace, 1e-12), 0.0)
    out: NDArray[np.float64] = np.hypot(gx, gy) * coherence
    return out


@dataclass(frozen=True)
class ZoneReading:
    zone: str
    pixels: int
    scalp_share: float
    strand_density: float
    level: str

    def to_json(self) -> dict[str, Any]:
        return {"zone": self.zone, "pixels": self.pixels, "scalp_share": round(self.scalp_share, 4),
                "strand_density": round(self.strand_density, 4), "level": self.level}


@dataclass(frozen=True)
class CrownReading:
    zones: tuple[ZoneReading, ...]
    overall_scalp_share: float
    split: ScalpSplit = field(repr=False)
    grid: ZoneGrid = field(repr=False)
    copy: str = COPY

    def zone(self, name: str) -> ZoneReading:
        for z in self.zones:
            if z.zone == name:
                return z
        raise KeyError(name)

    def to_json(self) -> dict[str, Any]:
        return {"zones": [z.to_json() for z in self.zones], "overall_scalp_share": round(self.overall_scalp_share, 4),
                "hair_lab": [round(v, 2) for v in self.split.centres[0]],
                "scalp_lab": [round(v, 2) for v in self.split.centres[1]],
                "grid": self.grid.to_json(), "level_limits_assumed": list(LEVEL_LIMITS), "copy": self.copy}


def read(image: np.ndarray, region: np.ndarray, grid: ZoneGrid | None = None, *,
         hair_is_darker: bool = True) -> CrownReading:
    """Scalp share and strand density for each of the six zones inside the brushed region."""
    img = np.asarray(image)
    h, w = img.shape[:2]
    inside = as_mask(region, (h, w)) >= 0.5
    grid = grid or grid_for(region)
    parts = split(img, inside, hair_is_darker=hair_is_darker)
    energy = strand_energy(img)
    index = grid.zone_index(h, w)
    zones = []
    for k, name in enumerate(ZONES):
        sel = inside & (index == k)
        count = int(sel.sum())
        share = float(parts.scalp[sel].mean()) if count else 0.0
        density = float(energy[sel].mean()) if count else 0.0
        zones.append(ZoneReading(name, count, share, density, level(share) if count else "No pixels"))
    total = int(inside.sum())
    overall = float(parts.scalp[inside].mean()) if total else 0.0
    return CrownReading(tuple(zones), overall, parts, grid)


# Coverage map (the plan's fallback if LS5 fails realism): a tinted overlay, not a render.
LEVEL_TINT: dict[str, tuple[int, int, int, int]] = {
    "Full": (0, 0, 0, 0), "Light thinning": (120, 160, 220, 70), "Moderate": (40, 80, 170, 110),
    "Visible scalp": (190, 40, 60, 120), "No pixels": (0, 0, 0, 0)}


def coverage_map(reading: CrownReading, region: np.ndarray) -> NDArray[np.uint8]:
    """RGBA overlay: each zone tinted by its level inside the brushed region."""
    inside = as_mask(region) >= 0.5
    h, w = inside.shape
    index = reading.grid.zone_index(h, w)
    out = np.zeros((h, w, 4), np.uint8)
    for k, z in enumerate(reading.zones):
        out[inside & (index == k)] = LEVEL_TINT[z.level]
    return out

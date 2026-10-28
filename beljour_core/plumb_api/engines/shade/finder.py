"""W6 Foundation Shade Finder with true undertone (women-first feature 101, Top 5 #1).

Pipeline, all local and deterministic:

1. Skin zones: the landmark skin mask (engines/core/regions.py "skin": face oval minus eyes,
   brows and lips; no colour threshold) intersected with two cheek discs and a forehead
   ellipse placed from the irises, mouth corners and brows.
2. Lighting: per-channel gains in linear light from a supplied neutral patch, else grey-world
   on a background mask, else none. Gains keep the estimate's luminance, so normalising never
   brightens skin; gains outside [0.5, 2] are clamped and lower the confidence.
3. Measurement: CIELAB (D65) per pixel, the brightest and darkest tenth by L* trimmed
   (shine and shadow), then the per-channel median for each zone and for all zones.
4. Undertone from the CIELAB hue angle (cool / neutral / warm / olive; olive is first-class),
   depth band 1-10 from L* (ASSUMED bands in thresholds.json, Monk-like, not Monk labels).
5. Match: nearest shade by CIEDE2000 (Sharma 2005, engines/core/colour.py) in our own
   reference table, considering only shades no more than 1 L* lighter than measured. If
   nothing fits, or the confidence is low, it refuses instead of guessing.
6. A two-shade test plan: the best match and the runner-up to swatch side by side.

Our reference shades are made up. Every result says "not tested against real products";
real brand shades come only through YouCam data or brand permission (decisions.md, W6 flags).
Cosmetic language only. Mirrored in web/src/engines/shade/finder.ts (parity/shade-w6.json).
Author: John Khan.
"""
from __future__ import annotations

import json
import math
from collections.abc import Mapping
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from ..core import regions
from ..core.colour import ciede2000
from . import colourspace as cs
from .reading import PatchAudit, audit_patches

LABEL = "Shade estimate from your photo. Not tested against real products."
VERSION = "shade-w6/1"
HERE = Path(__file__).resolve().parent
ZONES = ("cheek_right", "cheek_left", "forehead")
UNDERTONES = ("cool", "neutral", "warm", "olive")


@lru_cache(maxsize=1)
def thresholds() -> dict[str, Any]:
    return dict(json.loads((HERE / "thresholds.json").read_text(encoding="utf-8")))


@lru_cache(maxsize=1)
def reference_table() -> tuple[dict[str, Any], ...]:
    data = json.loads((HERE / "reference_shades.json").read_text(encoding="utf-8"))
    rows = tuple(data["shades"])
    check_table(rows)
    return rows


@lru_cache(maxsize=1)
def extended_reference_table() -> tuple[dict[str, Any], ...]:
    """Legacy 80 references plus new original dark anchors (no brand claims)."""
    data = json.loads((HERE / "deep_reference_shades.json").read_text(encoding="utf-8"))
    if data.get("format") != "beljour-shade-depth-extension/1":
        raise ValueError("Unknown deep reference table format")
    rows = (*reference_table(), *data["shades"])
    check_table(rows)
    return rows


def check_table(rows: Any) -> None:
    if not isinstance(rows, (list, tuple)) or not rows:
        raise ValueError("a shade table needs at least one shade")
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, dict) or not {"id", "name", "lab"} <= set(row):
            raise ValueError("each shade needs id, name and lab")
        lab = row["lab"]
        if (not isinstance(lab, (list, tuple)) or len(lab) != 3
                or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in lab)
                or not 0 <= lab[0] <= 100):
            raise ValueError(f"shade {row.get('id')}: lab must be three finite numbers with L* in 0..100")
        if row["id"] in seen:
            raise ValueError(f"shade {row['id']} is listed twice")
        seen.add(row["id"])


# --- zones --------------------------------------------------------------------------------

def _frame(points: np.ndarray) -> tuple[np.ndarray, np.ndarray, float]:
    right, left = points[468], points[473]
    across = left - right
    iod = float(np.hypot(*across))
    if not math.isfinite(iod) or iod < 4:
        raise ValueError("eyes are too close together to place skin zones")
    across = across / iod
    down = np.array([-across[1], across[0]])
    mouth = (points[61] + points[291]) / 2
    if float(np.dot(mouth - (right + left) / 2, down)) < 0:
        down = -down
    return across, down, iod


def zone_masks(points: object, height: int, width: int) -> dict[str, np.ndarray]:
    """Boolean cheek and forehead zones inside the landmark skin mask (pixel coordinates)."""
    pts = np.asarray(points, dtype=np.float64)
    if pts.ndim != 2 or pts.shape[0] < 478 or pts.shape[1] < 2 or not np.all(np.isfinite(pts[:, :2])):
        raise ValueError("shade zones need 478 finite landmark points in pixels")
    pts = pts[:, :2]
    if min(height, width) < 8:
        raise ValueError("photo is too small to sample skin")
    across, down, iod = _frame(pts)
    skin = regions.region_mask("skin", pts, height, width, normalized=False, supersample=2) >= 0.5
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    out: dict[str, np.ndarray] = {}
    for name, eye, corner, side in (("cheek_right", pts[468], pts[61], -1.0), ("cheek_left", pts[473], pts[291], 1.0)):
        centre = eye + 0.5 * (corner - eye) + side * 0.15 * iod * across
        disc = (xx - centre[0]) ** 2 + (yy - centre[1]) ** 2 <= (0.22 * iod) ** 2
        out[name] = skin & disc
    brows = pts[list(regions.RIGHT_BROW) + list(regions.LEFT_BROW)].mean(axis=0)
    centre = brows - 0.35 * iod * down
    du = (xx - centre[0]) * across[0] + (yy - centre[1]) * across[1]
    dv = (xx - centre[0]) * down[0] + (yy - centre[1]) * down[1]
    out["forehead"] = skin & ((du / (0.4 * iod)) ** 2 + (dv / (0.18 * iod)) ** 2 <= 1.0)
    return out


def zone_pixels(image: object, zones: dict[str, np.ndarray]) -> dict[str, np.ndarray]:
    """Row-major RGB pixels of each zone, as float64 (n, 3)."""
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("shade finder needs a uint8 RGB or RGBA photo")
    return {name: img[..., :3][mask].astype(np.float64) for name, mask in zones.items()}


# --- lighting normalisation ---------------------------------------------------------------

@dataclass(frozen=True)
class WhiteBalance:
    gains: tuple[float, float, float]
    mode: str          # "neutral", "grey_world" or "none"
    clamped: bool

    def to_json(self) -> dict[str, Any]:
        return {"gains": [round(g, 6) for g in self.gains], "mode": self.mode, "clamped": self.clamped}


NO_WHITE = WhiteBalance((1.0, 1.0, 1.0), "none", False)


def white_from_pixels(pixels: object, mode: str) -> WhiteBalance:
    """Gains that make the mean of `pixels` neutral while keeping its luminance."""
    if mode not in ("neutral", "grey_world"):
        raise ValueError("white mode must be neutral or grey_world")
    arr = cs.check_rgb(pixels).reshape(-1, 3)
    if len(arr) < int(thresholds()["minimum_zone_pixels"]):
        return NO_WHITE
    est = cs.decode(arr).mean(axis=0)
    if float(np.min(est)) <= 1e-6:
        return NO_WHITE
    y = float(cs.luminance(est))
    raw = y / est
    lo, hi = thresholds()["gain_limits"]
    clipped = np.clip(raw, lo, hi)
    clamped = bool(np.any(clipped != raw))
    return WhiteBalance((float(clipped[0]), float(clipped[1]), float(clipped[2])), mode, clamped)


def white_balance(image: np.ndarray, *, neutral_mask: object | None = None,
                  background_mask: object | None = None) -> WhiteBalance:
    img = np.asarray(image)[..., :3]
    for mask, mode in ((neutral_mask, "neutral"), (background_mask, "grey_world")):
        if mask is None:
            continue
        m = np.asarray(mask)
        if m.shape != img.shape[:2]:
            raise ValueError(f"{mode} mask must match the photo size")
        found = white_from_pixels(img[m >= 0.5], mode)
        if found.mode != "none":
            return found
    return NO_WHITE


# --- measurement --------------------------------------------------------------------------

def pixels_to_lab(pixels: object, white: WhiteBalance) -> np.ndarray:
    lin = cs.decode(pixels) * np.asarray(white.gains)
    return cs.xyz_to_lab(cs.linear_to_xyz(np.clip(lin, 0.0, 1.0)))


def _median(values: np.ndarray) -> float:
    s = np.sort(values)
    n = len(s)
    mid = n // 2
    return float(s[mid]) if n % 2 else float((s[mid - 1] + s[mid]) / 2)


def trimmed_stats(lab: np.ndarray) -> tuple[np.ndarray, float, int]:
    """Median Lab after trimming the lightest and darkest share by L*; MAD of L*; kept count."""
    n = len(lab)
    if n == 0:
        raise ValueError("no pixels to measure")
    order = np.argsort(lab[:, 0], kind="stable")
    k = int(n * float(thresholds()["trim_share"]))
    kept = lab[order[k:n - k]] if n - 2 * k > 0 else lab
    med = np.array([_median(kept[:, c]) for c in range(3)])
    mad = _median(np.abs(kept[:, 0] - med[0]))
    return med, mad, len(kept)


def undertone_of(lab: object) -> dict[str, Any]:
    L, a, b = (float(v) for v in np.asarray(lab, dtype=np.float64))
    t = thresholds()
    hue = math.degrees(math.atan2(b, a)) % 360.0
    chroma = math.hypot(a, b)
    h = t["undertone_hue_degrees"]
    if hue > 180:          # bluish or magenta skin readings are cool by convention
        name = "cool"
    elif hue < h["cool_below"]:
        name = "cool"
    elif hue < h["neutral_below"]:
        name = "neutral"
    elif hue < h["warm_below"]:
        name = "warm"
    else:
        name = "olive"
    return {"undertone": name, "hue_angle": hue, "chroma": chroma,
            "low_chroma": chroma < float(t["low_chroma"])}


def depth_band(lightness: float) -> int:
    if not math.isfinite(lightness):
        raise ValueError("lightness must be finite")
    for band, edge in enumerate(thresholds()["depth_band_lower_edges"], 1):
        if lightness >= edge:
            return band
    return 10


def match_shades(lab: object, table: Any = None) -> list[dict[str, Any]]:
    """Shades sorted by CIEDE2000, never more than the allowance lighter than measured."""
    rows = reference_table() if table is None else tuple(table)
    if table is not None:
        check_table(rows)
    measured = [float(v) for v in np.asarray(lab, dtype=np.float64)]
    allowance = float(thresholds()["never_lighter_allowance"])
    out = []
    for row in rows:
        lighter_by = float(row["lab"][0]) - measured[0]
        if lighter_by > allowance:
            continue
        out.append({"id": row["id"], "name": row["name"], "lab": [float(v) for v in row["lab"]],
                    "undertone": row.get("undertone"), "depth": row.get("depth"),
                    "delta_e": ciede2000(measured, row["lab"]), "lighter_by": lighter_by})
    out.sort(key=lambda r: (r["delta_e"], r["id"]))
    return out


def _clamp01(v: float) -> float:
    return max(0.0, min(1.0, v))


@dataclass(frozen=True)
class ShadeResult:
    refused: bool
    reason: str | None
    measured_lab: tuple[float, float, float] | None
    undertone: dict[str, Any] | None
    depth_band: int | None
    white: WhiteBalance
    zones: dict[str, dict[str, Any]]
    confidence: dict[str, float]
    best: dict[str, Any] | None
    alternative: dict[str, Any] | None
    test_plan: str | None
    notes: tuple[str, ...] = field(default_factory=tuple)
    label: str = LABEL

    def to_json(self) -> dict[str, Any]:
        return {"format": "beljour-shade-w6/1", "version": VERSION, "label": self.label,
                "refused": self.refused, "reason": self.reason,
                "measured_lab": None if self.measured_lab is None else [round(v, 4) for v in self.measured_lab],
                "undertone": self.undertone, "depth_band": self.depth_band,
                "depth_band_note": "ASSUMED bands from L*, not a Monk label",
                "white": self.white.to_json(), "zones": self.zones,
                "confidence": {k: round(v, 4) for k, v in self.confidence.items()},
                "best": self.best, "alternative": self.alternative, "test_plan": self.test_plan,
                "never_lighter": True, "tested_against_real_products": False, "notes": list(self.notes)}


def _refuse(reason: str, white: WhiteBalance, zones: dict[str, dict[str, Any]],
            confidence: dict[str, float] | None = None, lab: np.ndarray | None = None,
            notes: tuple[str, ...] = ()) -> ShadeResult:
    return ShadeResult(True, reason, None if lab is None else (float(lab[0]), float(lab[1]), float(lab[2])),
                       None if lab is None else undertone_of(lab), None if lab is None else depth_band(float(lab[0])),
                       white, zones, confidence or {"overall": 0.0}, None, None, None, notes)


def find_from_pixels(zone_rgb: Mapping[str, object], white: WhiteBalance = NO_WHITE,
                     table: Any = None) -> ShadeResult:
    """The measurement and match from per-zone RGB pixels (the part the TS mirror shares)."""
    t = thresholds()
    conf_t = t["confidence"]
    zones: dict[str, dict[str, Any]] = {}
    labs: list[np.ndarray] = []
    medians: list[np.ndarray] = []
    for name in ZONES:
        raw = np.asarray(zone_rgb.get(name, np.zeros((0, 3))), dtype=np.float64)
        pixels = cs.check_rgb(raw).reshape(-1, 3) if raw.size else np.zeros((0, 3))
        if len(pixels) < int(t["minimum_zone_pixels"]):
            zones[name] = {"pixels": int(len(pixels)), "lab": None}
            continue
        lab = pixels_to_lab(pixels, white)
        med, _, _ = trimmed_stats(lab)
        zones[name] = {"pixels": int(len(pixels)), "lab": [round(float(v), 4) for v in med]}
        labs.append(lab)
        medians.append(med)
    if len(medians) < 2:
        return _refuse("not enough visible skin in the cheek and forehead zones", white, zones)
    allpix = np.concatenate(labs)
    med, mad, _ = trimmed_stats(allpix)
    spread = max(cs.delta_e(medians[i], medians[j]) for i in range(len(medians)) for j in range(i + 1, len(medians)))
    parts = {
        "pixels": _clamp01(len(allpix) / float(conf_t["pixels_for_full"])),
        "spread": _clamp01(1 - (mad - conf_t["spread_mad_ok"]) / conf_t["spread_mad_span"]),
        "zones_agree": _clamp01(1 - (spread - conf_t["zone_delta_e_ok"]) / conf_t["zone_delta_e_span"]),
        "lighting": float(conf_t["white_clamped"] if white.clamped else conf_t[f"white_{white.mode}"]),
    }
    notes: list[str] = []
    tone = undertone_of(med)
    if tone["low_chroma"]:
        notes.append("Very low colour in the skin reading; the undertone is uncertain.")
        parts["undertone"] = 0.7
    if white.mode == "none":
        notes.append("No neutral reference or background was given, so lighting was not corrected.")
    candidates = match_shades(med, table)
    if not candidates:
        conf = {**parts, "overall": 0.0}
        return _refuse("no shade in our reference table is deep enough; we will not suggest a lighter one",
                       white, zones, conf, med, tuple(notes))
    best = candidates[0]
    parts["match"] = _clamp01(1 - (best["delta_e"] - conf_t["match_delta_e_ok"]) / conf_t["match_delta_e_span"])
    # Independent reliability indicators should not multiply into a false refusal.
    # Geometric aggregation preserves a zero for a failed essential check, while
    # the committed refusal boundary and maximum colour distance remain unchanged.
    # A missing neutral card alone cannot cancel strong cheek/zone measurements.
    scores = tuple(parts.values())
    geometric = (math.exp(sum(math.log(value) for value in scores) / len(scores))
                 if scores and min(scores) > 0 else 0.0)
    # The non-compensating gates still refuse small skin samples, large variance,
    # inconsistent zones or a poor reference match. Lighting alone is not a veto.
    essential = ("pixels", "spread", "zones_agree", "match")
    overall = min(geometric, *(parts[name] for name in essential))
    conf = {**parts, "overall": overall}
    if best["delta_e"] > float(conf_t["refuse_delta_e_above"]):
        return _refuse("the closest reference shade is too far from your skin reading", white, zones, conf, med,
                       tuple(notes))
    if overall < float(conf_t["refuse_below"]):
        return _refuse("the reading is not reliable enough to name a shade; try even daylight and a plain background",
                       white, zones, conf, med, tuple(notes))
    alternative = candidates[1] if len(candidates) > 1 else None
    plan = (f"Swatch {best['name']} and {alternative['name']} side by side on the jawline. "
            "Check them in daylight after 15 minutes; the one that disappears is your shade."
            if alternative else f"Swatch {best['name']} on the jawline and check it in daylight after 15 minutes.")
    return ShadeResult(False, None, (float(med[0]), float(med[1]), float(med[2])), tone, depth_band(float(med[0])),
                       white, zones, conf, best, alternative, plan, tuple(notes))


def find_shade(image: object, points: object, *, neutral_mask: object | None = None,
               background_mask: object | None = None, table: Any = None) -> ShadeResult:
    """W6 on one photo with its 478 landmarks in pixel coordinates."""
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("shade finder needs a uint8 RGB or RGBA photo")
    zones = zone_masks(points, img.shape[0], img.shape[1])
    white = white_balance(img, neutral_mask=neutral_mask, background_mask=background_mask)
    return find_from_pixels(zone_pixels(img, zones), white, table)


def find_reliable_shade(
    image: object, points: object, *, neutral_mask: object | None = None,
    background_mask: object | None = None, table: Any = None,
) -> tuple[ShadeResult, PatchAudit]:
    """Cheek-first W6 reading with an explicit mixed-light refusal.

    Keeps all pre-existing match/confidence thresholds. The result can only be
    more conservative than the historical photo reader in ambiguous lighting.
    """
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("shade finder needs a uint8 RGB or RGBA photo")
    zones = zone_masks(points, img.shape[0], img.shape[1])
    white = white_balance(img, neutral_mask=neutral_mask, background_mask=background_mask)
    conf = thresholds()["confidence"]
    samples, audit = audit_patches(
        img, zones, white.gains, white.mode,
        minimum=int(thresholds()["minimum_zone_pixels"]),
        cheek_limit=float(conf["zone_delta_e_ok"]) + float(conf["zone_delta_e_span"]),
    )
    inventory = extended_reference_table() if table is None else table
    result = find_from_pixels(samples, white, inventory)
    if audit.usable:
        return result, audit
    return ShadeResult(
        refused=True, reason=audit.note, measured_lab=result.measured_lab,
        undertone=result.undertone, depth_band=result.depth_band, white=result.white,
        zones=result.zones, confidence={**result.confidence, "overall": 0.0},
        best=None, alternative=None, test_plan=None,
        notes=(*result.notes, f"Lighting audit: {audit.reason}."),
    ), audit

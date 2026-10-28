"""Hair fibre cover, local only: measure how much scalp shows in a zone, render cover at three
strengths, and match a fibre shade to the hair colour by CIEDE2000.

This is the round 0 prototype the S6 spike runs; the full concealer screen is round 4. It
uses NumPy only, and everything it makes is labelled a local simulation.

How it works:
  1. Inside the zone the person marks, pixels are split into two groups by k-means on CIE
     Lab colour. The darker group is taken as hair and the lighter as scalp. That holds for
     most hair on most scalps; for very light hair on a darker scalp, pass hair_is_darker=False.
  2. Scalp showing = share of zone pixels in the scalp group.
  3. Cover: scalp pixels are repainted towards the fibre colour with strand shaped noise,
     at Light, Medium or Full strength (share of scalp pixels covered).
  4. Shade: the median hair colour is compared with each fibre shade by CIEDE2000; lower is
     closer, and under about 2 is very hard to see.

Fibre shades below are generic and made up. No brands.

Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from ..engines.concealer import CoverSession
from ..engines.concealer.cover import HeadLandmarks, Zone
from .shade import ciede2000, hex_to_lab, rgb_to_hex

LEVELS: dict[str, float] = {"light": 0.35, "medium": 0.6, "full": 0.85}

FIBRE_SHADES: tuple[tuple[str, str, str], ...] = (
    ("FB1", "Black", "#1C1A19"),
    ("FB2", "Dark brown", "#3B2A22"),
    ("FB3", "Medium brown", "#5A4030"),
    ("FB4", "Light brown", "#7D5B43"),
    ("FB5", "Auburn", "#6E3626"),
    ("FB6", "Dark blonde", "#9C7D58"),
    ("FB7", "Light blonde", "#C9A97E"),
    ("FB8", "Grey", "#8E8C89"),
)

_WHITE = np.array([95.047, 100.0, 108.883])
_M = np.array([[0.4124564, 0.3575761, 0.1804375],
               [0.2126729, 0.7151522, 0.0721750],
               [0.0193339, 0.1191920, 0.9503041]])


def rgb_to_lab_array(rgb: np.ndarray) -> np.ndarray:
    """(..., 3) uint8 or float sRGB -> (..., 3) CIE Lab (D65), same maths as shade.rgb_to_lab."""
    c = np.asarray(rgb, dtype=float) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    xyz = lin @ _M.T * 100.0 / _WHITE
    f = np.where(xyz > (6 / 29) ** 3, np.cbrt(xyz), xyz / (3 * (6 / 29) ** 2) + 4 / 29)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def ellipse_mask(height: int, width: int, cx: float, cy: float, rx: float, ry: float) -> np.ndarray:
    """A zone as an ellipse in 0..1 image coordinates."""
    yy, xx = np.mgrid[0:height, 0:width]
    return (((xx / width - cx) / rx) ** 2 + ((yy / height - cy) / ry) ** 2) <= 1.0


def two_means(values: np.ndarray, iters: int = 20) -> tuple[np.ndarray, np.ndarray]:
    """k-means with k = 2 on (n, d) values. Returns (labels, centres), centre 0 the darker
    by the first column (Lab lightness). Deterministic: starts from the 20th and 80th
    percentile of lightness."""
    if len(values) < 2:
        raise ValueError("the zone needs at least two pixels")
    order = np.argsort(values[:, 0])
    centres = np.stack([values[order[len(order) // 5]], values[order[(len(order) * 4) // 5]]]).astype(float)
    labels = np.zeros(len(values), dtype=int)
    for _ in range(iters):
        d = ((values[:, None, :] - centres[None, :, :]) ** 2).sum(-1)
        new = d.argmin(1)
        if np.array_equal(new, labels) and _ > 0:
            break
        labels = new
        for k in (0, 1):
            if (labels == k).any():
                centres[k] = values[labels == k].mean(0)
    if centres[0, 0] > centres[1, 0]:
        centres = centres[::-1].copy()
        labels = 1 - labels
    return labels, centres


@dataclass(frozen=True)
class ZoneReading:
    scalp_share: float
    hair_lab: tuple[float, float, float]
    hair_hex: str
    scalp_lab: tuple[float, float, float]
    pixels: int

    def to_json(self) -> dict:
        return {"scalp_share": round(self.scalp_share, 4), "hair_hex": self.hair_hex,
                "hair_lab": [round(v, 2) for v in self.hair_lab],
                "scalp_lab": [round(v, 2) for v in self.scalp_lab], "pixels": self.pixels}


def _split(lab: np.ndarray, hair_is_darker: bool) -> tuple[np.ndarray, np.ndarray]:
    labels, centres = two_means(lab)
    hair_label = 0 if hair_is_darker else 1
    return labels == hair_label, centres[[hair_label, 1 - hair_label]]


def read_zone(image: np.ndarray, zone: np.ndarray, hair_is_darker: bool = True,
              centres: np.ndarray | None = None) -> tuple[ZoneReading, np.ndarray]:
    """Measure the zone. Returns the reading and the (hair, scalp) Lab centres, so a later
    image (the covered one) can be measured against the same two colours."""
    lab = rgb_to_lab_array(image[..., :3])[zone]
    if centres is None:
        is_hair, centres = _split(lab, hair_is_darker)
    else:
        d = ((lab[:, None, :] - centres[None, :, :]) ** 2).sum(-1)
        is_hair = d.argmin(1) == 0
    rgb = image[..., :3][zone].astype(float)
    hair = lab[is_hair] if is_hair.any() else lab
    scalp = lab[~is_hair] if (~is_hair).any() else lab
    hair_rgb = np.median(rgb[is_hair] if is_hair.any() else rgb, 0)
    hl, ha, hb = (float(v) for v in np.median(hair, 0))
    sl, sa, sb = (float(v) for v in np.median(scalp, 0))
    reading = ZoneReading(
        scalp_share=float((~is_hair).mean()),
        hair_lab=(hl, ha, hb),
        hair_hex=rgb_to_hex((float(hair_rgb[0]), float(hair_rgb[1]), float(hair_rgb[2]))),
        scalp_lab=(sl, sa, sb),
        pixels=int(zone.sum()),
    )
    return reading, centres


def strand_noise(height: int, width: int, seed: int = 7, angle_deg: float = 80.0) -> np.ndarray:
    """0..1 noise stretched along the hair direction, so cover reads as fibres, not paint."""
    rng = np.random.default_rng(seed)
    base = rng.random((height // 2 + 2, width // 8 + 2))
    yy, xx = np.mgrid[0:height, 0:width].astype(float)
    t = np.radians(angle_deg)
    u = (xx * np.cos(t) + yy * np.sin(t)) / 8.0
    v = (-xx * np.sin(t) + yy * np.cos(t)) / 2.0
    u = np.mod(u, base.shape[1] - 1)
    v = np.mod(v, base.shape[0] - 1)
    u0, v0 = u.astype(int), v.astype(int)
    fu, fv = u - u0, v - v0
    n = (base[v0, u0] * (1 - fu) * (1 - fv) + base[v0, u0 + 1] * fu * (1 - fv)
         + base[v0 + 1, u0] * (1 - fu) * fv + base[v0 + 1, u0 + 1] * fu * fv)
    return (n - n.min()) / (np.ptp(n) or 1.0)


def render_cover(image: np.ndarray, zone: np.ndarray, centres: np.ndarray, fibre_hex: str,
                 level: str, seed: int = 7) -> np.ndarray:
    """Repaint the scalp pixels in the zone towards the fibre colour. `level` is light,
    medium or full: the share of scalp pixels covered."""
    if level not in LEVELS:
        raise ValueError(f"level must be one of {', '.join(LEVELS)}")
    share = LEVELS[level]
    img = image[..., :3].astype(float)
    h, w = zone.shape
    lab = rgb_to_lab_array(img)
    d = ((lab[..., None, :] - centres[None, None, :, :]) ** 2).sum(-1)
    scalp = zone & (d.argmin(-1) == 1)
    noise = strand_noise(h, w, seed)
    covered = scalp & (noise < share)
    fibre = np.array([int(fibre_hex[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)
    # fibres catch light unevenly: vary brightness with the same noise
    shade = fibre[None, None, :] * (0.85 + 0.3 * noise[..., None])
    out = img.copy()
    out[covered] = shade[covered]
    return np.clip(out, 0, 255).astype(np.uint8)


def shade_match(hair_lab: tuple[float, float, float], top: int = 3) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = [{"id": sid, "name": name, "hex": hx, "delta_e": round(ciede2000(hair_lab, hex_to_lab(hx)), 2)}
            for sid, name, hx in FIBRE_SHADES]
    rows.sort(key=lambda r: float(r["delta_e"]))
    return rows[:top]


def synthetic_crown(height: int = 640, width: int = 640, seed: int = 3,
                    hair: tuple[int, int, int] = (58, 42, 33), scalp: tuple[int, int, int] = (214, 170, 146),
                    thin_zone: tuple[float, float, float, float] = (0.5, 0.45, 0.22, 0.2)) -> np.ndarray:
    """A drawn crown (not a person): dense strands everywhere, thinning inside an ellipse.
    For tests and the S6 spike until real, consented crown photos are recorded."""
    rng = np.random.default_rng(seed)
    noise = strand_noise(height, width, seed)
    cx, cy, rx, ry = thin_zone
    yy, xx = np.mgrid[0:height, 0:width]
    r = np.sqrt(((xx / width - cx) / rx) ** 2 + ((yy / height - cy) / ry) ** 2)
    density = np.clip(0.35 + 0.55 * r, 0.35, 0.95)     # thinnest at the centre of the zone
    is_hair = noise < density
    img = np.where(is_hair[..., None], np.array(hair, float), np.array(scalp, float))
    img += rng.normal(0, 4, img.shape)
    return np.clip(img, 0, 255).astype(np.uint8)


def local_cover_level(image: np.ndarray, hair_region: np.ndarray, scalp_show: np.ndarray,
                      *, landmarks: object | None, level: float = 3.0,
                      zone: Zone = "crown", session: CoverSession | None = None) -> object:
    """Public legacy-service bridge to the approved mask-only cover engine.

    New callers should import CoverSession through engines.concealer. This bridge
    keeps the old spike functions unchanged and never touches the YouCam gateway.
    """
    engine = session if isinstance(session, CoverSession) else CoverSession()
    if zone not in ("crown", "parting", "hairline"):
        raise ValueError("Unknown topical fibre zone")
    checked = landmarks if isinstance(landmarks, HeadLandmarks) else None
    return engine.render(image, hair_region, scalp_show, landmarks=checked, level=level, zone=zone)

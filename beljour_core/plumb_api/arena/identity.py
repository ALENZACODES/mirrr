"""Identity score without a face-recognition model: geometry + texture + skin colour.

Why no embedding model: Identity Lock needs one cleared for commercial use in code, weights
AND training data. SFace and the ArcFace family are trained on MS1M / VGGFace2 / CASIA-WebFace
and are not allowed; the face-recognition models trained on synthetic faces trace back to
generators trained on FFHQ (CC BY-NC-SA) or to pretrained recognisers, and their weights are
mostly non-commercial (docs/QUALITY_ARENA.md §5). So the score is built from parts we can use:

* geometry: distances between landmarks the filter must not move, in units of the
  inter-ocular distance (IOD), compared before and after (the plan's Q7 idea),
* texture: uniform local binary pattern histograms per face zone, chi-square compared,
* colour: CIEDE2000 between mean skin colours (skin tone is identity; it also catches
  unrequested lightening).

It answers "did the edit change this face too much?", not "is this the same person?". It
can't tell two different people with similar proportions apart, and pose or expression
changes move it. Weights and scales are ASSUMED until the box measures them. Face-mapping inspiration: MediaPipe Face Landmarker (mesh topology, data), Ojala Pietikainen and Maenpaa local binary
patterns (texture codes, from the paper) and Farkas anthropometry (IOD-scaled distances); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..engines.core import regions
from ..engines.core.colour import ciede2000, srgb_to_lab_array
from ..engines.proportions import anatomy

Floats = NDArray[np.float64]
L = anatomy.LANDMARKS

# Landmarks each hero filter must leave where they are. Age warps the jaw, jowls and brows;
# the gender recipe moves jaw, chin, brows, cheekbones, nose and lips a little, so only the
# eye frame and nose bridge are protected there.
PROTECTED: Mapping[str, tuple[int, ...]] = {
    "old": (L["right_eye_outer"], L["right_eye_inner"], L["left_eye_inner"], L["left_eye_outer"], L["right_pupil"],
            L["left_pupil"], L["nasion"], L["nose_tip"], L["subnasale"], L["right_ala"], L["left_ala"]),
    "young": (L["right_eye_outer"], L["right_eye_inner"], L["left_eye_inner"], L["left_eye_outer"], L["right_pupil"],
              L["left_pupil"], L["nasion"], L["nose_tip"], L["subnasale"], L["right_ala"], L["left_ala"],
              L["right_mouth"], L["left_mouth"]),
    "gender_swap": (L["right_eye_outer"], L["right_eye_inner"], L["left_eye_inner"], L["left_eye_outer"],
                    L["right_pupil"], L["left_pupil"], L["nasion"]),
}
DEFAULT_PROTECTED = PROTECTED["young"]
GEOMETRY_TAU = 0.03   # 3% of IOD rms change -> similarity exp(-1); ASSUMED
TEXTURE_KAPPA = 0.25  # chi-square scale; ASSUMED
COLOUR_SCALE = 8.0    # Delta E 8 -> similarity exp(-1); ASSUMED
WEIGHTS = {"geometry": 0.5, "texture": 0.3, "colour": 0.2}
LOCK_THRESHOLD = 6.0  # Identity Lock target on the 1-10 scale; ASSUMED until set on real faces


def iod(points: np.ndarray) -> float:
    pts = np.asarray(points, dtype=np.float64)
    if pts.shape[0] > L["left_pupil"]:
        return float(np.linalg.norm(pts[L["left_pupil"], :2] - pts[L["right_pupil"], :2]))
    return float(np.linalg.norm(pts[L["left_eye_outer"], :2] - pts[L["right_eye_outer"], :2]))


def signature(points: np.ndarray, ids: Sequence[int] = DEFAULT_PROTECTED) -> Floats:
    """Every pairwise distance among `ids`, divided by IOD."""
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    scale = iod(pts)
    if not scale > 0:
        raise ValueError("pupils must be apart")
    chosen = pts[list(ids)]
    diff = chosen[:, None, :] - chosen[None, :, :]
    dist = np.sqrt((diff ** 2).sum(-1))
    upper = np.triu_indices(len(ids), 1)
    return dist[upper] / scale


def geometry_similarity(before: np.ndarray, after: np.ndarray, filter_name: str | None = None) -> float:
    ids = PROTECTED.get(filter_name or "", DEFAULT_PROTECTED)
    a, b = signature(before, ids), signature(after, ids)
    rms = float(np.sqrt(np.mean((a - b) ** 2)))
    return math.exp(-rms / GEOMETRY_TAU)


def lbp(gray: np.ndarray) -> NDArray[np.uint8]:
    """8-neighbour local binary pattern codes (radius 1), border pixels 0."""
    g = np.asarray(gray, dtype=np.float64)
    out = np.zeros(g.shape, dtype=np.uint8)
    if min(g.shape) < 3:
        return out
    c = g[1:-1, 1:-1]
    offsets = ((-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1))
    code = np.zeros(c.shape, dtype=np.uint8)
    for bit, (dy, dx) in enumerate(offsets):
        neigh = g[1 + dy:g.shape[0] - 1 + dy, 1 + dx:g.shape[1] - 1 + dx]
        code |= ((neigh >= c).astype(np.uint8) << bit)
    out[1:-1, 1:-1] = code
    return out


def _uniform_table() -> NDArray[np.int64]:
    """Map the 256 codes to 59 bins: 58 uniform patterns (<= 2 transitions) + one bin for the rest."""
    table = np.full(256, 58, dtype=np.int64)
    k = 0
    for code in range(256):
        bits = [(code >> i) & 1 for i in range(8)]
        transitions = sum(bits[i] != bits[(i + 1) % 8] for i in range(8))
        if transitions <= 2:
            table[code] = k
            k += 1
    return table


UNIFORM = _uniform_table()


def lbp_histogram(gray: np.ndarray, mask: np.ndarray) -> Floats | None:
    inside = np.asarray(mask, dtype=np.float64) >= 0.5
    inside[[0, -1], :] = False
    inside[:, [0, -1]] = False
    if inside.sum() < 64:
        return None
    codes = UNIFORM[lbp(gray)[inside]]
    hist = np.bincount(codes, minlength=59).astype(np.float64)
    return hist / hist.sum()


def chi_square(a: Floats, b: Floats) -> float:
    s = a + b
    keep = s > 0
    return float(0.5 * (((a - b) ** 2)[keep] / s[keep]).sum())


def zones(points: np.ndarray, shape: tuple[int, int]) -> dict[str, NDArray[np.float32]]:
    """Face zones for texture comparison, from the landmark mesh."""
    h, w = shape
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    skin = regions.region_mask("skin", pts, h, w, normalized=False, supersample=2)
    scale = iod(pts)
    yy, xx = np.mgrid[0:h, 0:w]
    out = {"skin": skin}
    centres = {
        "forehead": (pts[L["brow_mid"]] + (pts[L["brow_mid"]] - pts[L["nasion"]]) * 1.2, 0.45),
        "right_cheek": ((pts[L["right_eye_outer"]] + pts[L["right_mouth"]]) / 2, 0.32),
        "left_cheek": ((pts[L["left_eye_outer"]] + pts[L["left_mouth"]]) / 2, 0.32),
        "nose": ((pts[L["nasion"]] + pts[L["nose_tip"]]) / 2, 0.22),
        "chin": ((pts[L["chin"]] + pts[L["lower_lip_bottom"]]) / 2, 0.25),
    }
    for name, (centre, r) in centres.items():
        disc = ((xx - centre[0]) ** 2 + (yy - centre[1]) ** 2) <= (r * scale) ** 2
        out[name] = skin * disc
    return out


def central_zones(shape: tuple[int, int]) -> dict[str, Floats]:
    """Fallback zones when no landmarks are known: a centred face ellipse (the frozen faces
    are face-centred crops). Coarser; flagged in the score's notes."""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy = w / 2, h * 0.52
    ellipse = (((xx - cx) / (0.30 * w)) ** 2 + ((yy - cy) / (0.38 * h)) ** 2) <= 1.0
    upper = ellipse & (yy < cy - 0.12 * h)
    lower = ellipse & (yy > cy + 0.08 * h)
    middle = ellipse & ~upper & ~lower
    return {"skin": ellipse.astype(np.float64), "upper": upper.astype(np.float64),
            "middle": middle.astype(np.float64), "lower": lower.astype(np.float64)}


def texture_similarity(before: np.ndarray, after: np.ndarray, zone_masks: Mapping[str, np.ndarray]) -> float | None:
    gb, ga = _gray(before), _gray(after)
    dists = []
    for name, mask in zone_masks.items():
        if name == "skin":
            continue
        hb, ha = lbp_histogram(gb, mask), lbp_histogram(ga, mask)
        if hb is not None and ha is not None:
            dists.append(chi_square(hb, ha))
    if not dists:
        return None
    return math.exp(-float(np.mean(dists)) / TEXTURE_KAPPA)


def _gray(image: np.ndarray) -> Floats:
    rgb = image[..., :3].astype(np.float64)
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def mean_lab(image: np.ndarray, mask: np.ndarray) -> tuple[float, float, float] | None:
    inside = np.asarray(mask, dtype=np.float64) >= 0.5
    if inside.sum() < 16:
        return None
    lab = srgb_to_lab_array(image[..., :3][inside].astype(np.float64))
    return tuple(float(v) for v in np.median(lab, axis=0))  # type: ignore[return-value]


def colour_similarity(before: np.ndarray, after: np.ndarray, skin: np.ndarray) -> tuple[float | None, float | None]:
    lb, la = mean_lab(before, skin), mean_lab(after, skin)
    if lb is None or la is None:
        return None, None
    de = float(ciede2000(lb, la))
    return math.exp(-de / COLOUR_SCALE), de


@dataclass(frozen=True)
class IdentityScore:
    score: float                 # 1..10
    geometry: float | None       # 0..1 similarities
    texture: float | None
    colour: float | None
    delta_e: float | None
    used_landmarks: bool

    def to_json(self) -> dict:
        r = lambda v: None if v is None else round(float(v), 4)  # noqa: E731
        return {"score": round(self.score, 3), "geometry": r(self.geometry), "texture": r(self.texture),
                "colour": r(self.colour), "delta_e": r(self.delta_e), "used_landmarks": self.used_landmarks}


def identity_score(before: np.ndarray, after: np.ndarray, *, points_before: np.ndarray | None = None,
                   points_after: np.ndarray | None = None, filter_name: str | None = None) -> IdentityScore:
    """1-10: 10 means nothing the identity proxy can see has changed."""
    if before.shape != after.shape:
        raise ValueError("identity needs images of the same size")
    shape = before.shape[:2]
    have_points = points_before is not None
    zone_masks = zones(points_before, shape) if points_before is not None else central_zones(shape)
    geo = None
    if points_before is not None and points_after is not None:
        geo = geometry_similarity(points_before, points_after, filter_name)
    tex = texture_similarity(before, after, zone_masks)
    col, de = colour_similarity(before, after, zone_masks["skin"])
    parts = {"geometry": geo, "texture": tex, "colour": col}
    weight = sum(WEIGHTS[k] for k, v in parts.items() if v is not None)
    sim = sum(WEIGHTS[k] * v for k, v in parts.items() if v is not None) / weight if weight else 0.0
    return IdentityScore(1.0 + 9.0 * sim, geo, tex, col, de, have_points)

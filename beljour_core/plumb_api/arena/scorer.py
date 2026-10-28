"""Six-dimension scores for one edited image, from automated proxies, with their limits.

Every proxy here is a measurement of pixels, not a judgement of beauty or realism. They are
used for Best-of-N, the proxy judge and early warnings; the ship gates read human scores.
What each proxy measures, and what it can't see:

identity       identity.py (landmark geometry + LBP texture + skin colour). Can't verify a
               person; moved by pose and expression; blind to identity changes the zones miss.
realism        noise / grain consistency inside the face against the original, fine-texture
               energy kept (Q10 idea) and skin hue shift. Can't tell a well-drawn wrinkle
               from a fake one, or judge lighting and anatomy.
artifact_free  change outside the face (warped background, ears, glasses), added edge
               gradient along the face outline (Q4), new clipped pixels. Misses artifacts
               inside the face that look smooth, such as a melted eyelid.
flattering     no automated proxy. People only. Always None here.
fairness       not a per-image score: results.py computes it from the spread across slices.
still_her      ASSUMED stand-in from the brief: identity plus freckle and mole retention,
               lowered when skin was lightened or the face slimmed without being asked.
               Real Still Her scores come from women judges on women's photos.

Scores are 1-10. Mappings from measurements to scores are ASSUMED. Face-mapping inspiration: MediaPipe Face Landmarker (mesh topology, data) and He Sun and Tang guided filter (fine-band
texture energy); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..engines.core import pyramid
from ..engines.core.distance import dilate
from ..quality.metrics import q4_seam, texture_energy
from . import constants as C
from . import marks as M
from .identity import IdentityScore, central_zones, identity_score, iod, mean_lab, zones

Floats = NDArray[np.float64]
# Unrequested-change rules (women-first brief rule 8). Thresholds ASSUMED.
LIGHTEN_DL = 2.5          # skin L* rise beyond the background's rise
SLIM_SHARE = 0.015        # face width / IOD shrinking by more than 1.5%
MARKS_KEPT_MIN = 0.7      # share of freckles and moles that must survive
# Filters whose request is itself a lighter skin or a narrower face are listed here, so the
# check doesn't flag the thing she asked for. Gender swap reshapes the jaw by design, so it is
# exempt from the slimming check only; OLD and YOUNG are not exempt from anything.
LIGHTEN_REQUESTED: frozenset[str] = frozenset({"tan_remove", "brighten_requested"})
SLIM_REQUESTED: frozenset[str] = frozenset({"face_slim", "weight_loss_sim", "gender_swap"})


@dataclass
class ImageScores:
    identity: float | None
    realism: float | None
    artifact_free: float | None
    flattering: float | None
    still_her: float | None
    details: dict[str, Any] = field(default_factory=dict)
    flags: list[str] = field(default_factory=list)

    def get(self, dim: str) -> float | None:
        return getattr(self, dim) if dim in C.DIMENSIONS and dim != "fairness" else None

    def to_json(self) -> dict[str, Any]:
        r = lambda v: None if v is None else round(float(v), 3)  # noqa: E731
        return {"scores": {d: r(self.get(d)) for d in C.DIMENSIONS if d != "fairness"}, "flags": list(self.flags),
                "details": self.details}


def _to01(score: float) -> float:
    return (score - 1.0) / 9.0


def _score(x01: float) -> float:
    return 1.0 + 9.0 * min(1.0, max(0.0, x01))


def noise_sigma(image: np.ndarray, mask: np.ndarray) -> float:
    """Robust grain estimate: median absolute value of the finest band / 0.6745, in 0-255 luma."""
    y = M.luma(image)
    band = pyramid.high_frequency(y)
    inside = np.asarray(mask, dtype=np.float64) >= 0.5
    if inside.sum() < 32:
        return 0.0
    return float(np.median(np.abs(band[inside])) / 0.6745)


def realism_parts(before: np.ndarray, after: np.ndarray, skin: np.ndarray) -> dict[str, float | None]:
    s_b, s_a = noise_sigma(before, skin), noise_sigma(after, skin)
    grain = None if s_b < 0.05 else s_a / s_b
    e_b, e_a = texture_energy(before, skin), texture_energy(after, skin)
    kept = None if e_b <= 1e-9 else e_a / e_b
    lb, la = mean_lab(before, skin), mean_lab(after, skin)
    hue_shift = None if lb is None or la is None else math.hypot(la[1] - lb[1], la[2] - lb[2])
    return {"grain_ratio": grain, "texture_kept": kept, "hue_shift": hue_shift}


def realism_score(parts: Mapping[str, float | None]) -> float | None:
    subs = []
    grain = parts.get("grain_ratio")
    if grain is not None:
        subs.append(math.exp(-abs(math.log(max(grain, 1e-3))) / 0.5))
    kept = parts.get("texture_kept")
    if kept is not None:
        subs.append(min(1.0, kept / 0.6) if kept < 1 else math.exp(-(kept - 1) / 1.5))
    hue_shift = parts.get("hue_shift")
    if hue_shift is not None:
        subs.append(math.exp(-hue_shift / 6.0))
    return _score(sum(subs) / len(subs)) if subs else None


def artifact_parts(before: np.ndarray, after: np.ndarray, face: np.ndarray) -> dict[str, float]:
    h, w = before.shape[:2]
    grown = dilate((np.asarray(face) >= 0.5).astype(np.float32), max(4.0, 0.04 * max(h, w))) > 0
    outside = ~grown
    diff = np.abs(after.astype(np.float64) - before.astype(np.float64)).mean(axis=-1)
    outside_change = float(diff[outside].mean()) if outside.any() else 0.0
    seam = q4_seam(before, after, face).measured.get("ratio", 0.0) or 0.0

    def clipped(img: np.ndarray) -> float:
        return float(((img <= 1) | (img >= 254)).all(axis=-1).mean())

    return {"outside_change": outside_change, "seam_ratio": float(seam),
            "clip_increase": max(0.0, clipped(after) - clipped(before))}


def artifact_score(parts: Mapping[str, float]) -> float:
    subs = [math.exp(-parts["outside_change"] / 2.0),           # mean change of 2/255 outside the face -> e^-1
            1.0 if parts["seam_ratio"] <= 1.5 else math.exp(-(parts["seam_ratio"] - 1.5) / 1.0),
            math.exp(-parts["clip_increase"] / 0.01)]
    return _score(min(subs) * 0.6 + (sum(subs) / len(subs)) * 0.4)


# Mirrored face-outline landmark pairs from cheekbone height down to the lower jaw (MediaPipe
# face mesh topology), so narrowing the jaw counts as slimming, not just the cheeks.
WIDTH_PAIRS = ((234, 454), (132, 361), (58, 288), (172, 397), (136, 365))


def face_width_share(points: np.ndarray) -> float:
    """Mean face width at five heights, cheekbone to lower jaw, in units of IOD."""
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    widths = [float(np.linalg.norm(pts[a] - pts[b])) for a, b in WIDTH_PAIRS]
    return float(np.mean(widths)) / iod(pts)


def skin_shift(before: np.ndarray, after: np.ndarray, skin: np.ndarray) -> tuple[float | None, float | None]:
    """Median skin L* change and the background's (everything 6 px or more outside the skin).
    The browser's Still you tag (web/src/layout/still-you.ts) mirrors this; parity/still-you-qa.json."""
    lb, la = mean_lab(before, skin), mean_lab(after, skin)
    background = 1.0 - (dilate((np.asarray(skin) >= 0.5).astype(np.float32), 6.0) > 0)
    bb, ba = mean_lab(before, background), mean_lab(after, background)
    skin_dl = None if lb is None or la is None else la[0] - lb[0]
    background_dl = None if bb is None or ba is None else ba[0] - bb[0]
    return skin_dl, background_dl


def lightened(skin_dl: float | None, background_dl: float | None) -> bool:
    return skin_dl is not None and skin_dl - max(0.0, background_dl or 0.0) > LIGHTEN_DL


def unrequested_changes(before: np.ndarray, after: np.ndarray, skin: np.ndarray, *, points_before: np.ndarray | None,
                        points_after: np.ndarray | None, retained: M.Retention, filter_name: str) -> tuple[list[str], dict]:
    """Women-first rule 8: skin lightened, face slimmed, marks erased - when she didn't ask."""
    flags: list[str] = []
    info: dict[str, Any] = {}
    rise, bg_rise = skin_shift(before, after, skin)
    if rise is not None:
        info["skin_dl"] = round(rise, 3)
        info["background_dl"] = None if bg_rise is None else round(bg_rise, 3)
        if lightened(rise, bg_rise) and filter_name not in LIGHTEN_REQUESTED:
            flags.append("skin lightened")
    if points_before is not None and points_after is not None:
        change = face_width_share(points_after) / face_width_share(points_before) - 1.0
        info["face_width_change"] = round(change, 4)
        if change < -SLIM_SHARE and filter_name not in SLIM_REQUESTED:
            flags.append("face slimmed")
    if retained.share is not None:
        info["marks_found"], info["marks_kept"] = retained.found, retained.kept
        if retained.found >= 3 and retained.share < MARKS_KEPT_MIN:
            flags.append("marks erased")
    return flags, info


def effect_size(before: np.ndarray, after: np.ndarray, face: np.ndarray) -> float:
    inside = np.asarray(face, dtype=np.float64) >= 0.5
    if not inside.any():
        return 0.0
    return float(np.abs(after.astype(np.float64) - before.astype(np.float64)).mean(axis=-1)[inside].mean())


def score_image(before: np.ndarray, after: np.ndarray, filter_name: str, *, points_before: np.ndarray | None = None,
                points_after: np.ndarray | None = None, original_marks: list[M.Mark] | None = None,
                whole_photo: bool = False) -> ImageScores:
    """All per-image proxies. `points_after` are the landmarks of the edited face (the warp
    target or a re-detection); without them geometry and face-slimming checks are skipped.
    `whole_photo` is for edits meant to change the whole picture (enhance, filters): change
    outside the face is then the point of the edit, not an artifact, and isn't counted."""
    if before.shape != after.shape or before.dtype != np.uint8 or after.dtype != np.uint8:
        raise ValueError("score_image needs two uint8 images of one size")
    shape = before.shape[:2]
    zone = zones(points_before, shape) if points_before is not None else central_zones(shape)
    skin = zone["skin"]
    ident: IdentityScore = identity_score(before, after, points_before=points_before, points_after=points_after,
                                          filter_name=filter_name)
    real_parts = realism_parts(before, after, skin)
    art_parts = artifact_parts(before, after, skin)
    if whole_photo:
        art_parts["outside_change"] = 0.0
    scale = iod(points_before) if points_before is not None else 0.33 * shape[1]
    if original_marks is None:
        original_marks = M.find_marks(before, skin, scale)
    moved = M.displaced(original_marks, points_before, points_after)
    kept = M.retention(moved, after, scale)
    flags, info = unrequested_changes(before, after, skin, points_before=points_before, points_after=points_after,
                                      retained=kept, filter_name=filter_name)
    marks01 = kept.share if kept.share is not None and kept.found >= 3 else None
    still = _to01(ident.score) if marks01 is None else 0.6 * _to01(ident.score) + 0.4 * marks01
    still -= 0.25 * sum(1 for f in flags if f in ("skin lightened", "face slimmed"))
    details = {"identity": ident.to_json(), "realism": real_parts, "artifacts": art_parts, "unrequested": info,
               "effect": round(effect_size(before, after, skin), 3), "landmarks": points_before is not None}
    return ImageScores(identity=ident.score, realism=realism_score(real_parts), artifact_free=artifact_score(art_parts),
                       flattering=None, still_her=_score(still), details=details, flags=flags)


PROXY_WEIGHTS = {"identity": 0.3, "realism": 0.25, "artifact_free": 0.25, "still_her": 0.2}


def overall(scores: ImageScores) -> float:
    """One number for ranking candidates (Best-of-N, proxy judge). Never shown as a score."""
    total = weight = 0.0
    for dim, w in PROXY_WEIGHTS.items():
        value = scores.get(dim)
        if value is not None:
            total += w * value
            weight += w
    return total / weight if weight else 0.0


# Effect sizes (mean face-pixel change, 0-255) below or above which a result reads as too weak
# or too strong for each hero filter. ASSUMED starting values; the kill-list will move them.
EFFECT_BAND = {"old": (2.0, 22.0), "young": (1.0, 14.0), "gender_swap": (1.0, 18.0)}


def judged_quality(scores: ImageScores, filter_name: str) -> float:
    """What the proxy judge compares: proxy quality, minus one point when the effect is too
    small to see or past the filter's band. Without this an untouched photo would always win,
    since it is identical to the reference."""
    value = overall(scores)
    effect = float(scores.details.get("effect", 0.0))
    low, high = EFFECT_BAND.get(filter_name, (1.0, 20.0))
    if effect < low or effect > high:
        value -= 1.0
    return value


def likely_reason(scores: ImageScores, filter_name: str) -> str:
    """The fixed loser reason that best matches the weakest proxy."""
    if "marks erased" in scores.flags or "skin lightened" in scores.flags or "face slimmed" in scores.flags:
        return "Not Her / Erased Marks"
    if scores.artifact_free is not None and scores.artifact_free < 5:
        return "Warped Glasses/Ears/Background"
    effect = float(scores.details.get("effect", 0.0))
    low, high = EFFECT_BAND.get(filter_name, (1.0, 20.0))
    if effect < low:
        return "Too Weak"
    candidates = {"identity": scores.identity, "realism": scores.realism, "artifact_free": scores.artifact_free}
    present = {k: v for k, v in candidates.items() if v is not None}
    if effect > high and (not present or min(present.values()) >= 5):
        return "Too Strong"
    if not present:
        return "Uncanny/Scary"
    worst = min(present, key=lambda k: present[k])
    if worst == "identity":
        return "Lost Identity"
    if worst == "artifact_free":
        return "Warped Glasses/Ears/Background"
    grain = scores.details.get("realism", {}).get("grain_ratio")
    return "Plastic Skin" if grain is not None and grain < 1 else "Uncanny/Scary"


def as_judge_scores(scores: ImageScores) -> dict[str, float]:
    """The per-side scores a model judge reports (Flattering left out: no proxy exists)."""
    out = {}
    for dim in ("identity", "realism", "artifact_free", "still_her"):
        value = scores.get(dim)
        if value is not None:
            out[dim] = round(min(10.0, max(1.0, value)), 2)
    return out

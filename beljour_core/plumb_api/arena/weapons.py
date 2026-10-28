"""The four quality weapons as pipeline stages (master command v1, "Quality weapons").

    Adaptive Strength -> [ Generate -> Identity Lock -> Texture Graft ] x N -> Best-of-N

1. Adaptive Strength reads the face (skin lightness, light level, existing fine lines,
   glasses-like edges round the eyes, beard-like texture, head turn) and sets a starting
   strength and per-layer settings, with the reasons written down.
2. Identity Lock re-renders at lower strength until the identity score (identity.py) reaches
   the threshold. For parametric engines that is better than blending pixels back: a pixel
   blend of a warped and an unwarped face leaves double edges. If the engine can't re-render,
   it blends toward the geometry-aligned original instead.
3. Texture Graft is frequency separation: the finest band of the aligned original (pores,
   grain) is put back wherever the edit lost it, and the original's freckles and moles are
   restored. Added detail (an older look's lines) is kept, because only lost detail returns.
4. Best-of-N renders N = 4 candidates (strengths spread evenly from 0.8x to 1.15x the planned
   strength, capped at 1; seeds from one seeded generator), scores each with the automated
   proxies and keeps the best. The automated proxies favour doing less, so the ranking also
   charges for straying from the planned strength and for an effect too small to see, and
   refuses any candidate the lock pushed far below what was asked.

Thresholds and rules are ASSUMED starting values; the kill-list loop moves them, one reason
at a time. Face-mapping inspiration: MediaPipe Face Landmarker (mesh topology, data) and He Sun and Tang guided filter (frequency
separation); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import math
import random
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..engines.core import pyramid
from ..engines.core.filters import box_mean
from . import identity as I
from . import marks as M
from . import scorer
from .producers import Edit

U8 = NDArray[np.uint8]
Floats = NDArray[np.float64]
Renderer = Callable[[float, int], Edit]  # (strength 0..1, seed) -> Edit

BEST_OF_N = 4
SPREAD_LOW, SPREAD_HIGH = 0.8, 1.15
FIDELITY_WEIGHT = 1.0   # rank points lost per unit of |log(strength / planned)|; ASSUMED
WEAK_PENALTY = 1.0      # rank points lost when the effect is below the filter's visible band; ASSUMED
LOCK_STEPS = 6          # bisection steps on strength
WEAK_FLOOR = 0.6        # a candidate locked below 60% of its asked strength is refused
GRAFT_AMOUNT = {"old": 0.8, "young": 0.7, "gender_swap": 0.9}


# --- 1. Adaptive Strength ---------------------------------------------------------------

@dataclass
class FaceReading:
    skin_l: float           # median skin L* (0-100)
    face_light: float       # median face luma (0-255)
    clipped: float          # share of face pixels at 0 or 255
    line_energy: float      # mid-band energy in the skin, per unit of luma (existing fine lines)
    eye_edges: float        # edge density round the eyes against the cheeks (glasses-like)
    beard_texture: float    # dark texture in the lower face against the cheeks (beard-like)
    yaw: float              # nose-tip offset from the eye midline, in IOD


def read_face(image: U8, points: Floats) -> FaceReading:
    h, w = image.shape[:2]
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    zone = I.zones(pts, (h, w))
    skin = zone["skin"] >= 0.5
    y = M.luma(image)
    lab = I.mean_lab(image, zone["skin"]) or (50.0, 0.0, 0.0)
    face_vals = y[skin] if skin.any() else y.ravel()
    mid = box_mean(y, max(1, round(I.iod(pts) / 40))) - box_mean(y, max(2, round(I.iod(pts) / 10)))
    line = float(np.mean(mid[skin] ** 2)) / max(float(np.mean(face_vals)), 1.0) if skin.any() else 0.0
    grad = np.hypot(*np.gradient(y))
    scale = I.iod(pts)
    yy, xx = np.mgrid[0:h, 0:w]

    def disc(cx: float, cy: float, r: float) -> NDArray[np.bool_]:
        return ((xx - cx) ** 2 + (yy - cy) ** 2) <= r * r

    L = I.L
    right_x, right_y = pts[L["right_pupil"]]
    left_x, left_y = pts[L["left_pupil"]]
    eyes = disc(right_x, right_y, 0.55 * scale) | disc(left_x, left_y, 0.55 * scale)
    eye_ring = eyes & ~(disc(right_x, right_y, 0.3 * scale) | disc(left_x, left_y, 0.3 * scale))
    cheeks = (zone["right_cheek"] >= 0.5) | (zone["left_cheek"] >= 0.5)
    cheek_grad = float(grad[cheeks].mean()) if cheeks.any() else 1.0
    lower = (zone["chin"] >= 0.5)
    lower_dark = float((y[lower] < np.median(face_vals) * 0.8).mean()) if lower.any() else 0.0
    eye_mid = (pts[L["right_pupil"]] + pts[L["left_pupil"]]) / 2
    return FaceReading(
        skin_l=float(lab[0]), face_light=float(np.median(face_vals)),
        clipped=float(((image[skin] <= 1) | (image[skin] >= 254)).all(axis=-1).mean()) if skin.any() else 0.0,
        line_energy=line, eye_edges=float(grad[eye_ring].mean()) / max(cheek_grad, 1e-6) if eye_ring.any() else 0.0,
        beard_texture=lower_dark, yaw=float((pts[L["nose_tip"]][0] - eye_mid[0]) / scale))


@dataclass
class Plan:
    strength: float
    overrides: dict[str, Any]
    reasons: list[str] = field(default_factory=list)


def adaptive_strength(filter_name: str, reading: FaceReading, requested: float = 1.0) -> Plan:
    """Starting strength and settings for this face. Every rule is ASSUMED and named."""
    s = requested
    reasons: list[str] = []
    layers: dict[str, float] = {}
    regions: dict[str, float] = {}
    if reading.face_light < 60 or reading.clipped > 0.05:
        s *= 0.85
        reasons.append("low light or clipped face: drawn detail shows up as fake, strength x0.85")
    if abs(reading.yaw) > 0.25:
        s *= 0.75
        reasons.append("head turned: one-sided warps look wrong, strength x0.75")
    glasses = reading.eye_edges > 2.2
    if filter_name in ("old", "young"):
        if glasses:
            layers["brows_lids"] = 0.4
            reasons.append("strong edges round the eyes (glasses?): brow and lid layer 0.4")
        if filter_name == "old":
            # creases are drawn as a fixed darkening; on dark skin the same amount reads as
            # a painted line, so lines and spots scale with skin lightness
            tone = min(1.0, max(0.55, reading.skin_l / 65.0))
            if tone < 1.0:
                layers["lines"] = round(tone, 3)
                layers["spots"] = round(tone, 3)
                reasons.append(f"darker skin (L* {reading.skin_l:.0f}): lines and spots x{tone:.2f}")
            if reading.line_energy > 0.6:
                s *= 0.8
                reasons.append("lines already visible: strength x0.8")
        else:
            if reading.line_energy < 0.15:
                s *= 0.6
                reasons.append("little fine texture to soften: strength x0.6 (avoids plastic skin)")
            if reading.beard_texture > 0.35:
                layers["lips"] = 0.5
                reasons.append("beard-like lower face: lip layer 0.5")
    elif filter_name == "gender_swap":
        if glasses:
            regions["eyes"] = 0.5
            regions["brows"] = 0.6
            reasons.append("strong edges round the eyes (glasses?): eye 0.5, brow 0.6")
        if reading.beard_texture > 0.35:
            reasons.append("beard-like lower face: a local geometry edit can't remove a beard (kept)")
    return Plan(round(min(1.0, max(0.05, s)), 4), {"layers": layers, "regions": regions}, reasons)


# --- 2. Identity Lock -------------------------------------------------------------------

@dataclass
class LockResult:
    edit: Edit
    score: float
    locked: bool          # True if strength had to come down
    strength: float
    method: str           # "none" | "re-render" | "blend"
    met: bool = True      # False when even the weakest edit stays under the threshold


def identity_lock(original: U8, points: Floats, render: Renderer, strength: float, seed: int, filter_name: str,
                  *, threshold: float = I.LOCK_THRESHOLD, can_rerender: bool = True) -> LockResult:
    def score(edit: Edit) -> float:
        return I.identity_score(original, edit.image, points_before=points, points_after=edit.points_after,
                                filter_name=filter_name).score

    first = render(strength, seed)
    s0 = score(first)
    if s0 >= threshold:
        return LockResult(first, s0, False, strength, "none")
    if can_rerender:
        lo, hi = 0.0, strength
        best = None
        for _ in range(LOCK_STEPS):
            mid = (lo + hi) / 2
            edit = render(mid, seed)
            sc = score(edit)
            if sc >= threshold:
                best = (edit, sc, mid)
                lo = mid
            else:
                hi = mid
        if best is None:
            edit = render(0.0, seed)
            sc = score(edit)
            return LockResult(edit, sc, True, 0.0, "re-render", sc >= threshold)
        return LockResult(best[0], best[1], True, best[2], "re-render")
    lo, hi = 0.0, 1.0  # blend weight toward the aligned original
    best_img = first.aligned
    for _ in range(LOCK_STEPS):
        mid = (lo + hi) / 2
        mixed = np.clip(np.rint(first.image * (1 - mid) + first.aligned * mid), 0, 255).astype(np.uint8)
        edit = Edit(mixed, first.aligned, first.points_after, first.strength * (1 - mid), first.metrics)
        if score(edit) >= threshold:
            best_img, hi = mixed, mid
        else:
            lo = mid
    # A blend can't undo geometry (the landmarks stay where the warp put them), so for a
    # geometry-only edit the threshold may be out of reach; `met` says so.
    edit = Edit(best_img, first.aligned, first.points_after, first.strength * (1 - hi), first.metrics)
    sc = score(edit)
    return LockResult(edit, sc, True, edit.strength, "blend", sc >= threshold)


# --- 3. Texture Graft -------------------------------------------------------------------

def fine_band(image: np.ndarray) -> Floats:
    rgb = image[..., :3].astype(np.float64)
    return np.stack([pyramid.high_frequency(rgb[..., c]) for c in range(3)], axis=-1)


def texture_graft(edited: U8, aligned: U8, skin: np.ndarray, *, amount: float = 0.8,
                  protect: np.ndarray | None = None) -> tuple[U8, dict[str, float]]:
    """Put the aligned original's finest detail back where the edit lost it, inside the skin,
    and restore protected marks (freckles, moles) from the aligned original."""
    if not 0.0 <= amount <= 1.0:
        raise ValueError("amount is 0..1")
    hf_e, hf_o = fine_band(edited), fine_band(aligned)
    energy_e = np.sqrt((hf_e ** 2).sum(-1))
    energy_o = np.sqrt((hf_o ** 2).sum(-1))
    lost = np.clip(1.0 - energy_e / np.maximum(energy_o, 1e-6), 0.0, 1.0)
    weight = amount * lost * np.clip(np.asarray(skin, dtype=np.float64), 0, 1)
    out = edited.astype(np.float64) + weight[..., None] * (hf_o - hf_e)
    restored_marks = 0.0
    if protect is not None:
        p = np.clip(np.asarray(protect, dtype=np.float64), 0, 1) * np.clip(np.asarray(skin, dtype=np.float64), 0, 1)
        # restore the mark's darkness relative to its surround, not its absolute colour, so an
        # older or warmer skin keeps its new tone around the mark
        dark_o = box_mean(M.luma(aligned), 3) - M.luma(aligned)
        dark_e = box_mean(M.luma(out.clip(0, 255)), 3) - M.luma(out.clip(0, 255))
        missing = np.clip(dark_o - dark_e, 0, None) * p
        out -= missing[..., None]
        restored_marks = float(missing.sum())
    result = np.clip(np.rint(out), 0, 255).astype(np.uint8)
    return result, {"grafted_share": float((weight > 0.05).mean()), "mean_weight": float(weight.mean()),
                    "mark_restore": round(restored_marks, 2)}


# --- 4. Best-of-N, and the pipeline -----------------------------------------------------

@dataclass
class Candidate:
    strength: float
    seed: int
    edit: Edit
    lock: LockResult
    graft: dict[str, float]
    scores: scorer.ImageScores
    rank_score: float
    refused: str = ""


@dataclass
class PipelineResult:
    best: Candidate
    candidates: list[Candidate]
    plan: Plan

    def trace(self) -> dict[str, Any]:
        return {"plan": {"strength": self.plan.strength, "overrides": self.plan.overrides, "reasons": self.plan.reasons},
                "candidates": [{"strength": round(c.strength, 4), "seed": c.seed, "locked": c.lock.locked,
                                "lock_strength": round(c.lock.strength, 4), "identity": round(c.lock.score, 3),
                                "rank": round(c.rank_score, 3), "refused": c.refused, "graft": c.graft,
                                "flags": c.scores.flags} for c in self.candidates],
                "chosen": self.candidates.index(self.best)}


def run_pipeline(original: U8, points: Floats, filter_name: str, make_renderer: Callable[[dict[str, Any]], Renderer], *,
                 seed: int, requested: float = 1.0, n: int = BEST_OF_N, threshold: float = I.LOCK_THRESHOLD,
                 graft: bool = True, lock: bool = True, adaptive: bool = True) -> PipelineResult:
    """The full chain for one face and filter. `make_renderer(overrides)` returns a function
    (strength, seed) -> Edit for the engine with Adaptive Strength's overrides applied."""
    plan = adaptive_strength(filter_name, read_face(original, points), requested) if adaptive \
        else Plan(requested, {"layers": {}, "regions": {}}, ["adaptive strength off"])
    render = make_renderer(plan.overrides)
    rng = random.Random(seed)
    skin = I.zones(points, original.shape[:2])["skin"]
    found = M.find_marks(original, skin, I.iod(points))
    candidates: list[Candidate] = []
    for s in candidate_strengths(plan.strength, n):
        cand_seed = rng.randrange(1, 2 ** 31)
        if lock:
            locked = identity_lock(original, points, render, s, cand_seed, filter_name, threshold=threshold)
        else:
            e = render(s, cand_seed)
            locked = LockResult(e, I.identity_score(original, e.image, points_before=points, points_after=e.points_after,
                                                    filter_name=filter_name).score, False, s, "none")
        edit = locked.edit
        info: dict[str, float] = {}
        image = edit.image
        if graft:
            moved = M.displaced(found, points, edit.points_after)
            protect = M.mark_mask(moved, original.shape[:2])
            moved_skin = I.zones(edit.points_after, original.shape[:2])["skin"]
            image, info = texture_graft(edit.image, edit.aligned, moved_skin,
                                        amount=GRAFT_AMOUNT.get(filter_name, 0.8), protect=protect)
            edit = Edit(image, edit.aligned, edit.points_after, edit.strength, edit.metrics)
        scores = scorer.score_image(original, image, filter_name, points_before=points, points_after=edit.points_after,
                                    original_marks=found)
        refused = ""
        if s > 0 and locked.strength < WEAK_FLOOR * s:
            refused = f"locked down to {locked.strength / s:.0%} of the asked strength"
        elif not locked.met:
            refused = "identity stays under the lock threshold"
        candidates.append(Candidate(s, cand_seed, edit, locked, info, scores,
                                    rank(scores, filter_name, locked.strength, plan.strength), refused))
    usable = [c for c in candidates if not c.refused] or candidates
    best = max(usable, key=lambda c: c.rank_score)
    return PipelineResult(best, candidates, plan)


def candidate_strengths(planned: float, n: int = BEST_OF_N) -> list[float]:
    """n strengths spread evenly over [0.8, 1.15] x planned, capped to 0..1."""
    if n < 1:
        raise ValueError("Best-of-N needs at least one candidate")
    low = min(1.0, max(0.02, planned * SPREAD_LOW))
    high = min(1.0, max(low, planned * SPREAD_HIGH))
    if n == 1:
        return [min(1.0, planned)]
    return [round(low + (high - low) * i / (n - 1), 4) for i in range(n)]


def rank(scores: scorer.ImageScores, filter_name: str, used: float, planned: float) -> float:
    """Proxy quality, minus a charge for straying from the plan and for an invisible effect."""
    value = scorer.overall(scores)
    value -= FIDELITY_WEIGHT * abs(math.log(max(used, 1e-3) / max(planned, 1e-3)))
    low, _ = scorer.EFFECT_BAND.get(filter_name, (1.0, 20.0))
    if float(scores.details.get("effect", 0.0)) < low:
        value -= WEAK_PENALTY
    return value

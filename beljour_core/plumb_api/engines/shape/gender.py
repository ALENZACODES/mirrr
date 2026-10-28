"""LS2 masculine/feminine visual geometry recipes: Normal, Extra and Hyper.

Seven stops, continuous interpolation, nine independent regions and 12%-IOD hard cap.
External styling is metadata only: hair and makeup must run through the single YouCam
adapter in a later orchestration round, never from this offline visual spike.
Face-mapping inspiration: FLAME (independent identity, expression and pose parameters),
DECA (parametric geometry), 3DDFA_V2 (dense mesh) and OpenFace (feature localization).
concept only, no code copied. MediaPipe indices come from R4/R5 canonical tables.
This is a stylized photo simulation, not a claim about sex or gender identity.
Author: John Khan.
"""
from __future__ import annotations

import json
import math
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from ..core import regions
from ..proportions import anatomy
from ..warp.mesh import MeshLayout
from ..warp.regularize import regularize_targets
from .geometry import Frame, check_face, frame, target_mesh
from .turn_field import regularise_targets

RECIPE = json.loads(Path(__file__).with_name("gender.json").read_text(encoding="utf-8"))
STOPS = (-100, -66, -33, 0, 33, 66, 100)
SCOPE = ("face_only", "full_look", "keep_my_hair")
REGIONS = ("jaw", "chin", "brows", "brow_ridge", "cheekbones", "nose", "lips", "eyes", "forehead")
LABEL = "Masculine/feminine appearance simulation, not a measure of identity or sex."
VERSION = "gender-p0-r13/1"
IDENTITY_PINS = (168, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477)


def parameters(slider: float) -> dict[str, float]:
    if not isinstance(slider, (float, int)) or isinstance(slider, bool) or not math.isfinite(slider) or not -100 <= slider <= 100:
        raise ValueError("gender slider must be -100..100")
    data = RECIPE["masculine" if slider > 0 else "feminine"]
    value = abs(slider)
    stops = RECIPE["stops"]
    i = next((k for k in range(1, len(stops)) if value <= stops[k]), len(stops) - 1)
    start, end = stops[i - 1], stops[i]
    t = (value - start) / (end - start)
    return {name: float(row[i - 1] * (1 - t) + row[i] * t) for name, row in data.items()}


def recipe_targets(face: object, slider: float, *, region_strengths: Mapping[str, float] | None = None,
                   scope: str = "face_only") -> tuple[np.ndarray, dict[str, object]]:
    return _recipe_targets(face, slider, region_strengths=region_strengths, scope=scope)


def _recipe_targets(face: object, slider: float, *, region_strengths: Mapping[str, float] | None = None,
                    scope: str = "face_only",
                    base_cache: dict[tuple[float, ...], np.ndarray] | None = None,
                    prepared: tuple[np.ndarray, dict[str, float], Frame] | None = None) -> tuple[np.ndarray, dict[str, object]]:
    if prepared is None:
        src = check_face(face)
        par = parameters(slider)
        f = frame(src)
    else:
        src, par, f = prepared
    if scope not in SCOPE:
        raise ValueError("invalid scope")
    factors = {name: 1.0 for name in REGIONS}
    for name, value in (region_strengths or {}).items():
        if name not in factors or not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value) or not 0 <= value <= 1.5:
            raise ValueError("unknown gender region or factor outside 0..1.5")
        factors[name] = float(value)
    # Reuse E08's shape controls for chin/jaw/cheeks. Additional nuanced features below
    # are scheduled for their E08 controls at R16 but functional here for LS2 geometry.
    shape_values = {
        "chin_width": max(-100, min(100, par["chin_width_pct"] * 4.5 * factors["chin"])),
        "chin_length": max(-100, min(100, par["chin_height_fh"] * 11 * factors["chin"])),
        "cheek_fullness": max(-100, min(100, par["cheek_width_iod"] * 13 * factors["cheekbones"])),
        "forehead_height": max(-100, min(100, par["forehead_height_fh"] * 13 * factors["forehead"])),
    }
    shape_key = tuple(shape_values.values())
    if base_cache is not None and shape_key in base_cache:
        base = base_cache[shape_key]
    else:
        base = target_mesh(src, shape_values, spread=0.12)
        if base_cache is not None:
            base_cache[shape_key] = base
    delta = base - src
    pairs = anatomy.region_pairs()
    face_width = float(np.linalg.norm(src[234] - src[454]))
    nose_width = float(np.linalg.norm(src[129] - src[358]))
    eyes_right = list(regions.RIGHT_EYE)
    eyes_left = list(regions.LEFT_EYE)
    brow_right = list(regions.RIGHT_BROW)
    brow_left = list(regions.LEFT_BROW)

    def add(ids: list[int] | tuple[int, ...], x: float, y: float, strength: float = 1.0) -> None:
        vec = (x * f.axis_across + y * f.axis_down) * strength
        for j in ids:
            delta[j] += vec

    # Jaw is applied once in its authored full-width units. The older recipe also
    # included E08 jaw width in `base`, doubling this contribution before capping.
    for i in regions.FACE_OVAL:
        u, v = f.uv(src[i])
        if v > 0.55:
            falloff = math.exp(-0.5 * ((v - 0.71) / 0.19) ** 2)
            add((i,), (1 if u > 0 else -1) * face_width * par["jaw_width_fw"] / 200 * factors["jaw"] * falloff, 0)
    # Brows: height and arch; brow ridge shading is a deferred light effect, not a geometry call.
    for indices in (brow_right, brow_left):
        for k, idx in enumerate(indices):
            arch = math.sin(math.pi * k / (len(indices) - 1))
            add((idx,), 0, -(par["brow_height_iod"] + par["brow_arch_iod"] * arch) / 100 * f.iod, factors["brows"])
    # Nose width, bridge and tip from landmarks and the already-registered nose pairs.
    for a, b in pairs["nose"]:
        for idx in (a, b):
            u, v = f.uv(src[idx])
            band = par["nose_width_pct"] if v > 0.59 else par["bridge_width_pct"]
            add((idx,), (1 if u > 0 else -1) * nose_width * band / 200, 0, factors["nose"])
    add((anatomy.LANDMARKS["nose_tip"],), 0, -par["tip_lift_iod"] / 100 * f.iod, factors["nose"])
    # Lips: axial thickness about the mouth line, plus corner separation.
    lip_line = (src[13] + src[14]) / 2
    for idx in regions.LIPS_OUTER:
        local_y = float(np.dot(src[idx] - lip_line, f.axis_down))
        add((idx,), 0, local_y * par["lip_height_pct"] / 100, factors["lips"])
    for idx in (61, 291):
        u, _ = f.uv(src[idx])
        add((idx,), (1 if u > 0 else -1) * f.iod * par["mouth_width_iod"] / 100, 0, factors["lips"])
    # Eyes: enlarge vertical aperture, protect iris centres, lift outer corners.
    for indices in (eyes_right, eyes_left):
        eye_centre = src[indices].mean(axis=0)
        for idx in indices:
            local_y = float(np.dot(src[idx] - eye_centre, f.axis_down))
            add((idx,), 0, local_y * par["eye_opening_pct"] / 100, factors["eyes"])
        corner = indices[0]
        add((corner,), 0, -f.iod * math.sin(math.radians(par["eye_outer_tilt_deg"])) * 0.45, factors["eyes"])
    # Face length: masculine chin length cue, separate from chin-height change.
    for i in regions.FACE_OVAL:
        _, v = f.uv(src[i])
        if v > 0.74:
            add((i,), 0, f.length * par["face_length_fh"] / 100 * ((v - 0.74) / 0.26), factors["chin"])
    for i in (152, 175):
        add((i,), 0, f.length * par["face_length_fh"] / 100, factors["chin"])
    # Preserve the physical safety cap across simultaneous regions; note that at Hyper
    # some numeric requested bands cannot fit, so the report must say "capped".
    mag = np.linalg.norm(delta, axis=1)
    scale = np.minimum(1.0, f.iod * 0.12 / np.maximum(mag, 1e-12))
    safety = regularize_targets(src, src + delta * scale[:, None], reference_scale=f.iod,
                                pinned=IDENTITY_PINS)
    # R13: the same strain rule for both directions: every landmark's move relative
    # to its neighbours stays within 35% of its shortest adjacent edge, with Taubin
    # smoothing where that cap binds. Identity pins stay exact.
    strain = regularise_targets(src, safety.points, f.iod, pinned=IDENTITY_PINS,
                                smooth_strained_only=True)
    out = strain.points
    max_pct = float(np.max(np.linalg.norm(out - src, axis=1)) / f.iod * 100)
    return out, {"slider": slider, "stop": "Original" if slider == 0 else
                 ("Normal" if abs(slider) == 33 else "Extra" if abs(slider) == 66 else "Hyper" if abs(slider) == 100 else "Custom"),
                 "scope": scope, "styling_pending": scope != "face_only", "regions": factors,
                 "requested_bands": par, "max_iod_percent": max_pct,
                 "capped_landmarks": max(int((scale < 1).sum()), safety.capped_landmarks),
                 "target_safety": safety.to_json(),
                 "strain": strain.to_json(),
                 "direction": "original" if slider == 0 else "masculine" if slider > 0 else "feminine",
                 "simulation": LABEL,
                 "validated_on_released_photos": False}


# R13 P0 parity: the image-aware product path. Both directions run exactly the same
# checks and the same per-region bisection; nothing here depends on the direction.
SILHOUETTE_REGIONS = ("jaw", "chin", "cheekbones", "forehead")
SEAM_LIMIT = 1.5            # Q4 maximum, unchanged
SEAM_MARGIN = 0.95          # the engine aims below 95% of the Q4 limit
TRIANGLE_RATIO_MIN = 0.35   # per-triangle area ratio ("Jacobian 0.35") in [0.35, 1/0.35]
REGION_BISECTIONS = 4


@dataclass(frozen=True)
class _Evaluation:
    targets: np.ndarray
    info: dict[str, object]
    image: np.ndarray
    failed: list[str]
    seam_ratio: float
    triangle_min: float
    triangle_max: float
    guard_strength: float


@dataclass(frozen=True)
class GenderRender:
    targets: np.ndarray
    info: dict[str, object]
    image: np.ndarray
    region_scales: dict[str, float]
    checks: dict[str, object]


def _triangle_ratios(lay: MeshLayout, src: np.ndarray, dst: np.ndarray) -> np.ndarray:
    pts = np.asarray(lay.points, dtype=np.float64)
    moved = pts.copy()
    moved[:len(src)] = dst
    tris = np.asarray(lay.triangles, dtype=np.intp)
    a, b, c = pts[tris[:, 0]], pts[tris[:, 1]], pts[tris[:, 2]]
    a2, b2, c2 = moved[tris[:, 0]], moved[tris[:, 1]], moved[tris[:, 2]]
    before = (b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0])
    after = (b2[:, 0] - a2[:, 0]) * (c2[:, 1] - a2[:, 1]) - (b2[:, 1] - a2[:, 1]) * (c2[:, 0] - a2[:, 0])
    ratio = np.ones(len(tris))
    keep = np.abs(before) > 1e-12
    ratio[keep] = after[keep] / before[keep]
    return ratio


def render_targets(photo: np.ndarray, face: object, slider: float, *,
                   region_strengths: Mapping[str, float] | None = None,
                   scope: str = "face_only") -> GenderRender:
    """Render the bounded preview with an exact sparse seam search and full check.

    Small parity images retain the full reference search. Larger images evaluate
    the same Q4 contour samples without repeatedly rasterising every interior
    pixel. A candidate can be returned only after the canonical full-resolution
    warp, Q3, triangle and Q4 checks; any failed confirmation uses the full search.
    """
    return _render_targets(photo, face, slider, region_strengths=region_strengths, scope=scope, sparse=True)


def render_targets_reference(photo: np.ndarray, face: object, slider: float, *,
                             region_strengths: Mapping[str, float] | None = None,
                             scope: str = "face_only") -> GenderRender:
    """Full-raster search retained for independent speed/equivalence regression."""
    return _render_targets(photo, face, slider, region_strengths=region_strengths, scope=scope, sparse=False)


def _render_targets(photo: np.ndarray, face: object, slider: float, *,
                    region_strengths: Mapping[str, float] | None,
                    scope: str, sparse: bool) -> GenderRender:
    """Targets the product renders: recipe, strain cap, then per-region bisection.

    A region is scaled down only when the rendered result breaks a rule: a mesh
    triangle shrinking below 35% or growing beyond 1/0.35 of its area, the warp
    guard backing the whole edit off, or the face-outline seam (Q4) above 95% of its
    unchanged limit. Silhouette regions are tried in a fixed order; a region whose
    removal does not help is restored. The same code runs for both directions.
    """
    from ...quality.metrics import q4_seam
    from ..warp import field as fields
    from ..warp import mesh as warp_mesh
    from .gender_preview import SparseSeam

    src = check_face(face)
    prepared = (src, parameters(slider), frame(src))
    image = np.asarray(photo)
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4) or min(image.shape[:2]) < 2:
        raise ValueError("gender photo must be uint8 RGB or RGBA, at least 2 by 2")
    base = {name: 1.0 for name in REGIONS}
    for name, value in (region_strengths or {}).items():
        if name not in base or not isinstance(value, (int, float)) or isinstance(value, bool) \
                or not math.isfinite(value) or not 0 <= value <= 1.5:
            raise ValueError("unknown gender region or factor outside 0..1.5")
        base[name] = float(value)
    h, w = image.shape[:2]
    lay = warp_mesh.layout(src, w, h)
    oval = regions.region_mask("face_oval", src, h, w, normalized=False, supersample=2)
    seam_samples = SparseSeam.prepare(image, oval) if sparse and max(h, w) > 192 else None
    cache: dict[tuple[float, ...], _Evaluation] = {}
    # Owned by this invocation only. Jaw/eye/nose refinements often share the
    # same four base-shape controls; retain their exact target without repeating
    # MLS. No photograph, mesh or settings survive this render.
    base_cache: dict[tuple[float, ...], np.ndarray] = {}
    full_evaluations = 0

    def full_evaluation(targets: np.ndarray, info: dict[str, object]) -> _Evaluation:
        nonlocal full_evaluations
        full_evaluations += 1
        warp = warp_mesh.mesh_warp(h, w, src, targets, lay=lay)
        output = fields.apply(image, warp.result.field)
        seam_ratio = (seam_samples.full_ratio(output) if seam_samples is not None
                      else float(q4_seam(image, output, oval).measured["ratio"]))
        ratios = _triangle_ratios(lay, src, targets)
        lo, hi = float(np.min(ratios)), float(np.max(ratios))
        failed = []
        if lo < TRIANGLE_RATIO_MIN or hi > 1 / TRIANGLE_RATIO_MIN:
            failed.append("triangle_ratio")
        if warp.strength_used < 1.0:
            failed.append("guard_backoff")
        if seam_ratio > SEAM_MARGIN * SEAM_LIMIT:
            failed.append("seam")
        return _Evaluation(targets, info, output, failed, seam_ratio, lo, hi,
                           warp.strength_used)

    def evaluate(scales: Mapping[str, float]) -> _Evaluation:
        key = tuple(round(scales[r], 12) for r in REGIONS)
        if key in cache:
            return cache[key]
        factors = {r: base[r] * scales[r] for r in REGIONS}
        targets, info = _recipe_targets(
            src, slider, region_strengths=factors, scope=scope, base_cache=base_cache, prepared=prepared
        )
        if seam_samples is None:
            result = full_evaluation(targets, info)
            cache[key] = result
            return result
        ratio = seam_samples.ratio(lay, targets)
        ratios = _triangle_ratios(lay, src, targets)
        lo, hi = float(np.min(ratios)), float(np.max(ratios))
        failed = []
        if lo < TRIANGLE_RATIO_MIN or hi > 1 / TRIANGLE_RATIO_MIN:
            failed.append("triangle_ratio")
        if ratio > SEAM_MARGIN * SEAM_LIMIT:
            failed.append("seam")
        # Candidate-only pixels are deliberately empty: they cannot be displayed
        # or exported before full_evaluation verifies and renders the final target.
        result = _Evaluation(targets, info, np.empty((0, 0, image.shape[2]), dtype=np.uint8), failed,
                             ratio, lo, hi, 1.0)
        cache[key] = result
        return result

    scales = {name: 1.0 for name in REGIONS}
    current = evaluate(scales)
    tried: list[str] = []
    if current.failed and slider != 0:
        # 1. One common factor for the outline regions (they share the seam), then
        #    for every other region if the outline alone cannot satisfy the rules.
        outline = [r for r in SILHOUETTE_REGIONS if base[r] > 0]
        inner = [r for r in REGIONS if r not in SILHOUETTE_REGIONS and base[r] > 0]
        for group in (outline, inner):
            if not current.failed or not group:
                continue
            tried.extend(group)
            common = _bisect(evaluate, scales, group)
            for region in group:
                scales[region] = common
            current = evaluate(scales)
        # 2. Per region, give back as much as the rules allow, one region at a time.
        if not current.failed:
            for region in tried:
                scales[region] = _bisect(evaluate, scales, [region], low=scales[region])
                current = evaluate(scales)
    full = evaluate({name: 1.0 for name in REGIONS})
    if seam_samples is not None:
        current = full_evaluation(current.targets, current.info)
        if current.failed:
            # Never certify a downsampled or partial raster. A pathological mesh
            # may need the full guard in every candidate; its original is safe.
            result = _render_targets(photo, face, slider, region_strengths=region_strengths,
                                     scope=scope, sparse=False)
            result.info["sparse_fallback"] = True
            return result
    info = dict(current.info)
    info.update({"region_scales": dict(scales), "regions_tried": tried,
                 "render_failed": list(current.failed), "seam_ratio": current.seam_ratio,
                 "triangle_min": current.triangle_min, "triangle_max": current.triangle_max,
                 "effect_retention": _retention(src, full.targets, current.targets),
                 "render_version": VERSION,
                 "search_method": "sparse-seam-full-confirm" if seam_samples is not None else "full-raster",
                 "full_raster_evaluations": full_evaluations,
                 "seam_samples": seam_samples.sample_count if seam_samples is not None else h * w})
    checks: dict[str, object] = {"failed": list(current.failed), "seam_ratio": current.seam_ratio,
                                 "guard_strength": current.guard_strength, "full_resolution_checked": True}
    return GenderRender(np.asarray(current.targets), info, np.asarray(current.image), dict(scales), checks)


def _bisect(evaluate: Callable[[Mapping[str, float]], _Evaluation], scales: Mapping[str, float],
            group: list[str], *, low: float = 0.0) -> float:
    """Largest common scale in [low, 1] for `group` (others fixed) breaking no rule.

    `low` must already pass (or be 0, the identity for that group's contribution).
    """
    trial = dict(scales)
    lo, hi = low, 1.0
    for _ in range(REGION_BISECTIONS):
        mid = (lo + hi) / 2
        for region in group:
            trial[region] = mid
        if evaluate(trial).failed:
            hi = mid
        else:
            lo = mid
    return lo


def _retention(src: np.ndarray, requested: np.ndarray, applied: np.ndarray) -> float:
    """Share of the requested landmark movement kept, summed over all landmarks."""
    req = np.hypot(*(requested - src).T)
    if float(req.sum()) <= 1e-12:
        return 1.0
    app = np.sum((applied - src) * (requested - src), axis=1) / np.maximum(req, 1e-12)
    return float(np.clip(app.sum() / req.sum(), 0.0, 1.0))

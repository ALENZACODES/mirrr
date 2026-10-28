"""A4 "Still Her" automated proxy for filters (filters-plan.md §5.4), on drawn faces.

For one filter at its default strength with the guard on, on each drawn skin tone:

* lift: mean skin L* rise <= the look's mean rise on mid-grey over the same pixels + 1, and <= 3
  (a look that darkens mid-grey leaves skin less room: the rule is literal)
* chroma: mean skin C*ab keeps >= 85% (mono looks exempt; neutral mono looks must stay neutral,
  |a*| and |b*| <= 0.5 everywhere)
* hue: chroma-weighted mean hue turn <= 6 degrees (mono exempt)
* spread: on the darkest tones the skin's L* spread stays within 70-130% of the input
* marks: >= 90% of the drawn freckles and moles keep their contrast (arena marks.py)
* geometry: no landmark moves (colour looks have no warp op; checked on the recipe)
* the arena's own unrequested-change check (arena/scorer.py) finds no "skin lightened"

Plus the §3.4 makeup rule: a look's colour change on the lips may not differ from its change
on the nearby skin by more than ΔE2000 2. `region_aim` paints both one colour first, so it
asks whether the recipe treats the same colour differently by region (it tests the recipe,
not the guard, and not how red lips react to a grade). Thresholds are ASSUMED and owned by the arena; a failing filter is
fixed or demoted, never the threshold. Real faces: `make realface` on the box, never here.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

import numpy as np

from ...arena import identity as I
from ...arena import marks as M
from ...arena import scorer
from ...engines.core import regions
from ...engines.core.distance import dilate
from .. import engine, oplist
from ..colour import ops as O
from ..colour import sample_cache
from ..colour import space as S
from ..frame import whole
from ..masks import blend, hue_lock
from ..masks import guard as G
from . import fixtures as F

LIFT_OVER_GREY = 1.0
LIFT_MAX = 3.0
CHROMA_KEEP = 0.85
HUE_MAX = 6.0
SPREAD = (0.70, 1.30)
MARKS_KEPT = 0.90
NEUTRAL_AB = 0.5
REGION_DE = 2.0
DARK_TONES = ("dark", "very_dark")
DARK_L = 45.0
CHROMA_HUE_FLOOR = 5.0  # ASSUMED: achromatic input has no stable hue


@dataclass
class ToneReport:
    tone: str
    lift: float
    grey_lift: float
    chroma_ratio: float
    hue_turn: float
    spread: float
    marks_kept: float | None
    neutral_ab: float
    flags: list[str] = field(default_factory=list)
    skin_l: float = 50.0
    skin_chroma: float = 20.0
    hue_rule_applies: bool = True

    @property
    def dark(self) -> bool:
        """The spread rule applies to dark skin: a drawn dark tone, or a real face whose skin
        L* averages under DARK_L (ASSUMED cut-off)."""
        return self.tone in DARK_TONES or self.skin_l < DARK_L



@dataclass(frozen=True)
class FaceInputs:
    """Input-only measurements for a frozen face and skin mask.

    This record is bound to the exact original image, landmarks and mask used to
    construct it. Share it between recipes, not between face revisions. No mutable
    global cache, personally identifying payload, or retained edited photo exists.
    """

    skin_pixels: np.ndarray
    skin_lab: np.ndarray
    skin_l: float
    iod: float
    marks: list[M.Mark]
    scorer_skin: tuple[float, float, float] | None
    scorer_background: tuple[float, float, float] | None
    scorer_background_mask: np.ndarray
    face_width: float
    hue_source: hue_lock.HueSource
    grey_original: np.ndarray
    sampling: sample_cache.Sampling
    guard_original: G.OriginalGuard
    before_chroma: np.ndarray
    before_hue: np.ndarray
    before_spread: float
    cast_stats: tuple[float, float]
    skin_chroma: float
    hue_rule_applies: bool
    points_signature: bytes
    face_centre: tuple[float, float] | None
    # Face-scoped private snapshot: no persistent cache or full-frame hash
    # on each recipe. The original references enforce caller/session scope.
    original_image: np.ndarray
    original_masks: blend.FilterMasks
    frozen_image: np.ndarray
    frozen_masks: blend.FilterMasks


def face_centre(masks: Any) -> tuple[float, float] | None:
    """One face-oval centre for all recipes, with the bench's pixel convention.

    The mask sum, grid layout and addition order intentionally match the
    existing real-face mesh_centre and drawn-face fixture implementation.
    """
    oval = masks.person
    if oval is None or not oval.any():
        return None
    yy, xx = np.mgrid[0:oval.shape[0], 0:oval.shape[1]]
    weight = float(oval.sum())
    return (float((xx * oval).sum() / weight + 0.5),
            float((yy * oval).sum() / weight + 0.5))


def _points_digest(points: np.ndarray) -> bytes:
    """Reject stale points even when the same image and mask are supplied."""
    arr = np.asarray(points)
    digest = hashlib.blake2b(digest_size=16)
    digest.update(str(arr.shape).encode("ascii"))
    digest.update(str(arr.dtype).encode("ascii"))
    digest.update(np.ascontiguousarray(arr).tobytes())
    return digest.digest()


def _validate_face_inputs(image: np.ndarray, points: np.ndarray,
                          masks: Any) -> tuple[float, float]:
    """Fail closed on malformed face-gate inputs before expensive preparation.

    A missing skin region or non-finite mask must be an unavailable face,
    never a valid all-zero/NaN statistic that silently clears a filter.
    Validate once per original face, not once per colour recipe.
    """
    photo = np.asarray(image)
    if (photo.ndim != 3 or photo.shape[-1] != 3 or photo.dtype != np.uint8
            or photo.shape[0] == 0 or photo.shape[1] == 0):
        raise ValueError("face gate requires non-empty RGB uint8 pixels")
    mesh = np.asarray(points)
    if (mesh.ndim != 2 or mesh.shape[0] < 468 or mesh.shape[1] < 2
            or mesh.dtype.kind not in "fiu" or not np.isfinite(mesh).all()):
        raise ValueError("face gate requires a finite face landmark mesh")
    # Both original-face dimensions are reusable features, validated once.
    scale = I.iod(mesh)
    if not np.isfinite(scale) or scale <= 1e-6:
        raise ValueError("face gate requires non-degenerate landmark eye spacing")
    face_width = scorer.face_width_share(mesh)
    if not np.isfinite(face_width) or face_width <= 1e-6:
        raise ValueError("face gate requires non-degenerate landmark face width")
    if masks.skin is None:
        raise ValueError("face gate requires a measured skin mask")
    skin = np.asarray(masks.skin)
    if (skin.shape != photo.shape[:2] or skin.dtype.kind not in "fiub"
            or not np.isfinite(skin).all() or np.any(skin < 0)
            or np.any(skin > 1) or not np.any(skin >= 0.5)):
        raise ValueError("face gate requires a non-empty finite skin mask in 0..1")
    if masks.person is not None:
        person = np.asarray(masks.person)
        if (person.shape != photo.shape[:2] or person.dtype.kind not in "fiub"
                or not np.isfinite(person).all() or np.any(person < 0)
                or np.any(person > 1)):
            raise ValueError("face gate requires a finite person mask in 0..1")
    return scale, face_width


def prepare_face(image: np.ndarray, points: np.ndarray, masks: Any) -> FaceInputs:
    """Compute expensive input features once; replicate the arena's mask semantics.

    The scorer's median uses its own CIELAB conversion and a >= 0.5 mask,
    which is deliberately kept separate from the A4 per-pixel CIELAB mean.
    Never replace either statistic with the other: the evidence must not drift.
    """
    scale, face_width = _validate_face_inputs(image, points, masks)
    # No flags on caller-owned arrays are changed. Snapshot once per face and
    # never expose writable source buffers to any recipe. This one copy saves
    # three full-frame hash scans for every later recipe in the same batch.
    frozen_image = np.ascontiguousarray(image).copy()
    frozen_image.setflags(write=False)
    frozen_skin = np.ascontiguousarray(masks.skin).copy()
    frozen_skin.setflags(write=False)
    frozen_person = None
    if masks.person is not None:
        frozen_person = np.ascontiguousarray(masks.person).copy()
        frozen_person.setflags(write=False)
    frozen_masks = blend.FilterMasks(frozen_skin, frozen_person, masks.source, masks.note)
    skin = np.asarray(frozen_skin) >= 0.5
    all_original_lab = S.srgb_to_lab(S.bytes_to_unit(frozen_image))
    lab = all_original_lab[skin]
    before_chroma = np.hypot(lab[:, 1], lab[:, 2])
    before_hue = np.degrees(np.arctan2(lab[:, 2], lab[:, 1]))
    before_spread = float(lab[:, 0].std())
    input_chroma = float(before_chroma.mean())
    cast_stats = O.photo_cast(S.bytes_to_unit(frozen_image))
    # Same order and dtype as scorer.skin_shift: dilate the binary float32 mask.
    background = 1.0 - (dilate(skin.astype(np.float32), 6.0) > 0)
    prepared = FaceInputs(skin, lab, float(lab[:, 0].mean()), scale,
                          M.find_marks(frozen_image, frozen_skin, scale),
                          I.mean_lab(frozen_image, frozen_skin),
                          I.mean_lab(frozen_image, background),
                          background, face_width,
                          hue_lock.prepare_hue(frozen_image, frozen_skin),
                          engine.grey_photo(frozen_image.shape[:2]),
                          sample_cache.prepare(frozen_image),
                          G.prepare_guard(frozen_image, frozen_skin, lab=all_original_lab),
                          before_chroma, before_hue, before_spread, cast_stats, input_chroma,
                          input_chroma >= CHROMA_HUE_FLOOR, _points_digest(points),
                          face_centre(frozen_masks), image, masks, frozen_image, frozen_masks)
    for array in (prepared.skin_pixels, prepared.skin_lab, prepared.before_chroma,
                  prepared.before_hue, prepared.scorer_background_mask):
        array.setflags(write=False)
    return prepared


def _cached_unrequested(after: np.ndarray, points: np.ndarray, masks: Any,
                        retained: M.Retention, recipe_id: str, inputs: FaceInputs) -> list[str]:
    """Arena scorer.unrequested_changes with the ORIGINAL side reused.

    Order and thresholds intentionally match the scorer. Using its public
    helpers avoids silently replacing numeric meaning with approximations.
    """
    flags: list[str] = []
    skin_after = I.mean_lab(after, masks.skin)
    background_after = I.mean_lab(after, inputs.scorer_background_mask)
    before_skin = inputs.scorer_skin
    before_background = inputs.scorer_background
    rise = None if before_skin is None or skin_after is None else skin_after[0] - before_skin[0]
    bg_rise = (None if before_background is None or background_after is None
               else background_after[0] - before_background[0])
    if scorer.lightened(rise, bg_rise) and recipe_id not in scorer.LIGHTEN_REQUESTED:
        flags.append("skin lightened")
    # Measured on the points after the edit, as the scorer does: a colour filter should not
    # move landmarks, and if anything ever does, the slimming check still sees it.
    width_change = scorer.face_width_share(points) / inputs.face_width - 1.0
    if width_change < -scorer.SLIM_SHARE and recipe_id not in scorer.SLIM_REQUESTED:
        flags.append("face slimmed")
    if retained.share is not None and retained.found >= 3 and retained.share < scorer.MARKS_KEPT_MIN:
        flags.append("marks erased")
    return flags


def measure_image(recipe: Mapping[str, Any], image: np.ndarray, points: np.ndarray, masks: Any, label: str,
                  settings: engine.Settings = engine.DEFAULTS,
                  face_centre: tuple[float, float] | None = None,
                  inputs: FaceInputs | None = None) -> ToneReport:
    """A4 numbers for one face: any photo with its 478-point mesh (pixel coordinates) and the
    filter masks made from it. Drawn faces use this; so does the real-face bench on the box."""
    if masks.skin is None:
        raise ValueError("face gate requires a measured skin mask")
    source = inputs if inputs is not None else prepare_face(image, points, masks)
    if inputs is not None and (source.original_image is not image
                               or source.original_masks is not masks):
        raise ValueError("prepared face belongs to another photo or mask")
    if inputs is not None and source.points_signature != _points_digest(points):
        raise ValueError("prepared face belongs to another landmark mesh")
    res = engine.render(source.frozen_image, recipe, settings, source.frozen_masks,
                        face_centre=face_centre,
                        hue_source=source.hue_source,
                        sampling=source.sampling, guard_original=source.guard_original,
                        cast_stats=source.cast_stats)
    skin = source.skin_pixels
    before = source.skin_lab
    all_after = S.srgb_to_lab(S.bytes_to_unit(res.image))
    after = all_after[skin]
    grey_look = res.grey_look
    grey_rise = res.grey_rise
    if grey_rise is None and not res.plan.identity:
        grey_look = engine.look(source.grey_original, res.plan, whole(image, face_centre),
                                uniform_grey=True)
        grey_rise = G.grey_rise(grey_look)
    grey = 0.0 if grey_rise is None else float(grey_rise[skin].mean())
    cb, ca = source.before_chroma, np.hypot(after[:, 1], after[:, 2])
    hb, ha = source.before_hue, np.degrees(np.arctan2(after[:, 2], after[:, 1]))
    turn = S.wrap_degrees(ha - hb)
    weight = np.minimum(cb, ca)
    hue_turn = float(abs((turn * weight).sum() / weight.sum())) if weight.sum() > 0 else 0.0
    sb, sa = source.before_spread, float(after[:, 0].std())
    kept = M.retention(source.marks, res.image, source.iod)
    input_chroma = source.skin_chroma
    report = ToneReport(label, float((after[:, 0] - before[:, 0]).mean()), grey,
                        float(ca.mean() / cb.mean()) if cb.mean() > 0 else 1.0, hue_turn,
                        sa / sb if sb > 0 else 1.0, kept.share,
                        float(np.abs(all_after[..., 1:]).max()))
    report.flags = _cached_unrequested(res.image, points, source.frozen_masks,
                                       kept, str(recipe["id"]), source)
    report.skin_l = source.skin_l
    report.skin_chroma = input_chroma
    report.hue_rule_applies = source.hue_rule_applies
    return report


def measure(recipe: Mapping[str, Any], p: F.Portrait, settings: engine.Settings = engine.DEFAULTS) -> ToneReport:
    return measure_image(recipe, p.image, p.face.points, p.masks, p.face.tone, settings, F.face_centre(p))


def problems(recipe: Mapping[str, Any], reports: Sequence[ToneReport]) -> list[str]:
    mono = recipe["limits"].get("guardMode") == "lightness"
    neutral = bool(recipe["limits"].get("neutralMono"))
    out: list[str] = []
    rid = recipe["id"]
    for r in reports:
        where = f"{rid} on {r.tone} skin"
        if r.lift > min(r.grey_lift + LIFT_OVER_GREY, LIFT_MAX) + 1e-9 and r.lift > 0:
            out.append(f"{where}: skin L* rose {r.lift:.2f} (mid-grey rose {r.grey_lift:.2f})")
        if not mono and r.hue_rule_applies and r.chroma_ratio < CHROMA_KEEP:
            out.append(f"{where}: skin chroma kept {r.chroma_ratio:.0%}")
        if not mono and r.hue_rule_applies and r.hue_turn > HUE_MAX:
            out.append(f"{where}: skin hue turned {r.hue_turn:.1f} degrees")
        if neutral and r.neutral_ab > NEUTRAL_AB:
            out.append(f"{where}: mono look left colour (|a*|, |b*| up to {r.neutral_ab:.2f})")
        if r.dark and not SPREAD[0] <= r.spread <= SPREAD[1]:
            out.append(f"{where}: skin L* spread {r.spread:.0%} of the input")
        if r.marks_kept is not None and r.marks_kept < MARKS_KEPT:
            out.append(f"{where}: kept {r.marks_kept:.0%} of freckles and moles")
        out += [f"{where}: arena check '{f}'" for f in r.flags]
    if any(oplist.op(s["op"]).family == "geometry" for s in recipe["stages"]):
        out.append(f"{rid}: moves landmarks outside the Fun tab")
    return out


def check(recipe: Mapping[str, Any], portraits: Sequence[F.Portrait] | None = None) -> list[str]:
    faces = list(portraits) if portraits is not None else F.six_tones()
    return problems(recipe, [measure(recipe, p) for p in faces])


@dataclass(frozen=True)
class RegionAimInputs:
    """Synthetic equal-colour lip and cheek comparison, shared across looks.

    Unlike a face report this deliberately uses one flattened drawn source.
    The input masks are fixed for the acceptance run and cannot be modified
    by a recipe. None of the original face image or landmarks is retained.
    """

    flat: np.ndarray
    lips: np.ndarray
    ring: np.ndarray
    centre: tuple[float, float]


def prepare_region_aim(face: F.Portrait) -> RegionAimInputs:
    """Compute a single drawn lip/skin comparison for all candidate filters.

    The exact radius, median and ring membership match the old per-recipe
    implementation, so the preregistered numeric definition stays unchanged.
    """
    h, w = face.image.shape[:2]
    pts = face.face.points
    lips = regions.region_mask("lips", pts, h, w, normalized=False, supersample=2) >= 0.5
    yy, xx = np.mgrid[0:h, 0:w]
    cy, cx = np.argwhere(lips).mean(axis=0)
    assert face.masks.skin is not None
    near = np.hypot(xx - cx, yy - cy) < I.iod(pts) * 0.6
    ring = near & ~lips & (face.masks.skin >= 0.5)
    flat = face.image.copy()
    colour = np.median(face.image[ring], axis=0).astype(np.uint8)
    flat[lips | ring] = colour
    original = RegionAimInputs(flat, lips, ring, F.face_centre(face))
    for array in (original.flat, original.lips, original.ring):
        array.setflags(write=False)
    return original


def region_aim(recipe: Mapping[str, Any], p: F.Portrait | None = None, *,
               prepared: RegionAimInputs | None = None) -> float:
    """Compare equal-colour lip and nearby skin without repeated face setup.

    The original input geometry and comparison positions are calculated once
    when a caller passes prepared. A standalone invocation remains compatible
    with the original public recipe validator and always uses drawn data.
    """
    if p is not None and prepared is not None:
        raise ValueError("use a portrait or an already prepared lip comparison")
    inputs = prepared if prepared is not None else prepare_region_aim(p or F.portrait("medium"))
    res = engine.render(inputs.flat, recipe,
                        engine.Settings(guard=False, protect_skin=False, background_only=False),
                        face_centre=inputs.centre)
    after = S.srgb_to_lab(S.bytes_to_unit(res.look))
    return float(S.ciede2000(after[inputs.lips].mean(axis=0),
                             after[inputs.ring].mean(axis=0)))

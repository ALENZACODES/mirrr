"""Render one named portrait look on one photo (browser: web/src/filters/portrait/compose.ts).

    polish    texture-preserving smooth inside the skin, marks held (polish.py)
    define    structure on eyes, brows and lips, irises cut out (polish.py)
    grade     the look's recipe through the filter engine, skin guard and hue lock on
    irises    put back from the original photo, so eye colour never changes
    sparkle   the evening look's procedural glints (sparkle.py)
    check     identity guard: marks kept, irises kept, skin not lightened

One slider, 0-100, moves every part together: the polish and definition weights and the
sparkle scale by strength / 100, and the grade runs at that strength. Strength 0 returns the
photo unchanged, byte for byte, alpha included. A look needs the 478-point face mesh of the
photo; without it the look is refused with a code, never run on a guessed face.

Identity guard: at least 90% of the photo's freckles and moles keep half their contrast (the
filter pack's Still Her rule), iris pixels keep the original colour, and the mean skin L*
(CIELAB, sparkle excluded) rises by at most 1. If the marks rule fails the polish backs off
(half, then a quarter); if it still fails, or the skin would lighten, the look is refused with
a code and the photo is returned unchanged. Every result is labelled a simulation.
Thresholds are ASSUMED until the arena sets them on real faces.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...arena import identity as I
from ...arena import marks as M
from ...engines.core import regions
from .. import engine
from ..colour import space as S
from ..masks import blend
from ..qa.still_her import MARKS_KEPT
from . import looks as L
from . import polish as P
from . import sparkle as SP

U8 = NDArray[np.uint8]
Floats = NDArray[np.float64]
LABEL = ("Portrait look: a local simulation of skin polish, feature definition and colour. "
         "Not a prediction and not medical advice.")
LIFT_LIMIT = 1.0              # mean skin L* rise allowed; the guard's own LIFT_OVER_GREY; ASSUMED
POLISH_STEPS = (1.0, 0.5, 0.25)
MIN_SIDE = 16
MESH_POINTS = 478
REFUSALS = ("bad_photo", "no_face_points", "unknown_look", "bad_strength", "marks_not_kept", "skin_lightened")


class PortraitRefused(ValueError):
    """The look can't run on this input; `code` is one of REFUSALS."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class FaceMasks:
    skin: Floats
    person: Floats
    features: P.Features
    marks: tuple[M.Mark, ...]
    protect: Floats
    sparkle: Floats
    iod: float
    centre: tuple[float, float] | None


@dataclass(frozen=True)
class Identity:
    marks_found: int
    marks_kept: int
    iris_kept: float
    skin_lift: float
    polish_used: float
    passed: bool


@dataclass(frozen=True)
class Result:
    image: U8
    look: str
    name: str
    strength: float
    status: str               # identity, applied or refused
    code: str                 # "" unless refused
    label: str
    identity: Identity | None
    glints: int
    notes: tuple[str, ...]


def mask_centre(mask: Floats) -> tuple[float, float] | None:
    """Weighted mean of a mask's pixel centres (the filter layer's face centre)."""
    total = float(mask.sum())
    if total <= 0:
        return None
    yy, xx = np.mgrid[0:mask.shape[0], 0:mask.shape[1]]
    return float((xx * mask).sum() / total + 0.5), float((yy * mask).sum() / total + 0.5)


def face_masks(rgb: U8, points: np.ndarray) -> FaceMasks:
    h, w = rgb.shape[:2]
    pts = np.asarray(points, dtype=np.float64)[:, :2]

    def region(name: str) -> Floats:
        return regions.region_mask(name, pts, h, w, normalized=False, supersample=2).astype(np.float64)

    fm = blend.from_landmarks(pts, h, w)
    if fm.skin is None or fm.person is None:
        raise PortraitRefused("no_face_points", "These face points give no skin outline.")
    iod = I.iod(pts)
    found = tuple(M.find_marks(rgb, fm.skin, iod))
    features = P.Features(region("eyes"), region("brows"), region("lips"), region("irises"))
    return FaceMasks(fm.skin, fm.person, features, found, M.mark_mask(list(found), (h, w)),
                     SP.region(pts, fm.skin, iod), iod, mask_centre(fm.person))


def skin_lightness(rgb: U8, skin: Floats) -> float:
    inside = skin >= 0.5
    if not np.any(inside):
        return 0.0
    return float(S.srgb_to_lab(S.bytes_to_unit(rgb))[..., 0][inside].mean())


def _validate(image: np.ndarray, points: np.ndarray | None, look_id: str, strength: float) -> tuple[U8, np.ndarray, L.Look]:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4) or min(img.shape[:2]) < MIN_SIDE:
        raise PortraitRefused("bad_photo", f"A portrait look needs an RGB or RGBA photo at least {MIN_SIDE} pixels a side.")
    pts = None if points is None else np.asarray(points, dtype=np.float64)
    if pts is None or pts.ndim != 2 or pts.shape[0] != MESH_POINTS or pts.shape[1] < 2 or not np.all(np.isfinite(pts)):
        raise PortraitRefused("no_face_points", "A portrait look needs the 478 face points of this photo, read on this device.")
    try:
        look = L.get(look_id)
    except KeyError:
        raise PortraitRefused("unknown_look", f"There is no portrait look {look_id!r}.") from None
    if not (isinstance(strength, int | float) and math.isfinite(strength) and 0 <= strength <= 100):
        raise PortraitRefused("bad_strength", "Strength is 0 to 100.")
    return img, pts, look


def _steps(rgb: U8, fm: FaceMasks, look: L.Look, strength: float, polish_scale: float) -> tuple[U8, U8, int]:
    """(before sparkle, after sparkle, glints drawn) for one polish scale."""
    s = strength / 100.0
    x = P.polish(rgb, fm.skin, fm.protect, fm.iod, look.polish * s * polish_scale)
    e = look.emphasis
    x = P.define(x, P.feature_mask(fm.features, fm.iod, e.eyes, e.brows, e.lips), s)
    masks = blend.FilterMasks(fm.skin, fm.person, "landmarks")
    graded = engine.render(x, look.recipe, engine.Settings(strength=strength), masks, face_centre=fm.centre).image
    graded = blend.keep_original(rgb, graded, fm.features.irises)
    if look.sparkle is None:
        return graded, graded, 0
    sparkled, drawn = SP.render(graded, fm.sparkle, fm.iod, look.sparkle, s)
    return graded, sparkled, drawn.count


def _identity(rgb: U8, before_sparkle: U8, final: U8, fm: FaceMasks, used: float) -> Identity:
    kept = M.retention(list(fm.marks), final, fm.iod)
    iris = fm.features.irises >= 1.0
    same = np.all(final[iris] == rgb[iris], axis=-1) if np.any(iris) else np.ones(1, dtype=bool)
    lift = skin_lightness(before_sparkle, fm.skin) - skin_lightness(rgb, fm.skin)
    marks_ok = kept.found == 0 or kept.kept / kept.found >= MARKS_KEPT
    return Identity(kept.found, kept.kept, float(same.mean()), lift, used,
                    bool(marks_ok and lift <= LIFT_LIMIT and same.all()))


def render(image: np.ndarray, points: np.ndarray | None, look_id: str, strength: float = 30.0) -> Result:
    img, pts, look = _validate(image, points, look_id, strength)
    rgb = np.ascontiguousarray(img[..., :3])
    if strength == 0:
        return Result(img.copy(), look.id, look.name, 0.0, "identity", "", LABEL, None, 0, ())
    fm = face_masks(rgb, pts)
    notes: list[str] = []
    check: Identity | None = None
    glints = 0
    for step, scale in enumerate(POLISH_STEPS):
        before, final, glints = _steps(rgb, fm, look, float(strength), scale)
        check = _identity(rgb, before, final, fm, look.polish * strength / 100.0 * scale)
        if check.passed or check.skin_lift > LIFT_LIMIT or step + 1 == len(POLISH_STEPS):
            break
        notes.append(f"Polish eased to {POLISH_STEPS[step + 1]:.2f} of the look to keep your marks.")
    assert check is not None
    if not check.passed:
        code = "skin_lightened" if check.skin_lift > LIFT_LIMIT else "marks_not_kept"
        return Result(img.copy(), look.id, look.name, float(strength), "refused", code, LABEL, check, 0,
                      tuple(notes + ["The look was not applied: it would have changed what makes this photo you."]))
    out = img.copy()
    out[..., :3] = final
    return Result(out, look.id, look.name, float(strength), "applied", "", LABEL, check, glints, tuple(notes))

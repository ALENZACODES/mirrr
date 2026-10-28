"""#28 Under-eye brightening for dark circles and eye-bag shadow, matched to her own cheek.

1. Zones. A crescent under each lower lid (local_zones.under_eye_polygon, deeper when bag
   shadow is included) and, as the colour reference, a patch of her own cheek straight
   below it. Both are clipped to the visible skin; round marks found by the blemish
   measure, and any pixel far darker than the crescent's median, are left out of every
   measurement (women-first rule 2).
2. Measure. The median Lab of each crescent and of its cheek reference (the other side's
   cheek when marks or the outline hide this one). A side is corrected
   only when the crescent is at least DARK_MIN L* darker than the cheek; otherwise it is
   left alone and reported.
3. Correct the low frequencies only. A broad normalised local mean of the crescent (marks
   left out) is the shadow; each pixel gets w x (cheek - shadow) added, so pores, fine
   texture and every mark keep their contrast. w = strength/100 x CORRECT_MAX x feathered
   zone. L* only ever rises, and never past the cheek: the target is her own skin level next
   to the eye, so no overall lightening is applied. a* and b* move toward the cheek by the
   same weight, which takes out a blue, purple or brown cast.
4. Identity check (local_zones.finish).

Shares and limits are ASSUMED (drawn faces; real-face tuning not done). A local look
simulation, not a health reading. Mirrored in web/src/engines/skin/under-eye.ts. General
cosmetic information, not medical advice.
Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from ..core import regions
from ..core.distance import dilate
from . import local_zones as Z
from .blemish import measure

LABEL = "Under-eye brightening simulation, matched to your own cheek. " + Z.NOT_MEDICAL
CORRECT_MAX = 0.8       # share of the measured difference one pass removes (ASSUMED)
DARK_MIN = 2.0          # L* darker than the cheek before a side is corrected (ASSUMED)
MAX_LIFT = 15.0         # largest L* rise on any pixel (ASSUMED)
BAG_DEPTH = 0.7         # crescent depth with bag shadow, share of eye width (ASSUMED)
SHADOW_SHARE = 0.35     # shadow radius, share of eye width (ASSUMED)
OUTLIER_L = 6.0         # pixels this far below the crescent median are marks, not shadow (ASSUMED)
MIN_ZONE_PIXELS = 12


def brighten_under_eyes(image: object, landmarks: object, *, strength: float = 60.0,
                        include_bags: bool = True) -> Z.TouchUpResult:
    img = Z.check_photo(image, strength)
    if not isinstance(include_bags, bool):
        raise ValueError("include_bags must be true or false")
    points = Z.mesh_points(landmarks)
    h, w = img.shape[:2]
    code = Z.mesh_refusal(points, h, w)
    if code:
        return Z.unchanged(img, "refused", code, LABEL)
    if strength == 0:
        return Z.unchanged(img, "not_applicable", "zero_strength", LABEL)
    frame = Z.face_frame(points)
    skin = Z.skin_region(points, h, w)
    marks = np.zeros((h, w), dtype=bool)
    for spot in measure(img, points).spots:
        if spot.compact:
            marks.ravel()[spot.pixels] = True
    if marks.any():
        marks = dilate(marks.astype(np.float32), 1.0) >= 0.5
    lab = Z.lab_of(img)
    depth = BAG_DEPTH if include_bags else Z.UNDER_EYE_DEPTH
    radius = Z.feather_radius(frame)
    revised = lab.copy()
    weight_all = np.zeros((h, w), dtype=np.float64)
    sides: dict[str, Any] = {}
    cheeks: dict[str, tuple[float, float, float] | None] = {}
    for side in Z.SIDES:
        cheek_poly = Z.cheek_reference_polygon(points, frame, side, depth)
        cheek = (regions.polygon(h, w, cheek_poly) >= 0.5) & skin & ~marks
        cheeks[side] = Z.median_lab(lab, cheek) if int(cheek.sum()) >= MIN_ZONE_PIXELS else None
    for side in Z.SIDES:
        other = Z.SIDES[1 - Z.SIDES.index(side)]
        source = side if cheeks[side] is not None else other
        crescent = Z.polygons_mask([Z.under_eye_polygon(points, frame, side, depth)], h, w, skin, radius)
        core = (crescent >= 0.5) & ~marks
        row: dict[str, Any] = {"zone_pixels": int(core.sum()), "cheek_from": source}
        sides[side] = row
        found = cheeks[source]
        if int(core.sum()) < MIN_ZONE_PIXELS or found is None:
            row["action"] = "not_visible"
            continue
        under = Z.median_lab(lab, core)
        ref = found
        row["under_eye_lab"] = [round(v, 3) for v in under]
        row["cheek_lab"] = [round(v, 3) for v in ref]
        row["difference_l"] = round(ref[0] - under[0], 3)
        if ref[0] - under[0] < DARK_MIN:
            row["action"] = "already_even"
            continue
        ew = frame.eye_width[side]
        even = core & (lab[..., 0] >= under[0] - OUTLIER_L)
        shadow = Z.local_mean(lab, even, max(2, Z.half_up(SHADOW_SHARE * ew)))
        weight = (strength / 100.0) * CORRECT_MAX * crescent.astype(np.float64)
        target = np.array(ref, dtype=np.float64)
        lift = np.clip(target[0] - shadow[..., 0], 0.0, MAX_LIFT)
        act = weight > weight_all
        revised[act, 0] = lab[act, 0] + weight[act] * lift[act]
        revised[act, 1] = lab[act, 1] + weight[act] * (target[1] - shadow[act, 1])
        revised[act, 2] = lab[act, 2] + weight[act] * (target[2] - shadow[act, 2])
        weight_all = np.where(act, weight, weight_all)
        row["action"] = "brightened"
    report: dict[str, Any] = {"include_bags": include_bags, "sides": sides}
    visible = [s for s in sides.values() if s.get("action") != "not_visible"]
    if not visible:
        return Z.unchanged(img, "refused", "zone_not_visible", LABEL, report)
    moved = weight_all > 0
    if not moved.any():
        return Z.unchanged(img, "not_applicable", "no_dark_circle", LABEL, report)
    out = Z.write_lab(img, revised, moved)
    return Z.finish(img, out, weight_all, skin, LABEL, report)

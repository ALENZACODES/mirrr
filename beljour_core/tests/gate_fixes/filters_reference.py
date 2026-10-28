"""The Still Her measurement exactly as it was before C16, kept as a test reference.

old_measure() is the pre-C16 still_her.measure_image body: it measures the
original photo again for every recipe and recomputes the look on mid-grey.
It calls engine.render without a prepared face, so on main it also takes the
full-photo grey look. The identity test compares the cached path with this
reference field by field; the timing test uses it as the "before" figure.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from plumb_api.arena import identity as I
from plumb_api.arena import marks as M
from plumb_api.arena import scorer
from plumb_api.filters import engine
from plumb_api.filters.colour import space as S
from plumb_api.filters.frame import whole
from plumb_api.filters.masks import guard as G
from plumb_api.filters.qa.still_her import ToneReport


def old_measure(recipe: Mapping[str, Any], image: np.ndarray, points: np.ndarray, masks: Any,
                label: str, face_centre: tuple[float, float] | None = None) -> ToneReport:
    assert masks.skin is not None
    res = engine.render(image, recipe, engine.DEFAULTS, masks, face_centre=face_centre)
    skin = masks.skin >= 0.5
    before = S.srgb_to_lab(S.bytes_to_unit(image))[skin]
    after = S.srgb_to_lab(S.bytes_to_unit(res.image))[skin]
    grey_look = engine.look(engine.grey_photo(image.shape[:2]), res.plan,
                            whole(image, face_centre)) if not res.plan.identity else None
    grey = 0.0 if grey_look is None else float(G.grey_rise(grey_look)[skin].mean())
    cb, ca = np.hypot(before[:, 1], before[:, 2]), np.hypot(after[:, 1], after[:, 2])
    hb = np.degrees(np.arctan2(before[:, 2], before[:, 1]))
    ha = np.degrees(np.arctan2(after[:, 2], after[:, 1]))
    turn = S.wrap_degrees(ha - hb)
    weight = np.minimum(cb, ca)
    hue_turn = float(abs((turn * weight).sum() / weight.sum())) if weight.sum() > 0 else 0.0
    sb, sa = float(before[:, 0].std()), float(after[:, 0].std())
    scale = I.iod(points)
    found = M.find_marks(image, masks.skin, scale)
    kept = M.retention(found, res.image, scale)
    all_after = S.srgb_to_lab(S.bytes_to_unit(res.image))
    report = ToneReport(label, float((after[:, 0] - before[:, 0]).mean()), grey,
                        float(ca.mean() / cb.mean()) if cb.mean() > 0 else 1.0, hue_turn,
                        sa / sb if sb > 0 else 1.0, kept.share,
                        float(np.abs(all_after[..., 1:]).max()))
    flags, _ = scorer.unrequested_changes(image, res.image, masks.skin, points_before=points,
                                          points_after=points, retained=kept,
                                          filter_name=str(recipe["id"]))
    report.flags = flags
    report.skin_l = float(before[:, 0].mean())
    report.hue_rule_applies = float(cb.mean()) >= 5.0
    return report

"""#51 Old photo restoration, reduced: scratch and dust fill, then the measured denoise and tone.

1. Scratches and dust. A pixel is a thin-line candidate when its luma stands more than
   LINE_CONTRAST above (bright) or below (dark) BOTH pixels GAP px away along a row or a
   column (edge-replicated), which a step edge never does. Candidates form 4-neighbour
   components; a component is kept when it is a line (longest box side at least MIN_LINE
   px) or, with face points and outside the face oval, a speck of at most MAX_SPECK px;
   candidates are grouped through their 3 x 3 neighbourhood so a diagonal line counts as one
   line. Natural marks are protected: with face points, dark candidates inside the face oval
   are never taken (moles, freckles and lashes are dark), specks inside it are left (skin
   highlights), and the eye and lip openings are excluded (catchlights, the lip line).
   Without face points only bright lines are taken. The kept marks, grown by GROW px, are filled from
   their surround with the existing biharmonic fill and blended by strength.
2. Tone and noise. The existing enhance pipeline (repair/restore.py, mode "natural") runs on
   the result. Its condition gate decides: a faded scan gets its contrast back, measured
   noise is reduced, and a photo with neither keeps its pixels.

No face restorer or learned model runs; no detail is invented. Alpha is kept. Every
threshold is ASSUMED, chosen on drawn old photos. Mirrored in
web/src/engines/local/old-photo.ts. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from ..core import regions
from ..fill.fill import fill
from ..skin.local_zones import components
from .eye_geometry import SIDES, eye_coverage
from .photo_fix import FixResult, check_photo, mesh_points, mesh_refusal, unchanged
from .restore import enhance

LINE_CONTRAST = 24.0
GAP = 2
MIN_LINE = 6
MAX_SPECK = 3
GROW = 1.0
LABEL = ("Old photo repair on this device: scratches and dust filled from the surrounding "
         "pixels, then measured noise and fading corrected. No face detail is invented.")


def _luma(image: np.ndarray) -> np.ndarray:
    v = image[..., :3].astype(np.float64)
    out: np.ndarray = 0.299 * v[..., 0] + 0.587 * v[..., 1] + 0.114 * v[..., 2]
    return out


def thin_marks(image: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """(bright, dark) thin-line candidates."""
    y = _luma(image)
    pad = np.pad(y, GAP, mode="edge")
    h, w = y.shape
    left, right = pad[GAP:GAP + h, 0:w], pad[GAP:GAP + h, 2 * GAP:2 * GAP + w]
    up, down = pad[0:h, GAP:GAP + w], pad[2 * GAP:2 * GAP + h, GAP:GAP + w]
    t = LINE_CONTRAST
    bright = ((y - left > t) & (y - right > t)) | ((y - up > t) & (y - down > t))
    dark = ((left - y > t) & (right - y > t)) | ((up - y > t) & (down - y > t))
    return bright, dark


def find_scratches(image: np.ndarray, points: np.ndarray | None) -> np.ndarray:
    h, w = image.shape[:2]
    bright, dark = thin_marks(image)
    if points is not None:
        oval = [(float(points[i][0]), float(points[i][1])) for i in regions.CONTOURS["face_oval"]]
        face = regions.polygon(h, w, oval) >= 0.5
        features = np.zeros((h, w), dtype=bool)
        for side in SIDES:
            features |= eye_coverage(points, side, h, w) > 0
        lips = [(float(points[i][0]), float(points[i][1])) for i in regions.CONTOURS["lips_outer"]]
        features |= regions.polygon(h, w, lips) > 0
        candidates = (bright | (dark & ~face)) & ~features
    else:
        face = np.zeros((h, w), dtype=bool)
        candidates = bright
    pad = np.pad(candidates, 1)
    grouped = np.zeros((h, w), dtype=bool)
    for dy in (0, 1, 2):
        for dx in (0, 1, 2):
            grouped |= pad[dy:dy + h, dx:dx + w]
    flat = candidates.ravel()
    kept = np.zeros(h * w, dtype=bool)
    for group in components(grouped):
        members = group[flat[group]]
        if members.size == 0:
            continue
        ys, xs = members // w, members % w
        extent = max(int(ys.max() - ys.min()) + 1, int(xs.max() - xs.min()) + 1)
        speck = points is not None and members.size <= MAX_SPECK and not face.flat[members].any()
        if extent >= MIN_LINE or speck:
            kept[members] = True
    out: np.ndarray = kept.reshape(h, w)
    return out


def restore_old_photo(image: object, landmarks: object | None = None, *,
                      strength: float = 100.0) -> FixResult:
    img = check_photo(image, strength)
    h, w = img.shape[:2]
    points = None
    if landmarks is not None:
        points = mesh_points(landmarks)
        code = mesh_refusal(points, h, w)
        if code:
            return unchanged(img, "refused", code, LABEL)
    if strength == 0:
        return unchanged(img, "not_applicable", "zero_strength", LABEL)
    marks = find_scratches(img, points)
    share = strength / 100.0
    work = img.copy()
    report: dict[str, Any] = {"scratch_pixels": int(marks.sum()), "face_points": points is not None}
    if marks.any():
        outcome = fill(img, marks.astype(np.float32), "biharmonic", grow=GROW)
        weight = np.where(outcome.hole > 0, share, 0.0)[..., None]
        a = img[..., :3].astype(np.float64)
        b = outcome.image[..., :3].astype(np.float64)
        work[..., :3] = np.clip(np.floor(a + weight * (b - a) + 0.5), 0, 255).astype(np.uint8)
        report["filled_pixels"] = int(np.count_nonzero(outcome.hole > 0))
    toned = enhance(work, "natural", strength=share)
    out = toned.image
    report.update({"condition": toned.steps["condition"], "tone_applied": bool(toned.steps["tone_applied"]),
                   "denoise": str(toned.steps.get("denoise", "none"))})
    moved = np.any(out[..., :3] != img[..., :3], axis=2)
    if not moved.any():
        return unchanged(img, "not_applicable", "no_scratches", LABEL, report)
    alpha = np.where(moved, share, 0.0)
    return FixResult(out, alpha, "edited", "edited", LABEL, report)

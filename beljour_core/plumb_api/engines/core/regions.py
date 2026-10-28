"""Landmark-driven masks: anti-aliased polygon fill and MediaPipe Face Mesh regions.

`polygon` is the shared kernel (TypeScript: `web/src/engines/core/mask.ts`). Pixel
(col, row) covers [col, col+1) x [row, row+1). Each pixel is sampled on an S x S grid
at (col + (sx + 0.5)/S, row + (sy + 0.5)/S); a sample is inside under the even-odd
rule, counting edge crossings strictly left of it on its scan line, with each edge
taken half-open in y (y0 <= y < y1). Coverage is samples inside / S^2, so both ports
produce identical values.

Region contours are the ordered loops of Google MediaPipe Face Mesh topology
(468 points, 478 with irises), as published in its face_mesh_connections module.
Landmarks are given normalised (0..1 of width and height, MediaPipe's output) or in
pixels. These masks select where an edit may act; they are not measurements.

Face-mapping credits (decisions.md 2026-10-22 6:43 PM; licences.json "concepts"):
  * runtime data: MediaPipe Face Landmarker mesh topology (contour index loops), Bucket A.
  * concept only, no code copied: face-parsing.PyTorch (named facial region classes
    such as skin, brows, eyes and lips, built here from mesh polygons instead of a
    learned parser). Ideas came from its README only.

R13: a self-intersecting contour (face oval, eyes, brows, outer lips) falls back to
its convex hull, and a closed eye or closed mouth is reported as an explicit
"not visible" state instead of an unexplained empty mask. Both are measured from the
mesh geometry alone; a displaced or missing feature still counts as invalid.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Iterable, Mapping, Sequence
from typing import Any

import numpy as np

from .masks import Mask, empty, subtract, union

MAX_SUPERSAMPLE = 16

FACE_OVAL = (10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
             400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
             54, 103, 67, 109)
LIPS_OUTER = (61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0,
              37, 39, 40, 185)
LIPS_INNER = (78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13,
              82, 81, 80, 191)
RIGHT_EYE = (33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246)
LEFT_EYE = (263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466)
RIGHT_BROW = (46, 53, 52, 65, 55, 107, 66, 105, 63, 70)
LEFT_BROW = (276, 283, 282, 295, 285, 336, 296, 334, 293, 300)
RIGHT_IRIS = (468, (469, 470, 471, 472))
LEFT_IRIS = (473, (474, 475, 476, 477))

CONTOURS: dict[str, tuple[int, ...]] = {
    "face_oval": FACE_OVAL, "lips_outer": LIPS_OUTER, "lips_inner": LIPS_INNER,
    "right_eye": RIGHT_EYE, "left_eye": LEFT_EYE, "right_brow": RIGHT_BROW, "left_brow": LEFT_BROW,
}
IRIS_SEGMENTS = 32

REGIONS = ("face_oval", "lips", "mouth_opening", "right_eye", "left_eye", "eyes",
           "right_brow", "left_brow", "brows", "right_iris", "left_iris", "irises", "skin")

# Contours that may fall back to their convex hull when the loop crosses itself.
# The inner lip loop is excluded: a closed mouth legitimately crosses itself.
# ASSUMED (C16 value): nose-tip shift toward a folded eye, as a share of the eye distance.
FOLD_NOSE_SHIFT = 0.10
HULL_FALLBACK = ("face_oval", "right_eye", "left_eye", "right_brow", "left_brow", "lips_outer")
# Eyelid opening / eye width below which an eye is closed (ASSUMED; an open eye is
# about 0.25-0.35). Inner-lip opening / mouth width below which a mouth is closed.
EYE_CLOSED_RATIO = 0.08
MOUTH_CLOSED_RATIO = 0.02
EYE_LIDS = {"right": (159, 145, 33, 133), "left": (386, 374, 263, 362)}
MOUTH_LIPS = (13, 14, 61, 291)
VERSION = "visible-regions-r13/1"


def _orientation(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    return float((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]))


def self_intersects(points: Sequence[Sequence[float]] | np.ndarray) -> bool:
    """True when two non-adjacent edges of the closed loop properly cross."""
    verts = _vertices(points)
    n = len(verts)
    edges = [(verts[i], verts[(i + 1) % n]) for i in range(n)]
    for i in range(n):
        a, b = edges[i]
        if np.array_equal(a, b):
            continue
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            c, d = edges[j]
            if np.array_equal(c, d):
                continue
            o1, o2 = _orientation(a, b, c), _orientation(a, b, d)
            o3, o4 = _orientation(c, d, a), _orientation(c, d, b)
            if o1 * o2 < 0 and o3 * o4 < 0:
                return True
    return False


def convex_hull(points: Sequence[Sequence[float]] | np.ndarray) -> np.ndarray:
    """Andrew's monotone chain, counter-clockwise, no repeated end point."""
    verts = _vertices(points)
    unique = sorted({(float(x), float(y)) for x, y in verts})
    if len(unique) < 3:
        return np.asarray(unique, dtype=np.float64).reshape(-1, 2)

    def cross(o: tuple[float, float], a: tuple[float, float], b: tuple[float, float]) -> float:
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower: list[tuple[float, float]] = []
    for p in unique:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper: list[tuple[float, float]] = []
    for p in reversed(unique):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return np.asarray(lower[:-1] + upper[:-1], dtype=np.float64)


def _inside(poly: np.ndarray, x: float, y: float) -> bool:
    crossings = scanline_crossings(poly, y)
    return bool(np.searchsorted(crossings, x, side="left") % 2 == 1)


def _vertices(points: Sequence[Sequence[float]] | np.ndarray) -> np.ndarray:
    arr = np.asarray(points, dtype=np.float64)
    if arr.ndim != 2 or arr.shape[1] != 2 or len(arr) < 3:
        raise ValueError("a polygon needs at least three (x, y) points")
    if not np.all(np.isfinite(arr)):
        raise ValueError("polygon points must be finite")
    return arr


def scanline_crossings(vertices: np.ndarray, y: float) -> np.ndarray:
    """Sorted x positions where the closed polygon crosses the horizontal line y."""
    x0, y0 = vertices[:, 0], vertices[:, 1]
    x1, y1 = np.roll(x0, -1), np.roll(y0, -1)
    hit = ((y0 <= y) & (y < y1)) | ((y1 <= y) & (y < y0))
    if not hit.any():
        return np.empty(0)
    a0, b0, a1, b1 = x0[hit], y0[hit], x1[hit], y1[hit]
    return np.sort(a0 + (y - b0) * (a1 - a0) / (b1 - b0))


def polygon(height: int, width: int, points: Sequence[Sequence[float]] | np.ndarray,
            supersample: int = 4) -> Mask:
    """Anti-aliased even-odd fill of a closed polygon given in pixel coordinates."""
    if min(height, width) <= 0:
        raise ValueError("positive mask dimensions required")
    if not 1 <= supersample <= MAX_SUPERSAMPLE:
        raise ValueError(f"supersample must be 1..{MAX_SUPERSAMPLE}")
    verts = _vertices(points)
    out = empty(height, width)
    top = max(0, math.floor(verts[:, 1].min()))
    bottom = min(height, math.ceil(verts[:, 1].max()) + 1)
    left = max(0, math.floor(verts[:, 0].min()))
    right = min(width, math.ceil(verts[:, 0].max()) + 1)
    if top >= bottom or left >= right:
        return out
    s = supersample
    offsets = (np.arange(s) + 0.5) / s
    xs = (np.arange(left, right)[:, None] + offsets[None, :]).ravel()
    for row in range(top, bottom):
        counts = np.zeros(right - left, dtype=np.int64)
        for oy in offsets:
            crossings = scanline_crossings(verts, row + oy)
            if not crossings.size:
                continue
            inside = np.searchsorted(crossings, xs, side="left") % 2 == 1
            counts += inside.reshape(right - left, s).sum(axis=1)
        out[row, left:right] = counts / (s * s)
    return out


def landmark_points(landmarks: Any, height: int, width: int, *,
                    normalized: bool = True) -> np.ndarray:
    """(N, 2) pixel coordinates from arrays, (x, y[, z]) tuples or {"x", "y"} mappings."""
    if isinstance(landmarks, np.ndarray):
        arr = np.asarray(landmarks, dtype=np.float64)
    else:
        rows: list[tuple[float, float]] = []
        for item in landmarks:
            if isinstance(item, Mapping):
                rows.append((float(item["x"]), float(item["y"])))
            else:
                rows.append((float(item[0]), float(item[1])))
        arr = np.asarray(rows, dtype=np.float64)
    if arr.ndim != 2 or arr.shape[1] < 2 or not np.all(np.isfinite(arr[:, :2])):
        raise ValueError("landmarks must be finite (x, y) points")
    pts = arr[:, :2].copy()
    if normalized:
        pts[:, 0] *= width
        pts[:, 1] *= height
    return pts


def _contour(points: np.ndarray, indices: Iterable[int]) -> np.ndarray:
    idx = list(indices)
    if max(idx) >= len(points):
        raise ValueError(f"landmark {max(idx)} is missing; this region needs a full face mesh")
    return points[idx]


def iris_outline(points: np.ndarray, which: tuple[int, tuple[int, ...]]) -> np.ndarray:
    """Projected iris ellipse through its paired edge landmarks.

    The old mean-radius circle made a profile iris wider than the visible eye.
    Opposite landmark pairs retain the measured foreshortening and orientation;
    they do not infer anatomy or fill the part covered by an eyelid.
    """
    centre_idx, edge_idx = which
    if centre_idx >= len(points) or max(edge_idx) >= len(points):
        raise ValueError("iris regions need the 478-point mesh (refine_landmarks)")
    centre = points[centre_idx]
    edges = points[list(edge_idx)]
    across = (edges[0] - edges[2]) / 2
    down = (edges[1] - edges[3]) / 2
    angles = np.arange(IRIS_SEGMENTS) * (2 * math.pi / IRIS_SEGMENTS)
    return centre + np.outer(np.cos(angles), across) + np.outer(np.sin(angles), down)


class _RegionBuilder:
    """One face's lazy polygon cache, with explicit visible-surface containment.

    No pixels or colour data are consumed. On a turned face a far eye or brow can
    project outside the visible oval. Edits must not paint that polygon onto hair,
    headwear or background. Child masks therefore use the fully covered pixels of
    the visible oval. Keeping the fractional outside pixel out of the child also
    prevents two independent antialias coverages being mistaken for actual overlap.
    The source contours remain available to diagnostics; a bad mesh is not repaired
    by extending the oval or claiming an empty feature is valid.
    """

    def __init__(self, landmarks: Any, height: int, width: int, *,
                 normalized: bool, supersample: int) -> None:
        self.points = landmark_points(landmarks, height, width, normalized=normalized)
        self.height, self.width, self.supersample = height, width, supersample
        self.raw: dict[str, Mask] = {}
        self.visible: dict[str, Mask] = {}
        self.hulls: list[str] = []
        from ..eyes.turn_visibility import turn_evidence

        self.turn = turn_evidence(
            self.points, landmarks, EYE_LIDS, CONTOURS,
            depth_scale=float(width) if normalized else 1.0,
        )

    def head_loop(self) -> np.ndarray:
        """The face-oval loop with only the self-crossing hull fallback (no turn fallback)."""
        verts = _contour(self.points, CONTOURS["face_oval"])
        if self_intersects(verts):
            hull = convex_hull(verts)
            if len(hull) >= 3:
                return hull
        return verts

    def folded_side(self) -> str | None:
        """The eye whose corners have swapped order along the line between the eyes.

        Past about 80 degrees of turn the far eye folds behind the nose: its outer and inner
        corners project in reverse order, and its width can grow again, so the width ratio
        alone no longer flags it. A swapped eye with the other eye in normal order is
        measured evidence of the turn, from landmark positions only, but only when the nose
        tip (1) has also moved toward that side by at least FOLD_NOSE_SHIFT of the distance
        between the eye centres, so swapped corners on a frontal face are not a turn.
        """
        if len(self.points) <= max(max(CONTOURS["right_eye"]), max(CONTOURS["left_eye"])):
            return None
        right = _contour(self.points, CONTOURS["right_eye"]).mean(axis=0)
        left = _contour(self.points, CONTOURS["left_eye"]).mean(axis=0)
        axis = left - right
        norm = float(np.hypot(*axis))
        if norm <= 1e-9:
            return None
        axis = axis / norm
        signed_right = float((self.points[133] - self.points[33]) @ axis)
        signed_left = float((self.points[263] - self.points[362]) @ axis)
        shift = float((self.points[1] - (right + left) / 2) @ axis) / norm
        if signed_right <= 0 < signed_left and shift <= -FOLD_NOSE_SHIFT:
            return "right"
        if signed_left <= 0 < signed_right and shift >= FOLD_NOSE_SHIFT:
            return "left"
        return None

    def turn_side(self) -> str | None:
        """The side a measured turn hides: the narrow eye, or a folded one."""
        return self.turn.candidate or self.folded_side()

    def oval_folded(self) -> bool:
        """A turn is measured and an eye centre lies outside the raw face-oval loop.

        On a strongly turned head the far-side oval landmarks fold back over the face, so
        the raw loop no longer covers the visible face and the near eye and lips fall
        outside it. Only a measured turn candidate (turn_visibility) enables this; a
        frontal face, or a displaced eye without a turn, is never changed by it.
        """
        if self.turn_side() is None:
            return False
        oval = self.head_loop()
        for side in ("right", "left"):
            centre = _contour(self.points, CONTOURS[side + "_eye"]).mean(axis=0)
            if not _inside(oval, float(centre[0]), float(centre[1])):
                return True
        return False

    def loop(self, name: str) -> np.ndarray:
        """Contour vertices, or their convex hull when the loop crosses itself (or, for the
        face oval, when a measured head turn has folded it: see oval_folded)."""
        verts = _contour(self.points, CONTOURS[name])
        folded = name == "face_oval" and self.oval_folded()
        if name in HULL_FALLBACK and (folded or self_intersects(verts)):
            hull = convex_hull(verts)
            if len(hull) >= 3:
                if name not in self.hulls:
                    self.hulls.append(name)
                return hull
        return verts

    def contour(self, name: str) -> Mask:
        if name not in self.raw:
            self.raw[name] = polygon(self.height, self.width, self.loop(name), self.supersample)
        return self.raw[name]

    def _ratio(self, ids: tuple[int, int, int, int]) -> float:
        if max(ids) >= len(self.points):
            return 1.0
        a, b, c, d = (self.points[i] for i in ids)
        width = float(np.hypot(*(d - c)))
        return float(np.hypot(*(b - a))) / width if width > 1e-9 else 0.0

    def eye_closed(self, side: str) -> bool:
        return self._ratio(EYE_LIDS[side]) < EYE_CLOSED_RATIO

    def mouth_closed(self) -> bool:
        return self._ratio(MOUTH_LIPS) < MOUTH_CLOSED_RATIO

    def eye_on_face(self, side: str) -> bool:
        """The eye's landmark centre lies inside the face oval (hulled only when it crosses
        itself; the turn fallback is not used here, so a turned-away eye is still found)."""
        centre = _contour(self.points, CONTOURS[side + "_eye"]).mean(axis=0)
        return _inside(self.head_loop(), float(centre[0]), float(centre[1]))

    def hidden_by_turn(self, side: str) -> bool:
        """Never excuse a narrow feature without depth or head-contour evidence."""
        if self.turn_side() != side:
            return False
        if self.turn.candidate is None:
            return True  # folded_side: swapped corners are themselves the evidence
        return self.turn.supported_by_depth or not self.eye_on_face(side)

    def closed_reason(self, name: str) -> str | None:
        """Recognize measured closure or turn occlusion, not arbitrary absence."""
        if name in ("right_eye", "right_iris", "right_brow"):
            if self.hidden_by_turn("right"):
                return "hidden_by_turn"
            if name != "right_brow" and self.eye_closed("right") and self.eye_on_face("right"):
                return "closed"
        if name in ("left_eye", "left_iris", "left_brow"):
            if self.hidden_by_turn("left"):
                return "hidden_by_turn"
            if name != "left_brow" and self.eye_closed("left") and self.eye_on_face("left"):
                return "closed"
        if name in ("eyes", "irises", "brows"):
            kind = "brow" if name == "brows" else "eye"
            parts = (self.closed_reason(side + "_" + kind) for side in ("right", "left"))
            reasons = tuple(parts)
            if all(reasons):
                return "hidden_by_turn" if "hidden_by_turn" in reasons else "closed"
        if name == "mouth_opening" and self.mouth_closed():
            return "closed"
        return None

    def state(self, name: str) -> str:
        """"visible", "not_visible:<reason>" or "empty" (an unexplained failure)."""
        if float(self.get(name).sum()) > 0:
            return "visible"
        reason = self.closed_reason(name)
        return f"not_visible:{reason}" if reason else "empty"

    def contained(self, name: str) -> Mask:
        if name not in self.visible:
            if name in ("right_eye", "left_eye", "right_brow", "left_brow"):
                side = name.split("_", 1)[0]
                if self.hidden_by_turn(side):
                    self.visible[name] = empty(self.height, self.width)
                    return self.visible[name]
            # The complete oval alpha is retained for face-wide operations. Only
            # child features use the conservative support: no outward dilation.
            support = self.contour("face_oval") >= 1 - 1e-6
            self.visible[name] = np.where(support, self.contour(name), 0).astype(np.float32)
        return self.visible[name]

    def iris(self, side: str) -> Mask:
        key = side + "_iris"
        if key not in self.visible:
            if self.hidden_by_turn(side):
                self.visible[key] = empty(self.height, self.width)
                return self.visible[key]
            which = RIGHT_IRIS if side == "right" else LEFT_IRIS
            raw = polygon(self.height, self.width, iris_outline(self.points, which), self.supersample)
            # Iris overlays stay under the visible eyelid, including squinting.
            self.visible[key] = np.minimum(raw, self.contained(side + "_eye"))
        return self.visible[key]

    def get(self, name: str) -> Mask:
        if name not in REGIONS:
            raise ValueError(f"unknown region {name!r}; choose from {', '.join(REGIONS)}")
        if name == "face_oval":
            return self.contour(name)
        if name in CONTOURS:
            return self.contained(name)
        if name == "lips":
            return subtract(self.contained("lips_outer"), self.contained("lips_inner"))
        if name == "mouth_opening":
            return np.minimum(self.contained("lips_inner"), self.contained("lips_outer"))
        if name == "eyes":
            return union(self.contained("right_eye"), self.contained("left_eye"))
        if name == "brows":
            return union(self.contained("right_brow"), self.contained("left_brow"))
        if name == "right_iris":
            return self.iris("right")
        if name == "left_iris":
            return self.iris("left")
        if name == "irises":
            return union(self.iris("right"), self.iris("left"))
        excluded = union(self.contained("right_eye"), self.contained("left_eye"),
                         self.contained("right_brow"), self.contained("left_brow"),
                         self.contained("lips_outer"))
        return subtract(self.contour("face_oval"), excluded)


def region_mask(name: str, landmarks: Any, height: int, width: int, *,
                normalized: bool = True, supersample: int = 4) -> Mask:
    """A named visible-face mask; no skin-colour or exposure threshold is applied."""
    return _RegionBuilder(landmarks, height, width, normalized=normalized,
                          supersample=supersample).get(name)


def region_masks(landmarks: Any, height: int, width: int, *, names: Sequence[str] = REGIONS,
                 normalized: bool = True, supersample: int = 4) -> dict[str, Mask]:
    """Build requested regions once per face, sharing expensive polygon rasterization."""
    builder = _RegionBuilder(landmarks, height, width, normalized=normalized,
                             supersample=supersample)
    return {name: builder.get(name) for name in names}


def region_states(landmarks: Any, height: int, width: int, *, names: Sequence[str] = REGIONS,
                  normalized: bool = True, supersample: int = 4) -> dict[str, str]:
    """Per region: visible, not_visible:<reason>, or unexplained empty."""
    builder = _RegionBuilder(landmarks, height, width, normalized=normalized,
                             supersample=supersample)
    return {name: builder.state(name) for name in names}


def region_diagnostics(landmarks: Any, height: int, width: int, *,
                       normalized: bool = True, supersample: int = 4,
                       include_reasons: bool = False) -> dict[str, Any]:
    """Raw and visible coverage for a gate; never infer demographics from a mask.

    `invalid_geometry` is true for an empty oval, an empty projected eye, an eye
    with less than one quarter of its raw coverage on the face, or an absent mouth.
    An eye declared closed or hidden by a strongly supported head turn is
    reported in `not_visible` instead. A displaced frontal eye stays invalid.
    Such cases stay failures even if conservative clipping makes the retained bits
    fit inside the oval. Raw support is reported so clipping is reviewable.
    These bounds reject broken geometry; the benchmark's 95% eye-containment and
    45--97% skin-share requirements remain independent and unchanged.
    """
    builder = _RegionBuilder(landmarks, height, width, normalized=normalized,
                             supersample=supersample)
    oval = builder.get("face_oval")
    area = float(oval.sum())
    features: dict[str, dict[str, float]] = {}
    invalid = area <= 0
    invalid_reasons: list[str] = ["face_oval_empty"] if invalid else []
    for name in ("right_eye", "left_eye", "right_brow", "left_brow", "lips_outer", "lips_inner"):
        raw = builder.contour(name)
        kept = builder.contained(name)
        raw_area = float(raw.sum())
        raw_support = float((raw * oval).sum()) / raw_area if raw_area else 0.0
        features[name] = {
            "raw_area_px": raw_area,
            "visible_area_px": float(kept.sum()),
            "raw_support_share": raw_support,
            "retained_share": float(kept.sum()) / raw_area if raw_area else 0.0,
        }
        if name in ("right_eye", "left_eye", "lips_outer"):
            bad = raw_area <= 0 or raw_support < 0.25 or not np.any(kept > 0)
            if bad and name != "lips_outer" and builder.closed_reason(name) is not None:
                bad = False
            if bad:
                if raw_area <= 0:
                    invalid_reasons.append(name + ":empty_raw_contour")
                elif raw_support < 0.25:
                    invalid_reasons.append(name + ":outside_visible_oval")
                else:
                    invalid_reasons.append(name + ":empty_clipped_contour")
            invalid = invalid or bad
    eyes, skin = builder.get("eyes"), builder.get("skin")
    eye_area = float(eyes.sum())
    not_visible = {name: state.split(":", 1)[1] for name in REGIONS
                   if (state := builder.state(name)).startswith("not_visible:")}
    if eye_area:
        eyes_inside = float((eyes * oval).sum()) / eye_area
    else:
        # Containment of no visible eye is vacuous only when both are declared closed.
        eyes_inside = 1.0 if "eyes" in not_visible else 0.0
    result: dict[str, Any] = {
        "version": VERSION,
        "colour_dependent": False,
        "face_area_px": area,
        "skin_share": float(skin.sum()) / area if area else 0.0,
        "eyes_inside": eyes_inside,
        "invalid_geometry": bool(invalid),
        "features": features,
        "not_visible": not_visible,
        "hull_fallback": list(builder.hulls),
    }
    if include_reasons:
        result["invalid_reasons"] = invalid_reasons
    return result

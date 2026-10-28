"""Landmark zones and shared measurements for the local skin touch-up tools (#26, #27, #28).

The three tools (blemish healing, line softening, under-eye correction) edit only inside
zones built from the 478-point face mesh, always clipped to the visible skin region of
engines/core/regions.py (face oval minus eyes, brows and lips):

* forehead: the upper face oval down to just above the brows,
* glabella: the skin between the inner brow heads,
* crow_feet: an ellipse beside each outer eye corner,
* under_eye: a crescent under each lower lid, starting a small gap below the lashes,
* nasolabial: a capsule from beside each nose wing to beside each mouth corner.

Sizes are shares of each eye's corner-to-corner width (ASSUMED proportions, chosen on drawn
faces; real-face placement is not measured yet). The mesh is in pixel coordinates.

Shared pieces: the coded mesh refusal (core/refusal.py codes), a normalised local mean,
4-neighbour connected components in row-major order, Lab write-back that keeps alpha, and
the identity check every tool runs before it returns an edit (mean CIE76 colour change over
the face skin must stay small; geometry is never moved by these tools).

Every operation is ordered so that web/src/engines/skin/local-zones.ts gives the same
numbers. Local simulation only; general cosmetic information, not medical advice.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections import deque
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from typing import Any, Literal

import numpy as np
from numpy.typing import NDArray

from ..core import refusal, regions
from ..core.distance import erode
from ..core.filters import box_mean
from ..core.masks import blur
from ..shade.colourspace import lab_to_srgb, srgb_to_lab, to_bytes

Floats = NDArray[np.float64]
Bools = NDArray[np.bool_]
Status = Literal["edited", "not_applicable", "refused"]

VERSION = "skin-touch-up/1"
NOT_MEDICAL = "General cosmetic information, not medical advice."
ZONES = ("forehead", "glabella", "crow_feet", "under_eye", "nasolabial")
SIDES = ("right", "left")  # the subject's right and left, as in the mesh

LOWER_LID = {"right": (33, 7, 163, 144, 145, 153, 154, 155, 133),
             "left": (263, 249, 390, 373, 374, 380, 381, 382, 362)}
EYE_CORNERS = {"right": (33, 133), "left": (263, 362)}
IRIS_CENTRES = {"right": 468, "left": 473}
FOREHEAD_OVAL = (54, 103, 67, 109, 10, 338, 297, 332, 284)
BROW_TOP = (300, 293, 334, 296, 336, 107, 66, 105, 63, 70)   # left outer -> inner, right inner -> outer
INNER_BROWS = (55, 107, 285, 336)
NOSE_WING = {"right": 129, "left": 358}
MOUTH_CORNER = {"right": 61, "left": 291}

# Zone proportions, as shares of the eye width (ASSUMED).
LID_GAP = 0.06
UNDER_EYE_DEPTH = 0.45
BROW_GAP = 0.15
CROW_OFFSET, CROW_RX, CROW_RY = 0.55, 0.45, 0.55
GLABELLA_RY, GLABELLA_DROP, GLABELLA_RX_SHARE = 0.45, 0.10, 0.35
FOLD_START, FOLD_END, FOLD_RADIUS = 0.20, 0.15, 0.16
FEATHER = 0.06
ELLIPSE_POINTS = 32
CAP_POINTS = 12

# Identity check (ASSUMED until real-face gates measure it): the mean CIE76 change over the
# whole face skin. Local touch-ups move it by a fraction of one unit; a larger change means
# the tool did more than a touch-up and the edit is refused.
GUARD_MEAN_DELTA_E = 1.5
MIN_SKIN_PIXELS = 16

MESSAGES: dict[str, str] = {
    **refusal.REASONS,
    "edited": "Local touch-up made.",
    "zero_strength": "Strength is zero, so the photo is unchanged.",
    "nothing_to_heal": "No spot to heal was found or marked. Natural marks are kept.",
    "no_lines_found": "No fine lines were found in the chosen zones.",
    "no_dark_circle": "The under-eye skin already matches the cheek, so nothing was changed.",
    "zone_not_visible": "The chosen zone is not visible enough in this photo.",
    "no_skin_visible": "Not enough visible skin to edit.",
    "identity_guard": "This change would alter the face too much, so it was not applied.",
}


@dataclass(frozen=True)
class TouchUpResult:
    image: NDArray[np.uint8]
    alpha: NDArray[np.float64]
    status: Status
    reason_code: str
    label: str
    report: dict[str, Any] = field(default_factory=dict)

    @property
    def message(self) -> str:
        return MESSAGES[self.reason_code]

    def to_json(self) -> dict[str, Any]:
        return {"version": VERSION, "status": self.status, "reason_code": self.reason_code,
                "message": self.message, "label": self.label, "report": self.report}


@dataclass(frozen=True)
class Frame:
    iod: float
    u: tuple[float, float]          # unit vector from the right iris to the left iris
    d: tuple[float, float]          # unit vector down the face, perpendicular to u
    eye_width: dict[str, float]


def check_photo(image: object, strength: float) -> NDArray[np.uint8]:
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4) or min(img.shape[:2]) < 8:
        raise ValueError("skin touch-up needs an RGB or RGBA uint8 photo at least 8 by 8")
    if isinstance(strength, bool) or not isinstance(strength, (int, float)) or not math.isfinite(strength):
        raise ValueError("strength must be a finite number")
    if not 0 <= strength <= 100:
        raise ValueError("strength must be 0..100")
    return img


def mesh_points(landmarks: object) -> Floats:
    try:
        arr = np.asarray(landmarks, dtype=np.float64)
    except (TypeError, ValueError) as exc:
        raise ValueError("landmarks must be 478 (x, y) pixel points") from exc
    if arr.ndim != 2 or arr.shape[1] < 2:
        raise ValueError("landmarks must be 478 (x, y) pixel points")
    return arr[:, :2].copy()


def mesh_refusal(points: Floats, height: int, width: int) -> str | None:
    codes = refusal.inspect_mesh(points, height, width)
    return codes[0] if codes else None


def unchanged(image: NDArray[np.uint8], status: Status, code: str, label: str,
              report: dict[str, Any] | None = None) -> TouchUpResult:
    return TouchUpResult(image.copy(), np.zeros(image.shape[:2], dtype=np.float64), status, code, label,
                         dict(report or {}))


def half_up(x: float) -> int:
    """Round half up (Math.round in the browser); Python's round() would round half to even."""
    return math.floor(x + 0.5)


def _unit(x: float, y: float) -> tuple[float, float]:
    n = math.hypot(x, y)
    return (x / n, y / n) if n > 0 else (1.0, 0.0)


def face_frame(points: Floats) -> Frame:
    r, le = points[IRIS_CENTRES["right"]], points[IRIS_CENTRES["left"]]
    u = _unit(float(le[0] - r[0]), float(le[1] - r[1]))
    widths = {side: float(math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1]))
              for side, (a, b) in EYE_CORNERS.items()}
    return Frame(float(math.hypot(le[0] - r[0], le[1] - r[1])), u, (-u[1], u[0]), widths)


def outward(frame: Frame, side: str) -> tuple[float, float]:
    """Away from the face midline: the subject's right is toward -u."""
    return (-frame.u[0], -frame.u[1]) if side == "right" else frame.u


def ellipse(cx: float, cy: float, rx: float, ry: float, axis: tuple[float, float],
            n: int = ELLIPSE_POINTS) -> list[tuple[float, float]]:
    ax, ay = axis
    out = []
    for k in range(n):
        t = 2.0 * math.pi * k / n
        c, s = math.cos(t) * rx, math.sin(t) * ry
        out.append((cx + c * ax - s * ay, cy + c * ay + s * ax))
    return out


def capsule(a: tuple[float, float], b: tuple[float, float], radius: float,
            n: int = CAP_POINTS) -> list[tuple[float, float]]:
    dx, dy = _unit(b[0] - a[0], b[1] - a[1])
    base = math.atan2(dy, dx)
    out = []
    for end, start in ((b, base - math.pi / 2), (a, base + math.pi / 2)):
        for k in range(n + 1):
            t = start + math.pi * k / n
            out.append((end[0] + radius * math.cos(t), end[1] + radius * math.sin(t)))
    return out


def under_eye_polygon(points: Floats, frame: Frame, side: str,
                      depth_share: float = UNDER_EYE_DEPTH) -> list[tuple[float, float]]:
    ew = frame.eye_width[side]
    dx, dy = frame.d
    lid = [points[i] for i in LOWER_LID[side]]
    last = len(lid) - 1
    gap = LID_GAP * ew
    upper = [(float(p[0]) + dx * gap, float(p[1]) + dy * gap) for p in lid]
    lower = []
    for k, p in enumerate(lid):
        drop = gap + depth_share * ew * (0.25 + 0.75 * math.sin(math.pi * k / last))
        lower.append((float(p[0]) + dx * drop, float(p[1]) + dy * drop))
    return upper + lower[::-1]


def cheek_reference_polygon(points: Floats, frame: Frame, side: str,
                            depth_share: float = UNDER_EYE_DEPTH) -> list[tuple[float, float]]:
    ew = frame.eye_width[side]
    centre = points[LOWER_LID[side][4]]
    drop = (LID_GAP + depth_share + 0.3) * ew
    return ellipse(float(centre[0]) + frame.d[0] * drop, float(centre[1]) + frame.d[1] * drop,
                   0.4 * ew, 0.18 * ew, frame.u)


def zone_polygons(points: Floats, frame: Frame, name: str) -> list[list[tuple[float, float]]]:
    ew = (frame.eye_width["right"] + frame.eye_width["left"]) / 2
    ux, uy = frame.u
    dx, dy = frame.d
    if name == "forehead":
        top = [(float(points[i][0]), float(points[i][1])) for i in FOREHEAD_OVAL]
        brows = [(float(points[i][0]) - dx * BROW_GAP * ew, float(points[i][1]) - dy * BROW_GAP * ew)
                 for i in BROW_TOP]
        return [top + brows]
    if name == "glabella":
        heads = [points[i] for i in INNER_BROWS]
        cx = sum(float(p[0]) for p in heads) / 4 + dx * GLABELLA_DROP * ew
        cy = sum(float(p[1]) for p in heads) / 4 + dy * GLABELLA_DROP * ew
        gap = math.hypot(points[55][0] - points[285][0], points[55][1] - points[285][1])
        return [ellipse(cx, cy, GLABELLA_RX_SHARE * gap, GLABELLA_RY * ew, frame.u)]
    if name == "crow_feet":
        out = []
        for side in SIDES:
            w = frame.eye_width[side]
            ox, oy = outward(frame, side)
            corner = points[EYE_CORNERS[side][0]]
            out.append(ellipse(float(corner[0]) + ox * CROW_OFFSET * w, float(corner[1]) + oy * CROW_OFFSET * w,
                               CROW_RX * w, CROW_RY * w, frame.u))
        return out
    if name == "under_eye":
        return [under_eye_polygon(points, frame, side) for side in SIDES]
    if name == "nasolabial":
        out = []
        for side in SIDES:
            ox, oy = outward(frame, side)
            wing, corner = points[NOSE_WING[side]], points[MOUTH_CORNER[side]]
            a = (float(wing[0]) + ox * FOLD_START * ew, float(wing[1]) + oy * FOLD_START * ew)
            b = (float(corner[0]) + ox * FOLD_END * ew, float(corner[1]) + oy * FOLD_END * ew)
            out.append(capsule(a, b, FOLD_RADIUS * ew))
        return out
    raise ValueError(f"unknown zone {name!r}; choose from {', '.join(ZONES)}")


def skin_region(points: Floats, height: int, width: int) -> Bools:
    mask: Bools = regions.region_mask("skin", points, height, width, normalized=False) >= 0.5
    return mask


def feather_radius(frame: Frame) -> int:
    ew = (frame.eye_width["right"] + frame.eye_width["left"]) / 2
    return max(1, half_up(FEATHER * ew))


def polygons_mask(polys: Iterable[Sequence[tuple[float, float]]], height: int, width: int,
                  skin: Bools, radius: int) -> NDArray[np.float32]:
    """Union of polygons, softened by a box blur, then clipped to the visible skin."""
    raw = np.zeros((height, width), dtype=np.float32)
    for poly in polys:
        raw = np.maximum(raw, regions.polygon(height, width, poly))
    soft = blur(raw, radius)
    return np.where(skin, soft, np.float32(0)).astype(np.float32)


def zone_mask(points: Floats, height: int, width: int, names: Sequence[str], skin: Bools,
              frame: Frame | None = None) -> NDArray[np.float32]:
    fr = frame or face_frame(points)
    if not names or any(n not in ZONES for n in names) or len(set(names)) != len(names):
        raise ValueError(f"zones must be distinct names from {', '.join(ZONES)}")
    polys = [p for name in names for p in zone_polygons(points, fr, name)]
    return polygons_mask(polys, height, width, skin, feather_radius(fr))


def lab_of(image: NDArray[np.uint8]) -> Floats:
    lab: Floats = srgb_to_lab(image[..., :3])
    return lab


def local_mean(values: Floats, weight: Bools, radius: int, fallback: Floats | None = None) -> Floats:
    """Mean of `values` over the weighted pixels of each (2r+1)^2 window (box_mean ratio)."""
    w = weight.astype(np.float64)
    den = box_mean(w, radius)
    num = box_mean(values * w[..., None], radius) if values.ndim == 3 else box_mean(values * w, radius)
    base = values if fallback is None else fallback
    if values.ndim == 3:
        ok = den[..., None] > 1e-9
        safe = np.where(den > 1e-9, den, 1.0)[..., None]
    else:
        ok = den > 1e-9
        safe = np.where(den > 1e-9, den, 1.0)
    out: Floats = np.where(ok, num / safe, base)
    return out


def components(mask: Bools) -> list[NDArray[np.int64]]:
    """4-neighbour components as sorted flat indices, in row-major order of first pixel."""
    h, w = mask.shape
    flat = mask.ravel()
    seen = np.zeros(h * w, dtype=bool)
    out: list[NDArray[np.int64]] = []
    for start in np.flatnonzero(flat).tolist():
        if seen[start]:
            continue
        seen[start] = True
        queue = deque([start])
        members = []
        while queue:
            i = queue.popleft()
            members.append(i)
            x, y = i % w, i // w
            for j, ok in ((i - w, y > 0), (i - 1, x > 0), (i + 1, x < w - 1), (i + w, y < h - 1)):
                if ok and flat[j] and not seen[j]:
                    seen[j] = True
                    queue.append(j)
        out.append(np.asarray(sorted(members), dtype=np.int64))
    return out


def median_lab(lab: Floats, mask: Bools) -> tuple[float, float, float]:
    sel = lab[mask]
    return (float(np.median(sel[:, 0])), float(np.median(sel[:, 1])), float(np.median(sel[:, 2])))


def write_lab(image: NDArray[np.uint8], lab: Floats, changed: Bools) -> NDArray[np.uint8]:
    """Encode the changed pixels' Lab to sRGB bytes; every other byte and all alpha stay."""
    out = image.copy()
    if changed.any():
        out[changed, :3] = to_bytes(lab_to_srgb(lab[changed]))
    return out


def eroded_skin(skin: Bools, margin: float) -> Bools:
    area: Bools = erode(skin.astype(np.float32), margin) >= 0.5 if margin > 0 else skin.copy()
    return area


def identity_check(before: NDArray[np.uint8], after: NDArray[np.uint8], skin: Bools) -> dict[str, Any]:
    """Mean and largest CIE76 change over the face skin, and the share of skin pixels touched."""
    count = int(skin.sum())
    if count == 0:
        return {"skin_pixels": 0, "mean_delta_e": 0.0, "max_delta_e": 0.0, "changed_share": 0.0, "holds": True}
    a, b = lab_of(before)[skin], lab_of(after)[skin]
    diff = a - b
    de = np.sqrt(diff[:, 0] * diff[:, 0] + diff[:, 1] * diff[:, 1] + diff[:, 2] * diff[:, 2])
    total = 0.0
    for v in de.tolist():
        total += v
    mean = total / count
    touched = int(np.any(before[skin, :3] != after[skin, :3], axis=1).sum())
    return {"skin_pixels": count, "mean_delta_e": round(mean, 4), "max_delta_e": round(float(de.max()), 4),
            "changed_share": round(touched / count, 6), "holds": mean <= GUARD_MEAN_DELTA_E}


def finish(original: NDArray[np.uint8], edited: NDArray[np.uint8], alpha: Floats, skin: Bools,
           label: str, report: dict[str, Any]) -> TouchUpResult:
    """Run the identity check; refuse (original kept) when it does not hold."""
    check = identity_check(original, edited, skin)
    report = {**report, "identity": check}
    if not check["holds"]:
        return unchanged(original, "refused", "identity_guard", label, report)
    return TouchUpResult(edited, alpha, "edited", "edited", label, report)

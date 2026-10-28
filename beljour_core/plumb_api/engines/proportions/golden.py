"""Conservative local golden-reference shaping on observed 478-point geometry.

Golden ratios are optional reference preferences, never a beauty ranking.
Level 1.0 is the original photograph. The default identity lock limits point
motion using an explicit geometric *proxy*, not an identity-recognition model.
All affected pixels require a verified, caller-supplied semantic person mask.
No automatic slimming, age/gender/race inference or synthetic hidden anatomy.
Face-mapping: MediaPipe Face Landmarker indices (data); Farkas
anthropometry and golden-ratio reference measurements (concept only, no code copied).
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass

import cv2
import numpy as np
from numpy.typing import NDArray

from ...vision.face_picker import compose_selected, mask_array
from ..core.refusal import Refusal
from . import anatomy, ratios, symmetry

Points = NDArray[np.float64]
Photo = NDArray[np.uint8]
GOLDEN_KEYS = ("face_length_width", "mouth_nose_width", "lips_chin")
MIN_LEVEL = 1.0
MAX_LEVEL = 5.0
LEVEL_STEP = 0.1
LOCKED_MAX_MOVE_IOD = 0.02
UNLOCKED_MAX_MOVE_IOD = 0.065
MAX_CACHE_ENTRIES = 2


@dataclass(frozen=True)
class GoldenSnapshot:
    """A photo-scoped, pixel-free cache of target geometry and reference values."""
    revision: str
    fingerprint: str
    before: Points
    full_target: Points
    iod: float
    before_distance: float
    before_values: dict[str, float]
    identity_note: str = "Geometric displacement proxy; independent identity verification not supplied."


@dataclass(frozen=True)
class GoldenResult:
    points: Points
    level: float
    target_distance: float
    before_distance: float
    distance_reduction: float
    max_move_iod: float
    identity_proxy: float
    identity_lock: bool
    refused: bool = False
    reason_code: str = ""

    def counts(self) -> dict[str, float | bool | str]:
        return {"level": self.level, "target_distance": self.target_distance,
                "before_distance": self.before_distance,
                "distance_reduction": self.distance_reduction,
                "max_move_iod": self.max_move_iod, "identity_proxy": self.identity_proxy,
                "identity_lock": self.identity_lock, "refused": self.refused,
                "reason_code": self.reason_code}


@dataclass(frozen=True)
class RenderResult:
    image: Photo
    data: GoldenResult
    selected_mask_pixels: int
    protected_pixels: int
    fold_count: int = 0
    raster_finite: bool = True


def validate_level(level: object) -> float:
    if isinstance(level, bool) or not isinstance(level, (float, int)):
        raise ValueError("level must be a decimal 1.0 through 5.0")
    value = float(level)
    if not math.isfinite(value) or not MIN_LEVEL <= value <= MAX_LEVEL:
        raise ValueError("level must be a decimal 1.0 through 5.0")
    if abs(round(value * 10) - value * 10) > 1e-8:
        raise ValueError("level increments must be exactly 0.1")
    return round(value, 1)


def check_revision(revision: str) -> str:
    if not isinstance(revision, str) or not 1 <= len(revision) <= 128:
        raise ValueError("photo revision must be a bounded nonempty string")
    if not all(c.isascii() and (c.isalnum() or c in "-_:") for c in revision):
        raise ValueError("photo revision contains invalid characters")
    return revision


def _fingerprint(points: Points) -> str:
    return hashlib.sha256(np.ascontiguousarray(points).tobytes()).hexdigest()


def _distance(points: Points) -> tuple[float, dict[str, float]]:
    _, values = ratios.measure_values(points)
    selected: dict[str, float] = {}
    distance = 0.0
    for name in GOLDEN_KEYS:
        actual = values[name]
        ref = anatomy.RATIOS[name][2]["golden"]
        if not isinstance(actual, float) or not isinstance(ref, float):
            raise ValueError("the requested golden ratio cannot be measured")
        if not math.isfinite(actual) or actual <= 0:
            raise ValueError("the face has an invalid target ratio")
        selected[name] = actual
        distance += abs(actual - ref) / ref
    return distance / len(GOLDEN_KEYS), selected


def _anchor_field(points: Points, index: int, movement: tuple[float, float],
                  radius: float) -> Points:
    difference = points - points[index]
    weight = np.exp(-0.5 * np.sum(difference * difference, axis=1) / (radius * radius))
    return weight[:, None] * np.asarray(movement, dtype=np.float64)[None, :]


def _proposals(points: Points, iod: float) -> Points:
    """Move mouth/lip/chin handles toward references; never narrow the jaw."""
    line, values = ratios.measure_values(points)
    mx, my = line.dy, -line.dx
    forward = (line.dx, line.dy)
    mouth = values["mouth_nose_width"]
    length_width = values["face_length_width"]
    lips_chin = values["lips_chin"]
    if isinstance(mouth, list) or isinstance(length_width, list) or isinstance(lips_chin, list):
        raise ValueError("golden controls require scalar measurements")
    phi = anatomy.PHI
    target = np.zeros_like(points)
    mouth_half = (phi / mouth - 1) * np.linalg.norm(points[291] - points[61]) / 2
    mouth_half = float(np.clip(mouth_half, -iod * .12, iod * .12))
    target += _anchor_field(points, 61, (-mx * mouth_half, -my * mouth_half), iod * .16)
    target += _anchor_field(points, 291, (mx * mouth_half, my * mouth_half), iod * .16)
    width = np.linalg.norm(points[454] - points[234])
    chin_delta = float(np.clip((phi - length_width) * width * .16, -iod * .11, iod * .11))
    target += _anchor_field(points, 152, (forward[0] * chin_delta, forward[1] * chin_delta), iod * .19)
    base = (points[2] - [line.cx, line.cy]) @ np.array(forward)
    chin = (points[152] - [line.cx, line.cy]) @ np.array(forward)
    current = (points[13] + points[14]) / 2
    stomion = (current - [line.cx, line.cy]) @ np.array(forward)
    desired = (chin * (1 / phi) + base) / (1 + 1 / phi)
    mouth_y = float(np.clip((desired - stomion) * .18, -iod * .11, iod * .11))
    if not math.isfinite(lips_chin):
        raise ValueError("invalid lips-to-chin measurement")
    target += _anchor_field(points, 13, (forward[0] * mouth_y, forward[1] * mouth_y), iod * .18) * .5
    target += _anchor_field(points, 14, (forward[0] * mouth_y, forward[1] * mouth_y), iod * .18) * .5
    return target


def prepare(points: object, revision: str) -> GoldenSnapshot | Refusal:
    """Read ratio maps once per photo, independent of slider level or skin tone."""
    check_revision(revision)
    try:
        mesh = symmetry.mesh(points, minimum=478)
        iod = symmetry.interocular(mesh)
        if iod < 6:
            raise ValueError("the face is too small to shape safely")
        before_distance, values = _distance(mesh)
        proposal = _proposals(mesh, iod)
        if not np.isfinite(proposal).all():
            raise ValueError("non-finite displacement")
        return GoldenSnapshot(revision, _fingerprint(mesh), mesh, mesh + proposal,
                              iod, before_distance, values)
    except (TypeError, ValueError, FloatingPointError) as exc:
        return Refusal("proportions_control", "invalid_geometry", str(exc)[:120])


def _result(snapshot: GoldenSnapshot, level: float, lock: bool) -> GoldenResult:
    fraction = (level - 1.0) / 4.0
    delta = snapshot.full_target - snapshot.before
    maximum = float(np.max(np.linalg.norm(delta, axis=1)))
    cap = snapshot.iod * (LOCKED_MAX_MOVE_IOD if lock else UNLOCKED_MAX_MOVE_IOD)
    if maximum > cap:
        delta *= cap / maximum
    delta *= fraction
    output = snapshot.before + delta
    post, _ = _distance(output)
    # No regression to a target is allowed, even when anchors interact.
    for _ in range(12):
        if post <= snapshot.before_distance + 1e-10:
            break
        delta *= .5
        output = snapshot.before + delta
        post, _ = _distance(output)
    else:
        output = snapshot.before.copy()
        post = snapshot.before_distance
    motion = float(np.max(np.linalg.norm(output - snapshot.before, axis=1))) / snapshot.iod
    return GoldenResult(output, level, post, snapshot.before_distance,
                        max(0.0, snapshot.before_distance - post), motion,
                        1.0 - motion, lock)


def targets(snapshot: GoldenSnapshot | Refusal, level: object = 1.0,
            *, identity_lock: bool = True) -> GoldenResult | Refusal:
    """The default identity lock is mandatory unless explicitly lowered."""
    if isinstance(snapshot, Refusal):
        return snapshot
    checked = validate_level(level)
    if type(identity_lock) is not bool:
        raise ValueError("identity lock choice must be explicit boolean")
    if checked == MIN_LEVEL:
        return GoldenResult(snapshot.before.copy(), checked, snapshot.before_distance,
                            snapshot.before_distance, 0.0, 0.0, 1.0, identity_lock)
    try:
        return _result(snapshot, checked, identity_lock)
    except (TypeError, ValueError, FloatingPointError) as exc:
        return Refusal("proportions_control", "invalid_geometry", str(exc)[:120])


class GoldenCache:
    """Bounded memory cache for immutable per-photo ratio and target geometry."""

    def __init__(self) -> None:
        self._items: dict[str, GoldenSnapshot] = {}
        self.preparations = 0

    def get(self, points: object, revision: str) -> GoldenSnapshot | Refusal:
        check_revision(revision)
        try:
            arr = symmetry.mesh(points, minimum=478)
        except (TypeError, ValueError) as exc:
            return Refusal("proportions_control", "invalid_geometry", str(exc)[:120])
        fingerprint = _fingerprint(arr)
        existing = self._items.get(revision)
        if existing is not None:
            if existing.fingerprint != fingerprint:
                return Refusal(
                    "proportions_control", "stale_source",
                    "photo revision was reused with different landmarks",
                )
            return existing
        result = prepare(arr, revision)
        if isinstance(result, GoldenSnapshot):
            while len(self._items) >= MAX_CACHE_ENTRIES:
                self._items.pop(next(iter(self._items)))
            self._items[revision] = result
            self.preparations += 1
        return result

    def clear(self) -> None:
        self._items.clear()


def render_preview(original: Photo, snapshot: GoldenSnapshot | Refusal, level: object,
                   selected_mask: object, *, bystanders: tuple[object, ...] = (),
                   identity_lock: bool = True) -> RenderResult | Refusal:
    """Fast bounded source remap, masking only verified selected-person pixels."""
    if isinstance(snapshot, Refusal):
        return snapshot
    result = targets(snapshot, level, identity_lock=identity_lock)
    if isinstance(result, Refusal):
        return result
    image = np.asarray(original)
    if image.ndim != 3 or image.dtype != np.uint8 or image.shape[2] not in (3, 4):
        return Refusal("proportions_control", "invalid_image", "RGB(A) uint8 image required")
    h, w = image.shape[:2]
    try:
        alpha = mask_array(selected_mask, h, w)
        protected = tuple(mask_array(item, h, w) for item in bystanders)
    except (TypeError, ValueError) as exc:
        return Refusal("proportions_control", "unverified_mask", str(exc)[:120])
    if not alpha.any():
        return Refusal("proportions_control", "unverified_mask", "selected face has no validated mask")
    if result.level == 1.0 or result.max_move_iod < 1e-10:
        return RenderResult(image.copy(), result, int(np.count_nonzero(alpha)),
                            sum(int(np.count_nonzero(p)) for p in protected))
    before = snapshot.before
    delta = result.points - before
    # Five independent handles bound CPU cost regardless of 478-point density.
    # Ratios still use every landmark, but preview does not allocate 478 fields.
    indices = np.asarray((61, 291, 152, 13, 14), dtype=np.int64)
    anchors = before[indices]
    shifts = delta[indices]
    moving = np.linalg.norm(shifts, axis=1) > 1e-5
    if not np.any(moving):
        return RenderResult(image.copy(), result, int(np.count_nonzero(alpha)), 0)
    ys, xs = np.indices((h, w), dtype=np.float32)
    influence = np.zeros((h, w), dtype=np.float32)
    step_x = np.zeros((h, w), dtype=np.float32)
    step_y = np.zeros((h, w), dtype=np.float32)
    radius = max(2.0, snapshot.iod * .19)
    for point, move in zip(anchors[moving], shifts[moving], strict=True):
        weight = np.exp(-((xs - point[0]) ** 2 + (ys - point[1]) ** 2) / (2 * radius * radius))
        influence += weight
        step_x += weight * np.float32(move[0])
        step_y += weight * np.float32(move[1])
    moved = influence > 1e-8
    step_x[moved] /= influence[moved]
    step_y[moved] /= influence[moved]
    map_x = xs - step_x
    map_y = ys - step_y
    # Inspect the same inverse sampling map used by the actual renderer.
    # Forward-landmark triangle checks alone cannot certify the raster field.
    dx_x = np.gradient(map_x, axis=1)
    dx_y = np.gradient(map_x, axis=0)
    dy_x = np.gradient(map_y, axis=1)
    dy_y = np.gradient(map_y, axis=0)
    determinant = dx_x * dy_y - dx_y * dy_x
    editable = alpha > 0
    for item in protected:
        editable &= item == 0
    finite = bool(np.isfinite(map_x).all() and np.isfinite(map_y).all()
                  and np.isfinite(determinant).all())
    folds = int(np.count_nonzero((determinant <= 0) & editable)) if finite else -1
    if not finite:
        return Refusal("proportions_control", "nonfinite_raster", "invalid preview sampling map")
    warped = np.asarray(
        cv2.remap(image, map_x, map_y, interpolation=cv2.INTER_LINEAR,
                  borderMode=cv2.BORDER_REFLECT_101),
        dtype=np.uint8,
    )
    combined = compose_selected(image, warped, alpha, protected)
    return RenderResult(combined, result, int(np.count_nonzero(alpha)),
                        sum(int(np.count_nonzero(p)) for p in protected), folds, finite)

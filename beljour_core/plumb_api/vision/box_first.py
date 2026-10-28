"""R12 box-first detection, square crop, then the 478-point mesh.

Face-mapping inspiration: OpenCV YuNet (bounding-box proposals) and MediaPipe
Face Landmarker (normalized 478-point mesh); concept only, no code copied.
The callbacks own commercially cleared runtimes. This module owns coordinates,
association, bounded retries and diagnostics. It never fetches a model or image.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field

import numpy as np

from . import mesh_recovery

BoxSource = Callable[[np.ndarray], Sequence[Sequence[float]]]
MeshSource = Callable[[np.ndarray], tuple[list[np.ndarray], list[dict[str, float]]]]


@dataclass(frozen=True)
class FaceBox:
    x: float
    y: float
    width: float
    height: float
    score: float = 1.0
    keypoints: tuple[tuple[float, float], ...] | None = None

    @property
    def area(self) -> float:
        return self.width * self.height

    def xywh(self) -> np.ndarray:
        return np.array([self.x, self.y, self.width, self.height], dtype=np.float64)


@dataclass(frozen=True)
class Crop:
    left: int
    top: int
    side: int
    output_size: int

    def __post_init__(self) -> None:
        values = (self.left, self.top, self.side, self.output_size)
        if any(not isinstance(v, (int, np.integer)) or isinstance(v, bool) for v in values):
            raise ValueError("crop coordinates and sizes must be integers")
        if not 2 <= self.side <= 32768 or not 32 <= self.output_size <= 1024:
            raise ValueError("crop exceeds coordinate or output memory budget")

    def restore(self, points: np.ndarray, width: int, height: int) -> np.ndarray:
        """Undo resize/padding; MediaPipe depth is normalized by image width."""
        if not isinstance(width, (int, np.integer)) or not isinstance(height, (int, np.integer)) or min(width, height) < 2:
            raise ValueError("restore dimensions must be positive integers at least 2")
        mesh = valid_mesh(points)
        result = mesh * np.array([self.side / width, self.side / height, self.side / width])
        result[:, 0] += self.left / width
        result[:, 1] += self.top / height
        return result


@dataclass
class DetectionResult:
    faces: list[np.ndarray] = field(default_factory=list)
    blendshapes: list[dict[str, float]] = field(default_factory=list)
    boxes: list[FaceBox] = field(default_factory=list)
    attempts: list[dict[str, object]] = field(default_factory=list)
    used_fallback: bool = False
    detector: str = "yunet"
    reason_code: str = "no_face"


def valid_mesh(value: object) -> np.ndarray:
    points = np.asarray(value, dtype=np.float64)
    if points.shape != (478, 3) or not np.isfinite(points).all():
        raise ValueError("a finite 478 by 3 mesh is required")
    if np.ptp(points[:, 0]) <= 1e-7 or np.ptp(points[:, 1]) <= 1e-7:
        raise ValueError("mesh has no area")
    return points.copy()


def image_rgb(value: object) -> np.ndarray:
    image = np.asarray(value)
    if image.ndim != 3 or image.shape[2] != 3 or image.dtype != np.uint8:
        raise ValueError("box-first detection requires uint8 RGB")
    if min(image.shape[:2]) < 2 or max(image.shape[:2]) > 16384:
        raise ValueError("image dimensions must be 2..16384")
    return image


def overlap(a: FaceBox, b: FaceBox) -> float:
    width = max(0.0, min(a.x + a.width, b.x + b.width) - max(a.x, b.x))
    height = max(0.0, min(a.y + a.height, b.y + b.height) - max(a.y, b.y))
    intersection = width * height
    union = a.area + b.area - intersection
    return intersection / union if union > 0 else 0.0


def prepare_boxes(raw: Sequence[Sequence[float]], width: int, height: int,
                  *, limit: int = 6, min_score: float = 0.7) -> list[FaceBox]:
    """Accept OpenCV's XYWH or 15-column YuNet output; stable NMS after clipping."""
    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 6:
        raise ValueError("face limit must be 1..6")
    if not math.isfinite(min_score) or not 0 <= min_score <= 1:
        raise ValueError("minimum score must be finite and in [0, 1]")
    if not isinstance(width, (int, np.integer)) or not isinstance(height, (int, np.integer)) or min(width, height) < 2:
        raise ValueError("box image dimensions must be positive integers at least 2")
    candidates: list[FaceBox] = []
    for row in raw:
        try:
            values = np.asarray(row, dtype=np.float64).reshape(-1)
        except (TypeError, ValueError):
            continue
        if len(values) not in (4, 5, 15) or not np.isfinite(values).all():
            continue
        x, y, bw, bh = values[:4]
        score = float(values[-1]) if len(values) != 4 else 1.0
        if bw <= 0 or bh <= 0 or not min_score <= score <= 1:
            continue
        left, top = max(0.0, float(x)), max(0.0, float(y))
        right, bottom = min(float(width), float(x + bw)), min(float(height), float(y + bh))
        if right - left < 2 or bottom - top < 2:
            continue
        landmarks = (tuple((float(values[i]), float(values[i + 1]))
                           for i in range(4, 14, 2)) if len(values) == 15 else None)
        candidates.append(FaceBox(left, top, right - left, bottom - top, score, landmarks))
    candidates.sort(key=lambda b: (-b.score, -b.area, b.x, b.y))
    kept: list[FaceBox] = []
    for candidate in candidates:
        if all(overlap(candidate, previous) <= 0.3 for previous in kept):
            kept.append(candidate)
        if len(kept) == limit:
            break
    return kept


def crop_plan(box: FaceBox, *, margin: float = 1.6, minimum: int = 256,
              maximum: int = 512) -> Crop:
    if not math.isfinite(margin) or not 1 <= margin <= 3:
        raise ValueError("crop margin must be 1..3")
    if (any(not isinstance(v, int) or isinstance(v, bool) for v in (minimum, maximum)) or
            not 32 <= minimum <= maximum <= 1024):
        raise ValueError("invalid crop resolution budget")
    if (not all(math.isfinite(v) for v in (box.x, box.y, box.width, box.height, box.score)) or
            box.width <= 0 or box.height <= 0 or not 0 <= box.score <= 1):
        raise ValueError("crop box must have positive finite area and a valid score")
    side = max(2, math.ceil(max(box.width, box.height) * margin))
    if side > 32768:
        raise ValueError("crop exceeds memory budget")
    return Crop(math.floor(box.x + box.width / 2 - side / 2),
                math.floor(box.y + box.height / 2 - side / 2), side,
                min(maximum, max(minimum, side)))


def crop_rgb(image: np.ndarray, crop: Crop) -> np.ndarray:
    """Bilinear sample at bounded output resolution, with replicated image edges.

    Allocations scale with output_size (at most 1024), never with crop.side or
    source padding. A very large box therefore cannot allocate a 32k-square patch.
    Pixel centres follow the usual half-pixel resize convention, while restore()
    uses the original crop frame for normalized landmark/depth coordinates.
    """
    photo = image_rgb(image)
    height, width = photo.shape[:2]
    coordinates = np.clip((np.arange(crop.output_size, dtype=np.float64) + 0.5) * crop.side / crop.output_size - 0.5,
                          0, crop.side - 1)
    y = np.clip(coordinates + crop.top, 0, height - 1)
    x = np.clip(coordinates + crop.left, 0, width - 1)
    y0, x0 = np.floor(y).astype(np.int64), np.floor(x).astype(np.int64)
    y1, x1 = np.minimum(y0 + 1, height - 1), np.minimum(x0 + 1, width - 1)
    fx = (x - x0)[None, :, None].astype(np.float64)
    fy = (y - y0)[:, None, None].astype(np.float64)
    upper = photo[y0[:, None], x0[None, :]].astype(np.float64) * (1 - fx)
    upper += photo[y0[:, None], x1[None, :]].astype(np.float64) * fx
    lower = photo[y1[:, None], x0[None, :]].astype(np.float64) * (1 - fx)
    lower += photo[y1[:, None], x1[None, :]].astype(np.float64) * fx
    output = np.rint(upper * (1 - fy) + lower * fy).clip(0, 255).astype(np.uint8)
    return np.ascontiguousarray(output)


def mesh_box(points: np.ndarray, width: int, height: int) -> FaceBox:
    coords = points[:, :2] * np.array([width, height])
    lo, hi = coords.min(axis=0), coords.max(axis=0)
    return FaceBox(float(lo[0]), float(lo[1]), float(hi[0] - lo[0]), float(hi[1] - lo[1]))


def associated(points: np.ndarray, box: FaceBox, width: int, height: int) -> float:
    candidate = mesh_box(points, width, height)
    cx, cy = candidate.x + candidate.width / 2, candidate.y + candidate.height / 2
    if not (box.x - box.width * 0.1 <= cx <= box.x + box.width * 1.1 and
            box.y - box.height * 0.1 <= cy <= box.y + box.height * 1.1):
        return 0.0
    return overlap(candidate, box)


class BoxFirstDetector:
    """No guessed detection success: invalid/corrupt/unmatched candidates are counted.

    Try one square crop per YuNet box. Only missing targets get one wider retry.
    A final full-image pass preserves recoverable faces when YuNet misses a box;
    this fallback is explicit in diagnostics and never relabelled as box success.
    """

    def __init__(self, boxes: BoxSource, meshes: MeshSource, *, max_faces: int = 6):
        if not isinstance(max_faces, int) or isinstance(max_faces, bool) or not 1 <= max_faces <= 6:
            raise ValueError("face limit must be 1..6")
        self.box_source = boxes
        self.mesh_source = meshes
        self.max_faces = max_faces

    def detect(self, value: object) -> DetectionResult:
        image = image_rgb(value)
        height, width = image.shape[:2]
        raw_boxes = self.box_source(image)
        result = DetectionResult(boxes=prepare_boxes(raw_boxes, width, height,
                                                    limit=self.max_faces))
        if raw_boxes and not result.boxes:
            result.reason_code = "low_confidence"
        unresolved: list[FaceBox] = []
        outside = False
        for box in result.boxes:
            matched = False
            for margin in (1.6, 2.0):
                plan = crop_plan(box, margin=margin)
                raw, shapes = self.mesh_source(crop_rgb(image, plan))
                choices: list[tuple[float, np.ndarray, dict[str, float]]] = []
                invalid = 0
                for index, points in enumerate(raw):
                    try:
                        restored = plan.restore(points, width, height)
                    except (ValueError, TypeError):
                        invalid += 1
                        continue
                    score = associated(restored, box, width, height)
                    share = mesh_recovery.frame_share(restored)
                    if share < mesh_recovery.MIN_FRAME_SHARE:
                        outside = True
                        continue
                    if score >= 0.15:
                        choices.append((score, restored, shapes[index] if index < len(shapes) else {}))
                result.attempts.append({"stage": "crop", "margin": margin, "size": plan.output_size,
                                        "raw_meshes": len(raw), "invalid_meshes": invalid,
                                        "matched": bool(choices)})
                if choices:
                    _, points, blend = max(choices, key=lambda item: item[0])
                    if not any(overlap(mesh_box(points, width, height), mesh_box(p, width, height)) > 0.6
                               for p in result.faces):
                        result.faces.append(points)
                        result.blendshapes.append(blend)
                    matched = True
                    break
            if not matched:
                unresolved.append(box)
        if unresolved or not result.boxes:
            result.used_fallback = True
            raw, shapes = self.mesh_source(image)
            valid_count = 0
            for index, value_points in enumerate(raw):
                try:
                    points = valid_mesh(value_points)
                except (ValueError, TypeError):
                    continue
                if mesh_recovery.frame_share(points) < mesh_recovery.MIN_FRAME_SHARE:
                    outside = True
                    continue
                if result.boxes and not any(associated(points, b, width, height) >= 0.15 for b in unresolved):
                    continue
                bound = mesh_box(points, width, height)
                if any(overlap(bound, mesh_box(p, width, height)) > 0.6 for p in result.faces):
                    continue
                if len(result.faces) == self.max_faces:
                    break
                result.faces.append(points)
                result.blendshapes.append(shapes[index] if index < len(shapes) else {})
                valid_count += 1
            result.attempts.append({"stage": "full_image_fallback", "raw_meshes": len(raw),
                                    "matched": valid_count > 0})
        remaining = [box for box in result.boxes if not any(
            associated(face, box, width, height) >= 0.15 for face in result.faces
        )]
        if remaining or not result.faces:
            mesh_recovery.recover_missing(
                image, result, remaining, self.mesh_source, associated, mesh_box,
                overlap, valid_mesh, self.max_faces,
            )
        if result.faces and result.reason_code != "recovered":
            result.reason_code = "detected"
        elif not result.faces and outside:
            result.reason_code = "mesh_out_of_frame"
        elif not result.faces and result.reason_code != "low_confidence":
            result.reason_code = "face_box_without_mesh" if result.boxes else "no_face"
        return result


def size_slice(pixels: float | None) -> str:
    if pixels is None or not math.isfinite(pixels) or pixels <= 0:
        return "unknown"
    return "small_lt64" if pixels < 64 else "medium_64_127" if pixels < 128 else "large_ge128"


def yaw_slice(degrees: float | None) -> str:
    if degrees is None or not math.isfinite(degrees):
        return "unknown"
    yaw = abs(degrees)
    return "frontal" if yaw <= 15 else "angled" if yaw < 45 else "side" if yaw < 75 else "profile"

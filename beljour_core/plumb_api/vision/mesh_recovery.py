"""Bounded, coordinate-correct recovery of missed facial meshes.

Only approved, injected mesh inference is used. Failed trials remain count-only
observations; no photograph or landmark coordinate is written to a report.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections import Counter
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING

import cv2
import numpy as np
from numpy.typing import NDArray

from .landmark_input import luminance_clahe
from .mesh_confidence import score_mesh
from .mesh_recovery_focus import crop_offsets, crowded
from .mesh_recovery_tiles import candidate_windows
from .recovery_policy import rank_missing_boxes

if TYPE_CHECKING:
    from .box_first import DetectionResult, FaceBox

Bytes = NDArray[np.uint8]
Points = NDArray[np.float64]
MeshSource = Callable[[np.ndarray], tuple[list[np.ndarray], list[dict[str, float]]]]
Association = Callable[[np.ndarray, "FaceBox", int, int], float]
MeshBounds = Callable[[np.ndarray, int, int], "FaceBox"]
Overlap = Callable[["FaceBox", "FaceBox"], float]
Validate = Callable[[object], np.ndarray]
MAX_EXTRA_PER_BOX = 12
MAX_EXTRA_PER_PHOTO = 24
MAX_INPUT_SIDE = 1024
MIN_FRAME_SHARE = 0.98
MIN_ASSOCIATION = 0.15


@dataclass(frozen=True)
class Trial:
    """One mesh input and its invertible map to source-photo coordinates."""

    image: Bytes
    stage: str
    angle: float = 0.0
    scale: float = 1.0
    pad: str = "none"
    left: float = 0.0
    top: float = 0.0
    side: float = 1.0
    inverse: NDArray[np.float64] | None = None
    full_image: bool = False

    def restore(self, raw: object, width: int, height: int, validator: Validate) -> Points:
        """Undo rotation, resizing and padding; never clamp invisible points."""
        points = validator(raw)
        if self.full_image:
            return np.asarray(points, dtype=np.float64).copy()
        x = points[:, 0] * self.image.shape[1]
        y = points[:, 1] * self.image.shape[0]
        if self.inverse is not None:
            restored = self.inverse @ np.stack([x, y, np.ones_like(x)], axis=0)
            x, y = restored[0], restored[1]
        out = points.copy()
        out[:, 0] = (self.left + x * self.side / self.image.shape[1]) / width
        out[:, 1] = (self.top + y * self.side / self.image.shape[0]) / height
        out[:, 2] = points[:, 2] * self.side / width
        return out


@dataclass
class Budget:
    """Additional inference calls remain bounded across all proposals."""

    total: int = 0
    per_box: int = 0

    def allow(self) -> bool:
        return self.total < MAX_EXTRA_PER_PHOTO and self.per_box < MAX_EXTRA_PER_BOX

    def consume(self) -> bool:
        if not self.allow():
            return False
        self.total += 1
        self.per_box += 1
        return True

    def next_box(self) -> None:
        self.per_box = 0


def frame_share(points: np.ndarray) -> float:
    """Measure actual point membership in the photograph, with no clipping."""
    data = np.asarray(points, dtype=np.float64)
    if data.shape != (478, 3) or not np.isfinite(data).all():
        return 0.0
    return float(((data[:, 0] >= 0) & (data[:, 0] < 1)
                  & (data[:, 1] >= 0) & (data[:, 1] < 1)).mean())


def _crop_pixels(image: Bytes, left: int, top: int, side: int,
                 resolution: int, padding: str) -> Bytes:
    """Sample a virtual square, allocating only the bounded output resolution."""
    height, width = image.shape[:2]
    if not 32 <= resolution <= MAX_INPUT_SIDE or not 2 <= side <= 32768:
        raise ValueError("crop output exceeds recovery limits")
    coordinates = (np.arange(resolution, dtype=np.float64) + 0.5) * side / resolution - 0.5
    x = coordinates + left
    y = coordinates + top
    sample_x = np.clip(x, 0, width - 1)
    sample_y = np.clip(y, 0, height - 1)
    # Cubic and Lanczos interpolation create artificial edges; use bilinear.
    x0 = np.floor(sample_x).astype(np.intp)
    y0 = np.floor(sample_y).astype(np.intp)
    x1 = np.minimum(x0 + 1, width - 1)
    y1 = np.minimum(y0 + 1, height - 1)
    fx = (sample_x - x0)[None, :, None]
    fy = (sample_y - y0)[:, None, None]
    top_pixels = image[y0[:, None], x0[None, :]].astype(np.float64) * (1 - fx)
    top_pixels += image[y0[:, None], x1[None, :]].astype(np.float64) * fx
    bottom_pixels = image[y1[:, None], x0[None, :]].astype(np.float64) * (1 - fx)
    bottom_pixels += image[y1[:, None], x1[None, :]].astype(np.float64) * fx
    output = np.clip(np.rint(top_pixels * (1 - fy) + bottom_pixels * fy), 0, 255)
    if padding == "grey":
        valid = ((x >= 0) & (x < width))[None, :] & ((y >= 0) & (y < height))[:, None]
        output[~valid] = 127.0
    return np.ascontiguousarray(output.astype(np.uint8))


def crop_trial(image: Bytes, box: FaceBox, margin: float, *, stage: str,
               resolution: int = 512, padding: str = "edge") -> Trial:
    """A square crop anchored to a box, even when its bounds extend outside."""
    if not math.isfinite(margin) or not 1.0 <= margin <= 3.0:
        raise ValueError("crop margin is invalid")
    side = max(2, math.ceil(max(box.width, box.height) * margin))
    side = min(side, 32768)
    left = math.floor(box.x + box.width / 2 - side / 2)
    top = math.floor(box.y + box.height / 2 - side / 2)
    pixels = _crop_pixels(image, left, top, side, resolution, padding)
    return Trial(pixels, stage, pad=padding, left=float(left), top=float(top), side=float(side))


def rotate_trial(trial: Trial, angle: float) -> Trial:
    """Rotate only the inference copy and preserve the exact inverse transform."""
    height, width = trial.image.shape[:2]
    centre = ((width - 1) / 2, (height - 1) / 2)
    forward: NDArray[np.float64] = np.asarray(
        cv2.getRotationMatrix2D(centre, angle, 1.0), dtype=np.float64,
    )
    pixels: Bytes = np.asarray(
        cv2.warpAffine(
            trial.image, forward, (width, height), flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE,
        ),
        dtype=np.uint8,
    )
    inverse: NDArray[np.float64] = np.asarray(
        cv2.invertAffineTransform(forward), dtype=np.float64,
    )
    return Trial(np.ascontiguousarray(pixels), "rotated_crop", angle=angle,
                 pad=trial.pad, left=trial.left, top=trial.top, side=trial.side,
                 inverse=inverse)


def scale_trial(image: Bytes, multiple: float) -> Trial:
    """Full-image retry, capped at the same model input allocation budget."""
    height, width = image.shape[:2]
    factor = min(multiple, MAX_INPUT_SIDE / max(height, width))
    nw = max(32, min(MAX_INPUT_SIDE, round(width * factor)))
    nh = max(32, min(MAX_INPUT_SIDE, round(height * factor)))
    scaled: Bytes = np.asarray(
        cv2.resize(image, (nw, nh), interpolation=cv2.INTER_LINEAR),
        dtype=np.uint8,
    )
    return Trial(np.ascontiguousarray(scaled), "scaled_full_image", scale=multiple,
                 full_image=True)


def angles(box: FaceBox) -> tuple[float, ...]:
    """Try small roll first, then quarter/half turns; prioritize supplied eyes.

    The eye roll is measured in image coordinates (y grows downward), and
    ``rotate_trial`` turns the crop counter-clockwise for a positive angle,
    which levels an eye line of that same roll. The fixed angle nearest the
    measured roll is therefore tried first.
    """
    choices: tuple[float, ...] = (15.0, -15.0, 30.0, -30.0, 90.0, -90.0, 180.0)
    points = box.keypoints
    if points is None or len(points) < 2:
        return choices
    eyes = points[:2]
    roll = math.degrees(math.atan2(eyes[1][1] - eyes[0][1], eyes[1][0] - eyes[0][0]))
    if not math.isfinite(roll):
        return choices
    return tuple(sorted(choices, key=lambda angle: (
        abs((angle - roll + 180) % 360 - 180), abs(angle), angle,
    )))


def _box_trials(image: Bytes, box: FaceBox, peers: Sequence[FaceBox]) -> list[Trial]:
    """Stage variants are conditional so late stages remain reachable."""
    trials = [crop_trial(image, box, 1.3, stage="tight_crop"),
              crop_trial(image, box, 2.6, stage="wide_crop")]
    normal = crop_trial(image, box, 1.6, stage="normal_crop")
    for dx, dy in crop_offsets(box, image.shape[1], image.shape[0]):
        shifted_box = type(box)(box.x + dx, box.y + dy, box.width, box.height,
                                box.score, box.keypoints)
        trials.append(crop_trial(image, shifted_box, 1.6, stage="edge_shift_crop"))
    if crowded(box, peers):
        trials.append(crop_trial(image, box, 1.05, stage="group_isolation_crop"))
    for window in candidate_windows(box, peers, image.shape[1], image.shape[0]):
        pixels = _crop_pixels(image, window.left, window.top, window.side, 512, "edge")
        trials.append(Trial(pixels, "overlap_tile", pad="edge",
                            left=float(window.left), top=float(window.top),
                            side=float(window.side)))
    face_side = min(box.width, box.height) / normal.side * 256
    if face_side < 192:
        resolution = min(1024, max(512, math.ceil(192 * normal.side / min(box.width, box.height))))
        trials.append(crop_trial(image, box, 1.6, stage="upscaled_crop", resolution=resolution))
    height, width = image.shape[:2]
    near_edge = (normal.left < 0 or normal.top < 0
                 or normal.left + normal.side > width or normal.top + normal.side > height)
    if near_edge:
        trials.append(crop_trial(image, box, 1.6, stage="padded_crop", padding="grey"))
    for angle in angles(box)[:4]:
        trials.append(rotate_trial(normal, angle))
    return trials


def _try(trial: Trial, source: MeshSource, result: DetectionResult,
         boxes: Sequence[FaceBox], width: int, height: int, budget: Budget,
         associate: Association, bounds: MeshBounds, overlap: Overlap,
         validate: Validate, max_faces: int) -> tuple[bool, bool]:
    """Call inference once and validate associated meshes before accepting them."""
    if not budget.consume():
        return False, False
    count = 0
    outside = False
    invalid = 0
    raw_count = 0
    best_confidence = 0.0
    try:
        meshes, blendshapes = source(trial.image)
        raw_count = len(meshes)
    except (TypeError, ValueError, RuntimeError):
        meshes, blendshapes = [], []
    for index, raw in enumerate(meshes):
        try:
            restored = trial.restore(raw, width, height, validate)
            share = frame_share(restored)
            if share < MIN_FRAME_SHARE:
                outside = True
                continue
            if boxes and not any(associate(restored, box, width, height) >= MIN_ASSOCIATION
                                 for box in boxes):
                continue
            confidence = score_mesh(restored, association=max(
                (associate(restored, box, width, height) for box in boxes), default=1.0))
            best_confidence = max(best_confidence, confidence.score)
            candidate = bounds(restored, width, height)
            if any(overlap(candidate, bounds(face, width, height)) > 0.6
                   for face in result.faces):
                continue
        except (ValueError, TypeError, FloatingPointError):
            invalid += 1
            continue
        if len(result.faces) >= max_faces:
            break
        result.faces.append(restored)
        result.blendshapes.append(blendshapes[index] if index < len(blendshapes) else {})
        count += 1
    result.attempts.append({"stage": trial.stage, "angle": trial.angle,
                            "scale": trial.scale, "pad": trial.pad,
                            "matched": count > 0, "raw_meshes": raw_count,
                            "invalid_meshes": invalid, "out_of_frame": outside,
                            "extra_call": True, "confidence": round(best_confidence, 4)})
    return count > 0, outside


def recover_missing(image: Bytes, result: DetectionResult, missing: Sequence[FaceBox],
                    source: MeshSource, associate: Association, bounds: MeshBounds,
                    overlap: Overlap, validate: Validate, max_faces: int) -> None:
    """Try all unresolved boxes subject to 12/box and 24/photo extra calls."""
    height, width = image.shape[:2]
    budget = Budget()
    outside = False
    ranked_missing = rank_missing_boxes(missing, result.boxes, width, height)
    for box in ranked_missing:
        if len(result.faces) >= max_faces or budget.total >= MAX_EXTRA_PER_PHOTO:
            break
        budget.next_box()
        for trial in _box_trials(image, box, result.boxes):
            success, clipped = _try(trial, source, result, (box,), width, height,
                                    budget, associate, bounds, overlap, validate, max_faces)
            outside |= clipped
            if success or not budget.allow():
                break
        # An expanded region is only attempted for unresolved low-confidence
        # proposals and therefore cannot alter a successful initial mesh.
        if budget.allow() and not any(associate(face, box, width, height) >= MIN_ASSOCIATION
                                       for face in result.faces):
            expanded = crop_trial(image, box, 2.9, stage="confidence_expanded_roi")
            success, clipped = _try(expanded, source, result, (box,), width, height,
                                    budget, associate, bounds, overlap, validate, max_faces)
            outside |= clipped
            if success:
                continue
        if budget.allow() and not any(associate(face, box, width, height) >= MIN_ASSOCIATION
                                       for face in result.faces):
            original = crop_trial(image, box, 1.6, stage="contrast_crop")
            contrasted = Trial(luminance_clahe(original.image), "contrast_crop",
                               left=original.left, top=original.top, side=original.side)
            success, clipped = _try(contrasted, source, result, (box,), width, height,
                                    budget, associate, bounds, overlap, validate, max_faces)
            outside |= clipped
            if success:
                continue
        # Two extra full-image scales only if the budget allows them.
        if budget.allow() and not any(associate(face, box, width, height) >= MIN_ASSOCIATION
                                       for face in result.faces):
            for multiple in (0.5, 2.0):
                success, clipped = _try(scale_trial(image, multiple), source, result, (box,),
                                        width, height, budget, associate, bounds, overlap,
                                        validate, max_faces)
                outside |= clipped
                if success or not budget.allow():
                    break
        if budget.allow() and not any(associate(face, box, width, height) >= MIN_ASSOCIATION
                                       for face in result.faces):
            normal = crop_trial(image, box, 1.6, stage="normal_crop")
            for angle in angles(box)[4:]:
                success, clipped = _try(rotate_trial(normal, angle), source, result,
                                        (box,), width, height, budget, associate, bounds,
                                        overlap, validate, max_faces)
                outside |= clipped
                if success or not budget.allow():
                    break
    if not result.boxes and not result.faces:
        budget.next_box()
        for multiple in (0.5, 2.0):
            success, clipped = _try(scale_trial(image, multiple), source, result, (),
                                    width, height, budget, associate, bounds, overlap,
                                    validate, max_faces)
            outside |= clipped
            if success or not budget.allow():
                break
    if result.faces:
        result.reason_code = "detected" if not budget.total else "recovered"
        result.used_fallback = result.used_fallback or budget.total > 0
    elif outside:
        result.reason_code = "mesh_out_of_frame"
    elif result.boxes:
        result.reason_code = "face_box_without_mesh"
    elif result.reason_code != "low_confidence":
        result.reason_code = "no_face"


def attempt_counts(attempts: Sequence[dict[str, object]]) -> dict[str, int]:
    """Count only retry stages, never retain per-face or crop properties."""
    counts: Counter[str] = Counter()
    for attempt in attempts:
        stage = attempt.get("stage")
        if isinstance(stage, str) and stage:
            counts[stage] += 1
    return dict(sorted(counts.items()))

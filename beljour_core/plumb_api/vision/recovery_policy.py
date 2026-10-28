"""Deterministic policy helpers for bounded facial-mesh recovery.

The policy layer does not run inference or decide whether a mesh is valid.
It produces safe, ordered work proposals and count-only evidence that callers
can audit independently from model output.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections import Counter
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol, TypeVar

MAX_BOX_CALLS = 12
MAX_PHOTO_CALLS = 24
MAX_FACES = 64
MAX_DIMENSION = 16384
MIN_DIMENSION = 2


class FailureClass(StrEnum):
    GROUP = "group"
    CROPPED = "cropped"
    PROFILE = "profile"
    GLASSES = "glasses"
    HEAD_COVERING = "head_covering"
    LOW_RESOLUTION = "low_resolution"
    LOW_CONTRAST = "low_contrast"
    UNKNOWN = "unknown"


class RecoveryStage(StrEnum):
    TIGHT_CROP = "tight_crop"
    WIDE_CROP = "wide_crop"
    EDGE_SHIFT = "edge_shift_crop"
    GROUP_ISOLATION = "group_isolation_crop"
    OVERLAP_TILE = "overlap_tile"
    UPSCALE = "upscaled_crop"
    PADDED = "padded_crop"
    ROTATE = "rotated_crop"
    EXPANDED_ROI = "confidence_expanded_roi"
    CONTRAST = "contrast_crop"
    FULL_HALF = "scaled_full_image_half"
    FULL_DOUBLE = "scaled_full_image_double"


@dataclass(frozen=True, slots=True)
class RecoveryCandidate:
    """Stable box metadata needed to rank retries without storing image data."""

    candidate_id: str
    x: float
    y: float
    width: float
    height: float
    score: float = 0.0
    failure_class: FailureClass = FailureClass.UNKNOWN
    edge_sides: tuple[str, ...] = ()
    peer_count: int = 0
    confidence: float | None = None

    def validate(self, image_width: int, image_height: int) -> None:
        if not self.candidate_id or len(self.candidate_id) > 128:
            raise ValueError("candidate id must be a non-empty short string")
        values = (self.x, self.y, self.width, self.height, self.score)
        if not all(math.isfinite(value) for value in values):
            raise ValueError("candidate geometry must be finite")
        if self.width <= 0 or self.height <= 0:
            raise ValueError("candidate dimensions must be positive")
        if self.score < 0 or self.score > 1:
            raise ValueError("candidate score must be in [0, 1]")
        if self.peer_count < 0 or self.peer_count > MAX_FACES:
            raise ValueError("peer count is outside supported bounds")
        if self.confidence is not None and (
            not math.isfinite(self.confidence) or not 0 <= self.confidence <= 1
        ):
            raise ValueError("confidence must be finite and in [0, 1]")
        if image_width < MIN_DIMENSION or image_height < MIN_DIMENSION:
            raise ValueError("image dimensions are too small")
        if image_width > MAX_DIMENSION or image_height > MAX_DIMENSION:
            raise ValueError("image dimensions exceed supported bounds")
        if len(set(self.edge_sides)) != len(self.edge_sides):
            raise ValueError("edge sides cannot be repeated")
        if any(side not in {"left", "right", "top", "bottom"} for side in self.edge_sides):
            raise ValueError("unknown edge side")


@dataclass(frozen=True, slots=True)
class RecoveryTask:
    """One bounded proposed inference call for a single candidate."""

    candidate_id: str
    stage: RecoveryStage
    priority: int
    angle: float = 0.0
    scale: float = 1.0
    margin: float = 1.6
    padding: str = "edge"
    expected_face_side: float = 0.0

    def validate(self) -> None:
        if not self.candidate_id:
            raise ValueError("task must name its candidate")
        if not math.isfinite(self.angle) or abs(self.angle) > 180:
            raise ValueError("rotation angle must be finite and bounded")
        if not math.isfinite(self.scale) or not 0.25 <= self.scale <= 4:
            raise ValueError("scale must be between 0.25 and 4")
        if not math.isfinite(self.margin) or not 1 <= self.margin <= 3:
            raise ValueError("crop margin must be between 1 and 3")
        if self.padding not in {"edge", "grey", "none"}:
            raise ValueError("unsupported padding mode")
        if not math.isfinite(self.expected_face_side) or self.expected_face_side < 0:
            raise ValueError("expected face size must be finite and non-negative")


@dataclass(frozen=True, slots=True)
class RecoveryPlan:
    """Immutable plan that cannot exceed either inference-call ceiling."""

    tasks: tuple[RecoveryTask, ...]
    per_candidate_limit: int
    per_photo_limit: int

    def validate(self) -> None:
        if not 1 <= self.per_candidate_limit <= MAX_BOX_CALLS:
            raise ValueError("per-candidate budget exceeds hard limit")
        if not 1 <= self.per_photo_limit <= MAX_PHOTO_CALLS:
            raise ValueError("per-photo budget exceeds hard limit")
        seen: Counter[str] = Counter()
        for task in self.tasks:
            task.validate()
            seen[task.candidate_id] += 1
            if seen[task.candidate_id] > self.per_candidate_limit:
                raise ValueError("plan exceeds per-candidate budget")
        if len(self.tasks) > self.per_photo_limit:
            raise ValueError("plan exceeds per-photo budget")

    def for_candidate(self, candidate_id: str) -> tuple[RecoveryTask, ...]:
        return tuple(task for task in self.tasks if task.candidate_id == candidate_id)

    def count_by_stage(self) -> dict[str, int]:
        counts = Counter(task.stage.value for task in self.tasks)
        return dict(sorted(counts.items()))


_STAGE_ORDER: tuple[RecoveryStage, ...] = (
    RecoveryStage.TIGHT_CROP,
    RecoveryStage.WIDE_CROP,
    RecoveryStage.EDGE_SHIFT,
    RecoveryStage.GROUP_ISOLATION,
    RecoveryStage.OVERLAP_TILE,
    RecoveryStage.UPSCALE,
    RecoveryStage.PADDED,
    RecoveryStage.ROTATE,
    RecoveryStage.EXPANDED_ROI,
    RecoveryStage.CONTRAST,
    RecoveryStage.FULL_HALF,
    RecoveryStage.FULL_DOUBLE,
)


def _stage_proposals(candidate: RecoveryCandidate, image_width: int,
                     image_height: int) -> list[RecoveryTask]:
    face_side = min(candidate.width, candidate.height)
    tasks: list[RecoveryTask] = []

    def add(stage: RecoveryStage, margin: float = 1.6, angle: float = 0.0,
            scale: float = 1.0, padding: str = "edge", priority: int | None = None) -> None:
        tasks.append(RecoveryTask(candidate.candidate_id, stage,
                                  len(tasks) if priority is None else priority,
                                  angle, scale, margin, padding, face_side))

    add(RecoveryStage.TIGHT_CROP, margin=1.3)
    add(RecoveryStage.WIDE_CROP, margin=2.6)
    if candidate.edge_sides:
        add(RecoveryStage.EDGE_SHIFT, margin=1.6)
        add(RecoveryStage.PADDED, margin=1.6, padding="grey")
    if candidate.peer_count:
        add(RecoveryStage.GROUP_ISOLATION, margin=1.05)
        add(RecoveryStage.OVERLAP_TILE, margin=1.25)
    if face_side < 96:
        add(RecoveryStage.UPSCALE, scale=min(4.0, 192 / max(face_side, 1.0)))
    if candidate.failure_class == FailureClass.PROFILE:
        for angle in (15.0, -15.0, 30.0, -30.0, 90.0, -90.0):
            add(RecoveryStage.ROTATE, angle=angle)
    elif candidate.failure_class in {FailureClass.CROPPED, FailureClass.HEAD_COVERING}:
        for angle in (15.0, -15.0, 30.0, -30.0):
            add(RecoveryStage.ROTATE, angle=angle)
    else:
        for angle in (15.0, -15.0):
            add(RecoveryStage.ROTATE, angle=angle)
    if candidate.confidence is not None and candidate.confidence < 0.65:
        add(RecoveryStage.EXPANDED_ROI, margin=2.9)
    if candidate.failure_class == FailureClass.LOW_CONTRAST:
        add(RecoveryStage.CONTRAST, margin=1.6)
    if image_width >= 32 and image_height >= 32:
        add(RecoveryStage.FULL_HALF, scale=0.5)
        add(RecoveryStage.FULL_DOUBLE, scale=2.0)
    return tasks


def plan_recovery(candidates: Sequence[RecoveryCandidate], image_width: int,
                  image_height: int, *, per_candidate_limit: int = MAX_BOX_CALLS,
                  per_photo_limit: int = MAX_PHOTO_CALLS) -> RecoveryPlan:
    """Build a deterministic candidate-aware plan under the frozen call budget.

    Candidates with a missing mesh are ranked before low confidence results;
    among otherwise equal candidates, group and crop failure classes receive
    priority because they are the known dominant failure slices. This ordering
    does not imply a candidate is a face; the existing validator remains the
    sole authority for accepting a recovered mesh.
    """
    if not 1 <= per_candidate_limit <= MAX_BOX_CALLS:
        raise ValueError("per-candidate limit exceeds frozen maximum")
    if not 1 <= per_photo_limit <= MAX_PHOTO_CALLS:
        raise ValueError("per-photo limit exceeds frozen maximum")
    if len(candidates) > MAX_FACES:
        raise ValueError("too many candidates for one photo")
    for candidate in candidates:
        candidate.validate(image_width, image_height)
    class_rank = {
        FailureClass.GROUP: 0,
        FailureClass.CROPPED: 1,
        FailureClass.PROFILE: 2,
        FailureClass.GLASSES: 3,
        FailureClass.HEAD_COVERING: 4,
        FailureClass.LOW_RESOLUTION: 5,
        FailureClass.LOW_CONTRAST: 6,
        FailureClass.UNKNOWN: 7,
    }
    ordered = sorted(candidates, key=lambda item: (
        0 if item.confidence is None else 1,
        class_rank[item.failure_class],
        -item.peer_count,
        -item.score,
        item.candidate_id,
    ))
    tasks: list[RecoveryTask] = []
    proposals = [_stage_proposals(item, image_width, image_height) for item in ordered]
    per_candidate_counts: Counter[str] = Counter()
    # Round-robin stages prevent the first difficult group from consuming the
    # entire photo budget before other missing faces receive an initial retry.
    depth = 0
    while len(tasks) < per_photo_limit:
        appended = False
        for candidate, candidate_tasks in zip(ordered, proposals, strict=True):
            candidate_id = candidate.candidate_id
            if per_candidate_counts[candidate_id] >= per_candidate_limit:
                continue
            if depth >= len(candidate_tasks):
                continue
            tasks.append(candidate_tasks[depth])
            per_candidate_counts[candidate_id] += 1
            appended = True
            if len(tasks) >= per_photo_limit:
                break
        if not appended:
            break
        depth += 1
    # Priorities are rewritten to match final execution order, not proposal order.
    normalized = tuple(
        RecoveryTask(task.candidate_id, task.stage, index, task.angle,
                     task.scale, task.margin, task.padding, task.expected_face_side)
        for index, task in enumerate(tasks)
    )
    plan = RecoveryPlan(normalized, per_candidate_limit, per_photo_limit)
    plan.validate()
    return plan


def validate_attempt_record(record: Mapping[str, object]) -> dict[str, object]:
    """Normalize an inference attempt to a safe count-only audit record.

    Raw coordinates, images, identity references, model payloads and exception
    text are intentionally excluded. Unknown fields are dropped so upstream
    diagnostics cannot accidentally leak person-specific input.
    """
    stage = record.get("stage")
    if not isinstance(stage, str) or stage not in {item.value for item in RecoveryStage}:
        raise ValueError("attempt stage is unknown")
    raw_counts = (record.get("raw_meshes", 0), record.get("invalid_meshes", 0))
    if any(not isinstance(value, int) or isinstance(value, bool) or value < 0 or value > 10000
           for value in raw_counts):
        raise ValueError("attempt counts must be bounded non-negative integers")
    confidence = record.get("confidence")
    if confidence is not None and (
        not isinstance(confidence, (float, int)) or isinstance(confidence, bool)
        or not math.isfinite(float(confidence)) or not 0 <= float(confidence) <= 1
    ):
        raise ValueError("confidence must be finite and in [0, 1]")
    angle = record.get("angle", 0.0)
    scale = record.get("scale", 1.0)
    if not isinstance(angle, (int, float)) or isinstance(angle, bool) or not math.isfinite(angle):
        raise ValueError("angle must be finite")
    if not isinstance(scale, (int, float)) or isinstance(scale, bool) or not math.isfinite(scale):
        raise ValueError("scale must be finite")
    if abs(float(angle)) > 180 or not 0.25 <= float(scale) <= 4:
        raise ValueError("angle or scale exceeds limits")
    return {
        "stage": stage,
        "angle": float(angle),
        "scale": float(scale),
        "raw_meshes": raw_counts[0],
        "invalid_meshes": raw_counts[1],
        "matched": bool(record.get("matched", False)),
        "extra_call": bool(record.get("extra_call", True)),
        "confidence": None if confidence is None else round(float(confidence), 4),
    }


def summarize_attempts(records: Iterable[Mapping[str, object]]) -> dict[str, object]:
    """Return deterministic aggregate evidence with no face-level identifiers."""
    stages: Counter[str] = Counter()
    total = 0
    matched = 0
    invalid = 0
    raw = 0
    for record in records:
        safe = validate_attempt_record(record)
        total += 1
        stages[str(safe["stage"])] += 1
        matched += int(safe["matched"] is True)
        invalid_count, raw_count = safe["invalid_meshes"], safe["raw_meshes"]
        if not isinstance(invalid_count, int) or not isinstance(raw_count, int):
            raise ValueError("validated mesh counts must be integers")
        invalid += invalid_count
        raw += raw_count
    if total > MAX_PHOTO_CALLS:
        raise ValueError("attempt evidence exceeds per-photo call ceiling")
    return {
        "attempt_count": total,
        "matched_attempts": matched,
        "raw_meshes": raw,
        "invalid_meshes": invalid,
        "stages": dict(sorted(stages.items())),
    }


class BoxLike(Protocol):
    """The detector box fields the ranking reads (box_first.FaceBox has them)."""

    @property
    def x(self) -> float: ...
    @property
    def y(self) -> float: ...
    @property
    def width(self) -> float: ...
    @property
    def height(self) -> float: ...


Box = TypeVar("Box", bound=BoxLike)


def rank_missing_boxes(boxes: Sequence[Box], peers: Sequence[BoxLike],
                       image_width: int, image_height: int) -> tuple[Box, ...]:
    """Rank real detector boxes so likely group/crop failures receive retries first.

    This function intentionally returns the original box objects. It never
    edits geometry or changes the mesh acceptance rule. Candidate ranking is a
    scheduling choice only; every resulting mesh must still pass association,
    bounds, overlap and the existing 478-point validator.
    """
    if not MIN_DIMENSION <= image_width <= MAX_DIMENSION:
        raise ValueError("invalid image width")
    if not MIN_DIMENSION <= image_height <= MAX_DIMENSION:
        raise ValueError("invalid image height")
    if len(boxes) > MAX_FACES:
        raise ValueError("too many missing boxes")

    def metrics(box: Box) -> tuple[int, int, float, float, str]:
        x = float(box.x)
        y = float(box.y)
        width = float(box.width)
        height = float(box.height)
        score = float(getattr(box, "score", 0.0))
        values = (x, y, width, height, score)
        if not all(math.isfinite(value) for value in values):
            raise ValueError("missing box geometry must be finite")
        if width <= 0 or height <= 0:
            raise ValueError("missing box dimensions must be positive")
        left = x < 0 or x + width > image_width
        top = y < 0 or y + height > image_height
        edge_count = int(left) + int(top)
        crowded_count = 0
        cx = x + width / 2
        cy = y + height / 2
        for peer in peers:
            if peer is box:
                continue
            px = float(peer.x)
            py = float(peer.y)
            pw = float(peer.width)
            ph = float(peer.height)
            if abs(cx - px - pw / 2) < (width + pw) * 0.85 and abs(
                cy - py - ph / 2
            ) < (height + ph) * 0.85:
                crowded_count += 1
        return (-crowded_count, -edge_count, -min(width, height), -score, repr(box))

    return tuple(sorted(boxes, key=metrics))

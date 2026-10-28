"""Consent-local two-brow previews from externally observed masks.

No hair, face, head-turn, or identity evidence is inferred from photo colour.
The default guard bounds pixel change and is not biometric authentication.
Every visible brow uses a supplied mask and every absent brow needs a reason.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import math
from collections import OrderedDict
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal, Protocol

import numpy as np
from numpy.typing import NDArray

ByteFrame = NDArray[np.uint8]
FloatMask = NDArray[np.float64]
FaceBox = tuple[float, float, float, float]
Mode = Literal["tint", "powder", "lamination"]
TrialStatus = Literal["rendered", "neutral", "no_mesh", "no_observation", "refused"]
SIDES = ("right_brow", "left_brow")
HIDDEN = ("not_visible:hidden_by_turn", "not_visible:occluded")
MODES = ("tint", "powder", "lamination")
SHADES: Mapping[str, tuple[int, int, int]] = {
    "deep": (42, 35, 32),
    "neutral": (82, 71, 64),
    "ash": (95, 89, 86),
    "warm": (105, 72, 57),
}
OPACITY = {"tint": 0.48, "powder": 0.36, "lamination": 0.20}
SIMULATION_LABEL = "Brow tone simulation. No hair or facial structure is generated."


def checked_level(value: object) -> float:
    """Level 1.0 is neutral; the 5.0 stop uses the full bounded treatment."""
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        raise ValueError("level must be a numeric decimal")
    level = float(value)
    if not math.isfinite(level) or not 1.0 <= level <= 5.0:
        raise ValueError("level must stay between 1.0 and 5.0")
    tick = round(10 * level)
    if abs(level * 10 - tick) > 1e-8:
        raise ValueError("level must use 0.1 increments")
    return tick / 10.0


def checked_image(image: ByteFrame) -> ByteFrame:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8:
        raise ValueError("brow trial needs uint8 image pixels")
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("brow trial needs RGB or RGBA")
    height, width = image.shape[:2]
    if min(height, width) < 8 or max(height, width) > 4096:
        raise ValueError("brow trial image dimensions are invalid")
    if height * width > 4_194_304:
        raise ValueError("brow trial image exceeds memory budget")
    return image


def checked_box(box: FaceBox | None) -> FaceBox | None:
    if box is None:
        return None
    if len(box) != 4 or any(isinstance(v, bool) for v in box):
        raise ValueError("primary face box requires four numeric coordinates")
    if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in box):
        raise ValueError("primary face box must have finite coordinates")
    left, top, right, bottom = box
    if not (0 <= left < right <= 1 and 0 <= top < bottom <= 1):
        raise ValueError("primary face box must have normalized positive area")
    return float(left), float(top), float(right), float(bottom)


def face_scope(shape: tuple[int, int], box: FaceBox) -> NDArray[np.bool_]:
    height, width = shape
    yy, xx = np.ogrid[:height, :width]
    left, top, right, bottom = box
    return ((xx >= left * width) & (xx < right * width)
            & (yy >= top * height) & (yy < bottom * height))


def checked_mask(value: object, shape: tuple[int, int]) -> FloatMask:
    try:
        mask = np.asarray(value, dtype=np.float64)
    except (ValueError, TypeError) as error:
        raise ValueError("brow mask must have numeric alpha") from error
    if mask.shape != shape or not np.all(np.isfinite(mask)):
        raise ValueError("brow mask must be finite and match the image")
    if np.any((mask < 0) | (mask > 1)):
        raise ValueError("brow mask alpha must be within 0..1")
    return mask.copy()


@dataclass(frozen=True)
class BrowObservation:
    """Exactly two sides, each either observed or explicitly not visible."""

    masks: Mapping[str, FloatMask]
    states: Mapping[str, str]
    source: str = "manual_or_measured"
    protected: FloatMask | None = None


class BrowMaskSource(Protocol):
    def observe(self, digest: str, frame: ByteFrame) -> BrowObservation: ...


@dataclass(frozen=True)
class GuardDecision:
    image: ByteFrame
    similarity: float
    limited: bool


class BrowGuard(Protocol):
    def guard(self, before: ByteFrame, candidate: ByteFrame, lock_level: float) -> GuardDecision: ...


class PixelGuard:
    """Conservative pixel cap until a verified external identity guard is wired."""

    def guard(self, before: ByteFrame, candidate: ByteFrame, lock_level: float) -> GuardDecision:
        level = checked_level(lock_level)
        limit = int(12 + (5.0 - level) * 10)
        original = before[..., :3].astype(np.int16)
        proposed = candidate[..., :3].astype(np.int16)
        delta = proposed - original
        bounded = np.clip(delta, -limit, limit)
        result = before.copy()
        result[..., :3] = (original + bounded).astype(np.uint8)
        distance = float(np.mean(np.abs(delta)))
        return GuardDecision(result, 1.0 - distance / 255, bool(np.any(delta != bounded)))


@dataclass(frozen=True)
class BrowTrialResult:
    image: ByteFrame
    status: TrialStatus
    reason: str
    mode: Mode
    level: float
    visible_brows: int
    changed_pixels: int
    guard_called: bool
    limited: bool
    similarity_proxy: float | None
    label: str = SIMULATION_LABEL

    def safe_report(self) -> dict[str, object]:
        return {
            "format": "beljour-brow-trial/1",
            "status": self.status,
            "reason": self.reason,
            "mode": self.mode,
            "level": self.level,
            "visible_brows": self.visible_brows,
            "changed_pixels": self.changed_pixels,
            "guard_called": self.guard_called,
            "limited": self.limited,
            "quality_verdict": "UNPROVEN",
            "simulation": True,
        }


def prepare(observation: BrowObservation, shape: tuple[int, int]) -> BrowObservation:
    if not isinstance(observation, BrowObservation):
        raise ValueError("brow source must return a typed observation")
    if set(observation.masks) != set(SIDES) or set(observation.states) != set(SIDES):
        raise ValueError("both brow masks and visibility states are required")
    if observation.source not in ("manual_or_measured", "observed_geometry"):
        raise ValueError("brow observation requires a reviewed source")
    masks = {side: checked_mask(observation.masks[side], shape) for side in SIDES}
    for side in SIDES:
        if observation.states[side] not in ("visible", *HIDDEN):
            raise ValueError("unknown brow visibility state")
    protected = None
    if observation.protected is not None:
        protected = checked_mask(observation.protected, shape)
    return BrowObservation(masks, dict(observation.states), observation.source, protected)


def _render_rgb(
    image: ByteFrame, support: FloatMask, level: float, mode: Mode, shade: str,
) -> ByteFrame:
    source = image[..., :3].astype(np.float64)
    target = np.minimum(source, np.asarray(SHADES[shade], dtype=np.float64))
    amount = support * ((level - 1.0) / 4.0) * OPACITY[mode]
    output = image.copy()
    revised = source * (1.0 - amount[..., None]) + target * amount[..., None]
    output[..., :3] = np.clip(np.floor(revised + 0.5), 0, 255).astype(np.uint8)
    return output


class BrowTrialSession:
    """Revision-scoped mask cache; photos are never retained in cache entries."""

    def __init__(
        self, source: BrowMaskSource, guard: BrowGuard | None = None, *, max_entries: int = 4,
    ) -> None:
        if not 1 <= max_entries <= 16:
            raise ValueError("mask cache capacity must be within 1..16")
        self.source = source
        self.guard = guard if guard is not None else PixelGuard()
        self.max_entries = max_entries
        self.mask_computations = 0
        self._masks: OrderedDict[str, BrowObservation] = OrderedDict()

    @property
    def retained_observations(self) -> int:
        return len(self._masks)

    def invalidate(self, photo_digest: str | None = None) -> None:
        if photo_digest is None:
            self._masks.clear()
            return
        for key in list(self._masks):
            if key.startswith(photo_digest + ":"):
                del self._masks[key]

    def render(
        self,
        photo: ByteFrame,
        *,
        box: FaceBox | None,
        level: float = 2.0,
        mode: Mode = "tint",
        shade: str = "neutral",
        lock_level: float = 5.0,
        revision: str = "0",
    ) -> BrowTrialResult:
        checked_image(photo)
        value = checked_level(level)
        lock = checked_level(lock_level)
        if mode not in MODES or shade not in SHADES:
            raise ValueError("unknown brow mode or original shade")
        if not isinstance(revision, str) or not 1 <= len(revision) <= 64:
            raise ValueError("mask revision must be a bounded string")
        primary = checked_box(box)

        def refusal(status: TrialStatus, reason: str) -> BrowTrialResult:
            return BrowTrialResult(photo.copy(), status, reason, mode, value, 0, 0, False, False, None)

        if primary is None:
            return refusal("no_mesh", "primary_face_unavailable")
        digest = hashlib.sha256(np.ascontiguousarray(photo).tobytes()).hexdigest()
        key = digest + ":" + str(primary) + ":" + revision
        observed = self._masks.get(key)
        if observed is None:
            received = self.source.observe(digest, photo.copy())
            observed = prepare(received, photo.shape[:2])
            self._masks[key] = observed
            self.mask_computations += 1
            if len(self._masks) > self.max_entries:
                self._masks.popitem(last=False)
        else:
            self._masks.move_to_end(key)

        selected_face = face_scope(photo.shape[:2], primary)
        visible: list[str] = []
        supports: list[NDArray[np.bool_]] = []
        for side in SIDES:
            region = observed.masks[side] >= 0.5
            state = observed.states[side]
            if np.any(region & ~selected_face):
                return refusal("refused", "brow_outside_primary_face")
            if state == "visible":
                if int(np.count_nonzero(region)) < 8:
                    return refusal("refused", "unexplained_missing_brow")
                visible.append(side)
                supports.append(region)
            elif np.any(region):
                return refusal("refused", "contradictory_brow_visibility")
        if len(supports) == 2 and np.any(supports[0] & supports[1]):
            return refusal("refused", "overlapping_brow_masks")
        if not visible:
            return refusal("no_observation", "no_visible_brow")

        support = np.zeros(photo.shape[:2], dtype=np.float64)
        for side in visible:
            weights = observed.masks[side]
            support[weights >= 0.5] = weights[weights >= 0.5]
        if observed.protected is not None:
            support[observed.protected >= 0.5] = 0.0
        if photo.shape[2] == 4:
            support[photo[..., 3] == 0] = 0.0
        if not np.any(support > 0):
            return refusal("no_observation", "brow_fully_protected")
        candidate = _render_rgb(photo, support, value, mode, shade)
        decision = self.guard.guard(photo.copy(), candidate.copy(), lock)
        if not isinstance(decision, GuardDecision):
            raise ValueError("identity guard must return a typed decision")
        if not isinstance(decision.similarity, (float, int)) or not math.isfinite(decision.similarity):
            raise ValueError("identity guard needs finite similarity evidence")
        if not 0 <= decision.similarity <= 1 or not isinstance(decision.limited, bool):
            raise ValueError("identity guard returned invalid decision fields")
        if decision.image.shape != photo.shape or decision.image.dtype != np.uint8:
            raise ValueError("identity guard returned invalid image shape or dtype")
        output = photo.copy()
        active = support > 0
        output[active, :3] = decision.image[active, :3]
        changed = int(np.count_nonzero(np.any(output[..., :3] != photo[..., :3], axis=2)))
        return BrowTrialResult(
            output, "rendered" if changed else "neutral", "observed_local_simulation",
            mode, value, len(visible), changed, True, decision.limited, decision.similarity,
        )

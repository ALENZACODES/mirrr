"""Consent-local iris preview with observed masks and a bounded identity guard.

No landmarks, hair, skin colour or identity are inferred. A mask provider is
injected, and absence of a primary face causes a coded refusal. The default
pixel guard is not biometric identity recognition. Author: John Khan.
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

from .iris_colour import LABEL, SHADES, VisibleIrisResult, recolour_visible

ByteFrame = NDArray[np.uint8]
FloatPlane = NDArray[np.float64]
IrisState = Literal["visible", "not_visible:closed", "not_visible:hidden_by_turn"]
IrisStatus = Literal["rendered", "no_mesh", "no_observation", "refused", "neutral"]
FaceBox = tuple[float, float, float, float]
VALID_STATES = ("visible", "not_visible:closed", "not_visible:hidden_by_turn")
IRIS_NAMES = ("right_iris", "left_iris")
DEFAULT_LOCK_LEVEL = 5.0
MAX_PIXELS = 4_194_304
MAX_ENTRIES = 4


def checked_level(value: object) -> float:
    """The same exact decimal grid as women's other presentation controls."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("level must be numeric")
    level = float(value)
    if not math.isfinite(level) or level < 1.0 or level > 5.0:
        raise ValueError("level must be within 1.0..5.0")
    tick = round(10.0 * level)
    if abs(10.0 * level - tick) > 1e-8:
        raise ValueError("level requires 0.1 increments")
    return tick / 10.0


def legacy_strength(level: float) -> float:
    """ASSUMED mapping: 1.0 is neutral, 5.0 is the previous 100 stop."""
    return (checked_level(level) - 1.0) * 25.0


def checked_photo(image: ByteFrame) -> ByteFrame:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8:
        raise ValueError("iris trial requires uint8 pixels")
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("iris trial requires RGB or RGBA")
    height, width = image.shape[:2]
    if min(height, width) < 8 or max(height, width) > 4096:
        raise ValueError("iris trial dimensions are outside supported bounds")
    if height * width > MAX_PIXELS:
        raise ValueError("iris trial frame exceeds the pixel budget")
    return image


def checked_box(box: FaceBox | None) -> FaceBox | None:
    if box is None:
        return None
    if len(box) != 4 or any(isinstance(value, bool) for value in box):
        raise ValueError("primary face box must contain four coordinates")
    if not all(isinstance(value, (int, float)) and math.isfinite(value) for value in box):
        raise ValueError("primary face box requires finite coordinates")
    left, top, right, bottom = box
    if not (0 <= left < right <= 1 and 0 <= top < bottom <= 1):
        raise ValueError("primary face box must be normalized with positive area")
    return float(left), float(top), float(right), float(bottom)


def face_support(shape: tuple[int, int], box: FaceBox) -> NDArray[np.bool_]:
    height, width = shape
    left, top, right, bottom = box
    yy, xx = np.ogrid[:height, :width]
    return ((xx >= left * width) & (xx < right * width)
            & (yy >= top * height) & (yy < bottom * height))


@dataclass(frozen=True)
class IrisObservation:
    """Supplied two-eye masks, with observation states from external geometry."""

    masks: Mapping[str, FloatPlane]
    states: Mapping[str, str]
    source: str = "manual_or_measured"
    pupils: Mapping[str, FloatPlane] | None = None


class IrisMaskProvider(Protocol):
    def observe(self, image_digest: str, photo: ByteFrame) -> IrisObservation: ...


@dataclass(frozen=True)
class IdentityDecision:
    image: ByteFrame
    similarity: float
    blended_back: bool


class IdentityGuard(Protocol):
    def guard(self, before: ByteFrame, after: ByteFrame, lock_level: float) -> IdentityDecision: ...


class PixelLimitGuard:
    """Default-on pixel displacement cap, explicitly not biometric similarity."""

    def guard(self, before: ByteFrame, after: ByteFrame, lock_level: float) -> IdentityDecision:
        lock = checked_level(lock_level)
        difference = float(np.mean(np.abs(
            before[..., :3].astype(np.float64) - after[..., :3].astype(np.float64)
        )))
        similarity = 1.0 - difference / 255.0
        limit = 0.0015 + 0.0185 * (5.0 - lock) / 4.0
        if difference == 0.0 or difference <= limit * 255.0:
            return IdentityDecision(after.copy(), similarity, False)
        factor = limit * 255.0 / difference
        revised = before.copy()
        updated = before[..., :3].astype(np.float64)
        updated += (after[..., :3].astype(np.float64) - updated) * factor
        revised[..., :3] = np.clip(np.trunc(updated), 0, 255).astype(np.uint8)
        return IdentityDecision(revised, similarity, True)


@dataclass(frozen=True)
class IrisTrialResult:
    image: ByteFrame
    width: int
    height: int
    level: float
    shade: str
    status: IrisStatus
    reason: str
    visible_irises: int
    changed_pixels: int
    similarity: float | None
    guard_called: bool
    blended_back: bool
    declared_not_visible: tuple[str, ...]
    undeclared_missing: tuple[str, ...]
    simulation_label: str = LABEL

    def safe_report(self) -> dict[str, object]:
        """No photo data, hash, coordinates, masks or subject IDs leave this report."""
        return {
            "format": "beljour-iris-trial/1",
            "status": self.status,
            "reason": self.reason,
            "level": self.level,
            "shade": self.shade,
            "visible_irises": self.visible_irises,
            "changed_pixels": self.changed_pixels,
            "guard_called": self.guard_called,
            "blended_back": self.blended_back,
            "declared_not_visible": list(self.declared_not_visible),
            "undeclared_missing": list(self.undeclared_missing),
            "quality_verdict": "UNPROVEN",
            "simulation": True,
        }


def _prepared_observation(observed: IrisObservation, shape: tuple[int, int]) -> IrisObservation:
    if not isinstance(observed, IrisObservation):
        raise ValueError("mask source must return a typed iris observation")
    if set(observed.masks) != set(IRIS_NAMES) or set(observed.states) != set(IRIS_NAMES):
        raise ValueError("both observed iris sides are required")
    if observed.source not in ("manual_or_measured", "observed_geometry"):
        raise ValueError("iris observation must have reviewed provenance")
    checked: dict[str, FloatPlane] = {}
    for name in IRIS_NAMES:
        state = observed.states[name]
        if not isinstance(state, str) or state not in VALID_STATES:
            raise ValueError("unknown iris visibility state")
        try:
            mask = np.asarray(observed.masks[name], dtype=np.float64)
        except (TypeError, ValueError) as error:
            raise ValueError("iris mask must contain finite alpha") from error
        if mask.shape != shape or not np.all(np.isfinite(mask)):
            raise ValueError("iris mask size or finite alpha is invalid")
        if np.any((mask < 0.0) | (mask > 1.0)):
            raise ValueError("iris mask alpha must be in 0..1")
        checked[name] = mask.copy()
    pupils = None
    if observed.pupils is not None:
        if set(observed.pupils) != set(IRIS_NAMES):
            raise ValueError("both pupil annotations must be supplied together")
        pupils = {}
        for name in IRIS_NAMES:
            try:
                pupil = np.asarray(observed.pupils[name], dtype=np.float64)
            except (TypeError, ValueError) as error:
                raise ValueError("pupil annotation needs numeric alpha") from error
            if pupil.shape != shape or not np.all(np.isfinite(pupil)):
                raise ValueError("pupil annotation must match image dimensions")
            if np.any((pupil < 0) | (pupil > 1)):
                raise ValueError("pupil annotation alpha must be in 0..1")
            if np.any((pupil >= 0.5) & (checked[name] < 0.5)):
                raise ValueError("observed pupil must lie within the measured iris")
            pupils[name] = pupil.copy()
    return IrisObservation(checked, dict(observed.states), observed.source, pupils)


def _preview(image: ByteFrame, edge: int) -> ByteFrame:
    if edge < 16 or edge > 4096:
        raise ValueError("preview_edge must be 16..4096")
    height, width = image.shape[:2]
    scale = min(1.0, edge / max(height, width))
    new_h = max(1, round(height * scale))
    new_w = max(1, round(width * scale))
    iy = np.trunc(np.arange(new_h) * (height - 1) / max(new_h - 1, 1)).astype(np.intp)
    ix = np.trunc(np.arange(new_w) * (width - 1) / max(new_w - 1, 1)).astype(np.intp)
    return image[iy[:, None], ix[None, :]].copy()


class IrisTrialEngine:
    """Memory-bounded observed-mask reuse, never caching source or output pixels."""

    def __init__(
        self, provider: IrisMaskProvider, guard: IdentityGuard | None = None,
        *, max_entries: int = MAX_ENTRIES,
    ) -> None:
        if not isinstance(max_entries, int) or isinstance(max_entries, bool):
            raise ValueError("cache limit must be a positive integer")
        if not 1 <= max_entries <= 16:
            raise ValueError("cache limit must be 1..16")
        self._provider = provider
        self._guard = guard if guard is not None else PixelLimitGuard()
        self._observations: OrderedDict[str, IrisObservation] = OrderedDict()
        self._max_entries = max_entries
        self.mask_computations = 0

    @property
    def retained_observations(self) -> int:
        return len(self._observations)

    def invalidate(self, image_digest: str | None = None) -> None:
        """Call when a manual mask is corrected or the edited photograph changes."""
        if image_digest is None:
            self._observations.clear()
        else:
            self._observations.pop(image_digest, None)

    def _observed(self, digest: str, image: ByteFrame) -> IrisObservation:
        cached = self._observations.get(digest)
        if cached is not None:
            self._observations.move_to_end(digest)
            return cached
        measured = _prepared_observation(self._provider.observe(digest, image), image.shape[:2])
        self._observations[digest] = measured
        self.mask_computations += 1
        while len(self._observations) > self._max_entries:
            self._observations.popitem(last=False)
        return measured

    def render(
        self, image: ByteFrame, *, box: FaceBox | None, level: float = 2.0,
        shade: str = "hazel", lock_level: float = DEFAULT_LOCK_LEVEL,
        preview_edge: int | None = None,
    ) -> IrisTrialResult:
        photo = checked_photo(image)
        selected = checked_level(level)
        locked = checked_level(lock_level)
        primary = checked_box(box)
        if shade not in SHADES:
            raise ValueError("unknown original iris shade")
        if preview_edge is not None and (
            not isinstance(preview_edge, int) or isinstance(preview_edge, bool)
        ):
            raise ValueError("preview_edge must be an integer")
        if preview_edge is not None and not 16 <= preview_edge <= 4096:
            raise ValueError("preview_edge must be 16..4096")
        if primary is None:
            return self._result(photo, selected, shade, "no_mesh", "primary_face_missing")
        digest = hashlib.sha256(np.ascontiguousarray(photo).tobytes()).hexdigest()
        observed = self._observed(digest, photo)
        face = face_support(photo.shape[:2], primary)
        if any(np.any((observed.masks[name] >= 0.5) & ~face) for name in IRIS_NAMES):
            return self._result(photo, selected, shade, "refused", "iris_outside_primary_face")
        raw: VisibleIrisResult = recolour_visible(
            np.ascontiguousarray(photo[..., :3]), observed.masks, observed.states,
            shade=shade, strength=legacy_strength(selected),
        )
        candidate = photo.copy()
        candidate[..., :3] = raw.image
        if observed.pupils is not None:
            protected = np.zeros(photo.shape[:2], dtype=np.bool_)
            for mask in observed.pupils.values():
                protected |= mask >= 0.5
            candidate[..., :3] = np.where(
                protected[..., None], photo[..., :3], candidate[..., :3]
            )
        decision = self._guard.guard(photo, candidate.copy(), locked)
        if not isinstance(decision, IdentityDecision):
            raise ValueError("identity guard must return a typed decision")
        if decision.image.dtype != np.uint8 or decision.image.shape != photo.shape:
            raise ValueError("identity guard returned wrong shape or byte type")
        if not math.isfinite(decision.similarity) or not 0 <= decision.similarity <= 1:
            raise ValueError("identity guard returned invalid similarity evidence")
        permitted = np.any(candidate[..., :3] != photo[..., :3], axis=2) & face
        rendered = photo.copy()
        rendered[..., :3] = np.where(permitted[..., None], decision.image[..., :3], photo[..., :3])
        changed = int(np.count_nonzero(np.any(rendered[..., :3] != photo[..., :3], axis=2)))
        state: IrisStatus = (
            "rendered" if raw.eligible and changed
            else "neutral" if selected == 1 else "refused"
        )
        reason = "neutral_level" if state == "neutral" else raw.reason
        scaled = rendered if preview_edge is None else _preview(rendered, preview_edge)
        return IrisTrialResult(
            scaled, scaled.shape[1], scaled.shape[0], selected, shade, state, reason,
            raw.visible_irises if raw.eligible else 0, changed, decision.similarity,
            True, decision.blended_back, raw.declared_not_visible, raw.undeclared_missing,
        )

    @staticmethod
    def _result(
        image: ByteFrame, level: float, shade: str, status: IrisStatus, reason: str,
    ) -> IrisTrialResult:
        return IrisTrialResult(
            image.copy(), image.shape[1], image.shape[0], level, shade, status, reason,
            0, 0, None, False, False, (), (),
        )

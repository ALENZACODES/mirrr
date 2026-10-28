"""Bounded, mask-only hair-fibre cover on the 1.0--5.0 scale.

This draws a deterministic *illustration* of a topical product, not hair growth,
restoration, diagnosis or physical coverage. No provider calls. Author: John Khan.
"""
from __future__ import annotations

import hashlib
from collections import OrderedDict
from dataclasses import dataclass
from typing import Literal, Protocol, runtime_checkable

import numpy as np
from numpy.typing import NDArray

from ...commerce.strength import DEFAULT_LOCK, validate_level
from . import crown
from .strands import cut_for_level

Zone = Literal["crown", "parting", "hairline"]
RefusalCode = Literal["no_mesh", "empty_region", "degenerate_mask", "no_scalp", "no_hair_reference", "invalid_image"]
LABEL = "Simulation of a topical hair-fibre product. A photo-based estimate, not a diagnosis."
MAX_PIXELS = 4_500_000
Mask = NDArray[np.bool_]
Pixels = NDArray[np.uint8]


@dataclass(frozen=True)
class CoverRefusal:
    code: RefusalCode
    reason: str
    rendered: bool = False


@dataclass(frozen=True)
class CoverDecision:
    image: Pixels
    similarity: float
    blended: bool


@runtime_checkable
class HeadLandmarks(Protocol):
    """Caller-supplied validated primary head geometry, not inferred from pixels."""

    def validate(self) -> None: ...


class CoverGuard(Protocol):
    """ASSUMED boundary for future Lane H guard; not biometric proof."""

    def guard(self, before: Pixels, after: Pixels, lock_level: float) -> CoverDecision: ...


class DefaultCoverGuard:
    """Conservative pixel guard until Lane H publishes its public identity API."""

    def guard(self, before: Pixels, after: Pixels, lock_level: float) -> CoverDecision:
        level = validate_level(lock_level)
        distance = float(np.abs(before.astype(np.int16) - after.astype(np.int16)).mean()) / 255.0
        similarity = 1.0 - distance
        minimum = 0.935 + 0.05 * (level - 1.0) / 4.0  # ASSUMED pixel-proxy threshold
        if similarity >= minimum:
            return CoverDecision(after.copy(), similarity, False)
        factor = max(0.0, min(1.0, (1.0 - minimum) / max(distance, 1e-12)))
        mixed = np.clip(np.rint(before.astype(np.float64) * (1 - factor) + after * factor), 0, 255)
        blended = mixed.astype(np.uint8)
        measured = 1 - float(np.abs(before.astype(np.int16) - blended.astype(np.int16)).mean()) / 255.0
        return CoverDecision(blended, measured, True)


@dataclass(frozen=True)
class PreparedCover:
    photo_hash: str
    zone: Zone
    support: Mask
    scalp: Mask
    hair_rgb: tuple[int, int, int]
    texture: NDArray[np.float64]
    scalp_share: float
    split: crown.ScalpSplit


@dataclass(frozen=True)
class CoverResult:
    image: Pixels
    level: float
    zone: Zone
    before_share: float
    after_share: float
    changed_pixels: int
    identity_similarity: float
    identity_blended: bool
    measured_hair_rgb: tuple[int, int, int]
    rendered: bool = True
    simulated: bool = True
    provider_calls: int = 0
    label: str = LABEL

    def public(self) -> dict[str, object]:
        return {"level": self.level, "zone": self.zone, "before_share": self.before_share,
                "after_share": self.after_share, "changed_pixels": self.changed_pixels,
                "identity_guard": {"applied": True, "similarity": self.identity_similarity,
                                   "blended": self.identity_blended, "engine": "pixel_proxy"},
                "rendered": self.rendered, "simulated": self.simulated, "provider_calls": 0,
                "label": self.label}


def _binary_mask(value: object, shape: tuple[int, int]) -> Mask | None:
    data = np.asarray(value)
    if data.shape != shape or data.dtype not in (np.bool_, np.uint8, np.float32, np.float64):
        return None
    if data.dtype == np.uint8:
        return data >= 128
    if not np.all(np.isfinite(data)) or bool(np.any(data < 0)) or bool(np.any(data > 1)):
        return None
    return data >= 0.5


def _primary_clip(shape: tuple[int, int], box: tuple[int, int, int, int] | None) -> Mask | None:
    height, width = shape
    clipped = np.ones(shape, dtype=bool)
    if box is None:
        return clipped
    if (len(box) != 4 or any(type(c) is not int for c in box) or
            not 0 <= box[0] < box[2] <= width or not 0 <= box[1] < box[3] <= height):
        return None
    clipped[:] = False
    clipped[box[1]:box[3], box[0]:box[2]] = True
    return clipped


class CoverSession:
    """Session-scoped bounded cache. Never persists images, masks or face hashes."""

    def __init__(self, *, capacity: int = 4) -> None:
        if type(capacity) is not int or not 1 <= capacity <= 8:
            raise ValueError("Cover cache capacity must be 1..8")
        self._capacity = capacity
        self._prepared: OrderedDict[str, PreparedCover] = OrderedDict()
        self.zone_grid_calls = 0
        self.split_calls = 0
        self.energy_calls = 0

    def clear(self) -> None:
        self._prepared.clear()

    def _prepare(self, image: Pixels, region: Mask, scalp: Mask, *, zone: Zone,
                 palette_rgb: tuple[int, int, int] | None) -> PreparedCover | CoverRefusal:
        if not bool(region.any()):
            return CoverRefusal("empty_region", "Mark a hair region first")
        if int(region.sum()) < 16:
            return CoverRefusal("degenerate_mask", "The marked hair region is too small")
        if not bool(scalp.any()):
            return CoverRefusal("no_scalp", "Mark visible scalp within the hair region")
        hair = region & ~scalp
        if int(hair.sum()) < 8 and palette_rgb is None:
            return CoverRefusal("no_hair_reference", "Mark some existing hair or choose a colour")
        key_hash = hashlib.sha256()
        key_hash.update(image.tobytes())
        key_hash.update(region.tobytes())
        key_hash.update(scalp.tobytes())
        key_hash.update(zone.encode("ascii"))
        key_hash.update(bytes(palette_rgb) if palette_rgb is not None else b"measured")
        key = key_hash.hexdigest()
        cached = self._prepared.get(key)
        if cached is not None:
            self._prepared.move_to_end(key)
            return cached
        try:
            grid = crown.grid_for(region)
            self.zone_grid_calls += 1
            parts = crown.split(image, region)
            self.split_calls += 1
            energy = crown.strand_energy(image)
            self.energy_calls += 1
        except (ValueError, FloatingPointError):
            return CoverRefusal("degenerate_mask", "Unable to read this marked scalp region")
        zones = grid.zone_index(*image.shape[:2])
        if zone == "crown":
            selected = (zones == 4) | (zones == 5)
        elif zone == "parting":
            selected = (zones == 1) | (zones == 3)
        else:
            selected = (zones >= 0) & (zones <= 2)
        eligible = scalp & selected
        if not bool(eligible.any()):
            return CoverRefusal("no_scalp", "No visible scalp in the selected zone")
        if palette_rgb is not None:
            colour = palette_rgb
        else:
            rgb = np.median(image[..., :3][hair].astype(np.float64), axis=0)
            colour = (int(rgb[0] + 0.5), int(rgb[1] + 0.5), int(rgb[2] + 0.5))
        # A small, fixed modulation uses measured strand energy without biasing coverage upward.
        norm = energy / max(float(np.percentile(energy[region], 95)), 1e-7)
        texture = np.clip(0.90 + 0.10 * norm, 0.90, 1.0)
        plan = PreparedCover(key, zone, region.copy(), eligible, colour, texture,
                             float(eligible.sum()) / float(region.sum()), parts)
        self._prepared[key] = plan
        while len(self._prepared) > self._capacity:
            self._prepared.popitem(last=False)
        return plan

    def render(self, image: object, hair_region: object, scalp_show: object, *,
               zone: Zone = "crown", level: object = 3.0,
               landmarks: HeadLandmarks | None = None,
               primary_box: tuple[int, int, int, int] | None = None,
               palette_rgb: tuple[int, int, int] | None = None,
               guard: CoverGuard | None = None, lock_level: object = DEFAULT_LOCK,
               phase: Literal["moving", "release"] = "release") -> CoverResult | CoverRefusal:
        """No mesh -> coded refusal; only the caller-approved primary-head region changes."""
        checked = validate_level(level)
        locked = validate_level(lock_level)
        if phase not in ("moving", "release"):
            raise ValueError("Unknown local preview phase")
        if zone not in ("crown", "parting", "hairline"):
            raise ValueError("Unknown fibre cover zone")
        if not isinstance(landmarks, HeadLandmarks):
            return CoverRefusal("no_mesh", "Primary-face landmarks are required")
        try:
            landmarks.validate()
        except ValueError:
            return CoverRefusal("no_mesh", "Primary-face landmarks are invalid")
        pixels = np.asarray(image)
        if (pixels.dtype != np.uint8 or pixels.ndim != 3 or pixels.shape[2] not in (3, 4) or
                pixels.shape[0] < 8 or pixels.shape[1] < 8 or pixels.shape[0] * pixels.shape[1] > MAX_PIXELS):
            return CoverRefusal("invalid_image", "Expected a bounded RGB or RGBA photo")
        shape = (int(pixels.shape[0]), int(pixels.shape[1]))
        region = _binary_mask(hair_region, shape)
        scalp = _binary_mask(scalp_show, shape)
        box = _primary_clip(shape, primary_box)
        if region is None or scalp is None or box is None:
            return CoverRefusal("degenerate_mask", "Invalid hair or primary-face region")
        region &= box
        scalp &= region
        if palette_rgb is not None and (len(palette_rgb) != 3 or any(type(c) is not int or not 0 <= c <= 255
                                                                     for c in palette_rgb)):
            raise ValueError("Fibre pigment requires three RGB bytes")
        plan = self._prepare(pixels, region, scalp, zone=zone, palette_rgb=palette_rgb)
        if isinstance(plan, CoverRefusal):
            return plan
        weight = cut_for_level(checked)
        opacity = plan.scalp.astype(np.float64) * weight * plan.texture
        changed = pixels.copy()
        pigment = np.asarray(plan.hair_rgb, dtype=np.float64)
        rgb = pixels[..., :3].astype(np.float64)
        mixed = rgb * (1 - opacity[..., None]) + pigment[None, None, :] * opacity[..., None]
        changed[..., :3] = np.floor(mixed + 0.5).astype(np.uint8)
        check = (DefaultCoverGuard() if guard is None else guard).guard(pixels.copy(), changed.copy(), locked)
        if (check.image.shape != pixels.shape or check.image.dtype != np.uint8 or
                not np.isfinite(check.similarity) or not 0 <= check.similarity <= 1):
            raise ValueError("Identity guard returned an invalid result")
        # No guard, including a test double, may grant pixels outside the selected hair region.
        output = pixels.copy()
        output[..., :3][plan.scalp] = check.image[..., :3][plan.scalp]
        edited = int(np.count_nonzero(np.any(output[..., :3] != pixels[..., :3], axis=-1)))
        effective = np.mean(opacity[plan.scalp]) if bool(plan.scalp.any()) else 0.0
        if phase == "moving" and max(output.shape[:2]) > 256:
            h, w = output.shape[:2]
            ratio = 256 / max(h, w)
            ph, pw = max(1, round(h * ratio)), max(1, round(w * ratio))
            rows = np.minimum((np.arange(ph) * h / ph).astype(int), h - 1)
            cols = np.minimum((np.arange(pw) * w / pw).astype(int), w - 1)
            output = output[rows[:, None], cols[None, :]].copy()
        return CoverResult(output, checked, zone, plan.scalp_share,
                           plan.scalp_share * (1 - float(effective)), edited,
                           check.similarity, check.blended, plan.hair_rgb)

"""Safe hair-guide compositor and bounded editing-session cache. Author: John Khan.

Every preview requires caller-verified hair coverage and head geometry. The
renderer adds only tonal placement cues to already present pixels, rather than
synthesizing bangs, extensions, or a changed hair silhouette.
"""

from __future__ import annotations

import hashlib
import math
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal, TypeAlias

import numpy as np
from numpy.typing import NDArray

from plumb_api.engines.gender_look.levels import DEFAULT_LOCK_LEVEL, IdentityGuard, PixelChangeGuard, checked_level

from .contracts import HairGeometry, validate_mask, validate_photo
from .style_guides import (
    SIMULATION_LABEL,
    GuideField,
    StyleKey,
    TextureKey,
    definition,
    fields,
    validate_geometry,
)

ByteImage: TypeAlias = NDArray[np.uint8]
FloatPlane: TypeAlias = NDArray[np.float64]
PrimaryBox: TypeAlias = tuple[float, float, float, float]
GuideFactory: TypeAlias = Callable[[StyleKey, HairGeometry, int, int, int, int], GuideField]
TextureFrequencies: TypeAlias = tuple[float, float, float]
TEXTURE_FREQUENCIES: dict[TextureKey, TextureFrequencies] = {
    "straight": (1.8, 0.9, 0.12),
    "wavy": (3.7, 2.7, 0.21),
    "curly": (6.3, 5.2, 0.28),
    "coily": (9.5, 8.3, 0.32),
}


@dataclass(frozen=True)
class StylePreview:
    image: ByteImage
    coverage: FloatPlane
    style_id: StyleKey
    texture: TextureKey
    level: float
    rendered: bool
    status: Literal["rendered", "no_mesh", "empty_selection"]
    changed_pixel_share: float
    guard_called: bool
    blended_back: bool
    identity_similarity: float | None
    simulation_label: str = SIMULATION_LABEL


def _box(value: PrimaryBox | None) -> PrimaryBox | None:
    if value is None:
        return None
    if len(value) != 4 or any(isinstance(entry, bool) or not isinstance(entry, (int, float))
                              for entry in value):
        raise ValueError("primary-face rectangle must contain numbers")
    if not all(math.isfinite(float(entry)) for entry in value):
        raise ValueError("a finite primary-face rectangle is required")
    left, top, right, bottom = value
    if left < 0 or top < 0 or right > 1 or bottom > 1 or not (left < right and top < bottom):
        raise ValueError("invalid primary-face rectangle")
    return left, top, right, bottom


def _texture_offset(
    width: int,
    start: int,
    stop: int,
    texture: TextureKey,
    orientation: float,
) -> FloatPlane:
    """Use absolute pixel coordinates; independent tiles have no phase seams."""
    horizontal, vertical, grain = TEXTURE_FREQUENCIES[texture]
    yy, xx = np.mgrid[start:stop, :width]
    radians = orientation * 1.57
    along = xx * math.cos(radians) + yy * math.sin(radians)
    across = yy * math.cos(radians) - xx * math.sin(radians)
    stripes = np.sin((along * horizontal + across * 0.37) * 0.18)
    waves = np.cos((across * vertical - along * 0.2) * 0.21)
    return grain * (0.65 * stripes + 0.35 * waves)


def _required_masks(
    original: ByteImage,
    hair_mask: FloatPlane,
    side_mask: FloatPlane | None,
    protected_mask: FloatPlane | None,
) -> tuple[FloatPlane, NDArray[np.bool_]]:
    size = original.shape[:2]
    hair = validate_mask(hair_mask, size, "hair mask")
    side = np.zeros(size, dtype=np.float64)
    if side_mask is not None:
        side = validate_mask(side_mask, size, "side region")
    protected = np.zeros(size, dtype=np.float64)
    if protected_mask is not None:
        protected = validate_mask(protected_mask, size, "protected regions")
    # Any positive protection prevents editing, even at a fractional edge.
    return np.maximum(hair, side), protected > 0.0


def _refusal(
    original: ByteImage,
    style: StyleKey,
    texture: TextureKey,
    level: float,
    code: Literal["no_mesh", "empty_selection"],
) -> StylePreview:
    return StylePreview(original.copy(), np.zeros(original.shape[:2], dtype=np.float64), style, texture,
                        level, False, code, 0.0, False, False, None)


def render_style_guide(
    image: ByteImage,
    hair_mask: FloatPlane,
    geometry: HairGeometry | None,
    style: StyleKey,
    level: float,
    *,
    texture: TextureKey = "straight",
    side_mask: FloatPlane | None = None,
    protected_mask: FloatPlane | None = None,
    primary_box: PrimaryBox | None = None,
    lock_level: float = DEFAULT_LOCK_LEVEL,
    identity_guard: IdentityGuard | None = None,
    tile_height: int = 128,
    guide_factory: GuideFactory = fields,
) -> StylePreview:
    """Render a mask-scoped tonal guide at an exact one-decimal level.

    Level 1.0 never changes pixels; higher levels expose increasing *area*,
    not opacity. The identity protocol always runs on a renderable selection.
    A malicious guard cannot edit outside masks, change alpha, or mutate input.
    """
    original = validate_photo(image).copy()
    strength = checked_level(level)
    lock = checked_level(lock_level)
    design = definition(style)
    if texture not in TEXTURE_FREQUENCIES:
        raise ValueError("unsupported hair texture")
    if not isinstance(tile_height, int) or isinstance(tile_height, bool) or not 16 <= tile_height <= 512:
        raise ValueError("tile height must be 16..512 rows")
    selected, protected = _required_masks(original, hair_mask, side_mask, protected_mask)
    checked_box = _box(primary_box)
    if geometry is None or checked_box is None:
        return _refusal(original, style, texture, strength, "no_mesh")
    validate_geometry(geometry)
    height, width = original.shape[:2]
    left, top, right, bottom = checked_box
    threshold = (strength - 1.0) / 4.0
    coverage = np.zeros((height, width), dtype=np.float64)
    candidate = original.copy()
    has_eligible_hair = False
    for start in range(0, height, tile_height):
        stop = min(height, start + tile_height)
        guide = guide_factory(style, geometry, width, height, start, stop)
        tile_shape = (stop - start, width)
        if guide.zone.shape != tile_shape or guide.grade.shape != tile_shape or guide.tone.shape != tile_shape:
            raise ValueError("guide tile has incompatible dimensions")
        for plane in (guide.zone, guide.grade, guide.tone):
            if not np.all(np.isfinite(plane)):
                raise ValueError("nonfinite hairstyle guide")
        if np.any(guide.zone < 0) or np.any(guide.zone > 1):
            raise ValueError("guide zone outside allowed coverage")
        if np.any(guide.grade < 0) or np.any(guide.grade > 1):
            raise ValueError("guide grade outside [0,1]")
        yy, xx = np.mgrid[start:stop, :width]
        inside = (xx >= left * width) & (xx < right * width)
        inside &= (yy >= top * height) & (yy < bottom * height)
        inside &= ~protected[start:stop]
        has_eligible_hair |= bool(np.any(inside & (selected[start:stop] * guide.zone >= 0.1)))
        active = inside & (guide.grade <= threshold + 1e-12) & (strength > 1.0)
        slice_cover = np.where(active, selected[start:stop] * guide.zone, 0.0)
        slice_cover = np.where(slice_cover >= 0.1, slice_cover, 0.0)
        coverage[start:stop] = slice_cover
        phase = _texture_offset(width, start, stop, texture, design.orientation)
        signal = np.clip(guide.tone + phase, -1.0, 1.0)
        delta = design.highlight * np.maximum(signal, 0.0) - design.shadow * np.maximum(-signal, 0.0)
        displacement = np.trunc(delta * slice_cover)
        current = original[start:stop, :, :3].astype(np.float64)
        coloured = np.clip(current + displacement[..., None], 0, 255).astype(np.uint8)
        candidate[start:stop, :, :3] = np.where(slice_cover[..., None] > 0, coloured, original[start:stop, :, :3])
    if not has_eligible_hair:
        return _refusal(original, style, texture, strength, "empty_selection")
    guard = identity_guard if identity_guard is not None else PixelChangeGuard()
    decision = guard.guard(original.copy(), candidate.copy(), lock)
    if decision.image.dtype != np.uint8 or decision.image.shape != original.shape:
        raise ValueError("identity guard returned incompatible image")
    if not math.isfinite(decision.similarity) or not 0 <= decision.similarity <= 1:
        raise ValueError("identity guard returned invalid similarity")
    safe = original.copy()
    within = coverage > 0
    safe[..., :3] = np.where(within[..., None], decision.image[..., :3], original[..., :3])
    # RGBA alpha is never sourced from guard output.
    if original.shape[2] == 4:
        safe[..., 3] = original[..., 3]
    changed = np.any(safe[..., :3] != original[..., :3], axis=2)
    changed_pixels = int(np.count_nonzero(changed))
    return StylePreview(safe, coverage, style, texture, strength, True, "rendered",
                        changed_pixels / float(height * width), True, decision.blended_back,
                        decision.similarity)


@dataclass(frozen=True)
class _TileKey:
    photo_hash: str
    style: StyleKey
    geometry: HairGeometry
    width: int
    height: int
    start: int
    stop: int


class StyleGuideSession:
    """In-memory geometry cache with a hard byte limit and explicit invalidation.

    No original photo, mask, face geometry inference, personal label or provider
    response is persisted. Correction of input masks is applied on every render.
    """

    def __init__(self, max_bytes: int = 8_388_608) -> None:
        if not isinstance(max_bytes, int) or isinstance(max_bytes, bool) or not 8192 <= max_bytes <= 67_108_864:
            raise ValueError("guide cache budget must be 8 KiB..64 MiB")
        self.max_bytes = max_bytes
        self.computations = 0
        self._bytes = 0
        self._cache: OrderedDict[_TileKey, GuideField] = OrderedDict()

    @property
    def retained_bytes(self) -> int:
        return self._bytes

    def clear(self) -> None:
        self._cache.clear()
        self._bytes = 0

    def invalidate(self, photo_hash: str | None = None) -> None:
        if photo_hash is None:
            self.clear()
            return
        for cache_key in tuple(self._cache):
            if cache_key.photo_hash == photo_hash:
                field = self._cache.pop(cache_key)
                self._bytes -= field.zone.nbytes + field.grade.nbytes + field.tone.nbytes

    def _tile(
        self,
        photo_hash: str,
        style: StyleKey,
        geometry: HairGeometry,
        width: int,
        height: int,
        start: int,
        stop: int,
    ) -> GuideField:
        key = _TileKey(photo_hash, style, geometry, width, height, start, stop)
        cached = self._cache.get(key)
        if cached is not None:
            self._cache.move_to_end(key)
            return cached
        computed = fields(style, geometry, width, height, start, stop)
        self.computations += 1
        cost = computed.zone.nbytes + computed.grade.nbytes + computed.tone.nbytes
        if cost > self.max_bytes:
            return computed
        while self._bytes + cost > self.max_bytes and self._cache:
            _, removed = self._cache.popitem(last=False)
            self._bytes -= removed.zone.nbytes + removed.grade.nbytes + removed.tone.nbytes
        self._cache[key] = computed
        self._bytes += cost
        return computed

    def render(
        self,
        photo: ByteImage,
        hair_mask: FloatPlane,
        geometry: HairGeometry | None,
        style: StyleKey,
        level: float,
        *,
        texture: TextureKey = "straight",
        side_mask: FloatPlane | None = None,
        protected_mask: FloatPlane | None = None,
        primary_box: PrimaryBox | None = None,
        lock_level: float = DEFAULT_LOCK_LEVEL,
        identity_guard: IdentityGuard | None = None,
        tile_height: int = 128,
    ) -> StylePreview:
        checked_photo = validate_photo(photo)
        digest = hashlib.sha256(np.ascontiguousarray(checked_photo).tobytes()).hexdigest()

        def cached_fields(
            selected_style: StyleKey,
            selected_geometry: HairGeometry,
            width: int,
            height: int,
            start: int,
            stop: int,
        ) -> GuideField:
            return self._tile(digest, selected_style, selected_geometry, width, height, start, stop)

        return render_style_guide(
            checked_photo, hair_mask, geometry, style, level, texture=texture, side_mask=side_mask,
            protected_mask=protected_mask, primary_box=primary_box, lock_level=lock_level,
            identity_guard=identity_guard, tile_height=tile_height, guide_factory=cached_fields,
        )

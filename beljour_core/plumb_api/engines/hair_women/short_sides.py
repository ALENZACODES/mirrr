"""Mask-limited short-side hairstyle illustrations for consultation. Author: John Khan.

Levels 1.0..5.0 expand the revealed side area; they do not control opacity.
Existing hair is not removed and no new hair is generated. A real salon outcome
or haircut structure cannot be established from this tonal simulation.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from plumb_api.engines.gender_look.levels import (
    DEFAULT_LOCK_LEVEL,
    IdentityGuard,
    PixelChangeGuard,
    checked_level,
)

from .contracts import HairGeometry, validate_mask, validate_photo

ByteImage = NDArray[np.uint8]
FloatMask = NDArray[np.float64]
StyleId = Literal[
    "pixie_taper", "side_undercut", "nape_undercut", "long_side_shave", "bixie",
    "tapered_twa", "bob_short_sides", "curly_short_sides",
]
Texture = Literal["straight", "wavy", "curly", "coily"]
STYLES: tuple[StyleId, ...] = (
    "pixie_taper", "side_undercut", "nape_undercut", "long_side_shave", "bixie",
    "tapered_twa", "bob_short_sides", "curly_short_sides",
)
TEXTURES: tuple[Texture, ...] = ("straight", "wavy", "curly", "coily")
SIMULATION_LABEL = "Local hairstyle simulation; not a generated haircut or salon guarantee."


@dataclass(frozen=True)
class ShortSidesResult:
    image: ByteImage
    style_id: StyleId
    level: float
    rendered: bool
    changed_pixel_share: float
    coverage: FloatMask
    status: Literal["rendered", "no_mesh"]
    guard_called: bool
    blended_back: bool
    simulation_label: str = SIMULATION_LABEL


def _zone(
    geometry: HairGeometry,
    shape: tuple[int, int],
    style: StyleId,
) -> tuple[FloatMask, FloatMask]:
    height, width = shape
    yy, xx = np.mgrid[:height, :width]
    top = geometry.crown[1] * height
    bottom = geometry.chin[1] * height
    left = geometry.left_temple[0] * width
    right = geometry.right_temple[0] * width
    half_width = max((right - left) / 2, 1)
    half_height = max(bottom - top, 1)
    cx = (left + right) / 2
    x = (xx - cx) / half_width
    y = (yy - top) / half_height
    side = np.clip((np.abs(x) - 0.26) / 0.74, 0, 1)
    nape = np.clip((y - 0.4) / 0.6, 0, 1)
    if style == "pixie_taper":
        zone = (side > 0.05) & (y > 0.08) & (y < 0.85)
        score = 1 - side * (0.72 + 0.28 * nape)
    elif style == "side_undercut":
        zone = (x < -0.22) & (y > 0.04) & (y < 0.89)
        score = np.clip(0.45 + x * 0.7 - nape * 0.12, 0, 1)
    elif style == "nape_undercut":
        zone = (y > 0.47) & (np.abs(x) < 1.1)
        score = 1 - nape
    elif style == "long_side_shave":
        zone = (x > 0.24) & (y > 0.1) & (y < 0.95)
        score = np.clip(0.52 - x * 0.62 + y * 0.08, 0, 1)
    elif style == "bixie":
        zone = (side > 0.04) & (y > 0.26) & (y < 0.9)
        score = 1 - side * (0.43 + 0.4 * nape)
    elif style == "tapered_twa":
        zone = ((side > 0.03) | (y > 0.58)) & (y > 0.1) & (y < 0.95)
        score = np.clip(1 - 0.55 * side - 0.45 * nape, 0, 1)
    elif style == "bob_short_sides":
        zone = (side > 0.12) & (y > 0.3) & (y < 1.05)
        score = np.clip(0.9 - 0.3 * side - 0.54 * nape, 0, 1)
    else:
        zone = (side > 0.11) & (y > 0.08) & (y < 0.95)
        score = np.clip(1 - 0.78 * side + 0.08 * np.sin(y * 9), 0, 1)
    return zone.astype(np.float64), np.clip(score, 0, 1)


def _masked_texture(
    image: ByteImage,
    coverage: FloatMask,
    texture: Texture,
) -> ByteImage:
    height, width = coverage.shape
    yy, xx = np.mgrid[:height, :width]
    stride = TEXTURES.index(texture) + 1
    lattice = ((xx * (11 + stride * 2) + yy * (7 + stride * 3)) % (9 + 2 * stride)).astype(np.float64)
    fibres = ((xx + yy * stride) % (3 + stride)).astype(np.float64)
    grain = (lattice - (4 + stride)) * 0.7 + (fibres - (1 + stride / 2)) * 0.45
    source = image[..., :3].astype(np.float64)
    root_colour = np.clip(source * (0.72 + stride * 0.015) + grain[..., None] + 4, 0, 255)
    candidate = image.copy()
    apply = coverage > 0.1
    candidate[..., :3][apply] = np.trunc(root_colour[apply]).astype(np.uint8)
    return candidate


def render_style(
    image: ByteImage,
    hair_mask: FloatMask,
    landmarks: HairGeometry | None,
    style_id: StyleId,
    level: float,
    *,
    texture: Texture = "straight",
    side_mask: FloatMask | None = None,
    primary_face_box: tuple[float, float, float, float] | None = None,
    lock_level: float = DEFAULT_LOCK_LEVEL,
    identity_guard: IdentityGuard | None = None,
    prepared_zone: tuple[FloatMask, FloatMask] | None = None,
) -> ShortSidesResult:
    """Return original-preserving tonal short-side simulation and changed share.

    ``primary_face_box`` is supplied normalized (left, top, right, bottom).
    Without caller-checked landmarks/primary box, the engine refuses rather than
    estimating a face from a photograph. Lane G may import this public function.
    """
    original = validate_photo(image)
    value = checked_level(level)
    lock = checked_level(lock_level)
    if style_id not in STYLES:
        raise ValueError("unsupported local style")
    if texture not in TEXTURES:
        raise ValueError("unsupported texture")
    hair = validate_mask(hair_mask, original.shape[:2], "hair mask")
    if side_mask is None:
        extra = np.zeros(original.shape[:2], dtype=np.float64)
    else:
        extra = validate_mask(side_mask, original.shape[:2], "side mask")
    empty = np.zeros(original.shape[:2], dtype=np.float64)
    if landmarks is None or primary_face_box is None:
        return ShortSidesResult(original.copy(), style_id, value, False, 0.0, empty, "no_mesh", False, False)
    if len(primary_face_box) != 4:
        raise ValueError("face box must have four coordinates")
    left, top, right, bottom = (float(point) for point in primary_face_box)
    if not (0 <= left < right <= 1 and 0 <= top < bottom <= 1):
        raise ValueError("invalid primary box")
    yy, xx = np.mgrid[:original.shape[0], :original.shape[1]]
    face = ((xx >= left * original.shape[1]) & (xx < right * original.shape[1]) &
            (yy >= top * original.shape[0]) & (yy < bottom * original.shape[0]))
    if prepared_zone is None:
        zone, score = _zone(landmarks, original.shape[:2], style_id)
    else:
        zone, score = prepared_zone
        if zone.shape != original.shape[:2] or score.shape != zone.shape:
            raise ValueError("cached hairstyle region dimensions mismatch")
    reveal = (value - 1.0) / 4.0
    allowed = np.maximum(hair, extra) * zone * face
    coverage = np.where((score <= reveal) & (allowed > 0.1) & (value > 1.0), allowed, 0.0)
    candidate = _masked_texture(original, coverage, texture)
    guard = identity_guard if identity_guard is not None else PixelChangeGuard()
    decision = guard.guard(original, candidate, lock)
    if decision.image.dtype != np.uint8 or decision.image.shape != original.shape:
        raise ValueError("identity guard returned incompatible pixel data")
    result = decision.image.copy()
    result[..., :3] = np.where(coverage[..., None] > 0.1, result[..., :3], original[..., :3])
    if original.shape[2] == 4:
        result[..., 3] = original[..., 3]
    changed = float(np.count_nonzero(np.any(result[..., :3] != original[..., :3], axis=2)))
    share = changed / float(original.shape[0] * original.shape[1])
    return ShortSidesResult(result, style_id, value, True, share, coverage, "rendered", True,
                            decision.blended_back)


class HairStyleSession:
    """Bounded photo/style/geometry cache for repeated strength-slider previews.

    Masks remain supplied by the caller for every render, so changing a
    corrected hair mask takes effect without reusing stale mask pixels.
    No face images, names or identity vectors are stored in this cache.
    """

    def __init__(self, max_styles: int = 16) -> None:
        if not 1 <= max_styles <= 64:
            raise ValueError("cache capacity must be 1..64 styles")
        self.max_styles = max_styles
        self.zone_computations = 0
        self._cache: dict[tuple[str, StyleId, HairGeometry, tuple[int, int]], tuple[FloatMask, FloatMask]] = {}

    def clear(self) -> None:
        self._cache.clear()

    def render(
        self,
        image: ByteImage,
        hair_mask: FloatMask,
        geometry: HairGeometry | None,
        style_id: StyleId,
        level: float,
        *,
        texture: Texture = "straight",
        side_mask: FloatMask | None = None,
        primary_face_box: tuple[float, float, float, float] | None = None,
        lock_level: float = DEFAULT_LOCK_LEVEL,
        identity_guard: IdentityGuard | None = None,
    ) -> ShortSidesResult:
        if geometry is None:
            return render_style(image, hair_mask, geometry, style_id, level, texture=texture,
                                side_mask=side_mask, primary_face_box=primary_face_box,
                                lock_level=lock_level, identity_guard=identity_guard)
        photo_hash = hashlib.sha256(np.ascontiguousarray(image).tobytes()).hexdigest()
        key = (photo_hash, style_id, geometry, image.shape[:2])
        prepared = self._cache.get(key)
        if prepared is None:
            prepared = _zone(geometry, image.shape[:2], style_id)
            if len(self._cache) >= self.max_styles:
                self._cache.pop(next(iter(self._cache)))
            self._cache[key] = prepared
            self.zone_computations += 1
        return render_style(image, hair_mask, geometry, style_id, level, texture=texture,
                            side_mask=side_mask, primary_face_box=primary_face_box,
                            lock_level=lock_level, identity_guard=identity_guard,
                            prepared_zone=prepared)

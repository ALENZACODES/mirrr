"""Bounded export for local ink/oil with exact neighbourhood and texture phase.

The finished output buffer is allocated once. Only one halo-expanded tile is
processed at a time; no full-resolution float RGB or support plane is retained.
Expression deformation requires a separate field plan and remains unsupported.
Crown uses translated full-frame anchors, so crop boundaries cannot resize art.
Cancellation discards the incomplete output; callbacks receive progress counts,
never image data. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable, Iterator, Mapping
from dataclasses import dataclass
from typing import Any

import numpy as np

from . import crown, ink, oil
from .resources import DEFAULT_BUDGET, export_allocation
from .types import MAX_SIDE, Bytes, EffectUnavailable, integer, landmarks, parameters, photo

MAX_EXPORT_PIXELS = 16_777_216
MAX_TILE_SIDE = 1024
MIN_TILE_SIDE = 32
TILED_EFFECTS = ("ink-study", "pigment-oil", "meadow-crown")


class RenderCancelled(RuntimeError):
    """No partially rendered image is returned when a newer request cancels this one."""


@dataclass(frozen=True)
class Tile:
    left: int
    top: int
    right: int
    bottom: int
    crop_left: int
    crop_top: int
    crop_right: int
    crop_bottom: int

    @property
    def width(self) -> int:
        return self.right - self.left

    @property
    def height(self) -> int:
        return self.bottom - self.top

    @property
    def working_pixels(self) -> int:
        return (self.crop_right - self.crop_left) * (self.crop_bottom - self.crop_top)

    @property
    def interior(self) -> tuple[slice, slice]:
        return (slice(self.top - self.crop_top, self.bottom - self.crop_top),
                slice(self.left - self.crop_left, self.right - self.crop_left))


@dataclass(frozen=True)
class TiledResult:
    image: Bytes
    effect_id: str
    label: str
    metrics: dict[str, float | bool]
    warnings: tuple[str, ...]


def tiles(width: int, height: int, tile_size: int, halo: int) -> Iterator[Tile]:
    w = integer(width, "width", 2, MAX_SIDE)
    h = integer(height, "height", 2, MAX_SIDE)
    side = integer(tile_size, "tile_size", MIN_TILE_SIDE, MAX_TILE_SIDE)
    padding = integer(halo, "halo", 0, 12)
    if w * h > MAX_EXPORT_PIXELS:
        raise ValueError("artistic export exceeds the 16 MP working limit")
    for top in range(0, h, side):
        for left in range(0, w, side):
            right, bottom = min(w, left + side), min(h, top + side)
            yield Tile(left, top, right, bottom, max(0, left - padding), max(0, top - padding),
                       min(w, right + padding), min(h, bottom + padding))


def required_halo(effect_id: str, params: Mapping[str, Any] | None = None) -> int:
    if effect_id == "ink-study":
        parameters(params, ink.DEFAULTS)
        return 1
    if effect_id == "pigment-oil":
        p = parameters(params, oil.DEFAULTS)
        return integer(p["radius"], "radius", 1, 12)
    if effect_id == "meadow-crown":
        parameters(params, crown.DEFAULTS)
        return 1
    raise EffectUnavailable("not_tileable", "this effect needs the full mesh working frame")


def _mask_view(value: Any, shape: tuple[int, int], name: str) -> np.ndarray:
    """Validate a caller-owned ndarray without allocating a full float copy."""
    if value is None:
        raise EffectUnavailable(f"missing_{name}", f"{name} is required for exact export protection")
    if not isinstance(value, np.ndarray) or value.shape != shape or value.dtype.kind not in "fiu":
        raise ValueError(f"{name} must be a numeric array matching the export")
    # Validate in rows so a bool scratch plane never grows with the whole photo.
    for row in value:
        if not np.all(np.isfinite(row)) or np.any(row < 0) or np.any(row > 1):
            raise ValueError(f"{name} must contain finite 0..1 values")
    return value


def render_tiled(effect_id: str, image: np.ndarray, *, hair_mask: Any = None,
                 eye_mask: Any = None, params: Mapping[str, Any] | None = None,
                 mesh: Any = None,
                 tile_size: int = 512, cancelled: Callable[[], bool] | None = None,
                 progress: Callable[[int, int], None] | None = None,
                 budget_bytes: int = DEFAULT_BUDGET) -> TiledResult:
    source = photo(image, max_pixels=MAX_EXPORT_PIXELS)
    halo = required_halo(effect_id, params)
    h, w = source.shape[:2]
    allocation = export_allocation(effect_id, w, h, source.shape[2], requested_tile=tile_size,
                                   halo=halo, budget_bytes=budget_bytes)
    plan = list(tiles(w, h, allocation.tile_size, halo))
    if cancelled is not None and cancelled():
        raise RenderCancelled("artistic render cancelled")
    hair = _mask_view(hair_mask, (h, w), "hair_mask") if effect_id in ("ink-study", "meadow-crown") else None
    eyes = _mask_view(eye_mask, (h, w), "eye_mask") if effect_id == "ink-study" else None
    points = landmarks(mesh, (h, w)) if effect_id == "meadow-crown" else None
    output = np.empty_like(source)
    maximum_working = 0
    changed = 0
    outside_error = 0.0
    alpha_same = True
    visible_alpha = 0.0
    label = ""
    warnings: tuple[str, ...] = ()
    for completed, tile in enumerate(plan, 1):
        if cancelled is not None and cancelled():
            raise RenderCancelled("artistic render cancelled")
        crop = (slice(tile.crop_top, tile.crop_bottom), slice(tile.crop_left, tile.crop_right))
        block = source[crop]
        if effect_id == "ink-study":
            assert hair is not None and eyes is not None
            rendered = ink.ink_study(block, hair[crop], eyes[crop], params)
        elif effect_id == "meadow-crown":
            assert hair is not None and points is not None
            translated = points - np.array([tile.crop_left, tile.crop_top])
            rendered = crown.render_crown_frame(block, translated, hair[crop], params)
        else:
            rendered = oil.pigment_oil(block, params, offset=(tile.crop_left, tile.crop_top))
        interior = tile.interior
        committed = rendered.image[interior]
        original = block[interior]
        output[tile.top:tile.bottom, tile.left:tile.right] = committed
        delta = np.abs(committed[..., :3].astype(float) - original[..., :3].astype(float))
        changed += int(np.count_nonzero(np.any(delta > 0, axis=2)))
        outside_error = max(outside_error, float(np.max(delta[rendered.support[interior] <= 0], initial=0)))
        alpha_same = alpha_same and (source.shape[2] == 3 or np.array_equal(original[..., 3], committed[..., 3]))
        maximum_working = max(maximum_working, tile.working_pixels)
        visible_alpha += float(np.sum(rendered.support[interior]))
        label, warnings = rendered.label, rendered.warnings
        if progress is not None:
            progress(completed, len(plan))
    # A callback may invalidate the request just after the final tile finished.
    if cancelled is not None and cancelled():
        raise RenderCancelled("artistic render cancelled")
    if effect_id == "meadow-crown":
        warnings = ("Original procedural artwork; placement depends on your confirmed mesh and hair matte.",)
        if visible_alpha < 1:
            warnings += ("The crown is hidden by the hair mask or outside the photo.",)
    return TiledResult(output, effect_id, label,
                       {"tile_count": float(len(plan)), "maximum_working_pixels": float(maximum_working),
                        "halo": float(halo), "changed_pixels": float(changed),
                        "outside_max_error": outside_error, "alpha_unchanged": alpha_same,
                        "visible_alpha_sum": visible_alpha,
                        "allocation_allowance_bytes": float(allocation.estimated_peak_bytes),
                        "selected_tile_size": float(allocation.tile_size)}, warnings)

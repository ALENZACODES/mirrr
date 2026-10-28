"""Guarded 2x/4x upscale with a face-selection identity lock.

The existing classical engine renders every pixel twice per tile: once at the
requested detail and once at its lowest detail (the "low-detail source
reference"). Inside the user-confirmed face selection, output RGB is a blend
toward the reference; at the full 5.0 lock and full coverage it is exactly the
reference, so no added detail reaches the face. Outside the selection RGB comes
from the detailed engine unchanged. Alpha always follows the reference.

A selection is required: a mask plus explicit confirmation, or an explicit
declaration that the photo has no face. This is a pixel guard inside a
caller-supplied region, not biometric identity verification. No neural weights,
no network. Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from ...pro.strength import legacy_amount, validate_level
from .engine import upscale
from .safe_tiles import DEFAULT_BUDGET_BYTES, AllocationPlan, admit
from .tiling import Tile

SAFE_LABEL = (
    "Classical upscale, no neural weights. Face pixels are locked toward the "
    "source reference; this is a pixel guard, not identity verification."
)
EXPORT_LABEL = "Simulation"
FULL_COVERAGE = 255
# Weights are integers so Python and the browser mirror round identically:
# share = coverage / 255 * lock_tenths / 50, denominator 255 * 50.
_DENOMINATOR = FULL_COVERAGE * 50


class SelectionRequired(ValueError):
    """The guarded path needs a confirmed face selection or a no-face declaration."""


@dataclass(frozen=True)
class FaceSelection:
    """Per-source-pixel face coverage (0..255), confirmed by the user."""

    mask: np.ndarray
    confirmed: bool
    no_face: bool = False


@dataclass(frozen=True)
class SafeUpscaleResult:
    image: np.ndarray
    scale: int
    detail_level: float
    lock_level: float
    face_pixels: int
    allocation: AllocationPlan
    release: bool
    label: str = SAFE_LABEL

    def public(self) -> dict[str, Any]:
        """Counts and settings only."""
        return {
            "schema": "beljour-safe-upscale/1",
            "scale": self.scale,
            "detail_level": self.detail_level,
            "lock_level": self.lock_level,
            "face_source_pixels": self.face_pixels,
            "release": self.release,
            "allocation": self.allocation.public(),
            "label": self.label,
            "identity_verification": "NOT_PERFORMED",
        }


def reference_share_tenths(lock_level: float) -> int:
    """Lock 1.0..5.0 as tenths (10..50); the reference share is tenths / 50,
    so 1.0 keeps 20 percent of the reference and 5.0 keeps all of it.
    ASSUMED: a lowered lock never removes protection entirely."""
    return round(validate_level(lock_level) * 10)


def checked_image(image: Any) -> np.ndarray:
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim != 3 or (
        image.shape[2] not in (3, 4)
    ):
        raise ValueError("safe upscale expects an RGB or RGBA uint8 image")
    return np.ascontiguousarray(image)


def checked_selection(selection: Any, height: int, width: int) -> np.ndarray:
    if not isinstance(selection, FaceSelection):
        raise SelectionRequired("a confirmed face selection is required")
    mask = selection.mask
    if not isinstance(mask, np.ndarray) or mask.dtype != np.uint8 or mask.shape != (height, width):
        raise SelectionRequired("face selection must be a uint8 mask matching the source")
    if selection.confirmed is not True:
        raise SelectionRequired("the face selection must be confirmed by the user")
    if type(selection.no_face) is not bool:
        raise SelectionRequired("invalid no-face declaration")
    marked = bool(mask.any())
    if marked and selection.no_face:
        raise SelectionRequired("a marked face contradicts the no-face declaration")
    if not marked and not selection.no_face:
        raise SelectionRequired("an empty selection needs an explicit no-face declaration")
    return mask


def _crop(image: np.ndarray, tile: Tile) -> np.ndarray:
    return image[tile.read_y0:tile.read_y1, tile.read_x0:tile.read_x1]


def _core(rendered: np.ndarray, tile: Tile, scale: int) -> np.ndarray:
    top = (tile.y0 - tile.read_y0) * scale
    left = (tile.x0 - tile.read_x0) * scale
    return rendered[top:top + tile.height * scale, left:left + tile.width * scale]


def render_layers(
    image: np.ndarray, tile: Tile, scale: int, detail: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Detailed engine output and low-detail reference for one tile core."""
    source = _crop(image, tile)
    if min(source.shape[:2]) < 8:
        raise ValueError("tile read region is too small for the engine")
    engine = _core(upscale(source, scale=scale, detail=detail), tile, scale)
    reference = _core(upscale(source, scale=scale, detail=0.0), tile, scale)
    return engine, reference


def blend(engine: np.ndarray, reference: np.ndarray, coverage: np.ndarray, tenths: int) -> np.ndarray:
    """Integer blend of RGB toward the reference; alpha from the reference."""
    weight = coverage.astype(np.int64)[..., None] * tenths
    rgb = (engine[..., :3].astype(np.int64) * (_DENOMINATOR - weight)
           + reference[..., :3].astype(np.int64) * weight + _DENOMINATOR // 2) // _DENOMINATOR
    output = reference.copy()
    output[..., :3] = rgb.astype(np.uint8)
    return output


def upscaled_mask(mask: np.ndarray, tile: Tile, scale: int) -> np.ndarray:
    core = mask[tile.y0:tile.y1, tile.x0:tile.x1]
    return np.repeat(np.repeat(core, scale, axis=0), scale, axis=1)


def safe_upscale(
    image: np.ndarray,
    selection: FaceSelection,
    *,
    scale: int = 2,
    detail_level: float = 3.0,
    lock_level: float = 5.0,
    budget_bytes: int = DEFAULT_BUDGET_BYTES,
    release: bool = True,
) -> SafeUpscaleResult:
    """Admit, then upscale tile by tile under the identity lock."""
    source = checked_image(image)
    height, width, channels = source.shape
    mask = checked_selection(selection, height, width)
    detail = legacy_amount(validate_level(detail_level))
    tenths = reference_share_tenths(lock_level)
    if type(release) is not bool:
        raise ValueError("release must be a boolean")
    allocation = admit(width, height, channels=channels, scale=scale, budget_bytes=budget_bytes)
    output = np.empty((height * scale, width * scale, channels), dtype=np.uint8)
    for tile in allocation.tile_plan():
        engine, reference = render_layers(source, tile, scale, detail)
        output[tile.y0 * scale:tile.y1 * scale, tile.x0 * scale:tile.x1 * scale] = blend(
            engine, reference, upscaled_mask(mask, tile, scale), tenths,
        )
    return SafeUpscaleResult(
        image=output, scale=scale, detail_level=validate_level(detail_level),
        lock_level=tenths / 10, face_pixels=int(np.count_nonzero(mask)),
        allocation=allocation, release=release,
    )

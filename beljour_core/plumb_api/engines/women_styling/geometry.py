"""Mask validation, local neighbourhoods and position fields for W-series VTO.

No face landmarks or tracking are obtained in this module. A caller must
supply region masks from a separately cleared, consented pipeline.
We never fall back to editing an unmasked frame. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping

import numpy as np
from numpy.typing import NDArray

from .specs import ALL_REGIONS, FeatureSpec

ByteArray = NDArray[np.uint8]
FloatArray = NDArray[np.float64]

MAX_SIDE = 8192
MAX_PIXELS = 16_000_000


def checked_frame(frame: object) -> ByteArray:
    if not isinstance(frame, np.ndarray):
        raise ValueError("image must be a NumPy RGB/RGBA frame")
    if frame.ndim != 3 or frame.shape[2] not in (3, 4):
        raise ValueError("image must be H x W x 3 or H x W x 4")
    height, width, _ = frame.shape
    if height <= 0 or width <= 0 or height > MAX_SIDE or width > MAX_SIDE:
        raise ValueError("image dimensions outside the supported range")
    if height * width > MAX_PIXELS:
        raise ValueError("image exceeds pixel budget")
    if frame.dtype != np.uint8:
        raise ValueError("image must be uint8; floating RGB cannot be inferred")
    return frame


def checked_masks(
    masks: Mapping[str, object], frame: ByteArray, spec: FeatureSpec,
) -> dict[str, ByteArray]:
    if not isinstance(masks, Mapping):
        raise ValueError("regions must be supplied explicitly")
    height, width = frame.shape[:2]
    approved: dict[str, ByteArray] = {}
    for name, mask in masks.items():
        if name not in ALL_REGIONS:
            raise ValueError(f"Unknown region mask {name!r}")
        if not isinstance(mask, np.ndarray) or mask.ndim != 2:
            raise ValueError(f"Mask {name!r} must be a two-dimensional NumPy array")
        if mask.shape != (height, width) or mask.dtype != np.uint8:
            raise ValueError(f"Mask {name!r} must be uint8 with exact image size")
        if name in spec.regions:
            approved[name] = mask
    if not any(np.any(mask > 0) for mask in approved.values()):
        raise ValueError("No nonempty approved mask: unmasked editing is prohibited")
    return approved


def authorized_support(masks: Mapping[str, ByteArray], spec: FeatureSpec) -> NDArray[np.bool_]:
    first = next(iter(masks.values()))
    support = np.zeros(first.shape, dtype=np.bool_)
    for region in spec.regions:
        if region in masks:
            support |= masks[region] > 0
    return support


def local_mean(original: ByteArray) -> FloatArray:
    """Edge-replicated 3x3 mean, including transparency-independent RGB only.

    We intentionally use nine explicitly defined neighbours so the browser
    and Python versions have the same pixels at image boundaries.
    """
    rgb = original[..., :3].astype(np.float64)
    height, width, _ = rgb.shape
    extended = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode="edge")
    summed = np.zeros((height, width, 3), dtype=np.float64)
    for dy in range(3):
        for dx in range(3):
            summed += extended[dy:dy + height, dx:dx + width, :]
    return summed / 9.0


def spatial_field(
    width: int, height: int, placement: str,
    *, origin_y: int = 0, full_height: int | None = None,
) -> FloatArray:
    """Whole-frame coordinate functions bounded [0, 1]; mask defines the area.

    Spatial positioning is intentionally not a face-shape guess. Users can
    place or paint masks in their own editor. Coordinates are normalized only
    to provide consistent behaviour between resolutions.
    """
    y, x = np.mgrid[:height, :width]
    xx = x.astype(np.float64) / max(1, width - 1)
    if full_height is not None:
        if origin_y < 0 or full_height < height or origin_y + height > full_height:
            raise ValueError("Invalid tile coordinate metadata")
    yy = (y.astype(np.float64) + origin_y) / max(1, (full_height or height) - 1)
    if placement == "uniform":
        return np.ones((height, width), dtype=np.float64)
    if placement == "upper":
        return 0.65 + 0.35 * (1.0 - yy)
    if placement == "lower":
        return 0.65 + 0.35 * yy
    if placement == "side":
        return 0.6 + 0.4 * abs(xx * 2.0 - 1.0)
    if placement == "middle":
        return 0.6 + 0.4 * (1.0 - abs(xx * 2.0 - 1.0))
    if placement == "diagonal":
        return 0.6 + 0.4 * (0.5 * xx + 0.5 * (1.0 - yy))
    if placement == "rounded":
        return 0.6 + 0.4 * (1.0 - abs(xx * 2.0 - 1.0)) * (1.0 - abs(yy * 2.0 - 1.0))
    if placement == "soft":
        return np.full((height, width), 0.77, dtype=np.float64)
    raise ValueError(f"Unknown placement field {placement!r}")

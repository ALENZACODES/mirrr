"""Guarded upscale on drawn images: lock, outside pixels, alpha and labels.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from .engine import upscale
from .reference import synthetic_detail
from .safe import (
    EXPORT_LABEL,
    SAFE_LABEL,
    FaceSelection,
    SelectionRequired,
    reference_share_tenths,
    safe_upscale,
)


def _rgba(height: int = 40, width: int = 48) -> np.ndarray:
    rgb = synthetic_detail(height, width)
    alpha = np.full((height, width, 1), 255, dtype=np.uint8)
    alpha[:6, :6] = 0
    alpha[-6:, -6:] = 90
    return np.concatenate((rgb, alpha), axis=2)


def _face(height: int = 40, width: int = 48) -> np.ndarray:
    mask = np.zeros((height, width), dtype=np.uint8)
    mask[12:28, 16:34] = 255
    mask[12:28, 15] = 128
    return mask


@pytest.mark.parametrize("scale", [2, 4])
def test_full_lock_returns_the_reference_inside_the_face(scale: int) -> None:
    image, mask = _rgba(), _face()
    result = safe_upscale(image, FaceSelection(mask, True), scale=scale, detail_level=5.0)
    reference = upscale(image, scale=scale, detail=0.0)
    detailed = upscale(image, scale=scale, detail=1.0)
    face = np.repeat(np.repeat(mask, scale, 0), scale, 1)
    assert result.image.shape == (40 * scale, 48 * scale, 4)
    assert np.array_equal(result.image[face == 255][:, :3], reference[face == 255][:, :3])
    assert np.array_equal(result.image[face == 0][:, :3], detailed[face == 0][:, :3])
    assert np.array_equal(result.image[..., 3], reference[..., 3])
    assert not np.array_equal(detailed[face == 255], reference[face == 255])


def test_partial_coverage_and_lower_lock_blend_toward_the_engine() -> None:
    image, mask = _rgba(), _face()
    full = safe_upscale(image, FaceSelection(mask, True), detail_level=5.0, lock_level=5.0)
    low = safe_upscale(image, FaceSelection(mask, True), detail_level=5.0, lock_level=1.0)
    reference = upscale(image, scale=2, detail=0.0)
    detailed = upscale(image, scale=2, detail=1.0)
    face = np.repeat(np.repeat(mask, 2, 0), 2, 1) == 255
    gap_full = np.abs(full.image[face][:, :3].astype(int) - reference[face][:, :3]).sum()
    gap_low = np.abs(low.image[face][:, :3].astype(int) - reference[face][:, :3]).sum()
    assert gap_full == 0 < gap_low
    # Lock 1.0 keeps 20 percent of the reference, computed in integers.
    expected = (detailed[face][:, :3].astype(np.int64) * (12750 - 255 * 10)
                + reference[face][:, :3].astype(np.int64) * (255 * 10) + 6375) // 12750
    assert np.array_equal(low.image[face][:, :3], expected)


def test_rgb_input_stays_rgb() -> None:
    image = synthetic_detail(32, 32)
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[8:20, 8:20] = 255
    result = safe_upscale(image, FaceSelection(mask, True))
    assert result.image.shape == (64, 64, 3)


def test_no_face_declaration_matches_the_plain_engine() -> None:
    image = _rgba()
    result = safe_upscale(image, FaceSelection(np.zeros((40, 48), np.uint8), True, no_face=True),
                          detail_level=4.0)
    plain = upscale(image, scale=2, detail=0.75)
    assert np.array_equal(result.image[..., :3], plain[..., :3])
    assert result.face_pixels == 0


def test_tiled_rendering_is_used_when_the_budget_is_tight() -> None:
    image = synthetic_detail(300, 300)
    mask = np.zeros((300, 300), np.uint8)
    mask[100:180, 100:200] = 255
    tiled = safe_upscale(image, FaceSelection(mask, True), budget_bytes=24 * 1024 * 1024)
    whole = safe_upscale(image, FaceSelection(mask, True))
    assert tiled.allocation.tiles > 1 and whole.allocation.tiles == 1
    assert tiled.allocation.peak_bytes <= 24 * 1024 * 1024 < whole.allocation.peak_bytes
    difference = np.abs(tiled.image.astype(np.int16) - whole.image)
    # Halos keep tile seams close to the whole-image render (measured: under 4% of values differ).
    assert float(np.mean(difference > 0)) < 0.1 and float(difference.mean()) < 0.5


def test_levels_and_labels() -> None:
    assert reference_share_tenths(5.0) == 50 and reference_share_tenths(1.0) == 10
    result = safe_upscale(_rgba(), FaceSelection(_face(), True), detail_level=2.3, lock_level=4.4)
    public = result.public()
    assert (public["detail_level"], public["lock_level"]) == (2.3, 4.4)
    assert public["label"] == SAFE_LABEL and "not identity verification" in SAFE_LABEL
    assert public["identity_verification"] == "NOT_PERFORMED"
    assert EXPORT_LABEL == "Simulation"
    assert "pixels" not in public


@pytest.mark.parametrize(("selection", "message"), [
    (None, "confirmed face selection"),
    (FaceSelection(_face(), False), "confirmed"),
    (FaceSelection(np.zeros((40, 48), np.uint8), True), "no-face"),
    (FaceSelection(_face(), True, no_face=True), "contradicts"),
    (FaceSelection(_face()[:-1], True), "matching"),
    (FaceSelection(_face().astype(np.int32), True), "uint8"),
])
def test_selection_is_required_and_consistent(selection: object, message: str) -> None:
    with pytest.raises(SelectionRequired, match=message):
        safe_upscale(_rgba(), selection)  # type: ignore[arg-type]


def test_source_is_not_modified() -> None:
    image, mask = _rgba(), _face()
    before, mask_before = image.copy(), mask.copy()
    safe_upscale(image, FaceSelection(mask, True))
    assert np.array_equal(image, before) and np.array_equal(mask, mask_before)

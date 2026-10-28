"""R20c high-resolution stripe processing and blur-halo seam proofs.

Synthetic masks include partial opacity and exactly one-pixel-wide regions.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.women_styling import FEATURE_SPECS, PreviewRequest, apply_preview, apply_preview_tiled
from test_women_r20c_engine import synthetic_frame, synthetic_masks


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda spec: spec.id)
@pytest.mark.parametrize("rows", [1, 2, 3, 7, 11, 40])
def test_tiled_renderer_exactly_matches_full_frame_for_each_feature(spec: object, rows: int) -> None:
    from plumb_api.engines.women_styling.specs import FeatureSpec
    assert isinstance(spec, FeatureSpec)
    source = synthetic_frame(width=39, height=35, channels=4)
    masks = synthetic_masks(width=39, height=35)
    original = source.copy()
    snapshots = {region: mask.copy() for region, mask in masks.items()}
    req = PreviewRequest(spec.id, spec.variants[0], strength=87, hours=9)
    full = apply_preview(source, masks, req)
    tiled = apply_preview_tiled(source, masks, req, stripe_rows=rows)
    assert np.array_equal(tiled.pixels, full.pixels), (spec.id, rows)
    assert tiled.evidence == full.evidence, (spec.id, rows)
    assert np.array_equal(source, original)
    assert all(np.array_equal(mask, snapshots[region]) for region, mask in masks.items())


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda spec: spec.id)
def test_tile_skips_empty_stripes_without_affecting_other_regions(spec: object) -> None:
    from plumb_api.engines.women_styling.specs import FeatureSpec
    assert isinstance(spec, FeatureSpec)
    source = synthetic_frame(width=40, height=60, channels=3)
    masks = {spec.regions[0]: np.zeros((60, 40), dtype=np.uint8)}
    masks[spec.regions[0]][27:31, 12:22] = 255
    request = PreviewRequest(spec.id, spec.variants[0], 93)
    full = apply_preview(source, masks, request)
    tiled = apply_preview_tiled(source, masks, request, stripe_rows=4)
    assert np.array_equal(full.pixels, tiled.pixels)
    assert tiled.evidence.provider_calls == 0
    assert tiled.evidence.outside_mask_changed == 0
    assert np.array_equal(tiled.pixels[:20], source[:20])
    assert np.array_equal(tiled.pixels[40:], source[40:])


@pytest.mark.parametrize("size", [1, 2, 3, 17, 64, 255])
def test_stripe_heights_produce_identical_result_across_mask_boundary(size: int) -> None:
    source = synthetic_frame(width=15, height=129, channels=4)
    masks = synthetic_masks(width=15, height=129)
    # A manually painted line crosses many stripes and must not create seams.
    masks["face"][:, 7] = np.arange(129, dtype=np.uint8) * 2 % 255
    req = PreviewRequest("W9", "powder", 100)
    full = apply_preview(source, masks, req)
    tiled = apply_preview_tiled(source, masks, req, stripe_rows=size)
    assert np.array_equal(full.pixels, tiled.pixels)
    assert tiled.evidence.changed_pixels == full.evidence.changed_pixels


def test_invalid_stripes_are_rejected_before_working_on_images() -> None:
    source = synthetic_frame()
    masks = synthetic_masks()
    request = PreviewRequest("W10", "dewy")
    for rows in (-1, 0, 1025, 1.2, True):
        with pytest.raises(ValueError, match="stripe_rows"):
            apply_preview_tiled(source, masks, request, stripe_rows=rows)  # type: ignore[arg-type]


def test_tiled_request_with_strength_zero_maintains_unmodified_bytes() -> None:
    source = synthetic_frame(width=35, height=25)
    masks = synthetic_masks(width=35, height=25)
    for spec in FEATURE_SPECS:
        request = PreviewRequest(spec.id, spec.variants[0], strength=0)
        result = apply_preview_tiled(source, masks, request, stripe_rows=2)
        assert np.array_equal(source, result.pixels)
        assert result.evidence.changed_pixels == 0
        assert result.evidence.mask_support_pixels > 0
        assert result.evidence.provider_calls == 0

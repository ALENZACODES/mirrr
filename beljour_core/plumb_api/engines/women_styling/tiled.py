"""Halo-overlapped, stripe-bounded W-series offline renderer.

The nine-tap blur needs exactly a one-row vertical halo. We process strips
with a global-Y placement field and copy only the central rows; no seam, no
unbounded per-edit float workspace, no image uploads. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping

import numpy as np
from numpy.typing import NDArray

from .engine import PreviewEvidence, PreviewResult, apply_preview
from .geometry import authorized_support, checked_frame, checked_masks
from .requests import PreviewRequest


def apply_preview_tiled(
    image: NDArray[np.uint8],
    region_masks: Mapping[str, object],
    request: PreviewRequest,
    *, stripe_rows: int = 64,
) -> PreviewResult:
    """Same pixels as full-frame engine with O(width*stripe_rows) float workspace.

    A bounded source/output copy is still needed for export. Temporary target,
    blur and working float arrays are limited to one stripe plus two halo rows.
    This uses no disk, network, model or saved image. Rejected masks raise before
    any work starts; caller arrays are never mutated.
    """
    if type(stripe_rows) is not int or not 1 <= stripe_rows <= 1024:
        raise ValueError("stripe_rows must be an integer between 1 and 1024")
    spec = request.validate()
    source = checked_frame(image)
    masks = checked_masks(region_masks, source, spec)
    support = authorized_support(masks, spec)
    height, _, channels = source.shape
    destination = source.copy()
    for first in range(0, height, stripe_rows):
        last = min(height, first + stripe_rows)
        halo_first = max(0, first - 1)
        halo_last = min(height, last + 1)
        tile_masks = {k: mask[halo_first:halo_last, :] for k, mask in masks.items()}
        if not any(np.any(mask[first - halo_first:last - halo_first, :] > 0) for mask in tile_masks.values()):
            continue
        tile = apply_preview(
            source[halo_first:halo_last, :, :], tile_masks, request,
            _origin_y=halo_first, _full_height=height,
        )
        destination[first:last, :, :] = tile.pixels[first - halo_first:last - halo_first, :, :]
    channel_diff = np.abs(destination[..., :3].astype(np.int16) - source[..., :3].astype(np.int16))
    changed = np.any(channel_diff > 0, axis=2)
    outside = int(np.count_nonzero(changed & ~support))
    alpha = int(np.count_nonzero(destination[..., 3] != source[..., 3])) if channels == 4 else 0
    return PreviewResult(destination, PreviewEvidence(
        feature_id=spec.id,
        mask_support_pixels=int(np.count_nonzero(support)),
        changed_pixels=int(np.count_nonzero(changed)),
        outside_mask_changed=outside,
        changed_alpha_pixels=alpha,
        largest_channel_delta=int(np.max(channel_diff)),
        provider_calls=0,
        simulated=True,
        valid_mask=True,
        source_preserved=not np.shares_memory(destination, source),
        disclosure="Screen-colour simulation only; not a product, treatment, or physical result prediction.",
    ))

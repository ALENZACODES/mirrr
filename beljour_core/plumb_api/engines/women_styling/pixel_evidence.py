"""Image-free pixel statistics for externally authorized W-series quality runs.

This module never finds landmarks, uploads a frame, performs a beauty assessment,
or stores a source image. It reads both caller-owned images and reports counts
only. All tests use deterministic arithmetic pictures, never personal photos.

Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .geometry import authorized_support, checked_frame, checked_masks
from .realface_protocol import PixelEvidence
from .specs import FeatureSpec, spec_for


@dataclass(frozen=True, slots=True)
class FrameAudit:
    """No coordinates, source pixels, masks or identifiers are retained."""

    feature_id: str
    frame_pixels: int
    authorized_pixels: int
    altered_rgb_pixels: int
    altered_rgb_inside: int
    altered_rgb_outside: int
    altered_alpha_pixels: int
    max_rgb_channel_delta: int
    sum_rgb_channel_delta: int
    pixels_over_limit: int
    original_preserved: bool
    provider_calls: int
    simulation_disclosed: bool
    synthetic: bool
    consented: bool
    human_accepted: bool | None

    def checks(self, spec: FeatureSpec) -> tuple[str, ...]:
        """Report independent failures, not a subjective overall beauty score."""
        errors: list[str] = []
        if self.feature_id != spec.id:
            errors.append("FEATURE_ID_MISMATCH")
        if self.authorized_pixels == 0:
            errors.append("MASK_MISSING")
        if self.altered_rgb_outside != 0:
            errors.append("OUTSIDE_MASK")
        if self.altered_alpha_pixels != 0:
            errors.append("ALPHA_CHANGED")
        if self.max_rgb_channel_delta > spec.max_channel_delta:
            errors.append("CHANNEL_LIMIT")
        if self.pixels_over_limit != 0:
            errors.append("CHANNEL_PIXEL_LIMIT")
        if self.provider_calls != 0:
            errors.append("NETWORK_NOT_AUTHORIZED")
        if not self.original_preserved:
            errors.append("ORIGINAL_NOT_PRESERVED")
        if not self.simulation_disclosed:
            errors.append("SIMULATION_NOT_DISCLOSED")
        if not self.synthetic and not self.consented:
            errors.append("REAL_FACE_CONSENT_REQUIRED")
        return tuple(errors)

    def to_protocol(self) -> PixelEvidence:
        """Convert aggregate evidence without upgrading a synthetic run."""
        return PixelEvidence(
            feature_id=self.feature_id,
            mask_pixel_count=self.authorized_pixels,
            edited_pixel_count=self.altered_rgb_pixels,
            outside_mask_changed=self.altered_rgb_outside,
            alpha_pixels_changed=self.altered_alpha_pixels,
            max_channel_delta=self.max_rgb_channel_delta,
            original_preserved=self.original_preserved,
            simulation_disclosed=self.simulation_disclosed,
            provider_calls=self.provider_calls,
            face_consented=self.consented,
            synthetic=self.synthetic,
            human_accepted=self.human_accepted,
        )


def _bool_option(value: object, name: str) -> bool:
    if not isinstance(value, bool):
        raise ValueError(f"{name} must be an explicit boolean")
    return value


def audit_frame(
    feature_id: str,
    original: NDArray[np.uint8],
    edited: NDArray[np.uint8],
    masks: Mapping[str, object],
    *,
    synthetic: bool = True,
    consented: bool = False,
    simulation_disclosed: bool = True,
    human_accepted: bool | None = None,
    provider_calls: int = 0,
    stripe_height: int = 256,
) -> FrameAudit:
    """Count exact changed channels without retaining any picture data.

    ``stripe_height`` bounds temporary allocations independently of frame
    dimensions. A mask is positive where any approved mask byte is nonzero.
    Original and edited buffers must be distinct, even for zero-strength edits.
    The entire picture is read, but this method is side-effect free.
    """
    spec = spec_for(feature_id)
    before = checked_frame(original)
    after = checked_frame(edited)
    if before.shape != after.shape:
        raise ValueError("Before and after require identical dimensions and channels")
    if type(stripe_height) is not int or not 1 <= stripe_height <= 1024:
        raise ValueError("Stripe height must be an integer in 1..1024")
    if type(provider_calls) is not int or provider_calls < 0:
        raise ValueError("Provider count must be a nonnegative integer")
    _bool_option(synthetic, "synthetic")
    _bool_option(consented, "consented")
    _bool_option(simulation_disclosed, "simulation_disclosed")
    if human_accepted is not None:
        _bool_option(human_accepted, "human_accepted")
    approved = checked_masks(masks, before, spec)
    support = authorized_support(approved, spec)
    height, width, channels = before.shape
    authorized = 0
    changed = 0
    inside = 0
    outside = 0
    alpha = 0
    largest = 0
    total_delta = 0
    over = 0
    for start in range(0, height, stripe_height):
        stop = min(height, start + stripe_height)
        original_chunk = before[start:stop, :, :3].astype(np.int16)
        edited_chunk = after[start:stop, :, :3].astype(np.int16)
        absolute = np.abs(edited_chunk - original_chunk)
        touched = np.any(absolute > 0, axis=2)
        permitted = support[start:stop]
        authorized += int(np.count_nonzero(permitted))
        changed += int(np.count_nonzero(touched))
        inside += int(np.count_nonzero(touched & permitted))
        outside += int(np.count_nonzero(touched & ~permitted))
        largest = max(largest, int(np.max(absolute)))
        total_delta += int(np.sum(absolute, dtype=np.int64))
        over += int(np.count_nonzero(np.any(
            absolute > spec.max_channel_delta,
            axis=2,
        )))
        if channels == 4:
            alpha += int(np.count_nonzero(
                before[start:stop, :, 3] != after[start:stop, :, 3],
            ))
    return FrameAudit(
        feature_id=feature_id,
        frame_pixels=width * height,
        authorized_pixels=authorized,
        altered_rgb_pixels=changed,
        altered_rgb_inside=inside,
        altered_rgb_outside=outside,
        altered_alpha_pixels=alpha,
        max_rgb_channel_delta=largest,
        sum_rgb_channel_delta=total_delta,
        pixels_over_limit=over,
        original_preserved=not np.shares_memory(before, after),
        provider_calls=provider_calls,
        simulation_disclosed=simulation_disclosed,
        synthetic=synthetic,
        consented=consented,
        human_accepted=human_accepted,
    )

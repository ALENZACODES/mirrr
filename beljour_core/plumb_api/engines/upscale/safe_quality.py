"""Numeric invariant inspection of a guarded upscale result.

The inspector re-renders the detailed and reference layers with the result's own
tile plan and checks, pixel by pixel:

- identity lock: inside the selection, RGB equals the lock blend of the two
  layers; at the full 5.0 lock with full coverage it equals the reference;
- outside the selection, RGB equals the detailed engine output;
- alpha equals the reference alpha everywhere;
- coverage: the output has the expected size and the face count matches;
- evidence label: the result carries the guarded-path label.

It returns aggregate counts only. Passing means these invariants hold for the
supplied pixels; it is never a real-face, identity or release quality PASS.
Author: John Khan.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from ...pro.strength import legacy_amount
from .safe import (
    SAFE_LABEL,
    FaceSelection,
    SafeUpscaleResult,
    blend,
    checked_image,
    checked_selection,
    reference_share_tenths,
    render_layers,
    upscaled_mask,
)
from .safe_tiles import admit


def inspect_safe_result(
    source: np.ndarray, selection: FaceSelection, result: SafeUpscaleResult,
) -> dict[str, Any]:
    image = checked_image(source)
    height, width, channels = image.shape
    mask = checked_selection(selection, height, width)
    scale = result.scale
    allocation = admit(width, height, channels=channels, scale=scale,
                       budget_bytes=result.allocation.budget_bytes)
    expected_shape = (height * scale, width * scale, channels)
    output = result.image
    counts = {
        "output_pixels": 0, "face_output_pixels": 0, "full_lock_pixels": 0,
        "full_lock_deviations": 0, "lock_mismatches": 0, "outside_mismatches": 0,
        "alpha_mismatches": 0,
    }
    geometry_ok = (
        isinstance(output, np.ndarray) and output.dtype == np.uint8
        and output.shape == expected_shape and allocation == result.allocation
    )
    if geometry_ok:
        tenths = reference_share_tenths(result.lock_level)
        detail = legacy_amount(result.detail_level)
        for tile in allocation.tile_plan():
            engine, reference = render_layers(image, tile, scale, detail)
            coverage = upscaled_mask(mask, tile, scale)
            region = output[tile.y0 * scale:tile.y1 * scale, tile.x0 * scale:tile.x1 * scale]
            expected = blend(engine, reference, coverage, tenths)
            face = coverage > 0
            differs = np.any(region[..., :3] != expected[..., :3], axis=-1)
            counts["output_pixels"] += int(face.size)
            counts["face_output_pixels"] += int(np.count_nonzero(face))
            counts["lock_mismatches"] += int(np.count_nonzero(differs & face))
            counts["outside_mismatches"] += int(np.count_nonzero(
                np.any(region[..., :3] != engine[..., :3], axis=-1) & ~face,
            ))
            if tenths == 50:
                # Full lock and full coverage: nothing but the reference may appear.
                full = coverage == 255
                counts["full_lock_pixels"] += int(np.count_nonzero(full))
                counts["full_lock_deviations"] += int(np.count_nonzero(
                    np.any(region[..., :3] != reference[..., :3], axis=-1) & full,
                ))
            if channels == 4:
                counts["alpha_mismatches"] += int(np.count_nonzero(region[..., 3] != reference[..., 3]))
    invariants = {
        "geometry": geometry_ok,
        "identity_lock": geometry_ok and counts["lock_mismatches"] == 0
        and counts["full_lock_deviations"] == 0,
        "outside_unchanged": geometry_ok and counts["outside_mismatches"] == 0,
        "alpha": geometry_ok and counts["alpha_mismatches"] == 0,
        "coverage": geometry_ok and result.face_pixels == int(np.count_nonzero(mask))
        and counts["face_output_pixels"] == result.face_pixels * scale * scale,
        "evidence_label": result.label == SAFE_LABEL,
    }
    return {
        "schema": "beljour-safe-upscale-inspection/1",
        **counts,
        "invariants": invariants,
        "status": "INVARIANTS_HOLD" if all(invariants.values()) else "INVARIANT_FAILED",
        "identity_verification": "NOT_PERFORMED",
        "real_face_quality": "NOT_RUN",
        "release_quality": "NOT_RUN",
    }

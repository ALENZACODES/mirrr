"""Pixel-accurate offline hairstyle evidence, separate from the real-face gate.

This checks actual output bytes, not catalogue status or human appearance.
No photo, mesh, or private information is serialized. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

import numpy as np

from .local_demo import DemoRefusal, DemoRender


@dataclass(frozen=True)
class RenderEvidence:
    style_id: str
    valid: bool
    status: str
    edited_pixels: int
    supported_pixels: int
    leaked_pixels: int
    alpha_changed: int
    changed_fraction: float
    maximum_rgb_change: int
    guard_applied: bool
    provider_calls: int

    def public(self) -> dict[str, Any]:
        """Only aggregate pixel quantities; never image or landmark data."""
        return {
            "style_id": self.style_id,
            "valid": self.valid,
            "status": self.status,
            "edited_pixels": self.edited_pixels,
            "supported_pixels": self.supported_pixels,
            "leaked_pixels": self.leaked_pixels,
            "alpha_changed": self.alpha_changed,
            "changed_fraction": round(self.changed_fraction, 8),
            "maximum_rgb_change": self.maximum_rgb_change,
            "guard_applied": self.guard_applied,
            "provider_calls": self.provider_calls,
            "evidence": "synthetic_pixel_contract_only",
        }


@dataclass(frozen=True)
class BatchEvidence:
    total: int
    valid: int
    refused: int
    failed: int
    max_leaked_pixels: int
    provider_calls: int
    styles: tuple[str, ...]

    def public(self) -> dict[str, Any]:
        return {
            "total": self.total,
            "valid": self.valid,
            "refused": self.refused,
            "failed": self.failed,
            "max_leaked_pixels": self.max_leaked_pixels,
            "provider_calls": self.provider_calls,
            "styles": list(self.styles),
            "scope": "synthetic_pixel_contract_not_real_face_quality",
        }


def analyse_demo(before: object, result: DemoRender | DemoRefusal) -> RenderEvidence:
    """Invalid altered pixels outside support always fail, including an injected guard."""
    if isinstance(result, DemoRefusal):
        return RenderEvidence(
            "unrendered", False, result.code, 0, 0, 0, 0, 0.0, 0, False, 0,
        )
    original = np.asarray(before)
    output = result.image
    support = result.support_mask
    if (original.dtype != np.uint8 or output.dtype != np.uint8
            or original.ndim != 3 or output.shape != original.shape
            or original.shape[2] not in (3, 4)
            or support.dtype != np.bool_ or support.shape != original.shape[:2]):
        return RenderEvidence(
            result.style_id, False, "invalid_shape", 0, 0, 0, 0, 0.0, 0, False, 0,
        )
    delta = np.abs(output[..., :3].astype(np.int16) - original[..., :3].astype(np.int16))
    changed = np.any(delta != 0, axis=2)
    count = int(np.count_nonzero(changed))
    supported = int(np.count_nonzero(support))
    leaked = int(np.count_nonzero(changed & ~support))
    alpha_changed = (
        int(np.count_nonzero(output[..., 3] != original[..., 3]))
        if original.shape[2] == 4 else 0
    )
    max_change = int(np.max(delta)) if delta.size else 0
    actual_share = count / (original.shape[0] * original.shape[1])
    count_matches = (
        result.changed_pixels == count
        and abs(result.changed_pixel_share - actual_share) < 1e-12
        and result.affected_region_pixels == supported
        and result.rendered == (count > 0)
    )
    guard_ok = (
        0 <= result.identity_similarity <= 1
        and math.isfinite(result.identity_similarity)
        and result.simulated
        and result.provider_calls == 0
    )
    valid = (leaked == 0 and alpha_changed == 0 and count_matches and guard_ok)
    if leaked > 0:
        status = "changed_outside_hair_region"
    elif alpha_changed:
        status = "altered_alpha"
    elif not count_matches:
        status = "inaccurate_render_evidence"
    elif not guard_ok:
        status = "identity_or_provider_contract"
    else:
        status = "rendered" if count else "unchanged_by_level"
    return RenderEvidence(
        result.style_id, valid, status, count, supported, leaked,
        alpha_changed, actual_share, max_change, guard_ok, result.provider_calls,
    )


def summarise_evidence(records: Iterable[RenderEvidence]) -> BatchEvidence:
    rows = list(records)
    if not rows:
        raise ValueError("Cannot summarise an empty local-render batch")
    names = tuple(sorted({r.style_id for r in rows if r.style_id != "unrendered"}))
    return BatchEvidence(
        total=len(rows),
        valid=sum(r.valid for r in rows),
        refused=sum(r.status in {
            "no_mesh", "invalid_mesh", "invalid_image", "invalid_primary_face",
            "no_hair_region", "unsupported_demo_style", "guard_rejected",
        } for r in rows),
        failed=sum(not r.valid for r in rows),
        max_leaked_pixels=max(r.leaked_pixels for r in rows),
        provider_calls=sum(r.provider_calls for r in rows),
        styles=names,
    )

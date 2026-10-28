"""Conservative visible-face edit masks for headwear and side-profile crops.

This helper does not infer head-covering pixels, erase an occluded person, or
pretend that anatomy behind a profile silhouette was observed. A supplied
SHA-bound protection field is the only source of cloth/occluder pixels. For
profiles, every child alpha is intersected with the geometric visible oval.
The source geometric masks remain separate for unchanged R12 pass definitions.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

Mask = NDArray[np.float32]
REGION_KEYS = frozenset({
    "face_oval", "lips", "mouth_opening", "right_eye", "left_eye", "eyes",
    "right_brow", "left_brow", "brows", "right_iris", "left_iris", "irises", "skin",
})
CHILD_KEYS = REGION_KEYS - {"face_oval"}
VERSION = "visible-face-occlusion/1"


@dataclass(frozen=True)
class Visibility:
    editable: dict[str, Mask]
    geometry: dict[str, Mask]
    annotation: str
    protected_supplied: bool
    profile: bool
    reduced_area: float
    max_protected_alpha: float
    silhouette_leak: float
    status: str

    def count_only(self) -> dict[str, bool | float | str]:
        """No personal pixels, input image, identity, box or path is included."""
        return {
            "visibility_policy": VERSION,
            "visibility_annotation": self.annotation,
            "protected_mask_supplied": self.protected_supplied,
            "profile_geometry": self.profile,
            "masked_area_share": round(self.reduced_area, 6),
            "max_protected_alpha": round(self.max_protected_alpha, 6),
            "silhouette_leak": round(self.silhouette_leak, 6),
            "occlusion_evidence": self.status,
        }


def _unit_mask(value: np.ndarray, shape: tuple[int, ...] | None) -> Mask:
    arr = np.asarray(value, dtype=np.float32)
    if arr.ndim != 2 or min(arr.shape) < 2 or (shape is not None and arr.shape != shape):
        raise ValueError("visibility mask must be a matching two-dimensional surface")
    if not np.isfinite(arr).all() or np.any(arr < 0) or np.any(arr > 1):
        raise ValueError("visibility mask must contain finite unit alpha")
    return arr.copy()


def _geometry(masks: Mapping[str, np.ndarray]) -> dict[str, Mask]:
    if set(masks) != REGION_KEYS:
        raise ValueError("all thirteen existing region alpha fields are required")
    raw_oval = _unit_mask(masks["face_oval"], None)
    return {name: _unit_mask(data, raw_oval.shape) for name, data in masks.items()}


def _within(field: Mask, support: Mask) -> Mask:
    # Minimum caps alpha conservatively and does not increase coverage.
    return np.minimum(field, support).astype(np.float32)


def _apply_protection(source: Mask, protected: Mask | None) -> Mask:
    if protected is None:
        return source.copy()
    return (source * (1.0 - protected)).astype(np.float32)


def _silhouette_leak(editable: Mapping[str, Mask], oval: Mask) -> float:
    if not editable:
        return 0.0
    outside = np.clip(1.0 - oval, 0.0, 1.0)
    return max(float(np.max(editable[name] * outside)) for name in CHILD_KEYS)


def prepare(
    masks: Mapping[str, np.ndarray], *, protected_mask: np.ndarray | None = None,
    pose: str = "frontal", occlusion: str = "none"
) -> Visibility:
    """Return safe-to-edit alpha fields and measured uncertainty separately.

    The optional protection map is caller-supplied evidence, not a prediction.
    Both masks and protection must be in the same *crop* coordinate system.
    Any missing protection for a declared head covering stays UNPROVEN.
    The face-oval edit alpha is reduced but the geometric reference oval is
    preserved for the original frozen acceptance test.
    """
    if pose not in {"frontal", "profile", "side", "side_profile", "unknown"}:
        raise ValueError("pose must come from an allowed annotation category")
    if occlusion not in {"none", "head_covering", "hijab", "headscarf", "unknown"}:
        raise ValueError("occlusion must come from an allowed annotation category")
    raw = _geometry(masks)
    protection = _unit_mask(protected_mask, raw["face_oval"].shape) if protected_mask is not None else None
    is_profile = pose in {"profile", "side", "side_profile"}
    is_covered = occlusion in {"head_covering", "hijab", "headscarf"}
    oval = raw["face_oval"]
    editable: dict[str, Mask] = {}
    for name in sorted(REGION_KEYS):
        field = raw[name]
        if name != "face_oval" and is_profile:
            field = _within(field, oval)
        editable[name] = _apply_protection(field, protection)
    if protection is not None:
        maximum = max(float(np.max(editable[name] * protection)) for name in REGION_KEYS)
    else:
        maximum = 0.0
    denominator = sum(float(np.sum(raw[name])) for name in REGION_KEYS)
    retained = sum(float(np.sum(editable[name])) for name in REGION_KEYS)
    reduced = max(0.0, min(1.0, (denominator - retained) / denominator)) if denominator > 0 else 0.0
    if is_covered and protection is None:
        status = "UNPROVEN"
    elif is_profile and float(oval.sum()) == 0.0:
        status = "UNPROVEN"
    elif is_covered and protection is not None and float(protection.sum()) == 0.0:
        status = "UNPROVEN"
    elif is_covered:
        status = "PROTECTED_ANNOTATION"
    elif is_profile:
        status = "VISIBLE_GEOMETRY_ONLY"
    else:
        status = "NO_OCCLUSION_REPORTED"
    leakage = _silhouette_leak(editable, oval) if is_profile else 0.0
    if not math.isfinite(leakage) or not math.isfinite(reduced):
        raise ValueError("non-finite visibility metrics")
    return Visibility(editable, raw, occlusion, protection is not None,
                      is_profile, reduced, maximum, leakage, status)

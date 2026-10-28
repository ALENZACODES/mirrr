"""Independent measurements for artistic output inspection on the local box.

The renderer's own success flags are not accepted as geometric evidence. These
functions consume actual output pixels and, optionally, a second mesh detected
on that output. Missing redetection remains unproven. No human quality rating is
invented from these proxies. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from .types import Plane, landmarks, luma, mask, photo

GEOMETRY_THRESHOLDS = {"aligned_rms_iod": 0.035, "worst_landmark_iod": 0.15,
                       "eye_width_relative_change": 0.08, "mouth_width_relative_change": 0.08,
                       "face_height_relative_change": 0.08}


def _distance(points: Plane, a: int, b: int) -> float:
    return float(np.linalg.norm(points[a] - points[b]))


def _normalised_frame(points: Plane) -> tuple[Plane, float]:
    middle = (points[468] + points[473]) * 0.5
    axis = points[473] - points[468]
    iod = float(np.linalg.norm(axis))
    if iod < 1e-9:
        raise ValueError("an independent mesh has degenerate iris centres")
    across = axis / iod
    down = np.array([-across[1], across[0]])
    centred = points - middle
    return np.stack([centred @ across, centred @ down], axis=1) / iod, iod


def geometry_observation(before_mesh: Any, after_mesh: Any, shape: tuple[int, int]) -> dict[str, Any]:
    """Align translation, roll and global scale; then measure residual proportions.

    This deliberately does not fit a general affine transform: an affine fit
    would hide a changed aspect ratio or differential face stretch.
    """
    if after_mesh is None:
        return {"status": "unproven", "reason": "no_independent_output_mesh", "metrics": {}}
    try:
        before = landmarks(before_mesh, shape)
        after = landmarks(after_mesh, shape)
    except ValueError:
        return {"status": "unproven", "reason": "invalid_independent_mesh", "metrics": {}}
    left, iod_before = _normalised_frame(before)
    right, iod_after = _normalised_frame(after)
    residual = np.sqrt(np.sum((right - left) ** 2, axis=1))
    before_eye = (_distance(before, 33, 133) + _distance(before, 263, 362)) / iod_before
    after_eye = (_distance(after, 33, 133) + _distance(after, 263, 362)) / iod_after
    before_mouth = _distance(before, 61, 291) / iod_before
    after_mouth = _distance(after, 61, 291) / iod_after
    before_height = _distance(before, 10, 152) / iod_before
    after_height = _distance(after, 10, 152) / iod_after
    metrics = {
        "aligned_rms_iod": float(np.sqrt(np.mean(residual * residual))),
        "worst_landmark_iod": float(np.max(residual)),
        "eye_width_relative_change": abs(after_eye - before_eye) / max(1e-9, before_eye),
        "mouth_width_relative_change": abs(after_mouth - before_mouth) / max(1e-9, before_mouth),
        "face_height_relative_change": abs(after_height - before_height) / max(1e-9, before_height),
        "global_scale_ratio": iod_after / iod_before,
    }
    failed = [name for name, maximum in GEOMETRY_THRESHOLDS.items() if metrics[name] > maximum]
    return {"status": "passed" if not failed else "failed", "metrics": metrics, "failures": failed,
            "scope": "independent detector proxy; human review still required"}


def protected_pixels(before: np.ndarray, after: np.ndarray, protected_mask: Any) -> dict[str, float | bool]:
    src, out = photo(before), photo(after)
    if src.shape != out.shape:
        raise ValueError("before and after must have the same shape")
    selected = mask(protected_mask, src.shape[:2], "protection") > 0
    delta = np.abs(src[..., :3].astype(float) - out[..., :3].astype(float))
    n = int(np.count_nonzero(selected))
    values = delta[selected]
    return {"observed_pixels": float(n), "max_error": float(np.max(values, initial=0)),
            "mean_error": float(np.mean(values)) if n else 0.0,
            "observed": n > 0, "exact": bool(n > 0 and not np.any(values > 0))}


def texture_observation(before: np.ndarray, after: np.ndarray, region: Any) -> dict[str, float | str]:
    """Describe local detail without calling smoothing a benefit or injury."""
    src, out = photo(before), photo(after)
    if src.shape != out.shape:
        raise ValueError("before and after must have the same shape")
    coverage = mask(region, src.shape[:2], "region")
    selected = coverage[1:-1, 1:-1] >= 0.95
    old, new = luma(src), luma(out)

    def laplacian(values: Plane) -> Plane:
        return (values[:-2, 1:-1] + values[2:, 1:-1] + values[1:-1, :-2]
                + values[1:-1, 2:] - 4 * values[1:-1, 1:-1])

    n = int(np.count_nonzero(selected))
    if n < 16:
        return {"status": "unproven", "observed_pixels": float(n)}
    lap0, lap1 = laplacian(old)[selected], laplacian(new)[selected]
    old_energy, new_energy = float(np.mean(lap0 * lap0)), float(np.mean(lap1 * lap1))
    difference = new[1:-1, 1:-1][selected] - old[1:-1, 1:-1][selected]
    return {"status": "measured", "observed_pixels": float(n), "source_laplacian_energy": old_energy,
            "output_laplacian_energy": new_energy, "energy_ratio": new_energy / max(1e-9, old_energy),
            "mean_luminance_change": float(np.mean(difference)),
            "p95_luminance_change": float(np.quantile(np.abs(difference), 0.95))}


def alpha_edges(before: np.ndarray, after: np.ndarray) -> dict[str, float | bool | str]:
    src, out = photo(before), photo(after)
    if src.shape != out.shape:
        raise ValueError("before and after must have the same shape")
    if src.shape[2] != 4:
        return {"status": "not_applicable", "alpha_present": False}
    alpha = src[..., 3]
    transparent, fractional = alpha == 0, (alpha > 0) & (alpha < 255)
    delta = np.abs(src.astype(float) - out.astype(float))
    return {"status": "measured", "alpha_present": True,
            "alpha_max_error": float(np.max(delta[..., 3])),
            "transparent_rgb_max_error": float(np.max(delta[..., :3][transparent], initial=0)),
            "fractional_alpha_pixels": float(np.count_nonzero(fractional)),
            "fractional_rgb_p95_change": float(np.quantile(delta[..., :3][fractional], 0.95))
            if np.any(fractional) else 0.0}


def inspect_output(before: np.ndarray, after: np.ndarray, *, before_mesh: Any = None,
                   after_mesh: Any = None, hair_mask: Any = None, eye_mask: Any = None,
                   detail_mask: Any = None) -> Mapping[str, Any]:
    """Optional richer evidence; masks are observations supplied by the caller."""
    src = photo(before)
    measurements: dict[str, Any] = {"alpha": alpha_edges(src, after),
                                     "geometry": geometry_observation(before_mesh, after_mesh, src.shape[:2])}
    for name, value in (("hair", hair_mask), ("eyes", eye_mask)):
        measurements[name] = ({"status": "unproven", "reason": "missing_observation"} if value is None
                              else protected_pixels(src, after, value))
    measurements["detail"] = ({"status": "unproven", "reason": "missing_observation"} if detail_mask is None
                              else texture_observation(src, after, detail_mask))
    return measurements

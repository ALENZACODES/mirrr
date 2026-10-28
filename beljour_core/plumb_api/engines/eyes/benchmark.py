"""Image-local real-face probes; no photos, paths or face coordinates are reported.

The caller supplies licensed local photographs and cleared or manually verified
landmarks. Missing observations are UNTESTED, never successful lash evidence.
Author: John Khan.
"""
from __future__ import annotations

import time
from collections.abc import Mapping
from typing import Any

import numpy as np

from .contracts import FEATURES
from .engine import render_eyes
from .geometry import eye_protection, frames

DEFAULT_STYLES = {"W59": "hybrid", "W60": "kitten", "W61": "lifting", "W62": "cluster", "W63": "volumising",
                  "W64": "wing", "W65": "floating", "W66": "halo", "W67": "duochrome", "W75": "", "W76": "navy"}
PASS_DEFINITION = {
    "version": "eyes-r15b-pass/1", "features": list(FEATURES),
    "numerical": {"finite": True, "byte_range": [0, 255], "alpha_unchanged": True,
                  "protected_eye_changed_pixels": 0, "outside_changed_pixels": 0,
                  "zero_amount_changed_pixels": 0, "observed_lash_count_error": 0,
                  "lift_length_error_px_max": 1e-6, "changed_pixels_min": 1},
    "groups": ["anatomy", "skin_tone", "gender", "age_band", "occlusion", "face_size", "yaw"],
    "minimum_group_count": 30, "minimum_group_pass_rate": .95, "maximum_group_gap": .03,
    "missing_group": "UNTESTED", "small_group": "UNTESTED", "missing_lash_traces": "UNTESTED",
    "visual": "All effects require independent visible-quality review. W75 additionally requires artists and models of each anatomy.",
}


def evaluate_face(photo: np.ndarray, landmarks: Any, evidence: Mapping[str, Any] | None = None) -> list[dict[str, Any]]:
    evidence = dict(evidence or {})
    output = []
    protection = eye_protection(photo.shape[0], photo.shape[1], frames(landmarks, photo.shape[1], photo.shape[0]))
    for feature in FEATURES:
        request: dict[str, Any] = {"feature": feature, "style": DEFAULT_STYLES[feature], "amount": .65,
                                   "anatomy": evidence.get("anatomy", {"right": "open", "left": "open"})}
        for name in ("observed_lashes", "natural_density", "skin_depth", "glasses_clearance", "lower"):
            if name in evidence:
                request[name] = evidence[name]
        started = time.perf_counter()
        try:
            rendered = render_eyes(photo, landmarks, request, occlusion_mask=evidence.get("occlusion_mask"))
            identity = render_eyes(photo, landmarks, dict(request, amount=0), occlusion_mask=evidence.get("occlusion_mask"))
            changed = np.any(photo != rendered.image, axis=2)
            metrics = {"finite": bool(np.all(np.isfinite(rendered.image))),
                       "protected_eye_changed_pixels": int(np.count_nonzero(changed & (protection > 0))),
                       "outside_changed_pixels": int(np.count_nonzero(changed & (rendered.coverage == 0))),
                       "zero_amount_changed_pixels": int(np.count_nonzero(photo != identity.image)),
                       "alpha_unchanged": bool(photo.shape[2] == 3 or np.array_equal(photo[:, :, 3], rendered.image[:, :, 3])),
                       "changed_pixels": int(np.count_nonzero(changed)),
                       "length_error_px": float(rendered.report.get("length_error_px", 0)),
                       "elapsed_ms": (time.perf_counter() - started) * 1000}
            if feature in ("W61", "W63"):
                metrics["observed_lash_count_error"] = abs(int(rendered.report.get("observed_count", 0)) - int(rendered.report.get("rendered_count", 0)))
            eligible = rendered.report["status"] != "unavailable"
            if feature == "W76" and rendered.report.get("mascara", {}).get("status") == "unavailable":
                eligible = False
            passed = bool(eligible and metrics["finite"] and metrics["alpha_unchanged"] and metrics["changed_pixels"] > 0
                          and metrics["protected_eye_changed_pixels"] == 0 and metrics["outside_changed_pixels"] == 0
                          and metrics["zero_amount_changed_pixels"] == 0 and metrics["length_error_px"] <= 1e-6
                          and metrics.get("observed_lash_count_error", 0) == 0)
            output.append({"feature": feature, "eligible": eligible, "passed": passed if eligible else None,
                           "status": "PASS" if passed else "FAIL" if eligible else "UNTESTED",
                           "reason": rendered.report.get("reason", "Required observed lashes are missing." if not eligible else ""),
                           "metrics": metrics, "visual_quality": "UNTESTED"})
        except (ValueError, TypeError, OverflowError) as exc:
            output.append({"feature": feature, "eligible": False, "passed": None, "status": "UNTESTED",
                           "reason": type(exc).__name__, "metrics": {}, "visual_quality": "UNTESTED"})
    return output


def aggregate(records: list[Mapping[str, Any]], group_key: str = "group") -> dict[str, Any]:
    """Minimum-slice and eligibility accounting; no report-only skip becomes a PASS."""
    groups: dict[str, list[Mapping[str, Any]]] = {}
    for item in records:
        value = item.get(group_key)
        group = str(value) if isinstance(value, (str, int)) and str(value) else "unknown"
        groups.setdefault(group, []).append(item)
    summary = {}
    rates = []
    for group, items in sorted(groups.items()):
        eligible = [item for item in items if item.get("eligible") is True]
        passed = sum(item.get("passed") is True for item in eligible)
        rate = passed / len(eligible) if eligible else None
        complete = len(eligible) == len(items) and len(eligible) >= 30 and group != "unknown"
        status = "PASS" if complete and rate is not None and rate >= .95 else "FAIL" if complete else "UNTESTED"
        summary[group] = {"count": len(items), "eligible": len(eligible), "untested": len(items) - len(eligible),
                          "passed": passed, "rate": rate, "status": status}
        if complete and rate is not None:
            rates.append(rate)
    gap = max(rates) - min(rates) if len(rates) >= 2 else None
    status = "UNTESTED"
    if summary and all(row["status"] != "UNTESTED" for row in summary.values()):
        status = "PASS" if all(row["status"] == "PASS" for row in summary.values()) and (gap is None or gap <= .03) else "FAIL"
    return {"status": status, "groups": summary, "maximum_gap": gap, "definition": PASS_DEFINITION["version"]}

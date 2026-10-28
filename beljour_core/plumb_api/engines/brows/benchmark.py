"""Box-side W69-W74 invariant checks with honest eligibility and group aggregation.

Only derived metrics leave the caller. This module never opens a file, prints a
photo, contacts a service or infers demographic labels. Definitions precede runs.
Author: John Khan.
"""
from __future__ import annotations

import time
from collections.abc import Iterable
from typing import Any

import numpy as np

from .contracts import FEATURES, BrowEvidence
from .engine import render_brows
from .evidence import observe_brows

PASS_DEFINITIONS: dict[str, dict[str, Any]] = {
    "W69": {"name": "Observed brow tint", "checks": ["outside_unchanged", "skin_gap_unchanged", "alpha_unchanged", "no_added_hairs"],
            "every_group_rate": 0.95, "requires_human_review": True},
    "W70": {"name": "Observed brow lamination", "checks": ["outside_unchanged", "rgb_histogram_conserved", "alpha_unchanged", "no_added_hairs"],
            "every_group_rate": 0.95, "requires_human_review": True},
    "W71": {"name": "Healed microblading", "checks": ["outside_unchanged", "healed_default", "adult_gate", "opacity_cap"],
            "every_group_rate": 0.95, "requires_human_review": True},
    "W72": {"name": "Powder and nano", "checks": ["outside_unchanged", "healed_default", "adult_gate", "opacity_cap"],
            "every_group_rate": 0.95, "requires_human_review": True},
    "W73": {"name": "Independent brow guide", "checks": ["outside_unchanged", "no_auto_thinning", "geometry_preserved", "alpha_unchanged"],
            "every_group_rate": 0.95, "requires_human_review": True},
    "W74": {"name": "Hypothetical progress", "checks": ["photo_unchanged", "zero_growth_default", "no_efficacy_claim", "safety_visible"],
            "every_group_rate": 1.0, "requires_human_review": True},
}


def evaluate_brows(image: np.ndarray, landmarks: Any, group: str = "unknown", *,
                   evidence: BrowEvidence | None = None, adult_confirmed: bool = False) -> list[dict[str, Any]]:
    if not isinstance(group, str) or not group or len(group) > 120:
        raise ValueError("group must be a short supplied category label")
    measured = observe_brows(image, landmarks) if evidence is None else evidence
    rows: list[dict[str, Any]] = []
    for feature in FEATURES:
        started = time.perf_counter()
        if feature in ("W71", "W72") and not adult_confirmed:
            rows.append({"feature": feature, "group": group, "status": "unavailable", "passed": False,
                         "reason": "adult eligibility not provided", "metrics": {}, "seconds": 0.0,
                         "human_review": "Not tested"})
            continue
        settings: dict[str, Any] = {"amount": 0.7}
        if feature in ("W71", "W72"):
            settings["adultConfirmed"] = True
        try:
            result = render_brows(image, landmarks, feature, settings, measured)
            metrics = result.metrics
            checks = {"outside_unchanged": metrics["outside_unchanged"],
                      "alpha_unchanged": metrics["alpha_unchanged"],
                      "skin_gap_unchanged": metrics.get("skin_gap_unchanged", False),
                      "no_added_hairs": metrics.get("added_hairs") == 0,
                      "rgb_histogram_conserved": all(np.array_equal(np.sort(image[..., c].ravel()), np.sort(result.image[..., c].ravel())) for c in range(3)),
                      "healed_default": metrics.get("state") == "healed",
                      "adult_gate": metrics.get("adult_confirmed") is True,
                      "opacity_cap": metrics.get("maximum_opacity", 1) <= 0.28,
                      "no_auto_thinning": metrics.get("automatic_thinning") is False,
                      "geometry_preserved": metrics.get("geometry_preserved") is True,
                      "photo_unchanged": np.array_equal(image, result.image),
                      "zero_growth_default": metrics.get("length_scale") == metrics.get("density_scale") == 1,
                      "no_efficacy_claim": metrics.get("efficacy_claim") is False,
                      "safety_visible": "safety_note" in result.details}
            required = PASS_DEFINITIONS[feature]["checks"]
            variants = evaluate_brow_variants(image, landmarks, feature, evidence=measured, adult_confirmed=adult_confirmed)
            passed = (result.status == "simulation" and all(bool(checks[name]) for name in required)
                      and not verify_variant_completeness(feature, variants) and all(row["passed"] for row in variants))
            rows.append({"feature": feature, "group": group, "status": result.status,
                         "passed": passed, "variants": variants, "metrics": {**metrics, "checks": {name: bool(checks[name]) for name in required}},
                         "seconds": time.perf_counter() - started, "human_review": "Not tested"})
        except ValueError as exc:
            rows.append({"feature": feature, "group": group, "status": "unavailable", "passed": False,
                         "reason": str(exc), "metrics": {}, "seconds": time.perf_counter() - started,
                         "human_review": "Not tested"})
    return rows


def aggregate_brows(rows: Iterable[dict[str, Any]]) -> dict[str, Any]:
    groups: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for row in rows:
        if row.get("feature") not in FEATURES or not isinstance(row.get("group"), str):
            raise ValueError("invalid brow benchmark row")
        groups.setdefault((row["feature"], row["group"]), []).append(row)
    result = []
    for (feature, group), members in sorted(groups.items()):
        count = len(members)
        passed = sum(row.get("passed") is True for row in members)
        unavailable = sum(row.get("status") == "unavailable" for row in members)
        times = sorted(float(row.get("seconds", 0)) for row in members)
        result.append({"feature": feature, "group": group, "count": count, "passed": passed,
                       "pass_rate": passed / count, "unavailable": unavailable,
                       "p95_seconds": times[min(count - 1, int(0.95 * count))],
                       "engineering_gate": passed / count >= PASS_DEFINITIONS[feature]["every_group_rate"],
                       "visual_quality": "Not tested"})
    missing = sorted(set(FEATURES) - {item["feature"] for item in result})
    return {"version": "brows-realface-r15b/1", "groups": result, "missing_features": missing,
            "engineering_pass": bool(result) and not missing and all(item["engineering_gate"] for item in result),
            "realface_release": "UNPROVEN: human appearance review and complete frozen-set evidence are required"}

VARIANT_SETTINGS: dict[str, tuple[tuple[str, dict[str, Any]], ...]] = {
    "W69": (("first_week", {"state": "first_week", "amount": 1}),
            ("settled", {"state": "settled", "amount": 1}),
            ("faded", {"state": "faded", "amount": 1})),
    "W70": (("subtle", {"amount": 0.33, "angle": 60}),
            ("clear", {"amount": 0.66, "angle": 60}),
            ("upright", {"amount": 1, "angle": 75})),
    "W71": (("healed", {"adultConfirmed": True, "state": "healed"}),
            ("fresh", {"adultConfirmed": True, "state": "fresh"}),
            ("faded", {"adultConfirmed": True, "state": "faded"})),
    "W72": (("powder_healed", {"adultConfirmed": True, "method": "powder", "state": "healed"}),
            ("powder_fresh", {"adultConfirmed": True, "method": "powder", "state": "fresh"}),
            ("powder_faded", {"adultConfirmed": True, "method": "powder", "state": "faded"}),
            ("nano_healed", {"adultConfirmed": True, "method": "nano", "state": "healed"}),
            ("nano_fresh", {"adultConfirmed": True, "method": "nano", "state": "fresh"}),
            ("nano_faded", {"adultConfirmed": True, "method": "nano", "state": "faded"})),
    "W73": (("independent_arches", {"leftArch": 0.12, "rightArch": 0.04}),
            ("full_outline", {"thickness": 1.12}),
            ("longer_tail", {"tail": 0.08})),
    "W74": (("brows_default", {"site": "brows"}),
            ("lashes_default", {"site": "lashes"}),
            ("hypothetical_increase", {"lengthChange": 15, "densityChange": 10}),
            ("hypothetical_decrease", {"lengthChange": -10, "densityChange": -10})),
}


def evaluate_brow_variants(image: np.ndarray, landmarks: Any, feature: str, *,
                          evidence: BrowEvidence | None = None, adult_confirmed: bool = False) -> list[dict[str, Any]]:
    """Execute every named state, keeping refusal as non-pass rather than dropping it."""
    if feature not in VARIANT_SETTINGS:
        raise ValueError("unknown brow variant feature")
    if feature in ("W71", "W72") and not adult_confirmed:
        return [{"name": name, "passed": False, "status": "unavailable", "reason": "adult eligibility not provided"}
                for name, _ in VARIANT_SETTINGS[feature]]
    measured = observe_brows(image, landmarks) if evidence is None else evidence
    rows = []
    for name, settings in VARIANT_SETTINGS[feature]:
        try:
            result = render_brows(image, landmarks, feature, settings, measured)
            changed = np.any(result.image != image, axis=2)
            exterior = bool(np.array_equal(image[result.support == 0], result.image[result.support == 0]))
            alpha = bool(image.shape[2] == 3 or np.array_equal(image[..., 3], result.image[..., 3]))
            finite = bool(np.all(np.isfinite(result.support)))
            feature_check = True
            if feature == "W69":
                feature_check = bool(np.array_equal(image[measured.coverage == 0], result.image[measured.coverage == 0]))
            elif feature == "W70":
                feature_check = all(np.array_equal(np.sort(image[..., c].ravel()), np.sort(result.image[..., c].ravel())) for c in range(3))
            elif feature in ("W71", "W72"):
                feature_check = result.metrics["maximum_opacity"] <= 0.45 and result.metrics["prediction"] is False
            elif feature == "W73":
                feature_check = result.metrics["thickness_scale"] >= 1 and result.metrics["geometry_preserved"] is True
            else:
                feature_check = not np.any(changed) and result.metrics["efficacy_claim"] is False
            passed = result.status == "simulation" and exterior and alpha and finite and feature_check
            rows.append({"name": name, "status": result.status, "passed": bool(passed),
                         "outside_unchanged": exterior, "alpha_unchanged": alpha,
                         "finite_support": finite, "feature_rule": bool(feature_check),
                         "changed_pixels": int(np.count_nonzero(changed)),
                         "support_pixels": int(np.count_nonzero(result.support)),
                         "visual_quality": "Not tested"})
        except ValueError as exc:
            rows.append({"name": name, "status": "unavailable", "passed": False,
                         "reason": str(exc), "visual_quality": "Not tested"})
    return rows


def verify_variant_completeness(feature: str, rows: list[dict[str, Any]]) -> list[str]:
    if feature not in VARIANT_SETTINGS:
        raise ValueError("unknown brow variant feature")
    expected = [name for name, _ in VARIANT_SETTINGS[feature]]
    actual = [row.get("name") for row in rows]
    errors = []
    if actual != expected:
        errors.append("variant names or order differ from the preregistered list")
    for row in rows:
        if row.get("status") not in ("simulation", "unavailable"):
            errors.append("variant has an unknown status")
        if not isinstance(row.get("passed"), bool):
            errors.append("variant pass result must be boolean")
        if row.get("status") == "unavailable" and row.get("passed"):
            errors.append("unavailable variants cannot pass")
    return errors

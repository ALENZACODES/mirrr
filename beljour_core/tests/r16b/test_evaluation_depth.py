"""Deep synthetic quality tests for R16B evaluators. Author: John Khan."""
from __future__ import annotations
import numpy as np
import pytest
from plumb_api.engines.lips.engine import render as render_lip
from plumb_api.engines.lips.geometry import lip_mask
from plumb_api.engines.lips import evaluation as lip_eval
from plumb_api.engines.smile.contracts import SmileAnnotation
from plumb_api.engines.smile.engine import render as render_smile
from plumb_api.engines.smile.geometry import polygon_mask
from plumb_api.engines.smile import evaluation as smile_eval
from plumb_api.engines.skin_more.engine import render as render_skin
from plumb_api.engines.skin_more import evaluation as skin_eval
from plumb_api.engines.skin_more.freckles import preserve as preserve_freckles


def photo(h: int = 96, w: int = 96) -> np.ndarray:
    yy, xx = np.mgrid[:h, :w]
    result = np.zeros((h, w, 4), dtype=np.uint8)
    result[..., 0] = 132 + (xx * 3 + yy) % 53
    result[..., 1] = 91 + (xx + yy * 2) % 47
    result[..., 2] = 74 + (xx * 2 + yy * 3) % 41
    result[..., 3] = 255
    return result


def landmarks() -> np.ndarray:
    points = np.full((478, 2), 0.5, dtype=float)
    contour = np.array(
        [
            [0.39, 0.66],
            [0.43, 0.64],
            [0.47, 0.635],
            [0.50, 0.64],
            [0.53, 0.635],
            [0.57, 0.64],
            [0.61, 0.66],
            [0.58, 0.69],
            [0.54, 0.705],
            [0.50, 0.71],
            [0.46, 0.705],
            [0.42, 0.69],
        ],
        dtype=float,
    )
    outer = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308]
    inner = [324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415]
    for index, landmark_id in enumerate(outer):
        points[landmark_id] = contour[index]
    for index, landmark_id in enumerate(inner):
        points[landmark_id] = contour[index % len(contour)]
    return points


def annotation() -> SmileAnnotation:
    return SmileAnnotation(
        teeth=(
            (0.42, 0.64),
            (0.58, 0.64),
            (0.57, 0.70),
            (0.43, 0.70),
        ),
        gum=(
            (0.43, 0.635),
            (0.57, 0.635),
            (0.56, 0.655),
            (0.44, 0.655),
        ),
        midline_x=0.5,
    )


def square(h: int = 96, w: int = 96, x0: int = 20, y0: int = 20, x1: int = 76, y1: int = 76) -> np.ndarray:
    mask = np.zeros((h, w), dtype=np.float32)
    mask[y0:y1, x0:x1] = 1.0
    return mask


def region(name: str, x0: float, y0: float, x1: float, y1: float) -> dict[str, object]:
    return {
        "name": name,
        "points": [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1],
        ],
    }


def lip_request(feature: str, amount: float) -> dict[str, object]:
    styles = {
        "W45": "natural_plump",
        "W46": "balanced",
        "W47": "healed",
        "W48": "rest",
        "W49": "0.5_ml_style",
        "W54": "blue_based",
        "W55": "matte",
        "W56": "coffee",
        "W57": "medium",
    }
    return {
        "feature": feature,
        "style": styles[feature],
        "amount": amount,
        "adult_confirmed": feature in {"W45", "W47", "W48", "W49"},
    }


def skin_request(feature: str, amount: float) -> dict[str, object]:
    styles = {
        "W77": "sheer",
        "W78": "olive",
        "W79": "match_face",
        "W80": "mineral_cast",
        "W81": "orange_corrector",
        "W82": "green_micro",
        "W83": "irregular",
        "W84": "dewy_base",
        "W85": "both",
        "W86": "soft_round",
        "W87": "berry",
        "W88": "soft_drape",
        "W89": "interview",
        "W90": "faux_subtle",
        "W91": "continuity",
        "W92": "texture_first",
    }
    request: dict[str, object] = {
        "feature": feature,
        "style": styles[feature],
        "amount": amount,
    }
    if feature in {"W79", "W80", "W81", "W82", "W85", "W86", "W87", "W88", "W90", "W91"}:
        request["masks"] = [
            region("a", 0.20, 0.20, 0.48, 0.75),
            region("b", 0.52, 0.20, 0.80, 0.75),
        ]
    if feature == "W83":
        request["consent_local_health_data"] = True
        request["diary_values"] = [0.2, 0.3, 0.25, 0.35]
    return request


def test_lip_integrity_detects_alpha_change() -> None:
    before = photo()
    after = before.copy()
    after[4, 5, 3] = 0
    row = lip_eval.integrity(before, after)
    assert row.shape_equal
    assert row.dtype_equal
    assert row.alpha_equal is False
    assert row.changed_fraction == 0.0


def test_lip_integrity_detects_rgb_change() -> None:
    before = photo()
    after = before.copy()
    after[4, 5, 0] = 0
    row = lip_eval.integrity(before, after)
    assert row.alpha_equal
    assert row.changed_fraction > 0
    assert row.mean_absolute_error > 0


def test_lip_locality_passes_inside_support() -> None:
    before = photo()
    after = before.copy()
    support = square()
    after[30:40, 30:40, 0] = 0
    row = lip_eval.locality(before, after, support)
    assert row.inside_change > 0
    assert row.outside_change == 0
    assert row.protected_change == 0
    assert row.passed


def test_lip_locality_fails_outside_support() -> None:
    before = photo()
    after = before.copy()
    support = square()
    after[2:16, 2:16, :3] = 0
    row = lip_eval.locality(before, after, support, outside_limit=0.0)
    assert row.outside_change > 0
    assert row.passed is False


def test_lip_locality_fails_protected_change() -> None:
    before = photo()
    after = before.copy()
    support = square()
    protected = np.zeros_like(support)
    protected[32:40, 32:40] = 1
    after[32:40, 32:40, 1] = 0
    row = lip_eval.locality(before, after, support, protected)
    assert row.protected_change > 0
    assert row.passed is False


def test_lip_texture_identity_is_perfect() -> None:
    before = photo()
    support = square()
    row = lip_eval.texture(before, before.copy(), support)
    assert row.correlation == pytest.approx(1.0)
    assert row.gradient_ratio == pytest.approx(1.0)
    assert row.variance_ratio == pytest.approx(1.0)
    assert row.passed


def test_lip_geometry_delta_zero_for_same_landmarks() -> None:
    points = landmarks()
    row = lip_eval.geometry_delta(points, points.copy())
    assert row["mean"] == 0
    assert row["maximum"] == 0
    assert row["p95"] == 0


def test_lip_geometry_delta_detects_shift() -> None:
    before = landmarks()
    after = before.copy()
    after[61, 1] += 0.02
    row = lip_eval.geometry_delta(before, after)
    assert row["mean"] > 0
    assert row["maximum"] == pytest.approx(0.02)
    assert row["p95"] >= 0


@pytest.mark.parametrize("feature", ["W45", "W47", "W48", "W49"])
def test_adult_lip_evaluator_fails_when_adult_gate_missing(feature: str) -> None:
    before = photo()
    points = landmarks()
    rendered = render_lip(before, points, lip_request(feature, 0.45))
    zero = render_lip(before, points, lip_request(feature, 0.0))
    support = np.maximum(lip_mask(before.shape[0], before.shape[1], points), rendered.coverage)
    if feature == "W45":
        row = lip_eval.evaluate_w45(before, rendered.image, zero.image, support, points, False)
    elif feature == "W47":
        row = lip_eval.evaluate_w47(before, rendered.image, zero.image, support, False)
    elif feature == "W48":
        row = lip_eval.evaluate_w48(before, rendered.image, zero.image, support, False)
    else:
        row = lip_eval.evaluate_w49(before, rendered.image, zero.image, support, False)
    assert row.passed is False
    assert any("adult" in reason for reason in row.failures)


def test_w45_evaluator_reports_anatomy_metrics() -> None:
    before = photo()
    points = landmarks()
    rendered = render_lip(before, points, lip_request("W45", 0.35))
    zero = render_lip(before, points, lip_request("W45", 0.0))
    support = np.maximum(lip_mask(96, 96, points), rendered.coverage)
    row = lip_eval.evaluate_w45(before, rendered.image, zero.image, support, points, True)
    assert row.feature == "W45"
    assert row.metrics["mouth_width"] > 0
    assert row.metrics["upper_height"] >= 0
    assert row.metrics["lower_height"] >= 0
    assert row.metrics["alpha_identity"] is True
    assert row.metrics["zero_identity"] is True


def test_w46_evaluator_reports_edge_metrics() -> None:
    before = photo()
    points = landmarks()
    rendered = render_lip(before, points, lip_request("W46", 0.35))
    support = lip_mask(96, 96, points)
    row = lip_eval.evaluate_w46(before, rendered.image, support, rendered.coverage)
    assert row.feature == "W46"
    assert float(row.metrics["edge_overlap"]) >= 0
    assert float(row.metrics["corner_ratio"]) >= 0
    assert row.metrics["alpha_identity"] is True


def test_w47_evaluator_reports_monotonic_fade() -> None:
    before = photo()
    points = landmarks()
    rendered = render_lip(before, points, lip_request("W47", 0.5))
    zero = render_lip(before, points, lip_request("W47", 0.0))
    support = lip_mask(96, 96, points)
    row = lip_eval.evaluate_w47(before, rendered.image, zero.image, support, True)
    assert row.metrics["fade_monotonic"] is True
    assert float(row.metrics["fresh_strength"]) > float(row.metrics["last_fade_strength"])


def test_w54_evaluator_protects_checked_teeth() -> None:
    before = photo()
    points = landmarks()
    rendered = render_lip(before, points, lip_request("W54", 0.8))
    zero = render_lip(before, points, lip_request("W54", 0.0))
    support = lip_mask(96, 96, points)
    teeth = np.zeros((96, 96), dtype=np.float32)
    teeth[52:59, 42:55] = 1
    row = lip_eval.evaluate_w54(before, rendered.image, zero.image, support, teeth)
    assert row.metrics["protected_teeth_unchanged"] is True
    assert row.metrics["protected_teeth_error"] == 0


def test_w55_evaluator_records_texture_metrics() -> None:
    before = photo()
    points = landmarks()
    rendered = render_lip(before, points, lip_request("W55", 0.6))
    zero = render_lip(before, points, lip_request("W55", 0.0))
    support = lip_mask(96, 96, points)
    row = lip_eval.evaluate_w55(before, rendered.image, zero.image, support)
    assert 0 <= float(row.metrics["texture_retention"]) <= 1
    assert float(row.metrics["gradient_ratio"]) >= 0
    assert float(row.metrics["variance_ratio"]) >= 0


def test_w56_evaluator_records_wear_order() -> None:
    before = photo()
    points = landmarks()
    rendered = render_lip(before, points, lip_request("W56", 0.7))
    zero = render_lip(before, points, lip_request("W56", 0.0))
    support = lip_mask(96, 96, points)
    row = lip_eval.evaluate_w56(before, rendered.image, zero.image, support, seed=17)
    assert row.metrics["deterministic"] is True
    assert float(row.metrics["two_hours_retention"]) > float(row.metrics["coffee_retention"])
    assert float(row.metrics["coffee_retention"]) > float(row.metrics["meal_retention"])


def test_w57_evaluator_reports_observed_pigmentation() -> None:
    before = photo()
    points = landmarks()
    rendered = render_lip(before, points, lip_request("W57", 0.7))
    zero = render_lip(before, points, lip_request("W57", 0.0))
    support = lip_mask(96, 96, points)
    row = lip_eval.evaluate_w57(before, rendered.image, zero.image, support)
    assert float(row.metrics["side_delta"]) >= 0
    assert float(row.metrics["vertical_delta"]) >= 0
    assert float(row.metrics["two_tone_score"]) >= 0


def dental_support(feature: str) -> tuple[np.ndarray, np.ndarray, SmileAnnotation]:
    before = photo()
    ann = annotation()
    rendered = render_smile(
        before,
        {
            "feature": feature,
            "adult_confirmed": True,
            "amount": 0.45,
            "annotation": ann,
        },
    )
    return before, rendered.image, ann


@pytest.mark.parametrize("feature", ["W50", "W51", "W52", "W53"])
def test_dental_locality_is_measured_inside_checked_support(feature: str) -> None:
    before, after, ann = dental_support(feature)
    teeth = polygon_mask(96, 96, ann.teeth)
    gum = polygon_mask(96, 96, ann.gum)
    support = np.clip(teeth + gum, 0, 1)
    row = smile_eval.locality(before, after, support)
    assert row.outside_error <= 0.01
    assert row.alpha_identity
    assert row.support_fraction > 0


def test_smile_annotation_metrics_are_neutral_measurements() -> None:
    row = smile_eval.annotation_metrics(annotation())
    assert row["tooth_width"] > 0
    assert row["tooth_height"] > 0
    assert row["gum_height"] > 0
    assert row["tooth_area"] > 0
    assert row["gum_area"] > 0
    assert row["checked_annotation"] is True


def test_w50_evaluation_no_diagnosis() -> None:
    before, after, ann = dental_support("W50")
    support = np.clip(polygon_mask(96, 96, ann.teeth) + polygon_mask(96, 96, ann.gum), 0, 1)
    row = smile_eval.evaluate_w50(before, after, support, ann, 0.45, True)
    assert row.metrics["diagnosis"] is False
    assert row.metrics["checked_annotation"] is True
    assert row.metrics["current_ratio"] >= row.metrics["display_ratio"]


def test_w51_evaluation_no_automatic_segmentation() -> None:
    before, after, ann = dental_support("W51")
    support = polygon_mask(96, 96, ann.teeth)
    row = smile_eval.evaluate_w51(before, after, support, ann, "soft", True)
    assert row.metrics["automatic_segmentation"] is False
    assert row.metrics["clinical_material_outcome"] is False
    assert row.metrics["tooth_sections"] == 8


def test_w52_keep_mode_has_zero_reduction() -> None:
    before, after, ann = dental_support("W52")
    support = polygon_mask(96, 96, ann.teeth)
    row = smile_eval.evaluate_w52(before, after, support, ann, "keep", 0.8, True)
    assert row.metrics["reduction_fraction"] == 0
    assert row.metrics["beauty_score"] is False
    assert row.metrics["orthodontic_outcome"] is False


def test_w53_reports_surgical_context_without_recommendation() -> None:
    before, after, ann = dental_support("W53")
    support = np.clip(polygon_mask(96, 96, ann.teeth) + polygon_mask(96, 96, ann.gum), 0, 1)
    row = smile_eval.evaluate_w53(before, after, support, ann, "soft", 0.4, True)
    assert row.metrics["tooth_sections"] == 8
    assert row.metrics["surgical_context"] is True
    assert row.metrics["treatment_recommendation"] is False


def test_w58_evaluation_accepts_stable_checked_sequence() -> None:
    first = annotation()
    second = SmileAnnotation(
        teeth=tuple((x + 0.002, y) for x, y in first.teeth),
        gum=tuple((x + 0.002, y) for x, y in first.gum),
        midline_x=0.502,
    )
    row = smile_eval.evaluate_w58((first, second), True)
    assert row.metrics["checked_frames"] == 2
    assert row.metrics["automatic_tracking"] is False
    assert row.metrics["evidence_hash"]
    assert row.passed


def test_w58_evaluation_rejects_single_frame() -> None:
    row = smile_eval.evaluate_w58((annotation(),), True)
    assert row.passed is False
    assert any("two" in reason.lower() for reason in row.failures)


def test_skin_base_zero_identity_and_alpha() -> None:
    before = photo()
    support = square()
    metrics = skin_eval._base_metrics(before, before.copy(), before.copy(), support)
    assert metrics["outside_error"] == 0
    assert metrics["alpha_identity"] is True
    assert metrics["zero_identity"] is True
    assert metrics["changed_fraction"] == 0


def test_w77_evaluation_keeps_texture_and_neutral_copy() -> None:
    before = photo()
    rendered = render_skin(before, skin_request("W77", 0.4))
    zero = render_skin(before, skin_request("W77", 0.0))
    row = skin_eval.evaluate_w77(before, rendered.image, zero.image, rendered.coverage)
    assert row.metrics["skin_tone_ranking"] is False
    assert row.metrics["lightening_objective"] is False
    assert float(row.metrics["texture_retention"]) >= 0


def test_w80_evaluation_contains_no_spf_claim() -> None:
    before = photo()
    rendered = render_skin(before, skin_request("W80", 0.8))
    zero = render_skin(before, skin_request("W80", 0.0))
    row = skin_eval.evaluate_w80(before, rendered.image, zero.image, rendered.coverage)
    assert row.metrics["spf_efficacy_claim"] is False
    assert row.metrics["uv_efficacy_claim"] is False
    assert float(row.metrics["visual_cast_after"]) >= 0


def test_w81_evaluation_contains_no_diagnosis() -> None:
    before = photo()
    rendered = render_skin(before, skin_request("W81", 0.6))
    zero = render_skin(before, skin_request("W81", 0.0))
    row = skin_eval.evaluate_w81(before, rendered.image, zero.image, rendered.coverage)
    assert row.metrics["diagnosis"] is False
    assert row.metrics["defect_label"] is False


def test_w82_evaluation_contains_no_treatment_claim() -> None:
    before = photo()
    rendered = render_skin(before, skin_request("W82", 0.6))
    zero = render_skin(before, skin_request("W82", 0.0))
    row = skin_eval.evaluate_w82(before, rendered.image, zero.image, rendered.coverage)
    assert row.metrics["diagnosis"] is False
    assert row.metrics["treatment_claim"] is False


def test_w83_evaluation_requires_consent() -> None:
    row = skin_eval.evaluate_w83(consent=False, samples=(0.2, 0.3), exported_samples=(0.2, 0.3))
    assert row.passed is False
    assert row.metrics["prediction"] is False
    assert row.metrics["fertility_prediction"] is False
    assert row.metrics["local_only"] is True


def test_w83_evaluation_round_trip_passes_with_consent() -> None:
    row = skin_eval.evaluate_w83(consent=True, samples=(0.2, 0.3), exported_samples=(0.2, 0.3))
    assert row.passed
    assert row.metrics["round_trip"] is True
    assert row.metrics["samples"] == 2


def test_w84_evaluation_has_zero_line_blur() -> None:
    before = photo()
    rendered = render_skin(before, skin_request("W84", 0.3))
    zero = render_skin(before, skin_request("W84", 0.0))
    support = rendered.coverage if np.any(rendered.coverage) else square()
    row = skin_eval.evaluate_w84(before, rendered.image, zero.image, support)
    assert row.metrics["line_blur"] == 0
    assert row.metrics["anti_age_claim"] is False
    assert row.metrics["younger_claim"] is False


def test_w89_evaluation_requires_editability() -> None:
    row = skin_eval.evaluate_w89(editable=False, competence_claim=False, zero_identity=True)
    assert row.passed is False
    assert any("editable" in reason for reason in row.failures)
    assert row.metrics["beauty_score"] is False


def test_w89_evaluation_rejects_competence_claim() -> None:
    row = skin_eval.evaluate_w89(editable=True, competence_claim=True, zero_identity=True)
    assert row.passed is False
    assert row.metrics["competence_claim"] is True


def test_w90_evaluation_preserve_mode_is_identity() -> None:
    before = photo()
    preserved, _ = preserve_freckles(before)
    support = square()
    after = before.copy()
    row = skin_eval.evaluate_w90(before, after, preserved, support, seed=17)
    assert row.metrics["preserve_identity"] is True
    assert row.metrics["deterministic"] is True
    assert row.metrics["zero_identity"] is True


def test_w88_evaluation_holds_release_when_cultural_review_pending() -> None:
    before = photo()
    scarf = square(x0=15, y0=15, x1=82, y1=82)
    hair = square(x0=36, y0=12, x1=60, y1=32)
    after = before.copy()
    zero = before.copy()
    row = skin_eval.evaluate_w88(before, after, zero, scarf, hair, cultural_review=False)
    assert row.passed is False
    assert row.metrics["protected_hair_unchanged"] is True
    assert row.metrics["cultural_review"] is False
    assert any("cultural" in reason for reason in row.failures)


def test_w92_evaluation_has_no_age_reversal_claim() -> None:
    before = photo()
    rendered = render_skin(before, skin_request("W92", 0.3))
    zero = render_skin(before, skin_request("W92", 0.0))
    support = rendered.coverage if np.any(rendered.coverage) else square()
    row = skin_eval.evaluate_w92(before, rendered.image, zero.image, support)
    assert row.metrics["wrinkle_removal_claim"] is False
    assert row.metrics["age_reversal_claim"] is False
    assert float(row.metrics["texture_retention"]) >= 0

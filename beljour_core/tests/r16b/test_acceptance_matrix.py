"""R16B acceptance-contract matrix tests. Author: John Khan."""
from __future__ import annotations
import pytest
from plumb_api.arena.r16b_acceptance import (
    CONTRACTS,
    audit_catalogue,
    contract,
    evidence_status,
    evaluate,
    grouped,
    metric_gate,
    prerequisites,
    release_summary,
)

CASES = (
    {
        "feature": "W45",
        "group": "lips",
        "test_id": "W45_TEST_ANATOMICAL_CAP",
        "adult": True,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("locality", "zero_identity", "geometry_cap", "real_face_review"),
    },
    {
        "feature": "W46",
        "group": "lips",
        "test_id": "W46_TEST_EDGE_FOLLOW",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("locality", "edge_alignment", "daylight_review"),
    },
    {
        "feature": "W47",
        "group": "lips",
        "test_id": "W47_TEST_FADE_ORDER",
        "adult": True,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("fade_order", "copy_review", "deep_lip_review"),
    },
    {
        "feature": "W48",
        "group": "lips",
        "test_id": "W48_TEST_UPPER_LIP_BOUND",
        "adult": True,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("geometry_cap", "locality", "copy_review"),
    },
    {
        "feature": "W49",
        "group": "lips",
        "test_id": "W49_TEST_STYLE_NOT_DOSE",
        "adult": True,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("geometry_cap", "copy_review", "real_face_review"),
    },
    {
        "feature": "W50",
        "group": "smile",
        "test_id": "W50_TEST_CHECKED_GUM_ONLY",
        "adult": True,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("annotation_provenance", "locality", "copy_review"),
    },
    {
        "feature": "W51",
        "group": "smile",
        "test_id": "W51_TEST_CHECKED_TEETH_ONLY",
        "adult": True,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("annotation_provenance", "shade_review", "irreversibility_copy"),
    },
    {
        "feature": "W52",
        "group": "smile",
        "test_id": "W52_TEST_KEEP_FIRST_CLASS",
        "adult": True,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("annotation_provenance", "midline_check", "copy_review"),
    },
    {
        "feature": "W53",
        "group": "smile",
        "test_id": "W53_TEST_GUM_GUIDE_DISCLOSURE",
        "adult": True,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("annotation_provenance", "gum_line_check", "copy_review"),
    },
    {
        "feature": "W54",
        "group": "lips",
        "test_id": "W54_TEST_TEETH_UNCHANGED",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("protected_teeth", "locality", "copy_review"),
    },
    {
        "feature": "W55",
        "group": "lips",
        "test_id": "W55_TEST_TEXTURE_RETENTION",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("texture_retention", "alpha_identity", "locality"),
    },
    {
        "feature": "W56",
        "group": "lips",
        "test_id": "W56_TEST_DETERMINISTIC_WEAR",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("determinism", "wear_order", "copy_review"),
    },
    {
        "feature": "W57",
        "group": "lips",
        "test_id": "W57_TEST_PIGMENT_PRESERVATION",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("locality", "pigmentation_review", "copy_review"),
    },
    {
        "feature": "W58",
        "group": "smile",
        "test_id": "W58_TEST_CHECKED_FRAME_STABILITY",
        "adult": True,
        "region": False,
        "sequence": True,
        "health": False,
        "cultural": False,
        "evidence": ("frame_provenance", "temporal_stability", "real_sequence_review"),
    },
    {
        "feature": "W77",
        "group": "skin_more",
        "test_id": "W77_TEST_TEXTURE_FIRST_TINT",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("texture_retention", "zero_identity", "fairness_slice"),
    },
    {
        "feature": "W78",
        "group": "skin_more",
        "test_id": "W78_TEST_DRY_ZONE_BOUND",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("locality", "dry_zone_review", "copy_review"),
    },
    {
        "feature": "W79",
        "group": "skin_more",
        "test_id": "W79_TEST_DELTA_REDUCTION",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("region_delta", "locality", "fairness_slice"),
    },
    {
        "feature": "W80",
        "group": "skin_more",
        "test_id": "W80_TEST_NO_EFFICACY_CLAIM",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("locality", "cast_order", "copy_review"),
    },
    {
        "feature": "W81",
        "group": "skin_more",
        "test_id": "W81_TEST_USER_MARKED_ONLY",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("locality", "corrector_bound", "fairness_slice"),
    },
    {
        "feature": "W82",
        "group": "skin_more",
        "test_id": "W82_TEST_NO_DIAGNOSIS",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("locality", "corrector_bound", "copy_review"),
    },
    {
        "feature": "W83",
        "group": "skin_more",
        "test_id": "W83_TEST_CONSENT_NO_PREDICTION",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": True,
        "cultural": False,
        "evidence": ("consent", "local_storage_review", "copy_review"),
    },
    {
        "feature": "W84",
        "group": "skin_more",
        "test_id": "W84_TEST_ZERO_LINE_BLUR",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("texture_retention", "line_blur_zero", "copy_review"),
    },
    {
        "feature": "W85",
        "group": "skin_more",
        "test_id": "W85_TEST_CHECKED_PLACEMENT",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("placement", "locality", "calibration_copy"),
    },
    {
        "feature": "W86",
        "group": "skin_more",
        "test_id": "W86_TEST_CHECKED_FRAME_FIT",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("placement", "symmetry", "protected_regions"),
    },
    {
        "feature": "W87",
        "group": "skin_more",
        "test_id": "W87_TEST_MANUAL_NAIL_REGION",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("annotation_provenance", "locality", "alpha_identity"),
    },
    {
        "feature": "W88",
        "group": "skin_more",
        "test_id": "W88_TEST_HAIR_PROTECTION",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": True,
        "evidence": ("locality", "hair_protection", "cultural_review"),
    },
    {
        "feature": "W89",
        "group": "skin_more",
        "test_id": "W89_TEST_EDITABLE_BUNDLE",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("editability", "copy_review", "zero_identity"),
    },
    {
        "feature": "W90",
        "group": "skin_more",
        "test_id": "W90_TEST_PRESERVE_FIRST_CLASS",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("preserve_identity", "determinism", "locality"),
    },
    {
        "feature": "W91",
        "group": "skin_more",
        "test_id": "W91_TEST_LIGHTING_CAVEAT",
        "adult": False,
        "region": True,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("region_delta", "locality", "lighting_caveat"),
    },
    {
        "feature": "W92",
        "group": "skin_more",
        "test_id": "W92_TEST_TEXTURE_PRESERVATION",
        "adult": False,
        "region": False,
        "sequence": False,
        "health": False,
        "cultural": False,
        "evidence": ("texture_retention", "copy_review", "fairness_slice"),
    },
)

@pytest.mark.parametrize("case", CASES, ids=lambda row: row["feature"])
def test_contract_matches_binding_acceptance_matrix(case: dict[str, object]) -> None:
    row = contract(str(case["feature"]))
    assert row.group == case["group"]
    assert row.test_id == case["test_id"]
    assert row.requires_adult is case["adult"]
    assert row.requires_checked_region is case["region"]
    assert row.requires_checked_sequence is case["sequence"]
    assert row.requires_health_consent is case["health"]
    assert row.requires_cultural_review is case["cultural"]
    assert row.release_evidence == case["evidence"]
    assert row.pass_definition

@pytest.mark.parametrize("case", CASES, ids=lambda row: row["feature"])
def test_full_prerequisites_pass_except_pending_cultural_release(case: dict[str, object]) -> None:
    ok, reasons = prerequisites(
        str(case["feature"]),
        adult_confirmed=True,
        checked_regions=2,
        checked_frames=3,
        health_consent=True,
        cultural_review=True,
    )
    assert ok
    assert reasons == ()

@pytest.mark.parametrize("case", CASES, ids=lambda row: row["feature"])
def test_each_required_prerequisite_fails_closed(case: dict[str, object]) -> None:
    feature = str(case["feature"])
    kwargs = {
        "adult_confirmed": True,
        "checked_regions": 2,
        "checked_frames": 3,
        "health_consent": True,
        "cultural_review": True,
    }
    expectations = (
        ("adult", "adult_confirmed", False, "18+"),
        ("region", "checked_regions", 0, "region"),
        ("sequence", "checked_frames", 1, "frames"),
        ("health", "health_consent", False, "consent"),
        ("cultural", "cultural_review", False, "cultural"),
    )
    for flag, field, value, fragment in expectations:
        if case[flag] is True:
            changed = dict(kwargs)
            changed[field] = value
            ok, reasons = prerequisites(feature, **changed)
            assert not ok
            assert any(fragment.lower() in reason.lower() for reason in reasons)

@pytest.mark.parametrize("case", CASES, ids=lambda row: row["feature"])
def test_release_evidence_is_exact_and_missing_item_is_reported(case: dict[str, object]) -> None:
    feature = str(case["feature"])
    evidence = tuple(case["evidence"])
    ok, missing = evidence_status(feature, evidence)
    assert ok
    assert missing == ()
    shortened = evidence[:-1]
    ok, missing = evidence_status(feature, shortened)
    assert not ok
    assert missing == (evidence[-1],)

def test_catalogue_has_exact_r16b_scope() -> None:
    audit = audit_catalogue()
    assert audit["rows"] == 30
    assert audit["unique_features"] is True
    assert audit["unique_test_ids"] is True
    assert audit["groups"] == {"lips": 9, "smile": 5, "skin_more": 16}
    assert audit["adult_rows"] == 9
    assert audit["checked_region_rows"] == 14
    assert audit["checked_sequence_rows"] == 1
    assert audit["health_consent_rows"] == 1
    assert audit["cultural_review_rows"] == 1

def test_grouped_catalogue_preserves_all_features_once() -> None:
    groups = grouped()
    observed = [row.feature for rows in groups.values() for row in rows]
    expected = [row.feature for row in CONTRACTS]
    assert sorted(observed) == sorted(expected)
    assert len(observed) == len(set(observed))

def good_metrics(feature: str) -> dict[str, object]:
    metrics: dict[str, object] = {
        "outside_error": 0.0,
        "alpha_identity": True,
        "zero_identity": True,
    }
    if feature in {"W55", "W77", "W84", "W92"}:
        metrics["texture_retention"] = 0.95
    if feature == "W54":
        metrics["protected_teeth_unchanged"] = True
    if feature in {"W56", "W90"}:
        metrics["deterministic"] = True
    if feature == "W58":
        metrics["checked_frames"] = 3
        metrics["automatic_tracking"] = False
    if feature == "W83":
        metrics["prediction"] = False
    if feature == "W88":
        metrics["protected_hair_unchanged"] = True
    return metrics

@pytest.mark.parametrize("case", CASES, ids=lambda row: row["feature"])
def test_metric_gate_passes_complete_synthetic_evidence(case: dict[str, object]) -> None:
    feature = str(case["feature"])
    ok, reasons = metric_gate(feature, good_metrics(feature))
    assert ok, reasons
    assert reasons == ()

@pytest.mark.parametrize("case", CASES, ids=lambda row: row["feature"])
def test_missing_common_metric_never_silently_passes(case: dict[str, object]) -> None:
    feature = str(case["feature"])
    metrics = good_metrics(feature)
    metrics.pop("outside_error")
    ok, reasons = metric_gate(feature, metrics)
    assert not ok
    assert "outside_error metric missing" in reasons

@pytest.mark.parametrize("case", CASES, ids=lambda row: row["feature"])
def test_not_tested_is_distinct_from_failed(case: dict[str, object]) -> None:
    feature = str(case["feature"])
    result = evaluate(
        feature,
        good_metrics(feature),
        tested=False,
        adult_confirmed=True,
        checked_regions=2,
        checked_frames=3,
        health_consent=True,
        cultural_review=True,
    )
    assert result.status == "not_tested"
    assert result.passed is False
    assert "real-face evidence not supplied" in result.reasons

@pytest.mark.parametrize("case", CASES, ids=lambda row: row["feature"])
def test_complete_metrics_and_prerequisites_pass_acceptance_layer(case: dict[str, object]) -> None:
    feature = str(case["feature"])
    result = evaluate(
        feature,
        good_metrics(feature),
        tested=True,
        adult_confirmed=True,
        checked_regions=2,
        checked_frames=3,
        health_consent=True,
        cultural_review=True,
    )
    assert result.status == "passed"
    assert result.passed is True
    assert result.reasons == ()

def test_texture_gates_have_feature_specific_floors() -> None:
    for feature, floor in (("W55", 0.45), ("W77", 0.72), ("W84", 0.78), ("W92", 0.78)):
        metrics = good_metrics(feature)
        metrics["texture_retention"] = floor - 0.01
        ok, reasons = metric_gate(feature, metrics)
        assert not ok
        assert any("texture_retention below" in reason for reason in reasons)
        metrics["texture_retention"] = floor
        ok, reasons = metric_gate(feature, metrics)
        assert ok, reasons

def test_release_summary_refuses_partial_result_set() -> None:
    one = evaluate("W46", good_metrics("W46"), tested=True)
    summary = release_summary([one])
    assert summary["complete"] is False
    assert summary["release_ready"] is False
    assert len(summary["missing_features"]) == 29

def test_release_summary_refuses_not_tested_rows() -> None:
    rows = []
    for case in CASES:
        feature = str(case["feature"])
        rows.append(evaluate(feature, good_metrics(feature), tested=False))
    summary = release_summary(rows)
    assert summary["complete"] is True
    assert summary["counts"]["not_tested"] == 30
    assert summary["release_ready"] is False

def test_release_summary_can_be_ready_only_with_all_passed_rows() -> None:
    rows = []
    for case in CASES:
        feature = str(case["feature"])
        rows.append(
            evaluate(
                feature,
                good_metrics(feature),
                tested=True,
                adult_confirmed=True,
                checked_regions=2,
                checked_frames=3,
                health_consent=True,
                cultural_review=True,
            )
        )
    summary = release_summary(rows)
    assert summary["complete"] is True
    assert summary["counts"] == {"passed": 30, "failed": 0, "not_tested": 0}
    assert summary["release_ready"] is True

def test_unknown_contract_fails_closed() -> None:
    with pytest.raises(ValueError, match="unsupported"):
        contract("W999")

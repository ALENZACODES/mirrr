"""R18B privacy-safe report validation, coverage, and hashing contracts. Author: John Khan."""
from __future__ import annotations

import json

import pytest

from plumb_api.engines.gender_look import realface_report as gender
from plumb_api.engines.hair_women import realface_report as hair
from plumb_api.engines.hair_women.realface import registry_feature_ids as hair_ids
from plumb_api.engines.lips import realface_report as lips
from plumb_api.engines.lips.realface import registry_feature_ids as lip_ids
from plumb_api.engines.makeup_w import realface_report as makeup
from plumb_api.engines.makeup_w.realface import registry_feature_ids as makeup_ids
from plumb_api.engines.skin_more import realface_report as skin
from plumb_api.engines.skin_more.realface import registry_feature_ids as skin_ids
from plumb_api.engines.smile import realface_report as smile
from plumb_api.engines.smile.realface import registry_feature_ids as smile_ids


SHA = "1" * 64
DEFINITION = "2" * 64


def test_hair_report_hash_is_deterministic_and_contains_no_image_payload() -> None:
    feature = hair_ids()[0]
    row = hair.ReportRow("h", feature, DEFINITION, SHA, "passed", "curly", "deep", (("outside_change_fraction", 0.0),), ())
    report = hair.HairReport("hair", (row,))
    first = report.canonical()
    second = report.canonical()
    assert first == second
    assert len(report.sha256) == 64
    assert "pixels" not in first.lower()
    assert "landmarks" not in first.lower()
    assert json.loads(first)["rows"][0]["hair_slice"] == "curly"


def test_hair_not_tested_requires_missing_reason() -> None:
    feature = hair_ids()[0]
    with pytest.raises(ValueError, match="missing evidence"):
        hair.ReportRow("h", feature, DEFINITION, SHA, "not_tested", "curly", "deep", (), ()).validate()
    row = hair.ReportRow("h", feature, DEFINITION, SHA, "not_tested", "curly", "deep", (), ("hair mask",))
    row.validate()


def test_hair_tested_row_cannot_retain_missing_reason() -> None:
    feature = hair_ids()[0]
    with pytest.raises(ValueError, match="cannot retain"):
        hair.ReportRow("h", feature, DEFINITION, SHA, "passed", "curly", "deep", (), ("mask",)).validate()


def test_hair_coverage_tracks_feature_and_slice_counts_separately() -> None:
    features = hair_ids()[:2]
    report = hair.HairReport(
        "hair",
        (
            hair.ReportRow("a", features[0], DEFINITION, SHA, "passed", "curly", "deep", (), ()),
            hair.ReportRow("b", features[1], DEFINITION, SHA, "failed", "straight", "light", (), ()),
            hair.ReportRow("c", features[1], DEFINITION, SHA, "not_tested", "straight", "light", (), ("mask",)),
        ),
    )
    summary = hair.coverage(report)
    assert summary["per_feature"][features[0]]["passed"] == 1
    assert summary["per_feature"][features[1]]["failed"] == 1
    assert summary["per_feature"][features[1]]["not_tested"] == 1
    assert summary["per_slice"]["hair=straight|tone=light"]["total"] == 2
    assert hair.minimum_slice_count(report) == 1


def test_makeup_report_hash_binds_depth_and_undertone() -> None:
    feature = makeup_ids()[0]
    deep = makeup.MakeupReport("m", (makeup.ReportRow("a", feature, "passed", "deep", "olive", DEFINITION, SHA, (), ()),))
    light = makeup.MakeupReport("m", (makeup.ReportRow("a", feature, "passed", "light", "olive", DEFINITION, SHA, (), ()),))
    assert deep.sha256 != light.sha256
    assert makeup.definition_set_sha256() == makeup.definition_set_sha256()


def test_makeup_coverage_separates_fairness_slices_and_feature_status() -> None:
    features = makeup_ids()[:2]
    report = makeup.MakeupReport(
        "m",
        (
            makeup.ReportRow("a", features[0], "passed", "deep", "olive", DEFINITION, SHA, (), ()),
            makeup.ReportRow("b", features[0], "failed", "light", "cool", DEFINITION, SHA, (), ()),
            makeup.ReportRow("c", features[1], "passed", "deep", "olive", DEFINITION, SHA, (), ()),
        ),
    )
    summary = makeup.coverage(report)
    assert summary["deep_cases"] == 2
    assert summary["olive_cases"] == 2
    assert summary["depth_pass_rates"]["deep"] == pytest.approx(1.0)
    assert summary["depth_pass_rates"]["light"] == pytest.approx(0.0)
    assert makeup.pass_rate_spread(summary["depth_pass_rates"]) == pytest.approx(1.0)


def test_makeup_report_rejects_duplicate_case_feature() -> None:
    feature = makeup_ids()[0]
    row = makeup.ReportRow("a", feature, "passed", "deep", "olive", DEFINITION, SHA, (), ())
    with pytest.raises(ValueError, match="duplicate"):
        makeup.MakeupReport("m", (row, row)).validate()


def test_lip_coverage_has_explicit_w54_and_w57_buckets() -> None:
    report = lips.LipReport(
        "l",
        (
            lips.ReportRow("w54", "W54", "passed", DEFINITION, SHA, (), ()),
            lips.ReportRow("w57", "W57", "failed", DEFINITION, SHA, (), ()),
        ),
    )
    summary = lips.coverage(report)
    assert summary["teeth_protection_w54"]["passed"] == 1
    assert summary["pigmentation_w57"]["failed"] == 1
    assert summary["complete"] is False


def test_lip_report_canonical_has_registry_features_but_no_raw_images() -> None:
    feature = lip_ids()[0]
    report = lips.LipReport("l", (lips.ReportRow("a", feature, "passed", DEFINITION, SHA, (("texture_ratio", 1.0),), ()),))
    payload = json.loads(report.canonical())
    assert tuple(payload["registry_features"]) == lip_ids()
    assert "image" not in report.canonical().lower()


def test_smile_coverage_distinguishes_motion_from_dental_rows() -> None:
    report = smile.SmileReport(
        "s",
        (
            smile.ReportRow("motion", "W58", "passed", DEFINITION, SHA, (), ()),
            smile.ReportRow("dental", "W50", "passed", DEFINITION, SHA, (), ()),
            smile.ReportRow("failed", "W51", "failed", DEFINITION, SHA, (), ()),
        ),
    )
    summary = smile.coverage(report)
    assert summary["motion_w58"]["tested"] == 1
    assert summary["dental_w50_w53"]["tested"] == 2
    assert summary["dental_w50_w53"]["failed"] == 1


def test_smile_report_rejects_unknown_feature_and_invalid_hash() -> None:
    with pytest.raises(ValueError, match="unknown"):
        smile.ReportRow("x", "W999", "passed", DEFINITION, SHA, (), ()).validate()
    with pytest.raises(ValueError, match="sha256"):
        smile.ReportRow("x", smile_ids()[0], "passed", "bad", SHA, (), ()).validate()


def test_skin_coverage_tracks_depth_and_special_features() -> None:
    report = skin.SkinReport(
        "k",
        (
            skin.ReportRow("freckle", "W90", "passed", "deep", DEFINITION, SHA, (), ()),
            skin.ReportRow("continuity", "W91", "passed", "deep", DEFINITION, SHA, (), ()),
            skin.ReportRow("other", skin_ids()[0], "failed", "light", DEFINITION, SHA, (), ()),
        ),
    )
    summary = skin.coverage(report)
    assert summary["freckle_w90"]["tested"] == 1
    assert summary["continuity_w91"]["passed"] == 1
    assert summary["per_depth"]["deep"]["tested"] == 2
    assert summary["per_depth"]["light"]["failed"] == 1


def test_skin_report_hash_changes_with_depth_slice() -> None:
    feature = skin_ids()[0]
    deep = skin.SkinReport("k", (skin.ReportRow("a", feature, "passed", "deep", DEFINITION, SHA, (), ()),))
    light = skin.SkinReport("k", (skin.ReportRow("a", feature, "passed", "light", DEFINITION, SHA, (), ()),))
    assert deep.sha256 != light.sha256


def test_gender_coverage_tracks_level_direction_and_cheek_max() -> None:
    report = gender.GenderReport(
        "g",
        (
            gender.ReportRow("a", "normal", "feminine", "passed", DEFINITION, SHA, (("cheek_delta_e_proxy", 2.0),), ()),
            gender.ReportRow("b", "extra", "masculine", "failed", DEFINITION, SHA, (("cheek_delta_e_proxy", 4.2),), ()),
            gender.ReportRow("c", "hyper", "masculine", "not_tested", DEFINITION, SHA, (), ("mask",)),
        ),
    )
    summary = gender.coverage(report)
    assert summary["per_level"]["normal"]["passed"] == 1
    assert summary["per_level"]["extra"]["failed"] == 1
    assert summary["per_level"]["hyper"]["not_tested"] == 1
    assert summary["max_cheek_delta_e_proxy"] == pytest.approx(4.2)
    assert summary["direction_pass_rates"]["feminine"] == pytest.approx(1.0)
    assert summary["direction_pass_rates"]["masculine"] == pytest.approx(0.0)


def test_gender_report_rejects_bad_direction_level_and_duplicate() -> None:
    valid = gender.ReportRow("a", "normal", "feminine", "passed", DEFINITION, SHA, (), ())
    with pytest.raises(ValueError, match="direction"):
        gender.ReportRow("a", "normal", "sideways", "passed", DEFINITION, SHA, (), ()).validate()
    with pytest.raises(ValueError, match="level"):
        gender.ReportRow("a", "extreme", "feminine", "passed", DEFINITION, SHA, (), ()).validate()
    with pytest.raises(ValueError, match="duplicate"):
        gender.GenderReport("g", (valid, valid)).validate()


@pytest.mark.parametrize(
    "report",
    (
        hair.HairReport("", ()),
        makeup.MakeupReport("", ()),
        lips.LipReport("", ()),
        smile.SmileReport("", ()),
        skin.SkinReport("", ()),
        gender.GenderReport("", ()),
    ),
)
def test_every_report_requires_dataset_identity(report: object) -> None:
    with pytest.raises(ValueError, match="identity"):
        report.validate()

"""R18B end-to-end privacy-safe evidence/report tests. Author: John Khan."""
from __future__ import annotations

from dataclasses import replace

from plumb_api.engines.gender_look.realface import evaluate as evaluate_gender
from plumb_api.engines.gender_look.realface_report import GenderReport
from plumb_api.engines.gender_look.realface_report import coverage as gender_coverage
from plumb_api.engines.gender_look.realface_report import row_from as gender_row
from plumb_api.engines.hair_women.realface import evaluate as evaluate_hair
from plumb_api.engines.hair_women.realface_report import HairReport
from plumb_api.engines.hair_women.realface_report import coverage as hair_coverage
from plumb_api.engines.hair_women.realface_report import row_from as hair_row
from plumb_api.engines.lips.realface import evaluate as evaluate_lips
from plumb_api.engines.lips.realface_report import LipReport
from plumb_api.engines.lips.realface_report import coverage as lip_coverage
from plumb_api.engines.lips.realface_report import row_from as lip_row
from plumb_api.engines.makeup_w.realface import evaluate as evaluate_makeup
from plumb_api.engines.makeup_w.realface_report import MakeupReport
from plumb_api.engines.makeup_w.realface_report import coverage as makeup_coverage
from plumb_api.engines.makeup_w.realface_report import row_from as makeup_row
from plumb_api.engines.skin_more.realface import evaluate as evaluate_skin
from plumb_api.engines.skin_more.realface_report import SkinReport
from plumb_api.engines.skin_more.realface_report import coverage as skin_coverage
from plumb_api.engines.skin_more.realface_report import row_from as skin_row
from plumb_api.engines.smile.realface import evaluate as evaluate_smile
from plumb_api.engines.smile.realface_report import SmileReport
from plumb_api.engines.smile.realface_report import coverage as smile_coverage
from plumb_api.engines.smile.realface_report import row_from as smile_row
from tests.r18b import test_realface_measurements_deep as fixtures


def assert_privacy_safe(text: str) -> None:
    lowered = text.lower()
    for forbidden in (
        "data:image",
        "array(",
        "uint8",
        "float64",
        "landmark",
        "filename",
        "email",
        "account_id",
    ):
        assert forbidden not in lowered


def test_hair_case_flows_to_deterministic_privacy_safe_report() -> None:
    case = fixtures.hair_case("W26")
    record = evaluate_hair(case)
    report = HairReport("hair-local-authorized", (hair_row(case, record),))
    canonical = report.canonical()
    assert report.sha256 == report.sha256
    assert case.case_id in canonical
    assert case.feature_id in canonical
    assert record.input_sha256 in canonical
    assert_privacy_safe(canonical)
    summary = hair_coverage(report)
    assert summary["registry_feature_count"] >= 1
    assert summary["covered_features"] == 1


def test_hair_not_tested_evidence_remains_visible_in_report() -> None:
    case = fixtures.hair_case("W26")
    record = evaluate_hair(case, available_evidence=("before", "after"))
    report = HairReport("hair-local-authorized", (hair_row(case, record),))
    canonical = report.canonical()
    assert record.status == "not_tested"
    assert "hair_mask" in canonical
    assert hair_coverage(report)["complete"] is False


def test_hair_report_hash_changes_when_input_pixels_change() -> None:
    case = fixtures.hair_case("W26")
    first = HairReport("set", (hair_row(case, evaluate_hair(case)),))
    after = case.after.copy()
    after[10, 10, 0] += 1
    changed = replace(case, after=after)
    second = HairReport("set", (hair_row(changed, evaluate_hair(changed)),))
    assert first.sha256 != second.sha256


def test_makeup_case_flows_to_depth_and_undertone_report() -> None:
    case = fixtures.makeup_case("W1")
    record = evaluate_makeup(case)
    report = MakeupReport("makeup-local-authorized", (makeup_row(case, record),))
    summary = makeup_coverage(report)
    assert summary["registry_feature_count"] >= 1
    assert summary["deep_cases"] == 1
    assert summary["olive_cases"] == 1
    assert_privacy_safe(report.canonical())


def test_makeup_w13_missing_reference_is_preserved_as_not_tested() -> None:
    case = fixtures.makeup_case("W13")
    record = evaluate_makeup(case)
    report = MakeupReport("makeup-local-authorized", (makeup_row(case, record),))
    assert record.status == "not_tested"
    assert "checked_reference_regions" in report.canonical()
    summary = makeup_coverage(report)
    assert summary["per_feature"]["W13"]["not_tested"] == 1


def test_makeup_checked_reference_produces_tested_record() -> None:
    case = fixtures.makeup_case("W13")
    record = evaluate_makeup(
        case,
        available_evidence=("before", "after", "skin_mask", "effect_mask", "checked_reference_regions"),
    )
    report = MakeupReport("makeup-local-authorized", (makeup_row(case, record),))
    assert record.status in {"passed", "failed"}
    assert "checked_reference_regions" not in report.canonical()


def test_makeup_report_hash_changes_with_reference_colour() -> None:
    case = fixtures.makeup_case("W1")
    left = MakeupReport("set", (makeup_row(case, evaluate_makeup(case)),))
    changed = replace(case, reference_rgb=(10, 20, 30))
    right = MakeupReport("set", (makeup_row(changed, evaluate_makeup(changed)),))
    assert left.sha256 != right.sha256


def test_lip_case_flows_to_report_without_media_payload() -> None:
    case = fixtures.lip_case("W54")
    record = evaluate_lips(case, available_evidence=("before", "after", "lip_mask", "teeth_mask"))
    report = LipReport("lip-local-authorized", (lip_row(case, record),))
    summary = lip_coverage(report)
    assert summary["registry_feature_count"] >= 1
    assert summary["per_feature"]["W54"]["tested"] == 1
    assert_privacy_safe(report.canonical())


def test_lip_missing_teeth_mask_evidence_is_explicit() -> None:
    case = fixtures.lip_case("W54")
    record = evaluate_lips(case, available_evidence=("before", "after", "lip_mask"))
    report = LipReport("lip-local-authorized", (lip_row(case, record),))
    assert record.status == "not_tested"
    assert "teeth_mask" in report.canonical()


def test_lip_w57_pigmentation_evidence_is_explicit() -> None:
    case = fixtures.lip_case("W57")
    missing = evaluate_lips(case, available_evidence=("before", "after", "lip_mask"))
    tested = evaluate_lips(
        case,
        available_evidence=("before", "after", "lip_mask", "pigmentation_mask"),
    )
    assert missing.status == "not_tested"
    assert tested.status in {"passed", "failed"}
    assert missing.input_sha256 == tested.input_sha256


def test_smile_motion_frames_now_bind_report_hash() -> None:
    case = fixtures.smile_case("W58")
    available = ("before", "after", "mouth_mask", "tooth_mask", "motion_frames")
    first_record = evaluate_smile(case, available_evidence=available)
    first = SmileReport("smile-set", (smile_row(case, first_record),))
    frames = list(case.motion_frames)
    frames[1] = frames[1].copy()
    frames[1][22, 15, 0] += 2
    changed = replace(case, motion_frames=tuple(frames))
    second_record = evaluate_smile(changed, available_evidence=available)
    second = SmileReport("smile-set", (smile_row(changed, second_record),))
    assert first_record.input_sha256 != second_record.input_sha256
    assert first.sha256 != second.sha256


def test_smile_report_carries_no_motion_frame_bytes() -> None:
    case = fixtures.smile_case("W58")
    record = evaluate_smile(
        case,
        available_evidence=("before", "after", "mouth_mask", "tooth_mask", "motion_frames"),
    )
    report = SmileReport("smile-local-authorized", (smile_row(case, record),))
    canonical = report.canonical()
    assert "motion_frames" not in canonical
    assert_privacy_safe(canonical)


def test_smile_missing_motion_evidence_stays_not_tested() -> None:
    case = fixtures.smile_case("W58")
    record = evaluate_smile(case)
    report = SmileReport("smile-local-authorized", (smile_row(case, record),))
    assert record.status == "not_tested"
    assert "motion_frames" in record.missing
    assert smile_coverage(report)["complete"] is False


def test_skin_case_flows_to_depth_report() -> None:
    case = fixtures.skin_case("W77")
    record = evaluate_skin(case)
    report = SkinReport("skin-local-authorized", (skin_row(case, record),))
    summary = skin_coverage(report)
    assert summary["registry_feature_count"] >= 1
    assert summary["per_depth"]["deep"]["tested"] == 1
    assert_privacy_safe(report.canonical())


def test_skin_report_hash_binds_depth_slice() -> None:
    case = fixtures.skin_case("W77")
    first = SkinReport("skin-set", (skin_row(case, evaluate_skin(case)),))
    changed = replace(case, depth_slice="medium")
    second = SkinReport("skin-set", (skin_row(changed, evaluate_skin(changed)),))
    assert first.sha256 != second.sha256


def test_skin_missing_face_evidence_is_explicit_in_report() -> None:
    case = fixtures.skin_case("W77")
    record = evaluate_skin(case, available_evidence=("before", "after", "effect_mask"))
    report = SkinReport("skin-local-authorized", (skin_row(case, record),))
    assert record.status == "not_tested"
    assert "face_mask" in report.canonical()


def test_gender_case_flows_to_level_and_direction_report() -> None:
    case = fixtures.gender_case(level="normal", direction="masculine")
    record = evaluate_gender(case)
    report = GenderReport("gender-local-authorized", (gender_row(case, record),))
    summary = gender_coverage(report)
    assert summary["per_level"]["normal"]["tested"] == 1
    assert "masculine" in summary["direction_pass_rates"]
    assert_privacy_safe(report.canonical())


def test_gender_report_hash_binds_direction_metadata() -> None:
    masculine = fixtures.gender_case(direction="masculine")
    feminine = fixtures.gender_case(direction="feminine")
    left = GenderReport("set", (gender_row(masculine, evaluate_gender(masculine)),))
    right = GenderReport("set", (gender_row(feminine, evaluate_gender(feminine)),))
    assert left.sha256 != right.sha256


def test_gender_report_hash_binds_level_metadata() -> None:
    normal = fixtures.gender_case(level="normal")
    hyper = fixtures.gender_case(level="hyper")
    left = GenderReport("set", (gender_row(normal, evaluate_gender(normal)),))
    right = GenderReport("set", (gender_row(hyper, evaluate_gender(hyper)),))
    assert left.sha256 != right.sha256


def test_gender_missing_pin_evidence_is_never_silently_tested() -> None:
    case = fixtures.gender_case()
    record = evaluate_gender(case, available_evidence=("before", "after", "face_mask", "cheek_mask"))
    report = GenderReport("set", (gender_row(case, record),))
    assert record.status == "not_tested"
    assert "identity_pin_mask" in report.canonical()


def test_all_report_hashes_are_lowercase_sha256() -> None:
    hair_case = fixtures.hair_case("W26")
    makeup_case = fixtures.makeup_case("W1")
    lip_case = fixtures.lip_case("W54")
    smile_case = fixtures.smile_case("W50")
    skin_case = fixtures.skin_case("W77")
    gender_case = fixtures.gender_case()
    reports = (
        HairReport("h", (hair_row(hair_case, evaluate_hair(hair_case)),)),
        MakeupReport("m", (makeup_row(makeup_case, evaluate_makeup(makeup_case)),)),
        LipReport(
            "l",
            (
                lip_row(
                    lip_case,
                    evaluate_lips(lip_case, available_evidence=("before", "after", "lip_mask", "teeth_mask")),
                ),
            ),
        ),
        SmileReport("s", (smile_row(smile_case, evaluate_smile(smile_case)),)),
        SkinReport("k", (skin_row(skin_case, evaluate_skin(skin_case)),)),
        GenderReport("g", (gender_row(gender_case, evaluate_gender(gender_case)),)),
    )
    for report in reports:
        digest = report.sha256
        assert len(digest) == 64
        assert all(char in "0123456789abcdef" for char in digest)


def test_dataset_id_is_part_of_report_identity() -> None:
    case = fixtures.hair_case("W26")
    row = hair_row(case, evaluate_hair(case))
    left = HairReport("dataset-a", (row,))
    right = HairReport("dataset-b", (row,))
    assert left.sha256 != right.sha256


def test_report_canonicalization_is_deterministic() -> None:
    case = fixtures.skin_case("W77")
    row = skin_row(case, evaluate_skin(case))
    report = SkinReport("dataset", (row,))
    assert report.canonical() == report.canonical()
    assert report.sha256 == report.sha256


def test_report_rows_keep_metrics_sorted_for_deterministic_serialization() -> None:
    case = fixtures.hair_case("W26")
    row = hair_row(case, evaluate_hair(case))
    names = tuple(name for name, _ in row.metrics)
    assert names == tuple(sorted(names))


def test_report_rows_keep_missing_evidence_as_tuple() -> None:
    case = fixtures.makeup_case("W13")
    row = makeup_row(case, evaluate_makeup(case))
    assert isinstance(row.missing, tuple)
    assert row.missing == ("checked_reference_regions",)


def test_report_author_is_fixed_to_john_khan() -> None:
    case = fixtures.skin_case("W77")
    report = SkinReport("dataset", (skin_row(case, evaluate_skin(case)),))
    assert report.author == "John Khan"


def test_report_rejects_duplicate_case_feature_rows() -> None:
    case = fixtures.hair_case("W26")
    row = hair_row(case, evaluate_hair(case))
    report = HairReport("dataset", (row, row))
    try:
        report.validate()
    except ValueError as exc:
        assert "duplicate" in str(exc)
    else:
        raise AssertionError("duplicate evidence rows must be rejected")


def test_evidence_report_canonical_text_has_no_network_location() -> None:
    case = fixtures.gender_case()
    report = GenderReport("dataset", (gender_row(case, evaluate_gender(case)),))
    text = report.canonical().lower()
    assert "http://" not in text
    assert "https://" not in text
    assert "localhost" not in text


def test_each_domain_report_binds_dataset_identifier() -> None:
    hair_case = fixtures.hair_case("W26")
    makeup_case = fixtures.makeup_case("W1")
    skin_case = fixtures.skin_case("W77")
    reports_a = (
        HairReport("a", (hair_row(hair_case, evaluate_hair(hair_case)),)),
        MakeupReport("a", (makeup_row(makeup_case, evaluate_makeup(makeup_case)),)),
        SkinReport("a", (skin_row(skin_case, evaluate_skin(skin_case)),)),
    )
    reports_b = (
        HairReport("b", (hair_row(hair_case, evaluate_hair(hair_case)),)),
        MakeupReport("b", (makeup_row(makeup_case, evaluate_makeup(makeup_case)),)),
        SkinReport("b", (skin_row(skin_case, evaluate_skin(skin_case)),)),
    )
    for left, right in zip(reports_a, reports_b, strict=True):
        assert left.sha256 != right.sha256


def test_not_tested_rows_do_not_invent_metric_values() -> None:
    hair_case = fixtures.hair_case("W26")
    hair_record = evaluate_hair(hair_case, available_evidence=("before", "after"))
    makeup_case = fixtures.makeup_case("W13")
    makeup_record = evaluate_makeup(makeup_case)
    gender_case = fixtures.gender_case()
    gender_record = evaluate_gender(
        gender_case,
        available_evidence=("before", "after", "face_mask", "cheek_mask"),
    )
    for record in (hair_record, makeup_record, gender_record):
        assert record.status == "not_tested"
        assert record.metrics == {}
        assert record.missing

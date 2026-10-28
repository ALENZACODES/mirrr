"""R18B release-quality matrix tests across all Lane B evidence families. Author: John Khan."""
from __future__ import annotations

import pytest

from plumb_api.engines.gender_look import quality_matrix as gender_quality
from plumb_api.engines.gender_look import realface_report as gender_report
from plumb_api.engines.hair_women import quality_matrix as hair_quality
from plumb_api.engines.hair_women import realface_report as hair_report
from plumb_api.engines.hair_women.realface import registry_feature_ids as hair_ids
from plumb_api.engines.lips import quality_matrix as lip_quality
from plumb_api.engines.lips import realface_report as lip_report
from plumb_api.engines.lips.realface import registry_feature_ids as lip_ids
from plumb_api.engines.makeup_w import quality_matrix as makeup_quality
from plumb_api.engines.makeup_w import realface_report as makeup_report
from plumb_api.engines.makeup_w.realface import registry_feature_ids as makeup_ids
from plumb_api.engines.skin_more import quality_matrix as skin_quality
from plumb_api.engines.skin_more import realface_report as skin_report
from plumb_api.engines.skin_more.realface import registry_feature_ids as skin_ids
from plumb_api.engines.smile import quality_matrix as smile_quality
from plumb_api.engines.smile import realface_report as smile_report
from plumb_api.engines.smile.realface import registry_feature_ids as smile_ids


DIGEST = "a" * 64
DEFINITION = "b" * 64


def _hair_report(status: str = "passed") -> hair_report.HairReport:
    rows = tuple(
        hair_report.ReportRow(
            f"hair-{feature}",
            feature,
            DEFINITION,
            DIGEST,
            status,
            ("straight", "wavy", "curly")[index % 3],
            ("light", "medium", "deep")[index % 3],
            (),
            () if status != "not_tested" else ("checked mask",),
        )
        for index, feature in enumerate(hair_ids())
    )
    return hair_report.HairReport("hair-quality", rows)


def _makeup_report(status: str = "passed") -> makeup_report.MakeupReport:
    features = makeup_ids()
    rows = []
    for index, feature in enumerate(features):
        depth = "deep" if index % 2 == 0 else "light"
        undertone = "olive" if index % 2 == 0 else "cool"
        rows.append(
            makeup_report.ReportRow(
                f"makeup-{feature}",
                feature,
                status,
                depth,
                undertone,
                DEFINITION,
                DIGEST,
                (),
                () if status != "not_tested" else ("checked face mask",),
            )
        )
    return makeup_report.MakeupReport("makeup-quality", tuple(rows))


def _lip_report(status: str = "passed") -> lip_report.LipReport:
    rows = tuple(
        lip_report.ReportRow(
            f"lip-{feature}",
            feature,
            status,
            DEFINITION,
            DIGEST,
            (),
            () if status != "not_tested" else ("checked lip mask",),
        )
        for feature in lip_ids()
    )
    return lip_report.LipReport("lip-quality", rows)


def _smile_report(status: str = "passed") -> smile_report.SmileReport:
    rows = tuple(
        smile_report.ReportRow(
            f"smile-{feature}",
            feature,
            status,
            DEFINITION,
            DIGEST,
            (),
            () if status != "not_tested" else ("checked dental annotation",),
        )
        for feature in smile_ids()
    )
    return smile_report.SmileReport("smile-quality", rows)


def _skin_report(status: str = "passed") -> skin_report.SkinReport:
    rows = tuple(
        skin_report.ReportRow(
            f"skin-{feature}",
            feature,
            status,
            ("light", "medium", "deep", "very-deep")[index % 4],
            DEFINITION,
            DIGEST,
            (),
            () if status != "not_tested" else ("checked skin region",),
        )
        for index, feature in enumerate(skin_ids())
    )
    return skin_report.SkinReport("skin-quality", rows)


def _gender_report(status: str = "passed", cheek: float = 2.0) -> gender_report.GenderReport:
    rows = []
    for level in ("normal", "extra", "hyper"):
        for direction in ("feminine", "masculine"):
            rows.append(
                gender_report.ReportRow(
                    f"gender-{level}-{direction}",
                    level,
                    direction,
                    status,
                    DEFINITION,
                    DIGEST,
                    (("cheek_delta_e_proxy", cheek),),
                    () if status != "not_tested" else ("checked cheek region",),
                )
            )
    return gender_report.GenderReport("gender-quality", tuple(rows))


def test_hair_complete_report_is_release_candidate() -> None:
    report = _hair_report()
    gates = hair_quality.feature_gates(report)
    assert len(gates) == len(hair_ids())
    assert all(gate.ready for gate in gates)
    assert hair_quality.missing_features(report) == ()
    assert hair_quality.release_candidate(report)
    assert set(hair_quality.definition_metric_matrix()) == set(hair_ids())


def test_hair_not_tested_rows_never_become_release_ready() -> None:
    report = _hair_report("not_tested")
    assert not hair_quality.release_candidate(report)
    assert set(hair_quality.missing_features(report)) == set(hair_ids())


def test_hair_minimum_cases_is_enforced() -> None:
    report = _hair_report()
    assert not hair_quality.release_candidate(report, minimum_cases=2)
    with pytest.raises(ValueError, match="positive"):
        hair_quality.feature_gates(report, minimum_cases=0)
    with pytest.raises(ValueError, match="positive"):
        hair_quality.release_candidate(report, minimum_slice_cases=0)


def test_makeup_complete_report_is_fair_release_candidate() -> None:
    report = _makeup_report()
    gates = makeup_quality.feature_gates(report)
    assert all(gate.ready for gate in gates)
    spreads = makeup_quality.fairness_spreads(report)
    assert spreads["depth"] == pytest.approx(0.0)
    assert spreads["undertone"] == pytest.approx(0.0)
    assert makeup_quality.release_candidate(report)
    assert set(makeup_quality.definition_metric_matrix()) == set(makeup_ids())


def test_makeup_failure_or_missing_deep_coverage_blocks_release() -> None:
    failed = list(_makeup_report().rows)
    first = failed[0]
    failed[0] = makeup_report.ReportRow(
        first.case_id,
        first.feature_id,
        "failed",
        first.depth_slice,
        first.undertone_slice,
        first.definition_sha256,
        first.input_sha256,
        first.metrics,
        (),
    )
    assert not makeup_quality.release_candidate(makeup_report.MakeupReport("failed", tuple(failed)))
    light_only = tuple(
        makeup_report.ReportRow(
            row.case_id,
            row.feature_id,
            row.status,
            "light",
            "cool",
            row.definition_sha256,
            row.input_sha256,
            row.metrics,
            row.missing,
        )
        for row in _makeup_report().rows
    )
    assert not makeup_quality.release_candidate(makeup_report.MakeupReport("light-only", light_only))


def test_makeup_rejects_invalid_fairness_threshold() -> None:
    with pytest.raises(ValueError, match="0..1"):
        makeup_quality.release_candidate(_makeup_report(), maximum_pass_rate_spread=1.1)


def test_lip_release_requires_every_feature_and_special_rows() -> None:
    report = _lip_report()
    assert lip_quality.release_candidate(report)
    assert all(gate.ready for gate in lip_quality.feature_gates(report))
    assert "W54" in lip_quality.definition_metric_matrix()
    assert "W57" in lip_quality.definition_metric_matrix()
    without_w54 = lip_report.LipReport("missing-w54", tuple(row for row in report.rows if row.feature_id != "W54"))
    assert not lip_quality.release_candidate(without_w54)


def test_lip_failed_row_blocks_feature_gate() -> None:
    rows = list(_lip_report().rows)
    row = rows[0]
    rows[0] = lip_report.ReportRow(
        row.case_id,
        row.feature_id,
        "failed",
        row.definition_sha256,
        row.input_sha256,
        row.metrics,
        (),
    )
    report = lip_report.LipReport("lip-failed", tuple(rows))
    assert not lip_quality.release_candidate(report)
    assert row.feature_id in {item.feature_id for item in lip_quality.feature_gates(report) if not item.ready}


def test_smile_release_requires_motion_and_dental_coverage() -> None:
    report = _smile_report()
    assert smile_quality.release_candidate(report)
    assert all(item.ready for item in smile_quality.feature_gates(report))
    assert "W58" in smile_quality.definition_metric_matrix()
    no_motion = smile_report.SmileReport("no-motion", tuple(row for row in report.rows if row.feature_id != "W58"))
    assert not smile_quality.release_candidate(no_motion)


def test_smile_minimum_case_count_blocks_single_case_report() -> None:
    report = _smile_report()
    assert not smile_quality.release_candidate(report, minimum_cases=2)
    with pytest.raises(ValueError, match="positive"):
        smile_quality.feature_gates(report, minimum_cases=0)


def test_skin_release_requires_all_features_depths_and_special_features() -> None:
    report = _skin_report()
    assert skin_quality.release_candidate(report)
    assert all(item.ready for item in skin_quality.feature_gates(report))
    matrix = skin_quality.definition_metric_matrix()
    assert set(matrix) == set(skin_ids())
    assert "W90" in matrix and "W91" in matrix


def test_skin_missing_continuity_or_freckles_blocks_release() -> None:
    report = _skin_report()
    no_w90 = skin_report.SkinReport("no-freckles", tuple(row for row in report.rows if row.feature_id != "W90"))
    no_w91 = skin_report.SkinReport("no-continuity", tuple(row for row in report.rows if row.feature_id != "W91"))
    assert not skin_quality.release_candidate(no_w90)
    assert not skin_quality.release_candidate(no_w91)


def test_skin_depth_minimum_is_enforced() -> None:
    report = _skin_report()
    assert not skin_quality.release_candidate(report, minimum_depth_cases=5)


def test_gender_balanced_passes_are_release_candidate() -> None:
    report = _gender_report()
    gates = gender_quality.level_gates(report)
    assert all(item.ready for item in gates)
    assert gender_quality.direction_spread(report) == pytest.approx(0.0)
    assert gender_quality.release_candidate(report)
    assert set(gender_quality.definition_metric_matrix()) == {"normal", "extra", "hyper"}


def test_gender_cheek_delta_over_four_blocks_release() -> None:
    report = _gender_report(cheek=4.1)
    assert not gender_quality.release_candidate(report)


def test_gender_direction_failure_spread_blocks_release() -> None:
    rows = list(_gender_report().rows)
    masculine = [index for index, row in enumerate(rows) if row.direction == "masculine"]
    for index in masculine:
        row = rows[index]
        rows[index] = gender_report.ReportRow(
            row.case_id,
            row.level,
            row.direction,
            "failed",
            row.definition_sha256,
            row.input_sha256,
            row.metrics,
            (),
        )
    report = gender_report.GenderReport("direction-fail", tuple(rows))
    spread = gender_quality.direction_spread(report)
    assert spread == pytest.approx(1.0)
    assert not gender_quality.release_candidate(report)


def test_gender_threshold_validation_and_missing_direction_behavior() -> None:
    with pytest.raises(ValueError, match="0..1"):
        gender_quality.release_candidate(_gender_report(), maximum_direction_spread=-0.1)
    feminine_only = gender_report.GenderReport(
        "one-direction",
        tuple(row for row in _gender_report().rows if row.direction == "feminine"),
    )
    assert gender_quality.direction_spread(feminine_only) is None
    assert not gender_quality.release_candidate(feminine_only)

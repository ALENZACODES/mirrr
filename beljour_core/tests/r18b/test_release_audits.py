"""R18B cross-layer release-audit tests on small synthetic manifest twins. Author: John Khan."""
from __future__ import annotations

from collections.abc import Sequence

import pytest

from plumb_api.engines.gender_look import frozen1000 as gender_manifest
from plumb_api.engines.gender_look import frozen_results as gender_results
from plumb_api.engines.gender_look import frozen_schedule as gender_schedule
from plumb_api.engines.gender_look import realface_report as gender_report
from plumb_api.engines.gender_look import release_audit as gender_audit
from plumb_api.engines.hair_women import frozen1000 as hair_manifest
from plumb_api.engines.hair_women import frozen_results as hair_results
from plumb_api.engines.hair_women import frozen_schedule as hair_schedule
from plumb_api.engines.hair_women import realface_report as hair_report
from plumb_api.engines.hair_women import release_audit as hair_audit
from plumb_api.engines.hair_women.realface import registry_feature_ids as hair_ids
from plumb_api.engines.lips import frozen1000 as lips_manifest
from plumb_api.engines.lips import frozen_results as lips_results
from plumb_api.engines.lips import realface_report as lips_report
from plumb_api.engines.lips import release_audit as lips_audit
from plumb_api.engines.lips.realface import registry_feature_ids as lip_ids
from plumb_api.engines.makeup_w import frozen1000 as makeup_manifest
from plumb_api.engines.makeup_w import frozen_results as makeup_results
from plumb_api.engines.makeup_w import frozen_schedule as makeup_schedule
from plumb_api.engines.makeup_w import realface_report as makeup_report
from plumb_api.engines.makeup_w import release_audit as makeup_audit
from plumb_api.engines.makeup_w.realface import registry_feature_ids as makeup_ids
from plumb_api.engines.skin_more import frozen1000 as skin_manifest
from plumb_api.engines.skin_more import frozen_results as skin_results
from plumb_api.engines.skin_more import frozen_schedule as skin_schedule
from plumb_api.engines.skin_more import realface_report as skin_report
from plumb_api.engines.skin_more import release_audit as skin_audit
from plumb_api.engines.skin_more.realface import registry_feature_ids as skin_ids
from plumb_api.engines.smile import frozen1000 as smile_manifest
from plumb_api.engines.smile import frozen_results as smile_results
from plumb_api.engines.smile import realface_report as smile_report
from plumb_api.engines.smile import release_audit as smile_audit
from plumb_api.engines.smile.realface import registry_feature_ids as smile_ids


INPUT = "a" * 64
DEFINITION = "b" * 64
METRICS = "c" * 64


def _cycle(features: Sequence[str], index: int) -> str:
    return features[index % len(features)]


def _hair_ready_partial() -> tuple[hair_manifest.FrozenManifest, hair_results.ResultLedger, hair_report.HairReport, hair_schedule.Schedule]:
    features = hair_ids()
    hair_slices = ("straight", "wavy", "curly", "coily")
    tones = ("light", "medium", "deep")
    count = max(len(features), len(hair_slices) * len(tones)) * 2
    cases = tuple(
        hair_manifest.FrozenCase(
            f"h-{index:03d}",
            INPUT,
            (_cycle(features, index),),
            hair_slices[index % len(hair_slices)],
            tones[index // len(hair_slices) % len(tones)],
        )
        for index in range(count)
    )
    manifest = hair_manifest.FrozenManifest("hair-partial", cases)
    ledger = hair_results.ResultLedger(
        manifest.sha256,
        tuple(
            hair_results.ResultRow(case.case_id, case.feature_ids[0], "passed", DEFINITION, INPUT, METRICS)
            for case in cases
        ),
    )
    rows = tuple(
        hair_report.ReportRow(
            f"hair-report-{feature}",
            feature,
            DEFINITION,
            INPUT,
            "passed",
            hair_slices[index % len(hair_slices)],
            tones[index % len(tones)],
            (),
            (),
        )
        for index, feature in enumerate(features)
    )
    report = hair_report.HairReport("hair-partial", rows)
    return manifest, ledger, report, hair_schedule.build(manifest)


def _makeup_ready_partial() -> tuple[
    makeup_manifest.FrozenManifest,
    makeup_results.ResultLedger,
    makeup_report.MakeupReport,
    makeup_schedule.Schedule,
]:
    features = makeup_ids()
    depths = ("light", "medium", "deep", "very-deep")
    undertones = ("cool", "neutral", "warm", "olive")
    count = max(len(features), len(depths) * len(undertones)) * 2
    cases = tuple(
        makeup_manifest.FrozenCase(
            f"m-{index:03d}",
            INPUT,
            (_cycle(features, index),),
            depths[index % len(depths)],
            undertones[index // len(depths) % len(undertones)],
        )
        for index in range(count)
    )
    manifest = makeup_manifest.FrozenManifest("makeup-partial", cases)
    ledger = makeup_results.ResultLedger(
        manifest.sha256,
        tuple(
            makeup_results.ResultRow(case.case_id, case.feature_ids[0], "passed", DEFINITION, INPUT, METRICS)
            for case in cases
        ),
    )
    report_rows = []
    for index, feature in enumerate(features):
        report_rows.append(
            makeup_report.ReportRow(
                f"makeup-deep-{feature}",
                feature,
                "passed",
                "deep",
                "olive",
                DEFINITION,
                INPUT,
                (),
                (),
            )
        )
        report_rows.append(
            makeup_report.ReportRow(
                f"makeup-light-{feature}",
                feature,
                "passed",
                "light",
                ("cool", "neutral", "warm")[index % 3],
                DEFINITION,
                INPUT,
                (),
                (),
            )
        )
    report = makeup_report.MakeupReport("makeup-partial", tuple(report_rows))
    return manifest, ledger, report, makeup_schedule.build(manifest)


def _lips_ready_partial() -> tuple[lips_manifest.FrozenManifest, lips_results.ResultLedger, lips_report.LipReport]:
    features = lip_ids()
    cases = tuple(lips_manifest.FrozenCase(f"l-{index:03d}", INPUT, (feature,)) for index, feature in enumerate(features))
    manifest = lips_manifest.FrozenManifest("lips-partial", cases)
    ledger = lips_results.ResultLedger(
        manifest.sha256,
        tuple(lips_results.ResultRow(case.case_id, case.feature_ids[0], "passed", DEFINITION, INPUT, METRICS) for case in cases),
    )
    report = lips_report.LipReport(
        "lips-partial",
        tuple(lips_report.ReportRow(f"lip-{feature}", feature, "passed", DEFINITION, INPUT, (), ()) for feature in features),
    )
    return manifest, ledger, report


def _smile_ready_partial() -> tuple[smile_manifest.FrozenManifest, smile_results.ResultLedger, smile_report.SmileReport]:
    features = smile_ids()
    cases = tuple(smile_manifest.FrozenCase(f"s-{index:03d}", INPUT, (feature,)) for index, feature in enumerate(features))
    manifest = smile_manifest.FrozenManifest("smile-partial", cases)
    ledger = smile_results.ResultLedger(
        manifest.sha256,
        tuple(smile_results.ResultRow(case.case_id, case.feature_ids[0], "passed", DEFINITION, INPUT, METRICS) for case in cases),
    )
    report = smile_report.SmileReport(
        "smile-partial",
        tuple(smile_report.ReportRow(f"smile-{feature}", feature, "passed", DEFINITION, INPUT, (), ()) for feature in features),
    )
    return manifest, ledger, report


def _skin_ready_partial() -> tuple[skin_manifest.FrozenManifest, skin_results.ResultLedger, skin_report.SkinReport, skin_schedule.Schedule]:
    features = skin_ids()
    depths = ("light", "medium", "deep", "very-deep")
    count = max(len(features), len(depths)) * 2
    cases = tuple(
        skin_manifest.FrozenCase(f"k-{index:03d}", INPUT, (_cycle(features, index),), depths[index % len(depths)])
        for index in range(count)
    )
    manifest = skin_manifest.FrozenManifest("skin-partial", cases)
    ledger = skin_results.ResultLedger(
        manifest.sha256,
        tuple(skin_results.ResultRow(case.case_id, case.feature_ids[0], "passed", DEFINITION, INPUT, METRICS) for case in cases),
    )
    rows = tuple(
        skin_report.ReportRow(
            f"skin-{feature}",
            feature,
            "passed",
            depths[index % len(depths)],
            DEFINITION,
            INPUT,
            (),
            (),
        )
        for index, feature in enumerate(features)
    )
    report = skin_report.SkinReport("skin-partial", rows)
    return manifest, ledger, report, skin_schedule.build(manifest)


def _gender_ready_partial() -> tuple[
    gender_manifest.FrozenManifest,
    gender_results.ResultLedger,
    gender_report.GenderReport,
    gender_schedule.Schedule,
]:
    patterns = (("normal",), ("extra",), ("hyper",), ("normal", "extra", "hyper"))
    cases = tuple(gender_manifest.FrozenCase(f"g-{index:03d}", INPUT, patterns[index % len(patterns)]) for index in range(24))
    manifest = gender_manifest.FrozenManifest("gender-partial", cases)
    ledger = gender_results.ResultLedger(
        manifest.sha256,
        tuple(
            gender_results.ResultRow(case.case_id, level, "passed", DEFINITION, INPUT, METRICS)
            for case in cases
            for level in case.levels
        ),
    )
    report = gender_report.GenderReport(
        "gender-partial",
        tuple(
            gender_report.ReportRow(
                f"gender-{level}-{direction}",
                level,
                direction,
                "passed",
                DEFINITION,
                INPUT,
                (("cheek_delta_e_proxy", 2.0),),
                (),
            )
            for level in ("normal", "extra", "hyper")
            for direction in ("feminine", "masculine")
        ),
    )
    return manifest, ledger, report, gender_schedule.build(manifest)


def test_hair_otherwise_clean_partial_audit_has_only_frozen1000_blocker() -> None:
    manifest, ledger, report, schedule = _hair_ready_partial()
    result = hair_audit.audit(manifest, ledger, report, schedule)
    codes = {issue.code for issue in result.issues if issue.severity == "block"}
    assert codes == {"HAIR_FROZEN1000_INCOMPLETE"}
    assert not result.release_ready
    assert result.required_evaluations == len(ledger.rows)


def test_hair_incomplete_ledger_adds_resume_blocker() -> None:
    manifest, ledger, report, schedule = _hair_ready_partial()
    result = hair_audit.audit(manifest, hair_results.ResultLedger(manifest.sha256, ledger.rows[:-1]), report, schedule)
    assert "HAIR_LEDGER_INCOMPLETE" in {issue.code for issue in result.issues}


def test_makeup_otherwise_clean_partial_audit_has_only_frozen1000_blocker() -> None:
    manifest, ledger, report, schedule = _makeup_ready_partial()
    result = makeup_audit.audit(manifest, ledger, report, schedule)
    assert {issue.code for issue in result.blocking} == {"MAKEUP_FROZEN1000_INCOMPLETE"}
    assert result.depth_spread == pytest.approx(0.0)
    assert result.undertone_spread == pytest.approx(0.0)


def test_makeup_fairness_requirement_validation_and_resume_blocker() -> None:
    manifest, ledger, report, schedule = _makeup_ready_partial()
    with pytest.raises(ValueError, match="0..1"):
        makeup_audit.FairnessRequirement(maximum_pass_rate_spread=1.1).validate()
    result = makeup_audit.audit(manifest, makeup_results.ResultLedger(manifest.sha256, ledger.rows[:-1]), report, schedule)
    assert "MAKEUP_LEDGER_INCOMPLETE" in {issue.code for issue in result.blocking}


def test_lips_clean_partial_audit_identifies_only_dataset_size() -> None:
    manifest, ledger, report = _lips_ready_partial()
    result = lips_audit.audit(manifest, ledger, report)
    assert result.blocking_codes == ("LIPS_FROZEN1000_INCOMPLETE",)
    assert result.teeth_tested == 1
    assert result.pigmentation_tested == 1


def test_lips_missing_w57_report_row_adds_pigmentation_blocker() -> None:
    manifest, ledger, report = _lips_ready_partial()
    reduced = lips_report.LipReport("no-w57", tuple(row for row in report.rows if row.feature_id != "W57"))
    result = lips_audit.audit(manifest, ledger, reduced)
    assert "LIPS_W57_PIGMENTATION" in result.blocking_codes


def test_smile_clean_partial_audit_identifies_only_dataset_size() -> None:
    manifest, ledger, report = _smile_ready_partial()
    result = smile_audit.audit(manifest, ledger, report)
    assert result.blockers == ("SMILE_FROZEN1000_INCOMPLETE",)
    assert result.motion_tested == 1
    assert result.dental_tested == 4


def test_smile_missing_motion_adds_w58_blocker() -> None:
    manifest, ledger, report = _smile_ready_partial()
    reduced = smile_report.SmileReport("no-w58", tuple(row for row in report.rows if row.feature_id != "W58"))
    result = smile_audit.audit(manifest, ledger, reduced)
    assert "SMILE_W58_MOTION" in result.blockers


def test_skin_clean_partial_audit_identifies_only_dataset_size() -> None:
    manifest, ledger, report, schedule = _skin_ready_partial()
    result = skin_audit.audit(manifest, ledger, report, schedule)
    assert result.blockers == ("SKIN_FROZEN1000_INCOMPLETE",)
    assert len(result.depth_counts) == 4


def test_skin_missing_continuity_adds_w91_blocker() -> None:
    manifest, ledger, report, schedule = _skin_ready_partial()
    reduced = skin_report.SkinReport("no-w91", tuple(row for row in report.rows if row.feature_id != "W91"))
    result = skin_audit.audit(manifest, ledger, reduced, schedule)
    assert "SKIN_W91_CONTINUITY" in result.blockers


def test_gender_clean_partial_audit_identifies_only_dataset_size() -> None:
    manifest, ledger, report, schedule = _gender_ready_partial()
    result = gender_audit.audit(manifest, ledger, report, schedule)
    assert result.blockers == ("GENDER_FROZEN1000_INCOMPLETE",)
    assert result.maximum_cheek_delta == pytest.approx(2.0)
    assert result.direction_pass_rate_spread == pytest.approx(0.0)


def test_gender_cheek_and_resume_regressions_are_blocking() -> None:
    manifest, ledger, report, schedule = _gender_ready_partial()
    changed_rows = tuple(
        gender_report.ReportRow(
            row.case_id,
            row.level,
            row.direction,
            row.status,
            row.definition_sha256,
            row.input_sha256,
            (("cheek_delta_e_proxy", 4.5),),
            row.missing,
        )
        for row in report.rows
    )
    changed_report = gender_report.GenderReport("cheek-regression", changed_rows)
    result = gender_audit.audit(manifest, gender_results.ResultLedger(manifest.sha256, ledger.rows[:-1]), changed_report, schedule)
    assert "GENDER_CHEEK_DELTA" in result.blockers
    assert "GENDER_LEDGER_INCOMPLETE" in result.blockers


@pytest.mark.parametrize("minimum", (0, -1))
def test_audits_reject_nonpositive_minimum_cases(minimum: int) -> None:
    hair_values = _hair_ready_partial()
    with pytest.raises(ValueError):
        hair_audit.audit(*hair_values, minimum_feature_cases=minimum)
    lips_values = _lips_ready_partial()
    with pytest.raises(ValueError):
        lips_audit.audit(*lips_values, minimum_cases=minimum)
    smile_values = _smile_ready_partial()
    with pytest.raises(ValueError):
        smile_audit.audit(*smile_values, minimum_cases=minimum)

"""R18B privacy-safe real-face report tests. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.hair_women import realface as hair_realface
from plumb_api.engines.hair_women import realface_report as hair_report
from plumb_api.engines.makeup_w import realface as makeup_realface
from plumb_api.engines.makeup_w import realface_report as makeup_report
from plumb_api.engines.skin_more import realface as skin_realface
from plumb_api.engines.skin_more import realface_report as skin_report

from .conftest import inset, tint


def make_hair(image: np.ndarray, mask: np.ndarray) -> hair_realface.HairCase:
    return hair_realface.HairCase(
        "h",
        image,
        tint(image, inset(mask), (2, 0, 1)),
        mask,
        feature_id="W19",
        hair_slice="curly",
        tone_slice="deep",
    )


def make_makeup(
    image: np.ndarray,
    mask: np.ndarray,
    *,
    depth: makeup_realface.DepthSlice = "deep",
) -> makeup_realface.MakeupCase:
    effect = inset(mask, 6)
    return makeup_realface.MakeupCase(
        "m",
        "W1",
        image,
        tint(image, effect, (3, 0, 1)),
        mask,
        effect,
        depth_slice=depth,
        undertone_slice="olive",
    )


def make_skin(image: np.ndarray, mask: np.ndarray, *, feature: str = "W77") -> skin_realface.SkinCase:
    effect = inset(mask, 5)
    return skin_realface.SkinCase("s", feature, image, tint(image, effect, (2, 0, 0)), effect, mask, depth_slice="deep")


def test_hair_report_hash_binds_definition_set(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_hair(rgba_image, center_mask)
    row = hair_report.row_from(case, hair_realface.evaluate(case))
    report = hair_report.HairReport("hair-frozen-1000", (row,))
    report.validate()
    assert len(report.sha256) == 64
    assert len(hair_report.definition_set_sha256()) == 64
    assert "pixels" not in report.canonical()


def test_hair_report_coverage_uses_registry_count(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_hair(rgba_image, center_mask)
    report = hair_report.HairReport("hair", (hair_report.row_from(case, hair_realface.evaluate(case)),))
    summary = hair_report.coverage(report)
    assert summary["registry_feature_count"] == 25
    assert summary["covered_features"] == 1
    assert summary["clean_features"] == 1
    assert summary["complete"] is False
    assert hair_report.minimum_slice_count(report) == 1


def test_hair_report_rejects_duplicate_case_feature(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_hair(rgba_image, center_mask)
    row = hair_report.row_from(case, hair_realface.evaluate(case))
    with pytest.raises(ValueError, match="duplicate"):
        hair_report.HairReport("hair", (row, row)).validate()


def test_makeup_report_depth_and_undertone_rates(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    deep = make_makeup(rgba_image, center_mask, depth="deep")
    medium = makeup_realface.MakeupCase(**{**deep.__dict__, "case_id": "m2", "depth_slice": "medium"})
    rows = (
        makeup_report.row_from(deep, makeup_realface.evaluate(deep)),
        makeup_report.row_from(medium, makeup_realface.evaluate(medium)),
    )
    report = makeup_report.MakeupReport("makeup", rows)
    summary = makeup_report.coverage(report)
    assert summary["deep_cases"] == 1
    assert summary["olive_cases"] == 2
    assert summary["depth_pass_rates"] == {"deep": 1.0, "medium": 1.0}
    assert makeup_report.pass_rate_spread(summary["depth_pass_rates"]) == 0.0


def test_makeup_report_spread_ignores_untested_slices() -> None:
    assert makeup_report.pass_rate_spread({"deep": 1.0, "light": None}) is None
    assert makeup_report.pass_rate_spread({"deep": 1.0, "light": 0.5}) == 0.5


def test_makeup_report_duplicate_guard(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_makeup(rgba_image, center_mask)
    row = makeup_report.row_from(case, makeup_realface.evaluate(case))
    with pytest.raises(ValueError, match="duplicate"):
        makeup_report.MakeupReport("makeup", (row, row)).validate()


def test_skin_report_special_feature_buckets(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    ordinary = make_skin(rgba_image, center_mask)
    w90 = skin_realface.SkinCase(**{**ordinary.__dict__, "case_id": "s90", "feature_id": "W90", "freckle_mask": np.zeros_like(center_mask)})
    w91 = skin_realface.SkinCase(**{**ordinary.__dict__, "case_id": "s91", "feature_id": "W91"})
    ordinary_row = skin_report.row_from(ordinary, skin_realface.evaluate(ordinary))
    w90_row = skin_report.row_from(w90, skin_realface.evaluate(w90))
    w91_row = skin_report.row_from(w91, skin_realface.evaluate(w91))
    report = skin_report.SkinReport("skin", (ordinary_row, w90_row, w91_row))
    summary = skin_report.coverage(report)
    assert summary["registry_feature_count"] == 16
    assert summary["freckle_w90"]["not_tested"] == 1
    assert summary["continuity_w91"]["not_tested"] == 1
    assert summary["complete"] is False


def test_skin_report_canonical_excludes_raw_images(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_skin(rgba_image, center_mask)
    row = skin_report.row_from(case, skin_realface.evaluate(case))
    report = skin_report.SkinReport("skin", (row,))
    text = report.canonical()
    assert "before" not in text
    assert "after" not in text
    assert "mask" not in text
    assert len(report.sha256) == 64


def test_report_rows_reject_unknown_features() -> None:
    row = hair_report.ReportRow("case", "W999", "0" * 64, "1" * 64, "passed", "unknown", "unknown", (), ())
    with pytest.raises(ValueError, match="unknown"):
        row.validate()

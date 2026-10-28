"""W73 measured alternatives and W74 honest progress/diary checks. Author: John Khan."""
from __future__ import annotations

import copy

import numpy as np
import pytest

from plumb_api.engines.brows import render_brows
from plumb_api.engines.brows.assessment import compare_brow_photos, photo_measurements, shape_options
from plumb_api.engines.brows.progress import (
    SAFETY_SOURCE,
    compare_measurement,
    diary_trend,
    progress_series,
    validate_diary,
)
from plumb_api.engines.brows.synthetic import brow_fixture


def observations() -> list[dict]:
    return [{"date": "2026-01-01", "site": "brows", "length": 4.2, "density": 58, "confidence": 0.9},
            {"date": "2026-02-01", "site": "brows", "length": 4.4, "density": 61, "confidence": 0.8},
            {"date": "2026-01-03", "site": "lashes", "length": 7, "density": 80, "confidence": 0.7}]


def test_progress_default_has_zero_growth_without_a_product_claim() -> None:
    result = progress_series()
    assert len(result["rows"]) == 7
    assert all(row["length_scale"] == row["density_scale"] == 1 for row in result["rows"])
    assert result["assumed"] is True
    assert result["empirical"] is False
    assert "no product efficacy estimate" in result["note"]
    assert "iris pigmentation" in result["safety_note"]
    assert SAFETY_SOURCE.startswith("https://www.accessdata.fda.gov/")


@pytest.mark.parametrize("site", ["brows", "lashes"])
@pytest.mark.parametrize("months", [0, 1, 3, 6, 12])
def test_month_by_month_user_scenario_has_exact_endpoints(site: str, months: int) -> None:
    result = progress_series({"months": months, "lengthChange": 20, "densityChange": -10,
                              "baselineLength": 5, "baselineDensity": 100, "site": site})
    rows = result["rows"]
    assert len(rows) == months + 1
    assert rows[0]["length_scale"] == rows[0]["density_scale"] == 1
    assert all(a["length_scale"] <= b["length_scale"] for a, b in zip(rows[:-1], rows[1:], strict=True))
    assert all(a["density_scale"] >= b["density_scale"] for a, b in zip(rows[:-1], rows[1:], strict=True))
    if months:
        assert rows[-1]["length_from_user_baseline"] == pytest.approx(6)
        assert rows[-1]["density_from_user_baseline"] == pytest.approx(90)
    assert result["site"] == site


def test_progress_photo_is_unchanged_even_for_a_positive_hypothesis() -> None:
    image, face, evidence = brow_fixture()
    result = render_brows(image, face, "W74", {"lengthChange": 30, "densityChange": 30}, evidence)
    assert np.array_equal(result.image, image)
    assert result.metrics["photo_prediction"] is False
    assert result.metrics["efficacy_claim"] is False
    assert result.metrics["hypothetical"] is True
    assert result.details["rows"][-1]["length_scale"] == 1.3
    assert any("photo stays unchanged" in message.lower() for message in result.warnings)


def test_diary_sorts_without_mutation_and_separates_sites() -> None:
    input_rows = observations()
    original = copy.deepcopy(input_rows)
    result = validate_diary(input_rows)
    assert input_rows == original
    assert [row["date"] for row in result] == ["2026-01-01", "2026-01-03", "2026-02-01"]
    trend = diary_trend(input_rows)
    assert trend["days"] == 31
    assert trend["length_change"] == pytest.approx(0.2)
    assert trend["density_change"] == 3
    assert trend["minimum_confidence"] == 0.8
    assert trend["attribution"] is False
    assert diary_trend(input_rows, "lashes")["status"] == "insufficient"
    assert diary_trend([])["observations"] == 0


@pytest.mark.parametrize("date", ["2026-02-30", "2026-1-01", "2026-02-01T00:00:00Z", "0000-01-01", "20260201"])
def test_diary_rejects_noncanonical_or_invalid_dates(date: str) -> None:
    row = observations()[0]
    row["date"] = date
    with pytest.raises(ValueError, match="date"):
        validate_diary([row])


@pytest.mark.parametrize("field,value", [("photo", "data:image/png;base64,aaaa"), ("email", "person@example.invalid"),
                                         ("notes", "a private detail"), ("product", "a product")])
def test_diary_refuses_images_identifiers_products_and_free_text(field: str, value: str) -> None:
    row = observations()[0]
    row[field] = value
    with pytest.raises(ValueError, match="field"):
        validate_diary([row])


def test_diary_limits_duplicate_dates_and_unbounded_imports() -> None:
    first = observations()[0]
    with pytest.raises(ValueError, match="duplicate"):
        validate_diary([first, first])
    with pytest.raises(ValueError, match="120"):
        validate_diary([first] * 121)
    duplicate_other_site = {**first, "site": "lashes"}
    assert len(validate_diary([first, duplicate_other_site])) == 2


@pytest.mark.parametrize("settings", [{"months": 1.5}, {"months": -1}, {"months": 13}, {"lengthChange": 31},
                                      {"densityChange": float("nan")}, {"site": "scalp"}, {"baselineLength": 0}])
def test_progress_rejects_invalid_scenario_ranges(settings: dict) -> None:
    with pytest.raises(ValueError):
        progress_series(settings)


def test_measurement_tolerance_is_symmetric_and_explicit() -> None:
    assert compare_measurement(5, 5.2)
    assert compare_measurement(5.2, 5)
    assert not compare_measurement(5, 5.6)
    assert compare_measurement(0, 0)
    assert not compare_measurement(0, 1)
    with pytest.raises(ValueError):
        compare_measurement(1, 1, relative_tolerance=-1)


def test_shape_alternatives_are_opt_in_and_all_retain_thickness() -> None:
    _, face, _ = brow_fixture(asymmetric=True)
    result = shape_options(face, 128, 128)
    assert result["automatic_selection"] is False
    assert result["brow_width_difference_px"] > 0
    assert result["brow_height_difference_px"] > 0
    assert len(result["alternatives"]) == 4
    assert all(item["thickness"] >= 1 for item in result["alternatives"])
    assert len({item["id"] for item in result["alternatives"]}) == 4
    assert all(item["reason"] for item in result["alternatives"])


def test_photographic_comparison_rejects_exposure_changes_as_growth_evidence() -> None:
    before, face, evidence = brow_fixture(tone=130)
    after = np.clip(before.astype(float) + 30, 0, 255).astype(np.uint8)
    result = compare_brow_photos(before, face, after, face, before_evidence=evidence, after_evidence=evidence)
    assert result["comparable"] is False
    assert any("lighting" in message for message in result["reasons"])
    assert all(abs(row["normalized_coverage_change"]) < 1e-12 for row in result["sides"])
    assert result["attribution"] is False


def test_photographic_comparison_rejects_roll_and_independent_scale_changes() -> None:
    before, first_face, first_evidence = brow_fixture()
    after, next_face, next_evidence = brow_fixture(roll=15)
    result = compare_brow_photos(before, first_face, after, next_face,
                                before_evidence=first_evidence, after_evidence=next_evidence)
    assert result["comparable"] is False
    assert result["roll_difference_degrees"] == pytest.approx(15)
    assert any("Head roll" in reason for reason in result["reasons"])


def test_identical_manually_checked_photos_are_comparable_but_not_causal() -> None:
    image, face, evidence = brow_fixture()
    result = compare_brow_photos(image, face, image, face, before_evidence=evidence, after_evidence=evidence)
    assert result["comparable"] is True
    assert result["reasons"] == []
    assert result["photos_stored"] is False
    assert result["attribution"] is False
    for side in result["sides"]:
        assert side["coverage_fraction_change"] == 0
        assert side["texture_std_change"] == 0
        assert side["biological_growth_claim"] is False
    measurements = photo_measurements(image, face, evidence)
    assert measurements["biological_count"] is None
    assert measurements["photo_stored"] is False


def test_diary_export_and_import_keep_only_permitted_measurements() -> None:
    from plumb_api.engines.brows.diary import diary_document, export_diary, parse_diary, summarize_diary
    entries = observations()
    document = diary_document(entries)
    assert parse_diary(export_diary(entries)) == document
    assert document["author"] == "John Khan"
    summary = summarize_diary(entries)
    assert summary["count"] == 3
    assert summary["first_date"] == "2026-01-01"
    assert summary["last_date"] == "2026-02-01"
    assert summary["brows"]["status"] == "observed"
    assert summary["lashes"]["status"] == "insufficient"
    assert summary["attribution"] is False
    assert summarize_diary([])["first_date"] is None


def test_diary_import_rejects_claims_bad_version_private_fields_and_oversize() -> None:
    from plumb_api.engines.brows.diary import diary_document, parse_diary
    base = diary_document(observations())
    for key, value in (("attribution", True), ("contains_photos", True), ("format", "v2"),
                       ("photo", "base64 data"), ("user", "a person")):
        with pytest.raises(ValueError):
            parse_diary({**base, key: value})
    with pytest.raises(ValueError, match="32 KiB"):
        parse_diary(" " * 32769)
    with pytest.raises(ValueError, match="JSON"):
        parse_diary("{")

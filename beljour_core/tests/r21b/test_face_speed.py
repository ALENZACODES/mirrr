"""Synthetic A4 speed-comparator contract, without real faces or stored pixels."""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

import pytest

from plumb_api.filters.qa import fixtures, performance
from plumb_api.filters.recipe import registry

REPO = Path(__file__).resolve().parents[3]


def drawn_faces(count: int = 1) -> list[fixtures.Portrait]:
    return [fixtures.portrait(tone, width=96, height=112) for tone in
            ("very_dark", "dark", "medium", "light")[:count]]


def selected(count: int = 2) -> list[dict[str, object]]:
    catalogue = registry.default()
    return [catalogue.get(code) for code in ("C01", "C03", "M02", "C08")[:count]]


def test_speed_comparator_emits_only_measured_aggregate_data_and_matches_rows() -> None:
    result = performance.compare(drawn_faces(2), selected(3), repeats=1)
    assert result.passed
    assert result.mode == "synthetic_only"
    assert result.face_count == 2
    assert result.recipe_count == 3
    assert result.repeats == 1
    assert result.face_preparation_ms >= 0
    assert [row.recipe for row in result.rows] == ["C01", "C03", "M02"]
    for row in result.rows:
        assert row.trials == 2
        assert row.byte_identical
        assert row.legacy_median_ms >= 0
        assert row.cached_median_ms >= 0
        assert row.ratio is None or row.ratio >= 0
        assert len(row.content_digest) == 64
        assert set(row.content_digest) <= set("0123456789abcdef")
    record = result.to_dict()
    assert record["passed"] is True
    assert len(record["rows"]) == 3
    assert all(set(item) == {
        "recipe", "trials", "legacy_median_ms", "cached_median_ms", "ratio",
        "byte_identical", "content_digest",
    } for item in record["rows"])
    assert "photo" not in record
    assert "pixels" not in record
    assert "landmarks" not in record
    assert "mask" not in record
    assert "image" not in record
    assert len(json.dumps(record)) < 2048


def test_face_preparer_runs_once_for_cached_mode_not_once_per_recipe() -> None:
    faces = drawn_faces(2)
    recipes = selected(3)
    with patch.object(performance.SH, "prepare_face", wraps=performance.SH.prepare_face) as prepare:
        result = performance.compare(faces, recipes, repeats=2, warm_luts=False)
        assert result.passed
        # One prepared path per face, and one legacy preparation per trial.
        assert prepare.call_count == len(faces) + len(faces) * len(recipes) * 2
    for row in result.rows:
        assert row.trials == len(faces) * 2


def test_any_row_mismatch_fails_closed_instead_of_reporting_speed_only() -> None:
    original = performance.SH.measure_image

    def biased(*args: object, **kwargs: object) -> performance.SH.ToneReport:
        report = original(*args, **kwargs)
        if kwargs.get("inputs") is not None:
            return replace(report, flags=[*report.flags, "TEST_INJECTED_REPORT_DRIFT"])
        return report

    with patch.object(performance.SH, "measure_image", side_effect=biased):
        result = performance.compare(drawn_faces(), selected(2), warm_luts=False)
    assert not result.passed
    assert all(not row.byte_identical for row in result.rows)
    assert all(row.content_digest for row in result.rows)


@pytest.mark.parametrize("repeats", [0, -1, 6, True, False, 1.25, "3"])
def test_comparator_rejects_unsafe_repeat_counts(repeats: object) -> None:
    with pytest.raises(ValueError, match="repeats"):
        performance.compare(drawn_faces(), selected(), repeats=repeats)  # type: ignore[arg-type]


def test_comparator_refuses_missing_faces_or_recipes() -> None:
    with pytest.raises(ValueError, match="fixtures"):
        performance.compare([], selected())
    with pytest.raises(ValueError, match="recipe count"):
        performance.compare(drawn_faces(), [])


def test_comparator_refuses_duplicate_recipe_ids() -> None:
    recipe = registry.default().get("C01")
    with pytest.raises(ValueError, match="duplicate"):
        performance.compare(drawn_faces(), [recipe, recipe])


def test_digest_is_of_proxy_report_not_source_photo() -> None:
    face = drawn_faces()[0]
    result = performance.compare([face], selected(1), warm_luts=False)
    digest = result.rows[0].content_digest
    assert digest != hashlib.sha256(face.image.tobytes()).hexdigest()
    assert digest != hashlib.sha256(face.masks.skin.tobytes()).hexdigest()
    assert all(value.byte_identical for value in result.rows)


def test_cli_reports_actual_timing_and_no_faces() -> None:
    result = subprocess.run(
        [sys.executable, str(REPO / "api/scripts/filters.py"), "face-speed",
         "--faces", "1", "--count", "2", "--repeats", "1"],
        check=True, capture_output=True, text=True, cwd=REPO, timeout=30,
    )
    data = json.loads(result.stdout)
    assert data["passed"]
    assert data["mode"] == "synthetic_only"
    assert data["face_count"] == 1
    assert len(data["rows"]) == 2
    assert all(row["byte_identical"] for row in data["rows"])
    assert "data:image" not in result.stdout
    assert "test-photo" not in result.stdout

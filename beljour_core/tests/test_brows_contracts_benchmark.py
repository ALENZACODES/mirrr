"""Brow boundaries, parity drift and box-side metrics. Author: John Khan."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.brows import FEATURES, BrowEvidence, render_brows
from plumb_api.engines.brows.benchmark import PASS_DEFINITIONS, aggregate_brows, evaluate_brows
from plumb_api.engines.brows.geometry import brow_frames
from plumb_api.engines.brows.synthetic import brow_fixture

ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize("feature", FEATURES)
@pytest.mark.parametrize("amount", [True, float("nan"), float("inf"), -0.1, 1.01, "0.5"])
def test_all_renderers_validate_amount_at_the_boundary(feature: str, amount: object) -> None:
    image, face, evidence = brow_fixture()
    settings = {"amount": amount}
    if feature in ("W71", "W72"):
        settings["adultConfirmed"] = True
    with pytest.raises(ValueError, match="amount"):
        render_brows(image, face, feature, settings, evidence)


@pytest.mark.parametrize("feature", FEATURES)
def test_unknown_settings_are_rejected_instead_of_silently_ignored(feature: str) -> None:
    image, face, evidence = brow_fixture()
    with pytest.raises(ValueError, match="unknown brow option"):
        render_brows(image, face, feature, {"secret": "value"}, evidence)


def test_photo_and_geometry_limits_fail_before_work() -> None:
    image, face, _ = brow_fixture()
    for invalid in (np.zeros((7, 8, 3), np.uint8), np.zeros((8, 8), np.uint8), image.astype(float),
                    np.zeros((8, 8, 2), np.uint8)):
        with pytest.raises(ValueError):
            render_brows(invalid, face, "W69")
    broken = face.copy()
    broken[42, 0] = np.nan
    with pytest.raises(ValueError, match="finite"):
        render_brows(image, broken, "W69")
    with pytest.raises(ValueError, match="468"):
        render_brows(image, face[:100], "W69")
    with pytest.raises(ValueError, match="feature"):
        render_brows(image, face, "W68")


def test_degenerate_eye_line_and_brows_are_unavailable_not_mirrored() -> None:
    _, face, _ = brow_fixture()
    face[263] = face[33]
    with pytest.raises(ValueError, match="eye line"):
        brow_frames(face, 128, 128)


def test_evidence_arrays_are_copied_and_nonnumeric_masks_refused() -> None:
    image, face, evidence = brow_fixture()
    original = evidence.coverage.copy()
    result = render_brows(image, face, "W69", evidence=evidence)
    result.support.fill(0)
    assert np.array_equal(evidence.coverage, original)
    bad = evidence.coverage.copy()
    bad[1, 1] = np.nan
    with pytest.raises(ValueError, match="finite"):
        render_brows(image, face, "W69", evidence=BrowEvidence(bad, evidence.grey))


def test_box_side_evaluator_has_one_definition_and_metric_row_for_each_feature() -> None:
    image, face, evidence = brow_fixture()
    rows = evaluate_brows(image, face, "drawn-neutral", evidence=evidence, adult_confirmed=True)
    assert set(PASS_DEFINITIONS) == set(FEATURES)
    assert [row["feature"] for row in rows] == list(FEATURES)
    assert all(row["passed"] for row in rows)
    assert all(row["group"] == "drawn-neutral" for row in rows)
    assert all(row["human_review"] == "Not tested" for row in rows)
    assert all(set(row["metrics"]["checks"]) == set(PASS_DEFINITIONS[row["feature"]]["checks"]) for row in rows)


def test_realface_pmu_without_adult_eligibility_stays_unavailable() -> None:
    image, face, evidence = brow_fixture()
    rows = evaluate_brows(image, face, evidence=evidence)
    pmu = [row for row in rows if row["feature"] in ("W71", "W72")]
    assert len(pmu) == 2
    assert all(row["status"] == "unavailable" and row["passed"] is False for row in pmu)
    assert aggregate_brows(rows)["engineering_pass"] is False


def test_group_aggregation_keeps_unavailable_in_denominator_and_small_groups_visible() -> None:
    image, face, evidence = brow_fixture()
    good = evaluate_brows(image, face, "first", evidence=evidence, adult_confirmed=True)
    bad = [dict(row, group="second", status="unavailable", passed=False) for row in good]
    result = aggregate_brows(good + bad)
    assert len(result["groups"]) == 12
    assert all(item["count"] == 1 for item in result["groups"])
    assert all(item["pass_rate"] == 0 for item in result["groups"] if item["group"] == "second")
    assert result["engineering_pass"] is False
    assert "UNPROVEN" in result["realface_release"]
    empty = aggregate_brows([])
    assert empty["engineering_pass"] is False
    assert set(empty["missing_features"]) == set(FEATURES)


def test_parity_corpus_recomputes_from_real_renderers_without_drift() -> None:
    process = subprocess.run([sys.executable, str(ROOT / "api/scripts/make_parity_brows.py"), "--check"],
                             cwd=ROOT, capture_output=True, text=True, check=False)
    assert process.returncode == 0, process.stdout + process.stderr
    assert "18 cases unchanged" in process.stdout


def test_every_declared_brow_variant_executes_without_missing_check_names() -> None:
    from plumb_api.engines.brows.benchmark import (
        VARIANT_SETTINGS,
        evaluate_brow_variants,
        verify_variant_completeness,
    )
    image, face, evidence = brow_fixture()
    for feature in FEATURES:
        rows = evaluate_brow_variants(image, face, feature, evidence=evidence, adult_confirmed=True)
        assert verify_variant_completeness(feature, rows) == []
        assert len(rows) == len(VARIANT_SETTINGS[feature])
        assert all(row["passed"] for row in rows)
        assert all(row["visual_quality"] == "Not tested" for row in rows)
        assert verify_variant_completeness(feature, rows[:-1])
    assert len(VARIANT_SETTINGS["W72"]) == 6
    assert len(VARIANT_SETTINGS["W74"]) == 4


def test_variant_completeness_rejects_forged_refusal_pass() -> None:
    from plumb_api.engines.brows.benchmark import evaluate_brow_variants, verify_variant_completeness
    image, face, evidence = brow_fixture()
    rows = evaluate_brow_variants(image, face, "W71", evidence=evidence)
    assert all(row["status"] == "unavailable" for row in rows)
    assert verify_variant_completeness("W71", rows) == []
    rows[0]["passed"] = True
    assert "unavailable variants cannot pass" in verify_variant_completeness("W71", rows)


@pytest.mark.parametrize("feature", FEATURES)
def test_explicit_null_settings_are_never_silently_defaulted(feature: str) -> None:
    image, face, evidence = brow_fixture()
    with pytest.raises(ValueError, match="null"):
        render_brows(image, face, feature, {"amount": None}, evidence)


def test_evidence_notes_are_bounded_plain_text_and_image_size_limit_is_enforced() -> None:
    image, face, evidence = brow_fixture()
    for notes in (("x" * 201,), ("a",) * 9, (123,)):
        malformed = BrowEvidence(evidence.coverage, evidence.grey, "manual", 1, notes)
        with pytest.raises(ValueError, match="notes"):
            render_brows(image, face, "W69", evidence=malformed)
    oversized = np.zeros((8, 4097, 3), np.uint8)
    with pytest.raises(ValueError, match="4096"):
        render_brows(oversized, face, "W69")


def test_frame_projection_round_trips_with_rotation_and_asymmetry() -> None:
    for rotation in (-25, 0, 23):
        _, face, _ = brow_fixture(roll=rotation, asymmetric=True)
        frames = brow_frames(face, 128, 128)
        for frame in frames:
            for u, v in ((0, 0), (0.3, 0.1), (1, 0), (0.65, -0.05)):
                point = frame.point(u, v)
                actual = frame.project(*point)
                assert actual == pytest.approx((u, v), abs=1e-12)
            assert sum(component ** 2 for component in frame.across) == pytest.approx(1)
            assert sum(component ** 2 for component in frame.up) == pytest.approx(1)
            assert sum(a * b for a, b in zip(frame.across, frame.up, strict=True)) == pytest.approx(0, abs=1e-12)

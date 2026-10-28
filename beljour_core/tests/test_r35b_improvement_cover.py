"""BELJOUR Cover Test structural scoring and editorial completeness regressions.

Every input is synthetic. Gradient correlation is a structural image proxy;
no assertion here is a biometric identity result or real-face release pass.
Created by John Khan.
"""
from __future__ import annotations

from dataclasses import replace
from typing import Any

import numpy as np
import pytest

from plumb_api.filters.qa import cover
from plumb_api.filters.recipe import registry, schema

CAT = registry.default()


def test_all_built_recipes_have_valid_unique_family_and_light() -> None:
    report = cover.editorial_inventory(CAT.ranked())
    assert report["filters"] == 61
    assert report["assigned"] == 61
    assert report["problems"] == []
    assert set(report["families"]) == set(schema.EDITORIAL_FAMILIES)
    assert set(report["lights"]) == set(schema.EDITORIAL_LIGHTS)
    assert sum(report["families"].values()) == 61
    assert sum(report["lights"].values()) == 61
    assert [row["id"] for row in report["assignments"]] == [r["id"] for r in CAT.ranked()]
    for row in report["assignments"]:
        assert row["family"] in schema.EDITORIAL_FAMILIES
        assert row["light"] in schema.EDITORIAL_LIGHTS
        assert isinstance(row["rank"], int)


@pytest.mark.parametrize("family", schema.EDITORIAL_FAMILIES)
def test_every_allowed_family_is_present_in_shipped_catalogue(family: str) -> None:
    report = cover.editorial_inventory(CAT.ranked())
    assert report["families"][family] > 0


@pytest.mark.parametrize("light", schema.EDITORIAL_LIGHTS)
def test_every_allowed_light_is_present_in_shipped_catalogue(light: str) -> None:
    report = cover.editorial_inventory(CAT.ranked())
    assert report["lights"][light] > 0


def test_inventory_rejects_missing_family() -> None:
    wrong = dict(CAT.get("C08"))
    wrong["editorial"] = {"light": "Window"}
    issues = cover.editorial_inventory([wrong])["problems"]
    assert any("incomplete editorial grade" in p for p in issues)


def test_inventory_rejects_missing_light() -> None:
    wrong = dict(CAT.get("C08"))
    wrong["editorial"] = {"family": "Masthead"}
    assert any("incomplete editorial grade" in p for p in cover.editorial_inventory([wrong])["problems"])


def test_inventory_rejects_unrecognized_family_and_light() -> None:
    wrong = dict(CAT.get("C08"))
    wrong["editorial"] = {"family": "Unverified", "light": "Moonlight"}
    issues = cover.editorial_inventory([wrong])["problems"]
    assert any("unknown family" in p for p in issues)
    assert any("unknown light" in p for p in issues)


def test_inventory_rejects_duplicate_recipe_id() -> None:
    original = CAT.get("C08")
    twin = dict(original, rank=130)
    problems = cover.editorial_inventory([original, twin])["problems"]
    assert any("repeated filter id" in p for p in problems)


def test_inventory_rejects_duplicate_rank() -> None:
    original = CAT.get("C08")
    different = dict(CAT.get("C09"), rank=original["rank"])
    problems = cover.editorial_inventory([original, different])["problems"]
    assert any("repeated rank" in p for p in problems)


@pytest.mark.parametrize("rank", [-1, 0, 1.5, True, "4"])
def test_inventory_rejects_invalid_rank(rank: Any) -> None:
    wrong = dict(CAT.get("C08"), rank=rank)
    assert any("invalid rank" in p for p in cover.editorial_inventory([wrong])["problems"])


def test_structural_metric_is_exact_for_unchanged_pixels() -> None:
    original, masks, card = cover.control_photo("medium")
    metrics = cover.measure(original, original.copy(), masks, card)
    assert metrics.identity_drift == pytest.approx(0.0, abs=1e-12)
    assert metrics.texture_alignment == pytest.approx(1.0, abs=1e-12)
    assert metrics.texture_ratio == pytest.approx(1.0, abs=1e-12)


def test_structure_degradation_detects_local_feature_shift() -> None:
    original, masks, card = cover.control_photo("medium")
    assert masks.skin is not None
    moved = original.copy()
    # Move the face texture without altering its geometric alpha mask.
    area = masks.skin >= 0.75
    moved[:, 3:] = original[:, :-3]
    moved[~area] = original[~area]
    drift = cover.measure(original, moved, masks, card)
    assert drift.identity_drift > 0.10
    assert drift.texture_alignment < 0.90
    assert "facial detail no longer aligns" in " ".join(
        cover.problems(drift, monochrome=True)
    ) or drift.identity_drift < cover.IDENTITY_DRIFT_MAX


def test_flattened_face_fails_structure_gate() -> None:
    original, masks, card = cover.control_photo("medium")
    assert masks.skin is not None
    flattened = original.copy()
    flattened[masks.skin >= 0.75] = (110, 110, 110)
    metrics = cover.measure(original, flattened, masks, card)
    assert metrics.identity_drift > cover.IDENTITY_DRIFT_MAX
    assert metrics.texture_alignment < cover.TEXTURE_ALIGNMENT_MIN
    failures = cover.problems(metrics, monochrome=True)
    assert any("facial detail" in issue for issue in failures)
    assert any("texture alignment" in issue for issue in failures)


def test_current_reference_filter_passes_all_synthetic_tones() -> None:
    rows = cover.evaluate_many([CAT.get("C08")])
    assert len(rows) == len(cover.TONE_NAMES)
    assert all(row.passed for row in rows)
    assert all(row.metrics.identity_drift <= cover.IDENTITY_DRIFT_MAX for row in rows)
    assert all(row.metrics.texture_alignment >= cover.TEXTURE_ALIGNMENT_MIN for row in rows)


def test_bulk_evaluator_matches_individual_evaluator_exactly() -> None:
    chosen = [CAT.get(name) for name in ("C08", "C09", "C03")]
    tones = ("light", "dark")
    legacy = [record for recipe in chosen for record in cover.evaluate(recipe, tones)]
    bulk = cover.evaluate_many(chosen, tones)
    assert bulk == legacy
    assert cover.evidence(bulk) == cover.evidence(legacy)


def test_bulk_evaluator_prepares_each_face_only_once(monkeypatch: pytest.MonkeyPatch) -> None:
    prepared: list[str] = []
    real = cover.control_photo

    def counted(tone: str, *, width: int = 80, height: int = 96) -> tuple[Any, Any, Any]:
        prepared.append(tone)
        return real(tone, width=width, height=height)

    monkeypatch.setattr(cover, "control_photo", counted)
    chosen = [CAT.get(name) for name in ("C08", "C09", "C03")]
    rows = cover.evaluate_many(chosen, ("medium", "tan", "dark"))
    assert len(rows) == 9
    assert prepared == ["medium", "tan", "dark"]


def test_bulk_evaluator_rejects_duplicate_tones() -> None:
    with pytest.raises(ValueError, match="exactly once"):
        cover.evaluate_many([CAT.get("C08")], ("dark", "dark"))


def test_bulk_evaluator_rejects_duplicate_recipe_id() -> None:
    with pytest.raises(ValueError, match="exactly once"):
        cover.evaluate_many([CAT.get("C08"), CAT.get("C08")], ("medium",))


def test_bulk_evaluator_does_not_mutate_source_image() -> None:
    original, masks, card = cover.control_photo("tan")
    untouched = original.copy()
    metrics = cover.measure(original, original.copy(), masks, card)
    assert metrics.texture_alignment == 1.0
    cover.evaluate_many([CAT.get("C08"), CAT.get("C09")], ("tan",))
    assert np.array_equal(original, untouched)


def test_evidence_includes_new_metrics_and_strict_limits() -> None:
    record = cover.evaluate_many([CAT.get("C08")], ("dark",))[0]
    doc = cover.evidence([record])
    assert doc["limits"]["identityDriftMax"] == cover.IDENTITY_DRIFT_MAX
    assert doc["limits"]["textureAlignmentMin"] == cover.TEXTURE_ALIGNMENT_MIN
    measured = doc["results"][0]["metrics"]
    assert measured["identityDrift"] >= 0
    assert measured["textureAlignment"] <= 1
    assert doc["realFacesEvaluated"] == 0
    assert doc["fixture"] == "synthetic"


def test_evidence_rejects_nonfinite_identity_metrics() -> None:
    record = cover.evaluate_many([CAT.get("C08")], ("tan",))[0]
    broken = replace(record, metrics=replace(record.metrics, identity_drift=float("nan")))
    with pytest.raises(ValueError, match="finite"):
        cover.evidence([broken])


def test_evidence_rejects_nonfinite_texture_metrics() -> None:
    record = cover.evaluate_many([CAT.get("C08")], ("tan",))[0]
    broken = replace(record, metrics=replace(record.metrics, texture_alignment=float("inf")))
    with pytest.raises(ValueError, match="finite"):
        cover.evidence([broken])
